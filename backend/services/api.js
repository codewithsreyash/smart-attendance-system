import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api', // Replace with your backend base URL
});

export default api;
    