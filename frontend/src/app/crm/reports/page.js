'use client';

import React, { useState, useEffect } from 'react';
import reportService from '../../../services/reportService';
import { 
  TrendingUp, Users, Target, Ticket, BarChart3, 
  ArrowLeft, Download, FileText, Calendar, UserCheck, FileSignature, XCircle, Eye
} from 'lucide-react';
import styles from './page.module.css';
import Button from '../../../components/ui/Button';
import SearchBar from '../../../components/ui/SearchBar';
import FilterSelect from '../../../components/ui/FilterSelect';

const REPORT_CATEGORIES = [
  { id: 'sales', label: 'Sales & Revenue' },
  { id: 'leads', label: 'Leads & Pipeline' },
  { id: 'quotes', label: 'Quotes & Invoices' },
  { id: 'customers', label: 'Customer Analytics' },
  { id: 'support', label: 'Support & Tickets' }
];

const AVAILABLE_REPORTS = [
  
  { id: 'revenue', category: 'sales', title: 'Revenue Trend', description: 'Monthly breakdown of won deals and total revenue generated.', icon: TrendingUp },
  { id: 'team', category: 'sales', title: 'Team Performance Leaderboard', description: 'Sales rep performance based on deals won and total revenue closed.', icon: Users },
  { id: 'lost_deals', category: 'sales', title: 'Lost Deals Analysis', description: 'Detailed breakdown of lost deals and primary loss reasons.', icon: XCircle },
  { id: 'win_loss', category: 'sales', title: 'Win / Loss Reason Analysis', description: 'Visual breakdown of why deals are won or lost, based on the reason entered when closing a deal.', icon: BarChart3 },
  
  
  { id: 'pipeline', category: 'leads', title: 'Pipeline Value by Stage', description: 'Total estimated value of active deals grouped by their current pipeline stage.', icon: BarChart3 },
  { id: 'funnel', category: 'leads', title: 'Lead Conversion Funnel', description: 'Number of leads currently sitting in each stage of the sales funnel.', icon: Target },
  
  
  { id: 'quote_status', category: 'quotes', title: 'Quotes by Status', description: 'Overview of all quotes categorized by draft, sent, accepted, and rejected.', icon: FileSignature },
  { id: 'quote_conversion', category: 'quotes', title: 'Quote Conversion Rate', description: 'Percentage of sent quotes that turn into won deals.', icon: TrendingUp },

  
  { id: 'new_customers', category: 'customers', title: 'New Customer Acquisition', description: 'Monthly trend of newly acquired customers vs churned customers.', icon: UserCheck },
  { id: 'top_customers', category: 'customers', title: 'Top Customers by Revenue', description: 'Ranking of customers based on total lifetime value.', icon: Users },

  
  { id: 'tickets', category: 'support', title: 'Support Ticket Trends', description: 'Summary of monthly opened vs. resolved support tickets.', icon: Ticket },
  { id: 'sla_breach', category: 'support', title: 'SLA Breach Report', description: 'List of all tickets that breached their target resolution times.', icon: Ticket }
];

