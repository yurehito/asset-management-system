const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'ams-auth-token';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (e) {}
}

export function clearAuth() {
  setToken('');
  try { localStorage.removeItem('ams-auth-user'); } catch (e) {}
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('ams-auth-user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

export function setStoredUser(user) {
  try {
    if (user) localStorage.setItem('ams-auth-user', JSON.stringify(user));
    else localStorage.removeItem('ams-auth-user');
  } catch (e) {}
}

async function fetchAPI(endpoint, options = {}) {
  try {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
    if (response.status === 401) {
      clearAuth();
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      throw new Error('Session expired');
    }
    if (response.status === 403) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'You do not have permission to perform this action');
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export const api = {
  async login(username, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Login failed');
    return data;
  },
  async getMe() { return fetchAPI('/auth/me'); },
  async changePassword(currentPassword, newPassword, confirmPassword) {
    return fetchAPI('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
    });
  },
  async getAllAssets() { return fetchAPI('/assets'); },
  async createAsset(data) {
    return fetchAPI('/assets', { method: 'POST', body: JSON.stringify(data) });
  },
  async getAssetByCode(assetCode) {
    return fetchAPI(`/assets/code/${encodeURIComponent(assetCode)}`);
  },
  async getAssetBySerialNumber(serialNumber) {
    return fetchAPI(`/assets/serial/${encodeURIComponent(serialNumber)}`);
  },
  async getAssetByIdentifier(identifier) {
    return fetchAPI(`/assets/identifier/${encodeURIComponent(identifier)}`);
  },
  async updateAsset(id, data) {
    return fetchAPI(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteAsset(assetCode) {
    return fetchAPI(`/assets/code/${encodeURIComponent(assetCode)}`, { method: 'DELETE' });
  },
  async getAssetsByType(assetType) { return fetchAPI(`/assets/type/${encodeURIComponent(assetType)}`); },
  async getAssetsByDepartment(department) { return fetchAPI(`/assets/department/${encodeURIComponent(department)}`); },
  async getAssetsByTypeAndDepartment(assetType, department) {
    return fetchAPI(`/assets/type/${encodeURIComponent(assetType)}/department/${encodeURIComponent(department)}`);
  },
  async searchAssets(params = {}) {
    const queryParts = [];
    if (params.searchTerm) queryParts.push(`q=${encodeURIComponent(params.searchTerm)}`);
    if (params.assetType) queryParts.push(`assetType=${encodeURIComponent(params.assetType)}`);
    if (params.department) queryParts.push(`department=${encodeURIComponent(params.department)}`);
    if (params.status && params.status !== 'All') queryParts.push(`status=${encodeURIComponent(params.status)}`);
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return fetchAPI(`/assets/search${queryString}`);
  },
  async getDepartmentsByAssetType(assetType) { return fetchAPI(`/departments/${encodeURIComponent(assetType)}`); },
  async getStats() { return fetchAPI('/assets/stats'); },
  async globalSearch(searchTerm) {
    if (!searchTerm) return { success: true, data: [], count: 0 };
    return fetchAPI(`/assets/global-search?q=${encodeURIComponent(searchTerm)}`);
  },
  async submitAsset(data) {
    return fetchAPI('/submits', { method: 'POST', body: JSON.stringify(data) });
  },
  async reissueAsset(data) {
    return fetchAPI('/submits/reissue', { method: 'POST', body: JSON.stringify(data) });
  },
  getDownloadUrl(params = {}) {
    const queryParts = [];
    if (params.searchTerm) queryParts.push(`q=${encodeURIComponent(params.searchTerm)}`);
    if (params.assetType) queryParts.push(`assetType=${encodeURIComponent(params.assetType)}`);
    if (params.department) queryParts.push(`department=${encodeURIComponent(params.department)}`);
    if (params.status && params.status !== 'All') queryParts.push(`status=${encodeURIComponent(params.status)}`);
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return `${API_BASE_URL}/assets/download/csv${queryString}`;
  },
  getDownloadAllUrl() {
    return `${API_BASE_URL}/assets/download/all`;
  },
  getAuthToken() { return getToken(); }
};
