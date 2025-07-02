import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api', // Uses the proxy set in package.json for development
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Interceptor to add auth token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Or however you store the token
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
