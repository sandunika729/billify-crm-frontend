'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import quoteService from '../../../services/quoteService';
import styles from './page.module.css';
import { Plus, FileText, Calendar, Download, Upload, Send, ArrowRightLeft, LayoutGrid, List, Trash2, CheckCircle, XCircle, MessageSquare, ChevronRight, Phone, Copy, Flag } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import SearchBar from '../../../components/ui/SearchBar';
import ContextMenu from '../../../components/ui/ContextMenu';
import Modal from '../../../components/modals/Modal';
import CreateQuoteModal from './CreateQuoteModal';
import ColumnManager from '../../../components/ui/ColumnManager';
import customFieldService from '../../../services/customFieldService';
import { alert, confirm } from '@/utils/alertService';

const QUOTE_STATUSES = [
  { value: 'draft',     label: 'Draft',     color: '#64748b' },
  { value: 'sent',      label: 'Sent',      color: '#3b82f6' },
  { value: 'viewed',    label: 'Viewed',    color: '#8b9be2' },
  { value: 'accepted',  label: 'Accepted',  color: '#10b981' },
  { value: 'rejected',  label: 'Rejected',  color: '#ef4444' },
  { value: 'expired',   label: 'Expired',   color: '#f59e0b' },
  { value: 'converted', label: 'Converted', color: '#059669' },
];

const WORKFLOW_STEPS = [
  { id: 'created',   label: 'Created',         statuses: ['draft'] },
  { id: 'sent',      label: 'Sent to Customer', statuses: ['sent', 'viewed'] },
  { id: 'responded', label: 'Customer Responded', statuses: ['accepted', 'rejected'] },
  { id: 'done',      label: 'Closed / Converted', statuses: ['converted', 'expired'] },
];

function getWorkflowStep(status) {
  for (let i = 0; i < WORKFLOW_STEPS.length; i++) {
    if (WORKFLOW_STEPS[i].statuses.includes(status)) return i;
  }
  return 0;
}

