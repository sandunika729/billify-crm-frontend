'use client';

import React, { useState, useEffect } from 'react';
import customFieldService from '../../../../services/customFieldService';
import { Plus, Trash2, X, Settings } from 'lucide-react';
import styles from './page.module.css';
import Button from '../../../../components/ui/Button';
import Modal from '../../../../components/modals/Modal';
import FormField from '../../../../components/forms/FormField';
import { alert, confirm } from '@/utils/alertService';

export default function CustomFieldsPage() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('customer'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    field_name: '', field_label: '', field_type: 'text', options: '', is_required: false
  });

  useEffect(() => {
    fetchFields();
  }, [activeTab]);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const res = await customFieldService.getFields(activeTab);
      if (res.success) {
        setFields(res.data);
      }
    } catch (error) {
      console.error('Failed to load fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveField = async (e) => {
    e.preventDefault();
    try {
      const optionsArray = formData.field_type === 'select' && formData.options
        ? formData.options.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      await customFieldService.createField({
        entity_type: activeTab,
        field_name: formData.field_name || formData.field_label.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        field_label: formData.field_label,
        field_type: formData.field_type,
        options: optionsArray,
        is_required: formData.is_required
      });
      setIsModalOpen(false);
      setFormData({ field_name: '', field_label: '', field_type: 'text', options: '', is_required: false });
      fetchFields();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving field');
    }
  };

  const handleDelete = async (id) => {
    if (!await confirm('Are you sure you want to delete this custom field definition? Existing data in records will not be deleted, but it will no longer show in forms.')) return;
    
    try {
      await customFieldService.deleteField(id);
      fetchFields();
    } catch (error) {
      alert('Error deleting field');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Custom Fields</h1>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Add Field
        </Button>
      </header>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'customer' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('customer')}
        >
          Customers
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'lead' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('lead')}
        >
          Leads
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'deal' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('deal')}
        >
          Deals
        </button>
      </div>

      {loading ? (
        <p>Loading fields...</p>
      ) : (
        <div className={styles.fieldList}>
          {fields.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>No custom fields defined for {activeTab}s.</p>
          ) : (
            fields.map(field => (
              <div key={field.id} className={styles.fieldCard}>
                <div className={styles.fieldInfo}>
                  <span className={styles.fieldLabel}>{field.field_label}</span>
                  <div className={styles.fieldMeta}>
                    <span className={styles.badge}>{field.field_type.toUpperCase()}</span>
                    <span>Key: {field.field_name}</span>
                    {field.is_required && <span className={`${styles.badge} ${styles.badgeRequired}`}>Required</span>}
                    {field.field_type === 'select' && (
                      <span>Options: {field.options.join(', ')}</span>
                    )}
                  </div>
                </div>
                <button className={styles.deleteBtn} onClick={() => handleDelete(field.id)} title="Delete Field">
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Add Custom Field to ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}s`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveField}>Save Field</Button>
          </>
        }
      >
        <form id="add-field-form" onSubmit={handleSaveField}>
          <FormField label="Field Label" name="field_label" value={formData.field_label} onChange={e => setFormData({...formData, field_label: e.target.value})} required placeholder="e.g. LinkedIn URL" />
          <FormField label="Field Key (Optional)" name="field_name" value={formData.field_name} onChange={e => setFormData({...formData, field_name: e.target.value})} placeholder="Auto-generated if left blank" />
          <FormField 
            label="Field Type" type="select" name="field_type" value={formData.field_type}
            onChange={e => setFormData({...formData, field_type: e.target.value})}
            options={[
              { value: 'text', label: 'Text (Single Line)' },
              { value: 'number', label: 'Number' },
              { value: 'date', label: 'Date' },
              { value: 'checkbox', label: 'Checkbox (Yes/No)' },
              { value: 'select', label: 'Dropdown (Select)' }
            ]}
          />
          {formData.field_type === 'select' && (
            <FormField label="Dropdown Options (Comma separated)" name="options" value={formData.options} onChange={e => setFormData({...formData, options: e.target.value})} required placeholder="e.g. Bronze, Silver, Gold" />
          )}
          <div className={styles.checkboxGroup}>
            <input 
              type="checkbox" 
              id="isRequired"
              checked={formData.is_required}
              onChange={(e) => setFormData({...formData, is_required: e.target.checked})}
            />
            <label htmlFor="isRequired">Make this field required</label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
