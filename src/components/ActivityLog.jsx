import React, { useState, useMemo } from "react";
import { History, Search, Clock } from "lucide-react";

export default function ActivityLog({ activityLogs }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);

  // Filter logs by search query
  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        (log.adminName || "").toLowerCase().includes(query) ||
        (log.action || "").toLowerCase().includes(query) ||
        (log.timestamp ? new Date(log.timestamp).toLocaleDateString("gu-IN") : "").includes(query)
      );
    });
  }, [activityLogs, searchQuery]);

  // Paginated logs
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatDateTime = (timestampStr) => {
    if (!timestampStr) return "-";
    try {
      const date = new Date(timestampStr);
      const optionsDate = { day: '2-digit', month: '2-digit', year: 'numeric' };
      const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
      
      const d = date.toLocaleDateString("gu-IN", optionsDate);
      const t = date.toLocaleTimeString("gu-IN", optionsTime);
      return `${d} | ${t}`;
    } catch (e) {
      return timestampStr;
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={20} style={{ color: 'var(--primary)' }} />
          એડમિન પ્રવૃત્તિ લૉગ (Activity Log)
        </h2>

        {/* Search */}
        <div className="search-box">
          <label style={{ fontWeight: '600' }}>Search Logs:</label>
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

      {/* Logs Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '180px' }}>એડમિનનું નામ</th>
              <th>પ્રવૃત્તિ વિગત</th>
              <th style={{ width: '220px' }}><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} /> તારીખ અને સમય</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  કોઈ પ્રવૃત્તિ લૉગ મળી આવ્યા નથી
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => (
                <tr key={log.id}>
                  <td><strong>{log.adminName}</strong></td>
                  <td>{log.action}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{formatDateTime(log.timestamp)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="table-controls">
          <div>
            Showing {filteredLogs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} entries
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
