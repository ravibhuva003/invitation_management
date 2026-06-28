import React from "react";
import { Users, Calendar, MapPin, Grid, Radio } from "lucide-react";

export default function DashboardStats({ entries, cities, isFirebase }) {
  // Total Contacts
  const totalContacts = entries.length;

  // Today's Contacts
  const todayStr = new Date().toDateString();
  const todaysContacts = entries.filter(c => {
    if (!c.createdAt) return false;
    return new Date(c.createdAt).toDateString() === todayStr;
  }).length;

  // Village Wise Counts
  const villageCounts = {};
  entries.forEach(c => {
    const v = c.village || "અજ્ઞાત";
    villageCounts[v] = (villageCounts[v] || 0) + 1;
  });
  const sortedVillages = Object.entries(villageCounts)
    .sort((a, b) => b[1] - a[1]);

  // Category Wise Counts
  const categoryCounts = {};
  entries.forEach(c => {
    let cats = c.categories || {};
    if (cats.vyavahar?.enabled) categoryCounts["વ્યવહારવાળી યાદી"] = (categoryCounts["વ્યવહારવાળી યાદી"] || 0) + 1;
    if (cats.two_person?.enabled) categoryCounts["બે વ્યક્તિ જોડે"] = (categoryCounts["બે વ્યક્તિ જોડે"] || 0) + 1;
    if (cats.one_person?.enabled) categoryCounts["એક વ્યક્તિ"] = (categoryCounts["એક વ્યક્તિ"] || 0) + 1;
    if (cats.digital?.enabled) categoryCounts["ડિજિટલ આમંત્રણ"] = (categoryCounts["ડિજિટલ આમંત્રણ"] || 0) + 1;
  });
  const sortedCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div>
      {/* 4 Main Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(26, 115, 232, 0.1)', color: 'var(--primary)' }}>
            <Users size={22} />
          </div>
          <div className="stat-details">
            <h3>કુલ આમંત્રણ</h3>
            <p>{totalContacts}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(24, 128, 56, 0.1)', color: 'var(--btn-success)' }}>
            <Calendar size={22} />
          </div>
          <div className="stat-details">
            <h3>આજના આમંત્રણ</h3>
            <p>{todaysContacts}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(242, 153, 0, 0.1)', color: 'var(--btn-warning)' }}>
            <MapPin size={22} />
          </div>
          <div className="stat-details">
            <h3>કુલ ગામ</h3>
            <p>{cities.length}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ 
            backgroundColor: isFirebase ? 'rgba(24, 128, 56, 0.1)' : 'rgba(219, 48, 37, 0.1)', 
            color: isFirebase ? 'var(--btn-success)' : 'var(--btn-danger)' 
          }}>
            <Radio size={22} />
          </div>
          <div className="stat-details">
            <h3>કનેક્શન સ્ટેટસ</h3>
            <p style={{ fontSize: '15px', marginTop: '6px' }}>
              {isFirebase ? "Firebase લાઈવ" : "ડેમો મોડ (લોકલ)"}
            </p>
          </div>
        </div>
      </div>

      {/* Grid for Village and Category breakdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }} className="crm-layout-breakdowns">
        {/* Village Counts Card */}
        <div className="form-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} style={{ color: 'var(--primary)' }} />
            ગામ પ્રમાણે સંપર્કો
          </h3>
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {sortedVillages.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>કોઈ ડેટા ઉપલબ્ધ નથી</p>
            ) : (
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '6px 0', fontWeight: '600' }}>ગામનું નામ</th>
                    <th style={{ padding: '6px 0', fontWeight: '600', textAlign: 'right' }}>સંપર્કોની સંખ્યા</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedVillages.map(([village, count]) => (
                    <tr key={village} style={{ borderBottom: '1px dotted var(--border-color)' }}>
                      <td style={{ padding: '8px 0' }}>{village}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600' }}>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Category Counts Card */}
        <div className="form-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Grid size={18} style={{ color: 'var(--primary)' }} />
            કેટેગરી પ્રમાણે સંપર્કો
          </h3>
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {sortedCategories.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>કોઈ ડેટા ઉપલબ્ધ નથી</p>
            ) : (
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '6px 0', fontWeight: '600' }}>કેટેગરી</th>
                    <th style={{ padding: '6px 0', fontWeight: '600', textAlign: 'right' }}>સંપર્કોની સંખ્યા</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCategories.map(([category, count]) => (
                    <tr key={category} style={{ borderBottom: '1px dotted var(--border-color)' }}>
                      <td style={{ padding: '8px 0' }}>{category}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600' }}>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Embedded CSS for layout breakdowns on smaller screens */}
      <style>{`
        @media (max-width: 768px) {
          .crm-layout-breakdowns {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
