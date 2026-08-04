let currentPage = 'landing';
let currentAssetType = null;
let currentDepartment = null;

const NETWORK_ASSET_TYPES = ['Router', 'Switch', 'Firewall', 'IoT Devices'];

export function initNavigation() {
  const enterBtn = document.getElementById('enter-btn');
  const backToDashboard = document.getElementById('back-to-dashboard');
  const backToDepartments = document.getElementById('back-to-departments');

  if (enterBtn) enterBtn.addEventListener('click', () => navigateTo('dashboard'));
  if (backToDashboard) backToDashboard.addEventListener('click', () => navigateTo('dashboard'));
  if (backToDepartments) backToDepartments.addEventListener('click', () => {
    if (currentAssetType && NETWORK_ASSET_TYPES.includes(currentAssetType)) {
      navigateTo('dashboard');
    } else {
      navigateTo('departments', { assetType: currentAssetType });
    }
  });

  document.querySelectorAll('.asset-card').forEach(card => {
    card.addEventListener('click', () => {
      const assetType = card.dataset.assetType;
      if (NETWORK_ASSET_TYPES.includes(assetType)) {
        navigateTo('assets', { assetType, department: null });
      } else {
        navigateTo('departments', { assetType });
      }
    });
  });

  window.addEventListener('popstate', handlePopState);
}

export function navigateTo(page, params = {}) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.classList.add('hidden'));

  switch (page) {
    case 'landing':
      document.getElementById('landing-page').classList.remove('hidden');
      break;
    case 'dashboard':
      document.getElementById('dashboard-page').classList.remove('hidden');
      window.dispatchEvent(new CustomEvent('page:dashboard'));
      break;
    case 'departments':
      currentAssetType = params.assetType;
      document.getElementById('departments-page').classList.remove('hidden');
      window.dispatchEvent(new CustomEvent('page:departments', { detail: params }));
      break;
    case 'assets':
      currentAssetType = params.assetType;
      currentDepartment = params.department || null;
      document.getElementById('assets-page').classList.remove('hidden');
      window.dispatchEvent(new CustomEvent('page:assets', { detail: params }));
      break;
  }

  currentPage = page;
  window.scrollTo(0, 0);
}

function handlePopState(event) {
  if (event.state && event.state.page) navigateTo(event.state.page, event.state.params || {});
}

export function getCurrentPage() { return currentPage; }
export function getCurrentContext() { return { assetType: currentAssetType, department: currentDepartment }; }
