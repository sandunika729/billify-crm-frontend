import { format } from 'date-fns';

export const formatLKR = (amount) => {
  if (amount === null || amount === undefined) return 'LKR 0.00';
  
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateValue) => {
  if (!dateValue) return 'N/A';
  try {
    const date = new Date(dateValue);
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    return 'Invalid Date';
  }
};

export const formatDateTime = (dateValue) => {
  if (!dateValue) return 'N/A';
  try {
    const date = new Date(dateValue);
    return format(date, 'MMM dd, yyyy h:mm a');
  } catch (error) {
    return 'Invalid Date';
  }
};

export const getStatusColor = (status) => {
  const normalizedStatus = status?.toLowerCase();
  
  switch (normalizedStatus) {
    
    case 'new': return 'var(--color-info)';
    case 'contacted': return 'var(--color-primary)';
    case 'qualified': return 'var(--color-success)';
    case 'proposal_sent': return 'var(--color-warning)';
    case 'lost': return 'var(--color-danger)';
    
    
    case 'draft': return 'var(--color-text-secondary)';
    case 'sent': return 'var(--color-info)';
    case 'viewed': return 'var(--color-primary)';
    case 'accepted':
    case 'won': return 'var(--color-success)';
    case 'rejected': return 'var(--color-danger)';
    case 'expired': return 'var(--color-text-muted)';
    
    
    case 'open': return 'var(--color-danger)';
    case 'in_progress': return 'var(--color-warning)';
    case 'waiting': return 'var(--color-info)';
    case 'resolved':
    case 'closed': return 'var(--color-success)';
    
    
    case 'active': return 'var(--color-success)';
    case 'inactive': return 'var(--color-text-muted)';
    
    default: return 'var(--color-text-secondary)';
  }
};

export const getStatusBgColor = (status) => {
  const normalizedStatus = status?.toLowerCase();
  
  switch (normalizedStatus) {
    
    case 'new': return 'var(--color-info-bg)';
    case 'contacted': return 'var(--color-primary-light)';
    case 'qualified': return 'var(--color-success-bg)';
    case 'proposal_sent': return 'var(--color-warning-bg)';
    case 'lost': return 'var(--color-danger-bg)';
    
    
    case 'draft': return '#f1f5f9';
    case 'sent': return 'var(--color-info-bg)';
    case 'viewed': return 'var(--color-primary-light)';
    case 'accepted':
    case 'won': return 'var(--color-success-bg)';
    case 'rejected': return 'var(--color-danger-bg)';
    case 'expired': return '#f1f5f9';
    
    
    case 'open': return 'var(--color-danger-bg)';
    case 'in_progress': return 'var(--color-warning-bg)';
    case 'waiting': return 'var(--color-info-bg)';
    case 'resolved':
    case 'closed': return 'var(--color-success-bg)';
    
    
    case 'active': return 'var(--color-success-bg)';
    case 'inactive': return '#f1f5f9';
    
    default: return '#f1f5f9';
  }
};

export const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'low': return 'var(--color-info)';
    case 'medium': return 'var(--color-warning)';
    case 'high': return 'var(--color-danger)';
    case 'urgent': return '#991b1b'; 
    default: return 'var(--color-text-secondary)';
  }
};

export const getPriorityBgColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'low': return 'var(--color-info-bg)';
    case 'medium': return 'var(--color-warning-bg)';
    case 'high': return 'var(--color-danger-bg)';
    case 'urgent': return '#fef2f2'; 
    default: return '#f1f5f9';
  }
};

export const getInitials = (firstName, lastName) => {
  const first = firstName ? firstName.charAt(0) : '';
  const last = lastName ? lastName.charAt(0) : '';
  return `${first}${last}`.toUpperCase() || '?';
};
