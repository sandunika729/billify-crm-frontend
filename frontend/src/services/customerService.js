import api from './api';

const customerService = {
  getAllCustomers: async (params = {}) => {
    const response = await api.get('/crm/customers', { params });
    return response.data;
  },

  getPosCustomers: async () => {
    const response = await api.get('/crm/customers/pos-customers');
    return response.data;
  },

  getCustomerById: async (id) => {
    const response = await api.get(`/crm/customers/${id}`);
    return response.data;
  },

  createCustomer: async (customerData) => {
    const response = await api.post('/crm/customers', customerData);
    return response.data;
  },

  updateCustomer: async (id, customerData) => {
    const response = await api.put(`/crm/customers/${id}`, customerData);
    return response.data;
  },

  deleteCustomer: async (id) => {
    const response = await api.delete(`/crm/customers/${id}`);
    return response.data;
  },

  getCustomerTimeline: async (id) => {
    const response = await api.get(`/crm/customers/${id}/timeline`);
    return response.data;
  },

  getCustomerTransactions: async (id) => {
    const response = await api.get(`/crm/customers/${id}/transactions`);
    return response.data;
  },

  getCustomerDocuments: async (id) => {
    const response = await api.get(`/crm/customers/${id}/documents`);
    return response.data;
  },

  logInteraction: async (data) => {
    const response = await api.post(`/crm/activities/interactions`, data);
    return response.data;
  },

  addContact: async (customerId, contactData) => {
    const response = await api.post(`/crm/customers/${customerId}/contacts`, contactData);
    return response.data;
  },

  addAddress: async (customerId, addressData) => {
    const response = await api.post(`/crm/customers/${customerId}/addresses`, addressData);
    return response.data;
  },

  uploadDocument: async (customerId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/crm/customers/${customerId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  importCustomers: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/crm/customers/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export default customerService;
