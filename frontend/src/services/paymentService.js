import api from './api';

const paymentService = {
  

  async getPaymentSummary() {
    const response = await api.get('/crm/payments/summary');
    return response.data;
  },

  

  async getCustomerPayments(customerId) {
    const response = await api.get(`/crm/payments/customer/${customerId}`);
    return response.data;
  },
};

export default paymentService;
