import api from './axiosConfig';

export const departmentAPI = {
  getAll: async () => {
    const response = await api.get('/auth/departments/');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/auth/departments/${id}/`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/auth/departments/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.patch(`/auth/departments/${id}/`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/auth/departments/${id}/`);
    return response.data;
  },
};
