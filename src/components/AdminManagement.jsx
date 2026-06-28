import React, { useState } from "react";
import { UserPlus, Edit2, Trash2, Key, ShieldAlert, ShieldCheck } from "lucide-react";
import { dbOperations } from "../firebase";

export default function AdminManagement({ admins, currentAdmin, showToast }) {
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Form states
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Admin");
  const [isActive, setIsActive] = useState(true);
  const [newPassword, setNewPassword] = useState("");

  const clearForm = () => {
    setFullName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setRole("Admin");
    setIsActive(true);
    setNewPassword("");
    setSelectedAdmin(null);
  };

  // Add Admin
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      showToast("કૃપા કરીને બધી માહિતી ભરો!", "error");
      return;
    }

    // Check duplicate username
    const exists = admins.some(a => a.username.toLowerCase() === username.trim().toLowerCase());
    if (exists) {
      showToast("આ યુઝરનેમ પહેલેથી જ વપરાશમાં છે!", "error");
      return;
    }

    try {
      const newAdmin = {
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password: password.trim(),
        role: role,
        isActive: isActive
      };
      await dbOperations.addAdmin(newAdmin);
      await dbOperations.logActivity(currentAdmin.fullName, `એડમિન ઉમેર્યા: ${newAdmin.fullName} (${newAdmin.role})`);
      showToast("નવા એડમિન સફળતાપૂર્વક ઉમેરાયા!", "success");
      setIsAddModalOpen(false);
      clearForm();
    } catch (err) {
      showToast("એડમિન ઉમેરવામાં ભૂલ આવી: " + err.message, "error");
    }
  };

  // Edit Admin Trigger
  const handleEditTrigger = (admin) => {
    setSelectedAdmin(admin);
    setFullName(admin.fullName || "");
    setUsername(admin.username || "");
    setEmail(admin.email || "");
    setRole(admin.role || "Admin");
    setIsActive(admin.isActive !== false);
    setIsEditModalOpen(true);
  };

  // Save Edit Admin
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !email.trim()) {
      showToast("કૃપા કરીને બધી માહિતી ભરો!", "error");
      return;
    }

    // Check duplicate username (except self)
    const exists = admins.some(a => a.id !== selectedAdmin.id && a.username.toLowerCase() === username.trim().toLowerCase());
    if (exists) {
      showToast("આ યુઝરનેમ પહેલેથી જ વપરાશમાં છે!", "error");
      return;
    }

    try {
      const updatedData = {
        ...selectedAdmin,
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        role: role,
        isActive: isActive
      };
      await dbOperations.updateAdmin(selectedAdmin.id, updatedData);
      await dbOperations.logActivity(currentAdmin.fullName, `એડમિન અપડેટ કર્યા: ${updatedData.fullName}`);
      showToast("એડમિન માહિતી સફળતાપૂર્વક અપડેટ થઈ!", "success");
      setIsEditModalOpen(false);
      clearForm();
    } catch (err) {
      showToast("અપડેટ કરવામાં ભૂલ આવી: " + err.message, "error");
    }
  };

  // Toggle Admin Status
  const handleToggleStatus = async (admin) => {
    if (admin.id === currentAdmin.id) {
      showToast("તમે તમારું પોતાનું એકાઉન્ટ ડિસેબલ કરી શકતા નથી!", "error");
      return;
    }

    try {
      const updatedStatus = !admin.isActive;
      await dbOperations.updateAdmin(admin.id, { ...admin, isActive: updatedStatus });
      await dbOperations.logActivity(currentAdmin.fullName, `એડમિનની સ્થિતિ બદલી: ${admin.fullName} (${updatedStatus ? 'સક્રિય' : 'નિષ્ક્રિય'})`);
      showToast(`એડમિન એકાઉન્ટ ${updatedStatus ? 'સક્રિય' : 'નિષ્ક્રિય'} કરવામાં આવ્યું.`, "success");
    } catch (err) {
      showToast("સ્થિતિ બદલવામાં ભૂલ આવી: " + err.message, "error");
    }
  };

  // Reset Password Trigger
  const handleResetTrigger = (admin) => {
    setSelectedAdmin(admin);
    setNewPassword("");
    setIsResetModalOpen(true);
  };

  // Reset Password Submit
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      showToast("કૃપા કરીને નવો પાસવર્ડ દાખલ કરો!", "error");
      return;
    }

    try {
      await dbOperations.updateAdmin(selectedAdmin.id, { ...selectedAdmin, password: newPassword.trim() });
      await dbOperations.logActivity(currentAdmin.fullName, `એડમિન પાસવર્ડ રીસેટ કર્યો: ${selectedAdmin.fullName}`);
      showToast("પાસવર્ડ સફળતાપૂર્વક રીસેટ થયો!", "success");
      setIsResetModalOpen(false);
      clearForm();
    } catch (err) {
      showToast("પાસવર્ડ રીસેટ કરવામાં ભૂલ આવી: " + err.message, "error");
    }
  };

  // Delete Admin
  const handleDeleteAdmin = async (admin) => {
    if (admin.id === currentAdmin.id) {
      showToast("તમે તમારું પોતાનું એકાઉન્ટ ડિલીટ કરી શકતા નથી!", "error");
      return;
    }

    if (confirm(`શું તમે ખરેખર એડમિન "${admin.fullName}" ને ડિલીટ કરવા માંગો છો?`)) {
      try {
        await dbOperations.deleteAdmin(admin.id);
        await dbOperations.logActivity(currentAdmin.fullName, `એડમિન ડિલીટ કર્યા: ${admin.fullName}`);
        showToast("એડમિન સફળતાપૂર્વક ડિલીટ કરાયા!", "success");
      } catch (err) {
        showToast("ડિલીટ કરવામાં ભૂલ આવી: " + err.message, "error");
      }
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>એડમિન વપરાશકર્તા વ્યવસ્થાપન</h2>
        <button 
          className="btn btn-primary"
          onClick={() => { clearForm(); setIsAddModalOpen(true); }}
        >
          <UserPlus size={16} /> નવો એડમિન ઉમેરો
        </button>
      </div>

      {/* Admin Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>પૂરું નામ</th>
              <th>યુઝરનેમ</th>
              <th>ઈમેલ</th>
              <th>ભૂમિકા</th>
              <th>સ્થિતિ</th>
              <th>નોંધણી તારીખ</th>
              <th className="actions-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  કોઈ એડમિન મળી આવ્યા નથી
                </td>
              </tr>
            ) : (
              admins.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.fullName}</strong></td>
                  <td>{a.username}</td>
                  <td>{a.email}</td>
                  <td>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: a.role === "Super Admin" ? 'rgba(217, 48, 37, 0.1)' : 'rgba(26, 115, 232, 0.1)',
                      color: a.role === "Super Admin" ? 'var(--btn-danger)' : 'var(--primary)'
                    }}>
                      {a.role}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleStatus(a)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: a.isActive !== false ? 'var(--btn-success)' : 'var(--text-muted)'
                      }}
                      title={a.isActive !== false ? "નિષ્ક્રિય કરવા ક્લિક કરો" : "સક્રિય કરવા ક્લિક કરો"}
                    >
                      {a.isActive !== false ? (
                        <>
                          <ShieldCheck size={16} /> <span style={{ fontSize: '12px', fontWeight: '500' }}>સક્રિય</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert size={16} style={{ color: 'var(--btn-warning)' }} /> <span style={{ fontSize: '12px', fontWeight: '500' }}>નિષ્ક્રિય</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td>{a.createdAt ? new Date(a.createdAt).toLocaleDateString("gu-IN") : "-"}</td>
                  <td className="actions-cell">
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      onClick={() => handleEditTrigger(a)}
                      title="માહિતી સુધારો"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      onClick={() => handleResetTrigger(a)}
                      title="પાસવર્ડ બદલો"
                    >
                      <Key size={12} />
                    </button>
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      disabled={a.id === currentAdmin.id}
                      onClick={() => handleDeleteAdmin(a)}
                      title="એકાઉન્ટ ડિલીટ કરો"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: Add Admin */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">નવો એડમિન એકાઉન્ટ ઉમેરો</h3>
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setIsAddModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddAdmin}>
              <div className="modal-body">
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>પૂરું નામ</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>યુઝરનેમ</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>ઈમેલ સરનામું</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>પાસવર્ડ</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>ભૂમિકા (Role)</label>
                  <select
                    className="form-input"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    એકાઉન્ટ સક્રિય રાખો (Enable Account)
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsAddModalOpen(false)}>બંધ કરો</button>
                <button type="submit" className="btn btn-primary">સેવ કરો</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Admin */}
      {isEditModalOpen && selectedAdmin && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">એડમિન વિગત સુધારો</h3>
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setIsEditModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>પૂરું નામ</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>યુઝરનેમ</label>
                  <input
                    type="text"
                    className="form-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>ઈમેલ સરનામું</label>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>ભૂમિકા (Role)</label>
                  <select
                    className="form-input"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={selectedAdmin.id === currentAdmin.id} // Prevent self promotion/demotion
                  >
                    <option value="Admin">Admin</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsEditModalOpen(false)}>રદ કરો</button>
                <button type="submit" className="btn btn-primary">સુધારો સાચવો</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Reset Password */}
      {isResetModalOpen && selectedAdmin && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">એડમિન પાસવર્ડ રીસેટ</h3>
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setIsResetModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleResetPassword}>
              <div className="modal-body">
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  એડમિન: <strong>{selectedAdmin.fullName}</strong>
                </p>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>નવો પાસવર્ડ</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="નવો પાસવર્ડ દાખલ કરો"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsResetModalOpen(false)}>રદ કરો</button>
                <button type="submit" className="btn btn-primary">પાસવર્ડ બદલો</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
