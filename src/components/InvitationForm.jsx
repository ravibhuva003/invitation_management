import React, { useState, useEffect, useRef } from "react";
import { Plus, Users } from "lucide-react";
import { isPhoneticMatch } from "../utils/phoneticSearch";

export default function InvitationForm({
  entries = [],
  villages,
  onAddVillage,
  onSaveInvitation,
  editEntry,
  onCancelEdit,
  invitationNames = [],
  onViewData
}) {
  const [name, setName] = useState("");
  const [village, setVillage] = useState("");
  const [address, setAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");

  const [categories, setCategories] = useState({
    vyavahar: { enabled: false, evening_29: "", morning_30: "", afternoon_30: "" },
    two_person: { enabled: false, evening_29: "", morning_30: "", afternoon_30: "" },
    one_person: { enabled: false, evening_29: "", morning_30: "", afternoon_30: "" },
    digital: { enabled: false, evening_29: "", morning_30: "", afternoon_30: "" }
  });

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredNames, setFilteredNames] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const wrapperRef = useRef(null);
  const lastTabTimeRef = useRef(0);

  // Village Modal state
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [citySubmitting, setCitySubmitting] = useState(false);

  useEffect(() => {
    if (editEntry) {
      setName(editEntry.name || "");
      setVillage(editEntry.village || "");
      setAddress(editEntry.address || "");
      setMobile(editEntry.mobile || "");
      setWhatsapp(editEntry.whatsapp || "");
      setNotes(editEntry.notes || "");
      if (editEntry.categories) {
        setCategories(editEntry.categories);
      }
    } else {
      clearForm();
    }
  }, [editEntry]);

  // Click outside to close autocomplete
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearForm = () => {
    setName("");
    setVillage("");
    setAddress("");
    setMobile("");
    setWhatsapp("");
    setNotes("");
    setCategories({
      vyavahar: { enabled: false, evening_29: "", morning_30: "", afternoon_30: "" },
      two_person: { enabled: false, evening_29: "", morning_30: "", afternoon_30: "" },
      one_person: { enabled: false, evening_29: "", morning_30: "", afternoon_30: "" },
      digital: { enabled: false, evening_29: "", morning_30: "", afternoon_30: "" }
    });
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (val.trim()) {
      const filtered = invitationNames.filter(n => 
        isPhoneticMatch(n.name, val)
      );
      setFilteredNames(filtered);
      setActiveSuggestionIndex(0);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectName = (selectedName) => {
    setName(selectedName);
    setShowSuggestions(false);
    setActiveSuggestionIndex(0);
  };

  const handleNameKeyDown = (e) => {
    if (!showSuggestions || filteredNames.length === 0) return;
    
    if (e.code === "ArrowDown" || e.key === "ArrowDown" || e.keyCode === 40) {
      e.preventDefault();
      setActiveSuggestionIndex(prev => {
        const next = Math.min(prev + 1, filteredNames.length - 1);
        const el = document.getElementById(`suggestion-${next}`);
        if (el) el.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.code === "ArrowUp" || e.key === "ArrowUp" || e.keyCode === 38) {
      e.preventDefault();
      setActiveSuggestionIndex(prev => {
        const next = Math.max(prev - 1, 0);
        const el = document.getElementById(`suggestion-${next}`);
        if (el) el.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.code === "Enter" || e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault();
      if (filteredNames[activeSuggestionIndex]) {
        handleSelectName(filteredNames[activeSuggestionIndex].name);
      }
    }
  };

  const moveFocus = (form, currentElement, isShift) => {
    const focusableElements = Array.from(form.elements).filter(el => 
      !el.disabled && el.tabIndex !== -1 && 
      (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' || el.tagName === 'BUTTON') &&
      el.type !== 'hidden'
    );
    
    const index = focusableElements.indexOf(currentElement);
    const step = isShift ? -1 : 1;
    
    if (index > -1 && index + step >= 0 && index + step < focusableElements.length) {
      setTimeout(() => {
        focusableElements[index + step].focus();
      }, 10);
    }
  };

  const handleFormKeyDown = (e) => {
    if (e.key === "Tab" || e.keyCode === 9) {
      e.preventDefault();
      e.stopPropagation();
      
      const form = e.currentTarget;
      const currentElement = e.target;
      
      if (e.isComposing) {
        currentElement.blur();
      }

      lastTabTimeRef.current = Date.now();
      moveFocus(form, currentElement, e.shiftKey);
    }
  };

  const handleFormKeyUp = (e) => {
    if (e.key === "Tab" || e.keyCode === 9) {
      if (Date.now() - lastTabTimeRef.current > 100) {
        e.preventDefault();
        e.stopPropagation();
        moveFocus(e.currentTarget, e.target, e.shiftKey);
      }
    }
  };

  const handleCategoryToggle = (catKey) => {
    setCategories(prev => ({
      ...prev,
      [catKey]: { ...prev[catKey], enabled: !prev[catKey].enabled }
    }));
  };

  const handleCategoryNumberChange = (catKey, field, val) => {
    setCategories(prev => ({
      ...prev,
      [catKey]: { ...prev[catKey], [field]: val }
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("કૃપા કરીને નામ દાખલ કરો!");
      return;
    }

    const isDuplicate = mobile.trim() && entries.some(entry => entry.mobile === mobile.trim() && entry.id !== editEntry?.id);
    if (isDuplicate) {
      alert("આ મોબાઈલ નંબર પહેલેથી જ દાખલ છે. કૃપા કરીને બીજો નંબર નાખો.");
      return;
    }

    const toEnglishNumber = (str) => {
      if (!str) return "0";
      const gujaratiToEnglish = {
        '૦': '0', '૧': '1', '૨': '2', '૩': '3', '૪': '4',
        '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9'
      };
      return String(str).replace(/[૦-૯]/g, match => gujaratiToEnglish[match]).replace(/[^0-9]/g, '');
    };

    const cleanedCategories = {};
    for (const [key, val] of Object.entries(categories)) {
      cleanedCategories[key] = {
        enabled: val.enabled,
        evening_29: val.enabled ? Number(toEnglishNumber(val.evening_29)) || 0 : 0,
        morning_30: val.enabled ? Number(toEnglishNumber(val.morning_30)) || 0 : 0,
        afternoon_30: val.enabled ? Number(toEnglishNumber(val.afternoon_30)) || 0 : 0,
      };
    }

    const entryData = {
      name: name.trim(),
      village,
      address: address.trim(),
      mobile: mobile.trim(),
      whatsapp: whatsapp.trim(),
      notes: notes.trim(),
      categories: cleanedCategories
    };

    onSaveInvitation(entryData);
    if (!editEntry) {
      clearForm();
    }
  };

  const handleAddCitySubmit = async (e) => {
    e.preventDefault();
    if (!newCityName.trim()) return;

    setCitySubmitting(true);
    try {
      const addedVillage = await onAddVillage(newCityName.trim());
      setVillage(addedVillage.villageName);
      setNewCityName("");
      setIsCityModalOpen(false);
    } catch (err) {
      alert("ગામ ઉમેરવામાં ભૂલ આવી: " + err.message);
    } finally {
      setCitySubmitting(false);
    }
  };

  const renderCategoryRow = (title, catKey) => {
    const isEnabled = categories[catKey].enabled;
    return (
      <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: isEnabled ? 'rgba(26, 115, 232, 0.05)' : 'transparent' }}>
        <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input 
            type="checkbox" 
            checked={isEnabled} 
            onChange={() => handleCategoryToggle(catKey)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span style={{ fontWeight: '600', cursor: 'pointer', fontSize: '15px' }} onClick={() => handleCategoryToggle(catKey)}>{title}</span>
        </td>
        <td style={{ padding: '12px 16px' }}>
          {isEnabled && (
            <input 
              type="text" 
              inputMode="numeric"
              className="form-input"
              style={{ width: '90px', padding: '8px', fontSize: '15px' }}
              value={categories[catKey].evening_29}
              onChange={(e) => handleCategoryNumberChange(catKey, 'evening_29', e.target.value)}
              min="0"
            />
          )}
        </td>
        <td style={{ padding: '12px 16px' }}>
          {isEnabled && (
            <input 
              type="text" 
              inputMode="numeric"
              className="form-input"
              style={{ width: '90px', padding: '8px', fontSize: '15px' }}
              value={categories[catKey].morning_30}
              onChange={(e) => handleCategoryNumberChange(catKey, 'morning_30', e.target.value)}
              min="0"
            />
          )}
        </td>
        <td style={{ padding: '12px 16px' }}>
          {isEnabled && (
            <input 
              type="text" 
              inputMode="numeric"
              className="form-input"
              style={{ width: '90px', padding: '8px', fontSize: '15px' }}
              value={categories[catKey].afternoon_30}
              onChange={(e) => handleCategoryNumberChange(catKey, 'afternoon_30', e.target.value)}
              min="0"
            />
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="crm-layout" style={{ gridTemplateColumns: '1fr', maxWidth: '100%', padding: '16px 24px', height: 'calc(100vh - 80px)' }}>
      <div className="form-card" style={{ padding: '24px 32px', height: '100%', display: 'flex', flexDirection: 'column' }}>

        <form onSubmit={handleFormSubmit} onKeyDownCapture={handleFormKeyDown} onKeyUpCapture={handleFormKeyUp} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="form-grid-3" style={{ marginBottom: '24px' }}>
            <div className="form-group" style={{ position: 'relative', marginBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '2px' }} ref={wrapperRef}>
              <label className="form-label" style={{ fontSize: '15px', marginBottom: '2px', fontWeight: '600' }}>નામ *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="નામ દાખલ કરો" 
                value={name}
                onChange={handleNameChange}
                onKeyDownCapture={handleNameKeyDown}
                onFocus={() => { if(name) setShowSuggestions(true); }}
                style={{ padding: '14px 16px', height: '52px', fontSize: '16px' }}
                autoFocus
                required
              />
              {showSuggestions && filteredNames.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: '0', right: 0, 
                  backgroundColor: 'var(--bg-card)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 10,
                  boxShadow: 'var(--shadow-card)'
                }}>
                  {filteredNames.map((item, idx) => (
                    <div 
                      key={item.id || idx}
                      id={`suggestion-${idx}`}
                      style={{ 
                        padding: '10px 14px', 
                        cursor: 'pointer', 
                        borderBottom: '1px solid var(--border-color)', 
                        fontSize: '14px',
                        backgroundColor: idx === activeSuggestionIndex ? 'rgba(138, 28, 20, 0.1)' : 'transparent',
                        color: idx === activeSuggestionIndex ? 'var(--primary)' : 'var(--text-main)',
                        fontWeight: idx === activeSuggestionIndex ? '600' : '400'
                      }}
                      onClick={() => handleSelectName(item.name)}
                      onMouseEnter={() => setActiveSuggestionIndex(idx)}
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '2px' }}>
              <label className="form-label" style={{ fontSize: '15px', marginBottom: '2px', fontWeight: '600' }}>ગામ (Optional)</label>
              <div className="village-select-container">
                <select 
                  className="form-input" 
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  style={{ padding: '14px 16px', height: '52px', fontSize: '16px' }}
                >
                  <option value="">ગામ પસંદ કરો</option>
                  {villages.map((v) => (
                    <option key={v.id} value={v.villageName}>
                      {v.villageName}
                    </option>
                  ))}
                </select>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  style={{ padding: '0 18px', height: '52px', fontSize: '15px' }}
                  onClick={() => setIsCityModalOpen(true)}
                  tabIndex="-1"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '2px' }}>
              <label className="form-label" style={{ fontSize: '15px', marginBottom: '2px', fontWeight: '600' }}>સરનામું (Address)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="સરનામું (Optional)" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ padding: '14px 16px', height: '52px', fontSize: '16px' }}
              />
            </div>
          </div>

          <div className="form-grid-3" style={{ marginBottom: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '2px' }}>
              <label className="form-label" style={{ fontSize: '15px', marginBottom: '2px', fontWeight: '600' }}>મોબાઈલ નંબર</label>
              <input 
                type="tel" 
                className="form-input" 
                placeholder="મોબાઈલ નંબર (Optional)" 
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                style={{ padding: '14px 16px', height: '52px', fontSize: '16px', borderColor: (mobile.trim() && entries.some(entry => entry.mobile === mobile.trim() && entry.id !== editEntry?.id)) ? 'var(--btn-danger)' : undefined }}
              />
              {(mobile.trim() && entries.some(entry => entry.mobile === mobile.trim() && entry.id !== editEntry?.id)) && (
                <div style={{ color: 'var(--btn-danger)', fontSize: '13px', marginTop: '6px', fontWeight: '600' }}>
                  આ નંબરનો ડેટા પહેલેથી જ છે!
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '2px' }}>
              <label className="form-label" style={{ fontSize: '15px', marginBottom: '2px', fontWeight: '600' }}>WhatsApp નંબર</label>
              <input 
                type="tel" 
                className="form-input" 
                placeholder="WhatsApp નંબર (Optional)" 
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                style={{ padding: '14px 16px', height: '52px', fontSize: '16px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '2px' }}>
              <label className="form-label" style={{ fontSize: '15px', marginBottom: '2px', fontWeight: '600' }}>નોંધ</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="કોઈ વધારાની નોંધ..." 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ padding: '14px 16px', height: '52px', fontSize: '16px' }}
              />
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="table-container" style={{ overflowX: 'auto', marginBottom: '8px', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '16px' }}>
                <thead style={{ backgroundColor: 'var(--bg-page)' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: '700' }}>આમંત્રણ પ્રકાર</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: '700' }}>29/08 સાંજે</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: '700' }}>30/08 સવારે</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: '700' }}>30/08 બપોરે</th>
                  </tr>
                </thead>
                <tbody>
                  {renderCategoryRow("વ્યવહારવાળી યાદી", "vyavahar")}
                  {renderCategoryRow("બે વ્યક્તિ જોડે", "two_person")}
                  {renderCategoryRow("એક વ્યક્તિ", "one_person")}
                  {renderCategoryRow("ડિજિટલ આમંત્રણ યાદી", "digital")}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', paddingTop: '8px', flexWrap: 'wrap' }}>
              {editEntry && (
                <button type="button" className="btn btn-outline" style={{ padding: '12px 28px', fontWeight: '600', fontSize: '16px' }} onClick={onCancelEdit}>
                  રદ કરો
                </button>
              )}
              {onViewData && (
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ padding: '12px 28px', fontWeight: '600', fontSize: '16px' }}
                  onClick={onViewData}
                  tabIndex="-1"
                >
                  રિપોર્ટ જુઓ
                </button>
              )}
              <button 
                type="submit" 
                className="btn btn-success" 
                style={{ padding: '12px 40px', fontWeight: '700', fontSize: '16px', borderRadius: '6px' }}
                onClick={handleFormSubmit}
              >
                {editEntry ? "ફેરફારો સેવ કરો" : "સેવ કરો"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {isCityModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">નવું ગામ ઉમેરો</h3>
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setIsCityModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddCitySubmit}>
              <div className="modal-body">
                <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>ગામનું નામ</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ગામનું નામ દાખલ કરો"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setIsCityModalOpen(false)}
                  disabled={citySubmitting}
                >
                  બંધ કરો
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={citySubmitting}
                >
                  {citySubmitting ? "ઉમેરાઈ રહ્યું છે..." : "ગામ સેવ કરો"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
