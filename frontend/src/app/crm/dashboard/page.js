'use client';

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  Users, UserPlus, FileText, CheckCircle, 
  TrendingUp, TrendingDown, DollarSign, Activity, 
  BarChart2, PieChart, LifeBuoy
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';
import styles from './page.module.css';

export default function CRMDashboard() {
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [stageMap, setStageMap] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryRes, chartsRes, stagesRes] = await Promise.all([
        api.get('/crm/dashboard/summary'),
        api.get('/crm/dashboard/charts'),
        api.get('/crm/deals/stages'),
      ]);

      setSummary(summaryRes.data.data);
      setCharts(chartsRes.data.data);

      // Build id → name map so the chart shows stage names instead of UUIDs
      const stages = stagesRes.data.data || stagesRes.data || [];
      const map = {};
      stages.forEach(s => { map[s.id] = s.name; });
      setStageMap(map);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  if (loading && !summary) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

  const formatDealStageData = (data) => {
    if (!data) return [];
    return data.map(d => ({
      name: d.stage_name || stageMap[d.stage_id] || d.stage_id,
      count: parseInt(d.count, 10),
      value: parseFloat(d.totalValue) || 0
    }));
  };

  const formatLeadStatusData = (data) => {
    if (!data) return [];
    return data.map(d => ({
      name: d.status.charAt(0).toUpperCase() + d.status.slice(1).replace('_', ' '),
      value: parseInt(d.count, 10)
    }));
  };

  const formatTicketStatusData = (data) => {
    if (!data) return [];
    return data.map(d => ({
      name: d.status.charAt(0).toUpperCase() + d.status.slice(1).replace('_', ' '),
      value: parseInt(d.count, 10)
    }));
  };

  const formatSalesPaymentsData = (sales, payments) => {
    if (!sales && !payments) return [];
    
    const monthMap = {};
    if (sales) {
      sales.forEach(s => {
        monthMap[s.month] = { month: s.month, sales: parseFloat(s.totalValue) || 0, payments: 0 };
      });
    }
    
    if (payments) {
      payments.forEach(p => {
        if (!monthMap[p.month]) {
          monthMap[p.month] = { month: p.month, sales: 0, payments: 0 };
        }
        monthMap[p.month].payments = parseFloat(p.totalAmount) || 0;
      });
    }
    
    return Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
  };

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.pageTitle}>Dashboard Overview</h1>
        </div>
        <div className={styles.actions}>
          <select 
            className={styles.dateFilter} 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </header>

      
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.primaryCard}`}>
          <div className={styles.kpiContent}>
            <h3 className={styles.kpiLabel}>Monthly Sales (Won)</h3>
            <p className={styles.kpiValue}>{formatCurrency(summary?.monthlySalesValue)}</p>
            <div className={styles.kpiTrend}>
              <TrendingUp size={14} className={styles.trendUp} />
              <span>vs last month</span>
            </div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiContent}>
            <h3 className={styles.kpiLabel}>Active Leads</h3>
            <p className={styles.kpiValue}>{summary?.activeLeads || 0}</p>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiContent}>
            <h3 className={styles.kpiLabel}>Pending Follow-ups</h3>
            <p className={styles.kpiValue}>{summary?.pendingFollowUps || 0}</p>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiContent}>
            <h3 className={styles.kpiLabel}>Total Customers</h3>
            <p className={styles.kpiValue}>{summary?.totalCustomers || 0}</p>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiContent}>
            <h3 className={styles.kpiLabel}>Open Deals</h3>
            <p className={styles.kpiValue}>{summary?.openDeals || 0}</p>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiContent}>
            <h3 className={styles.kpiLabel}>Open Tickets</h3>
            <p className={styles.kpiValue}>{summary?.openTickets || 0}</p>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiContent}>
            <h3 className={styles.kpiLabel}>Quote Value</h3>
            <p className={styles.kpiValue}>{formatCurrency(summary?.quoteValue)}</p>
          </div>
        </div>
      </div>

      
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Deals by Stage</h3>
            <BarChart2 className={styles.chartIcon} size={20} />
          </div>
          <div className={styles.chartBody}>
            {charts?.dealsByStage?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatDealStageData(charts.dealsByStage)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(59, 130, 246, 0.05)'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyChart}>No deal data available</div>
            )}
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Lead Status Distribution</h3>
            <PieChart className={styles.chartIcon} size={20} />
          </div>
          <div className={styles.chartBody}>
            {charts?.leadsByStatus?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={formatLeadStatusData(charts.leadsByStatus)}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {formatLeadStatusData(charts.leadsByStatus).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyChart}>No lead data available</div>
            )}
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Ticket Status</h3>
            <PieChart className={styles.chartIcon} size={20} />
          </div>
          <div className={styles.chartBody}>
            {charts?.ticketsByStatus?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={formatTicketStatusData(charts.ticketsByStatus)}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {formatTicketStatusData(charts.ticketsByStatus).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyChart}>No ticket data available</div>
            )}
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Sales vs Payments</h3>
            <BarChart2 className={styles.chartIcon} size={20} />
          </div>
          <div className={styles.chartBody}>
            {(charts?.salesPerformance?.length > 0 || charts?.paymentCollection?.length > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={formatSalesPaymentsData(charts.salesPerformance, charts.paymentCollection)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(59, 130, 246, 0.05)'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  <Bar yAxisId="left" dataKey="sales" name="Sales (Won)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar yAxisId="left" dataKey="payments" name="Payments Collected" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyChart}>No sales or payment data available</div>
            )}
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Lead Conversion</h3>
            <CheckCircle className={styles.chartIcon} size={20} />
          </div>
          <div className={styles.chartBody} style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '0 20px' }}>
            <div style={{ width: '100%', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Total Leads</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{charts?.conversion?.total || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Converted to Won</span>
                <span style={{ fontWeight: 600, color: '#10b981' }}>{charts?.conversion?.converted || 0}</span>
              </div>
            </div>
            
            <div style={{ width: '100%', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  backgroundColor: '#10b981', 
                  width: `${charts?.conversion?.total ? (charts.conversion.converted / charts.conversion.total) * 100 : 0}%`,
                  transition: 'width 1s ease-in-out'
                }} 
              />
            </div>
            <p style={{ marginTop: '16px', fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>
              {charts?.conversion?.total ? Math.round((charts.conversion.converted / charts.conversion.total) * 100) : 0}%
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b', marginLeft: '8px' }}>Conversion Rate</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
