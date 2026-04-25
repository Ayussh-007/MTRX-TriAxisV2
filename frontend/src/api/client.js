import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 min for LLM calls
});

export default API;
