'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import customerService from '../../../../services/customerService';
import customFieldService from '../../../../services/customFieldService';
import Link from 'next/link';
import styles from './page.module.css';
import { 
  ArrowLeft, Building2, User, Phone, Mail, MapPin, 
  Briefcase, Clock, FileText, CheckCircle2, Edit, MoreHorizontal, LifeBuoy, X, DollarSign,
  MessageCircle, Plus, TrendingUp, Activity
} from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Modal from '../../../../components/modals/Modal';
import FormField from '../../../../components/forms/FormField';
import ActivityPanel from '../../../../components/crm/ActivityPanel';
import { alert, confirm } from '@/utils/alertService';

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const [customer, setCustomer] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [transactions, setTransactions] = useState({ bills: [], ledger: [] });
  const [documents, setDocuments] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [posCustomers, setPosCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editFormData, setEditFormData] = useState({
    type: 'individual', name: '', company_name: '', email: '', phone: '', secondary_phone: '', status: 'active', notes: '', tags_string: ''
  });
  const [contactData, setContactData] = useState({
    name: '', role: '', email: '', phone: '', is_primary: false
  });
  const [addressData, setAddressData] = useState({
    type: 'billing', line1: '', line2: '', city: '', district: '', country: ''
  });

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [interactionData, setInteractionData] = useState({
    channel: 'call', direction: 'outbound', summary: ''
  });

  useEffect(() => {
    if (id) {
      fetchCustomerDetails();
    }
    fetchPosCustomers();
  }, [id]);

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

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const res = await customerService.getCustomerById(id);
      if (res.success) {
        const customerData = res.data;
        if (customerData) {
          if (typeof customerData.tags_json === 'string') {
            try {
              customerData.tags_json = JSON.parse(customerData.tags_json);
            } catch (e) {
              customerData.tags_json = customerData.tags_json.split(',').map(t => t.trim()).filter(Boolean);
            }
          }
          if (!Array.isArray(customerData.tags_json)) {
            customerData.tags_json = [];
          }
        }
        setCustomer(customerData);
        
        const [timelineRes, transactionsRes, documentsRes, customFieldsRes] = await Promise.all([
          customerService.getCustomerTimeline(id),
          customerService.getCustomerTransactions(id),
          customerService.getCustomerDocuments(id),
          customFieldService.getFields('customer')
        ]);
        if (timelineRes.success) setTimeline(timelineRes.data || []);
        if (transactionsRes.success) {
          const txData = transactionsRes.data || {};
          setTransactions({ bills: txData.bills || [], ledger: txData.ledger || [] });
        }
        if (documentsRes.success) setDocuments(documentsRes.data || []);
        if (customFieldsRes.success) setCustomFields(customFieldsRes.data || []);
      } else {
        router.push('/crm/customers');
      }
    } catch (error) {
      console.error('Failed to fetch customer:', error);
      router.push('/crm/customers');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    const initialEditData = {
      type: customer.type || 'individual',
      name: customer.name || '',
      company_name: customer.company_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      secondary_phone: customer.secondary_phone || '',
      status: customer.status || 'active',
      notes: customer.notes || '',
      tags_string: customer.tags_json ? customer.tags_json.join(', ') : '',
      custom_fields: customer.custom_fields || {},
      billify_customer_id: customer.billify_customer_id || ''
    };
    
    setEditFormData(initialEditData);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const tags_json = editFormData.tags_string.split(',').map(t => t.trim()).filter(t => t);
      const payload = { ...editFormData, tags_json };
      delete payload.tags_string;
      
      const res = await customerService.updateCustomer(id, payload);
      if (res.success) {
        setCustomer(prev => ({ ...prev, ...payload }));
        setIsEditModalOpen(false);
      }
    } catch (error) {
      alert('Error updating customer');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await customerService.addContact(id, contactData);
      if (res.success) {
        setCustomer(prev => ({ ...prev, contacts: [...(prev.contacts || []), res.data] }));
        setIsContactModalOpen(false);
        setContactData({ name: '', role: '', email: '', phone: '', is_primary: false });
      }
    } catch (error) {
      alert('Error adding contact');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await customerService.addAddress(id, addressData);
      if (res.success) {
        setCustomer(prev => ({ ...prev, addresses: [...(prev.addresses || []), res.data] }));
        setIsAddressModalOpen(false);
        setAddressData({ type: 'billing', line1: '', line2: '', city: '', district: '', country: '' });
      }
    } catch (error) {
      alert('Error adding address');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    
    setIsSubmitting(true);
    try {
      const res = await customerService.uploadDocument(id, selectedFile);
      if (res.success) {
        setDocuments(prev => [res.data, ...prev]);
        setIsDocumentModalOpen(false);
        setSelectedFile(null);
      }
    } catch (error) {
      alert('Error uploading document');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogInteraction = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await customerService.logInteraction({
        customer_id: id,
        ...interactionData
      });
      if (res.success) {
        
        const timelineRes = await customerService.getCustomerTimeline(id);
        if (timelineRes.success) setTimeline(timelineRes.data || []);
        setIsLogModalOpen(false);
        setInteractionData({ channel: 'call', direction: 'outbound', summary: '' });
      }
    } catch (error) {
      alert('Error logging interaction');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.loadingState}>Loading customer profile...</div>;
  }

  if (!customer) {
    return null; 
  }

  return (
    <div className={styles.pageContainer}>
      
      <div className={styles.topNav}>
        <Link href="/crm/customers" className={styles.backLink}>
          <ArrowLeft size={18} />
          <span>Back to Customers</span>
        </Link>
      </div>

      
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.profileAvatar}>
            {customer.type === 'company' ? <Building2 size={36} /> : <User size={36} />}
          </div>
          <div className={styles.profileInfo}>
            <div className={styles.profileTitleWrapper}>
              <h1>{customer.name}</h1>
              <span className={`${styles.statusBadge} ${styles[customer.status]}`}>
                {customer.status}
              </span>
            </div>
            {customer.company_name && (
              <p className={styles.companyName}>{customer.company_name}</p>
            )}
            
            <div className={styles.contactChips}>
              {customer.email && (
                <div className={styles.contactChip}>
                  <Mail size={12} /> <span>{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className={styles.contactChip}>
                  <Phone size={12} /> <span>{customer.phone}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.profileActions}>
            <a 
              href={`https://wa.me/${customer.phone ? customer.phone.replace(/[^0-9]/g, '') : ''}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.secondaryButton}
              style={{ color: '#25D366', borderColor: '#25D366', textDecoration: 'none' }}
              title="Send WhatsApp"
            >
              <MessageCircle size={18} /> WhatsApp
            </a>
            <a 
              href={`mailto:${customer.email || ''}`} 
              className={styles.secondaryButton}
              style={{ color: '#0078D4', borderColor: '#0078D4', textDecoration: 'none' }}
              title="Send Email"
            >
              <Mail size={18} /> Email
            </a>
            <Button variant="primary" icon={Plus} size="sm" onClick={() => setIsLogModalOpen(true)}>
              Log Activity
            </Button>
            <Button variant="secondary" icon={Edit} size="sm" onClick={openEditModal}>
              Edit
            </Button>
            <button className={styles.iconButton}>
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>

        {}
        {(() => {
          const deals = customer.deals || [];
          const quotes = customer.quotes || [];
          const totalDealValue = deals.reduce((s, d) => s + Number(d.value_lkr || 0), 0);
          const openDeals = deals.filter(d => d.status === 'open').length;
          const wonDeals = deals.filter(d => d.status === 'won').length;
          const totalQuotes = quotes.length;
          return (
            <div style={{ display: 'flex', gap: '1rem', padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
              {[
                { label: 'Total Deal Value', value: `Rs. ${totalDealValue.toLocaleString()}`, color: '#0ea5e9' },
                { label: 'Open Deals', value: openDeals, color: '#f59e0b' },
                { label: 'Won Deals', value: wonDeals, color: '#10b981' },
                { label: 'Total Quotes', value: totalQuotes, color: '#8b9be2' },
              ].map(stat => (
                <div key={stat.label} style={{ flex: '1', minWidth: '120px', padding: '0.6rem 1rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '0.1rem' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          );
        })()}

        <div className={styles.tabsWrapper}>
          {['overview','deals','quotes','activities','tickets','transactions','documents'].map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      
      <div className={styles.contentArea}>
        {activeTab === 'overview' && (
          <div className={styles.overviewGrid}>
            
            <div className={styles.detailsColumn}>
              <div className={styles.contentCard}>
                <h3>About Customer</h3>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Customer Type</span>
                  <span className={styles.detailValue} style={{textTransform: 'capitalize'}}>{customer.type}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Added On</span>
                  <span className={styles.detailValue}>
                    {new Date(customer.createdAt || customer.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Customer Code</span>
                  <span className={styles.detailValue}>{customer.customer_code || 'N/A'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Linked POS Customer</span>
                  <span className={styles.detailValue}>
                    {customer.billify_customer_id 
                      ? (posCustomers.find(pc => pc.id === customer.billify_customer_id)?.name || 'Linked') 
                      : <span className={styles.textMuted}>Not Linked</span>}
                  </span>
                </div>
                {customer.website && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Website</span>
                    <span className={styles.detailValue}>
                      <a href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
                        {customer.website}
                      </a>
                    </span>
                  </div>
                )}
                {customer.secondary_phone && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Secondary Phone</span>
                    <span className={styles.detailValue}>{customer.secondary_phone}</span>
                  </div>
                )}
                {customer.source && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Lead Source</span>
                    <span className={styles.detailValue} style={{ textTransform: 'capitalize' }}>
                      {customer.source.replace('_', ' ')}
                    </span>
                  </div>
                )}
                
                {customFields.length > 0 && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                    <h4 style={{ marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Custom Fields</h4>
                    {customFields.map(field => {
                      const val = customer.custom_fields?.[field.field_name];
                      return (
                        <div key={field.id} className={styles.detailRow}>
                          <span className={styles.detailLabel}>{field.field_label}</span>
                          <span className={styles.detailValue}>
                            {val !== undefined && val !== null && val !== '' ? (
                              field.field_type === 'checkbox' ? (val ? 'Yes' : 'No') : String(val)
                            ) : (
                              <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              
              <div className={styles.contentCard} style={{ marginTop: '20px' }}>
                <h3>Tags & Notes</h3>
                <div style={{ marginBottom: '15px' }}>
                  <span className={styles.detailLabel}>Tags</span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {customer.tags_json && customer.tags_json.length > 0 ? (
                      customer.tags_json.map((tag, idx) => (
                        <span key={idx} style={{ background: 'var(--color-background)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid var(--color-border)' }}>
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className={styles.detailValue}>No tags added</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className={styles.detailLabel}>Notes</span>
                  <p className={styles.detailValue} style={{ marginTop: '8px' }}>{customer.notes || 'No notes added'}</p>
                </div>
              </div>

              
              <div className={styles.contentCard} style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Contacts & Addresses</h3>
                </div>
                
                <div style={{ marginBottom: '15px', marginTop: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className={styles.detailLabel}>Associated Contacts</span>
                    <Button variant="primary" size="sm" onClick={() => setIsContactModalOpen(true)}>Add Contact</Button>
                  </div>
                  {customer.contacts && customer.contacts.length > 0 ? (
                    customer.contacts.map(contact => (
                      <div key={contact.id} style={{ background: 'var(--color-background)', padding: '8px', borderRadius: '4px', marginBottom: '8px', fontSize: '14px', border: '1px solid var(--color-border)' }}>
                        <strong>{contact.name}</strong> {contact.role && `(${contact.role})`}<br/>
                        {contact.email} {contact.email && contact.phone && '|'} {contact.phone}
                      </div>
                    ))
                  ) : (
                    <span className={styles.detailValue}>No contacts added</span>
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className={styles.detailLabel}>Addresses</span>
                    <Button variant="primary" size="sm" onClick={() => setIsAddressModalOpen(true)}>Add Address</Button>
                  </div>
                  {customer.addresses && customer.addresses.length > 0 ? (
                    customer.addresses.map(address => (
                      <div key={address.id} style={{ background: 'var(--color-background)', padding: '8px', borderRadius: '4px', marginBottom: '8px', fontSize: '14px', border: '1px solid var(--color-border)' }}>
                        <strong style={{textTransform: 'capitalize'}}>{address.type} Address</strong><br/>
                        {address.line1}{address.line2 && `, ${address.line2}`}<br/>
                        {address.city}{address.district && `, ${address.district}`}{address.country && `, ${address.country}`}
                      </div>
                    ))
                  ) : (
                    <span className={styles.detailValue}>No addresses added</span>
                  )}
                </div>
              </div>
            </div>

            
            <div className={styles.timelineColumn}>
              <div className={styles.contentCard}>
                <h3>Recent Activity</h3>
                <div className={styles.timeline}>
                  {timeline.length > 0 ? (
                    timeline.map((log, index) => (
                      <div className={styles.timelineItem} key={log.id || index}>
                        <div className={styles.timelineIcon} style={{backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)'}}>
                          <CheckCircle2 size={16} />
                        </div>
                        <div className={styles.timelineContent}>
                          <p><strong>{log.action} - {log.entityType}</strong>: {log.description || 'System generated event'}</p>
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.timelineItem}>
                      <div className={styles.timelineIcon} style={{backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)'}}>
                        <CheckCircle2 size={16} />
                      </div>
                      <div className={styles.timelineContent}>
                        <p><strong>Customer profile created</strong></p>
                        <span>{new Date(customer.createdAt || customer.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deals' && (
          <div className={styles.contentCard}>
            <div className={styles.cardHeader}>
              <h3>Deals & Pipeline</h3>
            </div>
            {customer.deals && customer.deals.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Deal Title</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Stage</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Value</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Close Date</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.deals.map(deal => {
                    const statusColors = { open: '#f59e0b', won: '#10b981', lost: '#ef4444' };
                    const color = statusColors[deal.status] || '#64748b';
                    return (
                      <tr key={deal.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600, color: '#0f172a' }}>{deal.title}</td>
                        <td style={{ padding: '0.75rem', color: '#475569' }}>{deal.stage?.name || '—'}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>Rs. {Number(deal.value_lkr).toLocaleString()}</td>
                        <td style={{ padding: '0.75rem', color: '#475569' }}>
                          {deal.expected_close_at ? new Date(deal.expected_close_at).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ background: `${color}15`, color, padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
                            {deal.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyStateContainer}>
                <Briefcase size={32} className={styles.emptyIcon} />
                <p>No deals found for this customer.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'quotes' && (
          <div className={styles.contentCard}>
            <div className={styles.cardHeader}>
              <h3>Quotations</h3>
            </div>
            {customer.quotes && customer.quotes.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Quote No.</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Amount</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Valid Until</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.quotes.map(quote => {
                    const qColors = { draft: '#94a3b8', sent: '#3b82f6', accepted: '#10b981', rejected: '#ef4444', expired: '#f59e0b' };
                    const qColor = qColors[quote.status] || '#64748b';
                    return (
                      <tr key={quote.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600, color: '#0f172a' }}>{quote.quote_no}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>Rs. {Number(quote.total_lkr).toLocaleString()}</td>
                        <td style={{ padding: '0.75rem', color: '#475569' }}>
                          {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ background: `${qColor}15`, color: qColor, padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
                            {quote.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyStateContainer}>
                <FileText size={32} className={styles.emptyIcon} />
                <p>No quotes found for this customer.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activities' && (
          <div className={styles.contentCard}>
            <div className={styles.cardHeader}>
              <h3>Activities & Follow-ups</h3>
            </div>
            <ActivityPanel relatedType="customer" relatedId={id} />
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className={styles.contentCard}>
            <div className={styles.cardHeader}>
              <h3>Support Tickets</h3>
              <Button variant="primary" size="sm">Create Ticket</Button>
            </div>
            {customer.tickets && customer.tickets.length > 0 ? (
              <div className={styles.listContainer}>
                {customer.tickets.map(ticket => (
                  <div key={ticket.id} className={styles.listItem}>
                    <div className={styles.listContent}>
                      <h4>{ticket.subject}</h4>
                      <p>Priority: {ticket.priority} | Status: {ticket.status}</p>
                    </div>
                    <Link href={`/crm/tickets/${ticket.id}`} className={styles.secondaryButtonSmall}>View</Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyStateContainer}>
                <LifeBuoy size={32} className={styles.emptyIcon} />
                <p>No support tickets filed by this customer.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className={styles.contentCard}>
            <div className={styles.cardHeader}>
              <h3>Transaction History (POS)</h3>
            </div>

            
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>Invoices / Bills</h4>
              {transactions.bills && transactions.bills.length > 0 ? (
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Bill No.</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Total (LKR)</th>
                      <th>Paid (LKR)</th>
                      <th>Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.bills.map(bill => (
                      <tr key={bill.id}>
                        <td><strong>{bill.bill_number}</strong></td>
                        <td>{bill.bill_date ? new Date(bill.bill_date).toLocaleDateString() : '-'}</td>
                        <td style={{ textTransform: 'capitalize' }}>{bill.transaction_type || '-'}</td>
                        <td>Rs. {Number(bill.total || 0).toLocaleString()}</td>
                        <td>Rs. {Number(bill.paid_amount || 0).toLocaleString()}</td>
                        <td style={{ textTransform: 'capitalize' }}>{bill.payment_method || '-'}</td>
                        <td><span className={styles.statusBadge}>{bill.status || 'N/A'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyStateContainer} style={{ padding: '20px' }}>
                  <DollarSign size={24} className={styles.emptyIcon} />
                  <p>No POS invoices linked to this customer.</p>
                </div>
              )}
            </div>

            
            <div>
              <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>Customer Ledger</h4>
              {transactions.ledger && transactions.ledger.length > 0 ? (
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Debit (LKR)</th>
                      <th>Credit (LKR)</th>
                      <th>Balance (LKR)</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.ledger.map(entry => (
                      <tr key={entry.id}>
                        <td>{entry.transaction_date ? new Date(entry.transaction_date).toLocaleDateString() : '-'}</td>
                        <td style={{ textTransform: 'capitalize' }}>{entry.transaction_type || '-'}</td>
                        <td>Rs. {Number(entry.debit_amount || 0).toLocaleString()}</td>
                        <td>Rs. {Number(entry.credit_amount || 0).toLocaleString()}</td>
                        <td><strong>Rs. {Number(entry.running_balance || 0).toLocaleString()}</strong></td>
                        <td>{entry.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyStateContainer} style={{ padding: '20px' }}>
                  <FileText size={24} className={styles.emptyIcon} />
                  <p>No ledger entries found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className={styles.contentCard}>
            <div className={styles.cardHeader}>
              <h3>Documents</h3>
              <Button variant="primary" size="sm" onClick={() => setIsDocumentModalOpen(true)}>Upload Document</Button>
            </div>
            {documents && documents.length > 0 ? (
              <div className={styles.listContainer}>
                {documents.map(doc => (
                  <div key={doc.id} className={styles.listItem}>
                    <div className={styles.listContent}>
                      <h4>{doc.original_name || doc.file_name}</h4>
                      <p>Size: {Math.round((doc.size || 0) / 1024)} KB</p>
                    </div>
                    <a href={`${process.env.NEXT_PUBLIC_API_URL.replace('/api', '')}/uploads/${doc.file_name}`} target="_blank" rel="noopener noreferrer" className={styles.secondaryButtonSmall}>View / Download</a>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyStateContainer}>
                <FileText size={32} className={styles.emptyIcon} />
                <p>No documents uploaded for this customer.</p>
              </div>
            )}
          </div>
        )}
      </div>

      
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Customer"
        maxWidth="600px"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleEditSubmit} isLoading={isSubmitting}>Save Changes</Button>
          </>
        }
      >
        <form id="edit-customer-form" onSubmit={handleEditSubmit} className={styles.modalForm}>
          <div className={styles.formRow}>
            <FormField label="Full Name" name="name" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} required />
            <FormField label="Company Name" name="company_name" value={editFormData.company_name} onChange={e => setEditFormData({...editFormData, company_name: e.target.value})} />
          </div>
          <div className={styles.formRow}>
            <FormField label="Email" type="email" name="email" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} />
            <FormField label="Phone" name="phone" value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} />
          </div>
          <div className={styles.formRow}>
            <FormField 
              label="Link POS Customer" 
              type="select" 
              name="billify_customer_id" 
              value={editFormData.billify_customer_id} 
              onChange={e => setEditFormData({...editFormData, billify_customer_id: e.target.value})}
              options={[
                { value: '', label: '-- Do not link --' },
                ...posCustomers.map(pc => ({ value: pc.id, label: `${pc.name} ${pc.phone ? `(${pc.phone})` : ''}` }))
              ]}
            />
            <FormField 
              label="Customer Type" type="select" name="type" value={editFormData.type} 
              onChange={e => setEditFormData({...editFormData, type: e.target.value})}
              options={[
                { value: 'individual', label: 'Individual' },
                { value: 'retail', label: 'Retail Customer' },
                { value: 'company', label: 'Company' },
                { value: 'supplier', label: 'Supplier' },
                { value: 'lead_only', label: 'Lead Only' }
              ]}
            />
            <FormField 
              label="Status" type="select" name="status" value={editFormData.status}
              onChange={e => setEditFormData({...editFormData, status: e.target.value})}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'archived', label: 'Archived' }
              ]}
            />
          </div>
          <FormField label="Tags (comma separated)" name="tags_string" value={editFormData.tags_string} onChange={e => setEditFormData({...editFormData, tags_string: e.target.value})} placeholder="VIP, Wholesale" />
          {customFields.length > 0 && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
              <h4 style={{ marginBottom: '1rem' }}>Custom Fields</h4>
              {customFields.map(field => {
                const value = editFormData.custom_fields?.[field.field_name] ?? '';
                return (
                  <div className={styles.formGroup} key={field.id} style={{ marginBottom: '1rem' }}>
                    <label>
                      {field.field_label} {field.is_required && '*'}
                    </label>
                    
                    {field.field_type === 'text' && (
                      <input 
                        type="text" 
                        value={value} 
                        required={field.is_required}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          custom_fields: { ...editFormData.custom_fields, [field.field_name]: e.target.value }
                        })} 
                      />
                    )}

                    {field.field_type === 'number' && (
                      <input 
                        type="number" 
                        value={value} 
                        required={field.is_required}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          custom_fields: { ...editFormData.custom_fields, [field.field_name]: e.target.value }
                        })} 
                      />
                    )}

                    {field.field_type === 'date' && (
                      <input 
                        type="date" 
                        value={value} 
                        required={field.is_required}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          custom_fields: { ...editFormData.custom_fields, [field.field_name]: e.target.value }
                        })} 
                      />
                    )}

                    {field.field_type === 'select' && (
                      <select 
                        value={value} 
                        required={field.is_required}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          custom_fields: { ...editFormData.custom_fields, [field.field_name]: e.target.value }
                        })}
                      >
                        <option value="">-- Select --</option>
                        {field.options && field.options.map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {field.field_type === 'checkbox' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input 
                          type="checkbox" 
                          checked={!!value} 
                          required={field.is_required}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            custom_fields: { ...editFormData.custom_fields, [field.field_name]: e.target.checked }
                          })} 
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                        <span onClick={() => {
                          setEditFormData({
                            ...editFormData,
                            custom_fields: { ...editFormData.custom_fields, [field.field_name]: !value }
                          })
                        }} style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
                          {field.field_label}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <FormField label="Internal Notes" type="textarea" name="notes" rows={3} value={editFormData.notes} onChange={e => setEditFormData({...editFormData, notes: e.target.value})} />
        </form>
      </Modal>

      
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log Communication"
        maxWidth="500px"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsLogModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleLogInteraction} isLoading={isSubmitting}>Save Log</Button>
          </>
        }
      >
        <form id="log-interaction-form" onSubmit={handleLogInteraction} className={styles.modalForm}>
          <div className={styles.formRow}>
            <FormField 
              label="Channel" type="select" name="channel" value={interactionData.channel} 
              onChange={e => setInteractionData({...interactionData, channel: e.target.value})}
              options={[
                { value: 'call', label: 'Phone Call' },
                { value: 'email', label: 'Email' },
                { value: 'whatsapp', label: 'WhatsApp' },
                { value: 'meeting', label: 'Meeting' },
                { value: 'note', label: 'Internal Note' }
              ]}
            />
            <FormField 
              label="Direction" type="select" name="direction" value={interactionData.direction} 
              onChange={e => setInteractionData({...interactionData, direction: e.target.value})}
              options={[
                { value: 'outbound', label: 'Outbound (Sent)' },
                { value: 'inbound', label: 'Inbound (Received)' }
              ]}
            />
          </div>
          <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>Summary / Notes</label>
            <textarea 
              required
              rows={4}
              value={interactionData.summary}
              onChange={e => setInteractionData({...interactionData, summary: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)', fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="What was discussed?"
            />
          </div>
        </form>
      </Modal>

      
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title="Add Contact"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsContactModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleContactSubmit} isLoading={isSubmitting}>Add Contact</Button>
          </>
        }
      >
        <form id="add-contact-form" onSubmit={handleContactSubmit} className={styles.modalForm}>
          <div className={styles.formRow}>
            <FormField label="Name" name="contact_name" value={contactData.name} onChange={e => setContactData({...contactData, name: e.target.value})} required />
            <FormField label="Role / Title" name="contact_role" value={contactData.role} onChange={e => setContactData({...contactData, role: e.target.value})} />
          </div>
          <div className={styles.formRow}>
            <FormField label="Email" type="email" name="contact_email" value={contactData.email} onChange={e => setContactData({...contactData, email: e.target.value})} />
            <FormField label="Phone" name="contact_phone" value={contactData.phone} onChange={e => setContactData({...contactData, phone: e.target.value})} />
          </div>
        </form>
      </Modal>

      
      <Modal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        title="Add Address"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddressModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddressSubmit} isLoading={isSubmitting}>Save Address</Button>
          </>
        }
      >
        <form id="add-address-form" onSubmit={handleAddressSubmit} className={styles.modalForm}>
          <FormField 
            label="Address Type" type="select" name="address_type" value={addressData.type}
            onChange={e => setAddressData({...addressData, type: e.target.value})}
            options={[
              { value: 'billing', label: 'Billing' },
              { value: 'shipping', label: 'Shipping' },
              { value: 'office', label: 'Office' },
              { value: 'home', label: 'Home' }
            ]}
          />
          <FormField label="Address Line 1" name="line1" value={addressData.line1} onChange={e => setAddressData({...addressData, line1: e.target.value})} required />
          <div className={styles.formRow}>
            <FormField label="Address Line 2" name="line2" value={addressData.line2} onChange={e => setAddressData({...addressData, line2: e.target.value})} />
            <FormField label="City" name="city" value={addressData.city} onChange={e => setAddressData({...addressData, city: e.target.value})} />
          </div>
          <div className={styles.formRow}>
            <FormField label="District/State" name="district" value={addressData.district} onChange={e => setAddressData({...addressData, district: e.target.value})} />
            <FormField label="Country" name="country" value={addressData.country} onChange={e => setAddressData({...addressData, country: e.target.value})} />
          </div>
        </form>
      </Modal>

      
      <Modal
        isOpen={isDocumentModalOpen}
        onClose={() => { setIsDocumentModalOpen(false); setSelectedFile(null); }}
        title="Upload Document"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsDocumentModalOpen(false); setSelectedFile(null); }}>Cancel</Button>
            <Button variant="primary" onClick={handleDocumentSubmit} disabled={!selectedFile} isLoading={isSubmitting}>Upload File</Button>
          </>
        }
      >
        <form id="upload-doc-form" onSubmit={handleDocumentSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500 }}>Select File (PDF, Word, Excel, Images - Max 10MB)</label>
            <input 
              type="file" 
              className={styles.fileInput}
              onChange={(e) => setSelectedFile(e.target.files[0])}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
              required
            />
          </div>
          {selectedFile && (
            <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </form>
      </Modal>

    </div>
  );
}
