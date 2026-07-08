import api from './api';

const todoService = {
  getTodos: async (params = {}) => {
    const response = await api.get('/crm/todos', { params });
    return response.data;
  },

  createTodo: async (data) => {
    const response = await api.post('/crm/todos', data);
    return response.data;
  },

  updateTodo: async (id, data) => {
    const response = await api.put(`/crm/todos/${id}`, data);
    return response.data;
  },

  deleteTodo: async (id) => {
    const response = await api.delete(`/crm/todos/${id}`);
    return response.data;
  },
};

export default todoService;
