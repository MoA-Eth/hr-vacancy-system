import api from './axiosConfig';

export const projectAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/projects/', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/projects/${id}/`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/projects/', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.patch(`/projects/${id}/`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/projects/${id}/`);
    return response.data;
  },
};
