import React, { useState, useEffect } from "react";
import { Save, Key, Database, RefreshCw, FileText, Download, Upload } from "lucide-react";
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
  const [driveWebhook, setDriveWebhook] = useState("");
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
    setDriveWebhook(localStorage.getItem("crm_drive_webhook") || "");

  }, []);

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
    if (driveWebhook.trim()) {
      localStorage.setItem("crm_drive_webhook", driveWebhook.trim());
    } else {
      localStorage.removeItem("crm_drive_webhook");
    }

    showToast("URL સફળતાપૂર્વક સેવ થઈ ગઈ છે!", "success");
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

  // Restore data from JSON
  const handleRestoreUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backupData = JSON.parse(event.target.result);
        if (confirm("ચેતવણી: આ રિસ્ટોર તમારા હાલના તમામ ડેટાને ડિલીટ કરી દેશે અને બેકઅપ ફાઈલમાંથી નવો ડેટા લાવશે. શું તમે આગળ વધવા માંગો છો?")) {
          await dbOperations.restoreDatabase(backupData);
          showToast("ડેટા સફળતાપૂર્વક રિસ્ટોર થઈ ગયો છે! એપ્લિકેશન રીલોડ થઈ રહી છે...", "success");
          setTimeout(() => window.location.reload(), 2000);
        }
      } catch (err) {
        console.error("Restore Error:", err);
        showToast("ફાઈલ વાંચવામાં ભૂલ આવી! કૃપા કરીને સાચી JSON બેકઅપ ફાઈલ પસંદ કરો.", "error");
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = null;
  };

  // Backup data
  const handleBackupDownload = () => {
    try {
      const backupData = {
        invitations: entries || [],
        cities: cities || [],
        exportDate: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CRM_Backup_Raw_${new Date().toISOString().split('T')[0]}.json`;
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
          <div className="form-group" style={{ gridTemplateColumns: '1fr', marginTop: '16px' }}>
            <label className="form-label" style={{ marginBottom: '8px' }}>Google Drive Auto-Backup Webhook URL (Optional)</label>
            <input
              type="url"
              className="form-input"
              value={driveWebhook}
              onChange={(e) => setDriveWebhook(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
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
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-success" onClick={handleBackupDownload}>
            <Download size={16} /> ડેટા બેકઅપ ડાઉનલોડ કરો (.json)
          </button>
          
          <div style={{ position: 'relative' }}>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleRestoreUpload}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            />
            <button type="button" className="btn btn-primary">
              <Upload size={16} /> JSON ફાઈલ અપલોડ કરો (Restore)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
