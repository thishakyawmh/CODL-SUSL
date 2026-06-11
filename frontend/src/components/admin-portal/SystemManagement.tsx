import React, { useState } from 'react';
import {
    Shield, Edit3, Users, CheckCircle2, XCircle,
    Lock, Unlock, ChevronDown, Info
} from 'lucide-react';
import { mockRoleConfigs } from '../../data/mockAdminData';
import './RoleManagement.css';

export const SystemManagement: React.FC = () => {
    const [expandedRole, setExpandedRole] = useState<string | null>('super_admin');

    const toggleRole = (role: string) => {
        setExpandedRole(expandedRole === role ? null : role);
    };

    const PermissionCheck = ({ checked }: { checked: boolean }) => (
        checked ? (
            <span className="rm-perm-check yes"><CheckCircle2 size={14} /></span>
        ) : (
            <span className="rm-perm-check no"><XCircle size={14} /></span>
        )
    );

    return (
        <div className="rm-container">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">System Management</h1>
                    <p className="admin-page-subtitle">Configure system-wide settings, manage roles, and monitor infrastructure health.</p>
                </div>
            </div>

            {/* Info Banner */}
            <div className="rm-info-banner">
                <Info size={18} />
                <p>
                    The <strong>Super Admin</strong> role has unrestricted access to all modules. Other roles can be configured by adjusting their 
                    permissions below. Changes will affect what each user role can access in their dashboard.
                </p>
            </div>

            {/* Role Cards Overview */}
            <div className="rm-roles-grid">
                {mockRoleConfigs.map(config => (
                    <div
                        className={`rm-role-card ${expandedRole === config.role ? 'expanded' : ''}`}
                        key={config.role}
                        style={{ borderTopColor: config.color }}
                    >
                        <div className="rm-card-top" onClick={() => toggleRole(config.role)}>
                            <div className="rm-card-info">
                                <div className="rm-role-icon" style={{ background: `${config.color}15`, color: config.color }}>
                                    <Shield size={18} />
                                </div>
                                <div>
                                    <h3 style={{ color: config.color }}>{config.label}</h3>
                                    <span className="rm-user-count">
                                        <Users size={12} /> {config.userCount} user{config.userCount > 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                            <ChevronDown size={16} className={`rm-expand-icon ${expandedRole === config.role ? 'rotated' : ''}`} />
                        </div>

                        {expandedRole === config.role && (
                            <div className="rm-card-permissions">
                                <div className="rm-perm-table-wrapper">
                                    <table className="rm-perm-table">
                                        <thead>
                                            <tr>
                                                <th>Module</th>
                                                <th>View</th>
                                                <th>Create</th>
                                                <th>Edit</th>
                                                <th>Delete</th>
                                                <th>Approve</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {config.permissions.map(perm => (
                                                <tr key={perm.module}>
                                                    <td className="rm-module-name">
                                                        {perm.view ? <Unlock size={12} className="rm-module-icon unlocked" /> : <Lock size={12} className="rm-module-icon locked" />}
                                                        {perm.module}
                                                    </td>
                                                    <td><PermissionCheck checked={perm.view} /></td>
                                                    <td><PermissionCheck checked={perm.create} /></td>
                                                    <td><PermissionCheck checked={perm.edit} /></td>
                                                    <td><PermissionCheck checked={perm.delete} /></td>
                                                    <td><PermissionCheck checked={perm.approve} /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {config.role !== 'super_admin' && (
                                    <div className="rm-card-footer">
                                        <button className="rm-edit-btn">
                                            <Edit3 size={14} /> Edit Permissions
                                        </button>
                                    </div>
                                )}

                                {config.role === 'super_admin' && (
                                    <div className="rm-card-footer locked">
                                        <Lock size={14} />
                                        <span>Super Admin permissions cannot be modified</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Access Matrix */}
            <div className="rm-matrix-card">
                <div className="rm-matrix-header">
                    <h2><Shield size={20} /> Complete Access Matrix</h2>
                </div>

                <div className="rm-matrix-wrapper">
                    <table className="rm-matrix-table">
                        <thead>
                            <tr>
                                <th>Module</th>
                                {mockRoleConfigs.map(config => (
                                    <th key={config.role} style={{ color: config.color }}>{config.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {mockRoleConfigs[0].permissions.map((_, modIdx) => {
                                const module = mockRoleConfigs[0].permissions[modIdx].module;
                                return (
                                    <tr key={module}>
                                        <td className="rm-module-name-matrix">{module}</td>
                                        {mockRoleConfigs.map(config => {
                                            const perm = config.permissions[modIdx];
                                            const accessLevel =
                                                perm.view && perm.create && perm.edit && perm.delete && perm.approve ? 'full' :
                                                perm.view && (perm.create || perm.edit || perm.approve) ? 'partial' :
                                                perm.view ? 'view' : 'none';

                                            return (
                                                <td key={config.role}>
                                                    <span className={`rm-access-badge ${accessLevel}`}>
                                                        {accessLevel === 'full' ? 'Full' :
                                                         accessLevel === 'partial' ? 'Partial' :
                                                         accessLevel === 'view' ? 'View' : 'None'}
                                                    </span>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
