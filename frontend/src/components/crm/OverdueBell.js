'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Phone, Mail, Users, FileText, CheckSquare, X, Calendar } from 'lucide-react';
import activityService from '../../services/activityService';
import styles from './OverdueBell.module.css';
import Link from 'next/link';

const TYPE_ICONS = {
  call:     { icon: Phone,       color: '#3b82f6' },
  email:    { icon: Mail,        color: '#8b9be2' },
  meeting:  { icon: Users,       color: '#f59e0b' },
  note:     { icon: FileText,    color: '#64748b' },
  task:     { icon: CheckSquare, color: '#10b981' },
  follow_up:{ icon: Bell,        color: '#ef4444' },
};

export default function OverdueBell() {
  const [overdueItems, setOverdueItems] = useState([]);
  const [isOpen, setIsOpen]             = useState(false);
  const [loading, setLoading]           = useState(true);
  const dropdownRef = useRef(null);

  
  useEffect(() => {
    fetchOverdue();
    const timer = setInterval(fetchOverdue, 2 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  
  useEffect(() => {
    const handle = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const fetchOverdue = async () => {
    try {
      const res = await activityService.getActivities({ overdue: true });
      if (res.success) {
        setOverdueItems(Array.isArray(res.data) ? res.data : []);
      }
    } catch (e) {
      console.error('OverdueBell fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (id, e) => {
    e.stopPropagation();
    try {
      await activityService.updateActivity(id, { completed_at: new Date().toISOString() });
      setOverdueItems(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to complete activity:', err);
    }
  };

  const count = overdueItems.length;

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      <button
        className={`${styles.bellBtn} ${count > 0 ? styles.hasAlert : ''}`}
        onClick={() => setIsOpen(v => !v)}
        title={count > 0 ? `${count} overdue follow-up${count > 1 ? 's' : ''}` : 'No overdue activities'}
      >
        <Bell size={20} />
        {count > 0 && (
          <span className={styles.badge}>{count > 99 ? '99+' : count}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>
              {count > 0
                ? `⚠️ ${count} Overdue Follow-up${count > 1 ? 's' : ''}`
                : '✅ No Overdue Activities'}
            </span>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
              <X size={14} />
            </button>
          </div>

          <div className={styles.itemList}>
            {loading ? (
              <div className={styles.empty}>Loading...</div>
            ) : count === 0 ? (
              <div className={styles.allClear}>
                <Bell size={32} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
                <p>All caught up! No overdue activities.</p>
              </div>
            ) : (
              overdueItems.map(activity => {
                const cfg = TYPE_ICONS[activity.activity_type] || TYPE_ICONS.note;
                const Icon = cfg.icon;
                const daysOverdue = Math.floor((new Date() - new Date(activity.due_at)) / 86400000);
                return (
                  <div key={activity.id} className={styles.item}>
                    <div className={styles.itemIcon} style={{ background: `${cfg.color}18`, color: cfg.color }}>
                      <Icon size={14} />
                    </div>
                    <div className={styles.itemBody}>
                      <p className={styles.itemTitle}>{activity.title}</p>
                      <div className={styles.itemMeta}>
                        <Calendar size={11} />
                        <span>
                          {daysOverdue === 0 ? 'Due today' : `${daysOverdue}d overdue`}
                          {' — '}
                          {new Date(activity.due_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </span>
                        {activity.related_type && (
                          <span className={styles.relatedPill}>{activity.related_type}</span>
                        )}
                      </div>
                    </div>
                    <button
                      className={styles.doneBtn}
                      title="Mark Complete"
                      onClick={(e) => handleMarkComplete(activity.id, e)}
                    >
                      ✓
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {count > 0 && (
            <div className={styles.dropdownFooter}>
              <Link href="/crm/activities" className={styles.viewAllLink} onClick={() => setIsOpen(false)}>
                View all activities →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
