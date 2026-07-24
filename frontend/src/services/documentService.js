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
  },

  getDocumentUrl: async (id) => {
    try {
      const response = await api.get(`/crm/documents/${id}/url`);
      return response.data;
    } catch (error) {
      console.error('Error getting document URL:', error);
      return null;
    }
  },

  downloadDocument: async (id) => {
    try {
      const urlResponse = await api.get(`/crm/documents/${id}/url`);

      if (urlResponse.data && urlResponse.data.isUrl) {
        const cloudinaryRes = await fetch(urlResponse.data.url);
        if (!cloudinaryRes.ok) {
          throw new Error('Failed to download from Cloudinary');
        }
        const blob = await cloudinaryRes.blob();
        return {
          data: blob,
          headers: {
            'content-type': urlResponse.data.mime_type || blob.type,
            'content-disposition': `attachment; filename="${urlResponse.data.original_name}"`,
          },
        };
      }

      const response = await api.get(`/crm/documents/${id}/download`, {
        responseType: 'blob',
      });
      return response;
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  },
};

export default documentService;
