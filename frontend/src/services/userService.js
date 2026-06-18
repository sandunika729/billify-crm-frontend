import api from './api';

const userService = {
  
  async getAllUsers() {
    const res = await api.get('/crm/users');
    return res.data;
  },

  
  async createUser(data) {
    const res = await api.post('/crm/users', data);
    return res.data;
  },

  
  async updateUser(id, data) {
    const res = await api.put(`/crm/users/${id}`, data);
    return res.data;
  },

  
  async deactivateUser(id) {
    const res = await api.delete(`/crm/users/${id}`);
    return res.data;
  },

  
  async reactivateUser(id) {
    const res = await api.patch(`/crm/users/${id}/reactivate`);
    return res.data;
  },

  
  async resetPassword(id, new_password) {
    const res = await api.post(`/crm/users/${id}/reset-password`, { new_password });
    return res.data;
  },
};

export default userService;
