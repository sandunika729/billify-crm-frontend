'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useSocketContext } from '../../../context/SocketContext';
import ticketService from '../../../services/ticketService';
import customerService from '../../../services/customerService';
import styles from './page.module.css';
import {
  Search, Plus, LifeBuoy, AlertCircle, Clock, CheckCircle2,
  MessageSquare, X, Send, User, Edit2, Trash2, ArrowLeft,
  Lock, RefreshCw, Flag
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/modals/Modal';
import FormField from '../../../components/forms/FormField';
import CustomFieldsSection from '../../../components/forms/CustomFieldsSection';
import SearchBar from '../../../components/ui/SearchBar';
import ContextMenu from '../../../components/ui/ContextMenu';
import ColumnManager from '../../../components/ui/ColumnManager';
import customFieldService from '../../../services/customFieldService';
import { alert, confirm } from '@/utils/alertService';

const TICKET_STATUSES = [
  { value: 'open',             label: 'Open',                color: '#3b82f6' },
  { value: 'in_progress',      label: 'In Progress',         color: '#f59e0b' },
  { value: 'waiting_customer', label: 'Waiting on Customer', color: '#8b9be2' },
  { value: 'resolved',         label: 'Resolved',            color: '#10b981' },
  { value: 'closed',           label: 'Closed',              color: '#64748b' },
];

const TICKET_PRIORITIES = [
  { value: 'low',    label: 'Low',    color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high',   label: 'High',   color: '#ef4444' },
  { value: 'urgent', label: 'Urgent', color: '#7c3aed' },
];

export default function SupportTicketsPage() {
  const { user } = useAuth();
  const { socket } = useSocketContext();

  const [tickets, setTickets]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [searchTerm, setSearchTerm]         = useState('');
  const [filterStatus, setFilterStatus]     = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [customers, setCustomers]           = useState([]);

  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting]       = useState(false);
  const [formData, setFormData]   = useState({ subject: '', customer_id: '', priority: 'medium', source: 'phone', description: '', custom_fields: {} });
  const [editFormData, setEditFormData]       = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const [customFields, setCustomFields] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(['subject', 'customer', 'priority', 'sla', 'status', 'updated']);

  const handleColumnToggle = (colId) => {
    setVisibleColumns(prev => 
      prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]
    );
  };

  const handleContextMenu = (e, ticket) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, record: ticket });
  };

  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailTicket, setDetailTicket]     = useState(null);
  const [detailLoading, setDetailLoading]   = useState(false);
  const [messages, setMessages]             = useState([]);
  const [msgText, setMsgText]               = useState('');
  const [msgType, setMsgType]               = useState('reply'); 
  const [sendingMsg, setSendingMsg]         = useState(false);
  const threadRef = useRef(null);

  useEffect(() => { 
    fetchTickets(); 
    fetchCustomers(); 
    fetchCustomFields();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => {
      fetchTickets();
      if (selectedTicket) openTicketDetail(selectedTicket.id);
    };
    const onMsg = (data) => {
      fetchTickets();
      if (selectedTicket && data.ticketId === selectedTicket.id) openTicketDetail(selectedTicket.id);
    };
    socket.on('ticket:new', refresh);
    socket.on('ticket:updated', refresh);
    socket.on('ticket:message', onMsg);
    return () => { socket.off('ticket:new', refresh); socket.off('ticket:updated', refresh); socket.off('ticket:message', onMsg); };
  }, [socket, selectedTicket]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await ticketService.getAllTickets();
      if (res.success) setTickets(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchCustomers = async () => {
    try {
      const res = await customerService.getAllCustomers();
      if (res.success) setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.error(e); }
  };

  const fetchCustomFields = async () => {
    try {
      const res = await customFieldService.getFields('ticket');
      if (res.success) {
        setCustomFields(res.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch custom fields for tickets:', e);
    }
  };

  const openTicketDetail = async (ticketId) => {
    setDetailLoading(true);
    try {
      const res = await ticketService.getTicketById(ticketId);
      if (res.success) {
        setDetailTicket(res.data);
        setSelectedTicket(res.data);
        setMessages(res.data.messages || []);
      }
    } catch (e) { console.error(e); } finally { setDetailLoading(false); }
  };

  const handleOpenDetail = (ticket) => { setSelectedTicket(ticket); openTicketDetail(ticket.id); };
  const handleCloseDetail = () => { setSelectedTicket(null); setDetailTicket(null); setMessages([]); setMsgText(''); };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgText.trim() || !selectedTicket) return;
    setSendingMsg(true);
    try {
      const res = await ticketService.addMessage(selectedTicket.id, { message: msgText, is_internal: msgType === 'note' });
      if (res.success) { setMessages(prev => [...prev, res.data]); setMsgText(''); fetchTickets(); }
    } catch (e) { console.error(e); } finally { setSendingMsg(false); }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await ticketService.updateStatus(ticketId, newStatus);
      fetchTickets();
      if (selectedTicket?.id === ticketId) openTicketDetail(ticketId);
    } catch (e) { console.error(e); }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await ticketService.createTicket(formData);
      if (res.success) {
        fetchTickets();
        setIsModalOpen(false);
        setFormData({ subject: '', customer_id: '', priority: 'medium', source: 'phone', description: '' });
      }
    } catch (e) { alert('Error saving ticket.'); } finally { setIsSubmitting(false); }
  };

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await ticketService.updateTicket(editFormData.id, editFormData);
      if (res.success) {
        fetchTickets();
        if (selectedTicket?.id === editFormData.id) openTicketDetail(editFormData.id);
        setIsEditModalOpen(false);
      }
    } catch (e) { alert('Error updating ticket.'); } finally { setIsSubmitting(false); }
  };

  const handleDeleteTicket = async (id) => {
    if (!await confirm('Delete this ticket?')) return;
    try {
      await ticketService.deleteTicket(id);
      if (selectedTicket?.id === id) handleCloseDetail();
      fetchTickets();
    } catch (e) { alert('Error deleting ticket.'); }
  };

  const handleExport = async () => {
    const rows = filteredTickets.map(t => [t.ticket_no, t.subject, t.customer?.name || '', t.priority, t.status, t.due_at ? new Date(t.due_at).toLocaleDateString() : '', new Date(t.created_at || t.createdAt || Date.now()).toLocaleDateString()]);
    const csv = [['Ticket No','Subject','Customer','Priority','Status','Due At','Created'], ...rows].map(r => r.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    
    const { downloadAndSaveExport } = await import('../../../utils/exportHelper');
    await downloadAndSaveExport(csv, `tickets-${new Date().toISOString().slice(0,10)}.csv`);
  };

  const handleToggleFlag = async (e, ticket) => {
    e.stopPropagation();
    try {
      const currentStatus = ticket.flag_status || 'none';
      const newStatus = currentStatus === 'flagged' ? 'none' : 'flagged';

      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, flag_status: newStatus } : t));
      await ticketService.updateTicket(ticket.id, { flag_status: newStatus });
    } catch (error) {
      console.error('Failed to toggle flag:', error);
      fetchTickets();
    }
  };

  const getStatusCfg   = (s) => TICKET_STATUSES.find(x => x.value === s) || TICKET_STATUSES[0];
  const getPriorityCfg = (p) => TICKET_PRIORITIES.find(x => x.value === p) || TICKET_PRIORITIES[1];

  const renderSlaBadge = (ticket) => {
    if (ticket.status === 'resolved' || ticket.status === 'closed')
      return <span style={{ color:'#94a3b8', fontSize:'0.75rem' }}>Completed</span>;
    const due = ticket.due_at ? new Date(ticket.due_at) : null;
    if (!due) return <span style={{ color:'#94a3b8', fontSize:'0.75rem' }}>No SLA</span>;
    const now = new Date(), isOverdue = due < now, hoursLeft = (due - now) / 3600000;
    if (isOverdue)
      return <span style={{ background:'#fee2e2', color:'#ef4444', padding:'3px 8px', borderRadius:99, fontSize:'0.72rem', fontWeight:700, display:'inline-flex', gap:4, alignItems:'center' }}>Overdue</span>;
    if (hoursLeft <= 4)
      return <span style={{ background:'#fef3c7', color:'#d97706', padding:'3px 8px', borderRadius:99, fontSize:'0.72rem', fontWeight:700, display:'inline-flex', gap:4, alignItems:'center' }}><Clock size={11}/>Due in {Math.ceil(hoursLeft)}h</span>;
    return <span style={{ background:'#d1fae5', color:'#059669', padding:'3px 8px', borderRadius:99, fontSize:'0.72rem', fontWeight:700, display:'inline-flex', gap:4, alignItems:'center', whiteSpace:'nowrap' }}>On Track</span>;
  };

  const filteredTickets = tickets.filter(t => {
    const s = searchTerm.toLowerCase();
    const match = !s || t.ticket_no?.toLowerCase().includes(s) || t.subject?.toLowerCase().includes(s) || t.customer?.name?.toLowerCase().includes(s);
    const matchesFlag = !showFlaggedOnly || t.flag_status === 'flagged';
    return match && (!filterStatus || t.status === filterStatus) && (!filterPriority || t.priority === filterPriority) && matchesFlag;
  });

  
  if (selectedTicket) {
    const tk = detailTicket || selectedTicket;
    const statusCfg   = getStatusCfg(tk.status);
    const priorityCfg = getPriorityCfg(tk.priority);
    const nextStatuses = TICKET_STATUSES.filter(s => s.value !== tk.status);

    return (
      <div className={styles.pageContainer}>
        <div className={styles.detailTopBar}>
          <button className={styles.backBtn} onClick={handleCloseDetail}>
            <ArrowLeft size={18} /> All Tickets
          </button>
          <div className={styles.detailTopActions}>
            <button className={styles.iconActionBtn} title="Edit" onClick={() => { setEditFormData({ id: tk.id, subject: tk.subject, customer_id: tk.customer_id || '', priority: tk.priority, status: tk.status, source: tk.source }); setIsEditModalOpen(true); }}>
              <Edit2 size={12} />
            </button>
            <button className={`${styles.iconActionBtn} ${styles.deleteColor}`} title="Delete" onClick={() => handleDeleteTicket(tk.id)}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        <div className={styles.detailLayout}>
          {}
          <div className={styles.detailInfoPanel}>
            <div className={styles.detailInfoHeader}>
              <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#94a3b8', letterSpacing:'0.05em' }}>#{tk.ticket_no}</span>
              <h2 className={styles.detailSubject}>{tk.subject}</h2>
            </div>

            <div className={styles.detailSection}>
              <label className={styles.detailLabel}>Status</label>
              <span style={{ background:`${statusCfg.color}18`, color:statusCfg.color, padding:'0.25rem 0.75rem', borderRadius:99, fontSize:'0.78rem', fontWeight:700, border:`1.5px solid ${statusCfg.color}40`, display:'inline-block' }}>
                ● {statusCfg.label}
              </span>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.3rem', marginTop:'0.5rem' }}>
                {nextStatuses.map(s => (
                  <button key={s.value} onClick={() => handleStatusChange(tk.id, s.value)} style={{ background:'#f8fafc', border:'1px solid #e2e8f0', color:s.color, padding:'0.18rem 0.55rem', borderRadius:99, fontSize:'0.7rem', fontWeight:600, cursor:'pointer' }}>
                    → {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.detailSection}>
              <label className={styles.detailLabel}>Priority</label>
              <span style={{ background:`${priorityCfg.color}15`, color:priorityCfg.color, padding:'0.2rem 0.65rem', borderRadius:99, fontSize:'0.78rem', fontWeight:700 }}>{priorityCfg.label}</span>
            </div>

            <div className={styles.detailSection}>
              <label className={styles.detailLabel}>Customer</label>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginTop:'0.3rem' }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'#e0e7ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', fontWeight:700, color:'#4f46e5' }}>
                  {(tk.customer?.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize:'0.85rem', fontWeight:600, color:'#0f172a' }}>{tk.customer?.name || 'Unknown'}</div>
                  {tk.customer?.email && <div style={{ fontSize:'0.72rem', color:'#64748b' }}>{tk.customer.email}</div>}
                  {tk.customer?.phone && <div style={{ fontSize:'0.72rem', color:'#64748b' }}>{tk.customer.phone}</div>}
                </div>
              </div>
            </div>

            {tk.assignee && (
              <div className={styles.detailSection}>
                <label className={styles.detailLabel}>Assignee</label>
                <div style={{ fontSize:'0.82rem', color:'#334155', marginTop:'0.3rem' }}>👤 {tk.assignee.first_name} {tk.assignee.last_name}</div>
              </div>
            )}

            <div className={styles.detailSection}>
              <label className={styles.detailLabel}>Source</label>
              <div style={{ fontSize:'0.82rem', color:'#475569', marginTop:'0.2rem', textTransform:'capitalize' }}>{tk.source || '—'}</div>
            </div>

            <div className={styles.detailSection}>
              <label className={styles.detailLabel}>SLA / Due Date</label>
              <div style={{ marginTop:'0.3rem' }}>{renderSlaBadge(tk)}</div>
              {tk.due_at && <div style={{ fontSize:'0.7rem', color:'#94a3b8', marginTop:'0.2rem' }}>{new Date(tk.due_at).toLocaleString()}</div>}
            </div>

            <div className={styles.detailSection}>
              <label className={styles.detailLabel}>Created</label>
              <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:'0.2rem' }}>{new Date(tk.created_at || tk.createdAt || Date.now()).toLocaleString()}</div>
            </div>

            {tk.description && (
              <div className={styles.detailSection}>
                <label className={styles.detailLabel}>Description</label>
                <p style={{ fontSize:'0.82rem', color:'#475569', marginTop:'0.3rem', lineHeight:1.6, background:'#f8fafc', padding:'0.6rem 0.75rem', borderRadius:8 }}>{tk.description}</p>
              </div>
            )}

            <div style={{ marginTop:'0.5rem', padding:'0.6rem 0.75rem', background:'#f8fafc', borderRadius:8, display:'flex', gap:'0.4rem', alignItems:'center' }}>
              <MessageSquare size={12} style={{ color:'#94a3b8' }} />
              <span style={{ fontSize:'0.75rem', color:'#64748b' }}>{messages.length} message{messages.length !== 1 ? 's' : ''} in thread</span>
            </div>
          </div>

          {}
          <div className={styles.detailThreadPanel}>
            <div className={styles.threadHeader}>
              <h3>Conversation</h3>
              <button className={styles.refreshBtn} onClick={() => openTicketDetail(tk.id)} title="Refresh thread">
                <RefreshCw size={12} />
              </button>
            </div>

            <div className={styles.threadBody} ref={threadRef}>
              {detailLoading ? (
                <div className={styles.threadEmpty}>Loading thread...</div>
              ) : messages.length === 0 ? (
                <div className={styles.threadEmpty}>
                  <MessageSquare size={36} style={{ color:'#cbd5e1', marginBottom:'0.5rem' }} />
                  <p style={{ color:'#94a3b8', fontSize:'0.85rem' }}>No messages yet.</p>
                  <p style={{ color:'#cbd5e1', fontSize:'0.78rem' }}>Add a reply or internal note below.</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe   = msg.sender_user_id === user?.id;
                  const isNote = msg.is_internal;
                  const senderName = msg.sender ? `${msg.sender.first_name} ${msg.sender.last_name}` : 'Agent';
                  return (
                    <div key={msg.id || idx} className={`${styles.msgRow} ${isMe ? styles.msgRowMe : ''}`}>
                      {!isMe && <div className={styles.msgAvatar}>{senderName.charAt(0).toUpperCase()}</div>}
                      <div className={styles.msgBubbleWrap}>
                        <div className={styles.msgMeta}>
                          {!isMe && <span className={styles.msgSender}>{senderName}</span>}
                          {isNote && <span className={styles.internalBadge}><Lock size={9}/> Internal Note</span>}
                          <span className={styles.msgTime}>{new Date(msg.created_at || msg.createdAt || Date.now()).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
                        </div>
                        <div className={`${styles.msgBubble} ${isMe ? styles.bubbleMe : styles.bubbleThem} ${isNote ? styles.bubbleNote : ''}`}>
                          {msg.message}
                        </div>
                      </div>
                      {isMe && <div className={`${styles.msgAvatar} ${styles.msgAvatarMe}`}>{(user?.firstName || 'A').charAt(0).toUpperCase()}</div>}
                    </div>
                  );
                })
              )}
            </div>

            {}
            <div className={styles.composeArea}>
              <div className={styles.composeTabs}>
                <button className={`${styles.composeTab} ${msgType === 'reply' ? styles.composeTabActive : ''}`} onClick={() => setMsgType('reply')}>
                  <Send size={12}/> Reply
                </button>
                <button className={`${styles.composeTab} ${styles.noteTab} ${msgType === 'note' ? styles.composeTabActiveNote : ''}`} onClick={() => setMsgType('note')}>
                  <Lock size={12}/> Internal Note
                </button>
              </div>
              <form onSubmit={handleSendMessage} className={styles.composeForm}>
                <textarea
                  className={`${styles.composeInput} ${msgType === 'note' ? styles.composeInputNote : ''}`}
                  placeholder={msgType === 'note' ? '🔒 Internal note — only visible to your team...' : 'Type your reply...'}
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  rows={3}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSendMessage(e); }}
                  disabled={sendingMsg}
                />
                <div className={styles.composeFooter}>
                  <span style={{ fontSize:'0.68rem', color:'#94a3b8' }}>Ctrl+Enter to send</span>
                  <button type="submit" disabled={!msgText.trim() || sendingMsg}
                    className={`${styles.sendBtn} ${msgType === 'note' ? styles.sendBtnNote : ''}`}>
                    {sendingMsg ? 'Sending...' : msgType === 'note' ? '🔒 Add Note' : '→ Send Reply'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {editFormData && (
          <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Ticket"
            footer={<><Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleUpdateTicket} isLoading={isSubmitting}>Save</Button></>}>
            <form onSubmit={handleUpdateTicket} className={styles.modalForm}>
              <FormField label="Subject" name="subject" value={editFormData.subject} onChange={e => setEditFormData({...editFormData, subject: e.target.value})} required />
              <div className={styles.formRow}>
                <FormField label="Priority" type="select" name="priority" value={editFormData.priority} onChange={e => setEditFormData({...editFormData, priority: e.target.value})} options={TICKET_PRIORITIES.map(p => ({ value: p.value, label: p.label }))} />
                <FormField label="Status" type="select" name="status" value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})} options={TICKET_STATUSES.map(s => ({ value: s.value, label: s.label }))} />
              </div>
            </form>
          </Modal>
        )}
      </div>
    );
  }

  
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div><h1>Support Tickets</h1></div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <Button variant="secondary" onClick={handleExport}>Export CSV</Button>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>New Ticket</Button>
        </div>
      </div>

      <div className={styles.filtersBar}>
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search ticket #, subject, customer..." label="" className={styles.searchBarWrapper} />
        <div className={styles.filtersLeft}>
          <div className={styles.filterGroup}>
            <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {TICKET_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <select className={styles.filterSelect} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">All Priorities</option>
              {TICKET_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
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
              { id: 'subject', label: 'Ticket', required: true },
              { id: 'customer', label: 'Customer', required: false },
              { id: 'priority', label: 'Priority', required: false },
              { id: 'sla', label: 'SLA', required: false },
              { id: 'status', label: 'Status', required: false },
              { id: 'updated', label: 'Updated', required: false },
              ...customFields.map(cf => ({ id: `cf_${cf.field_name}`, label: cf.field_label, required: false }))
            ]}
            visibleColumns={visibleColumns}
            onColumnToggle={handleColumnToggle}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.ticketsTable}>
            <thead>
              <tr>
                {visibleColumns.includes('subject') && <th>Ticket</th>}
                {visibleColumns.includes('customer') && <th>Customer</th>}
                {visibleColumns.includes('priority') && <th>Priority</th>}
                {visibleColumns.includes('sla') && <th>SLA</th>}
                {visibleColumns.includes('status') && <th>Status</th>}
                {visibleColumns.includes('updated') && <th>Updated</th>}
                {customFields.filter(cf => visibleColumns.includes(`cf_${cf.field_name}`)).map(cf => (
                  <th key={cf.id}>{cf.field_label}</th>
                ))}
                <th className={styles.actionsCol}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className={styles.emptyState}>Loading tickets...</td></tr>
              ) : filteredTickets.length === 0 ? (
                <tr><td colSpan="7" className={styles.emptyState}>No tickets found. Click "New Ticket" to add one.</td></tr>
              ) : (
                filteredTickets.map(ticket => {
                  const sc = getStatusCfg(ticket.status);
                  const pc = getPriorityCfg(ticket.priority);
                  return (
                    <tr 
                      key={ticket.id} 
                      className={styles.ticketRow} 
                      onClick={() => handleOpenDetail(ticket)} 
                      style={ticket.flag_status === 'flagged' ? { backgroundColor: 'var(--color-bg-hover, #f1f5f9)', cursor: 'pointer' } : { cursor:'pointer' }}
                      onContextMenu={(e) => handleContextMenu(e, ticket)}
                    >
                      {visibleColumns.includes('subject') && (
                        <td>
                          <div style={{ fontWeight:600, color:'#0f172a', fontSize:'0.875rem' }}>{ticket.subject}</div>
                        </td>
                      )}
                      {visibleColumns.includes('customer') && (
                        <td style={{ fontSize:'0.85rem', color:'#334155', whiteSpace: 'nowrap' }}>{ticket.customer?.name || ticket.Customer?.name || 'Unknown'}</td>
                      )}
                      {visibleColumns.includes('priority') && (
                        <td>
                          <span style={{ background:`${pc.color}15`, color:pc.color, border: `1px solid ${pc.color}30`, padding:'0.15rem 0.6rem', borderRadius:99, fontSize:'0.62rem', fontWeight:700 }}>{pc.label}</span>
                        </td>
                      )}
                      {visibleColumns.includes('sla') && <td>{renderSlaBadge(ticket)}</td>}
                      {visibleColumns.includes('status') && (
                        <td>
                          <span style={{ background:`${sc.color}15`, color:sc.color, border: `1px solid ${sc.color}30`, padding:'0.15rem 0.6rem', borderRadius:99, fontSize:'0.62rem', fontWeight:700 }}>{sc.label}</span>
                        </td>
                      )}
                      {visibleColumns.includes('updated') && (
                        <td style={{ fontSize:'0.75rem', color:'#94a3b8' }}>
                          {new Date(ticket.updated_at || ticket.updatedAt || ticket.created_at || Date.now()).toLocaleDateString()}
                        </td>
                      )}
                      {customFields.filter(cf => visibleColumns.includes(`cf_${cf.field_name}`)).map(cf => (
                        <td key={cf.id} style={{ fontSize:'0.85rem' }}>{ticket.custom_fields?.[cf.field_name] || '-'}</td>
                      ))}
                      <td className={styles.actionsCol} onClick={e => e.stopPropagation()}>
                        <div className={styles.rowActions}>
                          <button 
                            className={`${styles.actionBtn} ${ticket.flag_status === 'flagged' ? styles.flagged : ''}`}
                            onClick={(e) => handleToggleFlag(e, ticket)}
                            title={ticket.flag_status === 'flagged' ? 'Clear Flag' : 'Flag'}
                          >
                            <Flag 
                              size={12} 
                              fill={ticket.flag_status === 'flagged' ? '#ef4444' : 'none'} 
                              color={ticket.flag_status === 'flagged' ? '#ef4444' : '#64748b'} 
                            />
                          </button>
                          <button className={styles.actionBtn} title="Open Thread" onClick={() => handleOpenDetail(ticket)}><MessageSquare size={12} color="#3b82f6" /></button>
                          <button className={styles.actionBtn} title="Edit" onClick={() => { setEditFormData({ id: ticket.id, subject: ticket.subject, customer_id: ticket.customer_id || '', priority: ticket.priority, status: ticket.status, source: ticket.source }); setIsEditModalOpen(true); }}><Edit2 size={12} color="#94a3b8" /></button>
                          <button className={styles.actionBtn} title="Delete" onClick={() => handleDeleteTicket(ticket.id)}><Trash2 size={12} color="#ef4444" /></button>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Raise New Ticket"
        footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreateTicket} isLoading={isSubmitting}>Create Ticket</Button></>}>
        <form onSubmit={handleCreateTicket} className={styles.modalForm}>
          <FormField label="Subject / Issue Summary" name="subject" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required placeholder="e.g. Invoice amount incorrect" />
          <FormField label="Customer" type="select" name="customer_id" value={formData.customer_id} onChange={e => setFormData({...formData, customer_id: e.target.value})} required
            options={[{ value:'', label:'-- Select Customer --' }, ...customers.map(c => ({ value: c.id, label: `${c.name}${c.company_name ? ` (${c.company_name})` : ''}` }))]} />
          <FormField label="Description (optional)" type="textarea" name="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the issue in detail..." />
          <div className={styles.formRow}>
            <FormField label="Priority" type="select" name="priority" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}
              options={TICKET_PRIORITIES.map(p => ({ value: p.value, label: p.label }))} />
            <FormField label="Source" type="select" name="source" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}
              options={[{ value:'phone', label:'Phone' }, { value:'email', label:'Email' }, { value:'web', label:'Web' }, { value:'walk_in', label:'Walk-in' }, { value:'whatsapp', label:'WhatsApp' }]} />
          </div>
          <CustomFieldsSection 
            entityType="ticket" 
            values={formData.custom_fields || {}} 
            onChange={(newVals) => setFormData({...formData, custom_fields: newVals})}
          />
        </form>
      </Modal>

      {editFormData && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Ticket"
          footer={<><Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleUpdateTicket} isLoading={isSubmitting}>Save Changes</Button></>}>
          <form onSubmit={handleUpdateTicket} className={styles.modalForm}>
            <FormField label="Subject" name="subject" value={editFormData.subject} onChange={e => setEditFormData({...editFormData, subject: e.target.value})} required />
            <div className={styles.formRow}>
              <FormField label="Priority" type="select" name="priority" value={editFormData.priority} onChange={e => setEditFormData({...editFormData, priority: e.target.value})} options={TICKET_PRIORITIES.map(p => ({ value: p.value, label: p.label }))} />
              <FormField label="Status" type="select" name="status" value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})} options={TICKET_STATUSES.map(s => ({ value: s.value, label: s.label }))} />
            </div>
          </form>
        </Modal>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            { label: contextMenu.record.flag_status === 'flagged' ? 'Clear Flag' : 'Flag', icon: Flag, onClick: (e) => handleToggleFlag(e, contextMenu.record) },
            { label: 'Open Thread', icon: MessageSquare, onClick: () => handleOpenDetail(contextMenu.record) },
            { label: 'Edit Ticket', icon: Edit2, onClick: () => { setEditFormData({ id: contextMenu.record.id, subject: contextMenu.record.subject, customer_id: contextMenu.record.customer_id || '', priority: contextMenu.record.priority, status: contextMenu.record.status, source: contextMenu.record.source }); setIsEditModalOpen(true); } },
            { label: 'Delete', icon: Trash2, onClick: () => handleDeleteTicket(contextMenu.record.id), variant: 'danger' }
          ]}
        />
      )}
    </div>
  );
}
