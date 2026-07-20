import api from './api';

const outlookService = {
  getStatus: async () => {
    try {
      const response = await api.get('/crm/outlook/status');
      return response.data;
    } catch (error) {
      console.error('Error fetching outlook status:', error);
      return { success: false, data: { connected: false } };
    }
  },

  getAuthUrl: async () => {
    try {
      const response = await api.get('/crm/outlook/auth-url');
      return response.data;
    } catch (error) {
      console.error('Error fetching outlook auth url:', error);
      return { success: false };
    }
  },

  disconnect: async () => {
    try {
      const response = await api.delete('/crm/outlook/disconnect');
      return response.data;
    } catch (error) {
      console.error('Error disconnecting outlook:', error);
      return { success: false, message: 'Failed to disconnect.' };
    }
  },

  syncEvents: async (start, end) => {
    try {
      const response = await api.post('/crm/outlook/sync', { start, end });
      return response.data;
    } catch (error) {
      console.error('Error syncing outlook events:', error);
      return { success: false, message: 'Failed to sync.' };
    }
  },
};

export default outlookService;
