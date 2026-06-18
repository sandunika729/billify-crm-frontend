import api from './api';

const calendarService = {
  getActivities: async (start, end) => {
    const params = {};
    if (start) params.start = start;
    if (end) params.end = end;
    const response = await api.get('/crm/activities/calendar', { params });
    return response.data;
  },

  createActivity: async (data) => {
    const response = await api.post('/crm/activities', data);
    return response.data;
  },

  updateActivity: async (id, data) => {
    const response = await api.put(`/crm/activities/${id}`, data);
    return response.data;
  }
};

export default calendarService;
