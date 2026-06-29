import React, { useState, useMemo, useEffect } from "react";
import { Search, Edit, Trash2, ChevronLeft, ChevronRight, Download, Printer } from "lucide-react";
import * as XLSX from "xlsx";

export default function InvitationReport({ 
  entries, 
  onEditEntry, 
  onDeleteEntry,
  googleSheetsViewUrl,
  setHeaderTitle
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterCategory, setFilterCategory] = useState("all"); // 'all', 'vyavahar', 'two_person', 'one_person', 'digital'
  const itemsPerPage = 50;

  useEffect(() => {
    if (setHeaderTitle) {
      const titles = {
        all: "આમંત્રણ વ્યવસ્થા",
        vyavahar: "વ્યવહારવાળી યાદી",
        two_person: "બે વ્યક્તિ જોડે યાદી",
        one_person: "એક વ્યક્તિ યાદી",
        digital: "ડિજિટલ આમંત્રણ યાદી"
      };
      setHeaderTitle(titles[filterCategory] || "આમંત્રણ વ્યવસ્થા");
    }
  }, [filterCategory, setHeaderTitle]);

  const filteredEntries = useMemo(() => {
    let result = entries;
    
    if (filterCategory !== "all") {
      result = result.filter(entry => entry.categories?.[filterCategory]?.enabled);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((entry) => {
        const nameMatch = (entry.name || "").toLowerCase().includes(searchLower);
        const villageMatch = (entry.village || "").toLowerCase().includes(searchLower);
        const mobileMatch = (entry.mobile || "").toLowerCase().includes(searchLower);
        return nameMatch || villageMatch || mobileMatch;
      });
    }

    if (sortBy) {
      result = [...result].sort((a, b) => {
        const aVal = (a[sortBy] || "").toLowerCase();
        const bVal = (b[sortBy] || "").toLowerCase();
        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [entries, searchTerm, filterCategory, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const currentData = filteredEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getMealTotal = (cats, mealKey, filterCat) => {
    if (!cats) return 0;
    if (filterCat !== "all") {
      const cat = cats[filterCat];
      return (cat && cat.enabled) ? (Number(cat[mealKey]) || 0) : 0;
    }
    let total = 0;
    for (const key of ['vyavahar', 'two_person', 'one_person', 'digital']) {
      const cat = cats[key];
      if (cat && cat.enabled) {
        total += Number(cat[mealKey]) || 0;
      }
    }
    return total;
  };

  const getCategoriesString = (cats) => {
    if (!cats) return "-";
    const active = [];
    if (cats.vyavahar?.enabled) active.push("વ્યવહારવાળી યાદી");
    if (cats.two_person?.enabled) active.push("બે વ્યક્તિ જોડે યાદી");
    if (cats.one_person?.enabled) active.push("એક વ્યક્તિ યાદી");
    if (cats.digital?.enabled) active.push("ડિજિટલ આમંત્રણ યાદી");
    return active.length > 0 ? active.join(", ") : "-";
  };

  const exportToExcel = () => {
    if (filteredEntries.length === 0) {
      alert("નિકાસ કરવા માટે કોઈ ડેટા નથી.");
      return;
    }
    const exportData = filteredEntries.map((e, index) => ({
      "ક્રમ": index + 1,
      "નામ": e.name || "",
      "ગામ": e.village || "",
      "મોબાઈલ નંબર": e.mobile || "",
      "29/8 સાંજે": getMealTotal(e.categories, 'evening_29', filterCategory) || 0,
      "30/8 સવારે": getMealTotal(e.categories, 'morning_30', filterCategory) || 0,
      "30/8 બપોરે": getMealTotal(e.categories, 'afternoon_30', filterCategory) || 0,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invitations");
    XLSX.writeFile(workbook, "Invitations_Report.xlsx");
  };

  return (
    <div className="report-view-container" style={{ width: '100%' }}>
      
      {/* Filter Categories */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button 
          className={`btn ${filterCategory === "all" ? "btn-primary" : "btn-outline"}`}
          onClick={() => { setFilterCategory("all"); setCurrentPage(1); }}
        >
          તમામ
        </button>
        <button 
          className={`btn ${filterCategory === "vyavahar" ? "btn-primary" : "btn-outline"}`}
          onClick={() => { setFilterCategory("vyavahar"); setCurrentPage(1); }}
        >
          વ્યવહારવાળી યાદી
        </button>
        <button 
          className={`btn ${filterCategory === "two_person" ? "btn-primary" : "btn-outline"}`}
          onClick={() => { setFilterCategory("two_person"); setCurrentPage(1); }}
        >
          બે વ્યક્તિ જોડે યાદી
        </button>
        <button 
          className={`btn ${filterCategory === "one_person" ? "btn-primary" : "btn-outline"}`}
          onClick={() => { setFilterCategory("one_person"); setCurrentPage(1); }}
        >
          એક વ્યક્તિ યાદી
        </button>
        <button 
          className={`btn ${filterCategory === "digital" ? "btn-primary" : "btn-outline"}`}
          onClick={() => { setFilterCategory("digital"); setCurrentPage(1); }}
        >
          ડિજિટલ આમંત્રણ યાદી
        </button>
      </div>

      <div className="search-controls">
        <div className="search-box" style={{ flex: '1', maxWidth: '400px' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="નામ, ગામ અથવા મોબાઈલ નંબરથી શોધો..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: '100%', border: 'none', background: 'transparent' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {googleSheetsViewUrl && (
            <a 
              href={googleSheetsViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{ color: '#0f9d58', borderColor: '#0f9d58' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 4H3a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1zm-1 14H4V6h16v12z"/>
                  <path d="M12 8H8v2h4V8zm0 4H8v2h4v-2zm4-4h-2v2h2V8zm0 4h-2v2h2v-2z"/>
                </svg>
                Google Sheet જુઓ
              </div>
            </a>
          )}
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={16} /> પ્રિન્ટ (Print)
          </button>
          <button className="btn btn-success" onClick={exportToExcel}>
            <Download size={16} /> Excel Export
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ક્રમ</th>
              <th onClick={() => handleSort("name")} style={{ cursor: 'pointer' }}>
                નામ {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th onClick={() => handleSort("village")} style={{ cursor: 'pointer' }}>
                ગામ {sortBy === "village" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th>સરનામું</th>
              <th onClick={() => handleSort("mobile")} style={{ cursor: 'pointer' }}>
                મોબાઈલ નંબર {sortBy === "mobile" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th>WhatsApp</th>
              {filterCategory === "all" && <th>કેટેગરી</th>}
              <th>29/8 સાંજે</th>
              <th>30/8 સવારે</th>
              <th>30/8 બપોરે</th>
              <th className="actions-cell">એક્શન</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              currentData.map((entry, idx) => (
                <tr key={entry.id}>
                  <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                  <td style={{ fontWeight: '500' }}>{entry.name}</td>
                  <td>{entry.village}</td>
                  <td>{entry.address || "-"}</td>
                  <td>{entry.mobile || "-"}</td>
                  <td>{entry.whatsapp || "-"}</td>
                  {filterCategory === "all" && (
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {getCategoriesString(entry.categories)}
                    </td>
                  )}
                  <td style={{ textAlign: 'center' }}>{getMealTotal(entry.categories, 'evening_29', filterCategory) || "-"}</td>
                  <td style={{ textAlign: 'center' }}>{getMealTotal(entry.categories, 'morning_30', filterCategory) || "-"}</td>
                  <td style={{ textAlign: 'center' }}>{getMealTotal(entry.categories, 'afternoon_30', filterCategory) || "-"}</td>
                  <td className="actions-cell">
                    <button
                      className="btn btn-outline"
                      style={{ padding: '6px' }}
                      title="સુધારો (Edit)"
                      onClick={() => onEditEntry(entry)}
                    >
                      <Edit size={16} style={{ color: 'var(--primary)' }} />
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '6px' }}
                      title="ડિલીટ કરો (Delete)"
                      onClick={() => {
                        if (window.confirm("શું તમે ખરેખર આ આમંત્રણ ડિલીટ કરવા માંગો છો?")) {
                          onDeleteEntry(entry.id);
                        }
                      }}
                    >
                      <Trash2 size={16} style={{ color: 'var(--btn-danger)' }} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  કોઈ ડેટા મળ્યો નથી. (No entries found)
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="table-controls">
            <span>
              કુલ રેકોર્ડ્સ: <strong>{filteredEntries.length}</strong> (પેજ {currentPage} / {totalPages})
            </span>
            <div className="pagination-btn-group">
              <button
                className="btn btn-outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                <ChevronLeft size={16} /> પાછળ
              </button>
              <button
                className="btn btn-outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              >
                આગળ <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
