'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import customerService from '../../../services/customerService';
import customFieldService from '../../../services/customFieldService';
import styles from './page.module.css';
import Link from 'next/link';
import FormField from '../../../components/forms/FormField';
import formStyles from '../../../components/forms/FormField.module.css';
import Badge from '../../../components/ui/Badge';
import SearchBar from '../../../components/ui/SearchBar';
import FilterSelect from '../../../components/ui/FilterSelect';
import { Search, Plus, Building2, User, Phone, Mail, X, Upload, Download, Eye, Edit2, Trash2, Flag } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/modals/Modal';
import CustomFieldsSection from '../../../components/forms/CustomFieldsSection';
import ContextMenu from '../../../components/ui/ContextMenu';
import ColumnManager from '../../../components/ui/ColumnManager';
import { alert, confirm } from '@/utils/alertService';

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [posCustomers, setPosCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    secondary_phone: '',
    website: '',
    source: '',
    notes: '',
    type: 'retail',
    billify_customer_id: '',
    custom_fields: {}
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const [customFields, setCustomFields] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(['name', 'contact', 'type', 'status', 'added_on']);

  const handleColumnToggle = (colId) => {
    setVisibleColumns(prev => 
      prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]
    );
  };

  const handleContextMenu = (e, customer) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, record: customer });
  };

  useEffect(() => {
    fetchCustomers();
    fetchPosCustomers();
    fetchCustomFields();
  }, []);

  const fetchCustomFields = async () => {
    try {
      const res = await customFieldService.getFields('customer');
      if (res.success) {
        setCustomFields(res.data || []);
      }
    } catch (e) { console.error('Failed to fetch custom fields', e); }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      
      const res = await customerService.getAllCustomers();
      if (res.success) {
        setCustomers(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosCustomers = async () => {
    try {
      const res = await customerService.getPosCustomers();
      if (res.success) {
        setPosCustomers(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch POS customers:', error);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.company_name && c.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = !filterType || c.type === filterType;
    const matchesStatus = !filterStatus || c.status === filterStatus;
    const matchesFlag = !showFlaggedOnly || c.flag_status === 'flagged';
    
    return matchesSearch && matchesType && matchesStatus && matchesFlag;
  });

  const getTypeVariant = (type) => {
    switch (type) {
      case 'individual': return 'new';
      case 'retail': return 'contacted';
      case 'company': return 'qualified';
      case 'wholesale': return 'attempted_contact';
      case 'supplier': return 'disqualified';
      case 'lead_only': return 'sent'; 
      default: return 'default';
    }
  };

  const statusVariant = (s) => {
    if (s === 'active') return 'active';
    if (s === 'inactive') return 'inactive';
    return 'default';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.name.trim()) {
      alert("Full Name is required.");
      return;
    }

    if (formData.phone) {
      const sanitized = formData.phone.trim();
      if (!/^[+]?[\d\s-]+$/.test(sanitized)) {
        alert("Phone number can only contain digits, spaces, and hyphens.");
        return;
      }
      const digitCount = sanitized.replace(/\D/g, '').length;
      const isValidLength = sanitized.startsWith('+') ? (digitCount >= 11 && digitCount <= 12) : (digitCount === 10);
      
      if (!isValidLength) {
        alert("Please enter a valid mobile number (exactly 10 digits).");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      if (!payload.billify_customer_id) payload.billify_customer_id = null;

      if (selectedCustomerId) {
        const res = await customerService.updateCustomer(selectedCustomerId, payload);
        if (res.success) {
          setCustomers(customers.map(c => c.id === selectedCustomerId ? res.data : c));
          closeModal();
        }
      } else {
        const res = await customerService.createCustomer(payload);
        if (res.success) {
          setCustomers([res.data, ...customers]);
          closeModal();
        }
      }
    } catch (error) {
      console.error('Failed to save customer:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error saving customer. Please check your input.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openNewCustomerModal = () => {
    setFormData({ 
      name: '', company_name: '', email: '', phone: '', secondary_phone: '', 
      website: '', source: '', notes: '', type: 'retail', billify_customer_id: '', custom_fields: {}
    });
    setSelectedCustomerId(null);
    setIsModalOpen(true);
  };

  const openEditCustomerModal = (customer) => {
    setFormData({ 
      name: customer.name || '', 
      company_name: customer.company_name || '', 
      email: customer.email || '', 
      phone: customer.phone || '', 
      secondary_phone: customer.secondary_phone || '', 
      website: customer.website || '', 
      source: customer.source || '', 
      notes: customer.notes || '', 
      type: customer.type || 'retail', 
      billify_customer_id: customer.billify_customer_id || '',
      custom_fields: customer.custom_fields || {}
    });
    setSelectedCustomerId(customer.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ 
      name: '', company_name: '', email: '', phone: '', secondary_phone: '', 
      website: '', source: '', notes: '', type: 'retail', billify_customer_id: '', custom_fields: {}
    });
    setSelectedCustomerId(null);
  };

  const handleDeleteCustomer = async (id) => {
    if (!await confirm('Are you sure you want to delete this customer?')) return;
    try {
      const res = await customerService.deleteCustomer(id);
      if (res.success) {
        setCustomers(customers.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete customer:', error);
      alert('Error deleting customer.');
    }
  };

  const handleToggleFlag = async (e, customer) => {
    e.stopPropagation();
    try {
      const currentStatus = customer.flag_status || 'none';
      let newStatus = 'none';
      if (currentStatus === 'none') newStatus = 'flagged';
      else if (currentStatus === 'flagged') newStatus = 'completed';
      else newStatus = 'none';

      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, flag_status: newStatus } : c));
      await customerService.updateCustomer(customer.id, { flag_status: newStatus });
    } catch (error) {
      console.error('Failed to toggle flag:', error);
      fetchCustomers();
    }
  };

  const handleImportCustomers = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    setIsSubmitting(true);
    try {
      const res = await customerService.importCustomers(importFile);
      if (res.success) {
        alert(res.message || 'Import successful!');
        setIsImportModalOpen(false);
        setImportFile(null);
        fetchCustomers();
      }
    } catch (error) {
      console.error('Failed to import customers:', error);
      alert(error.response?.data?.message || 'Error importing customers.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    try {
      const rows = filteredCustomers.map(c => [
        c.name, c.company_name || '', c.email || '', c.phone || '', c.type || 'retail', c.status || 'active'
      ]);
      const csvContent = [
            ["Name", "Company", "Email", "Phone", "Type", "Status"],
            ...rows
          ].map(e => e.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(",")).join("\n");
      
      const { downloadAndSaveExport } = await import('../../../utils/exportHelper');
      await downloadAndSaveExport(csvContent, `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('Failed to export customers:', error);
      alert('Error exporting customers.');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Customers</h1>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" icon={Download} iconSize={14} onClick={handleExport}>
            Export
          </Button>
          <Button variant="outline" icon={Upload} iconSize={14} onClick={() => setIsImportModalOpen(true)}>
            Import
          </Button>
          <Button variant="primary" onClick={openNewCustomerModal}>
            New Customer
          </Button>
        </div>
      </div>

      <div className={styles.filtersBar} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <SearchBar 
            id="customer-search"
            value={searchTerm} 
            onChange={setSearchTerm} 
            placeholder="Search by name, email..." 
            label=""
          />
        </div>
        
        <FilterSelect
          id="filter-type"
          value={filterType}
          onChange={setFilterType}
          options={[
            { value: 'individual', label: 'Individual' },
            { value: 'retail', label: 'Retail' },
            { value: 'company', label: 'Company' },
            { value: 'wholesale', label: 'Wholesale' },
            { value: 'supplier', label: 'Supplier' },
            { value: 'lead_only', label: 'Lead Only' }
          ]}
          placeholder="All Types"
          label=""
        />

        <FilterSelect
          id="filter-status"
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'archived', label: 'Archived' }
          ]}
          placeholder="All Statuses"
          label=""
        />

        <div className={styles.filterGroup}>
          <button
            onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: showFlaggedOnly ? '#fee2e2' : 'var(--color-bg-card)', color: showFlaggedOnly ? '#ef4444' : 'var(--color-text-primary)', borderColor: showFlaggedOnly ? '#fca5a5' : 'var(--color-border)', cursor: 'pointer', padding: '0.55rem 0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid', fontSize: '0.7rem', fontWeight: 500 }}
          >
            <Flag size={12} strokeWidth={1.5} fill={showFlaggedOnly ? '#ef4444' : 'none'} color={showFlaggedOnly ? '#ef4444' : '#64748b'} /> Flagged
          </button>
        </div>

        <ColumnManager 
          columns={[
            { id: 'name', label: 'Name / Company', required: true },
            { id: 'contact', label: 'Contact Info', required: false },
            { id: 'type', label: 'Type', required: false },
            { id: 'status', label: 'Status', required: false },
            { id: 'added_on', label: 'Added On', required: false },
            ...customFields.map(cf => ({ id: `cf_${cf.field_name}`, label: cf.field_label, required: false }))
          ]}
          visibleColumns={visibleColumns}
          onColumnToggle={handleColumnToggle}
        />
      </div>

      <div className={styles.tableCard}>

        <div className={styles.tableWrapper}>
          <table className={styles.customerTable}>
            <thead>
              <tr>
                {visibleColumns.includes('name') && <th>Name / Company</th>}
                {visibleColumns.includes('contact') && <th>Contact Info</th>}
                {visibleColumns.includes('type') && <th>Type</th>}
                {visibleColumns.includes('status') && <th>Status</th>}
                {visibleColumns.includes('added_on') && <th>Added On</th>}
                {customFields.filter(cf => visibleColumns.includes(`cf_${cf.field_name}`)).map(cf => (
                  <th key={cf.id}>{cf.field_label}</th>
                ))}
                <th className={styles.actionsCol}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className={styles.emptyState}>Loading customers...</td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="5" className={styles.emptyState}>
                    No customers found. Click "New Customer" to add one.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr 
                    key={customer.id}
                    onContextMenu={(e) => handleContextMenu(e, customer)}
                    style={customer.flag_status === 'flagged' ? { backgroundColor: 'var(--color-bg-hover, #f1f5f9)' } : {}}
                  >
                    {visibleColumns.includes('name') && (
                      <td>
                        <div className={styles.viewToggleContainer}>
                          <div className={styles.avatar}>
                            {customer.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className={styles.primaryTextLink}>
                              {customer.name}
                            </span>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.includes('contact') && (
                      <td>
                        {customer.phone || '-'}
                      </td>
                    )}
                    {visibleColumns.includes('type') && (
                      <td>
                        <Badge variant={getTypeVariant(customer.type || 'retail')}>
                          {customer.type || 'retail'}
                        </Badge>
                      </td>
                    )}
                    {visibleColumns.includes('status') && (
                      <td>
                        <Badge variant={statusVariant(customer.status || 'active')}>
                          {customer.status || 'active'}
                        </Badge>
                      </td>
                    )}
                    {visibleColumns.includes('added_on') && (
                      <td>
                        {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                    )}
                    {customFields.filter(cf => visibleColumns.includes(`cf_${cf.field_name}`)).map(cf => (
                      <td key={cf.id}>{customer.custom_fields?.[cf.field_name] || '-'}</td>
                    ))}
                    <td className={styles.actionsCol}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button 
                          className={`${styles.actionBtn} ${customer.flag_status === 'flagged' ? styles.flagged : customer.flag_status === 'completed' ? styles.completed : ''}`}
                          onClick={(e) => handleToggleFlag(e, customer)}
                          title={customer.flag_status === 'flagged' ? 'Mark Completed' : customer.flag_status === 'completed' ? 'Clear Flag' : 'Flag'}
                        >
                          <Flag 
                            size={12} 
                            fill={customer.flag_status === 'flagged' ? '#ef4444' : customer.flag_status === 'completed' ? '#10b981' : 'none'} 
                            color={customer.flag_status === 'flagged' ? '#ef4444' : customer.flag_status === 'completed' ? '#10b981' : '#64748b'} 
                          />
                        </button>
                        <Link href={`/crm/customers/${customer.id}`} className={styles.actionBtnPrimary} title="View Details">
                          <Eye size={12} />
                        </Link>
                        <button className={styles.actionBtn} onClick={() => openEditCustomerModal(customer)} title="Edit">
                          <Edit2 size={12} />
                        </button>
                        <button className={styles.actionBtnDelete} onClick={() => handleDeleteCustomer(customer.id)} title="Delete">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        maxWidth="400px"
        title={selectedCustomerId ? "Edit Customer" : "Add New Customer"}
        footer={
          <>
            <Button variant="primary" onClick={handleSaveCustomer} isLoading={isSubmitting}>Save Customer</Button>
          </>
        }
      >
        <form id="create-customer-form" onSubmit={handleSaveCustomer} className={styles.modalForm}>
          <FormField 
            label="Customer Type" 
            type="select"
            name="type" 
            value={formData.type} 
            onChange={handleInputChange}
            options={[
              { value: "individual", label: "Individual" },
              { value: "retail", label: "Retail Customer" },
              { value: "wholesale", label: "Wholesale Customer" },
              { value: "company", label: "Company" },
              { value: "supplier", label: "Supplier" },
              { value: "lead_only", label: "Lead Only" }
            ]}
          />

          <FormField 
            label="Full Name" 
            name="name" 
            value={formData.name} 
            onChange={handleInputChange} 
            required 
            placeholder="e.g. John Doe"
          />

          {formData.type === 'company' && (
            <>
              <FormField 
                label="Company Name" 
                name="company_name" 
                value={formData.company_name} 
                onChange={handleInputChange} 
                required
                placeholder="e.g. Acme Corp"
              />
              <FormField 
                label="Website" 
                name="website" 
                value={formData.website} 
                onChange={handleInputChange} 
                placeholder="https://example.com"
              />
            </>
          )}

          <div className={styles.formRow}>
            <FormField label="Email Address" type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" />
            <FormField label="Primary Phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+94 77 123 4567" />
          </div>

          <div className={styles.formRow}>
            <FormField label="Secondary Phone" name="secondary_phone" value={formData.secondary_phone} onChange={handleInputChange} placeholder="+94 77 987 6543" />
            <FormField 
              label="Source" 
              type="select"
              name="source" 
              value={formData.source} 
              onChange={handleInputChange}
              options={[
                { value: "", label: "-- Select Source --" },
                { value: "website", label: "Website" },
                { value: "referral", label: "Referral" },
                { value: "social_media", label: "Social Media" },
                { value: "walk_in", label: "Walk-in" },
                { value: "other", label: "Other" }
              ]}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Notes</label>
            <textarea 
              name="notes"
              className={formStyles.input}
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Any additional information..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--color-border)', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <FormField 
            label="Link POS Customer (Optional)" 
            type="select"
            name="billify_customer_id" 
            value={formData.billify_customer_id} 
            onChange={handleInputChange}
            options={[
              { value: "", label: "-- Do not link --" },
              ...posCustomers.map(pc => ({ value: pc.id, label: `${pc.name} ${pc.phone ? `(${pc.phone})` : ''}` }))
            ]}
          />

          <CustomFieldsSection 
            entityType="customer" 
            values={formData.custom_fields || {}} 
            onChange={(newVals) => setFormData({ ...formData, custom_fields: newVals })}
          />
        </form>
      </Modal>

      
      <Modal 
        isOpen={isImportModalOpen} 
        onClose={() => { setIsImportModalOpen(false); setImportFile(null); }} 
        title="Import Customers"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsImportModalOpen(false); setImportFile(null); }}>Cancel</Button>
            <Button variant="primary" onClick={handleImportCustomers} disabled={!importFile} isLoading={isSubmitting}>Import CSV</Button>
          </>
        }
      >
        <form id="import-customer-form" onSubmit={handleImportCustomers}>
          <div style={{ marginBottom: '15px', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
            <p>Upload a CSV file to bulk import customers. The file must include a header row.</p>
            <p style={{ marginTop: '10px' }}><strong>Supported Columns:</strong> <code>name</code> (required), <code>email</code>, <code>phone</code>, <code>company_name</code>, <code>type</code> (individual, retail, company), <code>tags</code> (comma separated).</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500 }}>Select CSV File</label>
            <input 
              type="file" 
              className={styles.fileInput}
              accept=".csv"
              onChange={(e) => setImportFile(e.target.files[0])}
              required
            />
            {importFile && (
              <p style={{ marginTop: '5px', fontSize: '13px' }}>Selected: {importFile.name}</p>
            )}
          </div>
        </form>
      </Modal>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            { label: contextMenu.record.flag_status === 'flagged' ? 'Mark Completed' : contextMenu.record.flag_status === 'completed' ? 'Clear Flag' : 'Flag', icon: Flag, onClick: (e) => handleToggleFlag(e, contextMenu.record) },
            { label: 'View Details', icon: Eye, onClick: () => window.location.href = `/crm/customers/${contextMenu.record.id}` },
            { label: 'Edit Customer', icon: Edit2, onClick: () => openEditCustomerModal(contextMenu.record) },
            { label: 'Delete', icon: Trash2, onClick: () => handleDeleteCustomer(contextMenu.record.id), variant: 'danger' }
          ]}
        />
      )}
    </div>
  );
}
