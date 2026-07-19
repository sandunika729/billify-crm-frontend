import api from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const outlookCalendarService = {
  /**
   * Check whether the current user has Outlook connected.
   */
  async getStatus() {
    const res = await api.get('/crm/outlook/status');
    return res.data;
  },

  /**
   * Redirect the user to the Microsoft OAuth login page.
   * This causes a full browser redirect (not an API call).
   */
  connect() {
    window.location.href = `${API_URL}/crm/outlook/connect`;
  },

  /**
   * Disconnect the current user's Outlook account.
   */
  async disconnect() {
    const res = await api.delete('/crm/outlook/disconnect');
    return res.data;
  },

  /**
   * Fetch Outlook calendar events within a date range.
   * @param {string} start - ISO date string
   * @param {string} end   - ISO date string
   */
  async getEvents(start, end) {
    const res = await api.get('/crm/outlook/events', {
      params: { start, end },
    });
    return res.data;
  },
};

export default outlookCalendarService;
