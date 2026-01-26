import axios from 'axios';

const API_BASE_URL = '/api';

/**
 * Axios instance configured with the base API URL.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
});

/**
 * Fetches the list of all available subjects.
 *
 * @returns {Promise<Array<string>>} A promise that resolves to an array of subject names.
 */
export const getSubjects = async () => {
  const response = await api.get('/subjects');
  return response.data;
};

/**
 * Fetches the list of modules for a specific subject.
 *
 * @param {string} subject - The name of the subject.
 * @returns {Promise<Array<string>>} A promise that resolves to an array of module names.
 */
export const getModules = async (subject) => {
  const response = await api.get(`/modules/${subject}`);
  return response.data;
};

/**
 * Fetches the list of questions for a specific subject and module.
 *
 * @param {string} subject - The name of the subject.
 * @param {string} moduleName - The name of the module.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of question objects.
 */
export const getQuestions = async (subject, moduleName) => {
  const response = await api.get(`/questions/${subject}/${moduleName}`);
  return response.data;
};

/**
 * Fetches the attempt history for a specific module.
 */
export const getAttemptHistory = async (subject, moduleName) => {
  const response = await api.get(`/history/${subject}/${moduleName}`);
  return response.data;
};

/**
 * Starts a new quiz attempt.
 */
export const createQuizAttempt = async (subject, moduleName) => {
  const response = await api.post('/attempts', { subject, module: moduleName });
  return response.data;
};

/**
 * Fetches the details of a single quiz attempt.
 */
export const getQuizAttempt = async (attemptId) => {
  const response = await api.get(`/attempts/${attemptId}`);
  return response.data;
};

/**
 * Marks a quiz attempt as complete.
 */
export const completeQuizAttempt = async (attemptId, skippedIds) => {
  const response = await api.post(`/attempts/${attemptId}/complete`, { skipped_ids: skippedIds });
  return response.data;
};

/**
 * Submits a user's attempt at a question.
 *
 * @param {Object} attemptData - The attempt data.
 * @param {string} attemptData.mcq_id - The ID of the question.
 * @param {string} attemptData.subject - The subject name.
 * @param {string} attemptData.module - The module name.
 * @param {string} attemptData.selected_option - The option selected by the user.
 * @param {boolean} attemptData.is_correct - Whether the answer is correct.
 * @param {number} attemptData.time_taken_question_sec - Time taken to answer in seconds.
 * @param {number} [attemptData.quiz_attempt_id] - Optional ID of the parent quiz attempt.
 * @returns {Promise<Object>} A promise that resolves to the response data (including attempt ID).
 */
export const submitAttempt = async (attemptData) => {
  const response = await api.post('/submit_attempt', attemptData);
  return response.data; // Should contain { id: 123, status: "recorded" }
};

/**
 * Updates an existing attempt with additional data (e.g., explanation time).
 *
 * @param {number} attemptId - The ID of the attempt to update.
 * @param {Object} updateData - The data to update.
 * @param {number} updateData.time_taken_explanation_sec - Time spent reading the explanation.
 * @returns {Promise<Object>} A promise that resolves to the response data.
 */
export const updateAttempt = async (attemptId, updateData) => {
  const response = await api.patch(`/attempt/${attemptId}`, updateData);
  return response.data;
};


/**
 * Fetches the detailed performance stats for a specific quiz attempt.
 */
export const getAttemptStats = async (attemptId) => {
  const response = await api.get(`/stats/${attemptId}`);
  return response.data;
};
