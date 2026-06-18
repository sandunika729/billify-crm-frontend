import api from './api';

const customFieldService = {
  getFields: async (entityType) => {
    const params = entityType ? { entity_type: entityType } : {};
    const response = await api.get('/crm/custom-fields', { params });
    return response.data;
  },

  createField: async (data) => {
    const response = await api.post('/crm/custom-fields', data);
    return response.data;
  },

  updateField: async (id, data) => {
    const response = await api.put(`/crm/custom-fields/${id}`, data);
    return response.data;
  },

  deleteField: async (id) => {
    const response = await api.delete(`/crm/custom-fields/${id}`);
    return response.data;
  }
};

export default customFieldService;
