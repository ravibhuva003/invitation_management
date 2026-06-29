import React, { useState, useEffect } from "react";
import { dbOperations } from "./firebase";
import Login from "./components/Login";
import DashboardStats from "./components/DashboardStats";
import Settings from "./components/Settings";
import AdminManagement from "./components/AdminManagement";
import VillageManagement from "./components/VillageManagement";
import ActivityLog from "./components/ActivityLog";
import InvitationManagement from "./components/InvitationManagement";
import { 
  LogOut, 
  Settings as SettingsIcon, 
  Plus, 
  BarChart3, 
  FileText, 
  Sun, 
  Moon,
  Database,
  MapPin,
  Users,
  History,
  Mail,
  List
} from "lucide-react";

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("crm_auth") === "true";
  });
  const [currentAdmin, setCurrentAdmin] = useState(() => {
    const saved = sessionStorage.getItem("crm_admin_profile");
    return saved ? JSON.parse(saved) : null;
  });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Active View State: 'dashboard' | 'form' | 'report' | 'settings' | 'villageManagement' | 'adminManagement' | 'activityLog'
  const [activeView, setActiveView] = useState("invitationForm");
  const [activeCategory, setActiveCategory] = useState("તમામ");
  const [headerTitle, setHeaderTitle] = useState("આમંત્રણ વ્યવસ્થા");

  const [villages, setVillages] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [invitationEntries, setInvitationEntries] = useState([]);
  const [invitationNames, setInvitationNames] = useState([]);
  
  const [dataLoading, setDataLoading] = useState(false);
  const [isFirebase, setIsFirebase] = useState(false);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("crm_theme") === "dark";
  });

  // Toasts Notifications State
  const [toasts, setToasts] = useState([]);

  // Toast Helper
  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Sync Firebase status check
  useEffect(() => {
    setIsFirebase(dbOperations.isConnected());
  }, []);

  // Theme apply
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("crm_theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("crm_theme", "light");
    }
  }, [isDarkMode]);

  // Real-Time Listeners Subscription (Shared Real-Time Sync Requirements)
  useEffect(() => {
    if (!isAuthenticated) return;

    setDataLoading(true);

    // Subscribe to villages
    const unsubscribeVillages = dbOperations.subscribeVillages((data) => {
      setVillages(data);
    });

    // Subscribe to admins
    const unsubscribeAdmins = dbOperations.subscribeAdmins((data) => {
      setAdmins(data);
    });

    // Subscribe to activity logs
    const unsubscribeLogs = dbOperations.subscribeActivityLogs((data) => {
      setActivityLogs(data);
    });

    // Subscribe to invitation entries
    const unsubscribeInvitations = dbOperations.subscribeInvitationEntries((data) => {
      setInvitationEntries(data);
      setDataLoading(false);
    });

    // Subscribe to invitation names
    const unsubscribeInvitationNames = dbOperations.subscribeInvitationNames((data) => {
      setInvitationNames(data);
    });

    return () => {
      unsubscribeVillages();
      unsubscribeAdmins();
      unsubscribeLogs();
      unsubscribeInvitations();
      unsubscribeInvitationNames();
    };
  }, [isAuthenticated]);

  // Auto Backup Logic
  useEffect(() => {
    if (!isAuthenticated || invitationEntries.length === 0) return;

    const now = Date.now();
    const lastBackupTime = parseInt(localStorage.getItem("last_auto_backup_timestamp") || "0", 10);
    const twelveHoursInMs = 12 * 60 * 60 * 1000;

    if (now - lastBackupTime >= twelveHoursInMs) {
      const backupData = {
        invitations: invitationEntries,
        cities: villages,
        exportDate: new Date().toISOString()
      };
      
      // 1. Download to Local Downloads folder
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const dateForFile = new Date().toISOString().split('T')[0];
      a.download = `CRM_AutoBackup_Raw_${dateForFile}.json`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // 2. Upload to Google Drive (if configured)
      const driveWebhook = localStorage.getItem("crm_drive_webhook");
      if (driveWebhook) {
        fetch(driveWebhook, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(backupData)
        }).then(() => {
          console.log("Auto Backup uploaded to Google Drive successfully.");
        }).catch(err => {
          console.error("Auto Backup Google Drive upload failed:", err);
        });
      }

      localStorage.setItem("last_auto_backup_timestamp", now.toString());
      console.log("Auto Backup generated at timestamp:", now);
    }
  }, [isAuthenticated, invitationEntries, villages]);

  // Handle Login
  const handleLogin = async (username, password) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const allAdmins = await dbOperations.getAdmins();
      const admin = allAdmins.find(
        (a) => a.username.toLowerCase() === username.trim().toLowerCase() && a.password === password.trim()
      );

      if (admin) {
        if (admin.isActive === false) {
          setAuthError("આ એકાઉન્ટ નિષ્ક્રિય કરેલ છે! કૃપા કરીને સુપર એડમિનનો સંપર્ક કરો.");
          showToast("આ એકાઉન્ટ નિષ્ક્રિય કરેલ છે!", "error");
          return;
        }

        sessionStorage.setItem("crm_auth", "true");
        sessionStorage.setItem("crm_admin_profile", JSON.stringify(admin));
        setCurrentAdmin(admin);
        setIsAuthenticated(true);
        await dbOperations.logActivity(admin.fullName, "લોગિન થયા");
        showToast("સફળ લોગિન! આપનું સ્વાગત છે.", "success");
      } else {
        setAuthError("ખોટો યુઝરનેમ અથવા પાસવર્ડ!");
        showToast("ખોટો યુઝરનેમ અથવા પાસવર્ડ!", "error");
      }
    } catch (err) {
      setAuthError("લોગિનમાં ભૂલ આવી: " + err.message);
      showToast("લોગિનમાં ભૂલ આવી: " + err.message, "error");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    if (currentAdmin) {
      try {
        await dbOperations.logActivity(currentAdmin.fullName, "લોગઆઉટ થયા");
      } catch (e) {
        console.error(e);
      }
    }
    sessionStorage.removeItem("crm_auth");
    sessionStorage.removeItem("crm_admin_profile");
    setCurrentAdmin(null);
    setIsAuthenticated(false);
    showToast("સફળતાપૂર્વક લોગઆઉટ થયા!", "success");
  };

  // Handle Add Village (passed to ContactForm inline popups)
  const handleAddVillage = async (villageName) => {
    const exists = villages.some(v => v.villageName.toLowerCase() === villageName.toLowerCase());
    if (exists) {
      throw new Error("આ ગામ પહેલેથી જ લિસ્ટમાં છે!");
    }
    const newVillage = await dbOperations.addVillage(villageName);
    return newVillage;
  };

  // Handle Save Invitation
  const handleSaveInvitation = async (entryData, isNew, entryId) => {
    setDataLoading(true);
    try {
      // Auto-save new names to autocomplete list
      const nameExists = invitationNames.some(n => (n.name || "").toLowerCase() === (entryData.name || "").toLowerCase());
      if (!nameExists && entryData.name) {
        await dbOperations.addInvitationName(entryData.name);
      }

      if (!isNew && entryId) {
        await dbOperations.updateInvitationEntry(entryId, entryData);
        await dbOperations.logActivity(currentAdmin?.fullName || 'Admin', `આમંત્રણ સુધાર્યું: ${entryData.name}`);
        showToast("આમંત્રણ સફળતાપૂર્વક સુધારાયો!", "success");
      } else {
        const added = await dbOperations.addInvitationEntry(entryData);
        await dbOperations.logActivity(currentAdmin?.fullName || 'Admin', `નવું આમંત્રણ ઉમેર્યું: ${added.name}`);
        showToast("નવું આમંત્રણ સફળતાપૂર્વક ઉમેરાયો!", "success");

        const webhookUrl = localStorage.getItem("crm_sheets_webhook");
        if (webhookUrl) {
          showToast("Google Sheet માં ડેટા મોકલાઈ રહ્યો છે...", "success");
          try {
             const { syncInvitationToGoogleSheet } = await import("./sheetsHelper.js");
             await syncInvitationToGoogleSheet(webhookUrl, added);
             showToast("Google Sheet માં ડેટા સફળતાપૂર્વક સિંક થયો!", "success");
          } catch (err) {
             console.error("Sheets sync failed:", err);
             showToast("Firebase માં ડેટા સેવ થયો છે, પરંતુ Google Sheet Sync નિષ્ફળ ગયો.", "error");
          }
        }
      }
    } catch (err) {
      showToast("સેવ કરવામાં ભૂલ આવી: " + err.message, "error");
    } finally {
      setDataLoading(false);
    }
  };

  const handleDeleteInvitation = async (id) => {
    setDataLoading(true);
    try {
      await dbOperations.deleteInvitationEntry(id);
      await dbOperations.logActivity(currentAdmin?.fullName || 'Admin', `આમંત્રણ ડિલીટ કર્યું`);
      showToast("આમંત્રણ સફળતાપૂર્વક ડિલીટ કરાયું!", "success");
    } catch (err) {
      showToast("ડિલીટ કરવામાં ભૂલ આવી: " + err.message, "error");
    } finally {
      setDataLoading(false);
    }
  };

  const googleSheetsViewUrl = localStorage.getItem("crm_sheets_view_link") || "";

  // Loader spinner helper
  const renderLoading = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="spinner spinner-primary"></div>
      <p style={{ marginTop: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>માહિતી લોડ થઈ રહી છે, કૃપા કરીને થોડીવાર રાહ જુઓ...</p>
    </div>
  );

  return (
    <div>
      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div>{toast.message}</div>
          </div>
        ))}
      </div>

      {!isAuthenticated ? (
        // Unauthenticated view
        <div>
          {/* Header */}
          <div className="header-bar" style={{ justifyContent: 'center' }}>
            <h1 className="header-title">સરનામા બુક CRM</h1>
          </div>
          {/* Login Card */}
          <Login 
            onLogin={handleLogin} 
            errorMsg={authError} 
            isLoading={authLoading} 
          />
        </div>
      ) : (
        // Authenticated admin view
        <div>
          {/* Header Bar matching Screenshots but supporting Multi-Admin routers */}
          <div className="header-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={20} />
              <h1 className="header-title" style={{ cursor: 'pointer' }} onClick={() => { setActiveView("dashboard"); setHeaderTitle("આમંત્રણ વ્યવસ્થા"); }}>
                {headerTitle}
              </h1>
            </div>

            <div className="header-actions">
              {/* Dark/Light mode switcher */}
              <button 
                className="btn btn-outline" 
                style={{ padding: '8px', color: 'var(--header-text)', borderColor: 'rgba(255,255,255,0.3)' }}
                onClick={() => setIsDarkMode(!isDarkMode)}
                title="ડાર્ક / લાઇટ મોડ"
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Navigation Options */}
              <button 
                className={`btn ${activeView === "dashboard" ? "btn-success" : "btn-outline"}`}
                style={{ color: activeView === "dashboard" ? "white" : "var(--header-text)", borderColor: 'rgba(255,255,255,0.3)' }}
                onClick={() => { setActiveView("dashboard"); }}
              >
                <BarChart3 size={16} /> ડેશબોર્ડ
              </button>

              <button 
                className={`btn ${activeView === "invitationReport" ? "btn-success" : "btn-outline"}`}
                style={{ color: activeView === "invitationReport" ? "white" : "var(--header-text)", borderColor: 'rgba(255,255,255,0.3)' }}
                onClick={() => { setActiveView("invitationReport"); }}
              >
                <List size={16} /> રિપોર્ટ જુઓ
              </button>

              <button 
                className={`btn ${activeView === "invitationForm" ? "btn-success" : "btn-outline"}`}
                style={{ color: activeView === "invitationForm" ? "white" : "var(--header-text)", borderColor: 'rgba(255,255,255,0.3)' }}
                onClick={() => { setActiveView("invitationForm"); setHeaderTitle("આમંત્રણ વ્યવસ્થા"); }}
              >
                <Plus size={16} /> નવું ઉમેરો
              </button>

              {/* ગામ વ્યવસ્થાપન */}
              <button 
                className={`btn ${activeView === "villageManagement" ? "btn-success" : "btn-outline"}`}
                style={{ color: activeView === "villageManagement" ? "white" : "var(--header-text)", borderColor: 'rgba(255,255,255,0.3)' }}
                onClick={() => { setActiveView("villageManagement"); setHeaderTitle("ગામ વ્યવસ્થાપન"); }}
              >
                <MapPin size={16} /> ગામ
              </button>


              {/* એડમિન વ્યવસ્થાપન (Super Admin Only) */}
              {currentAdmin?.role === "Super Admin" && (
                <button 
                  className={`btn ${activeView === "adminManagement" ? "btn-success" : "btn-outline"}`}
                  style={{ color: activeView === "adminManagement" ? "white" : "var(--header-text)", borderColor: 'rgba(255,255,255,0.3)' }}
                  onClick={() => { setActiveView("adminManagement"); setHeaderTitle("એડમિન વ્યવસ્થાપન"); }}
                >
                  <Users size={16} /> એડમિન
                </button>
              )}

              {/* એક્ટિવિટી લોગ */}
              <button 
                className={`btn ${activeView === "activityLog" ? "btn-success" : "btn-outline"}`}
                style={{ color: activeView === "activityLog" ? "white" : "var(--header-text)", borderColor: 'rgba(255,255,255,0.3)' }}
                onClick={() => { setActiveView("activityLog"); setHeaderTitle("એક્ટિવિટી લોગ"); }}
              >
                <History size={16} /> લૉગ
              </button>

              <button 
                className={`btn ${activeView === "settings" ? "btn-success" : "btn-outline"}`}
                style={{ color: activeView === "settings" ? "white" : "var(--header-text)", borderColor: 'rgba(255,255,255,0.3)' }}
                onClick={() => { setActiveView("settings"); setHeaderTitle("સેટિંગ્સ"); }}
              >
                <SettingsIcon size={16} /> સેટિંગ્સ
              </button>

              {/* Logout button */}
              <button 
                className="btn btn-danger"
                style={{ padding: '8px 12px' }}
                onClick={handleLogout}
              >
                <LogOut size={16} /> લોગઆઉટ
              </button>
            </div>
          </div>

          <div className="main-content-area" style={{ paddingTop: '12px' }}>
            {dataLoading && invitationEntries.length === 0 ? (
              renderLoading()
            ) : (
              <>
                {activeView === "dashboard" && (
                  <div style={{ padding: '0 24px' }}>
                    <DashboardStats 
                      entries={invitationEntries} 
                      cities={villages} 
                      isFirebase={isFirebase}
                    />
                  </div>
                )}

                {activeView === "villageManagement" && (
                  <div style={{ padding: '0 24px' }}>
                    <VillageManagement
                      villages={villages}
                      entries={invitationEntries}
                      currentAdmin={currentAdmin}
                      showToast={showToast}
                    />
                  </div>
                )}

                {(activeView === "invitationForm" || activeView === "invitationReport") && (
                  <InvitationManagement
                    activeView={activeView}
                    setActiveView={setActiveView}
                    setHeaderTitle={setHeaderTitle}
                    entries={invitationEntries}
                    villages={villages}
                    invitationNames={invitationNames}
                    onAddVillage={handleAddVillage}
                    onSaveInvitation={handleSaveInvitation}
                    onDeleteEntry={handleDeleteInvitation}
                    googleSheetsViewUrl={googleSheetsViewUrl}
                  />
                )}

                {activeView === "adminManagement" && currentAdmin?.role === "Super Admin" && (
                  <div style={{ padding: '0 24px' }}>
                    <AdminManagement
                      admins={admins}
                      currentAdmin={currentAdmin}
                      showToast={showToast}
                    />
                  </div>
                )}

                {activeView === "activityLog" && (
                  <div style={{ padding: '0 24px' }}>
                    <ActivityLog
                      activityLogs={activityLogs}
                    />
                  </div>
                )}

                {activeView === "settings" && (
                  <div style={{ padding: '0 24px' }}>
                    <Settings
                      showToast={showToast}
                      entries={invitationEntries}
                      cities={villages}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
