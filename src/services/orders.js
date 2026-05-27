/**
 * Admin Order Service
 * 
 * Handles fetching and updating orders.
 */

import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const ORDERS_COLLECTION = 'orders';

/**
 * Fetch all orders for admin via backend
 */
export async function fetchAllOrders() {
  try {
    const response = await fetch(`${BACKEND_URL}/admin/orders`);
    if (!response.ok) throw new Error('Failed to fetch orders');
    
    const orders = await response.json();
    return orders.map(order => ({
      ...order,
      createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
    }));
  } catch (error) {
    console.error("Error fetching orders:", error);
    // Fallback to Firestore direct read if backend is down
    try {
        const q = query(
          collection(db, ORDERS_COLLECTION),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));
    } catch {
        return [];
    }
  }
}

/**
 * Update order status and tracking info via backend
 * @param {string} orderId 
 * @param {Object} updates - { status, trackingId, courier }
 */
export async function updateOrderStatus(orderId, updates) {
  try {
    const response = await fetch(`${BACKEND_URL}/update-order-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        orderId, 
        status: updates.status,
        ...updates // Pass other updates if the backend supports them
      }),
    });

    if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update order status');
    }

    return true;
  } catch (error) {
    console.error("Error updating order:", error);
    // Fallback to direct Firestore update
    try {
        const docRef = doc(db, ORDERS_COLLECTION, orderId);
        await updateDoc(docRef, {
          ...updates,
          updatedAt: new Date()
        });
        return true;
    } catch (e) {
        throw error;
    }
  }
}

/**
 * Generate and download shipping label from backend
 * @param {string} awb - The AWB/tracking number
 * @param {string} labelCode - e.g., 'SHIP_LABEL_4X6', 'SHIP_LABEL_A4'
 */
export async function generateShippingLabel(awb, labelCode = 'SHIP_LABEL_4X6') {
  try {
    const DELIVERY_BACKEND_URL = import.meta.env.VITE_DELIVERY_BACKEND_URL || 'http://localhost:5001';
    const url = `${DELIVERY_BACKEND_URL}/generate-label?awb=${awb}&label_code=${labelCode}&label_format=pdf`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to generate shipping label');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `Label_${awb}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
    
    return true;
  } catch (error) {
    console.error("Error generating label:", error);
    throw error;
  }
}

/**
 * Cancel consignment in DTDC system via backend
 * @param {string} awb - The AWB/tracking number
 */
export async function cancelConsignment(awb) {
  try {
    const DELIVERY_BACKEND_URL = import.meta.env.VITE_DELIVERY_BACKEND_URL || 'http://localhost:5001';
    const response = await fetch(`${DELIVERY_BACKEND_URL}/cancel-consignment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ awb }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to cancel consignment');
    }

    return result;
  } catch (error) {
    console.error("Error calling cancelConsignment:", error);
    throw error;
  }
}

/**
 * Issue a refund for a payment via backend
 * @param {string} paymentId - The Razorpay payment ID
 * @param {number} amount - Optional amount in rupees
 */
export async function refundPayment(paymentId, amount = null) {
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const response = await fetch(`${BACKEND_URL}/refund-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentId, amount }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to issue refund');
    }

    return result;
  } catch (error) {
    console.error("Error calling refundPayment:", error);
    throw error;
  }
}
