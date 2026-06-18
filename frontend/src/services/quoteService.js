import api from './api';

const quoteService = {
  importQuotes: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await api.post('/crm/quotes/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getAllQuotes: async (params = {}) => {
    const response = await api.get('/crm/quotes', { params });
    return response.data;
  },

  getQuoteById: async (id) => {
    const response = await api.get(`/crm/quotes/${id}`);
    return response.data;
  },

  createQuote: async (quoteData) => {
    const response = await api.post('/crm/quotes', quoteData);
    return response.data;
  },

  updateQuoteStatus: async (id, status) => {
    const response = await api.patch(`/crm/quotes/${id}/status`, { status });
    return response.data;
  },

  deleteQuote: async (id) => {
    const response = await api.delete(`/crm/quotes/${id}`);
    return response.data;
  },

  downloadPdf: async (id) => {
    const response = await api.get(`/crm/quotes/${id}/pdf`, { responseType: 'blob' });
    return response.data;
  },

  sendEmail: async (id, emailData) => {
    const response = await api.post(`/crm/quotes/${id}/send-email`, emailData);
    return response.data;
  },

  convertToInvoice: async (id) => {
    const response = await api.post(`/crm/quotes/${id}/convert-to-invoice`);
    return response.data;
  }
};

export default quoteService;
