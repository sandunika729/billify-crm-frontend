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
  },

  /**
   * Fetch Outlook calendar events for the given date range.
   * Returns [] if Outlook is not connected (no error thrown).
   */
  getOutlookEvents: async (start, end) => {
    const response = await api.get('/crm/outlook/events', { params: { start, end } });
    return response.data;
  },
};

export default calendarService;
