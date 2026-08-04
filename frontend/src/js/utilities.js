export function getStatusClass(status) {
  const classMap = {
    'Functional': 'status-functional',
    'Need Replacement': 'status-need-replacement',
    'Not Functional': 'status-not-functional'
  };
  return classMap[status] || '';
}

export function showLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.remove('hidden');
}

export function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.add('hidden');
}

export function getUsername() {
  try {
    const storedUsername = localStorage.getItem('ams-username');
    if (storedUsername) return storedUsername;
  } catch (e) {}
  return 'User';
}

export function detectUsername() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    if (userParam) return decodeURIComponent(userParam);
  } catch (e) {}
  return 'User';
}
