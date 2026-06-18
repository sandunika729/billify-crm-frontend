import api from './api';

const leadService = {
  getAllLeads: async (params = {}) => {
    const response = await api.get('/crm/leads', { params });
    return response.data;
  },

  getLeadById: async (id) => {
    const response = await api.get(`/crm/leads/${id}`);
    return response.data;
  },

  createLead: async (leadData) => {
    const response = await api.post('/crm/leads', leadData);
    return response.data;
  },

  updateLead: async (id, leadData) => {
    const response = await api.put(`/crm/leads/${id}`, leadData);
    return response.data;
  },

  deleteLead: async (id) => {
    const response = await api.delete(`/crm/leads/${id}`);
    return response.data;
  },

  convertLead: async (id, convertData) => {
    const response = await api.post(`/crm/leads/${id}/convert`, convertData);
    return response.data;
  },

  bulkDelete: async (ids) => {
    const response = await api.post('/crm/leads/bulk-delete', { ids });
    return response.data;
  },

  bulkReassign: async (ids, owner_id) => {
    const response = await api.put('/crm/leads/bulk-reassign', { ids, owner_id });
    return response.data;
  },

  exportLeads: async () => {
    const response = await api.get('/crm/leads/export', { responseType: 'blob' });
    const { downloadAndSaveExport } = await import('../utils/exportHelper');
    await downloadAndSaveExport(response.data, `leads_export_${Date.now()}.csv`);
  },

  importLeads: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/crm/leads/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

export default leadService;
