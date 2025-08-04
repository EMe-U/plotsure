// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

// Your web app's Firebase configuration
   const firebaseConfig = {
  apiKey: "AIzaSyBtJn_6IaRb6PYduCqcFfLGM7qHQ0VFLpo",
  authDomain: "plotsure-new.firebaseapp.com",
  projectId: "plotsure-new",
  storageBucket: "plotsure-new.firebasestorage.app",
  messagingSenderId: "139321271741",
  appId: "1:139321271741:web:f5d5dd910cf45cdab0ded4",
  measurementId: "G-ZX53PETH6T"
   };

   // Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Storage only if available (to avoid errors if not enabled)
let storage = null;
try {
  storage = getStorage(app);
} catch (error) {
  console.log('Storage not enabled - file uploads will be disabled');
}

// Authentication service
export const authService = {
  // Sign up new user
  async signUp(email, password, userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Save additional user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        uid: user.uid,
        email: user.email,
        created_at: new Date().toISOString(),
               is_active: true,
        verified: false,
        role: 'user'
      });
      
      return user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  // Sign in user
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  // Sign out user
  async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }
};

// Database service
export const dbService = {
  // Users collection
  users: {
    async create(userId, userData) {
      try {
        return await setDoc(doc(db, 'users', userId), userData);
      } catch (error) {
        console.error('Error creating user:', error);
        throw error;
      }
    },
    
    async get(userId) {
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
      } catch (error) {
        console.error('Error getting user:', error);
        throw error;
      }
    },
    
    async update(userId, userData) {
      try {
        return await updateDoc(doc(db, 'users', userId), userData);
      } catch (error) {
        console.error('Error updating user:', error);
        throw error;
      }
    },
    
    async getAll() {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error getting all users:', error);
        throw error;
      }
    }
  },

  // Land listings collection
  listings: {
    async create(listingData) {
      try {
        return await addDoc(collection(db, 'listings'), {
          ...listingData,
          created_at: new Date().toISOString(),
          status: 'active'
        });
      } catch (error) {
        console.error('Error creating listing:', error);
        throw error;
      }
    },
    
    async get(listingId) {
      try {
        const docRef = doc(db, 'listings', listingId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
      } catch (error) {
        console.error('Error getting listing:', error);
        throw error;
      }
    },
    
    async update(listingId, listingData) {
      try {
        return await updateDoc(doc(db, 'listings', listingId), {
          ...listingData,
          updated_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error updating listing:', error);
        throw error;
      }
    },
    
    async delete(listingId) {
      try {
        return await deleteDoc(doc(db, 'listings', listingId));
      } catch (error) {
        console.error('Error deleting listing:', error);
        throw error;
      }
    },
    
    async getAll() {
      try {
        const querySnapshot = await getDocs(collection(db, 'listings'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error getting all listings:', error);
        throw error;
      }
    },
    
    async getByOwner(ownerId) {
      try {
        const q = query(
          collection(db, 'listings'),
          where('owner_id', '==', ownerId),
          orderBy('created_at', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error getting listings by owner:', error);
        throw error;
      }
    },
    
    async search(filters) {
      try {
        let q = collection(db, 'listings');
        
        if (filters.location) {
          q = query(q, where('location', '>=', filters.location), where('location', '<=', filters.location + '\uf8ff'));
        }
        
        if (filters.minPrice) {
          q = query(q, where('price', '>=', parseInt(filters.minPrice)));
        }
        
        if (filters.maxPrice) {
          q = query(q, where('price', '<=', parseInt(filters.maxPrice)));
        }
        
        if (filters.landType) {
          q = query(q, where('land_type', '==', filters.landType));
        }
        
        q = query(q, where('status', '==', 'active'), orderBy('created_at', 'desc'));
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error searching listings:', error);
        throw error;
      }
    }
  },

  // Inquiries collection
  inquiries: {
    async create(inquiryData) {
      try {
        return await addDoc(collection(db, 'inquiries'), {
          ...inquiryData,
          created_at: new Date().toISOString(),
          status: 'pending'
        });
      } catch (error) {
        console.error('Error creating inquiry:', error);
        throw error;
      }
    },
    
    async get(inquiryId) {
      try {
        const docRef = doc(db, 'inquiries', inquiryId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
      } catch (error) {
        console.error('Error getting inquiry:', error);
        throw error;
      }
    },
    
    async update(inquiryId, inquiryData) {
      try {
        return await updateDoc(doc(db, 'inquiries', inquiryId), {
          ...inquiryData,
          updated_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error updating inquiry:', error);
        throw error;
      }
    },
    
    async getAll() {
      try {
        const querySnapshot = await getDocs(collection(db, 'inquiries'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error getting all inquiries:', error);
        throw error;
      }
    },
    
    async getByListing(listingId) {
      try {
        const q = query(
          collection(db, 'inquiries'),
          where('listing_id', '==', listingId),
          orderBy('created_at', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error getting inquiries by listing:', error);
        throw error;
      }
    },
    
    async getByUser(userId) {
      try {
        const q = query(
          collection(db, 'inquiries'),
          where('user_id', '==', userId),
          orderBy('created_at', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error getting inquiries by user:', error);
        throw error;
      }
    }
  }
};

// Storage service (with fallback for when storage is not enabled)
export const storageService = {
  async uploadFile(file, path) {
    if (!storage) {
      throw new Error('Storage is not enabled. File uploads are disabled.');
    }
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },
  
  async uploadListingImage(file, listingId) {
    const path = `listings/${listingId}/${file.name}`;
    return await this.uploadFile(file, path);
  },
  
  async uploadDocument(file, listingId) {
    const path = `documents/${listingId}/${file.name}`;
    return await this.uploadFile(file, path);
  },

  // Check if storage is available
  isStorageAvailable() {
    return storage !== null;
  }
};

console.log('Firebase configuration loaded successfully');
if (!storage) {
  console.log('Note: Storage is not enabled - file uploads will be disabled');
}