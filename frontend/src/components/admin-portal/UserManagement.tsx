import React, { useState, useEffect } from 'react';
import {
    Users, Search, UserPlus, Edit3, Trash2,
    Eye, X, Download, Save,
    Shield, Key,
    Mail, Phone, Calendar, BookOpen, AlertCircle,
    MoreVertical, Hash
} from 'lucide-react';
import { type User, getFullAvatarUrl } from '../../data/mockAdminData';
import { userService } from '../../services/apiService';
import { toast } from '../../utils/toast';
import './UserManagement.css';

// Map backend user to frontend User interface
const mapUser = (user: any): User => ({
    id: String(user.id),
    fullName: user.full_name,
    email: user.email,
    nic: user.nic,
    phone: user.phone || '',
    role: user.role,
    status: user.status,
    studentNumber: user.student_number,
    avatar: user.avatar ? getFullAvatarUrl(user.avatar) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random`,
    joinDate: user.created_at ? user.created_at.split('T')[0] : 'N/A',
    lastLogin: user.updated_at || new Date().toISOString(),
    courses: []
});

export const UserManagement: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editFormData, setEditFormData] = useState<User | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const [newUser, setNewUser] = useState({
        fullName: '',
        email: '',
        nic: '',
        phone: '',
        role: 'student'
    });
    const [isLoading, setIsLoading] = useState(false);

    const roles = [
        { key: 'all', label: 'All Roles', plural: 'All Users' },
        { key: 'super_admin', label: 'Super Admin', plural: 'Super Admins', color: '#DC2626' },
        { key: 'director', label: 'Director', plural: 'Directors', color: '#9333EA' },
        { key: 'coordinator', label: 'Course Coordinator', plural: 'Course Coordinators', color: '#2563EB' },
        { key: 'secretary', label: 'Course Secretary', plural: 'Course Secretaries', color: '#0891B2' },
        { key: 'lecturer', label: 'Lecturer', plural: 'Lecturers', color: '#4F46E5' },
        { key: 'pro_student', label: 'Pro Student', plural: 'Pro Students', color: '#D97706' },
        { key: 'student', label: 'Student', plural: 'Students', color: '#059669' },
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await userService.getAll();
            setUsers(data.map(mapUser));
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getRoleStyle = (role: string) => {
        const found = roles.find(r => r.key === role);
        const color = found?.color || '#64748B';
        return { bg: `${color}15`, text: color };
    };

    const getRoleLabel = (role: string) => {
        if (role === 'coordinator') return 'Course Coordinator';
        if (role === 'secretary') return 'Course Secretary';
        return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const filteredUsers = users.filter(user => {
        const nameMatch = user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const emailMatch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const idMatch = user.studentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        
        const matchesSearch = nameMatch || emailMatch || idMatch;
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
    });

    const generateStudentNumber = (role: string) => {
        const yearDigits = new Date().getFullYear().toString().slice(-2);
        
        // Count users of this specific role to determine the next number
        // In a real production app, this would be handled by the backend
        const roleUsers = users.filter(u => u.role === role);
        const nextNum = String(roleUsers.length + 1).padStart(4, '0');

        switch (role) {
            case 'super_admin':
                return `CODL/SA${nextNum}`;
            case 'director':
                return `CODL/DR${nextNum}`;
            case 'coordinator':
                return `CODL/CC${nextNum}`;
            case 'secretary':
                return `CODL/CS${nextNum}`;
            case 'lecturer':
                return `CODL/LC${nextNum}`;
            case 'student':
            case 'pro_student':
                return `${yearDigits}CODL${nextNum}`;
            default:
                return `CODL/UN${nextNum}`; // Unknown
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const studentNumber = generateStudentNumber(newUser.role);
        
        try {
            const payload = {
                full_name: newUser.fullName,
                email: newUser.email,
                nic: newUser.nic,
                phone: newUser.phone,
                role: newUser.role,
                status: 'active',
                student_number: studentNumber,
                password: newUser.nic // Default password is NIC
            };

            await userService.create(payload);
            toast.success(`User created in Cloud DB!\n\nRegistration Number: ${studentNumber}\nDefault Password: ${newUser.nic}`, { title: 'Account Created' });
            setShowCreateModal(false);
            setNewUser({ fullName: '', email: '', nic: '', phone: '', role: 'student' });
            fetchUsers(); // Refresh list
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create user');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editFormData) return;
        setIsLoading(true);

        try {
            const payload = {
                full_name: editFormData.fullName,
                email: editFormData.email,
                nic: editFormData.nic,
                phone: editFormData.phone,
                role: editFormData.role,
                status: editFormData.status,
                student_number: editFormData.studentNumber
            };

            await userService.update(editFormData.id, payload);
            toast.success('User updated successfully!');
            setIsEditMode(false);
            setShowDetailModal(false);
            fetchUsers(); // Refresh list
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update user');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (user: User) => {
        if (user.role === 'super_admin') {
            toast.error('Super Administrators cannot be modified.');
            return;
        }
        if (window.confirm(`Reset password for ${user.fullName} to default (NIC: ${user.nic})?`)) {
            try {
                await userService.resetPassword(user.id);
                toast.success('Password reset successfully!');
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to reset password');
            }
        }
        setOpenMenuId(null);
    };

    const handleDeleteUser = async (user: User) => {
        if (user.role === 'super_admin') {
            toast.error('Super Administrators cannot be deleted.');
            return;
        }
        if (window.confirm(`Are you sure you want to delete account for ${user.fullName}? This action cannot be undone.`)) {
            try {
                await userService.delete(user.id);
                // Update local state immediately for instant feedback
                setUsers(prev => prev.filter(u => u.id !== user.id));
                toast.success('User deleted successfully');
            } catch (err) {
                console.error('Delete failed:', err);
                toast.error('Failed to delete user. Please try again.');
            }
            setOpenMenuId(null);
        }
    };

    const handleChangeRoleAction = (user: User) => {
        if (user.role === 'super_admin') {
            toast.error('Super Administrators cannot be modified.');
            return;
        }
        setSelectedUser(user);
        setEditFormData({ ...user });
        setIsEditMode(true);
        setShowDetailModal(true);
        setOpenMenuId(null);
    };

    return (
        <div className="um-container">
            {/* Page Header */}
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">User Management</h1>
                    <p className="admin-page-subtitle">Manage all users, create accounts, and assign roles across the system.</p>
                </div>
                <div className="admin-header-actions">
                    <button className="admin-btn-outline" onClick={() => {}}>
                        <Download size={16} /> Export
                    </button>
                    <button className="admin-btn-primary" onClick={() => setShowCreateModal(true)}>
                        <UserPlus size={16} /> Create User
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="um-stats-row">
                {roles.filter(r => r.key !== 'all').map(role => {
                    const count = users.filter(u => u.role === role.key).length;
                    return (
                        <div
                            className={`um-stat-chip ${roleFilter === role.key ? 'active' : ''}`}
                            key={role.key}
                            onClick={() => setRoleFilter(roleFilter === role.key ? 'all' : role.key)}
                            style={{
                                borderColor: roleFilter === role.key ? role.color : undefined,
                                background: roleFilter === role.key ? `${role.color}10` : undefined,
                            }}
                        >
                            <span className="um-stat-count" style={{ color: role.color }}>{count}</span>
                            <span className="um-stat-label">{(role as any).plural || `${role.label}s`}</span>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="um-filters">
                <div className="um-search">
                    <Search size={18} className="um-search-icon" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or student number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="um-clear" onClick={() => setSearchTerm('')}><X size={14} /></button>
                    )}
                </div>

                <div className="um-filter-group">
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="um-select"
                    >
                        {roles.map(r => (
                            <option key={r.key} value={r.key}>{r.label}</option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="um-select"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="um-table-card">
                <div className="um-table-header">
                    <h3><Users size={18} /> All Users ({filteredUsers.length})</h3>
                </div>

                <div className="um-table-wrapper">
                    <table className="um-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>ID</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Last Login</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => {
                                const roleStyle = getRoleStyle(user.role);
                                return (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="um-user-cell">
                                                <img src={user.avatar} alt={user.fullName} className="um-user-avatar" />
                                                <div>
                                                    <span className="um-user-name">{user.fullName}</span>
                                                    <span className="um-user-email">{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="um-user-id">{user.studentNumber}</td>
                                        <td>
                                            <span className="um-role-badge" style={{ background: roleStyle.bg, color: roleStyle.text }}>
                                                {getRoleLabel(user.role)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`um-status-badge ${user.status}`}>
                                                <span className="um-status-dot"></span>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="um-last-login">
                                            {new Date(user.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </td>
                                        <td style={{ position: 'relative' }}>
                                            <div className="um-actions">
                                                <button className="um-action-btn" title="View Details" onClick={() => { setSelectedUser(user); setShowDetailModal(true); }}>
                                                    <Eye size={15} />
                                                </button>
                                                {user.role !== 'super_admin' && (
                                                    <button 
                                                        className={`um-action-btn ${openMenuId === user.id ? 'active' : ''}`} 
                                                        onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                                                    >
                                                        <MoreVertical size={18} />
                                                    </button>
                                                )}
                                            </div>

                                            {openMenuId === user.id && (
                                                <>
                                                    <div className="um-menu-overlay" onClick={() => setOpenMenuId(null)} />
                                                    <div className="um-dropdown-menu">
                                                        <button onClick={() => handleResetPassword(user)}>
                                                            <Key size={14} /> Reset Password
                                                        </button>
                                                        <button onClick={() => handleChangeRoleAction(user)}>
                                                            <Edit3 size={14} /> Change Role
                                                        </button>
                                                        <div className="um-menu-divider" />
                                                        <button className="delete" onClick={() => handleDeleteUser(user)}>
                                                            <Trash2 size={14} /> Delete Account
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {isLoading ? (
                        <div className="um-loading">
                            <div className="um-spinner"></div>
                            <p>Loading users...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="um-empty">
                            <Users size={40} />
                            <p>No users match your search criteria</p>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="um-modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="um-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="um-modal-header">
                            <div>
                                <h2>Create New User</h2>
                                <p>Fill in the details to create a new user account. Registration number will be auto-generated.</p>
                            </div>
                            <button className="um-modal-close" onClick={() => setShowCreateModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser}>
                            <div className="um-modal-body">
                                <div className="um-info-banner">
                                    <AlertCircle size={16} />
                                    <span>Registration number will be auto-generated. The NIC number will be used as the default password.</span>
                                </div>

                                <div className="um-form-grid">
                                    <div className="um-form-group full-width">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter full name"
                                            value={newUser.fullName}
                                            onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="um-form-group">
                                        <label>NIC Number</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 200012345678"
                                            value={newUser.nic}
                                            onChange={(e) => setNewUser({ ...newUser, nic: e.target.value })}
                                            required
                                        />
                                        <span className="um-form-hint">Used as default password</span>
                                    </div>

                                    <div className="um-form-group">
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="user@example.com"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="um-form-group">
                                        <label>Phone Number</label>
                                        <input
                                            type="tel"
                                            placeholder="07XXXXXXXX"
                                            value={newUser.phone}
                                            onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="um-form-group">
                                        <label>Role</label>
                                        <select
                                            value={newUser.role}
                                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                            required
                                        >
                                            {roles.filter(r => r.key !== 'all').map(r => (
                                                <option key={r.key} value={r.key}>{r.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="um-auto-gen-preview">
                                    <div className="um-gen-item">
                                        <Hash size={14} />
                                        <span className="um-gen-label">Auto-Generated Reg No:</span>
                                        <span className="um-gen-value">{generateStudentNumber(newUser.role)}</span>
                                    </div>
                                    <div className="um-gen-item">
                                        <Shield size={14} />
                                        <span className="um-gen-label">Default Password:</span>
                                        <span className="um-gen-value">{newUser.nic || '(NIC Number)'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="um-modal-footer-integrated">
                                <button type="button" className="um-btn-cancel" onClick={() => setShowCreateModal(false)} disabled={isLoading}>Cancel</button>
                                <button type="submit" className="um-btn-create" disabled={isLoading}>
                                    {isLoading ? 'Creating...' : <><UserPlus size={16} /> Create User Account</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* User Detail Modal */}
            {showDetailModal && selectedUser && (
                <div className="um-modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="um-modal detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="um-modal-header">
                            <h2>{isEditMode ? 'Edit User Profile' : 'User Profile'}</h2>
                            <button className="um-modal-close" onClick={() => {
                                setShowDetailModal(false);
                                setIsEditMode(false);
                            }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="um-modal-body">
                            {isEditMode && editFormData ? (
                                <form id="edit-user-form" onSubmit={handleSaveEdit}>
                                    <div className="um-detail-profile" style={{ marginBottom: '32px' }}>
                                        <img src={editFormData.avatar} alt={editFormData.fullName} className="um-detail-avatar" />
                                        <div className="um-detail-info" style={{ flex: 1 }}>
                                            <div className="cm-form-group" style={{ marginBottom: '12px', width: '100%' }}>
                                                <label>Full Name</label>
                                                <input 
                                                    type="text" 
                                                    name="fullName" 
                                                    value={editFormData.fullName} 
                                                    onChange={handleEditChange} 
                                                    className="admin-input" 
                                                    required 
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <div className="cm-form-group" style={{ flex: 1 }}>
                                                    <label>Role</label>
                                                    <select 
                                                        name="role" 
                                                        value={editFormData.role} 
                                                        onChange={handleEditChange} 
                                                        className="admin-input"
                                                    >
                                                        {roles.filter(r => r.key !== 'all').map(r => (
                                                            <option key={r.key} value={r.key}>{r.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="cm-form-group" style={{ flex: 1 }}>
                                                    <label>Status</label>
                                                    <select 
                                                        name="status" 
                                                        value={editFormData.status} 
                                                        onChange={handleEditChange} 
                                                        className="admin-input"
                                                    >
                                                        <option value="active">Active</option>
                                                        <option value="inactive">Inactive</option>
                                                        <option value="suspended">Suspended</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="um-detail-grid">
                                        <div className="um-detail-item edit-field">
                                            <span className="um-dl"><Mail size={14} /> Email Address</span>
                                            <input 
                                                type="email" 
                                                name="email" 
                                                value={editFormData.email} 
                                                onChange={handleEditChange} 
                                                className="admin-input" 
                                                required 
                                            />
                                        </div>
                                        <div className="um-detail-item edit-field">
                                            <span className="um-dl"><Phone size={14} /> Phone Number</span>
                                            <input 
                                                type="tel" 
                                                name="phone" 
                                                value={editFormData.phone} 
                                                onChange={handleEditChange} 
                                                className="admin-input" 
                                                required 
                                            />
                                        </div>
                                        <div className="um-detail-item edit-field">
                                            <span className="um-dl"><Shield size={14} /> NIC Number</span>
                                            <input 
                                                type="text" 
                                                name="nic" 
                                                value={editFormData.nic} 
                                                onChange={handleEditChange} 
                                                className="admin-input" 
                                                required 
                                            />
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="um-detail-profile">
                                        <img src={selectedUser.avatar} alt={selectedUser.fullName} className="um-detail-avatar" />
                                        <div className="um-detail-info">
                                            <h3>{selectedUser.fullName}</h3>
                                            <span className="um-detail-id">{selectedUser.studentNumber}</span>
                                            <div className="um-detail-badges">
                                                <span className="um-role-badge" style={{
                                                    background: getRoleStyle(selectedUser.role).bg,
                                                    color: getRoleStyle(selectedUser.role).text
                                                }}>
                                                    {getRoleLabel(selectedUser.role)}
                                                </span>
                                                <span className={`um-status-badge ${selectedUser.status}`}>
                                                    <span className="um-status-dot"></span>
                                                    {selectedUser.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="um-detail-grid">
                                        <div className="um-detail-item">
                                            <span className="um-dl"><Mail size={14} /> Email</span>
                                            <span className="um-dv">{selectedUser.email}</span>
                                        </div>
                                        <div className="um-detail-item">
                                            <span className="um-dl"><Phone size={14} /> Phone</span>
                                            <span className="um-dv">{selectedUser.phone}</span>
                                        </div>
                                        <div className="um-detail-item">
                                            <span className="um-dl"><Shield size={14} /> NIC</span>
                                            <span className="um-dv">{selectedUser.nic}</span>
                                        </div>
                                        <div className="um-detail-item">
                                            <span className="um-dl"><Calendar size={14} /> Joined</span>
                                            <span className="um-dv">{selectedUser.joinDate}</span>
                                        </div>
                                        <div className="um-detail-item">
                                            <span className="um-dl"><Calendar size={14} /> Last Login</span>
                                            <span className="um-dv">{new Date(selectedUser.lastLogin).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {selectedUser.courses.length > 0 && (
                                        <div className="um-detail-courses">
                                            <h4><BookOpen size={16} /> Enrolled Courses</h4>
                                            <div className="um-dc-list">
                                                {selectedUser.courses.map((course, idx) => (
                                                    <div className="um-dc-item" key={idx}>
                                                        <BookOpen size={14} />
                                                        <span>{course}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {(selectedUser.role === 'student' || selectedUser.role === 'pro_student') && (
                                        <div className="um-performance-summary">
                                            <h4>Performance Summary</h4>
                                            <div className="um-perf-grid">
                                                <div className="um-perf-card">
                                                    <span className="um-perf-val">3.42</span>
                                                    <span className="um-perf-label">Current GPA</span>
                                                </div>
                                                <div className="um-perf-card">
                                                    <span className="um-perf-val">28</span>
                                                    <span className="um-perf-label">Credits Earned</span>
                                                </div>
                                                <div className="um-perf-card">
                                                    <span className="um-perf-val">92%</span>
                                                    <span className="um-perf-label">Attendance</span>
                                                </div>
                                                <div className="um-perf-card">
                                                    <span className="um-perf-val">0</span>
                                                    <span className="um-perf-label">Warnings</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {isEditMode && (
                            <div className="um-modal-footer-integrated">
                                <button type="button" className="um-btn-cancel" onClick={() => setIsEditMode(false)} disabled={isLoading}>Discard Changes</button>
                                <button type="submit" form="edit-user-form" className="um-btn-create" style={{ background: 'linear-gradient(to right, #2563EB, #1D4ED8)' }} disabled={isLoading}>
                                    {isLoading ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
