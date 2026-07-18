'use client';

import React, { useState, useEffect } from 'react';
import activityService from '../../services/activityService';
import styles from './ActivityPanel.module.css';
import { Plus, Phone, Mail, Users, FileText, CheckSquare, Bell, Trash2, CheckCircle, Calendar, Loader } from 'lucide-react';
import { alert, confirm } from '@/utils/alertService';

const ACTIVITY_TYPES = [
  { value: 'call',     label: 'Call',      icon: Phone,       color: '#3b82f6' },
  { value: 'email',    label: 'Email',     icon: Mail,        color: '#8b5cf6' },
  { value: 'meeting',  label: 'Meeting',   icon: Users,       color: '#f59e0b' },
  { value: 'note',     label: 'Note',      icon: FileText,    color: '#64748b' },
  { value: 'task',     label: 'Task',      icon: CheckSquare, color: '#10b981' },
  { value: 'follow_up',label: 'Follow-up', icon: Bell,        color: '#ef4444' },
];

export default function ActivityPanel({ relatedType, relatedId }) {
  const [activities, setActivities]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [form, setForm] = useState({
    activity_type: 'call',
    title: '',
    description: '',
    due_at: '',
  });

  useEffect(() => {
    if (relatedId) fetchActivities();
  }, [relatedId]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await activityService.getActivities({ related_type: relatedType, related_id: relatedId });
      if (res.success) setActivities(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('ActivityPanel fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || !form.due_at) return;
    setSubmitting(true);
    try {
      const res = await activityService.createActivity({
        ...form,
        related_type: relatedType,
        related_id: relatedId,
      });
      if (res.success) {
        setActivities(prev => [res.data, ...prev]);
        setShowForm(false);
        setForm({ activity_type: 'call', title: '', description: '', due_at: '' });
      }
    } catch (e) {
      console.error('ActivityPanel save error:', e);
      alert('Failed to save activity.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (activity) => {
    const completed_at = activity.completed_at ? null : new Date().toISOString();
    try {
      const res = await activityService.updateActivity(activity.id, { completed_at });
      if (res.success) {
        setActivities(prev => prev.map(a => a.id === activity.id ? { ...a, completed_at } : a));
      }
    } catch (e) {
      console.error('ActivityPanel complete error:', e);
    }
  };

  const handleDelete = async (id) => {
    if (!await confirm('Delete this activity?')) return;
    try {
      const res = await activityService.deleteActivity(id);
      if (res.success) setActivities(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error('ActivityPanel delete error:', e);
    }
  };

  const getTypeConfig = (type) => ACTIVITY_TYPES.find(t => t.value === type) || ACTIVITY_TYPES[3];

  const isOverdue = (a) => !a.completed_at && a.due_at && new Date(a.due_at) < new Date();

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Activity Timeline</span>
        <button className={styles.addBtn} onClick={() => setShowForm(v => !v)}>
          <Plus size={14} />
          {showForm ? 'Cancel' : 'Log Activity'}
        </button>
      </div>

      {}
      {showForm && (
        <form className={styles.quickForm} onSubmit={handleSave}>
          {}
          <div className={styles.typeRow}>
            {ACTIVITY_TYPES.map(t => {
              const Icon = t.icon;
              const active = form.activity_type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  className={styles.typeBtn}
                  style={active ? { borderColor: t.color, background: `${t.color}15`, color: t.color } : {}}
                  onClick={() => setForm(prev => ({ ...prev, activity_type: t.value }))}
                  title={t.label}
                >
                  <Icon size={13} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <input
            className={styles.input}
            placeholder="Title (e.g. Called John about proposal)"
            value={form.title}
            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            required
          />
          <textarea
            className={styles.textarea}
            placeholder="Notes (optional)"
            rows={2}
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
          />
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Due Date & Time</label>
              <input
                type="datetime-local"
                className={styles.input}
                value={form.due_at}
                onChange={e => setForm(prev => ({ ...prev, due_at: e.target.value }))}
                required
              />
            </div>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={submitting}
            >
              {submitting ? <Loader size={14} className={styles.spin} /> : <Plus size={14} />}
              Save
            </button>
          </div>
        </form>
      )}

      {}
      <div className={styles.timeline}>
        {loading ? (
          <div className={styles.empty}><Loader size={16} className={styles.spin} /> Loading...</div>
        ) : activities.length === 0 ? (
          <div className={styles.empty}>No activities yet. Click "Log Activity" to add one.</div>
        ) : (
          activities.map(activity => {
            const cfg = getTypeConfig(activity.activity_type);
            const Icon = cfg.icon;
            const done = !!activity.completed_at;
            const overdue = isOverdue(activity);

            return (
              <div
                key={activity.id}
                className={`${styles.item} ${done ? styles.doneItem : ''} ${overdue ? styles.overdueItem : ''}`}
              >
                <div className={styles.itemIcon} style={{ background: `${cfg.color}18`, color: cfg.color }}>
                  <Icon size={13} />
                </div>
                <div className={styles.itemBody}>
                  <div className={styles.itemTitle} style={{ textDecoration: done ? 'line-through' : 'none' }}>
                    {activity.title}
                  </div>
                  {activity.description && (
                    <div className={styles.itemDesc}>{activity.description}</div>
                  )}
                  <div className={styles.itemMeta}>
                    <Calendar size={11} />
                    <span className={overdue ? styles.overdueText : ''}>
                      {activity.due_at
                        ? new Date(activity.due_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : 'No due date'}
                    </span>
                    <span className={styles.typeBadge} style={{ color: cfg.color, background: `${cfg.color}12` }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
                <div className={styles.itemActions}>
                  <button
                    className={`${styles.iconBtn} ${done ? styles.undoBtn : styles.completeBtn}`}
                    title={done ? 'Undo' : 'Mark Complete'}
                    onClick={() => handleComplete(activity)}
                  >
                    <CheckCircle size={14} />
                  </button>
                  <button
                    className={`${styles.iconBtn} ${styles.deleteBtn}`}
                    title="Delete"
                    onClick={() => handleDelete(activity.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
