'use client';

import React, { useState, useEffect } from 'react';
import inboxService from '../../../services/inboxService';
import activityService from '../../../services/activityService';
import customerService from '../../../services/customerService';
import Modal from '../../../components/modals/Modal';
import Button from '../../../components/ui/Button';
import FormField from '../../../components/forms/FormField';
import SearchBar from '../../../components/ui/SearchBar';
import {
  Inbox, Mail, MessageSquare, PhoneCall, Bell, Search,
  User, Building2, FileText, CheckCircle2, Plus, Upload, Paperclip, X as XIcon, Download, Clock, Trash2
} from 'lucide-react';
import styles from './page.module.css';

export default function InboxPage() {
  const [feed, setFeed] = useState([]);
  const [stats, setStats] = useState({ total: 0, email: 0, whatsapp: 0, call: 0, notifications: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [activeChannel, setActiveChannel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);


  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [logFormData, setLogFormData] = useState({
    customer_id: '',
    channel: 'call',
    direction: 'outbound',
    summary: ''
  });


  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = React.useRef(null);


  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState('');
  const [previewAttachmentName, setPreviewAttachmentName] = useState('');

  const channels = [
    { id: 'all', label: 'All Messages', icon: Inbox, countKey: 'total' },
    { id: 'email', label: 'Emails', icon: Mail, countKey: 'email' },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, countKey: 'whatsapp' },
    { id: 'call', label: 'Calls', icon: PhoneCall, countKey: 'call' },
    { id: 'notification', label: 'Notifications', icon: Bell, countKey: 'notifications' }
  ];

  useEffect(() => {
    fetchStats();
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await customerService.getAllCustomers();
      if (res.success) {
        setCustomers(Array.isArray(res.data) ? res.data : res.data?.rows || []);
      }
    } catch (error) {
      console.error('Failed to load customers', error);
    }
  };

  const handleLogInputChange = (e) => {
    const { name, value } = e.target;
    setLogFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmailFileSelect = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['eml', 'msg'].includes(ext)) {
      alert('Please upload an .eml or .msg file.');
      return;
    }
    setUploadedFile(file);
    setIsParsing(true);
    try {
      const res = await activityService.uploadEmail(file);
      if (res.success) {
        setUploadResult(res.data);
        setLogFormData(prev => ({
          ...prev,
          channel: 'email',
          direction: 'inbound',
          summary: res.data.summary || prev.summary
        }));
      }
    } catch (error) {
      console.error('Failed to upload/parse email file', error);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDropZoneDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleEmailFileSelect(file);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...logFormData };
      if (uploadResult) {
        payload.attachment_url = uploadResult.attachment_url;
        payload.attachment_name = uploadResult.attachment_name;
      }
      const res = await activityService.createInteraction(payload);
      if (res.success) {
        setIsLogModalOpen(false);
        setLogFormData({ customer_id: '', channel: 'call', direction: 'outbound', summary: '' });
        setUploadedFile(null);
        setUploadResult(null);
        fetchStats();
        fetchFeed(true);
      }
    } catch (error) {
      console.error('Failed to log communication', error);
      alert('Error logging communication. Please ensure all required fields are filled.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchFeed(true);
  }, [activeChannel, searchQuery, filterDate]);

  const fetchStats = async () => {
    try {
      const res = await inboxService.getStats();
      if (res.success) setStats(res.data);
    } catch (error) {
      console.error('Failed to load stats', error);
    }
  };

  const fetchFeed = async (reset = false) => {
    const currentPage = reset ? 1 : page;
    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await inboxService.getInbox({
        channel: activeChannel,
        search: searchQuery,
        date: filterDate,
        page: currentPage,
        limit: 20
      });

      if (res.success) {
        if (reset) {
          setFeed(res.data);
        } else {
          setFeed(prev => [...prev, ...res.data]);
        }
        setHasMore(res.data.length === 20);
        if (!reset) setPage(currentPage + 1);
      }
    } catch (error) {
      console.error('Failed to load feed', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleDeleteLog = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const res = await activityService.deleteInteraction(id);
      if (res.success) {
        setFeed(prev => prev.filter(item => item.id !== id && item.originalId !== id));
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to delete message', error);
      alert('Error deleting message.');
    }
  };

  const getChannelConfig = (channel) => {
    switch (channel) {
      case 'email': return { icon: Mail, className: styles.channelEmail };
      case 'whatsapp': return { icon: MessageSquare, className: styles.channelWhatsapp };
      case 'call': return { icon: PhoneCall, className: styles.channelCall };
      case 'notification': return { icon: Bell, className: styles.channelNotification };
      default: return { icon: FileText, className: styles.channelNote };
    }
  };

  const handlePreviewEmail = async (item) => {
    setPreviewAttachmentUrl(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${item.attachment_url}`);
    setPreviewAttachmentName(item.attachment_name || 'email.eml');
    setPreviewLoading(true);
    setIsPreviewOpen(true);
    try {
      const res = await activityService.previewEmail(item.attachment_url);
      if (res.success) {
        setPreviewData(res.data);
      }
    } catch (error) {
      console.error('Failed to preview email', error);
      setPreviewData({ subject: 'Preview Error', text: 'Could not load email preview.', from: '', to: '', cc: '', date: null, html: null, attachments: [] });
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1>Inbox</h1>
        <div className={styles.controls}>
          <Button variant="primary" onClick={() => setIsLogModalOpen(true)}>
            Log Communication
          </Button>
        </div>
      </header>

      <div className={styles.filtersBar}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <SearchBar
            id="inbox-search"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search messages..."
            label=""
          />
        </div>

        <div className={styles.dateFilterContainer}>
          <input
            type="date"
            className={styles.dateInput}
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.layout}>

        <div className={styles.sidebar}>
          {channels.map(ch => {
            const Icon = ch.icon;
            const count = stats[ch.countKey] || 0;
            return (
              <button
                key={ch.id}
                className={`${styles.navItem} ${activeChannel === ch.id ? styles.navItemActive : ''}`}
                onClick={() => setActiveChannel(ch.id)}
              >
                <div className={styles.navItemLeft}>
                  <span>{ch.label}</span>
                </div>
                {count > 0 && <span className={styles.badge}>{count > 99 ? '99+' : count}</span>}
              </button>
            );
          })}
        </div>


        <div className={styles.feedContainer}>
          <div className={styles.feedScroll}>
            {loading ? (
              <div className={styles.emptyState}>Loading messages...</div>
            ) : feed.length === 0 ? (
              <div className={styles.emptyState}>
                No messages found. Click "Log Communication" to add one.
              </div>
            ) : (
              <>
                {feed.map(item => {
                  const ChannelIcon = getChannelConfig(item.channel).icon;
                  const channelClass = getChannelConfig(item.channel).className;

                  return (
                    <div key={item.id} className={styles.feedItem}>
                      <div className={styles.avatarWrapper}>
                        {item.type === 'notification' ? <Bell size={24} /> : <User size={24} />}
                        <div className={`${styles.channelIconBadge} ${channelClass}`}>
                          <ChannelIcon />
                        </div>
                      </div>

                      <div className={styles.itemContent}>
                        <div className={styles.itemHeader}>
                          <div className={styles.itemName}>
                            {item.type === 'notification'
                              ? 'System Notification'
                              : item.customer?.name || 'Unknown Contact'}

                            {item.customer?.company_name && (
                              <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', marginLeft: '6px' }}>
                                ({item.customer.company_name})
                              </span>
                            )}
                          </div>
                          <div className={styles.itemTime}>
                            <span>{new Date(item.timestamp).toLocaleString()}</span>
                            <button 
                              className={styles.deleteLogBtn} 
                              onClick={(e) => handleDeleteLog(item.originalId || item.id.replace('interaction_', '').replace('notification_', ''), e)}
                              title="Delete Message"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <h4 className={styles.itemTitle}>
                          {item.title.startsWith('SLA Breach')
                            ? item.title.replace('SLA Breach: Ticket undefined', 'Action Required: Ticket Overdue').replace('SLA Breach:', 'Action Required:')
                            : item.title}
                        </h4>
                        {item.channel === 'email' && item.attachment_url ? (
                          <p className={styles.itemSnippet}>Click attachment to view full email details.</p>
                        ) : (
                          <p className={styles.itemSnippet}>{item.body || item.title}</p>
                        )}
                        {item.attachment_url && (
                          <button
                            className={styles.attachmentBadge}
                            onClick={e => { e.stopPropagation(); handlePreviewEmail(item); }}
                          >
                            <Paperclip size={12} />
                            {item.attachment_name || 'Attachment'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {hasMore && feed.length > 0 && (
                  <button
                    className={styles.loadMoreBtn}
                    onClick={() => fetchFeed()}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading...' : 'Load Older Messages'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      { }
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log Communication"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsLogModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleLogSubmit} isLoading={isSubmitting}>Save Log</Button>
          </>
        }
      >
        <form id="log-communication-form" onSubmit={handleLogSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormField
            label="Customer" type="select" name="customer_id" value={logFormData.customer_id} onChange={handleLogInputChange} required
            options={[
              { value: '', label: '-- Select Customer --' },
              ...customers.map(c => ({ value: c.id, label: `${c.name} ${c.company_name ? `(${c.company_name})` : ''}` }))
            ]}
          />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <FormField
                label="Channel" type="select" name="channel" value={logFormData.channel} onChange={handleLogInputChange} required
                options={[
                  { value: 'call', label: 'Call' },
                  { value: 'email', label: 'Email' },
                  { value: 'whatsapp', label: 'WhatsApp' },
                  { value: 'meeting', label: 'Meeting' },
                  { value: 'note', label: 'Note' },
                  { value: 'other', label: 'Other' }
                ]}
              />
            </div>
            <div style={{ flex: 1 }}>
              <FormField
                label="Direction" type="select" name="direction" value={logFormData.direction} onChange={handleLogInputChange} required
                options={[
                  { value: 'inbound', label: 'Inbound (From Customer)' },
                  { value: 'outbound', label: 'Outbound (To Customer)' },
                  { value: 'internal', label: 'Internal' }
                ]}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Attach Email File (.eml / .msg)</label>
            {!uploadedFile ? (
              <div
                className={`${styles.uploadZone} ${isDragOver ? styles.uploadZoneDragOver : ''}`}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDropZoneDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={styles.uploadZoneContent}>
                  <Upload size={28} />
                  <p>Drag & drop an email file here, or click to browse</p>
                  <span>Supports .eml and .msg files</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".eml,.msg"
                  style={{ display: 'none' }}
                  onChange={e => handleEmailFileSelect(e.target.files?.[0])}
                />
              </div>
            ) : (
              <>
                <div className={styles.uploadedFileInfo}>
                  <CheckCircle2 size={18} />
                  <span className={styles.uploadedFileName}>{uploadedFile.name}</span>
                  <button type="button" className={styles.removeFileBtn} onClick={handleRemoveFile}>
                    <XIcon size={16} />
                  </button>
                </div>
                {isParsing && (
                  <div className={styles.parsingIndicator} style={{ marginTop: '0.5rem' }}>
                    <div className={styles.spinner}></div>
                    Extracting email contents...
                  </div>
                )}
              </>
            )}
          </div>
          <FormField
            label="Summary / Message" type="textarea" name="summary" value={logFormData.summary} onChange={handleLogInputChange} required rows={4}
            placeholder="What was discussed or sent?"
          />
        </form>
      </Modal>

      { }
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => { setIsPreviewOpen(false); setPreviewData(null); }}
        title="Email Preview"
        maxWidth="800px"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsPreviewOpen(false); setPreviewData(null); }}>Close</Button>
            <a href={previewAttachmentUrl} download={previewAttachmentName} style={{ textDecoration: 'none' }}>
              <Button variant="primary" icon={Download}>Download Original</Button>
            </a>
          </>
        }
      >
        {previewLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.75rem', color: 'var(--color-text-muted)' }}>
            <div className={styles.spinner}></div>
            Loading email...
          </div>
        ) : previewData ? (
          <div className={styles.emailPreview}>
            <div className={styles.emailHeaderBlock}>
              <h2 className={styles.emailSubject}>{previewData.subject}</h2>
              {previewData.date && (
                <div className={styles.emailMeta}>
                  <Clock size={13} />
                  {new Date(previewData.date).toLocaleString()}
                </div>
              )}
            </div>
            <div className={styles.emailFields}>
              {previewData.from && (
                <div className={styles.emailField}>
                  <span className={styles.emailFieldLabel}>From</span>
                  <span className={styles.emailFieldValue}>{previewData.from}</span>
                </div>
              )}
              {previewData.to && (
                <div className={styles.emailField}>
                  <span className={styles.emailFieldLabel}>To</span>
                  <span className={styles.emailFieldValue}>{previewData.to}</span>
                </div>
              )}
              {previewData.cc && (
                <div className={styles.emailField}>
                  <span className={styles.emailFieldLabel}>CC</span>
                  <span className={styles.emailFieldValue}>{previewData.cc}</span>
                </div>
              )}
            </div>
            {previewData.attachments?.length > 0 && (
              <div className={styles.emailAttachmentsList}>
                <span className={styles.emailFieldLabel}>Attachments</span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {previewData.attachments.map((att, i) => (
                    <span key={i} className={styles.emailAttachmentChip}>
                      <Paperclip size={11} />
                      {att.filename} ({(att.size / 1024).toFixed(1)} KB)
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className={styles.emailBodyContainer}>
              {previewData.html ? (
                <div className={styles.emailHtmlBody} dangerouslySetInnerHTML={{ __html: previewData.html }} />
              ) : (
                <pre className={styles.emailTextBody}>{previewData.text}</pre>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
