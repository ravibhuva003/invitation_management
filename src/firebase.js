import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc, 
  getDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch
} from "firebase/firestore";

// Helper to load firebase configuration from localStorage
export const getSavedFirebaseConfig = () => {
  try {
    const config = localStorage.getItem("crm_firebase_config");
    return config ? JSON.parse(config) : null;
  } catch (e) {
    console.error("Error reading Firebase config from localStorage:", e);
    return null;
  }
};

// Save config to localStorage
export const saveFirebaseConfig = (config) => {
  if (!config) {
    localStorage.removeItem("crm_firebase_config");
  } else {
    localStorage.setItem("crm_firebase_config", JSON.stringify(config));
  }
};

// Initialize Firebase if config exists
let app = null;
let db = null;
let isFirebaseConnected = false;

const config = getSavedFirebaseConfig();
if (config && config.apiKey && config.projectId) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }
    db = getFirestore(app);
    isFirebaseConnected = true;
    console.log("Firebase initialized successfully.");
  } catch (err) {
    console.error("Firebase initialization failed:", err);
  }
}

export { isFirebaseConnected, db };

// Fallback Local Database in case Firebase is not connected (Demo Mode)
const getLocalData = (key, defaultData = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultData;
  } catch (e) {
    return defaultData;
  }
};

const setLocalData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
  // Trigger storage event manually for same-page listeners
  window.dispatchEvent(new Event('storage'));
};

// Mock listeners registry for Local Storage Cross-Tab Syncing
const localListeners = {
  contacts: [],
  villages: [],
  admins: [],
  activityLogs: [],
  invitationEntries: [],
  invitationNames: []
};

// Setup storage event listener for same/other tabs sync in Demo Mode
if (typeof window !== "undefined") {
  window.addEventListener("storage", () => {
    // Notify contacts
    localListeners.contacts.forEach(cb => cb(getLocalData("crm_local_contacts")));
    // Notify villages
    localListeners.villages.forEach(cb => cb(getLocalData("crm_local_villages")));
    // Notify admins
    localListeners.admins.forEach(cb => cb(getLocalData("crm_local_admins")));
    // Notify logs
    localListeners.activityLogs.forEach(cb => cb(getLocalData("crm_local_logs")));
    // Notify invitations
    localListeners.invitationEntries.forEach(cb => cb(getLocalData("crm_local_invitations")));
    localListeners.invitationNames.forEach(cb => cb(getLocalData("crm_local_invitation_names")));
  });
}

