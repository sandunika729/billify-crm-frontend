import React from 'react';
import styles from './StatCard.module.css';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  trendLabel,
  colorClass = 'primary' 
}) {
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';
  
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {Icon && (
          <div className={`${styles.iconWrapper} ${styles[colorClass]}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className={styles.value}>{value}</div>
      
      {trend && (
        <div className={styles.footer}>
          <div className={`${styles.trend} ${isPositive ? styles.positive : isNegative ? styles.negative : ''}`}>
            {isPositive ? <ArrowUpRight size={16} /> : isNegative ? <ArrowDownRight size={16} /> : null}
            <span>{trendValue}</span>
          </div>
          {trendLabel && <span className={styles.trendLabel}>{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
