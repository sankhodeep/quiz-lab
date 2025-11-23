import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getSubjects = async () => {
  const response = await api.get('/subjects');
  return response.data;
};

export const getModules = async (subject) => {
  const response = await api.get(`/modules/${subject}`);
  return response.data;
};

export const getQuestions = async (subject, moduleName) => {
  const response = await api.get(`/questions/${subject}/${moduleName}`);
  return response.data;
};

export const submitAttempt = async (attemptData) => {
  const response = await api.post('/submit_attempt', attemptData);
  return response.data; // Should contain { id: 123, status: "recorded" }
};

export const updateAttempt = async (attemptId, updateData) => {
  const response = await api.patch(`/attempt/${attemptId}`, updateData);
  return response.data;
};
