import React, { useEffect, useState } from 'react';
import { PRIMARY_GOLD, CHARCOAL, THEMED_LIGHT_BG } from '@utils/constants';
import { Loaders } from '@components/ui/Loader';
import NotificationDropdown from '@components/ui/NotificationDropdown';

const EVENT_TYPES = ['Action', 'Error', 'User Creation'];
const SEVERITIES = ['Info', 'Warning', 'Error'];

const LogDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ eventType: '', severity: '', user: '', date: '' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Fetch logs from backend API (placeholder)
    setLoading(true);
    fetch('/api/activity-logs')
      .then(res => res.json())
      .then(data => {
        setLogs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredLogs = logs.filter(log => {
    return (
      (!filters.eventType || log.eventType === filters.eventType) &&
      (!filters.severity || log.severity === filters.severity) &&
      (!filters.user || log.userId === filters.user) &&
      (!filters.date || log.timestamp.startsWith(filters.date)) &&
      (!search || log.description.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div style={{ background: THEMED_LIGHT_BG, minHeight: '100vh', padding: '2rem' }}>
      <h2 style={{ color: PRIMARY_GOLD }}>Security & Activity Logs</h2>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
        <select name="eventType" value={filters.eventType} onChange={handleFilterChange}>
          <option value="">All Event Types</option>
          {EVENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        <select name="severity" value={filters.severity} onChange={handleFilterChange}>
          <option value="">All Severities</option>
          {SEVERITIES.map(sev => <option key={sev} value={sev}>{sev}</option>)}
        </select>
        <input
          name="user"
          placeholder="User ID"
          value={filters.user}
          onChange={handleFilterChange}
        />
        <input
          name="date"
          type="date"
          value={filters.date}
          onChange={handleFilterChange}
        />
        <input
          placeholder="Search description"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {loading ? <Loaders /> : (
        <table style={{ width: '100%', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px #ccc' }}>
          <thead style={{ background: PRIMARY_GOLD, color: CHARCOAL }}>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Role</th>
              <th>Event Type</th>
              <th>Severity</th>
              <th>Description</th>
              <th>Affected Resource</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}>No logs found.</td></tr>
            ) : filteredLogs.map(log => (
              <tr key={log._id}>
                <td>{log.timestamp}</td>
                <td>{log.userId}</td>
                <td>{log.role}</td>
                <td>{log.eventType}</td>
                <td>{log.severity}</td>
                <td>{log.description}</td>
                <td>{log.affectedResource || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <NotificationDropdown />
    </div>
  );
};

export default LogDashboard;
