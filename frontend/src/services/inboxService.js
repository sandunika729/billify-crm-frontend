import api from './api';

const inboxService = {
  getInbox: async (params) => {
    const response = await api.get('/crm/inbox', { params });
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/crm/inbox/stats');
    return response.data;
  }
};

export default inboxService;
