import api from './api';

const roleService = {
  getRoles: async () => {
    const response = await api.get('/crm/admin/roles');
    return response.data;
  },

  getPermissions: async () => {
    const response = await api.get('/crm/admin/roles/permissions');
    return response.data;
  },

  updateRole: async (id, data) => {
    const response = await api.put(`/crm/admin/roles/${id}`, data);
    return response.data;
  }
};

export default roleService;
