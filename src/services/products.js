/**
 * Admin Product Service
 * 
 * Full CRUD operations for product management.
 * This is the WRITE service — only used by the admin app.
 */

import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

const PRODUCTS_COLLECTION = 'products';

/**
 * Fetch all products (for admin dashboard)
 */
export async function fetchAllProducts() {
  try {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

/**
 * Add a new product
 * @param {Object} product - { name, price, category, description, imageUrl }
 */
export async function addProduct(product) {
  try {
    const dataToSave = {
      ...product,
      price: Number(product.price),
      stock: product.stock ? Number(product.stock) : 0,
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), dataToSave);
    return { id: docRef.id, ...dataToSave };
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
}

/**
 * Update an existing product
 * @param {string} productId
 * @param {Object} updates - fields to update
 */
export async function updateProduct(productId, updates) {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    const cleanUpdates = { ...updates };
    if (cleanUpdates.price) cleanUpdates.price = Number(cleanUpdates.price);
    delete cleanUpdates.id; // Don't store id as a field
    delete cleanUpdates.createdAt; // Don't overwrite timestamp
    
    await updateDoc(docRef, cleanUpdates);
    return { id: productId, ...cleanUpdates };
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

/**
 * Delete a product
 * @param {string} productId
 */
export async function deleteProduct(productId) {
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
    return true;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

/**
 * Fetch a single product by ID
 * @param {string} productId
 */
export async function fetchProductById(productId) {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}
