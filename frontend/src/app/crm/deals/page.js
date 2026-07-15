'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import dealService from '../../../services/dealService';
import styles from './page.module.css';
import { Plus, Search, Filter, Briefcase, MoreHorizontal, Clock, DollarSign, Calendar, X, Zap, Trash2, Package, LayoutGrid, List, Eye, Edit2, Download, Upload, Phone, Mail, MoreVertical, FileText } from 'lucide-react';
import Badge from '../../../components/ui/Badge';
import ActivityPanel from '../../../components/crm/ActivityPanel';

import customerService from '../../../services/customerService';
import leadService from '../../../services/leadService';
import api from '../../../services/api';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/modals/Modal';
import FormField from '../../../components/forms/FormField';
import SearchBar from '../../../components/ui/SearchBar';
import { useRouter } from 'next/navigation';

export default function DealsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [deals, setDeals] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedDealId, setDraggedDealId] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [isWonPromptOpen, setIsWonPromptOpen] = useState(false);
  const [wonDeal, setWonDeal] = useState(null);
  const [reasonText, setReasonText] = useState('');
  const [pendingStageChange, setPendingStageChange] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [leadsList, setLeadsList] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    customer_id: '',
    lead_id: '',
    value_lkr: '',
    stage_id: '',
    expected_close_at: '',
    notes: ''
  });

  const [dealToEdit, setDealToEdit] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const [viewDeal, setViewDeal] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCloseDate, setFilterCloseDate] = useState('all');
  const [users, setUsers] = useState([]);

  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [selectedStageForAutomation, setSelectedStageForAutomation] = useState(null);
  const [automationRules, setAutomationRules] = useState([]);
  const [isAutomationLoading, setIsAutomationLoading] = useState(false);
  const [newRule, setNewRule] = useState({
    action_type: 'create_task',
    config_task_title: '',
    config_email_subject: '',
    config_email_body: '',
    config_notify_message: ''
  });

  useEffect(() => {
    fetchStages();
    fetchDeals();
    fetchCustomersAndLeads();
  }, []);

  const fetchStages = async () => {
    try {
      const res = await dealService.getStages();
      if (res.success) {
        const loadedStages = Array.isArray(res.data) ? res.data : res.data?.rows || [];
        setStages(loadedStages);
        if (loadedStages.length > 0) {
          setFormData(prev => ({ ...prev, stage_id: loadedStages[0].id }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch stages:', error);
    }
  };

  const fetchCustomersAndLeads = async () => {
    try {
      const [custRes, leadRes, usersRes] = await Promise.all([
        customerService.getAllCustomers(),
        leadService.getAllLeads(),
        api.get('/auth/users')
      ]);
      if (custRes.success) setCustomers(Array.isArray(custRes.data) ? custRes.data : custRes.data?.rows || []);
      if (leadRes.success) setLeadsList(Array.isArray(leadRes.data) ? leadRes.data : leadRes.data?.rows || []);
      if (usersRes.data?.success) setUsers(usersRes.data.data);
    } catch (error) {
      console.error('Failed to fetch modal data:', error);
    }
  };

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const res = await dealService.getAllDeals();
      if (res.success) {
        setDeals(Array.isArray(res.data) ? res.data : res.data?.rows || []);
      }
    } catch (error) {
      console.error('Failed to fetch deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveDeal = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        customer_id: formData.customer_id || null,
        lead_id: formData.lead_id || null,
        value_lkr: formData.value_lkr || 0,
        products_interest: selectedProducts
      };

      if (dealToEdit) {
        const res = await dealService.updateDeal(dealToEdit.id, payload);
        if (res.success) {
          let updatedDeal = res.data;
          
          if (formData.stage_id && String(formData.stage_id) !== String(dealToEdit.stage_id)) {
            try {
              const stageRes = await dealService.updateDealStage(dealToEdit.id, formData.stage_id);
              if (stageRes.success && stageRes.data) updatedDeal = stageRes.data;
            } catch (stageErr) {
              console.warn('Stage update failed:', stageErr);
            }
          }
          setDeals(deals.map(d => d.id === dealToEdit.id ? updatedDeal : d));
          setIsModalOpen(false);
          setSelectedProducts([]);
        }
      } else {
        const res = await dealService.createDeal(payload);
        if (res.success) {
          setDeals([...deals, res.data]);
          setIsModalOpen(false);
          setSelectedProducts([]);
        }
      }
    } catch (error) {
      console.error('Failed to save deal:', error);
      alert('Error saving deal. Please check your input.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCustomItem = () => {
    const newItem = {
      product_id: Date.now().toString(),
      product_name: '',
      unit_price: 0,
      qty: 1,
      note: ''
    };
    setSelectedProducts([...selectedProducts, newItem]);
  };

  const handleProductInterestChange = (productId, field, value) => {
    const updated = selectedProducts.map(sp =>
      sp.product_id == productId ? { ...sp, [field]: value } : sp
    );
    setSelectedProducts(updated);
    
    if (field === 'qty' || field === 'unit_price') {
      const total = updated.reduce((sum, sp) => sum + (Number(sp.unit_price) * Number(sp.qty)), 0);
      setFormData(prev => ({ ...prev, value_lkr: total.toFixed(0) }));
    }
  };

  const handleRemoveProductInterest = (productId) => {
    const updated = selectedProducts.filter(sp => sp.product_id != productId);
    setSelectedProducts(updated);
    const total = updated.reduce((sum, sp) => sum + (Number(sp.unit_price) * Number(sp.qty)), 0);
    setFormData(prev => ({ ...prev, value_lkr: total.toFixed(0) }));
  };

  const handleCreateQuoteFromDeal = (deal) => {
    
    let productsList = deal.products_interest;
    if (typeof productsList === 'string') {
      try { productsList = JSON.parse(productsList); } catch (e) { productsList = []; }
    }
    if (!Array.isArray(productsList)) productsList = [];

    
    if (productsList.length > 0) {
      const cart = productsList.map(sp => ({
        product_id: null,
        item_name: sp.product_name || sp.item_name || sp.description || '',
        qty: Number(sp.qty) || 1,
        unit_price_lkr: Number(sp.unit_price) || Number(sp.unit_price_lkr) || 0,
      }));
      localStorage.setItem('crm_quote_cart', JSON.stringify(cart));
    }
    localStorage.setItem('crm_quote_prefill', JSON.stringify({
      customer_id: deal.customer_id,
      deal_id: deal.id,
    }));
    
    router.push('/crm/quotes?new=1');
  };

  const handleOpenEditModal = (deal) => {
    setDealToEdit(deal);
    setFormData({
      title: deal.title || '',
      customer_id: deal.customer_id || '',
      lead_id: deal.lead_id || '',
      value_lkr: deal.value_lkr || '',
      stage_id: deal.stage_id || '',
      expected_close_at: (deal.expected_close_at && !isNaN(new Date(deal.expected_close_at).getTime())) ? new Date(deal.expected_close_at).toISOString().split('T')[0] : '',
      notes: deal.notes || ''
    });
    let parsedProducts = [];
    if (typeof deal.products_interest === 'string') {
      try { parsedProducts = JSON.parse(deal.products_interest); } catch (e) {}
    } else if (Array.isArray(deal.products_interest)) {
      parsedProducts = deal.products_interest;
    }
    setSelectedProducts(parsedProducts);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDeleteDeal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this deal?')) return;
    try {
      const res = await dealService.deleteDeal(id);
      if (res.success) {
        setDeals(deals.filter(d => d.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete deal:', error);
      alert('Error deleting deal.');
    }
    setOpenMenuId(null);
  };

  const filteredDeals = deals.filter(deal => {
    if (filterOwner && deal.owner_id !== parseInt(filterOwner, 10)) return false;

    if (filterStatus !== 'all') {
      if (filterStatus === 'open' && (deal.status === 'won' || deal.status === 'lost')) return false;
      if (filterStatus === 'won' && deal.status !== 'won') return false;
      if (filterStatus === 'lost' && deal.status !== 'lost') return false;
    }

    if (filterCloseDate !== 'all') {
      if (!deal.expected_close_at) return false;
      const closeDate = new Date(deal.expected_close_at);
      const today = new Date();
      if (filterCloseDate === 'overdue' && closeDate >= today) return false;
      if (filterCloseDate === 'this_month') {
        if (closeDate.getMonth() !== today.getMonth() || closeDate.getFullYear() !== today.getFullYear()) return false;
      }
      if (filterCloseDate === 'next_month') {
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        if (closeDate.getMonth() !== nextMonth.getMonth() || closeDate.getFullYear() !== nextMonth.getFullYear()) return false;
      }
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const titleMatch = deal.title?.toLowerCase().includes(lowerSearch);
      const custMatch = deal.customer?.name?.toLowerCase().includes(lowerSearch);
      return titleMatch || custMatch;
    }
    return true;
  });

  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = filteredDeals.filter(deal => deal.stage_id === stage.id);
    return acc;
  }, {});

  const handleDragStart = (e, dealId) => {
    setDraggedDealId(dealId);
    e.dataTransfer.setData('text/plain', String(dealId));
    e.dataTransfer.effectAllowed = 'move';

    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedDealId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, stageId) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain');
    if (!dealId) return;

    
    const deal = deals.find(d => String(d.id) === String(dealId));
    if (!deal || String(deal.stage_id) === String(stageId)) return;

    const targetStage = stages.find(s => s.id === stageId);
    if (targetStage && (targetStage.is_won_stage || targetStage.is_lost_stage)) {
      setPendingStageChange({ dealId, stageId });
      setReasonText('');
      setIsReasonModalOpen(true);
      return;
    }

    setDeals(prevDeals => prevDeals.map(d =>
      String(d.id) === String(dealId) ? { ...d, stage_id: stageId } : d
    ));

    try {

      await dealService.updateDealStage(dealId, stageId);
    } catch (error) {
      console.error('Failed to update deal stage:', error);

      fetchDeals();
    }
  };

  const handleReasonSubmit = async (e) => {
    e.preventDefault();
    if (!pendingStageChange) return;

    const { dealId, stageId } = pendingStageChange;
    setIsSubmitting(true);

    
    const targetStage = stages.find(s => s.id === stageId);
    const newStatus = targetStage?.is_won_stage ? 'won' : targetStage?.is_lost_stage ? 'lost' : 'open';

    
    setDeals(prevDeals => prevDeals.map(d =>
      String(d.id) === String(dealId) ? { ...d, stage_id: stageId, status: newStatus } : d
    ));

    
    if (newStatus === 'won' || newStatus === 'lost') {
      setFilterStatus('all');
    }

    try {
      await dealService.updateDealStage(dealId, stageId, reasonText);
      setIsReasonModalOpen(false);
      setPendingStageChange(null);
      
      if (targetStage?.is_won_stage) {
        const wonDealData = deals.find(d => String(d.id) === String(dealId)) || { title: '' };
        setWonDeal({ ...wonDealData, stage_id: stageId, status: 'won' });
        setIsWonPromptOpen(true);
      }
    } catch (error) {
      console.error('Failed to update deal stage with reason:', error);
      fetchDeals();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStageTotal = (stageId) => {
    const stageDeals = dealsByStage[stageId] || [];
    return stageDeals.reduce((sum, deal) => sum + Number(deal.value_lkr || 0), 0);
  };

  const handleOpenAutomation = async (stage) => {
    setSelectedStageForAutomation(stage);
    setIsAutomationModalOpen(true);
    setIsAutomationLoading(true);
    try {
      const res = await dealService.getAutomationRules(stage.id);
      if (res.success) {
        setAutomationRules(res.data);
      }
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setIsAutomationLoading(false);
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!selectedStageForAutomation) return;

    let action_config = {};
    if (newRule.action_type === 'create_task') {
      action_config = { task_title: newRule.config_task_title || 'Follow up on deal', due_in_days: 1 };
    } else if (newRule.action_type === 'send_email') {
      action_config = { email_subject: newRule.config_email_subject, email_body: newRule.config_email_body };
    } else if (newRule.action_type === 'notify_owner') {
      action_config = { notification_message: newRule.config_notify_message };
    }

    try {
      const res = await dealService.createAutomationRule(selectedStageForAutomation.id, {
        action_type: newRule.action_type,
        action_config
      });
      if (res.success) {
        setAutomationRules([...automationRules, res.data]);
        setNewRule({
          action_type: 'create_task',
          config_task_title: '',
          config_email_subject: '',
          config_email_body: '',
          config_notify_message: ''
        });
      }
    } catch (error) {
      console.error('Failed to create rule:', error);
      alert('Error creating rule');
    }
  };

  const handleDeleteRule = async (ruleId) => {
    try {
      await dealService.deleteAutomationRule(ruleId);
      setAutomationRules(automationRules.filter(r => r.id !== ruleId));
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleExport = async () => {
    if (filteredDeals.length === 0) { alert('No deals to export.'); return; }
    const headers = ['Deal Title', 'Customer', 'Value (LKR)', 'Expected Close', 'Notes'];
    const rows = filteredDeals.map(d => [
      d.title,
      d.customer?.name || d.lead?.name || 'N/A',
      d.value_lkr || '',
      d.expected_close_at ? new Date(d.expected_close_at).toLocaleDateString() : '',
      d.notes || ''
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    
    const { downloadAndSaveExport } = await import('../../../utils/exportHelper');
    await downloadAndSaveExport(csvContent, `deals-export-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleImport = () => {
    setIsImportModalOpen(true);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    setIsSubmitting(true);
    try {
      setTimeout(() => {
        setIsSubmitting(false);
        setIsImportModalOpen(false);
        setImportFile(null);
        alert('Import Deals feature coming soon in the next update!');
      }, 1000);
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Deals</h1>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" icon={Download} iconSize={14} onClick={handleExport}>
            Export
          </Button>
          <Button variant="outline" icon={Upload} iconSize={14} onClick={handleImport}>
            Import
          </Button>
          <Button variant="primary" onClick={() => {
            setDealToEdit(null);
            setFormData({ title: '', customer_id: '', lead_id: '', value_lkr: '', stage_id: stages.length > 0 ? stages[0].id : '', expected_close_at: '', notes: '' });
            setIsModalOpen(true);
          }}>
            New Deal
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
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

          <div className={styles.filterGroup} style={{ flex: 'none' }}>
            <select
              className={styles.filterSelect}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="open">Open Deals</option>
              <option value="won">Won Deals</option>
              <option value="lost">Lost Deals</option>
              <option value="all">All Deals</option>
            </select>
          </div>
          <div className={styles.filterGroup} style={{ flex: 'none' }}>
            <select
              className={styles.filterSelect}
              value={filterCloseDate}
              onChange={(e) => setFilterCloseDate(e.target.value)}
            >
              <option value="all">Any Close Date</option>
              <option value="this_month">Closing This Month</option>
              <option value="next_month">Closing Next Month</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className={styles.filterGroup} style={{ flex: 'none' }}>
            <select
              className={styles.filterSelect}
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
            >
              <option value="">All Owners</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '200px' }}>
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search deals or customers..." label="" />
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Loading pipeline...</div>
      ) : (
        <>
          {viewMode === 'board' && (
            <div className={styles.boardContainer}>
              {stages.map(stage => (
                <div
                  key={stage.id}
                  className={styles.boardColumn}
                  onDragEnter={handleDragOver}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  <div className={styles.boardColumnHeader}>
                    <div className={styles.stageTitleRow}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stage.color || '#ccc' }} />
                      <h3>{stage.name}</h3>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: '0.5rem' }}>{stage.probability_default}%</span>
                    </div>
                  </div>

                  <div className={styles.boardColumnContent}>
                    {(dealsByStage[stage.id] || []).map(deal => (
                      <div
                        key={deal.id}
                        className={styles.boardCard}
                        onClick={() => { setViewDeal(deal); setIsDetailModalOpen(true); }}
                        draggable
                        onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, deal.id); }}
                        onDragEnd={handleDragEnd}
                      >
                        <div className={styles.cardHeader}>
                          <div className={styles.avatar} style={{ width: '25px', height: '25px', minWidth: '25px', fontSize: '0.6rem', marginRight: '0.75rem', borderRadius: '50%', background: 'var(--color-primary-light, #e8f0fe)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500 }}>
                            {(deal.customer?.name || deal.title).substring(0, 2).toUpperCase()}
                          </div>
                          <div className={styles.cardHeaderInfo}>
                            <div className={styles.cardName} style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.15rem' }}>{deal.title}</div>
                            <div className={styles.cardTime} style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
                              Rs. {Number(deal.value_lkr).toLocaleString()}
                            </div>
                          </div>
                          <div className={styles.cardMore}>
                            <button
                              className={styles.moreBtn}
                              onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === deal.id ? null : deal.id); }}
                            >
                              <MoreVertical size={16} />
                            </button>
                            {openMenuId === deal.id && (
                              <div className={styles.dropdownMenu}>
                                <button onClick={(e) => { e.stopPropagation(); setViewDeal(deal); setIsDetailModalOpen(true); setOpenMenuId(null); }}>View Details</button>
                                <button onClick={(e) => { e.stopPropagation(); handleOpenEditModal(deal); setOpenMenuId(null); }}>Edit Deal</button>
                                {deal.status !== 'won' && deal.status !== 'lost' && (
                                  <button onClick={(e) => { e.stopPropagation(); handleCreateQuoteFromDeal(deal); setOpenMenuId(null); }}>Create Quote</button>
                                )}
                                <button className={styles.dangerBtn} onClick={(e) => { e.stopPropagation(); handleDeleteDeal(deal.id); setOpenMenuId(null); }}>Delete Deal</button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={styles.cardBody} style={{ fontSize: '0.78rem', color: 'var(--color-text-primary)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Briefcase size={12} style={{ opacity: 0.6 }} /> {deal.customer?.name || 'No Customer'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className={deal.expected_close_at && new Date(deal.expected_close_at) < new Date() ? styles.overdueDate : ''}>
                            <Calendar size={12} style={{ opacity: 0.6 }} /> {deal.expected_close_at ? new Date(deal.expected_close_at).toLocaleDateString() : 'No close date'}
                          </div>
                        </div>

                        <div className={styles.cardFooter}>
                          {deal.status !== 'won' && deal.status !== 'lost' && (
                            <button
                              className={styles.boardActionBtn}
                              title="Create Quote from this Deal"
                              onClick={(e) => { e.stopPropagation(); handleCreateQuoteFromDeal(deal); }}
                              style={{ marginLeft: 'auto' }}
                            >
                              + Quote
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'table' && (
            <div className={styles.tableCard}>
              <div className={styles.tableWrapper}>
                <table className={styles.dealsTable}>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Customer / Lead</th>
                      <th>Value</th>
                      <th>Stage</th>
                      <th>Expected Close</th>
                      <th style={{ width: '120px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeals.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                          No deals found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredDeals.map(deal => {
                        const stage = stages.find(s => s.id === deal.stage_id);
                        return (
                          <tr key={deal.id}>
                            <td>
                              <div className={styles.viewToggleContainer}>
                                <div className={styles.avatar} style={{ width: '25px', height: '25px', minWidth: '25px', fontSize: '0.65rem', marginRight: '0.75rem', borderRadius: '50%', background: 'var(--color-primary-light, #e8f0fe)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500 }}>
                                  {deal.title.substring(0, 2).toUpperCase()}
                                </div>
                                <span style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>{deal.title}</span>
                              </div>
                            </td>
                            <td>
                              {deal.customer?.name || deal.lead?.name || 'N/A'}
                            </td>
                            <td>
                              {deal.value_lkr ? `Rs. ${Number(deal.value_lkr).toLocaleString()}` : '-'}
                            </td>
                            <td>
                              {stage ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '0.2rem 0.75rem',
                                  borderRadius: '1rem',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  backgroundColor: stage.color ? `${stage.color}1A` : '#f1f5f9',
                                  color: stage.color || '#64748b'
                                }}>
                                  {stage.name}
                                </span>
                              ) : '-'}
                            </td>
                            <td>
                              {deal.expected_close_at ? new Date(deal.expected_close_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className={styles.actionsCol}>
                              <div className={styles.tableActions}>
                                <button className={styles.actionBtnPrimary} onClick={() => { setViewDeal(deal); setIsDetailModalOpen(true); }} title="View Details">
                                  <Eye size={12} />
                                </button>
                                {deal.status !== 'won' && deal.status !== 'lost' && (
                                  <button className={styles.actionBtnSuccess} onClick={() => handleCreateQuoteFromDeal(deal)} title="Create Quote">
                                    <FileText size={12} />
                                  </button>
                                )}
                                <button className={styles.actionBtn} onClick={() => {
                                  setDealToEdit(deal);
                                  setFormData({
                                    title: deal.title || '',
                                    customer_id: deal.customer_id || '',
                                    lead_id: deal.lead_id || '',
                                    value_lkr: deal.value_lkr || '',
                                    stage_id: deal.stage_id || '',
                                    expected_close_at: (deal.expected_close_at && !isNaN(new Date(deal.expected_close_at).getTime())) ? new Date(deal.expected_close_at).toISOString().split('T')[0] : '',
                                    notes: deal.notes || ''
                                  });
                                  let parsedList = [];
                                  if (typeof deal.products_interest === 'string') {
                                    try { parsedList = JSON.parse(deal.products_interest); } catch (e) {}
                                  } else if (Array.isArray(deal.products_interest)) {
                                    parsedList = deal.products_interest;
                                  }
                                  setSelectedProducts(parsedList);
                                  setIsModalOpen(true);
                                }} title="Edit">
                                  <Edit2 size={12} />
                                </button>
                                <button className={styles.actionBtnDelete} onClick={() => handleDeleteDeal(deal.id)} title="Delete">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={dealToEdit ? "Edit Deal" : "Add New Deal"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveDeal} isLoading={isSubmitting}>{dealToEdit ? "Save Changes" : "Save Deal"}</Button>
          </>
        }
      >
        <form id="create-deal-form" onSubmit={handleSaveDeal} className={styles.modalForm}>
          <FormField label="Deal Title / Name" name="title" value={formData.title} onChange={handleInputChange} required placeholder="e.g. 50 Laptops for TechCorp" />

          <div className={styles.formRow}>
            <FormField
              label="Link Customer" type="select" name="customer_id" value={formData.customer_id} onChange={handleInputChange}
              options={[
                { value: '', label: '-- Select Customer --' },
                ...customers.map(c => ({ value: c.id, label: `${c.name} ${c.company_name ? `(${c.company_name})` : ''}` }))
              ]}
            />
            <FormField
              label="Link Lead (Optional)" type="select" name="lead_id" value={formData.lead_id} onChange={handleInputChange}
              options={[
                { value: '', label: '-- Select Lead --' },
                ...leadsList.map(l => ({ value: l.id, label: l.name }))
              ]}
            />
          </div>

          <div className={styles.formRow}>
            <div style={{ flex: 1 }}>
              <FormField label="Deal Value (LKR)" type="number" name="value_lkr" value={formData.value_lkr} onChange={handleInputChange} required placeholder="e.g. 150000" />
              {selectedProducts.length > 0 && (
                <p style={{ fontSize: '0.72rem', color: '#7c3aed', marginTop: '0.25rem' }}>⚡ Auto-calculated from products below</p>
              )}
            </div>
            <FormField
              label="Pipeline Stage" type="select" name="stage_id" value={formData.stage_id} onChange={handleInputChange}
              options={stages.map(s => ({ value: s.id, label: s.name }))}
            />
          </div>

          <FormField label="Expected Close Date" type="date" name="expected_close_at" value={formData.expected_close_at} onChange={handleInputChange} />

          {}
          <div className={styles.formGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className={styles.label}>
                <Package size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Products of Interest
              </label>
              <Button type="button" variant="outline" size="small" onClick={handleAddCustomItem} icon={Plus}>
                Add Item
              </Button>
            </div>

            {selectedProducts.length > 0 && (
              <div className={styles.productInterestList} style={{ marginTop: '0.5rem' }}>
                {selectedProducts.map(sp => {
                  return (
                    <div key={sp.product_id} className={styles.productInterestRow}>
                      <div className={styles.productInterestName}>
                        <Package size={12} />
                        <input
                          type="text"
                          placeholder="Item Name"
                          value={sp.product_name}
                          onChange={(e) => handleProductInterestChange(sp.product_id, 'product_name', e.target.value)}
                          style={{ padding: '4px', border: '1px solid #ddd', borderRadius: '4px', width: '150px' }}
                        />
                      </div>
                      <div className={styles.productInterestControls}>
                        <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Qty:</label>
                        <input
                          type="number" min="1" value={sp.qty}
                          onChange={(e) => handleProductInterestChange(sp.product_id, 'qty', e.target.value)}
                          className={styles.qtyInput}
                        />
                        <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Price:</label>
                        <input
                          type="number" min="0" value={sp.unit_price ?? 0}
                          onChange={(e) => handleProductInterestChange(sp.product_id, 'unit_price', e.target.value)}
                          className={styles.qtyInput}
                          style={{ width: '80px' }}
                        />
                        <span style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>
                          = Rs. {(Number(sp.unit_price) * Number(sp.qty)).toLocaleString()}
                        </span>
                        <button type="button" className={styles.removeProductBtn} onClick={() => handleRemoveProductInterest(sp.product_id)}>
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <FormField label="Notes / Description" type="textarea" name="notes" value={formData.notes} onChange={handleInputChange} rows={3} placeholder="Add any details, context, or next steps here..." />
        </form>
      </Modal>
      {}
      <Modal
        isOpen={isWonPromptOpen}
        onClose={() => setIsWonPromptOpen(false)}
        title="🎉 Deal Won!"
        maxWidth="480px"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsWonPromptOpen(false)}>Close</Button>
            <Button variant="primary" onClick={() => { setIsWonPromptOpen(false); window.location.href = '/crm/quotes'; }}>
              Go to Quotes
            </Button>
          </>
        }
      >
        <div style={{ padding: '1rem 0', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎊</div>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>
            Congratulations! <strong>{wonDeal?.title}</strong> is won!
          </p>

          {}
          {wonDeal?.products_interest && (() => {
            let prods = wonDeal.products_interest;
            if (typeof prods === 'string') { try { prods = JSON.parse(prods); } catch { prods = []; } }
            return Array.isArray(prods) && prods.length > 0 ? (
              <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', padding: '0.85rem 1rem', textAlign: 'left', marginBottom: '0.85rem' }}>
                <p style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e40af', marginBottom: '0.4rem' }}>
                  📦 Stock Auto-Deducted from Inventory:
                </p>
                {prods.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#334155', padding: '0.2rem 0', borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
                    <span>{p.product_name || `Product ${i + 1}`}</span>
                    <span style={{ fontWeight: 600, color: '#1e40af' }}>-{p.qty} {p.unit || 'pcs'}</span>
                  </div>
                ))}
              </div>
            ) : null;
          })()}

          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '1rem', textAlign: 'left' }}>
            <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#065f46', marginBottom: '0.5rem' }}>✅ Next Step — Convert Quote to Invoice:</p>
            <ol style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', paddingLeft: '1.2rem', lineHeight: 1.7 }}>
              <li>Go to the <strong>Quotes</strong> page</li>
              <li>Find the quote linked to this deal</li>
              <li>Click the <strong>↔ Convert to Invoice</strong> button on the accepted quote</li>
              <li>This will generate a real <strong>POS Invoice</strong> for payment</li>
            </ol>
          </div>
        </div>
      </Modal>

      {}
      <Modal
        isOpen={isReasonModalOpen}
        onClose={() => setIsReasonModalOpen(false)}
        title="Stage Update Reason"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsReasonModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleReasonSubmit} isLoading={isSubmitting}>Confirm Update</Button>
          </>
        }
      >
        <form id="reason-form" onSubmit={handleReasonSubmit} className={styles.modalForm}>
          <FormField
            label="Please provide a reason for winning or losing this deal"
            type="textarea"
            name="reason"
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            required
            rows={4}
            placeholder="e.g., Competitor pricing was lower, or Client signed today!"
          />
        </form>
      </Modal>
      {}
      <Modal
        isOpen={isAutomationModalOpen}
        onClose={() => setIsAutomationModalOpen(false)}
        title={selectedStageForAutomation ? `Automations for: ${selectedStageForAutomation.name}` : 'Automations'}
        maxWidth="600px"
      >
        <div className={styles.rulesList}>
          <h4>Active Rules</h4>
          {isAutomationLoading ? (
            <p>Loading rules...</p>
          ) : automationRules.length === 0 ? (
            <p className={styles.emptyText}>No automations set up for this stage yet.</p>
          ) : (
            <ul className={styles.ruleItems}>
              {automationRules.map(rule => (
                <li key={rule.id} className={styles.ruleItem}>
                  <div className={styles.ruleInfo}>
                    <Zap size={16} className={styles.ruleIcon} />
                    <div>
                      <strong>{rule.action_type.replace('_', ' ').toUpperCase()}</strong>
                      <span className={styles.ruleSubtext}>
                        {rule.action_type === 'create_task' && `Task: ${rule.action_config?.task_title}`}
                        {rule.action_type === 'send_email' && `Subject: ${rule.action_config?.email_subject}`}
                        {rule.action_type === 'notify_owner' && `Alert: ${rule.action_config?.notification_message}`}
                      </span>
                    </div>
                  </div>
                  <button className={styles.deleteRuleBtn} onClick={() => handleDeleteRule(rule.id)}>
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.addRuleSection}>
          <h4>Add New Rule</h4>
          <form onSubmit={handleCreateRule} className={styles.addRuleForm}>
            <FormField
              label="Action" type="select" value={newRule.action_type} onChange={e => setNewRule({ ...newRule, action_type: e.target.value })}
              options={[
                { value: 'create_task', label: 'Create Follow-up Task' },
                { value: 'send_email', label: 'Send Email to Customer' },
                { value: 'notify_owner', label: 'Send Alert to Deal Owner' }
              ]}
            />

            {newRule.action_type === 'create_task' && (
              <FormField label="Task Title (Use {{customer_name}} for dynamic names)" name="config_task_title" required value={newRule.config_task_title} onChange={e => setNewRule({ ...newRule, config_task_title: e.target.value })} placeholder="e.g. Follow up with {{customer_name}}" />
            )}

            {newRule.action_type === 'send_email' && (
              <>
                <FormField label="Email Subject" name="config_email_subject" required value={newRule.config_email_subject} onChange={e => setNewRule({ ...newRule, config_email_subject: e.target.value })} placeholder="e.g. Next steps for your deal" />
                <FormField label="Email Body (Use {{customer_name}} or {{owner_name}})" type="textarea" name="config_email_body" required rows={3} value={newRule.config_email_body} onChange={e => setNewRule({ ...newRule, config_email_body: e.target.value })} placeholder="e.g. Hi {{customer_name}}, thanks for..." />
              </>
            )}

            {newRule.action_type === 'notify_owner' && (
              <FormField label="Notification Message" name="config_notify_message" required value={newRule.config_notify_message} onChange={e => setNewRule({ ...newRule, config_notify_message: e.target.value })} placeholder="e.g. Deal {{deal_title}} moved to Proposal Sent!" />
            )}

            <Button type="submit" variant="primary">+ Add Rule</Button>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); setViewDeal(null); }}
        title="Deal Details"
        maxWidth="600px"
        footer={
          <Button variant="secondary" onClick={() => { setIsDetailModalOpen(false); setViewDeal(null); }}>Close</Button>
        }
      >
        {viewDeal && (
          <div className={styles.dealDetailContainer}>
            <div className={styles.detailHeader}>
              <h2>{viewDeal.title}</h2>
              <span className={styles.stagePill} style={{ backgroundColor: stages.find(s => s.id === viewDeal.stage_id)?.color || '#e2e8f0' }}>
                {stages.find(s => s.id === viewDeal.stage_id)?.name || 'Unknown Stage'}
              </span>
            </div>

            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <label>Value (LKR)</label>
                <p>Rs. {Number(viewDeal.value_lkr).toLocaleString()}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Expected Close</label>
                <p>{viewDeal.expected_close_at ? new Date(viewDeal.expected_close_at).toLocaleDateString() : 'Not set'}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Linked Customer</label>
                <p>{viewDeal.customer?.name || 'None'}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Linked Lead</label>
                <p>{viewDeal.lead?.name || 'None'}</p>
              </div>
            </div>

            <div className={styles.detailNotes}>
              <label>Notes & Details</label>
              <div className={styles.notesBox}>
                {viewDeal.notes || 'No additional notes provided for this deal.'}
              </div>
            </div>

            {}
            {viewDeal.products_interest && (() => {
              let prods = viewDeal.products_interest;
              if (typeof prods === 'string') { try { prods = JSON.parse(prods); } catch { prods = []; } }
              if (Array.isArray(prods) && prods.length > 0) {
                return (
                  <div className={styles.timelineSection} style={{ marginTop: '1rem' }}>
                    <label>Products / Services</label>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                      <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #cbd5e1', color: '#64748b', textAlign: 'left' }}>
                            <th style={{ paddingBottom: '0.5rem' }}>Item</th>
                            <th style={{ paddingBottom: '0.5rem' }}>Qty</th>
                            <th style={{ paddingBottom: '0.5rem', textAlign: 'right' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prods.map((p, i) => (
                            <tr key={i} style={{ borderBottom: i === prods.length - 1 ? 'none' : '1px solid #e2e8f0' }}>
                              <td style={{ padding: '0.5rem 0', fontWeight: 500, color: '#334155' }}>
                                {p.product_name || `Product ${p.product_id}`}
                              </td>
                              <td style={{ padding: '0.5rem 0', color: '#475569' }}>
                                {p.qty} {p.unit || 'pcs'}
                              </td>
                              <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                                Rs. {(Number(p.unit_price || 0) * Number(p.qty || 0)).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <ActivityPanel relatedType="deal" relatedId={viewDeal.id} tenantId={user.tenantId} />

          </div>
        )}
      </Modal>

      <Modal 
        isOpen={isImportModalOpen} 
        onClose={() => { setIsImportModalOpen(false); setImportFile(null); }} 
        title="Import Deals"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsImportModalOpen(false); setImportFile(null); }}>Cancel</Button>
            <Button variant="primary" onClick={handleImportSubmit} disabled={!importFile} isLoading={isSubmitting}>Import CSV</Button>
          </>
        }
      >
        <form id="import-deal-form" onSubmit={handleImportSubmit}>
          <div style={{ marginBottom: '15px', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
            <p>Upload a CSV file to bulk import deals. The file must include a header row.</p>
            <p style={{ marginTop: '10px' }}><strong>Supported Columns:</strong> <code>title</code> (required), <code>value</code>, <code>customer_email</code>, <code>stage</code>.</p>
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
    </div>
  );
}
