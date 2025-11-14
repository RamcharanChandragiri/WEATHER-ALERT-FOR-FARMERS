// ===================================
// Configuration - API endpoints & constants
// ===================================

// API Base URL - Change this to your backend server URL
const API_BASE_URL = 'http://localhost:5000/api';

// API Endpoints
const API_ENDPOINTS = {
    auth: {
        register: `${API_BASE_URL}/auth/register`,
        login: `${API_BASE_URL}/auth/login`
    },
    weather: {
        getWeather: (location) => `${API_BASE_URL}/weather/${location}`,
        getWeeklySummary: (location) => `${API_BASE_URL}/weather/weekly/${location}`
    },
    advisories: {
        getAll: `${API_BASE_URL}/advisories`,
        getByCondition: (condition) => `${API_BASE_URL}/advisories/${condition}`
    },
    alerts: {
        getAll: `${API_BASE_URL}/alerts`,
        create: `${API_BASE_URL}/alerts`,
        getByLocation: (location) => `${API_BASE_URL}/alerts/${location}`,
        delete: (id) => `${API_BASE_URL}/alerts/${id}`
    }
};

// Utility function to get JWT token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Utility function to set JWT token in localStorage
function setToken(token) {
    localStorage.setItem('token', token);
}

// Utility function to clear JWT token from localStorage
function clearToken() {
    localStorage.removeItem('token');
}

// Utility function to get user info from localStorage
function getUserInfo() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Utility function to set user info in localStorage
function setUserInfo(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

// Utility function to clear user info
function clearUserInfo() {
    localStorage.removeItem('user');
}

// Utility function to make API calls with authentication
async function apiCall(url, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'API Error');
        }

        return result;
    } catch (error) {
        throw error;
    }
}
