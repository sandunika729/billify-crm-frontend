'use client';

import React, { useState, useEffect } from 'react';
import activityService from '../../../services/activityService';
import styles from './page.module.css';
import { Plus, Phone, Mail, Users, FileText, CheckSquare, Bell, Trash2, CheckCircle, Clock, Calendar, Edit2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/modals/Modal';
import FormField from '../../../components/forms/FormField';
import OverdueBell from '../../../components/crm/OverdueBell';
import SearchBar from '../../../components/ui/SearchBar';
import FilterSelect from '../../../components/ui/FilterSelect';
import CalendarPage from '../calendar/page';

const ACTIVITY_TYPES = [
  { value: 'call', label: 'Call', icon: Phone, color: '#3b82f6' },
  { value: 'email', label: 'Email', icon: Mail, color: '#8b5cf6' },
  { value: 'meeting', label: 'Meeting', icon: Users, color: '#f59e0b' },
  { value: 'note', label: 'Note', icon: FileText, color: '#64748b' },
  { value: 'task', label: 'Task', icon: CheckSquare, color: '#10b981' },
  { value: 'follow_up', label: 'Follow-up', icon: Bell, color: '#ef4444' },
];

const ENTITY_TYPES = [
  { value: '', label: 'All' },
  { value: 'deal', label: 'Deals' },
  { value: 'lead', label: 'Leads' },
  { value: 'customer', label: 'Customers' },
];

export default function ActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [filterDone, setFilterDone] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    activity_type: 'call',
    title: '',
    description: '',
    due_date: '',
    due_time: '',
    related_type: 'deal',
    related_id: '',
  });

  useEffect(() => {
    fetchActivities();
  }, [filterEntity]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterEntity) params.related_type = filterEntity;
      const res = await activityService.getActivities(params);
      if (res.success) setActivities(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.due_date) return alert('Title and due date are required.');
    setIsSubmitting(true);
    
    const formDataToSave = { ...formData };
    if (formData.due_date) {
      formDataToSave.due_at = formData.due_time ? `${formData.due_date}T${formData.due_time}` : `${formData.due_date}T00:00`;
    }
    delete formDataToSave.due_date;
    delete formDataToSave.due_time;

    try {
      if (editingId) {
        const res = await activityService.updateActivity(editingId, formDataToSave);
        if (res.success) {
          setActivities(prev => prev.map(a => a.id === editingId ? { ...a, ...formDataToSave } : a));
          setIsModalOpen(false);
          resetForm();
        }
      } else {
        const res = await activityService.createActivity(formDataToSave);
        if (res.success) {
          setActivities(prev => [res.data, ...prev]);
          setIsModalOpen(false);
          resetForm();
        }
      }
    } catch (err) {
      console.error('Failed to save activity:', err);
      alert('Error saving activity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async (activity) => {
    try {
      const completed_at = activity.completed_at ? null : new Date().toISOString();
      const res = await activityService.updateActivity(activity.id, { completed_at });
      if (res.success) {
        setActivities(prev => prev.map(a => a.id === activity.id ? { ...a, completed_at } : a));
      }
    } catch (err) {
      console.error('Failed to update activity:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this activity?')) return;
    try {
      const res = await activityService.deleteActivity(id);
      if (res.success) setActivities(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to delete activity:', err);
      alert('Error deleting activity.');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ activity_type: 'call', title: '', description: '', due_date: '', due_time: '', related_type: 'deal', related_id: '' });
  };

  const handleEdit = (activity) => {
    setEditingId(activity.id);
    const dateObj = activity.due_at ? new Date(activity.due_at) : null;
    let due_date = '';
    let due_time = '';
    if (dateObj) {
      const isoParts = dateObj.toISOString().split('T');
      due_date = isoParts[0];
      due_time = isoParts[1].slice(0, 5);
    }
    setFormData({
      activity_type: activity.activity_type,
      title: activity.title,
      description: activity.description || '',
      due_date,
      due_time,
      related_type: activity.related_type || '',
      related_id: activity.related_id || ''
    });
    setIsModalOpen(true);
  };

  const filteredActivities = activities.filter(a => {
    if (filterType && a.activity_type !== filterType) return false;
    if (filterDone === 'pending' && a.completed_at) return false;
    if (filterDone === 'done' && !a.completed_at) return false;
    if (searchTerm && !a.title?.toLowerCase().includes(searchTerm.toLowerCase()) && !a.description?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getTypeConfig = (type) => ACTIVITY_TYPES.find(t => t.value === type) || ACTIVITY_TYPES[3];

  const isOverdue = (activity) => {
    if (activity.completed_at) return false;
    return activity.due_at && new Date(activity.due_at) < new Date();
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Activities</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={() => setIsCalendarModalOpen(true)}>
            <Calendar size={16} style={{ marginRight: '0.5rem' }} /> Calendar View
          </Button>
          <OverdueBell />
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Log Activity
          </Button>
        </div>
      </div>

      {}
      <div className={styles.filtersBar}>
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search activities..."
          className={styles.searchBarWrapper}
          label=""
        />
        <div className={styles.filtersRight}>
          <FilterSelect
            value={filterDone}
            onChange={setFilterDone}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'done', label: 'Completed' },
            ]}
            label=""
          />
          <FilterSelect
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: '', label: 'All Types' },
              ...ACTIVITY_TYPES
            ]}
            label=""
          />
          <FilterSelect
            value={filterEntity}
            onChange={setFilterEntity}
            options={ENTITY_TYPES}
            label=""
          />
        </div>
      </div>

      {}
      <div className={styles.timeline}>
        {loading ? (
          <div className={styles.emptyState}>Loading activities...</div>
        ) : filteredActivities.length === 0 ? (
          <div className={styles.emptyState}>
            No activities found. Click "Log Activity" to get started.
          </div>
        ) : (
          filteredActivities.map(activity => {
            const typeConfig = getTypeConfig(activity.activity_type);
            const Icon = typeConfig.icon;
            const overdue = isOverdue(activity);
            const done = !!activity.completed_at;

            return (
              <div
                key={activity.id}
                className={`${styles.activityCard} ${done ? styles.doneCard : ''} ${overdue ? styles.overdueCard : ''}`}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardAvatar} style={{ background: `${typeConfig.color}18`, color: typeConfig.color }}>
                    <Icon size={12} />
                  </div>
                  <div className={styles.cardHeaderInfo}>
                    <div className={styles.cardName} style={{ textDecoration: done ? 'line-through' : 'none' }}>
                      {activity.title}
                    </div>
                    <div className={styles.cardTime}>
                      {typeConfig.label}
                    </div>
                  </div>
                  {overdue && !done && (
                    <div className={styles.overdueStatusBadge}>Overdue</div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  {activity.description && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Notes:</span>
                      <span className={styles.detailValue}>{activity.description}</span>
                    </div>
                  )}
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Due Date:</span>
                    <span className={`${styles.detailValue} ${overdue ? styles.overdueBadge : ''}`}>
                      {activity.due_at ? new Date(activity.due_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No due date'}
                    </span>
                  </div>
                  {activity.related_type && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Related To:</span>
                      <span className={styles.detailValue}>
                        {activity.related_type.charAt(0).toUpperCase() + activity.related_type.slice(1)} {activity.related_name ? `- ${activity.related_name}` : (activity.related_id ? `(#${activity.related_id})` : '')}
                      </span>
                    </div>
                  )}
                  {activity.owner_name && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Owner:</span>
                      <span className={styles.detailValue}>{activity.owner_name}</span>
                    </div>
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.activityActions}>
                    <button
                      className={`${styles.iconBtn} ${styles.editBtn}`}
                      title="Edit"
                      onClick={() => handleEdit(activity)}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      className={`${styles.iconBtn} ${done ? styles.undoBtn : styles.completeBtn}`}
                      title={done ? 'Mark as Pending' : 'Mark as Complete'}
                      onClick={() => handleComplete(activity)}
                    >
                      <CheckCircle size={12} />
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.deleteBtn}`}
                      title="Delete"
                      onClick={() => handleDelete(activity.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={editingId ? "Edit Activity" : "Log New Activity"}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSubmitting}>Save Activity</Button>
          </>
        }
      >
        <div className={styles.modalForm}>
          <FormField
            label="Title"
            name="title"
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
            placeholder="e.g. Follow-up call with John"
          />
          <FormField
            label="Description / Notes"
            type="textarea"
            name="description"
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            placeholder="Add any notes here..."
          />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <FormField
              label="Due Date"
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={e => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              required
            />
            <FormField
              label="Time"
              type="time"
              name="due_time"
              value={formData.due_time}
              onChange={e => setFormData(prev => ({ ...prev, due_time: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <FormField
              label="Related To"
              type="select"
              name="related_type"
              value={formData.related_type}
              onChange={e => setFormData(prev => ({ ...prev, related_type: e.target.value }))}
              options={[
                { value: 'deal', label: 'Deal' },
                { value: 'lead', label: 'Lead' },
                { value: 'customer', label: 'Customer' },
                { value: 'quote', label: 'Quote' },
              ]}
            />
            <FormField
              label={`${formData.related_type?.charAt(0).toUpperCase()}${formData.related_type?.slice(1)} ID`}
              name="related_id"
              value={formData.related_id}
              onChange={e => setFormData(prev => ({ ...prev, related_id: e.target.value }))}
              placeholder="Paste the ID (optional)"
            />
          </div>
          
          <div className={styles.typeRadioGrid}>
            <label className={styles.fieldLabel}>Activity Type</label>
            <div className={styles.typeRadioList}>
              {ACTIVITY_TYPES.map(t => {
                const Icon = t.icon;
                return (
                  <label key={t.value} className={styles.typeRadioOption}>
                    <input
                      type="radio"
                      name="activity_type"
                      value={t.value}
                      checked={formData.activity_type === t.value}
                      onChange={() => setFormData(prev => ({ ...prev, activity_type: t.value }))}
                      style={{ accentColor: '#a855f7', width: '15px', height: '15px', marginTop: '2px', cursor: 'pointer' }}
                    />
                    <div className={styles.typeRadioText}>
                      <Icon size={14} style={{ color: t.color, marginRight: '0.4rem' }} />
                      <span className={styles.typeRadioName}>{t.label}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {}
      <Modal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        title=""
        maxWidth="1200px"
        noHeaderBorder={true}
        showClose={true}
      >
        <div style={{ margin: '-1rem' }}>
          <CalendarPage />
        </div>
      </Modal>
    </div>
  );
}
