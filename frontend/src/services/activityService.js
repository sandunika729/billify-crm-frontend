import api from './api';

const activityService = {

  getActivities: async (params = {}) => {
    const response = await api.get('/crm/activities', { params });
    return response.data;
  },

  createActivity: async (data) => {
    const response = await api.post('/crm/activities', data);
    return response.data;
  },

  updateActivity: async (id, data) => {
    const response = await api.put(`/crm/activities/${id}`, data);
    return response.data;
  },

  deleteActivity: async (id) => {
    const response = await api.delete(`/crm/activities/${id}`);
    return response.data;
  },

  getCalendarActivities: async (params = {}) => {
    const response = await api.get('/crm/activities/calendar', { params });
    return response.data;
  },

  getInteractions: async (params = {}) => {
    const response = await api.get('/crm/activities/interactions', { params });
    return response.data;
  },

  createInteraction: async (data) => {
    const response = await api.post('/crm/activities/interactions', data);
    return response.data;
  },

  sendEmail: async (data) => {
    const response = await api.post('/crm/activities/send-email', data);
    return response.data;
  },

  sendWhatsApp: async (data) => {
    const response = await api.post('/crm/activities/send-whatsapp', data);
    return response.data;
  },

  uploadEmail: async (file) => {
    const formData = new FormData();
    formData.append('emailFile', file);
    const response = await api.post('/crm/activities/upload-email', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  previewEmail: async (fileUrl) => {
    const response = await api.get('/crm/activities/preview-email', { params: { file: fileUrl } });
    return response.data;
  }
};

export default activityService;
