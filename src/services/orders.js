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
