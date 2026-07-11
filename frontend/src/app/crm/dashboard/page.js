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
  PieChart as RechartsPieChart, Pie, Cell, ComposedChart, Line,
  LineChart
} from 'recharts';
import styles from './page.module.css';

export default function CRMDashboard() {
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(() => new Date().toISOString().slice(0, 10));
  const [stageMap, setStageMap] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryRes, chartsRes, stagesRes] = await Promise.all([
        api.get('/crm/dashboard/summary', { params: { month: dateRange } }),
        api.get('/crm/dashboard/charts', { params: { month: dateRange } }),
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
  const PASTEL_COLORS = [
    '#a5b4fc', // lavender
    '#86efac', // mint green
    '#fca5a5', // rose
    '#fde68a', // soft yellow
    '#93c5fd', // sky blue
    '#f9a8d4', // pink
    '#6ee7b7', // teal
    '#c4b5fd', // violet
  ];

  const formatDealStageData = (data) => {
    if (!data) return { lines: [], chartData: [] };
    // Build one data point per stage for a multi-line chart
    const lines = data.map((d, i) => ({
      key: d.stage_name || stageMap[d.stage_id] || `Stage ${i + 1}`,
      color: PASTEL_COLORS[i % PASTEL_COLORS.length],
    }));
    // Single "point" of data with each stage as a key
    const point = { name: 'Current' };
    data.forEach((d, i) => {
      const key = d.stage_name || stageMap[d.stage_id] || `Stage ${i + 1}`;
      point[key] = parseInt(d.count, 10);
    });
    return { lines, chartData: [point] };
  };

  const formatDealStageDataSimple = (data) => {
    if (!data) return [];
    return data.map((d, i) => ({
      name: d.stage_name || stageMap[d.stage_id] || `Stage ${i + 1}`,
      count: parseInt(d.count, 10),
      color: PASTEL_COLORS[i % PASTEL_COLORS.length],
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
          <input 
            type="date"
            className={styles.dateFilter} 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
          />
        </div>
      </header>

      
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.primaryCard}`}>
          <div className={styles.kpiContent}>
            <h3 className={styles.kpiLabel}>Monthly Sales (Won)</h3>
            <p className={styles.kpiValue}>{formatCurrency(summary?.monthlySalesValue)}</p>
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
          </div>
          <div className={styles.chartBody}>
            {charts?.dealsByStage?.length > 0 ? (() => {
              const stageData = formatDealStageDataSimple(charts.dealsByStage);
              return (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stageData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                    <defs>
                      {stageData.map((s, i) => (
                        <linearGradient key={s.name} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '10px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        fontSize: '12px'
                      }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Deals"
                      stroke="#a5b4fc"
                      strokeWidth={2.5}
                      dot={{ r: 5, fill: '#a5b4fc', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              );
            })() : (
              <div className={styles.emptyChart}>No deal data available</div>
            )}
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Lead Status Distribution</h3>
          </div>
          <div className={styles.chartBody}>
            {charts?.leadsByStatus?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <RechartsPieChart>
                  <Pie
                    data={formatLeadStatusData(charts.leadsByStatus)}
                    cx="50%"
                    cy="45%"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {formatLeadStatusData(charts.leadsByStatus).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PASTEL_COLORS[index % PASTEL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                  <Legend verticalAlign="bottom" height={30} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
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
          </div>
          <div className={styles.chartBody}>
            {charts?.ticketsByStatus?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <RechartsPieChart>
                  <Pie
                    data={formatTicketStatusData(charts.ticketsByStatus)}
                    cx="50%"
                    cy="45%"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {formatTicketStatusData(charts.ticketsByStatus).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PASTEL_COLORS[index % PASTEL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                  <Legend verticalAlign="bottom" height={30} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyChart}>No ticket data available</div>
            )}
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Lead Conversion</h3>
          </div>
          <div className={styles.chartBody} style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '0 20px' }}>
            <div style={{ width: '100%', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Total Leads</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{charts?.conversion?.total || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Converted to Won</span>
                <span style={{ fontWeight: 600, color: '#6ee7b7' }}>{charts?.conversion?.converted || 0}</span>
              </div>
            </div>
            
            <div style={{ width: '100%', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  backgroundColor: '#6ee7b7', 
                  width: `${charts?.conversion?.total ? (charts.conversion.converted / charts.conversion.total) * 100 : 0}%`,
                  transition: 'width 1s ease-in-out'
                }} 
              />
            </div>
            <p style={{ marginTop: '16px', fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
              {charts?.conversion?.total ? Math.round((charts.conversion.converted / charts.conversion.total) * 100) : 0}%
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', marginLeft: '8px' }}>Conversion Rate</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
