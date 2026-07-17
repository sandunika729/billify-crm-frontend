'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import leadService from '../../../services/leadService';
import customerService from '../../../services/customerService';
import api from '../../../services/api';
import styles from './page.module.css';
import { Search, Plus, Filter, MoreVertical, Flame, Target, Banknote, Calendar, X, Eye, Mail, Phone, Building2, Edit, Edit2, Trash2, ArrowRightCircle, Download, Upload, Users, UserCheck, LayoutGrid, List, Package, CheckCircle2, ExternalLink, Flag } from 'lucide-react';
import ActivityPanel from '../../../components/crm/ActivityPanel';

import dealService from '../../../services/dealService';
import { useRouter } from 'next/navigation';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/modals/Modal';
import FormField from '../../../components/forms/FormField';
import Badge from '../../../components/ui/Badge';
import SearchBar from '@/components/ui/SearchBar';

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [convertedLeads, setConvertedLeads] = useState([]);
  const [convertedLoaded, setConvertedLoaded] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTemperature, setFilterTemperature] = useState('');
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [viewMode, setViewMode] = useState('table');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'converted'
  const [draggedLeadId, setDraggedLeadId] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignOwnerId, setReassignOwnerId] = useState('');
  const [users, setUsers] = useState([]);
  const [assigneeIds, setAssigneeIds] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewLead, setViewLead] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [leadToConvert, setLeadToConvert] = useState(null);
  const [leadToEdit, setLeadToEdit] = useState(null);
  const [dealStages, setDealStages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [convertData, setConvertData] = useState({ stage_id: '', deal_value: '', expected_close_at: '' });
  const [selectedConvertProducts, setSelectedConvertProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    source: 'website',
    interest: '',
    estimated_value_lkr: '',
    status: 'new',
    temperature: 'cold',
    next_follow_up_at: '',
    customer_id: '',
    customerSearch: ''
  });

  const router = useRouter();

  useEffect(() => {
    fetchLeads();
    fetchCustomers();
    fetchDealStages();
    fetchUsers();
  }, []);

  const fetchDealStages = async () => {
    try {
      const res = await dealService.getStages();
      if (res.success) {
        setDealStages(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch deal stages:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await customerService.getAllCustomers();
      if (res.success) {
        setCustomers(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      // Only fetch non-converted leads for the active tab
      const res = await leadService.getAllLeads({ status: 'active' });
      if (res.success) {
        // Backend may not support 'active' pseudo-status, so filter client-side as fallback
        const all = Array.isArray(res.data) ? res.data : [];
        setLeads(all.filter(l => l.status !== 'converted'));
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConvertedLeads = async () => {
    setLoading(true);
    try {
      const res = await leadService.getAllLeads({ status: 'converted' });
      if (res.success) {
        setConvertedLeads(Array.isArray(res.data) ? res.data : []);
        setConvertedLoaded(true);
      }
    } catch (error) {
      console.error('Failed to fetch converted leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      if (res.data && res.data.success) {
        setUsers(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleFlag = async (e, lead) => {
    e.stopPropagation();
    try {
      const currentStatus = lead.flag_status || 'none';
      let newStatus = 'none';
      if (currentStatus === 'none') newStatus = 'flagged';
      else if (currentStatus === 'flagged') newStatus = 'completed';
      else newStatus = 'none';

      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, flag_status: newStatus } : l));
      await leadService.updateLead(lead.id, { flag_status: newStatus });
    } catch (error) {
      console.error('Failed to toggle flag:', error);
      fetchLeads();
    }
  };

  // Extracts user-friendly error messages, with special handling for 403 permission errors
  const getErrorMessage = (error, fallback) => {
    const status = error?.response?.status;
    const serverMsg = error?.response?.data?.message;
    if (status === 403) {
      if (serverMsg && serverMsg.includes('Required permission:')) {
        const perm = serverMsg.split('Required permission:')[1]?.trim() || '';
        const parts = perm.split('_'); // e.g. ['crm', 'leads', 'create']
        const action = parts[parts.length - 1];
        const module = parts[parts.length - 2];
        const actionLabel = action === 'create' ? 'create' : action === 'update' ? 'edit' : action === 'delete' ? 'delete' : action;
        const moduleLabel = module ? module.charAt(0).toUpperCase() + module.slice(1) : 'this resource';
        return `⚠️ You don't have permission to ${actionLabel} ${moduleLabel}. Please contact your administrator.`;
      }
      return `⚠️ ${serverMsg || "You don't have permission to perform this action. Please contact your administrator."}`;
    }
    return serverMsg || fallback;
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { customerSearch, ...restData } = formData;
      const dataToSave = {
        ...restData,
        customer_id: restData.customer_id || null,
        assignee_ids: assigneeIds
      };

      if (leadToEdit) {
        const res = await leadService.updateLead(leadToEdit.id, dataToSave);
        if (res.success) {
          setLeads(leads.map(l => l.id === leadToEdit.id ? res.data : l));
          setIsModalOpen(false);
          setLeadToEdit(null);
          setAssigneeIds([]);
          setFormData({ name: '', email: '', phone: '', company_name: '', source: 'website', interest: '', estimated_value_lkr: '', status: 'new', temperature: 'cold', next_follow_up_at: '', customer_id: '', customerSearch: '' });
        }
      } else {
        const res = await leadService.createLead(dataToSave);
        if (res.success) {
          setLeads([res.data, ...leads]);
          setIsModalOpen(false);
          setAssigneeIds([]);
          setFormData({ name: '', email: '', phone: '', company_name: '', source: 'website', interest: '', estimated_value_lkr: '', status: 'new', temperature: 'cold', next_follow_up_at: '', customer_id: '', customerSearch: '' });
        }
      }
    } catch (error) {
      console.error('Failed to save lead:', error);
      alert(getErrorMessage(error, 'Error saving lead. Please check your input.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (lead) => {
    setLeadToEdit(lead);
    setAssigneeIds(lead.assignees?.map(a => a.id) || []);
    setFormData({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      company_name: lead.company_name || '',
      source: lead.source || 'website',
      interest: lead.interest || '',
      estimated_value_lkr: lead.estimated_value_lkr || '',
      status: lead.status || 'new',
      temperature: lead.temperature || 'cold',
      next_follow_up_at: (lead.next_follow_up_at && !isNaN(new Date(lead.next_follow_up_at).getTime())) ? new Date(lead.next_follow_up_at).toISOString().split('T')[0] : '',
      customer_id: lead.customer_id || '',
      customerSearch: lead.customer ? lead.customer.name : ''
    });
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      const res = await leadService.deleteLead(id);
      if (res.success) {
        setLeads(leads.filter(l => l.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete lead:', error);
      alert(getErrorMessage(error, 'Error deleting lead.'));
    }
    setOpenMenuId(null);
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedLeads.length} selected lead(s)?`)) return;
    try {
      const res = await leadService.bulkDelete(selectedLeads);
      if (res.success) {
        setLeads(leads.filter(l => !selectedLeads.includes(l.id)));
        setSelectedLeads([]);
      }
    } catch (error) {
      console.error('Failed to bulk delete:', error);
      alert(getErrorMessage(error, 'Error deleting selected leads.'));
    }
  };

  const handleBulkReassign = async () => {
    if (selectedLeads.length === 0 || !reassignOwnerId) return;
    try {
      const res = await leadService.bulkReassign(selectedLeads, reassignOwnerId);
      if (res.success) {
        await fetchLeads();
        setSelectedLeads([]);
        setIsReassignModalOpen(false);
        setReassignOwnerId('');
      }
    } catch (error) {
      console.error('Failed to bulk reassign:', error);
      alert(getErrorMessage(error, 'Error reassigning selected leads.'));
    }
  };

  const handleExport = async () => {
    try {
      await leadService.exportLeads();
    } catch (error) {
      console.error('Failed to export leads:', error);
      alert(getErrorMessage(error, 'Error exporting leads.'));
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setIsSubmitting(true);
    try {
      const res = await leadService.importLeads(importFile);
      if (res.success) {
        alert(res.message || 'Leads imported successfully!');
        setIsImportModalOpen(false);
        setImportFile(null);
        await fetchLeads();
      }
    } catch (error) {
      console.error('Failed to import leads:', error);
      alert(getErrorMessage(error, 'Error importing leads. Please check your CSV format.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelectLead = (id) => {
    setSelectedLeads(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const handleOpenConvertModal = (lead) => {
    setLeadToConvert(lead);
    setConvertData({ stage_id: dealStages.length > 0 ? dealStages[0].id : '', deal_value: lead.estimated_value_lkr || '', expected_close_at: '' });
    setSelectedConvertProducts([]);
    setIsConvertModalOpen(true);
  };

  const handleConvertLead = async (e) => {
    e.preventDefault();
    if (!convertData.stage_id) return alert('Please select a deal stage');

    setIsSubmitting(true);
    try {
      const res = await leadService.convertLead(leadToConvert.id, {
        ...convertData,
        products_interest: selectedConvertProducts
      });
      if (res.success) {
        setLeads(leads.filter(l => l.id !== leadToConvert.id));
        setIsConvertModalOpen(false);
        setSelectedConvertProducts([]);
        alert('Lead successfully converted to Deal!');
        router.push('/crm/deals');
      }
    } catch (error) {
      console.error('Failed to convert lead:', error);
      alert(getErrorMessage(error, 'Error converting lead.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCustomConvertProduct = () => {
    const newItem = {
      product_id: Date.now().toString(),
      product_name: '',
      unit_price: 0,
      qty: 1,
      note: ''
    };
    setSelectedConvertProducts([...selectedConvertProducts, newItem]);
  };

  const handleConvertProductChange = (productId, field, value) => {
    const updated = selectedConvertProducts.map(sp =>
      sp.product_id == productId ? { ...sp, [field]: value } : sp
    );
    setSelectedConvertProducts(updated);

    
    if (field === 'qty' || field === 'unit_price') {
      const total = updated.reduce((sum, sp) => sum + (Number(sp.unit_price) * Number(sp.qty)), 0);
      setConvertData(prev => ({ ...prev, deal_value: total.toFixed(0) }));
    }
  };

  const handleRemoveConvertProduct = (productId) => {
    const updated = selectedConvertProducts.filter(sp => sp.product_id != productId);
    setSelectedConvertProducts(updated);

    const total = updated.reduce((sum, sp) => sum + (Number(sp.unit_price) * Number(sp.qty)), 0);
    setConvertData(prev => ({ ...prev, deal_value: total.toFixed(0) }));
  };

  const handleDragStart = (e, leadId) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedLeadId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, statusValue) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    if (!leadId) return;

    const lead = leads.find(l => String(l.id) === leadId);
    if (!lead || lead.status === statusValue) return;

    setLeads(prevLeads => prevLeads.map(l =>
      String(l.id) === leadId ? { ...l, status: statusValue } : l
    ));

    try {
      await leadService.updateLead(leadId, { status: statusValue });
    } catch (error) {
      console.error('Failed to update lead status:', error);
      fetchLeads();
    }
  };

  const filteredLeads = leads.filter(l => {
    if (filterStatus && l.status !== filterStatus) return false;
    if (filterTemperature && l.temperature !== filterTemperature) return false;
    if (showFlaggedOnly && l.flag_status !== 'flagged') return false;

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      return l.name.toLowerCase().includes(lowerSearch) ||
        (l.customer?.name && l.customer.name.toLowerCase().includes(lowerSearch));
    }
    return true;
  });

  const filteredConvertedLeads = convertedLeads.filter(l => {
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      return l.name.toLowerCase().includes(lowerSearch) ||
        (l.customer?.name && l.customer.name.toLowerCase().includes(lowerSearch)) ||
        (l.company_name && l.company_name.toLowerCase().includes(lowerSearch));
    }
    return true;
  });

  const convertedCount = convertedLeads.length;
  const activeCount = leads.length;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Leads</h1>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" icon={Download} iconsize={12} onClick={handleExport}>
            Export
          </Button>
          <Button variant="outline" icon={Upload} iconsize={12} onClick={() => setIsImportModalOpen(true)}>
            Import
          </Button>
          {activeTab === 'active' ? (
            <>
              <Button variant="outline" icon={CheckCircle2} iconsize={12} onClick={() => {
                setActiveTab('converted');
                setSearchTerm('');
                if (!convertedLoaded) fetchConvertedLeads();
              }}>
                Past Leads
                {convertedCount > 0 && <span className={styles.pastLeadsBadge}>{convertedCount}</span>}
              </Button>
              <Button variant="primary" onClick={() => {
                setLeadToEdit(null);
                setAssigneeIds([]);
                setFormData({ name: '', email: '', phone: '', company_name: '', source: 'website', interest: '', estimated_value_lkr: '', status: 'new', temperature: 'cold', next_follow_up_at: '', customer_id: '', customerSearch: '' });
                setIsModalOpen(true);
              }}>
                New Lead
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => { setActiveTab('active'); setSearchTerm(''); }}>
              ← Back to Active Leads
            </Button>
          )}
        </div>
      </div>


      {activeTab === 'converted' && (
        <div style={{ maxWidth: '400px' }}>
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search converted leads..." label="" />
        </div>
      )}

      {}
      {activeTab === 'active' && selectedLeads.length > 0 && (
        <div className={styles.bulkActionBar}>
          <span className={styles.bulkActionText}>
            {selectedLeads.length} lead(s) selected
          </span>
          <div className={styles.bulkActionButtons}>
            <Button variant="secondary" icon={Users} size="sm" onClick={() => setIsReassignModalOpen(true)}>
              Reassign
            </Button>
            <Button variant="danger" icon={Trash2} size="sm" onClick={handleBulkDelete}>
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'active' && <div className={`${styles.filtersBar} ${styles.filtersBarLayout}`}>
        <div className={styles.filtersLeft}>
          <div className={styles.viewToggleContainer}>
            <span className={styles.viewToggleLabel}>Show as:</span>
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewToggleBtn} ${viewMode === 'board' ? styles.active : ''}`}
                onClick={() => setViewMode('board')}
              >
                <LayoutGrid size={12} /> Board
              </button>
              <button
                className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.active : ''}`}
                onClick={() => setViewMode('table')}
              >
                <List size={12} /> List
              </button>
            </div>
          </div>

          <div className={styles.filterGroup}>
            <button
              className={`${styles.viewToggleBtn}`}
              onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: showFlaggedOnly ? '#fee2e2' : 'white', color: showFlaggedOnly ? '#ef4444' : '#64748b', borderColor: showFlaggedOnly ? '#fca5a5' : '#e2e8f0', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', border: '1px solid' }}
            >
              <Flag size={12} fill={showFlaggedOnly ? '#ef4444' : 'none'} /> Flagged
            </button>
          </div>

          <div className={styles.filterGroup}>
            <select
              className={styles.filterSelect}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="disqualified">Disqualified</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <select
              className={styles.filterSelect}
              value={filterTemperature}
              onChange={(e) => setFilterTemperature(e.target.value)}
            >
              <option value="">All Temperatures</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
            </select>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '200px' }}>
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search leads..." label="" />
        </div>
      </div>}

      {activeTab === 'converted' && (
        <div className={styles.tableCard}>
          <div className={styles.convertedBanner}>
            <CheckCircle2 size={16} />
            <span>These leads have been converted to deals. They are read-only records for reference.</span>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.leadsTable}>
              <thead>
                <tr>
                  <th>Contact Name</th>
                  <th>Company</th>
                  <th>Interest</th>
                  <th>Estimated Value</th>
                  <th>Source</th>
                  <th>Converted On</th>
                  <th className={styles.actionsCol}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className={styles.emptyState}>Loading...</td>
                  </tr>
                ) : filteredConvertedLeads.length === 0 ? (
                  <tr>
                    <td colSpan="7" className={styles.emptyState}>
                      No converted leads yet.
                    </td>
                  </tr>
                ) : (
                  filteredConvertedLeads.map(lead => (
                    <tr key={lead.id} className={styles.convertedRow}>
                      <td>
                        <div className={styles.viewToggleContainer}>
                          <div className={`${styles.avatar} ${styles.avatarConverted}`}>
                            {lead.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>{lead.name}</span>
                            {lead.email && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{lead.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td>{lead.company_name || '—'}</td>
                      <td>{lead.interest || '—'}</td>
                      <td>{lead.estimated_value_lkr ? `Rs. ${Number(lead.estimated_value_lkr).toLocaleString()}` : '—'}</td>
                      <td><Badge variant="default" hasDot={false}>{lead.source || '—'}</Badge></td>
                      <td>{lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : '—'}</td>
                      <td className={styles.actionsCol}>
                        <div className={styles.tableActions}>
                          <button className={styles.actionBtnPrimary} onClick={() => { setViewLead(lead); setIsDetailModalOpen(true); }} title="View Details">
                            <Eye size={12} />
                          </button>
                          {lead.deal_id && (
                            <button
                              className={styles.actionBtnDeal}
                              onClick={() => router.push(`/crm/deals`)}
                              title="View Linked Deal"
                            >
                              <ExternalLink size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'active' && viewMode === 'table' && (
        <div className={styles.tableCard}>

          <div className={styles.tableWrapper}>
            <table className={styles.leadsTable}>
              <thead>
                <tr>
                  <th className={styles.checkboxCol}>
                    <input
                      type="checkbox"
                      checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                      onChange={toggleSelectAll}
                      className={styles.checkboxInput}
                    />
                  </th>
                  <th>Contact Name</th>
                  <th>Interest</th>
                  <th>Estimated Value</th>
                  <th>Status</th>
                  <th>Temperature</th>
                  <th>Assigned To</th>
                  <th>Follow Up</th>
                  <th className={styles.actionsCol}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className={styles.emptyState}>Loading leads...</td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan="9" className={styles.emptyState}>
                      No leads found. Click "New Lead" to add one.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map(lead => (
                    <tr key={lead.id} className={selectedLeads.includes(lead.id) ? styles.selectedRow : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => toggleSelectLead(lead.id)}
                          className={styles.checkboxInput}
                        />
                      </td>
                      <td>
                        <div className={styles.viewToggleContainer}>
                          <div className={styles.avatar}>
                            {lead.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 'normal', color: '#0f172a', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                            {lead.name}
                            <button 
                              onClick={(e) => handleToggleFlag(e, lead)} 
                              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', marginLeft: '4px' }}
                              title={lead.flag_status === 'completed' ? 'Completed' : lead.flag_status === 'flagged' ? 'Flagged' : 'Mark for Follow-up'}
                            >
                              {(!lead.flag_status || lead.flag_status === 'none') && <Flag size={12} color="#94a3b8" fill="none" />}
                              {lead.flag_status === 'flagged' && <Flag size={12} color="#ef4444" fill="#ef4444" />}
                              {lead.flag_status === 'completed' && <CheckCircle2 size={12} color="#10b981" />}
                            </button>
                          </span>
                        </div>
                      </td>
                      <td>
                        {lead.interest || 'Unknown'}
                      </td>
                      <td>
                        {lead.estimated_value_lkr ? `Rs. ${Number(lead.estimated_value_lkr).toLocaleString()}` : '-'}
                      </td>
                      <td>
                        <Badge variant={lead.status} hasDot={true}>{lead.status.replace('_', ' ')}</Badge>
                      </td>
                      <td>
                        <Badge variant={lead.temperature || 'cold'} hasDot={true}>{lead.temperature || 'cold'}</Badge>
                      </td>
                      <td>
                        {lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toLocaleDateString() : 'Not Set'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          {(lead.assignees || []).slice(0, 3).map(a => (
                            <div
                              key={a.id}
                              title={`${a.first_name} ${a.last_name}`}
                              style={{
                                width: '22px', height: '22px', borderRadius: '50%',
                                background: '#e8f0fe', color: '#4f46e5',
                                fontSize: '0.55rem', fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1.5px solid #fff', marginLeft: '-4px'
                              }}
                            >
                              {a.first_name?.[0]}{a.last_name?.[0]}
                            </div>
                          ))}
                          {(lead.assignees || []).length > 3 && (
                            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#f1f5f9', color: '#64748b', fontSize: '0.55rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '-4px' }}>
                              +{(lead.assignees || []).length - 3}
                            </div>
                          )}
                          {(lead.assignees || []).length === 0 && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>—</span>}
                        </div>
                      </td>
                      <td className={styles.actionsCol}>
                        <div className={styles.tableActions}>
                          <button className={styles.actionBtnPrimary} onClick={() => { setViewLead(lead); setIsDetailModalOpen(true); }} title="View Details">
                            <Eye size={12} />
                          </button>
                          {lead.status !== 'converted' && lead.status !== 'disqualified' && (
                            <button className={styles.actionBtnSuccess} onClick={() => handleOpenConvertModal(lead)} title="Convert to Deal">
                              <ArrowRightCircle size={12} />
                            </button>
                          )}
                          <button className={styles.actionBtn} onClick={() => handleOpenEditModal(lead)} title="Edit">
                            <Edit2 size={12} />
                          </button>
                          <button className={styles.actionBtnDelete} onClick={() => handleDeleteLead(lead.id)} title="Delete">
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
      )}

      {activeTab === 'active' && viewMode === 'board' && (
        <div className={styles.boardContainer}>
          {[
            { value: 'new', label: 'New' },
            { value: 'contacted', label: 'Contacted' },
            { value: 'qualified', label: 'Qualified' },
            { value: 'disqualified', label: 'Disqualified' }
          ].map(status => {
            const columnLeads = filteredLeads.filter(l => l.status === status.value);
            return (
              <div
                key={status.value}
                className={styles.boardColumn}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status.value)}
              >
                <div className={`${styles.boardColumnHeader} ${styles.boardColumnHeaderLayout}`}>
                  <div className={styles.boardColumnTitleWrap}>
                    <span className={`${styles.statusDot} ${styles[`statusDot_${status.value}`]}`}></span>
                    <h3 className={styles.boardColumnTitle}>{status.label}</h3>
                  </div>
                  <span className={styles.boardColumnCount}>{columnLeads.length} Leads</span>
                </div>
                <div className={styles.boardColumnContent}>
                  {columnLeads.map(lead => (
                    <div
                      key={lead.id}
                      className={styles.boardCard}
                      onClick={() => { setViewLead(lead); setIsDetailModalOpen(true); }}
                      draggable
                      onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, lead.id); }}
                      onDragEnd={handleDragEnd}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.avatar} style={{ width: '25px', height: '25px', minWidth: '25px', fontSize: '0.6rem', marginRight: '0.75rem', borderRadius: '50%', background: 'var(--color-primary-light, #e8f0fe)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500 }}>
                          {lead.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className={styles.cardHeaderInfo}>
                          <div className={styles.cardName} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'normal' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 1 }}>{lead.name}</span>
                            <button 
                              onClick={(e) => handleToggleFlag(e, lead)} 
                              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0', flexShrink: 0 }}
                              title={lead.flag_status === 'completed' ? 'Completed' : lead.flag_status === 'flagged' ? 'Flagged' : 'Mark for Follow-up'}
                            >
                              {(!lead.flag_status || lead.flag_status === 'none') && <Flag size={10} color="#94a3b8" fill="none" />}
                              {lead.flag_status === 'flagged' && <Flag size={10} color="#ef4444" fill="#ef4444" />}
                              {lead.flag_status === 'completed' && <CheckCircle2 size={10} color="#10b981" />}
                            </button>
                          </div>
                          <div className={styles.cardTime} style={{ fontSize: '0.65rem' }}>
                            {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'Today'}
                          </div>
                        </div>
                        <div className={styles.cardMore}>
                          <button
                            className={styles.moreBtn}
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === lead.id ? null : lead.id); }}
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openMenuId === lead.id && (
                            <div className={styles.dropdownMenu}>
                              <button onClick={(e) => { e.stopPropagation(); setViewLead(lead); setIsDetailModalOpen(true); setOpenMenuId(null); }}>View Details</button>
                              {lead.status !== 'converted' && lead.status !== 'disqualified' && (
                                <button onClick={(e) => { e.stopPropagation(); handleOpenConvertModal(lead); setOpenMenuId(null); }}>Convert to Deal</button>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); handleOpenEditModal(lead); setOpenMenuId(null); }}>Edit Lead</button>
                              <button className={styles.dangerBtn} onClick={(e) => { e.stopPropagation(); handleDeleteLead(lead.id); setOpenMenuId(null); }}>Delete Lead</button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={styles.cardBody} style={{ fontSize: '0.78rem', color: 'var(--color-text-primary)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                        {lead.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={12} style={{ opacity: 0.6 }} /> {lead.phone}
                          </div>
                        )}
                        {lead.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Mail size={12} style={{ opacity: 0.6 }} /> {lead.email}
                          </div>
                        )}
                      </div>

                      <div className={styles.cardFooter}>
                        <Badge variant={lead.temperature || 'cold'} hasDot={true}>{lead.temperature || 'cold'}</Badge>
                        {(lead.assignees || []).length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '6px' }}>
                            {(lead.assignees || []).slice(0, 3).map(a => (
                              <div
                                key={a.id}
                                title={`${a.first_name} ${a.last_name}`}
                                style={{
                                  width: '20px', height: '20px', borderRadius: '50%',
                                  background: '#e8f0fe', color: '#4f46e5',
                                  fontSize: '0.5rem', fontWeight: 700,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  border: '1.5px solid #fff', marginLeft: '-4px'
                                }}
                              >
                                {a.first_name?.[0]}{a.last_name?.[0]}
                              </div>
                            ))}
                            {(lead.assignees || []).length > 3 && (
                              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#f1f5f9', color: '#64748b', fontSize: '0.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '-4px' }}>
                                +{(lead.assignees || []).length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setLeadToEdit(null); }}
        title={leadToEdit ? "Edit Lead" : "Add New Lead"}
        maxWidth="400px"
        hideScrollbar={true}
        footer={
          <Button variant="primary" onClick={handleSaveLead} isLoading={isSubmitting}>{leadToEdit ? "Save Changes" : "Save Lead"}</Button>
        }
      >
        <form id="lead-form" onSubmit={handleSaveLead} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Link Existing Customer (Auto-fill)</label>
            <input
              type="text"
              list="customer-suggestions"
              value={formData.customerSearch || ''}
              onChange={(e) => {
                const search = e.target.value;
                const matched = customers.find(c => c.name.toLowerCase() === search.toLowerCase());
                setFormData(prev => {
                  const newState = {
                    ...prev,
                    customerSearch: search,
                    customer_id: matched ? matched.id : ''
                  };
                  if (matched) {
                    newState.name = matched.name || prev.name;
                    newState.email = matched.email || prev.email;
                    newState.phone = matched.phone || prev.phone;
                    newState.company_name = matched.company_name || prev.company_name;
                  } else if (search.trim() === '') {
                    newState.name = '';
                    newState.email = '';
                    newState.phone = '';
                    newState.company_name = '';
                  }
                  return newState;
                });
              }}
              className={styles.input}
              placeholder="Type customer name..."
            />
            <datalist id="customer-suggestions">
              {customers.map(c => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>

          <FormField
            label="Contact Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="e.g. John Doe"
          />

          <div className={styles.formRow}>
            <FormField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="e.g. contact@example.com"
            />
            <FormField
              label="Phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="e.g. 0771234567"
            />
          </div>

          <FormField
            label="Company Name"
            name="company_name"
            value={formData.company_name}
            onChange={handleInputChange}
            placeholder="e.g. ABC Corp"
          />

          <div className={styles.formRow}>
            <FormField
              label="Source"
              type="select"
              name="source"
              value={formData.source}
              onChange={handleInputChange}
              options={[
                { value: "website", label: "Website" },
                { value: "referral", label: "Referral" },
                { value: "social_media", label: "Social Media" },
                { value: "walk_in", label: "Walk-in" },
                { value: "cold_call", label: "Cold Call" },
                { value: "advertisement", label: "Advertisement" },
                { value: "email", label: "Email" },
                { value: "partner", label: "Partner" },
                { value: "event", label: "Event" },
                { value: "other", label: "Other" }
              ]}
            />
            <FormField
              label="Status"
              type="select"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              options={[
                { value: "new", label: "New" },
                { value: "contacted", label: "Contacted" },
                { value: "qualified", label: "Qualified" },
                { value: "disqualified", label: "Disqualified" }
              ]}
            />
          </div>

          <div className={styles.formRow}>
            <FormField
              label="What does the customer need?"
              type="textarea"
              name="interest"
              value={formData.interest}
              onChange={handleInputChange}
              rows={2}
              placeholder="e.g. Looking for 10 laptops, or needs annual maintenance service for HVAC units..."
            />
            <FormField
              label="Estimated Value (LKR)"
              type="number"
              name="estimated_value_lkr"
              value={formData.estimated_value_lkr}
              onChange={handleInputChange}
              placeholder="e.g. 50000"
            />
          </div>

          <div className={styles.formRow}>
            <FormField
              label="Temperature"
              type="select"
              name="temperature"
              value={formData.temperature}
              onChange={handleInputChange}
              options={[
                { value: "cold", label: "Cold" },
                { value: "warm", label: "Warm" },
                { value: "hot", label: "Hot" }
              ]}
            />
            <FormField
              label="Next Follow-Up Date"
              type="date"
              name="next_follow_up_at"
              value={formData.next_follow_up_at}
              onChange={handleInputChange}
            />
          </div>

          {/* Assign Team Members */}
          {users.length > 0 && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Assign Team Members</label>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
                padding: '0.6rem', borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                maxHeight: '140px', overflowY: 'auto'
              }}>
                {users
                  .filter(u => u.id !== (leadToEdit ? leadToEdit.owner_id : user?.id))
                  .map(u => {
                    const isSelected = assigneeIds.includes(u.id);
                  const initials = `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase();
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setAssigneeIds(prev =>
                        prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]
                      )}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '999px',
                        border: isSelected ? '1.5px solid #4f46e5' : '1.5px solid var(--color-border)',
                        background: isSelected ? '#eef2ff' : 'transparent',
                        color: isSelected ? '#4f46e5' : 'var(--color-text-secondary)',
                        fontSize: '0.72rem', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.15s'
                      }}
                    >
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%',
                        background: isSelected ? '#4f46e5' : '#e2e8f0',
                        color: isSelected ? '#fff' : '#64748b',
                        fontSize: '0.5rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>{initials}</div>
                      {u.first_name} {u.last_name}
                    </button>
                  );
                })}
              </div>
              {assigneeIds.length > 0 && (
                <p style={{ marginTop: '0.35rem', fontSize: '0.68rem', color: '#4f46e5' }}>
                  {assigneeIds.length} member{assigneeIds.length > 1 ? 's' : ''} assigned
                </p>
              )}
            </div>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title="Convert Lead to Deal"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsConvertModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleConvertLead} isLoading={isSubmitting}>Convert Lead</Button>
          </>
        }
      >
        <form id="convert-lead-form" onSubmit={handleConvertLead} className={styles.modalForm}>
          <p className={styles.convertWarningText}>
            You are converting <strong>{leadToConvert?.name}</strong>. This will automatically create a new Deal and link a Customer if one doesn't exist.
          </p>

          <FormField
            label="Deal Stage"
            type="select"
            name="stage_id"
            value={convertData.stage_id}
            onChange={(e) => setConvertData({ ...convertData, stage_id: e.target.value })}
            required
            options={[
              { value: "", label: "-- Select Stage --" },
              ...dealStages.map(stage => ({ value: stage.id, label: stage.name }))
            ]}
          />

          <div style={{ flex: 1 }}>
            <FormField
              label="Estimated Deal Value (LKR)"
              type="number"
              name="deal_value"
              value={convertData.deal_value}
              onChange={(e) => setConvertData({ ...convertData, deal_value: e.target.value })}
              placeholder="e.g. 100000"
            />
            {selectedConvertProducts.length > 0 && (
              <p style={{ fontSize: '0.72rem', color: '#7c3aed', marginTop: '0.25rem' }}>⚡ Auto-calculated from products below</p>
            )}
          </div>

          <FormField
            label="Expected Close Date"
            type="date"
            name="expected_close_at"
            value={convertData.expected_close_at}
            onChange={(e) => setConvertData({ ...convertData, expected_close_at: e.target.value })}
            required
          />

          <div className={styles.formGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className={styles.label}>
                <Package size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Products of Interest
              </label>
              <Button type="button" variant="outline" size="small" onClick={handleAddCustomConvertProduct} icon={Plus}>
                Add Item
              </Button>
            </div>

            {selectedConvertProducts.length > 0 && (
              <div className={styles.productInterestList} style={{ marginTop: '0.5rem' }}>
                {selectedConvertProducts.map(sp => {
                  return (
                    <div key={sp.product_id} className={styles.productInterestRow}>
                      <div className={styles.productInterestName}>
                        <Package size={12} />
                        <input
                          type="text"
                          placeholder="Item Name"
                          value={sp.product_name}
                          onChange={(e) => handleConvertProductChange(sp.product_id, 'product_name', e.target.value)}
                          style={{ padding: '4px', border: '1px solid #ddd', borderRadius: '4px', width: '150px' }}
                        />
                      </div>
                      <div className={styles.productInterestControls}>
                        <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Qty:</label>
                        <input
                          type="number" min="1" value={sp.qty}
                          onChange={(e) => handleConvertProductChange(sp.product_id, 'qty', e.target.value)}
                          className={styles.qtyInput}
                        />
                        <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Price:</label>
                        <input
                          type="number" min="0" value={sp.unit_price ?? 0}
                          onChange={(e) => handleConvertProductChange(sp.product_id, 'unit_price', e.target.value)}
                          className={styles.qtyInput}
                          style={{ width: '80px' }}
                        />
                        <span style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>
                          = Rs. {(Number(sp.unit_price) * Number(sp.qty)).toLocaleString()}
                        </span>
                        <button type="button" className={styles.removeProductBtn} onClick={() => handleRemoveConvertProduct(sp.product_id)}>
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); setViewLead(null); }}
        title=""
        noHeaderBorder={true}
        maxWidth="450px"
      >
        {viewLead && (
          <div className={styles.detailModalContent}>

            <div className={styles.detailBadges}>
              <Badge variant={viewLead.status} hasDot={true}>{viewLead.status.replace('_', ' ')}</Badge>
              <Badge variant={viewLead.temperature || 'cold'} hasDot={true}>{viewLead.temperature || 'cold'}</Badge>
            </div>

            <div className={styles.detailHeader}>
              <div>
                <h3 className={styles.detailTitle}>{viewLead.name}</h3>
                {viewLead.company_name && <p className={styles.detailCompany}>{viewLead.company_name}</p>}
              </div>
            </div>

            <div className={styles.contactInfoGrid}>
              {viewLead.email && (
                <div className={styles.contactInfoItem}>
                  <Mail size={12} /> {viewLead.email}
                </div>
              )}
              {viewLead.phone && (
                <div className={styles.contactInfoItem}>
                  <Phone size={12} /> {viewLead.phone}
                </div>
              )}
              {viewLead.company_name && (
                <div className={styles.contactInfoItem}>
                  <Building2 size={12} /> {viewLead.company_name}
                </div>
              )}
            </div>

            <div className={styles.detailsGrid}>
              <div>
                <p className={styles.detailLabel}>Source</p>
                <p className={styles.detailValue}>{viewLead.source || '—'}</p>
              </div>
              <div>
                <p className={styles.detailLabel}>What Customer Needs</p>
                <p className={styles.detailValueNormal} style={{ whiteSpace: 'pre-wrap' }}>{viewLead.interest || '—'}</p>
              </div>
              <div>
                <p className={styles.detailLabel}>Estimated Value</p>
                <p className={styles.detailValueNormal}>{viewLead.estimated_value_lkr ? `Rs. ${Number(viewLead.estimated_value_lkr).toLocaleString()}` : '—'}</p>
              </div>
              <div>
                <p className={styles.detailLabel}>Next Follow-Up</p>
                <p className={styles.detailValueNormal}>{viewLead.next_follow_up_at ? new Date(viewLead.next_follow_up_at).toLocaleDateString() : 'Not Set'}</p>
              </div>
              <div>
                <p className={styles.detailLabel}>Linked Customer</p>
                <p className={styles.detailValueNormal}>{viewLead.customer?.name || viewLead.Customer?.name || 'Not Linked'}</p>
              </div>
              <div>
                <p className={styles.detailLabel}>Owner</p>
                <p className={styles.detailValueNormal}>{viewLead.owner ? `${viewLead.owner.first_name || ''} ${viewLead.owner.last_name || ''}`.trim() : 'Unassigned'}</p>
              </div>
              <div className={styles.fullWidthCell}>
                <p className={styles.detailLabel}>Created On</p>
                <p className={styles.detailValueNormal}>{viewLead.createdAt ? new Date(viewLead.createdAt).toLocaleString() : '—'}</p>
              </div>
            </div>

            {viewLead.notes && (
              <div>
                <p className={styles.detailLabel}>Notes</p>
                <p className={styles.detailNotes}>{viewLead.notes}</p>
              </div>
            )}

            <ActivityPanel relatedType="lead" relatedId={viewLead.id} />
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isImportModalOpen}
        onClose={() => { setIsImportModalOpen(false); setImportFile(null); }}
        title="Import Leads from CSV"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsImportModalOpen(false); setImportFile(null); }}>Cancel</Button>
            <Button variant="primary" onClick={handleImport} isLoading={isSubmitting} disabled={!importFile}>Import</Button>
          </>
        }
      >
        <div className={styles.modalPadding}>
          <p className={styles.modalText}>
            Upload a CSV file with the following columns: <strong>Name</strong> (required), Email, Phone, Company, Source, Interest, Value, Status, Temperature, Notes.
          </p>
          <p className={styles.modalTextSmall}>
            Tip: Use the <strong>Export</strong> button first to download a template with the correct format.
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setImportFile(e.target.files[0] || null)}
            className={styles.fileInput}
          />
          {importFile && (
            <p className={styles.modalTextSelected}>
              Selected: <strong>{importFile.name}</strong> ({(importFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isReassignModalOpen}
        onClose={() => { setIsReassignModalOpen(false); setReassignOwnerId(''); }}
        title={`Reassign ${selectedLeads.length} Lead(s)`}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsReassignModalOpen(false); setReassignOwnerId(''); }}>Cancel</Button>
            <Button variant="primary" onClick={handleBulkReassign} disabled={!reassignOwnerId}>Reassign</Button>
          </>
        }
      >
        <div className={styles.modalPadding}>
          <p className={styles.modalText}>
            Select a team member to reassign the selected leads to:
          </p>
          <select
            value={reassignOwnerId}
            onChange={(e) => setReassignOwnerId(e.target.value)}
            className={styles.modalSelect}
          >
            <option value="">-- Select Owner --</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  );
}
