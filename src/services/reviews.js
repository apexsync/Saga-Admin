/**
 * Admin Review Service
 * 
 * Handles reading and deleting product reviews in the Admin app.
 */

import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

const REVIEWS_COLLECTION = 'reviews';

/**
 * Fetch all reviews across all products
 */
export async function fetchAllReviews() {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));
  } catch (error) {
    console.error("Error fetching all reviews:", error);
    return [];
  }
}

/**
 * Delete a review
 * @param {string} reviewId
 */
export async function deleteReview(reviewId) {
  try {
    await deleteDoc(doc(db, REVIEWS_COLLECTION, reviewId));
    return true;
  } catch (error) {
    console.error("Error deleting review:", error);
    throw error;
  }
}

/**
 * Fetch reviews for a specific product
 * @param {string} productId
 */
export async function fetchReviewsByProductId(productId) {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return [];
  }
}

/**
 * Add or update an admin reply to a review
 * @param {string} reviewId
 * @param {string} replyText
 */
export async function respondToReview(reviewId, replyText) {
  try {
    const docRef = doc(db, REVIEWS_COLLECTION, reviewId);
    await updateDoc(docRef, {
      adminReply: replyText,
      repliedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error responding to review:", error);
    throw error;
  }
}
