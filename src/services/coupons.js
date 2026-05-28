import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';

const COUPONS_COLLECTION = 'coupons';

/**
 * Fetch all coupons from Firestore, ordered by creation date.
 */
export async function fetchAllCoupons() {
  try {
    const q = query(collection(db, COUPONS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err) {
    console.error("Error fetching coupons:", err);
    // Fallback: without orderBy in case index doesn't exist yet
    try {
      const snapshot = await getDocs(collection(db, COUPONS_COLLECTION));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (fallbackErr) {
      console.error("Fallback fetching coupons failed:", fallbackErr);
      throw fallbackErr;
    }
  }
}

/**
 * Create or update a coupon document in Firestore.
 */
export async function createOrUpdateCoupon(couponData) {
  const code = couponData.code.trim().toUpperCase();
  const couponRef = doc(db, COUPONS_COLLECTION, code);
  
  const payload = {
    code,
    discountType: couponData.discountType, // 'percentage' | 'fixed'
    discountValue: parseFloat(couponData.discountValue),
    minPurchase: parseFloat(couponData.minPurchase) || 0,
    isActive: couponData.isActive !== false,
    usedCount: couponData.usedCount || 0,
    maxUses: couponData.maxUses ? parseInt(couponData.maxUses) : null,
    expiresAt: couponData.expiresAt ? new Date(couponData.expiresAt) : null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await setDoc(couponRef, payload, { merge: true });
  return { id: code, ...payload };
}

/**
 * Delete a coupon from Firestore.
 */
export async function deleteCoupon(code) {
  const couponRef = doc(db, COUPONS_COLLECTION, code.toUpperCase());
  await deleteDoc(couponRef);
}

/**
 * Toggle the active state of a coupon.
 */
export async function toggleCouponActive(code, isActive) {
  const couponRef = doc(db, COUPONS_COLLECTION, code.toUpperCase());
  await updateDoc(couponRef, {
    isActive,
    updatedAt: new Date()
  });
}