export default function QuotesPage() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);

  const [customFields, setCustomFields] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(['quote_no', 'customer', 'amount', 'valid_until', 'status']);

  const handleColumnToggle = (colId) => {
    setVisibleColumns(prev => 
      prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]
    );
  };

  const handleContextMenu = (e, quote) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, record: quote });
  };

  
  const [activeWorkflowQuote, setActiveWorkflowQuote] = useState(null);

  
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseQuote, setResponseQuote] = useState(null);
  const [responseDecision, setResponseDecision] = useState('accepted');
  const [responseNote, setResponseNote] = useState('');
  const [responseLoading, setResponseLoading] = useState(false);

  useEffect(() => {
    fetchQuotes();
    fetchCustomFields();
    const params = window.location.search;
    if (params.includes('action=create') || params.includes('new=1')) {
      setIsCreateModalOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await quoteService.getAllQuotes();
      if (res.success) {
        setQuotes(Array.isArray(res.data) ? res.data : res.data?.rows || []);
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomFields = async () => {
    try {
      const res = await customFieldService.getFields('quote');
      if (res.success) {
        setCustomFields(res.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch custom fields for quotes:', e);
    }
  };

  const filteredQuotes = quotes.filter(q => {
    const customerName = q.Customer?.name || q.customer?.name || '';
    const matchesSearch =
      q.quote_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || q.status === filterStatus;
    const matchesFlag = !showFlaggedOnly || q.flag_status === 'flagged';
    return matchesSearch && matchesStatus && matchesFlag;
  });

  const handleToggleFlag = async (e, quote) => {
    e.stopPropagation();
    try {
      const currentStatus = quote.flag_status || 'none';
      const newStatus = currentStatus === 'flagged' ? 'none' : 'flagged';

      setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, flag_status: newStatus } : q));
      await quoteService.updateQuote(quote.id, { flag_status: newStatus });
    } catch (error) {
      console.error('Failed to toggle flag:', error);
      fetchQuotes();
    }
  };


  
  const handleDownloadPdf = async (quote) => {
    try {
      const rawBlob = await quoteService.downloadPdf(quote.id);
      const blob = new Blob([rawBlob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote-${quote.quote_no}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF.');
    }
  };

  
  const handleSendEmail = async (quote) => {
    const email = quote.Customer?.email || quote.customer?.email;
    if (!email) {
      alert('This customer does not have an email address on file.\nPlease add one in the Customers section.');
      return;
    }
    const customerName = quote.Customer?.name || quote.customer?.name || 'Customer';
    const amount = Number(quote.total_lkr).toLocaleString();
    const validUntil = quote.valid_until
      ? new Date(quote.valid_until).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'N/A';

    const subject = `Quotation ${quote.quote_no} from Billify`;
    const body =
      `Dear ${customerName},\n\n` +
      `Please find your quotation details below:\n\n` +
      `Quote No: ${quote.quote_no}\n` +
      `Total Amount: Rs. ${amount}\n` +
      `Valid Until: ${validUntil}\n\n` +
      `Please review and confirm your acceptance. Feel free to contact us for any queries.\n\n` +
      `Note: Please find the PDF quote attached to this email.\n\n` +
      `Thank you!`;

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      await quoteService.sendEmail(quote.id, { to_email: email, subject, message: body });
      window.open(mailtoUrl, '_blank');
      setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, status: 'sent' } : q));
      if (activeWorkflowQuote?.id === quote.id) {
        setActiveWorkflowQuote(prev => ({ ...prev, status: 'sent' }));
      }
    } catch (error) {
      
      window.open(mailtoUrl, '_blank');
    }
  };

  
  const handleSendWhatsApp = (quote) => {
    const phone = quote.Customer?.phone || quote.customer?.phone;
    const customerName = quote.Customer?.name || quote.customer?.name || 'Customer';
    const amount = Number(quote.total_lkr).toLocaleString();
    const validUntil = quote.valid_until
      ? new Date(quote.valid_until).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'N/A';

    const message =
      `Hello ${customerName},\n\n` +
      `Please find your quotation details below:\n\n` +
      `📋 *Quote No:* ${quote.quote_no}\n` +
      `💰 *Total Amount:* Rs. ${amount}\n` +
      `📅 *Valid Until:* ${validUntil}\n` +
      (quote.Deal?.title || quote.deal?.title ? `🤝 *Deal:* ${quote.Deal?.title || quote.deal?.title}\n` : '') +
      `\nPlease review and confirm your acceptance. Feel free to contact us for any questions.\n\nThank you! 🙏`;

    let cleanPhone = (phone || '').replace(/[^0-9+]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '94' + cleanPhone.slice(1);

    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank');

    
    if (quote.status === 'draft') {
      quoteService.updateQuoteStatus(quote.id, 'sent').then(() => {
        setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, status: 'sent' } : q));
        if (activeWorkflowQuote?.id === quote.id) {
          setActiveWorkflowQuote(prev => ({ ...prev, status: 'sent' }));
        }
      }).catch(() => {});
    }
  };

  
  const handleMarkViewed = async (quote) => {
    if (['sent'].includes(quote.status)) {
      try {
        await quoteService.updateQuoteStatus(quote.id, 'viewed');
        setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, status: 'viewed' } : q));
        if (activeWorkflowQuote?.id === quote.id) {
          setActiveWorkflowQuote(prev => ({ ...prev, status: 'viewed' }));
        }
      } catch {}
    }
  };

  
  const handleOpenResponseModal = (quote) => {
    setResponseQuote(quote);
    setResponseDecision('accepted');
    setResponseNote('');
    setIsResponseModalOpen(true);
  };

  
  const handleSubmitResponse = async () => {
    if (!responseQuote) return;
    setResponseLoading(true);
    try {
      await quoteService.updateQuoteStatus(responseQuote.id, responseDecision);
      setQuotes(prev => prev.map(q => q.id === responseQuote.id ? { ...q, status: responseDecision } : q));
      if (activeWorkflowQuote?.id === responseQuote.id) {
        setActiveWorkflowQuote(prev => ({ ...prev, status: responseDecision }));
      }
      setIsResponseModalOpen(false);
      setResponseQuote(null);
      setResponseNote('');
    } catch (error) {
      alert('Failed to update quote status.');
    } finally {
      setResponseLoading(false);
    }
  };

  
  const handleConvertToInvoice = async (quote) => {
    const confirmConvert = await confirm(
      `Convert Quote ${quote.quote_no} to a POS Invoice?\n\nThis will generate a real financial record in the system.`
    );
    if (!confirmConvert) return;
    try {
      const res = await quoteService.convertToInvoice(quote.id);
      if (res.success) {
        alert(`✅ Successfully converted!\nInvoice ${res.data.bill.bill_number} has been generated.`);
        fetchQuotes();
        setActiveWorkflowQuote(null);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to convert quote to invoice.');
    }
  };

  const handleCloneQuote = async (quote) => {
    try {
      const fullQuote = await quoteService.getQuoteById(quote.id);
      
      const cart = (fullQuote.items || []).map(item => ({
        product_id: item.product_id,
        item_name: item.description || item.item_name,
        qty: item.quantity,
        unit_price_lkr: item.unit_price,
        discount_lkr: 0,
        tax_lkr: 0,
      }));
      
      localStorage.setItem('crm_quote_cart', JSON.stringify(cart));
      localStorage.setItem('crm_quote_prefill', JSON.stringify({
        customer_id: fullQuote.customer_id,
        deal_id: fullQuote.deal_id,
      }));
      
      setIsCreateModalOpen(true);
    } catch (error) {
      console.error('Failed to clone quote', error);
      alert('Failed to fetch quote details for cloning.');
    }
  };

  const handleDeleteQuote = async (quote) => {
    if (!await confirm(`Delete quote ${quote.quote_no}?`)) return;
    try {
      const res = await quoteService.deleteQuote(quote.id);
      if (res.success) {
        setQuotes(quotes.filter(q => q.id !== quote.id));
        if (activeWorkflowQuote?.id === quote.id) setActiveWorkflowQuote(null);
      }
    } catch (error) {
      alert('Failed to delete quote.');
    }
  };

  const handleUpdateStatus = async (quote, newStatus) => {
    if (newStatus === quote.status) return;
    try {
      await quoteService.updateQuoteStatus(quote.id, newStatus);
      setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, status: newStatus } : q));
      if (activeWorkflowQuote?.id === quote.id) {
        setActiveWorkflowQuote(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      alert('Failed to update status.');
    }
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
        alert('Import Quotes feature coming soon in the next update!');
      }, 1000);
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    if (filteredQuotes.length === 0) { alert('No quotes to export.'); return; }
    const headers = ['Quote No', 'Customer', 'Deal', 'Amount (LKR)', 'Status', 'Valid Until', 'Created At'];
    const rows = filteredQuotes.map(q => [
      q.quote_no,
      q.Customer?.name || q.customer?.name || 'N/A',
      q.Deal?.title || q.deal?.title || 'N/A',
      Number(q.total_lkr).toFixed(2),
      q.status,
      q.valid_until ? new Date(q.valid_until).toLocaleDateString() : 'N/A',
      q.created_at ? new Date(q.created_at).toLocaleDateString() : ''
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    
    const { downloadAndSaveExport } = await import('../../../utils/exportHelper');
    await downloadAndSaveExport(csvContent, `quotes-export-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const getStatusMeta = (status) => QUOTE_STATUSES.find(s => s.value === status) || QUOTE_STATUSES[0];

  return (
    <div className={styles.pageContainer}>

      {}
      <div className={styles.pageHeader}>
        <div>
          <h1>Quotations</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button variant="outline" icon={Download} iconSize={14} onClick={handleExport}>Export</Button>
          <Button variant="outline" icon={Upload} iconSize={14} onClick={handleImport}>Import</Button>
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} /> Create Quote
          </Button>
        </div>
      </div>

      {}
      <Modal
        isOpen={!!activeWorkflowQuote}
        onClose={() => setActiveWorkflowQuote(null)}
        title="Quote Workflow"
        maxWidth="850px"
      >
        {activeWorkflowQuote && (
          <div className={styles.workflowPanelModalContent}>
            <div className={styles.workflowPanelHeader} style={{ paddingTop: 0 }}>
              <div>
                <span className={styles.workflowPanelQuoteNo}>{activeWorkflowQuote.quote_no}</span>
                <span className={styles.workflowPanelCustomer}>
                  — {activeWorkflowQuote.Customer?.name || activeWorkflowQuote.customer?.name || 'Unknown Customer'}
                </span>
                <span className={styles.workflowPanelAmount}>
                  Rs. {Number(activeWorkflowQuote.total_lkr).toLocaleString()}
                </span>
              </div>
            </div>

            {}
            <div className={styles.stepper}>
              {WORKFLOW_STEPS.map((step, idx) => {
                const currentStep = getWorkflowStep(activeWorkflowQuote.status);
                const isDone = idx < currentStep;
                const isActive = idx === currentStep;
                const isRejected = activeWorkflowQuote.status === 'rejected' && step.id === 'responded';
                return (
                  <React.Fragment key={step.id}>
                    <div className={`${styles.stepItem} ${isDone ? styles.stepDone : ''} ${isActive ? styles.stepActive : ''} ${isRejected ? styles.stepRejected : ''}`}>
                      <div className={styles.stepCircle}>
                        {isDone ? <CheckCircle size={16} /> : <span>{idx + 1}</span>}
                      </div>
                      <span className={styles.stepLabel}>{step.label}</span>
                    </div>
                    {idx < WORKFLOW_STEPS.length - 1 && (
                      <div className={`${styles.stepConnector} ${isDone ? styles.stepConnectorDone : ''}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {}
            <div className={styles.workflowActions}>

              {}
              <button className={styles.wfBtn} onClick={() => handleDownloadPdf(activeWorkflowQuote)}>
                <Download size={12} /> Download PDF
              </button>
              <button className={styles.wfBtn} onClick={() => handleCloneQuote(activeWorkflowQuote)}>
                <Copy size={12} /> Clone / Revise Quote
              </button>

              {}
              {!['accepted', 'rejected', 'converted', 'expired'].includes(activeWorkflowQuote.status) && (
                <>
                  <button className={`${styles.wfBtn} ${styles.wfBtnEmail}`} onClick={() => handleSendEmail(activeWorkflowQuote)}>
                    <Send size={12} /> Send Email
                  </button>
                  <button className={`${styles.wfBtn} ${styles.wfBtnWA}`} onClick={() => handleSendWhatsApp(activeWorkflowQuote)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Send WhatsApp
                  </button>
                </>
              )}

              {}
              {activeWorkflowQuote.status === 'sent' && (
                <button className={`${styles.wfBtn} ${styles.wfBtnViewed}`} onClick={() => handleMarkViewed(activeWorkflowQuote)}>
                  <MessageSquare size={12} /> Mark as Viewed
                </button>
              )}

              {}
              {['sent', 'viewed'].includes(activeWorkflowQuote.status) && (
                <button className={`${styles.wfBtn} ${styles.wfBtnResponse}`} onClick={() => handleOpenResponseModal(activeWorkflowQuote)}>
                  <MessageSquare size={12} /> Log Customer Response
                </button>
              )}

              {}
              {activeWorkflowQuote.status === 'accepted' && (
                <button className={`${styles.wfBtn} ${styles.wfBtnConvert}`} onClick={() => handleConvertToInvoice(activeWorkflowQuote)}>
                  <ArrowRightLeft size={12} /> Convert to POS Invoice
                </button>
              )}

              {}
              {activeWorkflowQuote.status === 'rejected' && (
                <div className={styles.wfRejectedNote}>
                  <XCircle size={12} /> Customer rejected this quote. You may create a revised quote.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {}
      <div className={styles.filtersBar} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search quotes..."
            label=""
            className={styles.searchBarWrapper}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexShrink: 0 }}>
          <div className={styles.filterGroup}>
            <select
              className={styles.filterSelect}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {QUOTE_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          
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
              { id: 'quote_no', label: 'Quote No.', required: true },
              { id: 'customer', label: 'Customer / Deal', required: false },
              { id: 'amount', label: 'Amount (LKR)', required: false },
              { id: 'valid_until', label: 'Valid Until', required: false },
              { id: 'status', label: 'Status', required: false },
              ...customFields.map(cf => ({ id: `cf_${cf.field_name}`, label: cf.field_label, required: false }))
            ]}
            visibleColumns={visibleColumns}
            onColumnToggle={handleColumnToggle}
          />
        </div>
      </div>

      {}
      {viewMode === 'table' && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.quotesTable}>
              <thead>
                <tr>
                  {visibleColumns.includes('quote_no') && <th>Quote No.</th>}
                  {visibleColumns.includes('customer') && <th>Customer / Deal</th>}
                  {visibleColumns.includes('amount') && <th>Amount (LKR)</th>}
                  {visibleColumns.includes('valid_until') && <th>Valid Until</th>}
                  {visibleColumns.includes('status') && <th>Status</th>}
                  {customFields.filter(cf => visibleColumns.includes(`cf_${cf.field_name}`)).map(cf => (
                    <th key={cf.id}>{cf.field_label}</th>
                  ))}
                  <th className={styles.actionsCol}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className={styles.emptyState}>Loading quotes...</td></tr>
                ) : filteredQuotes.length === 0 ? (
                  <tr><td colSpan="6" className={styles.emptyState}>No quotations found. Click "Create Quote" to start.</td></tr>
                ) : (
                  filteredQuotes.map(quote => {
                    const statusMeta = getStatusMeta(quote.status);
                    const isActive = activeWorkflowQuote?.id === quote.id;
                    return (
                      <tr
                        key={quote.id}
                        className={isActive ? styles.activeRow : ''}
                        onClick={() => setActiveWorkflowQuote(quote)}
                        style={quote.flag_status === 'flagged' ? { backgroundColor: 'var(--color-bg-hover, #f1f5f9)', cursor: 'pointer' } : { cursor: 'pointer' }}
                        onContextMenu={(e) => handleContextMenu(e, quote)}
                      >
                        {visibleColumns.includes('quote_no') && (
                          <td>
                            <div className={styles.viewToggleContainer}>
                              <span className={styles.primaryTextLink} style={{ fontWeight: 600 }}>
                                {quote.quote_no}
                              </span>
                            </div>
                          </td>
                        )}
                        {visibleColumns.includes('customer') && (
                          <td>
                            <div>
                              <span className={styles.primaryTextLink} style={{ fontWeight: 600 }}>
                                {quote.Customer?.name || quote.customer?.name || 'Unknown'}
                              </span>
                              {(quote.Deal || quote.deal) && (
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                  Deal: {quote.Deal?.title || quote.deal?.title}
                                </div>
                              )}
                            </div>
                          </td>
                        )}
                        {visibleColumns.includes('amount') && (
                          <td>
                            <span className={styles.amountText} style={{ fontWeight: 600 }}>
                              Rs. {Number(quote.total_lkr).toLocaleString()}
                            </span>
                          </td>
                        )}
                        {visibleColumns.includes('valid_until') && (
                          <td>
                            {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'N/A'}
                          </td>
                        )}
                        {visibleColumns.includes('status') && (
                          <td>
                            <span style={{ 
                              background: `${statusMeta.color}15`, 
                              color: statusMeta.color, 
                              border: `1px solid ${statusMeta.color}30`,
                              padding: '0.2rem 0.6rem',
                              borderRadius: 99,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textTransform: 'capitalize',
                              display: 'inline-block'
                            }}>
                              {statusMeta.label}
                            </span>
                          </td>
                        )}
                        {customFields.filter(cf => visibleColumns.includes(`cf_${cf.field_name}`)).map(cf => (
                          <td key={cf.id}>{quote.custom_fields?.[cf.field_name] || '-'}</td>
                        ))}
                        <td className={styles.actionsCol} onClick={e => e.stopPropagation()}>
                          <div className={styles.rowActions} style={{ gap: '8px' }}>
                            <button 
                              className={`${styles.actionBtn} ${quote.flag_status === 'flagged' ? styles.flagged : ''}`}
                              onClick={(e) => handleToggleFlag(e, quote)}
                              title={quote.flag_status === 'flagged' ? 'Clear Flag' : 'Flag'}
                            >
                              <Flag 
                                size={12} 
                                fill={quote.flag_status === 'flagged' ? '#ef4444' : 'none'} 
                                color={quote.flag_status === 'flagged' ? '#ef4444' : '#64748b'} 
                              />
                            </button>
                            <button className={styles.actionBtn} title="Download PDF" onClick={() => handleDownloadPdf(quote)}>
                              <Download size={12} />
                            </button>
                            <button className={styles.actionBtn} title="Clone Quote" onClick={() => handleCloneQuote(quote)} style={{ color: 'var(--color-primary)' }}>
                              <Copy size={12} />
                            </button>
                            {!['accepted', 'rejected', 'converted', 'expired'].includes(quote.status) && (
                              <button className={styles.actionBtn} title="Send via Email" onClick={() => handleSendEmail(quote)}>
                                <Send size={12} />
                              </button>
                            )}
                            {quote.status === 'accepted' && (
                              <button
                                className={styles.actionBtn}
                                title="Convert to POS Invoice"
                                onClick={() => handleConvertToInvoice(quote)}
                                style={{ color: 'var(--color-success)' }}
                              >
                                <ArrowRightLeft size={12} />
                              </button>
                            )}
                            <button
                              className={styles.actionBtn}
                              title="Open Workflow"
                              onClick={() => setActiveWorkflowQuote(quote)}
                              style={{ color: 'var(--color-primary)' }}
                            >
                              <ChevronRight size={12} />
                            </button>
                            <button
                              className={styles.actionBtnDelete}
                              title="Delete"
                              onClick={() => handleDeleteQuote(quote)}
                              style={{ color: 'var(--color-danger)' }}
                            >
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

      {}
      {viewMode === 'board' && (
        <div className={styles.boardContainer}>
          {QUOTE_STATUSES.map(status => {
            const columnQuotes = filteredQuotes.filter(q => q.status === status.value);
            return (
              <div key={status.value} className={styles.boardColumn}>
                <div className={styles.boardColumnHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: status.color, flexShrink: 0 }}></span>
                    <h3>{status.label}</h3>
                  </div>
                  <span className={styles.boardColumnCount}>{columnQuotes.length}</span>
                </div>
                <div className={styles.boardColumnContent}>
                  {columnQuotes.map(quote => (
                    <div
                      key={quote.id}
                      className={`${styles.boardCard} ${activeWorkflowQuote?.id === quote.id ? styles.boardCardActive : ''}`}
                      onClick={() => setActiveWorkflowQuote(quote)}
                    >
                      <div className={styles.boardCardHeader}>
                        <span className={styles.boardCardQuoteNo}>{quote.quote_no}</span>
                        <span className={styles.boardCardAmount}>Rs. {Number(quote.total_lkr).toLocaleString()}</span>
                      </div>
                      <h4 className={styles.boardCardTitle}>{quote.Customer?.name || quote.customer?.name || 'Unknown Customer'}</h4>
                      {(quote.Deal || quote.deal) && (
                        <p className={styles.boardCardDeal}>Deal: {quote.Deal?.title || quote.deal?.title}</p>
                      )}
                      <p className={styles.boardCardDate}>
                        {quote.valid_until ? `Valid until ${new Date(quote.valid_until).toLocaleDateString()}` : 'No expiry set'}
                      </p>
                      <div className={styles.boardCardActions}>
                        <button className={styles.boardActionBtn} title="Download PDF" onClick={e => { e.stopPropagation(); handleDownloadPdf(quote); }}>
                          <Download size={12} />
                        </button>
                        <button className={styles.boardActionBtn} title="Clone Quote" onClick={e => { e.stopPropagation(); handleCloneQuote(quote); }} style={{ color: 'var(--color-primary)' }}>
                          <Copy size={12} />
                        </button>
                        {!['accepted', 'rejected', 'converted', 'expired'].includes(quote.status) && (
                          <button className={styles.boardActionBtn} title="Email" onClick={e => { e.stopPropagation(); handleSendEmail(quote); }}>
                            <Send size={12} />
                          </button>
                        )}
                        {['sent', 'viewed'].includes(quote.status) && (
                          <button
                            className={`${styles.boardActionBtn} ${styles.boardActionBtnResponse}`}
                            title="Log Customer Response"
                            onClick={e => { e.stopPropagation(); handleOpenResponseModal(quote); }}
                          >
                            <MessageSquare size={12} />
                          </button>
                        )}
                        {quote.status === 'accepted' && (
                          <button
                            className={styles.boardActionBtn}
                            title="Convert to Invoice"
                            onClick={e => { e.stopPropagation(); handleConvertToInvoice(quote); }}
                            style={{ color: 'var(--color-success)' }}
                          >
                            <ArrowRightLeft size={12} />
                          </button>
                        )}
                        <button
                          className={styles.boardActionBtn}
                          title="Delete"
                          onClick={e => { e.stopPropagation(); handleDeleteQuote(quote); }}
                          style={{ color: 'var(--color-danger)' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {columnQuotes.length === 0 && (
                    <div className={styles.boardEmptyColumn}>No quotes</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {}
      {isResponseModalOpen && responseQuote && (
        <div className={styles.modalOverlay} onClick={() => setIsResponseModalOpen(false)}>
          <div className={styles.responseModal} onClick={e => e.stopPropagation()}>
            <div className={styles.responseModalHeader}>
              <h2>Log Customer Response</h2>
              <button className={styles.workflowCloseBtn} onClick={() => setIsResponseModalOpen(false)}>✕</button>
            </div>

            <div className={styles.responseModalMeta}>
              <span className={styles.responseModalQuoteNo}>{responseQuote.quote_no}</span>
              <span className={styles.responseModalCustomer}>
                {responseQuote.Customer?.name || responseQuote.customer?.name || 'Unknown Customer'}
              </span>
              <span className={styles.responseModalAmount}>
                Rs. {Number(responseQuote.total_lkr).toLocaleString()}
              </span>
            </div>

            <p className={styles.responseModalInstruction}>
              After speaking with or hearing from the customer, record their decision here. This will update the quote status and notify the system.
            </p>

            <div className={styles.responseDecisionRow}>
              <button
                className={`${styles.decisionBtn} ${responseDecision === 'accepted' ? styles.decisionBtnAccept : ''}`}
                onClick={() => setResponseDecision('accepted')}
              >
                <CheckCircle size={12} /> Customer Accepted
              </button>
              <button
                className={`${styles.decisionBtn} ${responseDecision === 'rejected' ? styles.decisionBtnReject : ''}`}
                onClick={() => setResponseDecision('rejected')}
              >
                <XCircle size={12} /> Customer Rejected
              </button>
            </div>

            {responseDecision === 'rejected' && (
              <div className={styles.responseNoteField}>
                <label>Rejection Reason (optional)</label>
                <textarea
                  className={styles.responseTextarea}
                  placeholder="e.g. Price too high, went with competitor, postponed project..."
                  value={responseNote}
                  onChange={e => setResponseNote(e.target.value)}
                  rows={3}
                />
                {responseQuote.deal_id && (
                  <div className={styles.responseRejectNote}>
                    <XCircle size={12} /> The linked Deal will automatically be moved to <strong>Closed Lost</strong>.
                  </div>
                )}
              </div>
            )}

            {responseDecision === 'accepted' && (
              <div className={styles.responseAcceptNote}>
                <CheckCircle size={12} />
                <div>
                  Quote will be marked <strong>Accepted</strong>.
                  {responseQuote.deal_id && (
                    <> The linked Deal will automatically be moved to <strong>Closed Won</strong> 🎉</>)
                  }
                  {!responseQuote.deal_id && (
                    <> You can then convert this quote to a POS Invoice from the quote list.</>
                  )}
                </div>
              </div>
            )}

            <div className={styles.responseModalFooter}>
              <button className={styles.responseModalCancelBtn} onClick={() => setIsResponseModalOpen(false)}>
                Cancel
              </button>
              <button
                className={`${styles.responseModalSubmitBtn} ${responseDecision === 'accepted' ? styles.submitAccept : styles.submitReject}`}
                onClick={handleSubmitResponse}
                disabled={responseLoading}
              >
                {responseLoading ? 'Saving...' : responseDecision === 'accepted' ? '✓ Confirm Acceptance' : '✕ Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      <CreateQuoteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={() => fetchQuotes()}
      />

      <Modal 
        isOpen={isImportModalOpen} 
        onClose={() => { setIsImportModalOpen(false); setImportFile(null); }} 
        title="Import Quotes"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsImportModalOpen(false); setImportFile(null); }}>Cancel</Button>
            <Button variant="primary" onClick={handleImportSubmit} disabled={!importFile} isLoading={isSubmitting}>Import CSV</Button>
          </>
        }
      >
        <form id="import-quote-form" onSubmit={handleImportSubmit}>
          <div style={{ marginBottom: '15px', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
            <p>Upload a CSV file to bulk import quotes. The file must include a header row.</p>
            <p style={{ marginTop: '10px' }}><strong>Supported Columns:</strong> <code>quote_no</code>, <code>title</code> (required), <code>total</code>, <code>customer_email</code>.</p>
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
            { label: contextMenu.record.flag_status === 'flagged' ? 'Clear Flag' : 'Flag', icon: Flag, onClick: (e) => handleToggleFlag(e, contextMenu.record) },
            { label: 'Download PDF', icon: Download, onClick: () => handleDownloadPdf(contextMenu.record) },
            { label: 'Clone Quote', icon: Copy, onClick: () => handleCloneQuote(contextMenu.record) },
            ...(!['accepted', 'rejected', 'converted', 'expired'].includes(contextMenu.record.status) ? [
              { label: 'Send via Email', icon: Send, onClick: () => handleSendEmail(contextMenu.record) }
            ] : []),
            ...(contextMenu.record.status === 'accepted' ? [
              { label: 'Convert to POS Invoice', icon: ArrowRightLeft, onClick: () => handleConvertToInvoice(contextMenu.record) }
            ] : []),
            { label: 'Open Workflow', icon: ChevronRight, onClick: () => setActiveWorkflowQuote(contextMenu.record) },
            { label: 'Delete', icon: Trash2, onClick: () => handleDeleteQuote(contextMenu.record.id), variant: 'danger' }
          ]}
        />
      )}
    </div>
  );
}
