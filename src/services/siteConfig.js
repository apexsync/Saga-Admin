import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const CONFIG_COLLECTION = 'site_config';
const FESTIVE_EDIT_DOC = 'festive_edit';

/**
 * Fetch the current festive edit configuration
 */
export async function fetchFestiveConfig() {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, FESTIVE_EDIT_DOC);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching festive config:", error);
    throw error;
  }
}

/**
 * Update the festive edit configuration
 * @param {Object} config - The full configuration object
 */
export async function updateFestiveConfig(config) {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, FESTIVE_EDIT_DOC);
    await setDoc(docRef, config, { merge: true });
    return true;
  } catch (error) {
    console.error("Error updating festive config:", error);
    throw error;
  }
}