// Database CRUD Operations Wrapper (Firebase/LocalStorage Adapter)
export const dbOperations = {
  // Check if connected
  isConnected: () => isFirebaseConnected,

  // --- VILLAGES ---
  getVillages: async () => {
    if (isFirebaseConnected && db) {
      try {
        const querySnapshot = await getDocs(collection(db, "villages"));
        const villagesList = [];
        querySnapshot.forEach((doc) => {
          villagesList.push({ id: doc.id, ...doc.data() });
        });
        return villagesList.sort((a, b) => (a.villageName || "").localeCompare(b.villageName || "", 'gu'));
      } catch (err) {
        console.error("Firestore getVillages error, falling back to local:", err);
      }
    }
    // Fallback
    const localVillages = getLocalData("crm_local_villages", [
      { id: "1", villageName: "અમદાવાદ", createdAt: new Date().toISOString() },
      { id: "2", villageName: "સુરત", createdAt: new Date().toISOString() },
      { id: "3", villageName: "રાજકોટ", createdAt: new Date().toISOString() },
      { id: "4", villageName: "વડોદરા", createdAt: new Date().toISOString() },
      { id: "5", villageName: "ભાવનગર", createdAt: new Date().toISOString() },
      { id: "6", villageName: "જામનગર", createdAt: new Date().toISOString() },
      { id: "7", villageName: "જૂનાગઢ", createdAt: new Date().toISOString() }
    ]);
    return localVillages.sort((a, b) => (a.villageName || "").localeCompare(b.villageName || "", 'gu'));
  },

  addVillage: async (villageName) => {
    const newVillage = {
      villageName: villageName,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConnected && db) {
      try {
        const docRef = await addDoc(collection(db, "villages"), newVillage);
        return { id: docRef.id, ...newVillage };
      } catch (err) {
        console.error("Firestore addVillage error:", err);
      }
    }

    const localVillages = getLocalData("crm_local_villages", []);
    const village = { id: Date.now().toString(), ...newVillage };
    localVillages.push(village);
    setLocalData("crm_local_villages", localVillages);
    return village;
  },

  updateVillage: async (id, villageName) => {
    const updateData = { villageName };
    if (isFirebaseConnected && db) {
      try {
        const docRef = doc(db, "villages", id);
        await updateDoc(docRef, updateData);
        return { id, villageName };
      } catch (err) {
        console.error("Firestore updateVillage error:", err);
      }
    }

    const localVillages = getLocalData("crm_local_villages", []);
    const idx = localVillages.findIndex(v => v.id === id);
    if (idx !== -1) {
      localVillages[idx] = { ...localVillages[idx], villageName };
      setLocalData("crm_local_villages", localVillages);
      return localVillages[idx];
    }
    throw new Error("Village not found");
  },

  deleteVillage: async (id) => {
    if (isFirebaseConnected && db) {
      try {
        const docRef = doc(db, "villages", id);
        await deleteDoc(docRef);
        return id;
      } catch (err) {
        console.error("Firestore deleteVillage error:", err);
      }
    }

    const localVillages = getLocalData("crm_local_villages", []);
    const filtered = localVillages.filter(v => v.id !== id);
    setLocalData("crm_local_villages", filtered);
    return id;
  },

  subscribeVillages: (onUpdate) => {
    if (isFirebaseConnected && db) {
      const q = query(collection(db, "villages"));
      return onSnapshot(q, (snapshot) => {
        const villagesList = [];
        snapshot.forEach((doc) => {
          villagesList.push({ id: doc.id, ...doc.data() });
        });
        // Sort by Gujarati alphabet
        villagesList.sort((a, b) => (a.villageName || "").localeCompare(b.villageName || "", 'gu'));
        onUpdate(villagesList);
      }, (err) => {
        console.error("subscribeVillages error:", err);
      });
    }

    // Local subscription
    localListeners.villages.push(onUpdate);
    dbOperations.getVillages().then(onUpdate);
    return () => {
      localListeners.villages = localListeners.villages.filter(cb => cb !== onUpdate);
    };
  },



  // --- MULTI-ADMIN ACCOUNTS ---
  getAdmins: async () => {
    if (isFirebaseConnected && db) {
      try {
        const querySnapshot = await getDocs(collection(db, "admins"));
        const adminsList = [];
        querySnapshot.forEach((doc) => {
          adminsList.push({ id: doc.id, ...doc.data() });
        });
        return adminsList;
      } catch (err) {
        console.error("Firestore getAdmins error:", err);
      }
    }
    // Fallback seed admin locally if empty
    const localAdmins = getLocalData("crm_local_admins", []);
    if (localAdmins.length === 0) {
      const defaultAdmin = {
        id: "1",
        fullName: "Super Admin",
        username: "admin",
        email: "admin@crm.com",
        password: "admin123",
        role: "Super Admin",
        isActive: true,
        createdAt: new Date().toISOString()
      };
      setLocalData("crm_local_admins", [defaultAdmin]);
      return [defaultAdmin];
    }
    return localAdmins;
  },

  addAdmin: async (adminData) => {
    const admin = {
      ...adminData,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConnected && db) {
      try {
        const docRef = await addDoc(collection(db, "admins"), admin);
        return { id: docRef.id, ...admin };
      } catch (err) {
        console.error("Firestore addAdmin error:", err);
      }
    }

    const localAdmins = getLocalData("crm_local_admins", []);
    const newAdmin = { id: Date.now().toString(), ...admin };
    localAdmins.push(newAdmin);
    setLocalData("crm_local_admins", localAdmins);
    return newAdmin;
  },

  updateAdmin: async (id, adminData) => {
    if (isFirebaseConnected && db) {
      try {
        const docRef = doc(db, "admins", id);
        await updateDoc(docRef, adminData);
        return { id, ...adminData };
      } catch (err) {
        console.error("Firestore updateAdmin error:", err);
      }
    }

    const localAdmins = getLocalData("crm_local_admins", []);
    const idx = localAdmins.findIndex(a => a.id === id);
    if (idx !== -1) {
      localAdmins[idx] = { ...localAdmins[idx], ...adminData };
      setLocalData("crm_local_admins", localAdmins);
      return localAdmins[idx];
    }
    throw new Error("Admin profile not found");
  },

  deleteAdmin: async (id) => {
    if (isFirebaseConnected && db) {
      try {
        const docRef = doc(db, "admins", id);
        await deleteDoc(docRef);
        return id;
      } catch (err) {
        console.error("Firestore deleteAdmin error:", err);
      }
    }

    const localAdmins = getLocalData("crm_local_admins", []);
    const filtered = localAdmins.filter(a => a.id !== id);
    setLocalData("crm_local_admins", filtered);
    return id;
  },

  subscribeAdmins: (onUpdate) => {
    if (isFirebaseConnected && db) {
      const q = query(collection(db, "admins"));
      return onSnapshot(q, (snapshot) => {
        const adminsList = [];
        snapshot.forEach((doc) => {
          adminsList.push({ id: doc.id, ...doc.data() });
        });
        onUpdate(adminsList);
      }, (err) => {
        console.error("subscribeAdmins error:", err);
      });
    }

    localListeners.admins.push(onUpdate);
    dbOperations.getAdmins().then(onUpdate);
    return () => {
      localListeners.admins = localListeners.admins.filter(cb => cb !== onUpdate);
    };
  },

  // Seed default admin in Firebase if none exists
  seedDefaultAdminIfNeeded: async () => {
    if (isFirebaseConnected && db) {
      try {
        const querySnapshot = await getDocs(collection(db, "admins"));
        if (querySnapshot.empty) {
          await addDoc(collection(db, "admins"), {
            fullName: "Super Admin",
            username: "admin",
            email: "admin@crm.com",
            password: "admin123",
            role: "Super Admin",
            isActive: true,
            createdAt: new Date().toISOString()
          });
          console.log("Firebase default Super Admin seeded successfully.");
        }
      } catch (err) {
        console.error("Error seeding default admin in Firebase:", err);
      }
    }
  },

  // --- ACTIVITY LOGS ---
  getActivityLogs: async () => {
    if (isFirebaseConnected && db) {
      try {
        const q = query(collection(db, "activityLogs"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const logsList = [];
        querySnapshot.forEach((doc) => {
          logsList.push({ id: doc.id, ...doc.data() });
        });
        return logsList;
      } catch (err) {
        console.error("Firestore getActivityLogs error, sorting on client:", err);
      }
    }
    return getLocalData("crm_local_logs", []).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },

  logActivity: async (adminName, actionDescription) => {
    const newLog = {
      adminName: adminName,
      action: actionDescription,
      timestamp: new Date().toISOString()
    };

    if (isFirebaseConnected && db) {
      try {
        await addDoc(collection(db, "activityLogs"), newLog);
        return;
      } catch (err) {
        console.error("Firestore logActivity error:", err);
      }
    }

    const localLogs = getLocalData("crm_local_logs", []);
    localLogs.unshift({ id: Date.now().toString(), ...newLog });
    setLocalData("crm_local_logs", localLogs);
  },

  subscribeActivityLogs: (onUpdate) => {
    if (isFirebaseConnected && db) {
      const q = query(collection(db, "activityLogs"), orderBy("timestamp", "desc"));
      return onSnapshot(q, (snapshot) => {
        const logsList = [];
        snapshot.forEach((doc) => {
          logsList.push({ id: doc.id, ...doc.data() });
        });
        onUpdate(logsList);
      }, (err) => {
        console.error("subscribeActivityLogs error:", err);
      });
    }

    localListeners.activityLogs.push(onUpdate);
    dbOperations.getActivityLogs().then(onUpdate);
    return () => {
      localListeners.activityLogs = localListeners.activityLogs.filter(cb => cb !== onUpdate);
    };
  },

  // --- INVITATION NAMES (Autocomplete) ---
  getInvitationNames: async () => {
    if (isFirebaseConnected && db) {
      try {
        const querySnapshot = await getDocs(collection(db, "invitation_names"));
        const namesList = [];
        querySnapshot.forEach((doc) => {
          namesList.push({ id: doc.id, ...doc.data() });
        });
        return namesList.sort((a, b) => (a.name || "").localeCompare(b.name || "", 'gu'));
      } catch (err) {
        console.error("Firestore getInvitationNames error:", err);
      }
    }
    const localNames = getLocalData("crm_local_invitation_names", []);
    return localNames.sort((a, b) => (a.name || "").localeCompare(b.name || "", 'gu'));
  },

  addInvitationName: async (name) => {
    const newName = {
      name: name,
      createdAt: new Date().toISOString()
    };
    if (isFirebaseConnected && db) {
      try {
        const docRef = await addDoc(collection(db, "invitation_names"), newName);
        return { id: docRef.id, ...newName };
      } catch (err) {
        console.error("Firestore addInvitationName error:", err);
      }
    }
    const localNames = getLocalData("crm_local_invitation_names", []);
    const savedName = { id: Date.now().toString(), ...newName };
    localNames.push(savedName);
    setLocalData("crm_local_invitation_names", localNames);
    return savedName;
  },

  subscribeInvitationNames: (onUpdate) => {
    if (isFirebaseConnected && db) {
      const q = query(collection(db, "invitation_names"));
      return onSnapshot(q, (snapshot) => {
        const namesList = [];
        snapshot.forEach((doc) => {
          namesList.push({ id: doc.id, ...doc.data() });
        });
        namesList.sort((a, b) => (a.name || "").localeCompare(b.name || "", 'gu'));
        onUpdate(namesList);
      }, (err) => {
        console.error("subscribeInvitationNames error:", err);
      });
    }

    localListeners.invitationNames.push(onUpdate);
    dbOperations.getInvitationNames().then(onUpdate);
    return () => {
      localListeners.invitationNames = localListeners.invitationNames.filter(cb => cb !== onUpdate);
    };
  },

  // --- INVITATION ENTRIES ---
  getInvitationEntries: async () => {
    if (isFirebaseConnected && db) {
      try {
        const querySnapshot = await getDocs(collection(db, "invitation_entries"));
        const entriesList = [];
        querySnapshot.forEach((doc) => {
          entriesList.push({ id: doc.id, ...doc.data() });
        });
        return entriesList;
      } catch (err) {
        console.error("Firestore getInvitationEntries error:", err);
      }
    }
    return getLocalData("crm_local_invitations", []);
  },

  addInvitationEntry: async (entryData) => {
    const entry = {
      ...entryData,
      createdAt: entryData.createdAt || new Date().toISOString()
    };

    if (isFirebaseConnected && db) {
      try {
        const docRef = await addDoc(collection(db, "invitation_entries"), entry);
        return { id: docRef.id, ...entry };
      } catch (err) {
        console.error("Firestore addInvitationEntry error:", err);
      }
    }

    const localEntries = getLocalData("crm_local_invitations", []);
    const newEntry = { id: Date.now().toString(), ...entry };
    localEntries.push(newEntry);
    setLocalData("crm_local_invitations", localEntries);
    return newEntry;
  },

  updateInvitationEntry: async (id, entryData) => {
    if (isFirebaseConnected && db) {
      try {
        const docRef = doc(db, "invitation_entries", id);
        await updateDoc(docRef, entryData);
        return { id, ...entryData };
      } catch (err) {
        console.error("Firestore updateInvitationEntry error:", err);
      }
    }

    const localEntries = getLocalData("crm_local_invitations", []);
    const index = localEntries.findIndex(c => c.id === id);
    if (index !== -1) {
      localEntries[index] = { ...localEntries[index], ...entryData };
      setLocalData("crm_local_invitations", localEntries);
      return localEntries[index];
    }
    throw new Error("Invitation Entry not found for update");
  },

  deleteInvitationEntry: async (id) => {
    if (isFirebaseConnected && db) {
      try {
        const docRef = doc(db, "invitation_entries", id);
        await deleteDoc(docRef);
        return id;
      } catch (err) {
        console.error("Firestore deleteInvitationEntry error:", err);
      }
    }

    const localEntries = getLocalData("crm_local_invitations", []);
    const filtered = localEntries.filter(c => c.id !== id);
    setLocalData("crm_local_invitations", filtered);
    return id;
  },

  subscribeInvitationEntries: (onUpdate) => {
    if (isFirebaseConnected && db) {
      const q = query(collection(db, "invitation_entries"));
      return onSnapshot(q, (snapshot) => {
        const entriesList = [];
        snapshot.forEach((doc) => {
          entriesList.push({ id: doc.id, ...doc.data() });
        });
        onUpdate(entriesList);
      }, (err) => {
        console.error("subscribeInvitationEntries error:", err);
      });
    }

    localListeners.invitationEntries.push(onUpdate);
    dbOperations.getInvitationEntries().then(onUpdate);
    return () => {
      localListeners.invitationEntries = localListeners.invitationEntries.filter(cb => cb !== onUpdate);
    };
  },

  restoreDatabase: async (backupData) => {
    const { invitations, cities } = backupData;
    if (!invitations && !cities) {
      throw new Error("Invalid backup data format");
    }

    if (isFirebaseConnected && db) {
      // Restore to Firebase
      // Delete existing invitations
      const invSnapshot = await getDocs(collection(db, "invitation_entries"));
      const batchDeleteInv = writeBatch(db);
      invSnapshot.docs.forEach((docSnap) => {
        batchDeleteInv.delete(docSnap.ref);
      });
      await batchDeleteInv.commit();

      // Delete existing villages (cities)
      const vilSnapshot = await getDocs(collection(db, "villages"));
      const batchDeleteVil = writeBatch(db);
      vilSnapshot.docs.forEach((docSnap) => {
        batchDeleteVil.delete(docSnap.ref);
      });
      await batchDeleteVil.commit();

      // Insert new invitations
      if (invitations && invitations.length > 0) {
        const batchInsertInv = writeBatch(db);
        invitations.forEach(inv => {
          // Exclude id from the object itself when writing to doc, or let firestore generate ID
          const newDocRef = doc(collection(db, "invitation_entries"));
          batchInsertInv.set(newDocRef, inv);
        });
        await batchInsertInv.commit();
      }

      // Insert new villages
      if (cities && cities.length > 0) {
        const batchInsertVil = writeBatch(db);
        cities.forEach(vil => {
          const newDocRef = doc(collection(db, "villages"));
          batchInsertVil.set(newDocRef, vil);
        });
        await batchInsertVil.commit();
      }
      
      await dbOperations.logActivity("System", "Database restored from JSON backup (Firebase)");
      return true;
    } else {
      // Restore locally
      if (invitations) setLocalData("crm_local_invitations", invitations);
      if (cities) setLocalData("crm_local_villages", cities);
      
      const newLog = {
        id: Date.now().toString(),
        adminName: "System",
        action: "Database restored from JSON backup (Local)",
        timestamp: new Date().toISOString()
      };
      const localLogs = getLocalData("crm_local_logs", []);
      localLogs.unshift(newLog);
      setLocalData("crm_local_logs", localLogs);
      
      // Notify listeners
      if (invitations) localListeners.invitationEntries.forEach(cb => cb(invitations));
      if (cities) localListeners.villages.forEach(cb => cb(cities));
      
      return true;
    }
  }
};

// Auto seed default admin in background
dbOperations.seedDefaultAdminIfNeeded().catch(console.error);
