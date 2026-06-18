import api from './api';

const dealService = {
  importDeals: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await api.post('/crm/deals/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAllDeals: async (params = {}) => {
    const response = await api.get('/crm/deals', { params });
    return response.data;
  },

  getDealById: async (id) => {
    const response = await api.get(`/crm/deals/${id}`);
    return response.data;
  },

  createDeal: async (dealData) => {
    const response = await api.post('/crm/deals', dealData);
    return response.data;
  },

  updateDeal: async (id, dealData) => {
    const response = await api.put(`/crm/deals/${id}`, dealData);
    return response.data;
  },

  deleteDeal: async (id) => {
    const response = await api.delete(`/crm/deals/${id}`);
    return response.data;
  },

  getStages: async () => {
    const response = await api.get('/crm/deals/stages');
    return response.data;
  },

  async updateDealStage(id, stageId, wonLostReason = null) {
    try {
      const payload = { stage_id: stageId };
      if (wonLostReason !== null) {
        payload.won_lost_reason = wonLostReason;
      }
      const response = await api.patch(`/crm/deals/${id}/stage`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  

  async getAutomationRules(stageId) {
    try {
      const response = await api.get(`/crm/deals/stages/${stageId}/automation-rules`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async createAutomationRule(stageId, payload) {
    try {
      const response = await api.post(`/crm/deals/stages/${stageId}/automation-rules`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async deleteAutomationRule(ruleId) {
    try {
      const response = await api.delete(`/crm/deals/automation-rules/${ruleId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default dealService;
