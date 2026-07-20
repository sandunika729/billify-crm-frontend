import React, { useEffect, useState } from 'react';
import styles from './CustomFieldsSection.module.css';
import FormField from './FormField';
import customFieldService from '@/services/customFieldService';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CustomFieldsSection({ entityType, values = {}, onChange, readOnly = false }) {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        setLoading(true);
        const res = await customFieldService.getFields(entityType);
        if (res.success) {
          setFields(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load custom fields', err);
      } finally {
        setLoading(false);
      }
    };
    if (entityType) {
      fetchFields();
    }
  }, [entityType]);

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Loader2 size={16} className={styles.spinner} /> Loading custom fields...
      </div>
    );
  }

  if (fields.length === 0) {
    if (readOnly) return null;
    return (
      <div className={styles.emptyState}>
        <p>No custom fields defined for {entityType}.</p>
        <Link href="/crm/admin/settings" className={styles.settingsLink}>Manage Fields</Link>
      </div>
    );
  }

  const handleChange = (fieldName, val) => {
    if (onChange) {
      onChange({ ...values, [fieldName]: val });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4 className={styles.title}>Additional Information</h4>
        {!readOnly && <Link href="/crm/admin/settings" className={styles.settingsLink}>Manage</Link>}
      </div>
      <div className={styles.grid}>
        {fields.map(field => {
          let fieldType = field.field_type;
          let options = [];

          if (fieldType === 'select') {
            options = (field.options || []).map(o => ({ value: o, label: o }));
          }

          if (readOnly) {
             const val = values[field.field_name];
             return (
               <div key={field.id} className={styles.readOnlyField}>
                 <label className={styles.readOnlyLabel}>{field.field_label}</label>
                 <div className={styles.readOnlyValue}>
                   {val === undefined || val === null || val === '' ? <span className={styles.emptyVal}>—</span> : 
                     fieldType === 'checkbox' ? (val ? 'Yes' : 'No') : String(val)}
                 </div>
               </div>
             );
          }

          if (fieldType === 'checkbox') {
            return (
              <div key={field.id} className={styles.checkboxField}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={!!values[field.field_name]}
                    onChange={(e) => handleChange(field.field_name, e.target.checked)}
                    className={styles.checkboxInput}
                  />
                  {field.field_label}
                  {field.is_required && <span style={{color: 'red', marginLeft: '4px'}}>*</span>}
                </label>
              </div>
            );
          }

          return (
            <FormField
              key={field.id}
              label={field.field_label}
              type={fieldType === 'select' ? 'select' : fieldType === 'date' ? 'date' : fieldType === 'number' ? 'number' : 'text'}
              name={field.field_name}
              value={values[field.field_name] || ''}
              onChange={(e) => handleChange(field.field_name, e.target.value)}
              required={field.is_required}
              options={options}
            />
          );
        })}
      </div>
    </div>
  );
}
