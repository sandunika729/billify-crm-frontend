'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import calendarService from '../../../services/calendarService';
import styles from './page.module.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfYear, endOfYear, eachMonthOfInterval, getDaysInMonth, startOfMonth, getDay, isSameDay } from 'date-fns';
import Modal from '../../../components/modals/Modal';
import FormField from '../../../components/forms/FormField';
import Button from '../../../components/ui/Button';

const activityColorMap = {
  call: '#3b82f6', 
  meeting: '#ef4444', 
  task: '#10b981', 
  follow_up: '#f59e0b', 
  note: '#8b5cf6', 
  system: '#64748b' 
};

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [hoveredDate, setHoveredDate] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const hoverTimeout = useRef(null);

  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewActivityModalOpen, setViewActivityModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    activity_type: 'task',
    description: '',
    due_at_time: '12:00'
  });

  useEffect(() => {
    fetchActivitiesForYear(currentYear);
  }, [currentYear]);

  const fetchActivitiesForYear = async (year) => {
    setLoading(true);
    try {
      const start = new Date(year, 0, 1).toISOString();
      const end = new Date(year, 11, 31, 23, 59, 59).toISOString();
      
      const res = await calendarService.getActivities(start, end);
      if (res.success) {
        setActivities(res.data || []);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevYear = () => setCurrentYear(prev => prev - 1);
  const handleNextYear = () => setCurrentYear(prev => prev + 1);
  const handleToday = () => setCurrentYear(new Date().getFullYear());

  const months = eachMonthOfInterval({
    start: new Date(currentYear, 0, 1),
    end: new Date(currentYear, 11, 31)
  });

  const getActivitiesForDate = (date) => {
    return activities.filter(act => {
      if (!act.due_at) return false;
      return isSameDay(new Date(act.due_at), date);
    });
  };

  const handleMouseEnter = (e, date, dayActivities) => {
    if (dayActivities.length === 0) return;
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    
    const rect = e.currentTarget.getBoundingClientRect();
    
    
    let xPos = rect.right + window.scrollX + 10;
    let yPos = rect.top + window.scrollY - 20;

    
    if (xPos + 300 > window.innerWidth) {
      xPos = rect.left + window.scrollX - 310;
    }

    setHoverPosition({ x: xPos, y: yPos });
    setHoveredDate({ date, activities: dayActivities });
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => {
      setHoveredDate(null);
    }, 150);
  };

  const handleCardMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
  };

  const handleCardMouseLeave = () => {
    setHoveredDate(null);
  };

  const handleCellClick = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDateStr(`${year}-${month}-${day}`);
    setFormData({ ...formData, title: '', description: '' });
    setIsModalOpen(true);
  };

  const handleActivityClick = (e, act) => {
    e.stopPropagation();
    setSelectedActivity(act);
    setViewActivityModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const dueAtIso = new Date(`${selectedDateStr}T${formData.due_at_time}:00`).toISOString();
      
      const payload = {
        title: formData.title,
        activity_type: formData.activity_type,
        description: formData.description,
        due_at: dueAtIso,
      };

      const res = await calendarService.createActivity(payload);
      if (res.success) {
        setIsModalOpen(false);
        fetchActivitiesForYear(currentYear);
      }
    } catch (err) {
      console.error('Failed to create:', err);
      alert('Error creating activity.');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.topBar}>
        <button className={styles.todayBtn} onClick={handleToday}>Today</button>
        <div className={styles.yearNavigation}>
          <button className={styles.navBtn} onClick={handlePrevYear}><ChevronLeft size={16} /></button>
          <span className={styles.yearLabel}>{currentYear}</span>
          <button className={styles.navBtn} onClick={handleNextYear}><ChevronRight size={16} /></button>
        </div>
        <div className={styles.viewTabs}>
          <button className={`${styles.tabBtn} ${styles.active}`}>Year</button>
          <button className={styles.tabBtn}>Week</button>
          <button className={styles.tabBtn}>Month</button>
          <button className={styles.tabBtn}>Day</button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading Calendar...</div>
      ) : (
        <div className={styles.yearGrid}>
          {months.map((monthDate, index) => {
            const daysInMonth = getDaysInMonth(monthDate);
            const firstDay = getDay(startOfMonth(monthDate));
            const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; 
            
            const daysArray = Array.from({ length: daysInMonth }, (_, i) => new Date(currentYear, monthDate.getMonth(), i + 1));
            const blanks = Array.from({ length: adjustedFirstDay }, () => null);

            return (
              <div key={index} className={styles.monthBlock}>
                <h3 className={styles.monthTitle}>{format(monthDate, 'MMMM')}</h3>
                <div className={styles.weekDays}>
                  <span>MO</span><span>TU</span><span>WE</span><span>TH</span><span>FR</span><span>SA</span><span>SU</span>
                </div>
                <div className={styles.daysGrid}>
                  {blanks.map((_, i) => <div key={`blank-${i}`} className={styles.dayCell}></div>)}
                  {daysArray.map((date, i) => {
                    const dayActivities = getActivitiesForDate(date);
                    const hasTasks = dayActivities.length > 0;
                    const firstTaskType = hasTasks ? dayActivities[0].activity_type : null;
                    const ringColor = firstTaskType ? (activityColorMap[firstTaskType] || '#3b82f6') : 'transparent';
                    
                    return (
                      <div 
                        key={i} 
                        className={styles.dayCell}
                        onMouseEnter={(e) => handleMouseEnter(e, date, dayActivities)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleCellClick(date)}
                      >
                        <div 
                          className={`${styles.dayNumber} ${hasTasks ? styles.hasTasks : ''}`}
                          style={{ borderColor: ringColor }}
                        >
                          {format(date, 'd')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hoveredDate && hoveredDate.activities.length > 0 && (
        <div 
          className={styles.hoverCard}
          style={{ 
            left: hoverPosition.x, 
            top: hoverPosition.y 
          }}
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
        >
          {hoveredDate.activities.map((act, idx) => {
            const actColor = activityColorMap[act.activity_type] || '#3b82f6';
            return (
              <div 
                key={act.id || idx} 
                className={styles.hoverTask} 
                style={{ borderColor: actColor, cursor: 'pointer' }}
                onClick={(e) => handleActivityClick(e, act)}
              >
                <div className={styles.taskTime} style={{ backgroundColor: actColor, color: '#fff' }}>
                  {format(new Date(act.due_at), 'HH:mm')}
                </div>
                <div className={styles.taskDetails}>
                  <div className={styles.taskTitle}>{act.title}</div>
                  {act.description && <div className={styles.taskDesc}>{act.description.substring(0, 40)}...</div>}
                </div>
                <div className={styles.avatars}>
                  {user && (
                    <div className={styles.avatar}>
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Activity"
        footer={
          <Button type="submit" variant="primary" onClick={handleCreateSubmit}>Save Activity</Button>
        }
      >
        <form id="create-activity-form" onSubmit={handleCreateSubmit}>
          <FormField label="Date" type="date" name="activity_date" value={selectedDateStr} onChange={e => setSelectedDateStr(e.target.value)} required />
          <FormField label="Time" type="time" name="due_at_time" value={formData.due_at_time} onChange={e => setFormData({...formData, due_at_time: e.target.value})} required />
          <FormField 
            label="Type" type="select" name="activity_type" value={formData.activity_type}
            onChange={e => setFormData({...formData, activity_type: e.target.value})}
            options={[
              { value: 'task', label: 'Task' },
              { value: 'call', label: 'Call' },
              { value: 'meeting', label: 'Meeting' },
              { value: 'follow_up', label: 'Follow Up' }
            ]}
          />
          <FormField label="Title" name="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="e.g. Call John Doe" />
          <FormField label="Description (Optional)" type="textarea" name="description" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        </form>
      </Modal>

      <Modal
        isOpen={viewActivityModalOpen}
        onClose={() => setViewActivityModalOpen(false)}
        title="Activity Details"
        footer={
          <Button variant="secondary" onClick={() => setViewActivityModalOpen(false)}>Close</Button>
        }
      >
        {selectedActivity && (
          <div className={styles.activityDetails} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <strong style={{ fontSize: '0.85rem', color: '#64748b' }}>Title</strong> 
              <p style={{ fontWeight: 600, marginTop: '0.25rem' }}>{selectedActivity.title}</p>
            </div>
            <div>
              <strong style={{ fontSize: '0.85rem', color: '#64748b' }}>Type</strong> 
              <p style={{ marginTop: '0.25rem', textTransform: 'capitalize' }}>{selectedActivity.activity_type.replace('_', ' ')}</p>
            </div>
            <div>
              <strong style={{ fontSize: '0.85rem', color: '#64748b' }}>Date & Time</strong> 
              <p style={{ marginTop: '0.25rem' }}>{new Date(selectedActivity.due_at).toLocaleString()}</p>
            </div>
            <div>
              <strong style={{ fontSize: '0.85rem', color: '#64748b' }}>Status</strong> 
              <p style={{ marginTop: '0.25rem', textTransform: 'capitalize' }}>{selectedActivity.status}</p>
            </div>
            {selectedActivity.description && (
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#64748b' }}>Description</strong> 
                <p style={{ marginTop: '0.25rem', lineHeight: '1.5' }}>{selectedActivity.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
