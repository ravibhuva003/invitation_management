import React, { useState, useEffect } from "react";
import { Plus, Users, Eye } from "lucide-react";

export const CATEGORIES = [
  "રીટેલર કસ્ટમર",
  "હોલસેલ કસ્ટમર",
  "સંબંધી",
  "મિત્રો",
  "ટ્રાન્સપોર્ટર",
  "ધાર્મિક સંસ્થા",
  "ખરીદી વેપારી",
  "સેલ્સમેન",
  "કેટરર્સ",
  "મજૂર",
  "બ્રોકર્સ",
  "જનરલ"
];

export default function ContactForm({ 
  villages, 
  onAddVillage, 
  onSaveContact, 
  editContact, 
  onCancelEdit,
  onViewAll, 
  onViewCategory 
}) {
  const [mobile, setMobile] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [name, setName] = useState("");
  const [village, setVillage] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Village Modal state
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [citySubmitting, setCitySubmitting] = useState(false);

  // If in edit mode, populate the fields
  useEffect(() => {
    if (editContact) {
      setMobile(editContact.mobile || "");
      setWhatsapp(editContact.whatsapp || "");
      setName(editContact.name || "");
      setVillage(editContact.village || "");
      setAddress(editContact.address || "");
      setNotes(editContact.notes || "");
      
      // Initialize selected categories
      if (Array.isArray(editContact.categories)) {
        setSelectedCategories(editContact.categories);
      } else if (editContact.category) {
        setSelectedCategories(editContact.category.split(",").map(c => c.trim()).filter(Boolean));
      } else {
        setSelectedCategories([]);
      }
    } else {
      clearForm();
    }
  }, [editContact]);

  const clearForm = () => {
    setMobile("");
    setWhatsapp("");
    setName("");
    setVillage("");
    setAddress("");
    setNotes("");
    setSelectedCategories([]);
  };

  // Toggle selection of category
  const handleToggleCategory = (category) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // Submit contact with selected categories
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("કૃપા કરીને નામ દાખલ કરો!");
      return;
    }
    if (!mobile.trim()) {
      alert("કૃપા કરીને મોબાઇલ નંબર દાખલ કરો!");
      return;
    }
    if (selectedCategories.length === 0) {
      alert("કૃપા કરીને ઓછામાં ઓછી એક કેટેગરી પસંદ કરો!");
      return;
    }

    const contactData = {
      mobile: mobile.trim(),
      whatsapp: whatsapp.trim() || mobile.trim(), // Auto fill whatsapp with mobile if blank
      name: name.trim(),
      village: village,
      address: address.trim(),
      notes: notes.trim(),
      categories: selectedCategories,
      category: selectedCategories.join(", ")
    };

    onSaveContact(contactData);
    if (!editContact) {
      clearForm();
    }
  };

  // Handle Add Village Submit
  const handleAddCitySubmit = async (e) => {
    e.preventDefault();
    if (!newCityName.trim()) return;

    setCitySubmitting(true);
    try {
      const addedVillage = await onAddVillage(newCityName.trim());
      // Auto-select the newly added village
      setVillage(addedVillage.villageName);
      setNewCityName("");
      setIsCityModalOpen(false);
    } catch (err) {
      alert("ગામ ઉમેરવામાં ભૂલ આવી: " + err.message);
    } finally {
      setCitySubmitting(false);
    }
  };

  return (
    <div className="crm-layout">
      {/* Left Column: Form Card */}
      <div className="form-card">
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} style={{ color: 'var(--primary)' }} />
          {editContact ? "સંપર્ક સુધારો" : "નવો સંપર્ક નોંધણી ફોર્મ"}
        </h2>

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <label className="form-label">૧) મોબાઇલ નંબર</label>
            <input 
              type="tel" 
              className="form-input" 
              placeholder="Mobile Number" 
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">૨) વોટ્સએપ નંબર</label>
            <input 
              type="tel" 
              className="form-input" 
              placeholder="Whatsapp Number" 
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">૩) નામ</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">૪) ગામ</label>
            <div className="village-select-container">
              <select 
                className="form-input" 
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                required
              >
                <option value="">ગામ પસંદ કરો (Select Village)</option>
                {villages.map((v) => (
                  <option key={v.id} value={v.villageName}>
                    {v.villageName}
                  </option>
                ))}
              </select>
              <button 
                type="button" 
                className="btn btn-primary"
                style={{ padding: '0 12px', height: '40px', fontSize: '13px' }}
                onClick={() => setIsCityModalOpen(true)}
              >
                <Plus size={16} /> ગામ ઉમેરો
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">૫) સરનામું</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="address" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">૬) નોંધ</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Notes" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Form Actions (Horizontal Submit Category Buttons) */}
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-main)' }}>
              કેટેગરી પસંદ કરો (એકથી વધુ પસંદ કરી શકો છો):
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '10px'
            }}>
              {CATEGORIES.map((cat, idx) => (
                <button
                  key={cat}
                  type="button"
                  className={`btn-cat ${selectedCategories.includes(cat) ? 'active' : ''}`}
                  onClick={() => handleToggleCategory(cat)}
                  style={{
                    backgroundColor: selectedCategories.includes(cat) ? '#0b57d0' : 'var(--btn-category)',
                    boxShadow: selectedCategories.includes(cat) ? 'inset 0 2px 4px rgba(0,0,0,0.2)' : 'none'
                  }}
                >
                  {idx + 1}) {cat}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center' }}>
              {editContact && (
                <button type="button" className="btn btn-outline" style={{ padding: '10px 20px', fontWeight: '600' }} onClick={onCancelEdit}>
                  રદ કરો (Cancel)
                </button>
              )}
              <button 
                type="submit" 
                className="btn btn-success" 
                style={{ padding: '12px 30px', fontWeight: '700', fontSize: '15px' }}
                onClick={handleFormSubmit}
              >
                {editContact ? "ફેરફારો સેવ કરો (Update)" : "સંપર્ક સેવ કરો (Save Contact)"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Right Column: Navigation Sidebar */}
      <div className="sidebar-card">
        <button 
          className="btn btn-primary" 
          style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '600' }}
          onClick={onViewAll}
        >
          <Eye size={16} /> 13) view all
        </button>

        <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 0' }}></div>

        <div className="sidebar-grid">
          {/* Arrange in the layout matching screenshot 2:
              Col 1: 1, 2, 3, 4, 5, 6
              Col 2: 7, 8, 9, 10, 11, 12
          */}
          {/* Row 1 */}
          <button className="btn-cat" onClick={() => onViewCategory(CATEGORIES[0])}>1) {CATEGORIES[0]}</button>
          <button className="btn-cat" onClick={() => onViewCategory(CATEGORIES[6])}>7) {CATEGORIES[6]}</button>
          
          {/* Row 2 */}
          <button className="btn-cat" onClick={() => onViewCategory(CATEGORIES[1])}>2) {CATEGORIES[1]}</button>
          <button className="btn-cat" onClick={() => onViewCategory(CATEGORIES[7])}>8) {CATEGORIES[7]}</button>

          {/* Row 3 */}
          <button className="btn-cat" onClick={() => onViewCategory(CATEGORIES[2])}>3) {CATEGORIES[2]}</button>
          <button className="btn-cat" onClick={() => onViewCategory(CATEGORIES[8])}>9) {CATEGORIES[8]}</button>

          {/* Row 4 */}
          <button className="btn-cat" onClick={() => onViewCategory(CATEGORIES[3])}>4) {CATEGORIES[3]}</button>
          <button className="btn-cat" onClick={() => onViewCategory(CATEGORIES[9])}>10) {CATEGORIES[9]}</button>

          {/* Row 5 */}
          <button className="btn-cat" onClick={() => onViewCategory(CATEGORIES[4])}>5) {CATEGORIES[4]}</button>
          <button className="btn-cat" onClick={() => onViewCategory(CATEGORIES[10])}>11) {CATEGORIES[10]}</button>

          {/* Row 6 */}
          <button className="btn-cat" onClick={() => onViewCategory(CATEGORIES[5])}>6) {CATEGORIES[5]}</button>
          <button className="btn-cat" onClick={() => onViewCategory(CATEGORIES[11])}>12) {CATEGORIES[11]}</button>
        </div>
      </div>

      {/* Inline Modal: Add New City */}
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
