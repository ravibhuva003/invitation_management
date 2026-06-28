import React, { useState, useMemo } from "react";
import { Download, FileSpreadsheet, FileText, ExternalLink, ArrowUpDown, Edit2, Trash2, Search, Plus } from "lucide-react";
import { CATEGORIES } from "./ContactForm";
import * as XLSX from "xlsx";

export default function ReportTable({ 
  contacts, 
  onEditContact, 
  onDeleteContact, 
  onAddDataView,
  activeCategory,
  setActiveCategory,
  googleSheetsViewUrl
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc"); // 'asc' or 'desc'

  // Filter contacts by active category and search query
  const filteredContacts = useMemo(() => {
    return contacts
      .filter((contact) => {
        // Category filter
        if (activeCategory !== "તમામ") {
          const hasInArray = Array.isArray(contact.categories) && contact.categories.includes(activeCategory);
          const hasInString = typeof contact.category === "string" && (
            contact.category === activeCategory || 
            contact.category.split(",").map(c => c.trim()).includes(activeCategory)
          );
          
          if (!hasInArray && !hasInString) {
            return false;
          }
        }

        // Search query filter
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          (contact.name || "").toLowerCase().includes(query) ||
          (contact.address || "").toLowerCase().includes(query) ||
          (contact.village || "").toLowerCase().includes(query) ||
          (contact.mobile || "").toLowerCase().includes(query) ||
          (contact.whatsapp || "").toLowerCase().includes(query) ||
          (contact.notes || "").toLowerCase().includes(query) ||
          (contact.category || "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        // Sorting logic
        if (!sortField) return 0;
        
        let valA = a[sortField] || "";
        let valB = b[sortField] || "";

        // Locale compare for Gujarati support in sorting
        let compareResult = 0;
        if (typeof valA === "string" && typeof valB === "string") {
          compareResult = valA.localeCompare(valB, "gu");
        } else {
          compareResult = valA < valB ? -1 : valA > valB ? 1 : 0;
        }

        return sortDirection === "asc" ? compareResult : -compareResult;
      });
  }, [contacts, activeCategory, searchQuery, sortField, sortDirection]);

  // Pagination logic
  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredContacts.slice(startIndex, startIndex + pageSize);
  }, [filteredContacts, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredContacts.length / pageSize) || 1;

  // Change page
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Toggle Sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Delete handler
  const handleDelete = (id) => {
    if (confirm("શું તમે આ સંપર્ક ખરેખર ડિલીટ કરવા માંગો છો?")) {
      onDeleteContact(id);
    }
  };

  // Export to Excel (.xlsx) using SheetJS
  const exportToExcel = () => {
    try {
      const dataToExport = filteredContacts.map((c, index) => ({
        "ક્રમ": index + 1,
        "નામ": c.name || "",
        "સરનામું": c.address || "",
        "ગામ": c.village || "",
        "વોટ્સએપ નંબર": c.whatsapp || "",
        "મોબાઇલ નંબર": c.mobile || "",
        "નોંધ": c.notes || "",
        "કેટેગરી": c.category || "",
        "નોંધણી તારીખ": c.createdAt ? new Date(c.createdAt).toLocaleDateString("gu-IN") : ""
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
      
      const fileName = `AddressBook_${activeCategory}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      alert("Excel ડાઉનલોડ કરવામાં ભૂલ આવી: " + err.message);
    }
  };

  // Export to PDF (triggers window.print)
  const exportToPDF = () => {
    window.print();
  };

  // Open Google Sheet View URL
  const openGoogleSheet = () => {
    if (googleSheetsViewUrl) {
      window.open(googleSheetsViewUrl, "_blank");
    } else {
      alert("કૃપા કરીને પહેલા સેટિંગ્સમાં Google Sheet View Link સેટ કરો!");
    }
  };

  return (
    <div className="report-view-container">
      {/* Dynamic Title Header matching Screenshot 1 */}
      <div style={{
        backgroundColor: 'var(--primary)',
        color: 'white',
        padding: '12px 0',
        textAlign: 'center',
        fontSize: '20px',
        fontWeight: '700',
        borderRadius: '4px',
        marginBottom: '16px'
      }}>
        {activeCategory === "તમામ" ? "તમામ સંપર્કો" : activeCategory}
      </div>

      {/* Grid of buttons at top of report list matching screenshot 1 & 5 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: '8px',
        marginBottom: '20px'
      }}>
        {CATEGORIES.map((cat, idx) => (
          <button
            key={cat}
            className={`btn-cat ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory(cat);
              setCurrentPage(1);
            }}
          >
            {cat} ({idx + 1})
          </button>
        ))}
        {/* ડેટા ઉમેરો (13) */}
        <button
          className="btn-cat"
          style={{ backgroundColor: '#188038' }}
          onClick={onAddDataView}
        >
          ડેટા ઉમેરો (13)
        </button>
        {/* view all (14) */}
        <button
          className={`btn-cat ${activeCategory === "તમામ" ? 'active' : ''}`}
          onClick={() => {
            setActiveCategory("તમામ");
            setCurrentPage(1);
          }}
        >
          view all (14)
        </button>
      </div>

      {/* Actions and Search Box */}
      <div className="search-controls">
        {/* Download Button dropdown */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" style={{ fontSize: '13px' }} onClick={exportToExcel}>
            <FileSpreadsheet size={15} /> Excel Sheet
          </button>
          <button className="btn btn-outline" style={{ fontSize: '13px' }} onClick={exportToPDF}>
            <FileText size={15} /> PDF Print
          </button>
          {googleSheetsViewUrl && (
            <button className="btn btn-outline" style={{ fontSize: '13px' }} onClick={openGoogleSheet}>
              <ExternalLink size={15} /> Google Sheet View
            </button>
          )}
        </div>

        {/* Search */}
        <div className="search-box">
          <label style={{ fontWeight: '600' }}>Search:</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="શોધો..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Print-only title layout */}
      <div className="print-header">
        <h1>ગુજરાતી સરનામા બુક CRM - {activeCategory === "તમામ" ? "તમામ સંપર્કો" : activeCategory} રિપોર્ટ</h1>
        <p>તારીખ: {new Date().toLocaleDateString("gu-IN")} | કુલ રેકોર્ડ્સ: {filteredContacts.length}</p>
      </div>

      {/* Data Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("name")}>
                નામ <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
              </th>
              <th onClick={() => handleSort("address")}>
                સરનામું <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
              </th>
              <th onClick={() => handleSort("village")}>
                ગામ <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
              </th>
              <th onClick={() => handleSort("whatsapp")}>
                વોટ્સએપ નં <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
              </th>
              <th onClick={() => handleSort("mobile")}>
                મોબાઇલ નં <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
              </th>
              <th onClick={() => handleSort("notes")}>
                નોંધ <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
              </th>
              <th onClick={() => handleSort("category")}>
                કેટેગરી <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
              </th>
              <th className="actions-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedContacts.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  No matching records found
                </td>
              </tr>
            ) : (
              paginatedContacts.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.address || "-"}</td>
                  <td>{c.village || "-"}</td>
                  <td>
                    <a 
                      href={`https://wa.me/91${c.whatsapp}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}
                    >
                      {c.whatsapp}
                    </a>
                  </td>
                  <td>{c.mobile}</td>
                  <td>{c.notes || "-"}</td>
                  <td>
                    <span style={{ 
                      padding: '2px 6px', 
                      backgroundColor: 'rgba(26, 115, 232, 0.1)', 
                      borderRadius: '4px', 
                      fontSize: '11px',
                      color: 'var(--primary)',
                      fontWeight: '600'
                    }}>
                      {c.category}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      onClick={() => onEditContact(c)}
                      title="સુધારો"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      onClick={() => handleDelete(c.id)}
                      title="ડિલીટ"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer controls: pagination info and buttons */}
        <div className="table-controls">
          <div>
            Showing {filteredContacts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredContacts.length)} of {filteredContacts.length} entries{" "}
            {searchQuery && `(filtered from ${contacts.length} total entries)`}
          </div>

          <div className="pagination-btn-group">
            <button 
              className="btn btn-outline" 
              style={{ padding: '6px 12px', fontSize: '12px' }}
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </button>
            <button 
              className="btn btn-outline" 
              style={{ padding: '6px 12px', fontSize: '12px', marginLeft: '4px' }}
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
