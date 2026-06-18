import api from './api';

const reportService = {
  getReports: async (from, to) => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/crm/reports', { params });
    return response.data;
  }
};

export default reportService;
