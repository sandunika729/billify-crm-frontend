'use client';

import React, { useState, useEffect } from 'react';
import todoService from '../../../services/todoService';
import styles from './page.module.css';
import {
  Plus, Trash2, CheckCircle, Globe, Lock, User, Clock
} from 'lucide-react';
import Button from '../../../components/ui/Button';

export default function TodosPage() {
  const [todos, setTodos] = useState([]);
  const [publicTodos, setPublicTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mine');

  const [newTitle, setNewTitle] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [myRes, pubRes] = await Promise.all([
        todoService.getTodos(),
        todoService.getTodos({ filter: 'public' })
      ]);
      if (myRes.success) setTodos(Array.isArray(myRes.data) ? myRes.data : []);
      if (pubRes.success) setPublicTodos(Array.isArray(pubRes.data) ? pubRes.data : []);
    } catch (err) {
      console.error('Failed to fetch todos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsAdding(true);
    try {
      const res = await todoService.createTodo({ title: newTitle.trim(), is_public: isPublic });
      if (res.success) {
        const created = res.data;
        setTodos(prev => [created, ...prev]);
        if (isPublic) setPublicTodos(prev => [created, ...prev]);
        setNewTitle('');
        setIsPublic(false);
      }
    } catch (err) {
      console.error('Failed to create todo:', err);
      alert('Error creating todo.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleComplete = async (todo) => {
    const completed_at = todo.completed_at ? null : new Date().toISOString();
    try {
      const res = await todoService.updateTodo(todo.id, { completed_at });
      if (res.success || res) {
        const updated = { ...todo, completed_at };
        setTodos(prev => prev.map(t => t.id === todo.id ? updated : t));
        setPublicTodos(prev => prev.map(t => t.id === todo.id ? updated : t));
      }
    } catch (err) {
      console.error('Failed to toggle todo:', err);
    }
  };

  const handleDelete = async (todo) => {
    if (!window.confirm('Delete this todo?')) return;
    try {
      const res = await todoService.deleteTodo(todo.id);
      if (res.success || res) {
        setTodos(prev => prev.filter(t => t.id !== todo.id));
        setPublicTodos(prev => prev.filter(t => t.id !== todo.id));
      }
    } catch (err) {
      console.error('Failed to delete todo:', err);
      alert('Error deleting todo.');
    }
  };

  const displayList = activeTab === 'mine' ? todos : publicTodos;
  const pendingCount = (activeTab === 'mine' ? todos : publicTodos).filter(t => !t.completed_at).length;

  const TodoCard = ({ todo, isOwner }) => {
    const done = !!todo.completed_at;
    return (
      <div className={`${styles.todoCard} ${done ? styles.done : ''}`}>
        {isOwner && (
          <button
            className={`${styles.checkBtn} ${done ? styles.checked : ''}`}
            onClick={() => handleToggleComplete(todo)}
            title={done ? 'Mark as pending' : 'Mark as complete'}
          >
            {done && <CheckCircle size={12} />}
          </button>
        )}
        {!isOwner && (
          <div className={`${styles.checkBtn} ${done ? styles.checked : ''}`} style={{ cursor: 'default' }}>
            {done && <CheckCircle size={12} />}
          </div>
        )}

        <div className={styles.todoBody}>
          <div className={`${styles.todoTitle} ${done ? styles.done : ''}`}>{todo.title}</div>
          <div className={styles.todoMeta}>
            {todo.is_public ? (
              <span className={styles.publicBadge}><Globe size={9} /> Public</span>
            ) : (
              <span className={styles.privateBadge}><Lock size={9} /> Private</span>
            )}
            {todo.owner_name && (
              <span className={styles.metaItem}>
                <User size={10} />
                <span className={styles.ownerName}>{todo.owner_name}</span>
              </span>
            )}
            {todo.createdAt && (
              <span className={styles.metaItem}>
                <Clock size={10} />
                {new Date(todo.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>

        {isOwner && (
          <div className={styles.todoActions}>
            <button
              className={`${styles.iconBtn} ${styles.deleteIconBtn}`}
              onClick={() => handleDelete(todo)}
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>To-Do List</h1>
      </div>

      {/* Quick Add Form */}
      <form className={styles.addForm} onSubmit={handleAdd}>
        <input
          className={styles.addInput}
          type="text"
          placeholder="Add a new to-do..."
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          disabled={isAdding}
        />
        <button
          type="button"
          className={`${styles.visibilityToggle} ${isPublic ? styles.public : ''}`}
          onClick={() => setIsPublic(p => !p)}
          title={isPublic ? 'Visible to everyone (click to make private)' : 'Only you can see this (click to make public)'}
        >
          {isPublic ? <Globe size={13} /> : <Lock size={13} />}
          {isPublic ? 'Public' : 'Private'}
        </button>
        <Button type="submit" variant="primary" isLoading={isAdding} disabled={!newTitle.trim()}>
          <Plus size={14} style={{ marginRight: '0.3rem' }} /> Add
        </Button>
      </form>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'mine' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('mine')}
        >
          My To-Dos
          {todos.filter(t => !t.completed_at).length > 0 && (
            <span className={styles.tabBadge}>{todos.filter(t => !t.completed_at).length}</span>
          )}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'public' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('public')}
        >
          Public To-Dos
          {publicTodos.filter(t => !t.completed_at).length > 0 && (
            <span className={styles.tabBadge}>{publicTodos.filter(t => !t.completed_at).length}</span>
          )}
        </button>
      </div>

      {/* Todo List */}
      <div className={styles.todoList}>
        {loading ? (
          <div className={styles.emptyState}>Loading to-dos...</div>
        ) : displayList.length === 0 ? (
          <div className={styles.emptyState}>
            {activeTab === 'mine'
              ? 'No to-dos yet. Add your first one above!'
              : 'No public to-dos in the workspace yet.'}
          </div>
        ) : (
          displayList.map(todo => (
            <TodoCard
              key={todo.id}
              todo={todo}
              isOwner={activeTab === 'mine'}
            />
          ))
        )}
      </div>
    </div>
  );
}
