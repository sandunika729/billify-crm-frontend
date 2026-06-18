import api from './api';

const ticketService = {
  getAllTickets: async (params = {}) => {
    const response = await api.get('/crm/tickets', { params });
    return response.data;
  },

  getTicketById: async (id) => {
    const response = await api.get(`/crm/tickets/${id}`);
    return response.data;
  },

  createTicket: async (ticketData) => {
    const response = await api.post('/crm/tickets', ticketData);
    return response.data;
  },

  updateTicket: async (id, ticketData) => {
    const response = await api.put(`/crm/tickets/${id}`, ticketData);
    return response.data;
  },

  deleteTicket: async (id) => {
    const response = await api.delete(`/crm/tickets/${id}`);
    return response.data;
  },

  
  addMessage: async (ticketId, { message, is_internal }) => {
    const response = await api.post(`/crm/tickets/${ticketId}/messages`, { message, is_internal });
    return response.data;
  },

  
  updateStatus: async (ticketId, status) => {
    const response = await api.put(`/crm/tickets/${ticketId}`, { status });
    return response.data;
  }
};

export default ticketService;
