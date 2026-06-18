'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import roleService from '../../../../services/roleService';
import styles from './page.module.css';
import { Shield, Users, Search, Edit2, Trash2, Plus, X, Check, ChevronDown, ChevronRight } from 'lucide-react';
import Button from '../../../../components/ui/Button';

export default function RolesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.includes('super_admin') || user?.role === 'super_admin';

  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        roleService.getRoles(),
        roleService.getPermissions()
      ]);

      if (rolesRes.success) setRoles(rolesRes.data);
      if (permsRes.success) setAllPermissions(permsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const permissionModules = [
    'dashboard', 'customers', 'leads', 'deals', 'quotes',
    'tickets', 'activities', 'interactions', 'documents',
    'notifications', 'payments', 'products', 'reports', 'roles', 'audit_logs'
  ];

  const permissionActions = ['view', 'create', 'update', 'delete', 'export', 'assign', 'manage'];

  const [selectedRole, setSelectedRole] = useState(null);
  const [expandedModules, setExpandedModules] = useState();
  const [searchTerm, setSearchTerm] = useState('');

  const [permissions, setPermissions] = useState();

  const handleSelectRole = (role) => {
    setSelectedRole(role);

    const perms = {};
    permissionModules.forEach(mod => {
      perms[mod] = {};
      permissionActions.forEach(action => {

        const hasPerm = role.permissions?.some(p => p.module === mod && p.action === action);
        perms[mod][action] = !!hasPerm;
      });
    });
    setPermissions(perms);
  };

  const toggleModule = (mod) => {
    setExpandedModules(prev => ({ ...prev, [mod]: !prev[mod] }));
  };

  const togglePermission = (mod, action) => {
    if (!isSuperAdmin) return; 
    if (selectedRole?.is_system && selectedRole?.slug === 'super_admin') return;
    setPermissions(prev => ({
      ...prev,
      [mod]: { ...prev[mod], [action]: !prev[mod]?.[action] }
    }));
  };

  const filteredRoles = roles.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getModulePermCount = (mod) => {
    if (!permissions[mod]) return 0;
    return Object.values(permissions[mod]).filter(Boolean).length;
  };

  const handleSavePermissions = async () => {
    if (!selectedRole || selectedRole.slug === 'super_admin') return;
    if (!isSuperAdmin) return; 

    setSaving(true);
    try {

      const permission_ids = allPermissions
        .filter(p => permissions[p.module]?.[p.action] === true)
        .map(p => p.id);

      const res = await roleService.updateRole(selectedRole.id, { permission_ids });

      if (res.success) {

        setRoles(prevRoles => prevRoles.map(r => {
          if (r.id === selectedRole.id) {

            const newRolePerms = allPermissions.filter(p => permission_ids.includes(p.id));
            return { ...r, permissions: newRolePerms };
          }
          return r;
        }));
        alert('Permissions saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save permissions:', error);
      alert('Failed to save permissions. See console for details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Permissions</h1>
        </div>
      </div>

      <div className={styles.rolesLayout}>

        <div className={styles.rolesPanel}>
          <div className={styles.panelHeader}>
            <h3>Roles</h3>
          </div>

          <div className={styles.roleSearch}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.rolesList}>
            {filteredRoles.map(role => (
              <div
                key={role.id}
                className={`${styles.roleItem} ${selectedRole?.id === role.id ? styles.roleItemActive : ''}`}
                onClick={() => handleSelectRole(role)}
              >
                <div className={styles.roleInfo}>
                  <div className={styles.roleName}>
                    {role.name}
                    {role.is_system && <span className={styles.systemBadge}>System</span>}
                  </div>
                </div>
                <div className={styles.roleUserCount}>
                  <Users size={14} />
                  <span>{role.user_count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.permissionsPanel}>
          {!selectedRole ? (
            <div className={styles.emptyPermissions}>
              <p>Select a role from the left to view and manage its permissions</p>
            </div>
          ) : (
            <>
              <div className={styles.panelHeader}>
                <h3>Permissions for: <span className={styles.roleHighlight}>{selectedRole.name}</span></h3>
                {selectedRole.slug === 'super_admin' && (
                  <span className={styles.lockedBadge}>Locked — Full Access</span>
                )}
                {!isSuperAdmin && selectedRole.slug !== 'super_admin' && (
                  <span className={styles.viewOnlyBadge}>View Only — Super Admin can edit</span>
                )}
              </div>

              <div className={styles.permissionMatrix}>

                <div className={styles.matrixHeader}>
                  <div className={styles.matrixModuleCol}>Module</div>
                  {permissionActions.map(action => (
                    <div key={action} className={styles.matrixActionCol}>
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </div>
                  ))}
                </div>

                {permissionModules.map(mod => (
                  <div key={mod} className={styles.matrixRow}>
                    <div className={styles.matrixModuleCol} onClick={() => toggleModule(mod)}>
                      <span className={styles.moduleLabel}>
                        {mod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className={styles.permCount}>{getModulePermCount(mod)}/{permissionActions.length}</span>
                    </div>
                    {permissionActions.map(action => (
                      <div key={action} className={styles.matrixActionCol}>
                        <button
                          className={`${styles.permToggle} ${permissions[mod]?.[action] ? styles.permOn : styles.permOff}`}
                          onClick={() => togglePermission(mod, action)}
                          disabled={selectedRole.slug === 'super_admin'}
                        >
                          {permissions[mod]?.[action] ? <Check size={12} strokeWidth={3} /> : ''}
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className={styles.matrixFooter}>
                <Button
                  variant="primary"
                  onClick={handleSavePermissions}
                  disabled={selectedRole.slug === 'super_admin' || !isSuperAdmin}
                  isLoading={saving}
                >
                  Save Changes
                </Button>

              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
