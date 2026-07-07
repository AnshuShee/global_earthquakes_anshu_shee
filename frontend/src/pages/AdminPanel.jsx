import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Users, Database, ShieldAlert, Plus, Edit, Trash2, ShieldCheck, Play, Server, FileText, Check, AlertOctagon } from 'lucide-react';
import './AdminPanel.css';

const AdminPanel = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('users');

    // User tab states
    const [usersList, setUsersList] = useState([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [userError, setUserError] = useState('');
    const [userSuccess, setUserSuccess] = useState('');

    // Provision modal states
    const [showProvisionModal, setShowProvisionModal] = useState(false);
    const [provisionName, setProvisionName] = useState('');
    const [provisionEmail, setProvisionEmail] = useState('');
    const [provisionRole, setProvisionRole] = useState('user');
    const [provisionStatus, setProvisionStatus] = useState('Active');
    const [provisionPassword, setProvisionPassword] = useState('');

    // Edit user state
    const [editingUserId, setEditingUserId] = useState(null);
    const [editRole, setEditRole] = useState('user');
    const [editStatus, setEditStatus] = useState('Active');

    // Bulk Operations tab states
    const [bulkCreateText, setBulkCreateText] = useState('[\n  {\n    "id": "mockquake999",\n    "time": "2026-07-07T10:00:00Z",\n    "latitude": -5.340,\n    "longitude": 102.450,\n    "depth": 35.8,\n    "mag": 6.8,\n    "magType": "mw",\n    "net": "us",\n    "updated": "2026-07-07T10:15:00Z",\n    "place": "12km S of Bengkulu, Indonesia",\n    "status": "reviewed",\n    "locationSource": "us",\n    "magSource": "us"\n  }\n]');
    const [bulkUpdateText, setBulkUpdateText] = useState('[\n  {\n    "id": "mockquake999",\n    "mag": 7.2,\n    "place": "12km S of Bengkulu, Indonesia (Updated)"\n  }\n]');
    const [bulkDeleteText, setBulkDeleteText] = useState('mockquake999');
    const [hardDelete, setHardDelete] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkResult, setBulkResult] = useState('');

    // System Reports states
    const [reportsData, setReportsData] = useState(null);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);

    const fetchUsers = async () => {
        setUsersLoading(true);
        setUserError('');
        try {
            const res = await api.get('/users');
            setUsersList(res.data.data || []);
        } catch (err) {
            setUserError(err.response?.data?.message || 'Failed to fetch users list.');
        } finally {
            setUsersLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'reports') {
            fetchReports();
        }
    }, [activeTab]);

    const fetchReports = async () => {
        setReportsLoading(true);
        try {
            const [reportsRes, analyticsRes] = await Promise.all([
                api.get('/admin/reports'),
                api.get('/admin/analytics')
            ]);
            setReportsData(reportsRes.data);
            setAnalyticsData(analyticsRes.data);
        } catch (err) {
            console.error('Failed to load reports:', err);
        } finally {
            setReportsLoading(false);
        }
    };

    // User Actions
    const handleProvisionUser = async (e) => {
        e.preventDefault();
        setUserError('');
        setUserSuccess('');

        try {
            const payload = {
                name: provisionName,
                email: provisionEmail,
                password: provisionPassword,
                role: provisionRole,
                status: provisionStatus
            };

            const res = await api.post('/users', payload);
            if (res.data.success) {
                setUserSuccess(`User ${provisionName} successfully provisioned!`);
                setShowProvisionModal(false);
                // Reset inputs
                setProvisionName('');
                setProvisionEmail('');
                setProvisionPassword('');
                setProvisionRole('user');
                setProvisionStatus('Active');
                fetchUsers();
            }
        } catch (err) {
            setUserError(err.response?.data?.message || 'Provisioning user profile failed.');
        }
    };

    const handleEditUser = (userItem) => {
        setEditingUserId(userItem._id);
        setEditRole(userItem.role);
        setEditStatus(userItem.status || 'Active');
    };

    const handleSaveUserUpdate = async (userId) => {
        setUserError('');
        setUserSuccess('');

        try {
            const res = await api.patch(`/users/${userId}`, {
                role: editRole,
                status: editStatus
            });

            if (res.data.success) {
                setUserSuccess('User properties updated successfully.');
                setEditingUserId(null);
                fetchUsers();
            }
        } catch (err) {
            setUserError(err.response?.data?.message || 'Failed to update user parameters.');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to permanently delete this user account?')) return;
        setUserError('');
        setUserSuccess('');

        try {
            const res = await api.delete(`/users/${userId}`);
            if (res.data.success) {
                setUserSuccess('User account successfully deleted.');
                fetchUsers();
            }
        } catch (err) {
            setUserError(err.response?.data?.message || 'Failed to delete user.');
        }
    };

    // Bulk operation actions
    const handleBulkCreate = async () => {
        setBulkLoading(true);
        setBulkResult('');
        try {
            const records = JSON.parse(bulkCreateText);
            const res = await api.post('/earthquakes/bulk-create', { records });
            setBulkResult(JSON.stringify(res.data, null, 2));
        } catch (err) {
            setBulkResult(`Validation/API Error: ${err.message}\n` + (err.response?.data ? JSON.stringify(err.response.data, null, 2) : ''));
        } finally {
            setBulkLoading(false);
        }
    };

    const handleBulkUpdate = async () => {
        setBulkLoading(true);
        setBulkResult('');
        try {
            const updates = JSON.parse(bulkUpdateText);
            const res = await api.patch('/earthquakes/bulk-update', { updates });
            setBulkResult(JSON.stringify(res.data, null, 2));
        } catch (err) {
            setBulkResult(`Validation/API Error: ${err.message}\n` + (err.response?.data ? JSON.stringify(err.response.data, null, 2) : ''));
        } finally {
            setBulkLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm('Proceed with bulk deletion of these records?')) return;
        setBulkLoading(true);
        setBulkResult('');
        try {
            const ids = bulkDeleteText.split(',').map(s => s.trim()).filter(s => s !== '');
            const res = await api.delete(`/earthquakes/bulk-delete?hard=${hardDelete}`, { data: { ids } });
            setBulkResult(JSON.stringify(res.data, null, 2));
        } catch (err) {
            setBulkResult(`API Error: ${err.message}\n` + (err.response?.data ? JSON.stringify(err.response.data, null, 2) : ''));
        } finally {
            setBulkLoading(false);
        }
    };

    return (
        <div className="admin-page">
            <header className="page-header">
                <h1>Administrative Operations Center</h1>
                <p className="text-muted">Centralized admin controls for user management, bulk loading, and reports.</p>
            </header>

            {/* Tabs selectors */}
            <div className="admin-tabs">
                <button
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <Users size={18} />
                    <span>User Accounts</span>
                </button>
                <button
                    className={`tab-btn ${activeTab === 'bulk' ? 'active' : ''}`}
                    onClick={() => setActiveTab('bulk')}
                >
                    <Database size={18} />
                    <span>Bulk Operations</span>
                </button>
                <button
                    className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reports')}
                >
                    <Server size={18} />
                    <span>System & Analytics Reports</span>
                </button>
            </div>

            {userError && <div className="profile-error">{userError}</div>}
            {userSuccess && <div className="profile-success">{userSuccess}</div>}

            {/* TAB CONTENTS: USERS */}
            {activeTab === 'users' && (
                <div className="tab-pane glass-panel">
                    <div className="pane-header">
                        <h2>User Database Registry</h2>
                        <button className="btn-primary" onClick={() => setShowProvisionModal(true)}>
                            <Plus size={16} /> Provision User
                        </button>
                    </div>

                    {usersLoading ? (
                        <div className="loading-state">Retrieving user roster...</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>User Profile Name</th>
                                        <th>Email Address</th>
                                        <th>Role Privilege</th>
                                        <th>Account Status</th>
                                        <th>Registered Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersList.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-4">No users found.</td>
                                        </tr>
                                    ) : (
                                        usersList.map((userItem) => (
                                            <tr key={userItem._id}>
                                                <td className="user-name-col">
                                                    <div className="user-initial">
                                                        {userItem.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span>{userItem.name}</span>
                                                </td>
                                                <td>{userItem.email}</td>
                                                <td>
                                                    {editingUserId === userItem._id ? (
                                                        <select
                                                            className="form-input small"
                                                            value={editRole}
                                                            onChange={(e) => setEditRole(e.target.value)}
                                                        >
                                                            <option value="user">User</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`role-tag ${userItem.role}`}>
                                                            {userItem.role}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {editingUserId === userItem._id ? (
                                                        <select
                                                            className="form-input small"
                                                            value={editStatus}
                                                            onChange={(e) => setEditStatus(e.target.value)}
                                                        >
                                                            <option value="Active">Active</option>
                                                            <option value="Suspended">Suspended</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`status-tag ${userItem.status || 'Active'}`}>
                                                            {userItem.status || 'Active'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>{new Date(userItem.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        {editingUserId === userItem._id ? (
                                                            <>
                                                                <button
                                                                    className="btn-icon save-btn"
                                                                    onClick={() => handleSaveUserUpdate(userItem._id)}
                                                                    title="Save Changes"
                                                                >
                                                                    <Check size={16} />
                                                                </button>
                                                                <button
                                                                    className="btn-icon"
                                                                    onClick={() => setEditingUserId(null)}
                                                                    title="Cancel"
                                                                >
                                                                    <Trash2 size={16} style={{ color: 'var(--text-muted)' }} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    className="btn-icon"
                                                                    onClick={() => handleEditUser(userItem)}
                                                                    title="Edit Role & Status"
                                                                    disabled={userItem.email === 'admin@example.com'}
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                                <button
                                                                    className="btn-icon delete-btn"
                                                                    onClick={() => handleDeleteUser(userItem._id)}
                                                                    title="Delete User"
                                                                    disabled={userItem.email === 'admin@example.com'}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENTS: BULK OPERATIONS */}
            {activeTab === 'bulk' && (
                <div className="tab-pane bulk-pane">
                    <div className="bulk-grid">
                        <div className="bulk-card glass-panel">
                            <div className="card-header">
                                <h3>Bulk Create Earthquakes</h3>
                                <p className="text-muted">Insert standard JSON arrays of seismic records.</p>
                            </div>
                            <textarea
                                className="form-input json-textarea"
                                value={bulkCreateText}
                                onChange={(e) => setBulkCreateText(e.target.value)}
                                rows={10}
                            />
                            <button className="btn-primary" onClick={handleBulkCreate} disabled={bulkLoading}>
                                <Plus size={16} /> Run Bulk Create
                            </button>
                        </div>

                        <div className="bulk-card glass-panel">
                            <div className="card-header">
                                <h3>Bulk Update Earthquakes</h3>
                                <p className="text-muted">Modify values matching record dataset ID.</p>
                            </div>
                            <textarea
                                className="form-input json-textarea"
                                value={bulkUpdateText}
                                onChange={(e) => setBulkUpdateText(e.target.value)}
                                rows={10}
                            />
                            <button className="btn-primary" onClick={handleBulkUpdate} disabled={bulkLoading}>
                                <RefreshCw size={16} /> Run Bulk Update
                            </button>
                        </div>

                        <div className="bulk-card glass-panel" style={{ gridColumn: 'span 2' }}>
                            <div className="card-header">
                                <h3>Bulk Delete Earthquakes</h3>
                                <p className="text-muted">Perform soft or hard bulk deletion. Enter IDs comma separated.</p>
                            </div>
                            <div className="delete-options" style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. us10004aif, us10004bi9"
                                    value={bulkDeleteText}
                                    onChange={(e) => setBulkDeleteText(e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={hardDelete}
                                        onChange={(e) => setHardDelete(e.target.checked)}
                                    />
                                    <span>Hard Delete Permanent</span>
                                </label>
                            </div>
                            <button className="btn-primary" style={{ background: 'var(--accent-danger)' }} onClick={handleBulkDelete} disabled={bulkLoading}>
                                <Trash2 size={16} style={{ color: 'white' }} /> Run Bulk Delete
                            </button>
                        </div>
                    </div>

                    {/* Execution Output result */}
                    <div className="bulk-result-card glass-panel">
                        <h3>Execution Output Reports</h3>
                        <pre className="output-console">
                            {bulkLoading ? 'Processing operations...' : bulkResult || 'No task executed yet.'}
                        </pre>
                    </div>
                </div>
            )}

            {/* TAB CONTENTS: REPORTS & SYSTEM HEALTH */}
            {activeTab === 'reports' && (
                <div className="tab-pane reports-pane">
                    <div className="reports-grid">
                        {reportsLoading ? (
                            <div className="loading-state">Compiling administrative telemetry reports...</div>
                        ) : (
                            <>
                                {/* Uptime and Server Status Card */}
                                <div className="stat-card glass-panel wide">
                                    <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-primary)' }}>
                                        <Server size={24} />
                                    </div>
                                    <div className="stat-info">
                                        <h3>Sysadmin Server Report</h3>
                                        <p className="stat-value">{reportsData?.message || 'Report Loaded'}</p>
                                        <span className="stat-subtitle">
                                            Database: {reportsData?.databaseStatus || 'UNKNOWN'} | Process Uptime: {reportsData?.uptimeSeconds ? `${Math.round(reportsData.uptimeSeconds / 60)} min` : 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {/* Aggregates details */}
                                <div className="report-detail-group">
                                    <div className="glass-panel report-box">
                                        <h3>Admin Location Analysis</h3>
                                        <p className="text-muted" style={{ marginBottom: '1rem' }}>Admin route endpoint: {reportsData?.endpoints?.locationAnalysis || '/admin/analytics'}</p>
                                        <pre className="json-box">
                                            {JSON.stringify(analyticsData || { message: 'Loading...' }, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* PROVISION USER MODAL */}
            {showProvisionModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel">
                        <div className="modal-header">
                            <h2>Provision New User Profile</h2>
                            <button className="close-btn" onClick={() => setShowProvisionModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleProvisionUser}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={provisionName}
                                    onChange={(e) => setProvisionName(e.target.value)}
                                    placeholder="e.g. Alice Smith"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={provisionEmail}
                                    onChange={(e) => setProvisionEmail(e.target.value)}
                                    placeholder="e.g. alice@example.com"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Temporary Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={provisionPassword}
                                    onChange={(e) => setProvisionPassword(e.target.value)}
                                    placeholder="Password or leave blank for default"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Privilege Level</label>
                                <select
                                    className="form-input"
                                    value={provisionRole}
                                    onChange={(e) => setProvisionRole(e.target.value)}
                                >
                                    <option value="user">User (Read-only)</option>
                                    <option value="admin">Admin (Read-Write)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Initial Status</label>
                                <select
                                    className="form-input"
                                    value={provisionStatus}
                                    onChange={(e) => setProvisionStatus(e.target.value)}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Suspended">Suspended</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="btn-primary">Provision Profile</button>
                                <button type="button" className="btn-page" onClick={() => setShowProvisionModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