export default function ReportsPage() {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(() => new Date().toISOString().slice(0, 10));

  const [activeTab, setActiveTab] = useState('sales');
  const [selectedReport, setSelectedReport] = useState(null);

  const [librarySearchTerm, setLibrarySearchTerm] = useState('');
  const [tableSearchTerm, setTableSearchTerm] = useState('');

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Calculate month boundaries from the selected date
      const selected = new Date(dateRange);
      const from = new Date(selected.getFullYear(), selected.getMonth(), 1).toISOString();
      const to = new Date(selected.getFullYear(), selected.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const res = await reportService.getReports(from, to);
      if (res.success) {
        setReportsData(res.data);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleDownloadCSV = () => {
    if (!selectedReport || !reportsData) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (selectedReport.id === 'revenue') {
      csvContent += "Month,Revenue (LKR)\n";
      (reportsData.revenueTrend || []).forEach(row => {
        csvContent += `"${row.month}","${row.revenue}"\n`;
      });
    } else if (selectedReport.id === 'leads' || selectedReport.id === 'funnel') {
      csvContent += "Stage,Count\n";
      (reportsData.leadFunnel || []).forEach(row => {
        csvContent += `"${row.stage}","${row.count}"\n`;
      });
    } else if (selectedReport.id === 'pipeline') {
      csvContent += "Stage,Pipeline Value (LKR)\n";
      (reportsData.pipelineValue || []).forEach(row => {
        csvContent += `"${row.stage_name}","${row.value}"\n`;
      });
    } else if (selectedReport.id === 'team') {
      csvContent += "Sales Rep,Deals Won,Revenue (LKR)\n";
      (reportsData.teamPerformance || []).forEach(row => {
        csvContent += `"${row.name}","${row.deals_won}","${row.revenue}"\n`;
      });
    } else if (selectedReport.id === 'tickets') {
      csvContent += "Month,Opened Tickets,Resolved Tickets\n";
      (reportsData.ticketStats || []).forEach(row => {
        csvContent += `"${row.month}","${row.opened}","${row.resolved}"\n`;
      });
    } else if (selectedReport.id === 'win_loss') {
      const wl = reportsData.winLossReasons || {};
      const wonR = wl.wonReasons || [];
      const lostR = wl.lostReasons || [];
      csvContent += "Type,Reason,Count\n";
      wonR.forEach(r => { csvContent += `"Won","${r.reason}","${r.count}"\n`; });
      lostR.forEach(r => { csvContent += `"Lost","${r.reason}","${r.count}"\n`; });
    } else if (selectedReport.id === 'lost_deals') {
      csvContent += "Deal Title,Customer,Owner,Value (LKR),Reason,Date\n";
      (reportsData.lostDealsAnalysis?.deals || []).forEach(r => {
        csvContent += `"${r.title}","${r.customer}","${r.owner}","${r.value_lkr}","${r.reason}","${new Date(r.date).toLocaleDateString()}"\n`;
      });
    } else if (selectedReport.id === 'quote_status') {
      csvContent += "Status,Count,Total Value (LKR)\n";
      (reportsData.quoteStatusBreakdown?.breakdown || []).forEach(r => {
        csvContent += `"${r.status}","${r.count}","${r.total_value}"\n`;
      });
    } else if (selectedReport.id === 'quote_conversion') {
      csvContent += "Month,Total,Accepted,Rejected,Conversion Rate\n";
      (reportsData.quoteConversionRate?.timeline || []).forEach(r => {
        csvContent += `"${r.month}","${r.total}","${r.accepted}","${r.rejected}","${r.conversionRate}%"\n`;
      });
    } else if (selectedReport.id === 'new_customers') {
      csvContent += "Month,New Customers\n";
      (reportsData.newCustomerAcquisition?.timeline || []).forEach(r => {
        csvContent += `"${r.month}","${r.count}"\n`;
      });
    } else if (selectedReport.id === 'top_customers') {
      csvContent += "Rank,Customer,Email,Deals Won,Revenue (LKR)\n";
      (reportsData.topCustomersByRevenue || []).forEach(r => {
        csvContent += `"${r.rank}","${r.name}","${r.email}","${r.deals_won}","${r.revenue}"\n`;
      });
    } else {
      csvContent += "Data Export\nNo backend data mapped yet for this report.\n";
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedReport.id}_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderReportTable = () => {
    if (loading) return <div className={styles.emptyState}>Loading report data...</div>;
    if (!reportsData) return <div className={styles.emptyState}>No data available for this report.</div>;

    switch (selectedReport.id) {
      case 'revenue': {
        const rows = (reportsData.revenueTrend || []).filter(r => r.month.toLowerCase().includes(tableSearchTerm.toLowerCase()));
        return (
          <table className={styles.leadsTable}>
            <thead><tr><th>Month</th><th className={styles.textRight}>Revenue Closed</th></tr></thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.month}</td>
                  <td className={`${styles.textRight} ${styles.primaryText}`}>{formatCurrency(row.revenue)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="2" className={styles.emptyState}>No data found</td></tr>}
            </tbody>
          </table>
        );
      }
      case 'team': {
        const rows = (reportsData.teamPerformance || []).filter(r => r.name.toLowerCase().includes(tableSearchTerm.toLowerCase()));
        return (
          <table className={styles.leadsTable}>
            <thead><tr><th>Sales Rep</th><th className={styles.textCenter}>Deals Won</th><th className={styles.textRight}>Total Revenue</th></tr></thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td className={styles.primaryText}>{row.name}</td>
                  <td className={styles.textCenter}>{row.deals_won}</td>
                  <td className={`${styles.textRight} ${styles.primaryText}`}>{formatCurrency(row.revenue)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="3" className={styles.emptyState}>No data found</td></tr>}
            </tbody>
          </table>
        );
      }
      case 'pipeline': {
        const rows = (reportsData.pipelineValue || []).filter(r => r.stage_name.toLowerCase().includes(tableSearchTerm.toLowerCase()));
        return (
          <table className={styles.leadsTable}>
            <thead><tr><th>Pipeline Stage</th><th className={styles.textCenter}>Deals Count</th><th className={styles.textRight}>Estimated Value</th></tr></thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td>
                    <span className={styles.statusBadge}>{row.stage_name}</span>
                  </td>
                  <td className={styles.textCenter}>{row.count}</td>
                  <td className={`${styles.textRight} ${styles.primaryText}`}>{formatCurrency(row.value)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="3" className={styles.emptyState}>No data found</td></tr>}
            </tbody>
          </table>
        );
      }
      case 'funnel': {
        const rows = (reportsData.leadFunnel || []).filter(r => r.stage.toLowerCase().includes(tableSearchTerm.toLowerCase()));
        return (
          <table className={styles.leadsTable}>
            <thead><tr><th>Lead Stage</th><th className={styles.textRight}>Count</th></tr></thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.stage}</td>
                  <td className={`${styles.textRight} ${styles.primaryText}`}>{row.count}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="2" className={styles.emptyState}>No data found</td></tr>}
            </tbody>
          </table>
        );
      }
      case 'tickets': {
        const rows = (reportsData.ticketStats || []).filter(r => r.month.toLowerCase().includes(tableSearchTerm.toLowerCase()));
        return (
          <table className={styles.leadsTable}>
            <thead><tr><th>Month</th><th className={styles.textCenter}>Opened</th><th className={styles.textCenter}>Resolved</th></tr></thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.month}</td>
                  <td className={styles.textCenter}>{row.opened}</td>
                  <td className={styles.textCenter}>{row.resolved}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="3" className={styles.emptyState}>No data found</td></tr>}
            </tbody>
          </table>
        );
      }
      case 'win_loss': {
        const wl = reportsData.winLossReasons || {};
        const { wonReasons = [], lostReasons = [], totalWon = 0, totalLost = 0, winRate = 0 } = wl;
        const maxCount = Math.max(...[...wonReasons, ...lostReasons].map(r => r.count), 1);

        return (
          <div>
            {/* Stat Cards */}
            <div className={styles.kpiGrid}>
              {[
                { label: 'Total Won', value: totalWon },
                { label: 'Total Lost', value: totalLost },
                { label: 'Win Rate', value: `${winRate}%`, primary: true },
              ].map(stat => (
                <div key={stat.label} className={`${styles.kpiCard} ${stat.primary ? styles.primaryCard : ''}`}>
                  <div className={styles.kpiContent}>
                    <h3 className={styles.kpiLabel}>{stat.label}</h3>
                    <p className={styles.kpiValue}>{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {}
              <div>
                <h4 style={{ marginBottom: '0.75rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>✅ Why Deals Are Won</h4>
                {wonReasons.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No won deal reasons recorded yet.</p>
                ) : wonReasons.map((r, i) => (
                  <div key={i} style={{ marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                      <span style={{ color: '#0f172a', fontWeight: 500, maxWidth: '75%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.reason}>{r.reason}</span>
                      <span style={{ fontWeight: 700, color: '#10b981' }}>{r.count}</span>
                    </div>
                    <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(r.count / maxCount) * 100}%`, background: '#10b981', borderRadius: 99, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                ))}
              </div>

              {}
              <div>
                <h4 style={{ marginBottom: '0.75rem', color: '#ef4444', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>❌ Why Deals Are Lost</h4>
                {lostReasons.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No lost deal reasons recorded yet.</p>
                ) : lostReasons.map((r, i) => (
                  <div key={i} style={{ marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                      <span style={{ color: '#0f172a', fontWeight: 500, maxWidth: '75%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.reason}>{r.reason}</span>
                      <span style={{ fontWeight: 700, color: '#ef4444' }}>{r.count}</span>
                    </div>
                    <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(r.count / maxCount) * 100}%`, background: '#ef4444', borderRadius: 99, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }
      case 'lost_deals': {
        const ld = reportsData.lostDealsAnalysis || {};
        const { deals: lostList = [], reasonBreakdown = [], totalLost = 0, totalValueLost = 0 } = ld;
        const maxR = Math.max(...reasonBreakdown.map(r => r.count), 1);
        return (
          <div>
            <div className={styles.kpiGrid}>
              {[
                { label: 'Total Lost Deals', value: totalLost },
                { label: 'Total Value Lost', value: `Rs. ${totalValueLost.toLocaleString()}`, primary: true }
              ].map(stat => (
                <div key={stat.label} className={`${styles.kpiCard} ${stat.primary ? styles.primaryCard : ''}`}>
                  <div className={styles.kpiContent}>
                    <h3 className={styles.kpiLabel}>{stat.label}</h3>
                    <p className={styles.kpiValue}>{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
            {reasonBreakdown.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Loss Reasons</h4>
                {reasonBreakdown.map((r, i) => (
                  <div key={i} style={{ marginBottom: '0.55rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 500, color: '#334155' }} title={r.reason}>{r.reason}</span>
                      <span style={{ fontWeight: 700, color: '#ef4444' }}>{r.count} deals · Rs. {r.value.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 7, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(r.count / maxR) * 100}%`, background: '#ef4444', borderRadius: 99 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <table className={styles.leadsTable}>
              <thead><tr><th>Deal</th><th>Customer</th><th>Owner</th><th className={styles.textRight}>Value</th><th>Reason</th><th>Date Lost</th></tr></thead>
              <tbody>
                {lostList.filter(r => !tableSearchTerm || r.title.toLowerCase().includes(tableSearchTerm.toLowerCase()) || r.customer.toLowerCase().includes(tableSearchTerm.toLowerCase())).map((row, idx) => (
                  <tr key={idx}>
                    <td className={styles.primaryText}>{row.title}</td>
                    <td>{row.customer}</td>
                    <td>{row.owner}</td>
                    <td className={styles.textRight}>Rs. {row.value_lkr.toLocaleString()}</td>
                    <td><span style={{ background: '#fee2e2', color: '#ef4444', padding: '0.15rem 0.5rem', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600 }}>{row.reason}</span></td>
                    <td>{new Date(row.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      case 'quote_status': {
        const qs = reportsData.quoteStatusBreakdown || {};
        const { breakdown = [], totalQuotes = 0 } = qs;
        const STATUS_COLORS = { draft: '#94a3b8', sent: '#3b82f6', viewed: '#8b5cf6', accepted: '#10b981', rejected: '#ef4444', expired: '#f59e0b', converted: '#06b6d4' };
        return (
          <div>
            <div className={styles.kpiGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
              {breakdown.map(r => (
                <div key={r.status} className={styles.kpiCard}>
                  <div className={styles.kpiContent}>
                    <h3 className={styles.kpiLabel} style={{textTransform: 'capitalize'}}>{r.status} (Rs. {r.total_value.toLocaleString()})</h3>
                    <p className={styles.kpiValue}>{r.count}</p>
                  </div>
                </div>
              ))}
            </div>
            <table className={styles.leadsTable}>
              <thead><tr><th>Status</th><th className={styles.textCenter}>Count</th><th className={styles.textCenter}>% of Total</th><th className={styles.textRight}>Total Value</th></tr></thead>
              <tbody>
                {breakdown.map((row, idx) => (
                  <tr key={idx}>
                    <td><span style={{ background: `${STATUS_COLORS[row.status]}18`, color: STATUS_COLORS[row.status], padding: '0.2rem 0.6rem', borderRadius: 99, fontSize: '0.78rem', fontWeight: 700, textTransform: 'capitalize' }}>{row.status}</span></td>
                    <td className={styles.textCenter}>{row.count}</td>
                    <td className={styles.textCenter}>{totalQuotes > 0 ? Math.round((row.count / totalQuotes) * 100) : 0}%</td>
                    <td className={`${styles.textRight} ${styles.primaryText}`}>Rs. {row.total_value.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      case 'quote_conversion': {
        const qc = reportsData.quoteConversionRate || {};
        const { timeline = [], totalSent = 0, totalAccepted = 0, overallRate = 0 } = qc;
        return (
          <div>
            <div className={styles.kpiGrid}>
              {[
                { label: 'Total Quotes Sent', value: totalSent },
                { label: 'Accepted / Converted', value: totalAccepted },
                { label: 'Overall Conversion Rate', value: `${overallRate}%`, primary: true }
              ].map(stat => (
                <div key={stat.label} className={`${styles.kpiCard} ${stat.primary ? styles.primaryCard : ''}`}>
                  <div className={styles.kpiContent}>
                    <h3 className={styles.kpiLabel}>{stat.label}</h3>
                    <p className={styles.kpiValue}>{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <table className={styles.leadsTable}>
              <thead><tr><th>Month</th><th className={styles.textCenter}>Total</th><th className={styles.textCenter}>Accepted</th><th className={styles.textCenter}>Rejected</th><th className={styles.textCenter}>Conversion Rate</th></tr></thead>
              <tbody>
                {timeline.filter(r => !tableSearchTerm || r.month.includes(tableSearchTerm)).map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.month}</td>
                    <td className={styles.textCenter}>{row.total}</td>
                    <td className={`${styles.textCenter}`} style={{ color: '#10b981', fontWeight: 600 }}>{row.accepted}</td>
                    <td className={`${styles.textCenter}`} style={{ color: '#ef4444' }}>{row.rejected}</td>
                    <td className={styles.textCenter}>
                      <span style={{ background: row.conversionRate >= 50 ? '#d1fae5' : '#fee2e2', color: row.conversionRate >= 50 ? '#059669' : '#ef4444', padding: '0.15rem 0.5rem', borderRadius: 99, fontSize: '0.78rem', fontWeight: 700 }}>{row.conversionRate}%</span>
                    </td>
                  </tr>
                ))}
                {timeline.length === 0 && <tr><td colSpan="5" className={styles.emptyState}>No data found</td></tr>}
              </tbody>
            </table>
          </div>
        );
      }
      case 'new_customers': {
        const nc = reportsData.newCustomerAcquisition || {};
        const { timeline: ncTimeline = [], bySource = [], total = 0 } = nc;
        const maxSrc = Math.max(...bySource.map(s => s.count), 1);
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            <div>
              <div className={styles.kpiGrid} style={{ gridTemplateColumns: '1fr', marginBottom: '1rem' }}>
                <div className={`${styles.kpiCard} ${styles.primaryCard}`}>
                  <div className={styles.kpiContent}>
                    <h3 className={styles.kpiLabel}>New Customers</h3>
                    <p className={styles.kpiValue}>{total}</p>
                  </div>
                </div>
              </div>
              <table className={styles.leadsTable}>
                <thead><tr><th>Month</th><th className={styles.textRight}>New Customers</th></tr></thead>
                <tbody>
                  {ncTimeline.filter(r => !tableSearchTerm || r.month.includes(tableSearchTerm)).map((row, idx) => (
                    <tr key={idx}><td>{row.month}</td><td className={`${styles.textRight} ${styles.primaryText}`}>{row.count}</td></tr>
                  ))}
                  {ncTimeline.length === 0 && <tr><td colSpan="2" className={styles.emptyState}>No data found</td></tr>}
                </tbody>
              </table>
            </div>
            <div>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>By Source</h4>
              {bySource.map((s, i) => (
                <div key={i} style={{ marginBottom: '0.55rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 500, color: '#334155', textTransform: 'capitalize' }}>{s.source}</span>
                    <span style={{ fontWeight: 700, color: '#3b82f6' }}>{s.count}</span>
                  </div>
                  <div style={{ height: 7, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(s.count / maxSrc) * 100}%`, background: '#3b82f6', borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'top_customers': {
        const topC = reportsData.topCustomersByRevenue || [];
        const filtered = topC.filter(r => !tableSearchTerm || r.name.toLowerCase().includes(tableSearchTerm.toLowerCase()));
        return (
          <table className={styles.leadsTable}>
            <thead><tr><th>Rank</th><th>Customer</th><th>Type</th><th className={styles.textCenter}>Deals Won</th><th className={styles.textRight}>Total Revenue</th></tr></thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr key={idx}>
                  <td><span style={{ background: idx === 0 ? '#fef3c7' : idx === 1 ? '#f1f5f9' : idx === 2 ? '#fef3c7' : 'transparent', color: idx < 3 ? '#92400e' : '#64748b', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 6 }}>#{row.rank}</span></td>
                  <td>
                    <div className={styles.primaryText} style={{ fontWeight: 600 }}>{row.name}</div>
                    {row.email && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.email}</div>}
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{row.type}</td>
                  <td className={styles.textCenter}>{row.deals_won}</td>
                  <td className={`${styles.textRight} ${styles.primaryText}`} style={{ fontWeight: 700 }}>Rs. {row.revenue.toLocaleString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="5" className={styles.emptyState}>No data found</td></tr>}
            </tbody>
          </table>
        );
      }
      default:
        return (
          <div className={styles.emptyState}>
            Report calculation pending... Data source not yet mapped for <strong>{selectedReport.title}</strong>.
          </div>
        );
    }
  };

  
  if (selectedReport) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <button className={styles.backBtn} onClick={() => {
              setSelectedReport(null);
              setTableSearchTerm('');
            }}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1>{selectedReport.title}</h1>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button variant="outline" icon={Download} iconSize={14} onClick={handleDownloadCSV}>
              Export to CSV
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div className={styles.filterGroup} style={{ flex: 'none' }}>
              <input
                type="date"
                className={styles.dateFilter}
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '100%', maxWidth: '300px' }}>
              <SearchBar
                value={tableSearchTerm}
                onChange={setTableSearchTerm}
                placeholder="Search report data..."
                label=""
              />
            </div>
          </div>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            {renderReportTable()}
          </div>
        </div>
      </div>
    );
  }

  
  const displayedReports = AVAILABLE_REPORTS.filter(r => {
    const matchesCategory = r.category === activeTab;
    const matchesSearch = r.title.toLowerCase().includes(librarySearchTerm.toLowerCase()) || 
                          r.description.toLowerCase().includes(librarySearchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Reports Library</h1>
        </div>
      </div>

      <div className={styles.librarySearchRow}>
        <SearchBar
          value={librarySearchTerm}
          onChange={setLibrarySearchTerm}
          placeholder="Search for a report..."
          label=""
        />
      </div>

      <div className={styles.rolesLayout}>
        {}
        <div className={styles.rolesPanel}>
          <div className={styles.panelHeader}>
            <h3>Categories</h3>
          </div>
          <div className={styles.rolesList}>
            {REPORT_CATEGORIES.map(category => (
              <button 
                key={category.id}
                className={`${styles.roleItem} ${activeTab === category.id ? styles.active : ''}`}
                onClick={() => setActiveTab(category.id)}
              >
                <div className={styles.roleInfo}>
                  <div className={styles.roleName}>{category.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {}
        <div className={styles.reportsList}>
          {displayedReports.map(report => (
            <div key={report.id} className={styles.reportCard}>
              <div className={styles.reportInfo}>
                <h3>{report.title}</h3>
                <p>{report.description}</p>
              </div>
              <button
                className={styles.viewBtn}
                onClick={() => setSelectedReport(report)}
                title="View Report"
              >
                <Eye size={16} />
              </button>
            </div>
          ))}
          
          {displayedReports.length === 0 && (
            <div className={styles.emptyState}>
              No reports found matching your criteria in this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
