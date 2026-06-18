import api from './api';

const shopProfileService = {
  getProfile: async () => {
    const response = await api.get('/crm/shop-profile');
    return response.data;
  },

  upsertProfile: async (data) => {
    const response = await api.post('/crm/shop-profile', data);
    return response.data;
  },

  regenerateKey: async () => {
    const response = await api.post('/crm/shop-profile/regenerate-key');
    return response.data;
  },
};

export default shopProfileService;
