import React, { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Search, ArrowUpDown, MapPin } from "lucide-react";
import { dbOperations } from "../firebase";

export default function VillageManagement({ villages, contacts, currentAdmin, showToast }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("villageName");
  const [sortDirection, setSortDirection] = useState("asc");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Form states
  const [villageName, setVillageName] = useState("");
  const [selectedVillage, setSelectedVillage] = useState(null);

  // Village counts calculation
  const villageContactCounts = useMemo(() => {
    const counts = {};
    contacts.forEach(c => {
      if (c.village) {
        counts[c.village] = (counts[c.village] || 0) + 1;
      }
    });
    return counts;
  }, [contacts]);

  // Filter and sort villages list
  const filteredVillages = useMemo(() => {
    return villages
      .filter(v => {
        if (!searchQuery.trim()) return true;
        return (v.villageName || "").toLowerCase().includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => {
        let valA = a[sortField] || "";
        let valB = b[sortField] || "";

        if (sortField === "contactsCount") {
          valA = villageContactCounts[a.villageName] || 0;
          valB = villageContactCounts[b.villageName] || 0;
          return sortDirection === "asc" ? valA - valB : valB - valA;
        }

        // Default: alphabetical sorting by villageName
        let compare = valA.localeCompare(valB, 'gu');
        return sortDirection === "asc" ? compare : -compare;
      });
  }, [villages, searchQuery, sortField, sortDirection, villageContactCounts]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Add Village
  const handleAddVillage = async (e) => {
    e.preventDefault();
    if (!villageName.trim()) return;

    // Check duplicate
    const exists = villages.some(v => v.villageName.toLowerCase() === villageName.trim().toLowerCase());
    if (exists) {
      showToast("આ ગામ પહેલેથી જ ડેટાબેઝમાં નોંધાયેલ છે!", "error");
      return;
    }

    try {
      await dbOperations.addVillage(villageName.trim());
      await dbOperations.logActivity(currentAdmin.fullName, `ગામ ઉમેર્યું: ${villageName.trim()}`);
      showToast(`ગામ "${villageName.trim()}" સફળતાપૂર્વક ઉમેરાયું!`, "success");
      setIsAddModalOpen(false);
      setVillageName("");
    } catch (err) {
      showToast("ગામ ઉમેરવામાં ભૂલ આવી: " + err.message, "error");
    }
  };

  // Edit Village Trigger
  const handleEditTrigger = (village) => {
    setSelectedVillage(village);
    setVillageName(village.villageName || "");
    setIsEditModalOpen(true);
  };

  // Save Edit Village Name
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!villageName.trim()) return;

    // Check duplicate
    const exists = villages.some(v => v.id !== selectedVillage.id && v.villageName.toLowerCase() === villageName.trim().toLowerCase());
    if (exists) {
      showToast("આ ગામનું નામ પહેલેથી જ ડેટાબેઝમાં નોંધાયેલ છે!", "error");
      return;
    }

    try {
      const oldName = selectedVillage.villageName;
      await dbOperations.updateVillage(selectedVillage.id, villageName.trim());
      await dbOperations.logActivity(currentAdmin.fullName, `ગામનું નામ બદલ્યું: "${oldName}" માંથી "${villageName.trim()}"`);
      
      // Update contacts using this village if needed
      // Note: In Firestore, if we change a village name, the contacts linked to the old village name 
      // will still have the old name. To keep integrity, we can update them too, but the simplest approach 
      // is warning/advising that updating village names updates lookup lists. Let's automatically update 
      // all contact references to keep it extremely professional!
      const linkedContacts = contacts.filter(c => c.village === oldName);
      if (linkedContacts.length > 0) {
        showToast("આ ગામ સાથે સંકળાયેલા સંપર્કોને અપડેટ કરાઈ રહ્યા છે...", "info");
        await Promise.all(linkedContacts.map(c => 
          dbOperations.updateContact(c.id, { ...c, village: villageName.trim() })
        ));
      }

      showToast("ગામની વિગત સફળતાપૂર્વક અપડેટ થઈ!", "success");
      setIsEditModalOpen(false);
      setVillageName("");
      setSelectedVillage(null);
    } catch (err) {
      showToast("અપડેટ કરવામાં ભૂલ આવી: " + err.message, "error");
    }
  };

  // Delete Village
  const handleDeleteVillage = async (village) => {
    const contactsCount = villageContactCounts[village.villageName] || 0;
    
    // Deletion dependency validation check
    if (contactsCount > 0) {
      alert(`⚠️ ભૂલ: આ ગામનો ઉપયોગ ${contactsCount} સંપર્કો દ્વારા થઈ રહ્યો છે, તેથી તેને ડિલીટ કરી શકાશે નહીં.\nકૃપા કરીને પહેલા તે સંપર્કોના ગામ બદલો અથવા સંપર્કો ડિલીટ કરો.`);
      showToast("ગામ ડિલીટ કરી શકાયું નથી (સંપર્કો જોડાયેલ છે)", "error");
      return;
    }

    if (confirm(`શું તમે ખરેખર ગામ "${village.villageName}" ને ડિલીટ કરવા માંગો છો?`)) {
      try {
        await dbOperations.deleteVillage(village.id);
        await dbOperations.logActivity(currentAdmin.fullName, `ગામ ડિલીટ કર્યું: ${village.villageName}`);
        showToast("ગામ સફળતાપૂર્વક ડિલીટ કરાયું!", "success");
      } catch (err) {
        showToast("ડિલીટ કરવામાં ભૂલ આવી: " + err.message, "error");
      }
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>ગામ વ્યવસ્થાપન ડેશબોર્ડ</h2>
        <button 
          className="btn btn-primary"
          onClick={() => { setVillageName(""); setIsAddModalOpen(true); }}
        >
          <Plus size={16} /> નવું ગામ ઉમેરો
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-controls" style={{ marginBottom: '16px', justifyContent: 'flex-end' }}>
        <div className="search-box">
          <label style={{ fontWeight: '600' }}>Search Village:</label>
          <input
            type="text"
            placeholder="ગામ શોધો..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Villages Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("villageName")}>
                ગામનું નામ <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
              </th>
              <th onClick={() => handleSort("contactsCount")}>
                કુલ સંપર્કો <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
              </th>
              <th onClick={() => handleSort("createdAt")}>
                નોંધણી તારીખ <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
              </th>
              <th className="actions-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVillages.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  કોઈ ગામ મળી આવ્યા નથી
                </td>
              </tr>
            ) : (
              filteredVillages.map((v) => {
                const count = villageContactCounts[v.villageName] || 0;
                return (
                  <tr key={v.id}>
                    <td>
                      <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} style={{ color: 'var(--primary)' }} />
                        {v.villageName}
                      </strong>
                    </td>
                    <td><strong>{count}</strong> સંપર્કો</td>
                    <td>{v.createdAt ? new Date(v.createdAt).toLocaleDateString("gu-IN") : "-"}</td>
                    <td className="actions-cell">
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        onClick={() => handleEditTrigger(v)}
                        title="સુધારો"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        onClick={() => handleDeleteVillage(v)}
                        title="ડિલીટ"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: Add Village */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">નવું ગામ ઉમેરો</h3>
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setIsAddModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddVillage}>
              <div className="modal-body">
                <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>ગામનું નામ</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ગામનું નામ દાખલ કરો"
                  value={villageName}
                  onChange={(e) => setVillageName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsAddModalOpen(false)}>રદ કરો</button>
                <button type="submit" className="btn btn-primary">સેવ કરો</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Village */}
      {isEditModalOpen && selectedVillage && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">ગામનું નામ બદલો</h3>
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => { setIsEditModalOpen(false); setSelectedVillage(null); }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>ગામનું નવું નામ</label>
                <input
                  type="text"
                  className="form-input"
                  value={villageName}
                  onChange={(e) => setVillageName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => { setIsEditModalOpen(false); setSelectedVillage(null); }}>રદ કરો</button>
                <button type="submit" className="btn btn-primary">સુધારો સાચવો</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
