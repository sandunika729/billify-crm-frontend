'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import userService from '../../../../services/userService';
import styles from './page.module.css';
import {
  Users, UserPlus, Edit2, Trash2, RefreshCw, Search,
  Shield, Mail, Phone, Check, X, Eye, EyeOff,
  AlertTriangle, CheckCircle, Lock, MoreVertical,
  UserCheck, UserX, Key
} from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Modal from '../../../../components/modals/Modal';
import FormField from '../../../../components/forms/FormField';
import SearchBar from '../../../../components/ui/SearchBar';
import Badge from '../../../../components/ui/Badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const CRM_ROLES = [
  { value: 'super_admin', label: 'Super Admin', color: '#7c3aed', desc: 'Full system access, all modules' },
  { value: 'admin', label: 'Admin', color: '#3b82f6', desc: 'Manage all CRM data, limited system settings' },
  { value: 'sales_manager', label: 'Sales Manager', color: '#0ea5e9', desc: 'Manage all sales records, assign leads, approve quotes' },
  { value: 'sales_user', label: 'Sales User', color: '#10b981', desc: 'Manage assigned leads, deals, contacts & follow-ups' },
  { value: 'support_manager', label: 'Support Manager', color: '#f59e0b', desc: 'View all tickets, assign agents, manage priorities' },
  { value: 'support_agent', label: 'Support Agent', color: '#f97316', desc: 'Handle assigned tickets, messages, customer notes' },
  { value: 'accountant', label: 'Accountant', color: '#06b6d4', desc: 'View payments, transactions, quote totals only' },
  { value: 'read_only', label: 'Read Only', color: '#64748b', desc: 'View dashboards and selected records only' },
];

const getRoleCfg = (role) => CRM_ROLES.find(r => r.value === role) || { label: role, color: '#94a3b8', desc: '' };

const getInitials = (firstName, lastName, email) => {
  const f = (firstName || '').trim();
  const l = (lastName || '').trim();
  if (f && l) return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
  if (f) return f.charAt(0).toUpperCase();
  if (email) return email.charAt(0).toUpperCase();
  return '?';
};

const AVATAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#f97316', '#ec4899',
];
const getAvatarColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '',
  phone: '', role: 'sales_user', password: '', confirm_password: '',
};

