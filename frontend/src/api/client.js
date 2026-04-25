import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  timeout: 300000, // 5 min for slow LLM calls (slides, agent)
});

export default API;
