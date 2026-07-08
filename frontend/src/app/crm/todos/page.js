'use client';

import React, { useState, useEffect } from 'react';
import todoService from '../../../services/todoService';
import styles from '../activities/page.module.css';
import { CheckSquare, Globe, Lock, Trash2, CheckCircle, Edit2, Plus } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/modals/Modal';
import FormField from '../../../components/forms/FormField';
import SearchBar from '../../../components/ui/SearchBar';
import FilterSelect from '../../../components/ui/FilterSelect';

export default function TodosPage() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVisibility, setFilterVisibility] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_public: false,
  });

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      // Fetch both own + all public todos
      const [myRes, pubRes] = await Promise.all([
        todoService.getTodos(),
        todoService.getTodos({ filter: 'public' }),
      ]);
      const myTodos = myRes.success ? (Array.isArray(myRes.data) ? myRes.data : []) : [];
      const pubTodos = pubRes.success ? (Array.isArray(pubRes.data) ? pubRes.data : []) : [];
      // Merge, avoiding duplicates (my public todos appear in both)
      const merged = [...myTodos];
      pubTodos.forEach(pt => {
        if (!merged.find(t => t.id === pt.id)) merged.push(pt);
      });
      setTodos(merged);
    } catch (err) {
      console.error('Failed to fetch todos:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', is_public: false });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return alert('Title is required.');
    setIsSubmitting(true);
    try {
      if (editingId) {
        const res = await todoService.updateTodo(editingId, {
          title: formData.title,
          description: formData.description,
          is_public: formData.is_public,
        });
        if (res.success || res.data) {
          setTodos(prev => prev.map(t => t.id === editingId ? { ...t, ...formData } : t));
          setIsModalOpen(false);
          resetForm();
        }
      } else {
        const res = await todoService.createTodo(formData);
        if (res.success) {
          setTodos(prev => [res.data, ...prev]);
          setIsModalOpen(false);
          resetForm();
        }
      }
    } catch (err) {
      console.error('Failed to save todo:', err);
      alert('Error saving todo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (todo) => {
    setEditingId(todo.id);
    setFormData({
      title: todo.title,
      description: todo.description || '',
      is_public: !!todo.is_public,
    });
    setIsModalOpen(true);
  };

  const handleComplete = async (todo) => {
    try {
      const completed_at = todo.completed_at ? null : new Date().toISOString();
      const res = await todoService.updateTodo(todo.id, { completed_at });
      if (res.success || res.data) {
        setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, completed_at } : t));
      }
    } catch (err) {
      console.error('Failed to toggle todo:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this to-do?')) return;
    try {
      const res = await todoService.deleteTodo(id);
      if (res.success || res.data || res.message) {
        setTodos(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete todo:', err);
      alert('Error deleting todo.');
    }
  };

  const filteredTodos = todos.filter(t => {
    if (filterStatus === 'pending' && t.completed_at) return false;
    if (filterStatus === 'done' && !t.completed_at) return false;
    if (filterVisibility === 'public' && !t.is_public) return false;
    if (filterVisibility === 'private' && t.is_public) return false;
    if (searchTerm && !t.title?.toLowerCase().includes(searchTerm.toLowerCase()) && !t.description?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1>To-Do List</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button variant="primary" onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <Plus size={15} style={{ marginRight: '0.4rem' }} /> Add To-Do
          </Button>
        </div>
      </div>

      {/* Filters bar */}
      <div className={styles.filtersBar}>
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search to-dos..."
          className={styles.searchBarWrapper}
          label=""
        />
        <div className={styles.filtersRight}>
          <FilterSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'done', label: 'Completed' },
            ]}
            label=""
          />
          <FilterSelect
            value={filterVisibility}
            onChange={setFilterVisibility}
            options={[
              { value: '', label: 'All Visibility' },
              { value: 'public', label: 'Public' },
              { value: 'private', label: 'Private' },
            ]}
            label=""
          />
        </div>
      </div>

      {/* Todo cards grid */}
      <div className={styles.timeline}>
        {loading ? (
          <div className={styles.emptyState}>Loading to-dos...</div>
        ) : filteredTodos.length === 0 ? (
          <div className={styles.emptyState}>
            No to-dos found. Click &quot;Add To-Do&quot; to get started.
          </div>
        ) : (
          filteredTodos.map(todo => {
            const done = !!todo.completed_at;
            const isPublic = !!todo.is_public;
            const Icon = isPublic ? Globe : Lock;
            const color = isPublic ? '#10b981' : '#6366f1';

            return (
              <div
                key={todo.id}
                className={`${styles.activityCard} ${done ? styles.doneCard : ''}`}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardAvatar} style={{ background: `${color}18`, color }}>
                    <Icon size={12} />
                  </div>
                  <div className={styles.cardHeaderInfo}>
                    <div
                      className={styles.cardName}
                      style={{ textDecoration: done ? 'line-through' : 'none' }}
                    >
                      {todo.title}
                    </div>
                    <div className={styles.cardTime}>
                      {isPublic ? 'Public' : 'Private'}
                    </div>
                  </div>
                  {done && (
                    <div
                      style={{
                        position: 'absolute', top: 0, right: 0,
                        background: '#f0fdf4', color: '#10b981',
                        padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)',
                        fontSize: '0.65rem', fontWeight: 600, border: '1px solid #bbf7d0'
                      }}
                    >
                      Done
                    </div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  {todo.description && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Notes:</span>
                      <span className={styles.detailValue}>{todo.description}</span>
                    </div>
                  )}
                  {todo.owner_name && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Owner:</span>
                      <span className={styles.detailValue} style={{ fontWeight: 'bold' }}>{todo.owner_name}</span>
                    </div>
                  )}
                  {todo.createdAt && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Added:</span>
                      <span className={styles.detailValue}>
                        {new Date(todo.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.activityActions}>
                    <button
                      className={`${styles.iconBtn} ${styles.editBtn}`}
                      title="Edit"
                      onClick={() => handleEdit(todo)}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      className={`${styles.iconBtn} ${done ? styles.undoBtn : styles.completeBtn}`}
                      title={done ? 'Mark as Pending' : 'Mark as Complete'}
                      onClick={() => handleComplete(todo)}
                    >
                      <CheckCircle size={12} />
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.deleteBtn}`}
                      title="Delete"
                      onClick={() => handleDelete(todo.id)}
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={editingId ? 'Edit To-Do' : 'Add New To-Do'}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSubmitting}>Save To-Do</Button>
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
            placeholder="e.g. Review the contract"
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

          {/* Visibility radio */}
          <div className={styles.typeRadioGrid}>
            <label className={styles.fieldLabel}>Visibility</label>
            <div className={styles.typeRadioList}>
              <label className={styles.typeRadioOption}>
                <input
                  type="radio"
                  name="visibility"
                  checked={!formData.is_public}
                  onChange={() => setFormData(prev => ({ ...prev, is_public: false }))}
                  style={{ accentColor: '#6366f1', width: '15px', height: '15px', marginTop: '2px', cursor: 'pointer' }}
                />
                <div className={styles.typeRadioText}>
                  <Lock size={14} style={{ color: '#6366f1', marginRight: '0.4rem' }} />
                  <span className={styles.typeRadioName}>Private — only you can see this</span>
                </div>
              </label>
              <label className={styles.typeRadioOption}>
                <input
                  type="radio"
                  name="visibility"
                  checked={!!formData.is_public}
                  onChange={() => setFormData(prev => ({ ...prev, is_public: true }))}
                  style={{ accentColor: '#10b981', width: '15px', height: '15px', marginTop: '2px', cursor: 'pointer' }}
                />
                <div className={styles.typeRadioText}>
                  <Globe size={14} style={{ color: '#10b981', marginRight: '0.4rem' }} />
                  <span className={styles.typeRadioName}>Public — visible to everyone</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