export default function TeamMembersPage() {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.roles?.includes('super_admin') || currentUser?.role === 'super_admin';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');


  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(null);
  const [resetForm, setResetForm] = useState({ id: '', name: '', new_password: '', confirm_password: '' });
  const [viewUser, setViewUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [addFormError, setAddFormError] = useState('');
  const [editFormError, setEditFormError] = useState('');
  const [resetFormError, setResetFormError] = useState('');


  const [openMenuId, setOpenMenuId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userService.getAllUsers();
      if (res.success) setUsers(Array.isArray(res.data) ? res.data.filter(u => u.role !== 'cashier' && u.role !== 'super_admin') : []);
    } catch (e) {
      console.error('Failed to load users:', e);
      setError('Failed to load team members.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);


  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest(`.${styles.actionsMenu}`)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openViewDetailsModal = (u) => {
    setViewUser(u);
    setIsViewOpen(true);
    setOpenMenuId(null);
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };


  const filteredUsers = users.filter(u => {
    const s = searchTerm.toLowerCase();
    const matchSearch = !s ||
      u.name?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      u.role_label?.toLowerCase().includes(s);
    const matchRole = !filterRole || u.role === filterRole;
    const matchStatus = !filterStatus ||
      (filterStatus === 'active' && u.is_active) ||
      (filterStatus === 'inactive' && !u.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  const roleDistribution = React.useMemo(() => {
    const counts = {};
    filteredUsers.forEach(u => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });
    const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#0ea5e9', '#8b5cf6', '#f43f5e', '#14b8a6'];
    return Object.keys(counts).map((role, index) => {
      const cfg = getRoleCfg(role);
      return {
        name: cfg.label,
        value: counts[role],
        color: PIE_COLORS[index % PIE_COLORS.length]
      };
    });
  }, [filteredUsers]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`${styles.chartTooltip} ${styles.chartTooltipLight}`}>
          <p className={styles.tooltipLabel}>{payload[0].name}</p>
          <p className={styles.tooltipValue} style={{ color: payload[0].payload.color }}>
            {payload[0].value} Members
          </p>
        </div>
      );
    }
    return null;
  };


  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddFormError('');
    if (!addForm.first_name.trim()) return setAddFormError('First name is required.');
    if (!addForm.email.trim()) return setAddFormError('Email is required.');
    if (!addForm.password) return setAddFormError('Password is required.');
    if (addForm.password.length < 6) return setAddFormError('Password must be at least 6 characters.');
    if (addForm.password !== addForm.confirm_password) return setAddFormError('Passwords do not match.');

    setIsSubmitting(true);
    try {
      const res = await userService.createUser({
        first_name: addForm.first_name.trim(),
        last_name: addForm.last_name.trim(),
        email: addForm.email.trim().toLowerCase(),
        phone: addForm.phone.trim(),
        role: addForm.role,
        password: addForm.password,
      });
      if (res.success) {
        setUsers(prev => [res.data, ...prev]);
        setIsAddOpen(false);
        setAddForm(EMPTY_FORM);
        setShowPassword(false);
        showSuccess(`✓ ${res.data.name || res.data.email} added successfully.`);
      }
    } catch (e) {
      setAddFormError(e.response?.data?.message || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const openEditModal = (u) => {
    setEditForm({
      id: u.id, first_name: u.first_name, last_name: u.last_name,
      phone: u.phone || '', role: u.role,
    });
    setEditFormError('');
    setIsEditOpen(true);
    setOpenMenuId(null);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setEditFormError('');
    if (!editForm.first_name.trim()) return setEditFormError('First name is required.');

    setIsSubmitting(true);
    try {
      const res = await userService.updateUser(editForm.id, {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        phone: editForm.phone.trim(),
        role: editForm.role,
      });
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === editForm.id ? { ...u, ...res.data } : u));
        setIsEditOpen(false);
        showSuccess(`✓ ${res.data.name || editForm.first_name} updated successfully.`);
      }
    } catch (e) {
      setEditFormError(e.response?.data?.message || 'Failed to update user.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleToggleStatus = async (u) => {
    setOpenMenuId(null);
    const action = u.is_active ? 'deactivate' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${action} ${u.name || u.email}?`)) return;
    try {
      const res = u.is_active
        ? await userService.deactivateUser(u.id)
        : await userService.reactivateUser(u.id);
      if (res.success) {
        setUsers(prev => prev.map(x => x.id === u.id
          ? { ...x, is_active: !u.is_active, status: u.is_active ? 'inactive' : 'active' }
          : x
        ));
        showSuccess(`✓ ${u.name || u.email} ${action}d successfully.`);
      }
    } catch (e) {
      setError(e.response?.data?.message || `Failed to ${action} user.`);
      setTimeout(() => setError(''), 4000);
    }
  };


  const openResetModal = (u) => {
    setResetForm({ id: u.id, name: u.name || u.email, new_password: '', confirm_password: '' });
    setResetFormError('');
    setShowResetPassword(false);
    setIsResetOpen(true);
    setOpenMenuId(null);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetFormError('');
    if (!resetForm.new_password) return setResetFormError('New password is required.');
    if (resetForm.new_password.length < 6) return setResetFormError('Password must be at least 6 characters.');
    if (resetForm.new_password !== resetForm.confirm_password) return setResetFormError('Passwords do not match.');

    setIsSubmitting(true);
    try {
      const res = await userService.resetPassword(resetForm.id, resetForm.new_password);
      if (res.success) {
        setIsResetOpen(false);
        showSuccess(`✓ Password reset for ${resetForm.name}.`);
      }
    } catch (e) {
      setResetFormError(e.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const inactiveUsers = users.filter(u => !u.is_active).length;

  return (
    <div className={styles.pageContainer}>
      { }
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Team Members</h1>
        </div>
        {isSuperAdmin && (
          <Button variant="primary" onClick={() => { setAddForm(EMPTY_FORM); setAddFormError(''); setIsAddOpen(true); }}>
            Add Member
          </Button>
        )}
      </div>

      { }
      {successMsg && (
        <div className={styles.toastSuccess}>
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}
      {error && (
        <div className={styles.toastError}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      { }
      <div className={styles.filtersBar}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by name, email, or role..."
            label=""
          />
        </div>
        <select className={styles.filterSelect} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">All Roles</option>
          {CRM_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      { }
      <div className={styles.mainRow}>
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.usersTable}>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className={styles.actionsCol}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className={styles.emptyState}>
                    <div className={styles.loadingRow}>
                      <div className={styles.spinner} />
                      Loading team members...
                    </div>
                  </td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan="6" className={styles.emptyState}>
                    {searchTerm || filterRole || filterStatus ? 'No members match your filters.' : 'No team members yet. Add your first member!'}
                  </td></tr>
                ) : (
                  filteredUsers.map(u => {
                    const roleCfg = getRoleCfg(u.role);
                    const isCurrentUser = u.id === currentUser?.id;
                    return (
                      <tr key={u.id} className={`${styles.userRow} ${!u.is_active ? styles.inactiveRow : ''}`}>
                        { }
                        <td>
                          <div className={styles.memberCell}>
                            <div className={styles.memberInfo}>
                              <div className={styles.memberName}>
                                {u.name || u.email}
                                {isCurrentUser && <span className={styles.youBadge}>You</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        { }
                        <td>
                          <span
                            className={styles.roleBadge}
                            style={{
                              background: `${roleCfg.color}18`,
                              color: roleCfg.color,
                              border: `1.5px solid ${roleCfg.color}35`,
                            }}
                          >
                            {roleCfg.label}
                          </span>
                        </td>

                        { }
                        <td>
                          <div className={styles.contactCell}>
                            {u.phone ? (
                              <div className={styles.contactLine}>
                                {u.phone}
                              </div>
                            ) : (
                              <span className={styles.noContact}>—</span>
                            )}
                          </div>
                        </td>

                        { }
                        <td>
                          <Badge variant={u.is_active ? 'active' : 'inactive'} style={{ fontSize: '0.62rem', padding: '0.15rem 0.5rem' }}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>

                        { }
                        <td className={styles.dateCell}>
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>

                        { }
                        <td className={styles.actionsCol}>
                          <div className={styles.actionGroup}>
                            <button
                              className={styles.actionBtnPrimary}
                              onClick={() => openViewDetailsModal(u)}
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                            {isSuperAdmin && (
                              <>
                                <button
                                  className={styles.actionBtnGray}
                                  onClick={() => openEditModal(u)}
                                  title="Edit Details"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  className={styles.actionBtnPurple}
                                  onClick={() => openResetModal(u)}
                                  title="Reset Password"
                                >
                                  <Key size={14} />
                                </button>
                                {!isCurrentUser && u.role !== 'super_admin' && (
                                  <button
                                    className={u.is_active ? styles.actionBtnDanger : styles.actionBtnSuccess}
                                    onClick={() => handleToggleStatus(u)}
                                    title={u.is_active ? "Deactivate" : "Reactivate"}
                                  >
                                    {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.chartsCol}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Role Distribution</h3>
              <p className={styles.chartSub}>Team members grouped by role</p>
            </div>
            {roleDistribution.length > 0 ? (
              <div style={{ height: 250, width: '100%', marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {roleDistribution.map((entry, index) => {
                        const PIE_COLORS = ['#6366f1', '#a735bdff', '#3d7f97ff', '#ec4899', '#0ea5e9', '#8b5cf6', '#44bec4ff', '#1427b8ff'];
                        return <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="transparent" />
                      })}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '0.65rem', fontWeight: 500 }}
                      formatter={(value) => <span style={{ color: 'var(--color-text-secondary)' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className={styles.chartEmpty}>No data</div>
            )}
          </div>
        </div>

      </div>

      { }
      <Modal
        isOpen={isAddOpen}
        onClose={() => { setIsAddOpen(false); setAddFormError(''); }}
        title="Add Team Member"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddUser} isLoading={isSubmitting}>
              Add Member
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddUser} className={styles.modalForm}>
          {addFormError && (
            <div className={styles.formError}><AlertTriangle size={14} /> {addFormError}</div>
          )}

          <div className={styles.formRow}>
            <FormField
              label="First Name *"
              name="first_name"
              value={addForm.first_name}
              onChange={e => setAddForm({ ...addForm, first_name: e.target.value })}
              placeholder="e.g. Ravi"
              required
            />
            <FormField
              label="Last Name"
              name="last_name"
              value={addForm.last_name}
              onChange={e => setAddForm({ ...addForm, last_name: e.target.value })}
              placeholder="e.g. Fernando"
            />
          </div>

          <FormField
            label="Email Address *"
            name="email"
            type="email"
            value={addForm.email}
            onChange={e => setAddForm({ ...addForm, email: e.target.value })}
            placeholder="ravi@company.com"
            required
          />

          <FormField
            label="Phone"
            name="phone"
            type="tel"
            value={addForm.phone}
            onChange={e => setAddForm({ ...addForm, phone: e.target.value })}
            placeholder="+94 77 123 4567"
          />

          { }
          <div className={styles.roleSelector}>
            <label className={styles.fieldLabel}>Role *</label>
            <div className={styles.roleGrid}>
              {CRM_ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  className={`${styles.roleOption} ${addForm.role === r.value ? styles.roleOptionActive : ''}`}
                  style={addForm.role === r.value ? { borderColor: r.color, background: `${r.color}10` } : {}}
                  onClick={() => setAddForm({ ...addForm, role: r.value })}
                >
                  <span className={styles.roleOptionDot} style={{ background: r.color }} />
                  <div className={styles.roleOptionText}>
                    <span className={styles.roleOptionName}>{r.label}</span>
                    <span className={styles.roleOptionDesc}>{r.desc}</span>
                  </div>
                  {addForm.role === r.value && (
                    <Check size={14} style={{ color: r.color, flexShrink: 0 }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.passwordSection}>
            <div className={styles.passwordLabel}>
              <Lock size={14} />
              <span>Set Temporary Password</span>
            </div>
            <div className={styles.formRow}>
              <div className={styles.passwordField}>
                <FormField
                  label="Password *"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={addForm.password}
                  onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="Min. 6 characters"
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(p => !p)}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <FormField
                label="Confirm Password *"
                name="confirm_password"
                type={showPassword ? 'text' : 'password'}
                value={addForm.confirm_password}
                onChange={e => setAddForm({ ...addForm, confirm_password: e.target.value })}
                placeholder="Re-enter password"
                required
              />
            </div>
            <p className={styles.passwordHint}>
              The member will use this password to log in. Advise them to change it after first login.
            </p>
          </div>
        </form>
      </Modal>

      { }
      {editForm && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => { setIsEditOpen(false); setEditFormError(''); }}
          title="Edit Team Member"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleEditUser} isLoading={isSubmitting}>
                Save Changes
              </Button>
            </>
          }
        >
          <form onSubmit={handleEditUser} className={styles.modalForm}>
            {editFormError && (
              <div className={styles.formError}><AlertTriangle size={14} /> {editFormError}</div>
            )}

            <div className={styles.formRow}>
              <FormField
                label="First Name *"
                name="first_name"
                value={editForm.first_name}
                onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                required
              />
              <FormField
                label="Last Name"
                name="last_name"
                value={editForm.last_name}
                onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
              />
            </div>

            <FormField
              label="Phone"
              name="phone"
              type="tel"
              value={editForm.phone}
              onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
              placeholder="+94 77 123 4567"
            />

            <div className={styles.roleSelector}>
              <label className={styles.fieldLabel}>Role *</label>
              <div className={styles.roleGrid}>
                {CRM_ROLES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    className={`${styles.roleOption} ${editForm.role === r.value ? styles.roleOptionActive : ''}`}
                    style={editForm.role === r.value ? { borderColor: r.color, background: `${r.color}10` } : {}}
                    onClick={() => setEditForm({ ...editForm, role: r.value })}
                  >
                    <span className={styles.roleOptionDot} style={{ background: r.color }} />
                    <div className={styles.roleOptionText}>
                      <span className={styles.roleOptionName}>{r.label}</span>
                      <span className={styles.roleOptionDesc}>{r.desc}</span>
                    </div>
                    {editForm.role === r.value && (
                      <Check size={14} style={{ color: r.color, flexShrink: 0 }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </Modal>
      )}

      { }
      <Modal
        isOpen={isResetOpen}
        onClose={() => { setIsResetOpen(false); setResetFormError(''); }}
        title="Reset Password"
        maxWidth="380px"
        footer={
          <>
            <Button variant="danger" onClick={handleResetPassword} isLoading={isSubmitting}>
              Reset Password
            </Button>
          </>
        }
      >
        <form onSubmit={handleResetPassword} className={styles.modalForm}>
          <div className={styles.resetInfo}>
            <Lock size={20} style={{ color: '#a855f7' }} />
            <div>
              <div className={styles.resetInfoTitle}>Resetting password for:</div>
              <div className={styles.resetInfoName}>{resetForm.name}</div>
            </div>
          </div>

          {resetFormError && (
            <div className={styles.formError}><AlertTriangle size={14} /> {resetFormError}</div>
          )}

          <div className={styles.passwordField}>
            <FormField
              label="New Password"
              name="new_password"
              type={showResetPassword ? 'text' : 'password'}
              value={resetForm.new_password}
              onChange={e => setResetForm({ ...resetForm, new_password: e.target.value })}
              placeholder="Min. 6 characters"
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowResetPassword(p => !p)}
            >
              {showResetPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <FormField
            label="Confirm New Password"
            name="confirm_password"
            type={showResetPassword ? 'text' : 'password'}
            value={resetForm.confirm_password}
            onChange={e => setResetForm({ ...resetForm, confirm_password: e.target.value })}
            placeholder="Re-enter new password"
          />
        </form>
      </Modal>

      { }
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="View Team Member Details"
        footer={<Button variant="secondary" onClick={() => setIsViewOpen(false)}>Close</Button>}
      >
        {viewUser && (
          <div className={styles.modalForm}>
            <div className={styles.formRow}>
              <div>
                <label className={styles.fieldLabel}>Name</label>
                <p style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>{viewUser.first_name} {viewUser.last_name}</p>
              </div>
              <div>
                <label className={styles.fieldLabel}>Role</label>
                <p style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>{getRoleCfg(viewUser.role).label}</p>
              </div>
            </div>
            <div className={styles.formRow}>
              <div>
                <label className={styles.fieldLabel}>Email</label>
                <p style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>{viewUser.email}</p>
              </div>
              <div>
                <label className={styles.fieldLabel}>Phone</label>
                <p style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>{viewUser.phone || 'N/A'}</p>
              </div>
            </div>
            <div className={styles.formRow}>
              <div>
                <label className={styles.fieldLabel}>Status</label>
                <div style={{ marginTop: '0.25rem' }}>
                  <Badge variant={viewUser.is_active ? 'active' : 'inactive'} style={{ fontSize: '0.62rem', padding: '0.15rem 0.5rem' }}>
                    {viewUser.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className={styles.fieldLabel}>Joined Date</label>
                <p style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>{viewUser.created_at ? new Date(viewUser.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
