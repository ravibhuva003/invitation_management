import React, { useState, useEffect } from "react";
import { Save, Key, Database, RefreshCw, FileText, Download } from "lucide-react";
import { getSavedFirebaseConfig, saveFirebaseConfig, dbOperations } from "../firebase";

export default function Settings({ onUpdateCreds, showToast, entries, cities }) {
  // Credentials change state
  const [adminUsername, setAdminUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Firebase Config State
  const [fbApiKey, setFbApiKey] = useState("");
  const [fbAuthDomain, setFbAuthDomain] = useState("");
  const [fbProjectId, setFbProjectId] = useState("");
  const [fbStorageBucket, setFbStorageBucket] = useState("");
  const [fbMessagingSenderId, setFbMessagingSenderId] = useState("");
  const [fbAppId, setFbAppId] = useState("");

  // Webhook URLs state
  const [sheetWebhook, setSheetWebhook] = useState("");
  const [sheetViewLink, setSheetViewLink] = useState("");
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    // Load config on mount
    const config = getSavedFirebaseConfig() || {};
    setFbApiKey(config.apiKey || "");
    setFbAuthDomain(config.authDomain || "");
    setFbProjectId(config.projectId || "");
    setFbStorageBucket(config.storageBucket || "");
    setFbMessagingSenderId(config.messagingSenderId || "");
    setFbAppId(config.appId || "");

    // Load sheets urls
    setSheetWebhook(localStorage.getItem("crm_sheets_webhook") || "");
    setSheetViewLink(localStorage.getItem("crm_sheets_view_link") || "");

    // Load admin username
    const fetchCreds = async () => {
      const creds = await dbOperations.getAdminCredentials();
      setAdminUsername(creds.username || "admin");
    };
    fetchCreds().catch(console.error);
  }, []);

  // Update Credentials
  const handleUpdateCreds = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("નવો પાસવર્ડ અને કન્ફર્મ પાસવર્ડ મેચ થતા નથી!", "error");
      return;
    }

    try {
      const currentCreds = await dbOperations.getAdminCredentials();
      if (currentPassword !== currentCreds.password) {
        showToast("વર્તમાન પાસવર્ડ ખોટો છે!", "error");
        return;
      }

      await dbOperations.updateAdminCredentials(adminUsername, newPassword);
      showToast("એડમિન ક્રેડેન્શિયલ્સ સફળતાપૂર્વક અપડેટ થયા!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showToast("અપડેટ કરવામાં ભૂલ આવી: " + err.message, "error");
    }
  };

  // Save Firebase settings
  const handleSaveFirebase = (e) => {
    e.preventDefault();
    const config = {
      apiKey: fbApiKey.trim(),
      authDomain: fbAuthDomain.trim(),
      projectId: fbProjectId.trim(),
      storageBucket: fbStorageBucket.trim(),
      messagingSenderId: fbMessagingSenderId.trim(),
      appId: fbAppId.trim()
    };

    saveFirebaseConfig(config);
    showToast("Firebase કન્ફિગરેશન સેવ થયું! ફેરફારો લાગુ કરવા પેજ રીલોડ કરો.", "success");
  };

  // Save sheets settings
  const handleSaveSheets = (e) => {
    e.preventDefault();
    const url = sheetWebhook.trim();
    
    if (url) {
      const isDeployedUrl = url.startsWith("https://script.google.com/macros/s/") && (url.endsWith("/exec") || url.endsWith("/exec/"));
      const isEditorUrl = url.includes("/home/projects/") || url.includes("/u/0/home/projects/");
      
      if (!isDeployedUrl || isEditorUrl) {
        showToast("કૃપા કરીને Deploy કરેલ Apps Script Webhook URL દાખલ કરો.", "error");
        return;
      }
    }
    
    localStorage.setItem("crm_sheets_webhook", url);
    localStorage.setItem("crm_sheets_view_link", sheetViewLink.trim());
    showToast("Google Sheets કનેક્શન સેવ થયું!", "success");
  };

  // Test connection to Google Sheets
  const handleTestConnection = async () => {
    const url = sheetWebhook.trim();
    if (!url) {
      showToast("કૃપા કરીને પહેલા Webhook URL દાખલ કરો!", "error");
      return;
    }

    const isDeployedUrl = url.startsWith("https://script.google.com/macros/s/") && (url.endsWith("/exec") || url.endsWith("/exec/"));
    const isEditorUrl = url.includes("/home/projects/") || url.includes("/u/0/home/projects/");
    
    if (!isDeployedUrl || isEditorUrl) {
      showToast("કૃપા કરીને Deploy કરેલ Apps Script Webhook URL દાખલ કરો.", "error");
      return;
    }

    setIsTestingConnection(true);
    try {
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          test: true,
          message: "Connection Test"
        })
      });
      showToast("✅ Google Sheet Connected", "success");
    } catch (err) {
      console.error("Test connection failed:", err);
      showToast("❌ Connection Failed", "error");
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Backup data
  const handleBackupDownload = () => {
    try {
      const formattedEntries = (entries || []).map(entry => {
        const cats = entry.categories || {};
        
        const totalEvening = 
          (Number(cats.vyavahar?.evening_29) || 0) + 
          (Number(cats.two_person?.evening_29) || 0) + 
          (Number(cats.one_person?.evening_29) || 0) + 
          (Number(cats.digital?.evening_29) || 0);

        const totalMorning = 
          (Number(cats.vyavahar?.morning_30) || 0) + 
          (Number(cats.two_person?.morning_30) || 0) + 
          (Number(cats.one_person?.morning_30) || 0) + 
          (Number(cats.digital?.morning_30) || 0);

        const totalAfternoon = 
          (Number(cats.vyavahar?.afternoon_30) || 0) + 
          (Number(cats.two_person?.afternoon_30) || 0) + 
          (Number(cats.one_person?.afternoon_30) || 0) + 
          (Number(cats.digital?.afternoon_30) || 0);

        return {
          "નામ": entry.name || "",
          "ગામ": entry.village || "",
          "મોબાઈલ નંબર": entry.mobile || "",
          "નોંધ": entry.notes || "",
          "વ્યવહારવાળી યાદી": cats.vyavahar?.enabled ? "હા" : "ના",
          "બે વ્યક્તિ જોડે": cats.two_person?.enabled ? "હા" : "ના",
          "એક વ્યક્તિ": cats.one_person?.enabled ? "હા" : "ના",
          "ડિજિટલ આમંત્રણ": cats.digital?.enabled ? "હા" : "ના",
          "29/8 સાંજે": totalEvening || 0,
          "30/8 સવારે": totalMorning || 0,
          "30/8 બપોરે": totalAfternoon || 0
        };
      });

      const backupData = {
        invitations: formattedEntries,
        cities,
        exportDate: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CRM_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("બેકઅપ ફાઇલ સફળતાપૂર્વક ડાઉનલોડ થઈ!", "success");
    } catch (err) {
      showToast("બેકઅપ લેવામાં ભૂલ આવી: " + err.message, "error");
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* 🔐 credentials Section */}
      <div className="settings-section">
        <h2>
          <Key size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          એડમિન લૉગિન અને પાસવર્ડ બદલો
        </h2>
        <form onSubmit={handleUpdateCreds}>
          <div className="form-group">
            <label className="form-label">યુઝરનેમ</label>
            <input
              type="text"
              className="form-input"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">વર્તમાન પાસવર્ડ</label>
            <input
              type="password"
              className="form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="વર્તમાન પાસવર્ડ દાખલ કરો"
            />
          </div>
          <div className="form-group">
            <label className="form-label">નવો પાસવર્ડ</label>
            <input
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="નવો પાસવર્ડ દાખલ કરો"
            />
          </div>
          <div className="form-group">
            <label className="form-label">કન્ફર્મ નવો પાસવર્ડ</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="નવો પાસવર્ડ ફરી દાખલ કરો"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> પાસવર્ડ અપડેટ કરો
            </button>
          </div>
        </form>
      </div>

      {/* ☁️ Google Sheets API Integration Webhook */}
      <div className="settings-section">
        <h2>
          <FileText size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Google Sheet કનેક્શન (રીઅલ-ટાઇમ સિંક)
        </h2>
        <form onSubmit={handleSaveSheets}>
          <div className="form-group">
            <label className="form-label">Apps Script Webhook URL</label>
            <input
              type="url"
              className="form-input"
              value={sheetWebhook}
              onChange={(e) => setSheetWebhook(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Spreadsheet View Link</label>
            <input
              type="url"
              className="form-input"
              value={sheetViewLink}
              onChange={(e) => setSheetViewLink(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/.../edit"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={handleTestConnection}
              disabled={isTestingConnection}
            >
              {isTestingConnection ? <div className="spinner spinner-primary" style={{ width: '14px', height: '14px', margin: 0 }}></div> : "કનેક્શન ચેક કરો"}
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> સેવ કરો
            </button>
          </div>
        </form>
      </div>

      {/* 🔥 Firebase Connection Section */}
      <div className="settings-section">
        <h2>
          <Database size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Firebase ડેટાબેઝ કનેક્શન સેટિંગ્સ
        </h2>
        <form onSubmit={handleSaveFirebase}>
          <div className="form-group">
            <label className="form-label">API Key</label>
            <input
              type="text"
              className="form-input"
              value={fbApiKey}
              onChange={(e) => setFbApiKey(e.target.value)}
              placeholder="AIzaSy..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Auth Domain</label>
            <input
              type="text"
              className="form-input"
              value={fbAuthDomain}
              onChange={(e) => setFbAuthDomain(e.target.value)}
              placeholder="project-id.firebaseapp.com"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Project ID</label>
            <input
              type="text"
              className="form-input"
              value={fbProjectId}
              onChange={(e) => setFbProjectId(e.target.value)}
              placeholder="project-id"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Storage Bucket</label>
            <input
              type="text"
              className="form-input"
              value={fbStorageBucket}
              onChange={(e) => setFbStorageBucket(e.target.value)}
              placeholder="project-id.appspot.com"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Messaging Sender ID</label>
            <input
              type="text"
              className="form-input"
              value={fbMessagingSenderId}
              onChange={(e) => setFbMessagingSenderId(e.target.value)}
              placeholder="84729184..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">App ID</label>
            <input
              type="text"
              className="form-input"
              value={fbAppId}
              onChange={(e) => setFbAppId(e.target.value)}
              placeholder="1:84729184:web:e8b4..."
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={() => {
                if (confirm("શું તમે ખરેખર કન્ફિગરેશન ડિલીટ કરવા માંગો છો?")) {
                  saveFirebaseConfig(null);
                  showToast("Firebase કન્ફિગરેશન ક્લિયર થયું! પેજ રીલોડ કરો.", "success");
                  setTimeout(() => window.location.reload(), 1000);
                }
              }}
            >
              કન્ફિગ સાફ કરો
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                className="btn btn-success"
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={16} /> રીલોડ એપ્લાય
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} /> કન્ફિગ સેવ કરો
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 📥 Auto Backup / Export Backup */}
      <div className="settings-section">
        <h2>
          <Download size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          સ્થાનિક ડેટા બેકઅપ
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          તમારા CRM ના તમામ ડેટા (સંપર્કો અને ગામ) નું બેકઅપ ડાઉનલોડ કરો. આ બેકઅપ ફાઇલનો ઉપયોગ ભવિષ્યમાં ડેટા રીસ્ટોર કરવા માટે થઈ શકે છે.
        </p>
        <button type="button" className="btn btn-success" onClick={handleBackupDownload}>
          <Download size={16} /> ડેટા બેકઅપ ડાઉનલોડ કરો (.json)
        </button>
      </div>
    </div>
  );
}
