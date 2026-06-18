import api from './api';

const documentService = {
  getDocuments: async (params = {}) => {
    try {
      const response = await api.get('/crm/documents', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  uploadDocument: async (formData) => {
    try {
      const response = await api.post('/crm/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  deleteDocument: async (id) => {
    try {
      const response = await api.delete(`/crm/documents/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  getDownloadUrl: (id) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    return `${API_URL}/crm/documents/${id}/download`;
  }
};

export default documentService;
