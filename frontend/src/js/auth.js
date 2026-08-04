import { api, getToken, setToken, getStoredUser, setStoredUser, clearAuth } from './api.js';
import { showLoading, hideLoading } from './utilities.js';

const AUTH_USER_KEY = 'ams-auth-user';

let currentUser = null;

export function getCurrentUser() { return currentUser; }

export function isLoggedIn() { return !!getToken() && !!currentUser; }
export function isAdmin() { return currentUser?.role === 'admin'; }

export async function initAuth() {
  const token = getToken();
  const stored = getStoredUser();
  if (token && stored) {
    try {
      const response = await api.getMe();
      if (response.success) {
        currentUser = response.data;
        setStoredUser(currentUser);
        return currentUser;
      }
    } catch (e) {
      clearAuth();
    }
  }
  clearAuth();
  return null;
}

export async function doLogin(username, password) {
  const response = await api.login(username, password);
  if (response.success && response.data) {
    setToken(response.data.token);
    currentUser = response.data.user;
    setStoredUser(currentUser);
  }
  return response;
}

export async function doChangePassword(currentPassword, newPassword, confirmPassword) {
  const response = await api.changePassword(currentPassword, newPassword, confirmPassword);
  if (response.success && currentUser) {
    currentUser = { ...currentUser, forcePasswordChange: false };
    setStoredUser(currentUser);
  }
  return response;
}

export function doLogout() {
  clearAuth();
  currentUser = null;
  window.dispatchEvent(new CustomEvent('auth:logout'));
}

export function mustChangePassword() {
  return !!currentUser?.forcePasswordChange;
}

export async function requireAuthOrRedirect() {
  const user = await initAuth();
  if (!user) {
    showLoginPage();
    return false;
  }
  return true;
}

export function showLoginPage() {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  const loginPage = document.getElementById('login-page');
  if (loginPage) loginPage.classList.remove('hidden');
  window.scrollTo(0, 0);
}

export function showLandingPage() {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  const landing = document.getElementById('landing-page');
  if (landing) landing.classList.remove('hidden');
  window.scrollTo(0, 0);
}

export function applyRoleVisibility() {
  const admin = isAdmin();
  document.querySelectorAll('.admin-only').forEach(el => {
    el.classList.toggle('hidden', !admin);
  });
}
