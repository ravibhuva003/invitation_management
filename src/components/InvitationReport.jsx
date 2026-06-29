import React, { useState, useMemo, useEffect } from "react";
import { Search, Edit, Trash2, ChevronLeft, ChevronRight, Download, Printer, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import * as XLSX from "xlsx";
import { isPhoneticMatch } from "../utils/phoneticSearch";

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

  const filteredEntries = useMemo(() => {
    let result = entries;
    
    if (filterCategory !== "all") {
      result = result.filter(entry => entry.categories?.[filterCategory]?.enabled);
    }

    if (searchTerm) {
      result = result.filter((entry) => {
        const nameMatch = isPhoneticMatch(entry.name, searchTerm);
        const villageMatch = isPhoneticMatch(entry.village, searchTerm);
        const mobileMatch = isPhoneticMatch(entry.mobile, searchTerm);
        
        return nameMatch || villageMatch || mobileMatch;
      });
    }

    if (sortBy) {
      result = [...result].sort((a, b) => {
        let aVal, bVal;
        
        // Handle nested numeric fields for sorting meals
        if (sortBy === "evening_29" || sortBy === "morning_30" || sortBy === "afternoon_30") {
          aVal = getMealTotal(a.categories, sortBy, filterCategory);
          bVal = getMealTotal(b.categories, sortBy, filterCategory);
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        } else if (sortBy === "categories") {
          aVal = getCategoriesString(a.categories);
          bVal = getCategoriesString(b.categories);
          if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
          if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
          return 0;
        } else {
          aVal = (a[sortBy] || "").toLowerCase();
          bVal = (b[sortBy] || "").toLowerCase();
          if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
          if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
          return 0;
        }
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

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ChevronsUpDown size={14} style={{ opacity: 0.3, marginLeft: '4px', verticalAlign: 'middle' }} />;
    return sortOrder === "asc" 
      ? <ArrowUp size={14} style={{ marginLeft: '4px', color: 'var(--primary)', verticalAlign: 'middle' }} /> 
      : <ArrowDown size={14} style={{ marginLeft: '4px', color: 'var(--primary)', verticalAlign: 'middle' }} />;
  };

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const currentData = filteredEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );



  const exportToExcel = () => {
    if (filteredEntries.length === 0) {
      alert("નિકાસ કરવા માટે કોઈ ડેટા નથી.");
      return;
    }
    const exportData = filteredEntries.map((e, index) => ({
      "ક્રમ": index + 1,
      "નામ": e.name || "",
      "સરનામું": e.address || "",
      "ગામ": e.village || "",
      "મોબાઈલ નંબર": e.mobile || "",
      "WhatsApp": e.whatsapp || "",
      "29/8 સાંજે": getMealTotal(e.categories, 'evening_29', filterCategory) || 0,
      "30/8 સવારે": getMealTotal(e.categories, 'morning_30', filterCategory) || 0,
      "30/8 બપોરે": getMealTotal(e.categories, 'afternoon_30', filterCategory) || 0,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invitations");
    XLSX.writeFile(workbook, "Invitations_Report.xlsx");
  };

  const getPrintTitle = () => {
    switch (filterCategory) {
      case "vyavahar": return "વ્યવહારવાળી યાદી";
      case "two_person": return "બે વ્યક્તિ જોડે યાદી";
      case "one_person": return "એક વ્યક્તિ યાદી";
      case "digital": return "ડિજિટલ આમંત્રણ યાદી";
      default: return "તમામ આમંત્રણ રિપોર્ટ";
    }
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
        <div className="search-box" style={{ flex: '1', maxWidth: '400px', border: '1px solid var(--primary)', borderRadius: '6px', padding: '2px', backgroundColor: 'var(--bg-card)' }}>
          <Search size={18} style={{ color: 'var(--primary)', marginLeft: '10px' }} />
          <input
            type="text"
            placeholder="નામ, ગામ અથવા મોબાઈલ નંબરથી શોધો..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: '100%', border: 'none', background: 'transparent', padding: '10px' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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

      <div className="print-header">
        <h1>{getPrintTitle()}</h1>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ક્રમ</th>
              <th onClick={() => handleSort("name")} style={{ cursor: 'pointer', userSelect: 'none' }}>
                નામ <SortIcon field="name" />
              </th>
              <th onClick={() => handleSort("village")} style={{ cursor: 'pointer', userSelect: 'none' }}>
                ગામ <SortIcon field="village" />
              </th>
              <th onClick={() => handleSort("address")} style={{ cursor: 'pointer', userSelect: 'none' }}>
                સરનામું <SortIcon field="address" />
              </th>
              <th onClick={() => handleSort("mobile")} style={{ cursor: 'pointer', userSelect: 'none' }}>
                મોબાઈલ નંબર <SortIcon field="mobile" />
              </th>
              <th onClick={() => handleSort("whatsapp")} style={{ cursor: 'pointer', userSelect: 'none' }}>
                WhatsApp <SortIcon field="whatsapp" />
              </th>
              {filterCategory === "all" && (
                <th onClick={() => handleSort("categories")} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  કેટેગરી <SortIcon field="categories" />
                </th>
              )}
              <th onClick={() => handleSort("evening_29")} style={{ cursor: 'pointer', userSelect: 'none' }}>
                29/8 સાંજે <SortIcon field="evening_29" />
              </th>
              <th onClick={() => handleSort("morning_30")} style={{ cursor: 'pointer', userSelect: 'none' }}>
                30/8 સવારે <SortIcon field="morning_30" />
              </th>
              <th onClick={() => handleSort("afternoon_30")} style={{ cursor: 'pointer', userSelect: 'none' }}>
                30/8 બપોરે <SortIcon field="afternoon_30" />
              </th>
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
