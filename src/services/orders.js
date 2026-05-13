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

const ORDERS_COLLECTION = 'orders';

/**
 * Fetch all orders for admin
 */
export async function fetchAllOrders() {
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
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

/**
 * Update order status and tracking info
 * @param {string} orderId 
 * @param {Object} updates - { status, trackingId, courier }
 */
export async function updateOrderStatus(orderId, updates) {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
}

/**
 * Generate and download shipping label from backend
 * @param {string} awb - The AWB/tracking number
 * @param {string} labelCode - e.g., 'SHIP_LABEL_4X6', 'SHIP_LABEL_A4'
 */
export async function generateShippingLabel(awb, labelCode = 'SHIP_LABEL_4X6') {
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const url = `${BACKEND_URL}/generate-label?awb=${awb}&label_code=${labelCode}&label_format=pdf`;
    
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
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const response = await fetch(`${BACKEND_URL}/cancel-consignment`, {
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
