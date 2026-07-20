'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { SocketProvider } from '../../context/SocketContext';
import styles from './layout.module.css';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Briefcase,
  FileText,
  LifeBuoy,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  MessageSquare,
  CreditCard,
  Package,
  Folder,
  Shield,
  CalendarDays,
  BarChart3,
  Sliders,
  Inbox,
  Activity,
  UserCog,
  CheckSquare
} from 'lucide-react';
import OverdueBell from '../../components/crm/OverdueBell';
import NotificationBell from '../../components/crm/NotificationBell';

export default function CrmLayout({ children }) {
  const { user, logout, activeTenant, availableCompanies, switchCompany } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const navItems = [
    { label: 'Dashboard', path: '/crm/dashboard', icon: LayoutDashboard, permission: 'dashboard:view' },
    { label: 'Inbox', path: '/crm/inbox', icon: Inbox, permission: 'dashboard:view' },
    { label: 'Customers', path: '/crm/customers', icon: Users, permission: 'customers:view' },
    { label: 'Leads', path: '/crm/leads', icon: UserPlus, permission: 'leads:view' },
    { label: 'Deals', path: '/crm/deals', icon: Briefcase, permission: 'deals:view' },
    { label: 'Quotes', path: '/crm/quotes', icon: FileText, permission: 'quotes:view' },
    { label: 'Activities', path: '/crm/activities', icon: Activity, permission: 'activities:view' },
    { label: 'To-Dos', path: '/crm/todos', icon: CheckSquare, permission: 'dashboard:view' },
    { label: 'Support', path: '/crm/support', icon: LifeBuoy, permission: 'tickets:view' },
    { label: 'Reports', path: '/crm/reports', icon: BarChart3, permission: 'dashboard:view' },
    { label: 'Documents', path: '/crm/documents', icon: Folder, permission: 'documents:view' },
    { label: 'Team Members', path: '/crm/admin/users', icon: UserCog, permission: 'roles:manage' },
    { label: 'Permissions', path: '/crm/admin/roles', icon: Shield, permission: 'roles:view' },
    { label: 'Settings', path: '/crm/admin/settings', icon: Settings, permission: 'dashboard:view' },
  ];

  const hasPermission = (permission) => {
    if (!user) return false;

    if (Array.isArray(user.roles) && typeof user.roles[0] === 'string') {
      if (user.roles.includes('super_admin') || user.roles.includes('admin')) return true;
      const [mod, act] = permission.split(':');
      const dbPerm = `crm_${mod}_${act}`;
      return user.permissions?.includes(dbPerm) || user.permissions?.includes(permission);
    }

    
    if (Array.isArray(user.roles) && typeof user.roles[0] === 'object') {
      const isSuper = user.roles.some(r => r.slug === 'super_admin' || r.slug === 'admin' || r.name === 'admin');
      if (isSuper) return true;

      const [mod, act] = permission.split(':');
      for (const role of user.roles) {
        if (role.permissions?.some(p => p.module === mod && p.action === act)) {
          return true;
        }
      }
    }

    return false;
  };

  const filteredNavItems = navItems.filter(item => hasPermission(item.permission));

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (!user) {
    return <div className={styles.loadingScreen}>Loading workspace...</div>;
  }

  return (
    <SocketProvider>
      <div className={styles.layoutContainer}>
        
        <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
          <div className={styles.sidebarHeader}>
            <div className={styles.logo}>
              <div className={styles.logoTextWrapper}>
                <span className={styles.logoText}>BILLIFY</span>
                <span className={styles.logoSubtext}>CRM SYSTEM</span>
              </div>
            </div>
            <button className={styles.closeMenuBtn} onClick={toggleMobileMenu}>
              <X size={24} />
            </button>
          </div>

          {availableCompanies && availableCompanies.length > 0 && (
            <div className={styles.companySwitcher}>
              <select 
                className={styles.companySelect}
                value={activeTenant?.id || ''}
                onChange={(e) => switchCompany(e.target.value)}
              >
                {availableCompanies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <nav className={styles.navigation}>
            <ul>
              {filteredNavItems.map((item) => {
                const isActive = item.path === '/crm/dashboard'
                  ? pathname === '/crm/dashboard' || pathname === '/crm'
                  : pathname === item.path || pathname.startsWith(`${item.path}/`);

                return (
                  <li key={item.path}>
                    <Link href={item.path} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={styles.sidebarFooter}>
            <button onClick={logout} className={styles.logoutBtn}>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        
        <div className={styles.mainWrapper}>
          
          <header className={styles.topHeader}>
            <div className={styles.headerLeft}>
              <button className={styles.mobileMenuBtn} onClick={toggleMobileMenu}>
                <Menu size={24} />
              </button>
            </div>

            <div className={styles.headerRight}>
              <NotificationBell />
              <div className={styles.userProfile}>
                <div className={styles.avatar}>
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user?.firstName} {user?.lastName}</span>
                  <span className={styles.userRole}>
                    {typeof user?.roles?.[0] === 'string'
                      ? user?.roles?.[0].replace('_', ' ')
                      : user?.roles?.[0]?.name}
                  </span>
                </div>
              </div>
            </div>
          </header>

          
          <main className={styles.pageContent}>
            {children}
          </main>
        </div>

        {isMobileMenuOpen && (
          <div className={styles.mobileOverlay} onClick={toggleMobileMenu}></div>
        )}
      </div>
    </SocketProvider>
  );
}
