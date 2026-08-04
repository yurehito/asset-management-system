import { initTheme } from './theme.js';
import { initNavigation, navigateTo, getCurrentContext } from './navigation.js';
import { initSearch, clearSearch } from './search.js';
import { initDownload, downloadAllData } from './download.js';
import { api } from './api.js';
import { showLoading, hideLoading, getUsername, detectUsername, getStatusClass } from './utilities.js';
import {
  initAuth, doLogin, doLogout, doChangePassword,
  getCurrentUser, isAdmin, mustChangePassword,
  showLoginPage, showLandingPage, applyRoleVisibility
} from './auth.js';

const COMPUTER_ASSET_TYPES = ['Desktop', 'Laptop'];
const PERIPHERAL_ASSET_TYPES = ['Scanner', 'Printer'];
const NETWORK_ASSET_TYPES = ['Router', 'Switch', 'Firewall', 'IoT Devices'];
const DEPARTMENT_ASSET_TYPES = [...COMPUTER_ASSET_TYPES, ...PERIPHERAL_ASSET_TYPES];
const ALL_DEPARTMENTS = [
  'Production',
  'Maintenance',
  'Commercial',
  'Admin/HR',
  'IT'
];

function profileOf(assetType) {
  if (COMPUTER_ASSET_TYPES.includes(assetType)) return 'computer';
  if (PERIPHERAL_ASSET_TYPES.includes(assetType)) return 'peripheral';
  if (NETWORK_ASSET_TYPES.includes(assetType)) return 'network';
  return 'computer';
}

window.currentAssetContext = null;

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initNavigation();
  initDownload();
  initUpdateAssetModal();
  initContactModal();
  initGlobalSearch();
  initAddAssetModal();
  initSubmitModal();
  initReissueModal();
  initRemoveAssetModal();
  initDownloadAllBtn();
  initLogin();
  initProfileMenu();
  initChangePasswordModal();
  initPasswordToggles();

  window.addEventListener('page:dashboard', handleDashboardPage);
  window.addEventListener('page:departments', handleDepartmentsPage);
  window.addEventListener('page:assets', handleAssetsPage);

  window.addEventListener('auth:unauthorized', () => {
    doLogout();
    showLoginPage();
  });
  window.addEventListener('auth:logout', () => {
    showLoginPage();
    updateProfileMenu(null);
  });

  initSearch(async ({ searchTerm, status }) => {
    const context = getCurrentContext();
    if (!context.assetType) return;
    if (NETWORK_ASSET_TYPES.includes(context.assetType)) {
      await loadAssetsData(context.assetType, null, searchTerm, status);
    } else if (context.assetType && context.department) {
      await loadAssetsData(context.assetType, context.department, searchTerm, status);
    }
  });

  showLoading();
  try {
    const user = await initAuth();
    if (user) {
      enterApp(user);
    } else {
      showLoginPage();
    }
  } catch (e) {
    showLoginPage();
  } finally {
    hideLoading();
  }
});

function enterApp(user) {
  updateUsernameDisplay(user.displayName || user.username);
  updateProfileMenu(user);
  applyRoleVisibility();
  if (mustChangePassword()) {
    openChangePasswordModal(true);
  } else {
    showLandingPage();
  }
}

function updateUsernameDisplay(username) {
  const el = document.getElementById('username-display');
  if (el) el.textContent = `Welcome, ${username}`;
}

function initPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      const showing = target.type === 'text';
      target.type = showing ? 'password' : 'text';
      btn.querySelector('.eye-icon').style.display = showing ? '' : 'none';
      btn.querySelector('.eye-off-icon').style.display = showing ? 'none' : '';
      btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    });
  });
}

function initLogin() {
  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('visible'); }
    showLoading();
    try {
      const response = await doLogin(username, password);
      if (response.success && response.data) {
        enterApp(response.data.user);
      } else {
        if (errorEl) { errorEl.textContent = response.message || 'Login failed'; errorEl.classList.add('visible'); }
      }
    } catch (error) {
      if (errorEl) { errorEl.textContent = error.message || 'Login failed'; errorEl.classList.add('visible'); }
    } finally {
      hideLoading();
    }
  });
}

function updateProfileMenu(user) {
  const menu = document.getElementById('profile-menu');
  if (!menu) return;
  if (!user) {
    menu.classList.add('hidden');
    return;
  }
  menu.classList.remove('hidden');
  const name = user.displayName || user.username || 'User';
  const nameEl = document.getElementById('profile-name');
  const roleEl = document.getElementById('profile-role');
  const avatarEl = document.getElementById('profile-avatar');
  const ddNameEl = document.getElementById('profile-dropdown-name');
  const ddMetaEl = document.getElementById('profile-dropdown-meta');
  if (nameEl) nameEl.textContent = name;
  if (roleEl) roleEl.textContent = user.role;
  if (avatarEl) avatarEl.textContent = (name.charAt(0) || 'U').toUpperCase();
  if (ddNameEl) ddNameEl.textContent = name;
  if (ddMetaEl) ddMetaEl.textContent = [user.username, user.employeeCode].filter(Boolean).join(' · ');
}

function initProfileMenu() {
  const btn = document.getElementById('profile-btn');
  const dropdown = document.getElementById('profile-dropdown');
  const changePwdBtn = document.getElementById('change-password-btn');
  const signOutBtn = document.getElementById('sign-out-btn');
  if (!btn || !dropdown) return;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = !dropdown.classList.contains('hidden');
    dropdown.classList.toggle('hidden', open);
    btn.setAttribute('aria-expanded', String(!open));
  });
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
      dropdown.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
  if (changePwdBtn) changePwdBtn.addEventListener('click', () => {
    dropdown.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
    openChangePasswordModal(false);
  });
  if (signOutBtn) signOutBtn.addEventListener('click', () => {
    dropdown.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
    doLogout();
  });
}

function initChangePasswordModal() {
  const modal = document.getElementById('change-password-modal');
  const closeBtn = document.getElementById('change-password-modal-close');
  const cancelBtn = document.getElementById('change-password-cancel-btn');
  const form = document.getElementById('change-password-form');
  if (!modal || !form) return;
  const closeModal = () => { modal.classList.add('hidden'); form.reset(); };
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('cp-current-password').value;
    const newPassword = document.getElementById('cp-new-password').value;
    const confirmPassword = document.getElementById('cp-confirm-password').value;
    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification('All fields are required', 'error'); return;
    }
    if (newPassword !== confirmPassword) {
      showNotification('New password and confirmation do not match', 'error'); return;
    }
    if (newPassword.length < 6) {
      showNotification('Password must be at least 6 characters', 'error'); return;
    }
    showLoading();
    try {
      const response = await doChangePassword(currentPassword, newPassword, confirmPassword);
      if (response.success) {
        showNotification(response.message, 'success');
        closeModal();
        if (mustChangePassword()) {
          showLandingPage();
        }
      } else {
        showNotification(response.message, 'error');
      }
    } catch (error) {
      showNotification(error.message || 'Failed to change password', 'error');
    } finally {
      hideLoading();
    }
  });
}

function openChangePasswordModal(forced) {
  const modal = document.getElementById('change-password-modal');
  const hint = document.getElementById('change-password-hint');
  const cancelBtn = document.getElementById('change-password-cancel-btn');
  if (!modal) return;
  if (hint) hint.textContent = forced
    ? 'Please change your default password before accessing the application.'
    : 'Update your account password.';
  if (cancelBtn) cancelBtn.style.display = forced ? 'none' : '';
  modal.classList.remove('hidden');
}

function initContactModal() {
  const contactBtn = document.getElementById('contact-btn');
  const modalClose = document.getElementById('modal-close');
  const modal = document.getElementById('contact-modal');
  if (contactBtn) contactBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  if (modalClose) modalClose.addEventListener('click', () => modal.classList.add('hidden'));
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
}

async function handleDashboardPage() {
  showLoading();
  try {
    const response = await api.getStats();
    if (response.success && response.data) {
      updateAssetCounts(response.data);
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showEmptyDashboard();
  } finally {
    hideLoading();
  }
}

function updateAssetCounts(stats) {
  const counts = { Desktop: 0, Scanner: 0, Printer: 0, Laptop: 0, Router: 0, Switch: 0, Firewall: 0, 'IoT Devices': 0 };
  if (stats.byType) stats.byType.forEach(item => { counts[item._id] = item.count; });
  document.getElementById('desktop-count').textContent = `${counts['Desktop'] || 0} Assets`;
  document.getElementById('scanner-count').textContent = `${counts['Scanner'] || 0} Assets`;
  document.getElementById('printer-count').textContent = `${counts['Printer'] || 0} Assets`;
  document.getElementById('laptop-count').textContent = `${counts['Laptop'] || 0} Assets`;
  document.getElementById('router-count').textContent = `${counts['Router'] || 0} Assets`;
  document.getElementById('switch-count').textContent = `${counts['Switch'] || 0} Assets`;
  document.getElementById('firewall-count').textContent = `${counts['Firewall'] || 0} Assets`;
  document.getElementById('iot-count').textContent = `${counts['IoT Devices'] || 0} Assets`;
}


function showEmptyDashboard() {
  [
    'desktop-count',
    'scanner-count',
    'printer-count',
    'laptop-count',
    'router-count',
    'switch-count',
    'firewall-count',
    'iot-count'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '0 Assets';
  });
}

async function handleDepartmentsPage(event) {
  const { assetType } = event.detail || getCurrentContext();
  if (!assetType) return;

  showLoading();
  try {
    const title = document.getElementById('department-title');
    if (title) title.textContent = `${assetType} - Departments`;

    const response = await api.getDepartmentsByAssetType(assetType);
    renderDepartments(response.success ? response.data : [], assetType);
  } catch (error) {
    console.error('Error loading departments:', error);
    renderDepartments([], assetType);
  } finally {
    hideLoading();
  }
}

function renderDepartments(departments, assetType) {
  const container = document.getElementById('department-cards');
  if (!container) return;

  const departmentCounts = {};

  (departments || []).forEach(item => {
    departmentCounts[item._id] = item.count;
  });

  container.innerHTML = ALL_DEPARTMENTS.map(dept => {
    const count = departmentCounts[dept] || 0;
    const hasAssets = count > 0;

    return `
      <div class="department-card ${hasAssets ? '' : 'disabled'}" data-department="${dept}">
        <h4>${dept}</h4>
        <p class="asset-count">${count} Assets</p>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.department-card:not(.disabled)').forEach(card => {
    card.addEventListener('click', () => {
      navigateTo('assets', {
        assetType,
        department: card.dataset.department
      });
    });
  });
}

async function handleAssetsPage(event) {
  const { assetType, department } = event.detail || getCurrentContext();
  if (!assetType) return;

  const profile = profileOf(assetType);
  const isNetwork = profile === 'network';
  window.currentAssetContext = { assetType, department: isNetwork ? null : department };
  clearSearch();

  updateAssetsTableHeader(profile);

  showLoading();
  try {
    const title = document.getElementById('assets-title');
    if (title) title.textContent = isNetwork ? `${assetType} Assets` : `${assetType} - ${department}`;

    const subtitle = document.getElementById('assets-subtitle');
    if (subtitle) subtitle.textContent = isNetwork
      ? `Viewing all ${assetType.toLowerCase()} assets`
      : `Viewing ${assetType.toLowerCase()} assets for ${department} department`;

    await loadAssetsData(assetType, isNetwork ? null : department);
  } catch (error) {
    console.error('Error loading assets:', error);
    renderAssetsTable([], false);
  } finally {
    hideLoading();
  }
}

function updateAssetsTableHeader(profile) {
  const thead = document.querySelector('#assets-table thead tr');
  if (!thead) return;

  const currentAssetType = window.currentAssetContext?.assetType;
  const isPrinter = currentAssetType === 'Printer';
  const isScanner = currentAssetType === 'Scanner';

  if (profile === 'network') {
    thead.innerHTML = `
      <th>Asset Code</th>
      <th>Serial Number</th>
      <th>Location</th>
      <th>Status</th>`;
  } else if (profile === 'peripheral') {
    if (isPrinter) {
      thead.innerHTML = `
        <th>Asset Code</th>
        <th>Serial Number</th>
        <th>IP Address</th>
        <th>Location</th>
        <th>Status</th>`;
    } else if (isScanner) {
      thead.innerHTML = `
        <th>Asset Code</th>
        <th>Serial Number</th>
        <th>Model</th>
        <th>Location</th>
        <th>Status</th>`;
    } else {
      thead.innerHTML = `
        <th>Asset Code</th>
        <th>Serial Number</th>
        <th>Location</th>
        <th>Status</th>`;
    }
  } else {
    thead.innerHTML = `
      <th>Username</th>
      <th>Employee Code</th>
      <th>Asset Code</th>
      <th>Hostname</th>
      <th>Storage</th>
      <th>RAM</th>
      <th>Processor</th>
      <th>Serial Number</th>
      <th>Location</th>
      <th>Status</th>`;
  }
}

async function loadAssetsData(assetType, department, searchTerm = '', status = 'All') {
  const profile = profileOf(assetType);
  const isNetwork = profile === 'network';
  try {
    let response;
    const hasFilter = searchTerm || (status && status !== 'All');
    if (hasFilter) {
      const params = { assetType, searchTerm, status: status !== 'All' ? status : undefined };
      if (!isNetwork && department) params.department = department;
      response = await api.searchAssets(params);
    } else if (isNetwork) {
      response = await api.getAssetsByType(assetType);
    } else {
      response = await api.getAssetsByTypeAndDepartment(assetType, department);
    }

    if (response.success) renderAssetsTable(response.data, profile);
    else renderAssetsTable([], profile);
  } catch (error) {
    console.error('Error loading assets data:', error);
    renderAssetsTable([], profile);
  }
}

function renderAssetsTable(assets, profile = 'computer') {
  const tbody = document.getElementById('assets-tbody');
  const countEl = document.getElementById('table-count');
  if (!tbody) return;

  const assetType = assets && assets.length > 0 ? assets[0].assetType : '';
  const isPrinter = assetType === 'Printer';
  const isScanner = assetType === 'Scanner';

  const colSpan = profile === 'network'
    ? 4
    : profile === 'peripheral'
      ? (isPrinter || isScanner ? 5 : 4)
      : 10;

  if (!assets || assets.length === 0) {
    const isNetwork = profile === 'network';
    const title = isNetwork ? 'No assets yet' : 'No assets found';
    const message = isNetwork
      ? `There are no ${window.currentAssetContext?.assetType || 'network'} assets registered yet. Add one to get started.`
      : 'No assets match this view. Try adjusting your search or filters.';
    tbody.innerHTML = emptyStateHtml(colSpan, title, message);
    if (countEl) countEl.textContent = 'Showing 0 assets';
    return;
  }

  const val = (v) => escapeHtml(v || '-');

  tbody.innerHTML = assets.map(asset => {
    const statusCell = `<td>${asset.status ? `<span class="status-badge ${getStatusClass(asset.status)}">${escapeHtml(asset.status)}</span>` : '-'}</td>`;

    if (profile === 'network') {
      return `<tr>
        <td>${val(asset.assetCode)}</td>
        <td>${val(asset.serialNumber)}</td>
        <td>${val(asset.location)}</td>
        ${statusCell}
      </tr>`;
    }

    if (profile === 'peripheral') {
      return `<tr>
        <td>${val(asset.assetCode)}</td>
        <td>${val(asset.serialNumber)}</td>
        ${isPrinter ? `<td>${val(asset.ipAddress)}</td>` : ''}
        ${isScanner ? `<td>${val(asset.model)}</td>` : ''}
        <td>${val(asset.location)}</td>
        ${statusCell}
      </tr>`;
    }

    return `<tr>
      <td>${val(asset.username)}</td>
      <td>${val(asset.employeeCode)}</td>
      <td>${val(asset.assetCode)}</td>
      <td>${val(asset.hostname)}</td>
      <td>${val(asset.storage)}</td>
      <td>${val(asset.ram)}</td>
      <td>${val(asset.processor)}</td>
      <td>${val(asset.serialNumber)}</td>
      <td>${val(asset.location)}</td>
      ${statusCell}
    </tr>`;
  }).join('');

  if (countEl) {
    countEl.textContent = `Showing ${assets.length} asset${assets.length !== 1 ? 's' : ''}`;
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function emptyStateHtml(colSpan, title = 'No assets found', message = 'No assets match this view. Try adjusting your search or filters.') {
  return `<tr><td colspan="${colSpan}" style="padding:0">
    <div class="empty-state">
      <div class="empty-state-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 7H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"></path>
          <path d="M16 21H8"></path>
          <path d="M12 17v4"></path>
          <path d="M7 13h.01M11 13h.01M15 13h.01"></path>
        </svg>
      </div>
      <h3 class="empty-state-title">${escapeHtml(title)}</h3>
      <p class="empty-state-text">${escapeHtml(message)}</p>
    </div>
  </td></tr>`;
}

function initGlobalSearch() {
  const searchInput = document.getElementById('global-search-input');
  const searchBtn = document.getElementById('global-search-btn');
  const clearBtn = document.getElementById('global-search-clear-btn');
  const resultsContainer = document.getElementById('global-search-results');
  const tbody = document.getElementById('global-search-tbody');

  const performSearch = async () => {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) { resultsContainer.classList.add('hidden'); return; }

    showLoading();
    try {
      const response = await api.globalSearch(searchTerm);
      if (response.success && response.data && response.data.length > 0) {
        tbody.innerHTML = response.data.map(asset => {
          const val = (v) => escapeHtml(v || '-');
          const statusCell = `<td>${asset.status ? `<span class="status-badge ${getStatusClass(asset.status)}">${escapeHtml(asset.status)}</span>` : '-'}</td>`;
          return `<tr>
            <td>${escapeHtml(asset.assetType)}</td>
            <td>${val(asset.username)}</td>
            <td>${val(asset.employeeCode)}</td>
            <td>${escapeHtml(asset.assetCode)}</td>
            <td>${escapeHtml(asset.serialNumber)}</td>
            <td>${val(asset.location)}</td>
            ${statusCell}
          </tr>`;
        }).join('');
        resultsContainer.classList.remove('hidden');
      } else {
        tbody.innerHTML = emptyStateHtml(7, 'No matching assets', 'No assets match your search. Try a different Username, Employee Code, Asset Code, or Serial Number.');
        resultsContainer.classList.remove('hidden');
      }
    } catch (error) {
      console.error('Global search error:', error);
      tbody.innerHTML = emptyStateHtml(7, 'Search error', 'Something went wrong while searching. Please try again.');
      resultsContainer.classList.remove('hidden');
    } finally {
      hideLoading();
    }
  };

  if (searchBtn) searchBtn.addEventListener('click', performSearch);
  if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    tbody.innerHTML = '';
    resultsContainer.classList.add('hidden');
    searchInput.focus();
  });
}
}

function initUpdateAssetModal() {
  const modal = document.getElementById('update-asset-modal');
  const closeBtn = document.getElementById('update-asset-modal-close');
  const cancelBtn = document.getElementById('update-cancel-btn');
  const updateBtn = document.getElementById('update-asset-btn');
  const stage1 = document.getElementById('update-stage-1');
  const stage2 = document.getElementById('update-stage-2');
  const stage1Form = document.getElementById('update-stage1-form');
  const stage2Form = document.getElementById('update-stage2-form');
  const stage2BackBtn = document.getElementById('update-stage2-back-btn');
  let retrievedAsset = null;

  if (updateBtn) updateBtn.addEventListener('click', () => { resetUpdateModal(); modal.classList.remove('hidden'); });

  function resetUpdateModal() {
    retrievedAsset = null;
    if (stage1Form) stage1Form.reset();
    if (stage2Form) stage2Form.reset();
    showUpdateStage(1);
  }

  function showUpdateStage(stage) {
    stage1.classList.toggle('hidden', stage !== 1);
    stage2.classList.toggle('hidden', stage !== 2);
  }

  const closeModal = () => { modal.classList.add('hidden'); resetUpdateModal(); };
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  if (stage1Form) {
    stage1Form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const identifier = document.getElementById('update-serial-number').value.trim();
      if (!identifier) return;
      showLoading();
      try {
        const response = await api.getAssetByIdentifier(identifier);
        if (response.success && response.data) {
          retrievedAsset = response.data;
          populateUpdateForm(retrievedAsset);
          showUpdateStage(2);
        } else {
          showNotification(response.message || 'Asset not found', 'error');
        }
      } catch (error) {
        showNotification('Failed to fetch asset information. Please try again.', 'error');
      } finally {
        hideLoading();
      }
    });
  }

  if (stage2BackBtn) stage2BackBtn.addEventListener('click', () => showUpdateStage(1));

  if (stage2Form) {
    stage2Form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!retrievedAsset) { showNotification('No asset selected. Please start over.', 'error'); return; }
      const formData = new FormData(stage2Form);
      const data = Object.fromEntries(formData.entries());
      showLoading();
      try {
        const response = await api.updateAsset(retrievedAsset._id, data);
        if (response.success) {
          showNotification(response.message, 'success');
          closeModal();
          await handleDashboardPage();
          if (window.currentAssetContext) {
            const { assetType, department } = window.currentAssetContext;
            await loadAssetsData(assetType, department);
          }
        } else {
          showNotification(response.message, 'error');
        }
      } catch (error) {
        showNotification(error.message || 'Failed to update asset. Please try again.', 'error');
      } finally {
        hideLoading();
      }
    });
  }
}

function populateUpdateForm(asset) {
  const profile = profileOf(asset.assetType);
  const isComputer = profile === 'computer';
  const isPeripheral = profile === 'peripheral';
  const isNetwork = profile === 'network';
  const isPrinter = asset.assetType === 'Printer';
  const isScanner = asset.assetType === 'Scanner';

  const display = document.getElementById('update-asset-type-display');
  if (display) display.value = asset.assetType || '';

  const setVal = (id, value) => { const el = document.getElementById(id); if (el) el.value = value || ''; };
  setVal('update-username', asset.username);
  setVal('update-employee-code', asset.employeeCode);
  setVal('update-asset-code', asset.assetCode);
  setVal('update-hostname', asset.hostname);
  setVal('update-storage', asset.storage);
  setVal('update-ram', asset.ram);
  setVal('update-processor', asset.processor);
  setVal('update-serial-number-edit', asset.serialNumber);
  setVal('update-model', asset.model);
  setVal('update-ip-address', asset.ipAddress);
  setVal('update-location', asset.location);
  setVal('update-status', asset.status || 'Functional');

  const show = (id, show) => { const el = document.getElementById(id); if (el) el.style.display = show ? '' : 'none'; };

  show('update-username-group', isComputer || isNetwork);
  show('update-employee-code-group', isComputer);
  show('update-hostname-group', isComputer || isNetwork);
  show('update-storage-group', isComputer);
  show('update-ram-group', isComputer);
  show('update-processor-group', isComputer);
  show('update-model-group', isScanner);
  show('update-ip-address-group', isPrinter || isNetwork);
  show('update-location-group', isComputer || isPeripheral || isNetwork);
  show('update-status-group', isComputer || isPeripheral || isNetwork);
  show('update-asset-code-group', isComputer || isPeripheral || isNetwork);
  show('update-serial-number-edit-group', isComputer || isPeripheral || isNetwork);
}

function initDownloadAllBtn() {
  const btn = document.getElementById('download-all-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    showLoading();
    try {
      await downloadAllData();
      window.showNotification('Download started successfully!', 'success');
    } catch (error) {
      console.error('Download all error:', error);
      window.showNotification(error.message || 'Failed to download data.', 'error');
    } finally {
      hideLoading();
    }
  });
}

function initAddAssetModal() {
  const modal = document.getElementById('add-asset-modal');
  const closeBtn = document.getElementById('add-asset-modal-close');
  const cancelBtn = document.getElementById('add-asset-cancel-btn');
  const form = document.getElementById('add-asset-form');
  const addBtn = document.getElementById('add-asset-btn');
  const assetTypeSelect = document.getElementById('add-asset-type');

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      form.reset();
      toggleAddAssetFields('Desktop');
      modal.classList.remove('hidden');
    });
  }

  if (assetTypeSelect) {
    assetTypeSelect.addEventListener('change', (e) => toggleAddAssetFields(e.target.value));
  }

  const closeModal = () => { modal.classList.add('hidden'); form.reset(); toggleAddAssetFields('Desktop'); };
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      showLoading();
      try {
        const response = await api.createAsset(data);
        if (response.success) {
          showNotification(response.message, 'success');
          closeModal();
          await handleDashboardPage();
          if (window.currentAssetContext) {
            const { assetType, department } = window.currentAssetContext;
            await loadAssetsData(assetType, department);
          }
        } else {
          showNotification(response.message, 'error');
        }
      } catch (error) {
        console.error('Add asset error:', error);
        showNotification('Failed to add asset. Please try again.', 'error');
      } finally {
        hideLoading();
      }
    });
  }
}

function toggleAddAssetFields(assetType) {
  const profile = profileOf(assetType);
  const isComputer = profile === 'computer';
  const isPeripheral = profile === 'peripheral';
  const isNetwork = profile === 'network';
  const hasType = isComputer || isPeripheral || isNetwork;

  const computerFieldIds = [
    'add-username-group',
    'add-employee-code-group',
    'add-hostname-group',
    'add-storage-group',
    'add-ram-group',
    'add-processor-group',
    'add-status-group'
  ];

  computerFieldIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = isComputer ? '' : 'none';
  });

  const statusGroup = document.getElementById('add-status-group');
  if (statusGroup) statusGroup.style.display = hasType ? '' : 'none';

  const deptGroup = document.getElementById('add-asset-department-group');
  if (deptGroup) deptGroup.style.display = isComputer ? '' : 'none';

  const locationGroup = document.getElementById('add-location-group');
  if (locationGroup) locationGroup.style.display = hasType ? '' : 'none';

  const ipAddressGroup = document.getElementById('add-ip-address-group');
  if (ipAddressGroup) {
    ipAddressGroup.style.display = assetType === 'Printer' ? '' : 'none';
  }

  const modelGroup = document.getElementById('add-model-group');
  if (modelGroup) {
    modelGroup.style.display = assetType === 'Scanner' ? '' : 'none';
  }
}

function initSubmitModal() {
  const modal = document.getElementById('issue-modal');
  const closeBtn = document.getElementById('issue-modal-close');
  const cancelBtn = document.getElementById('issue-cancel-btn');
  const submitBtn = document.getElementById('issue-asset-btn');
  const stage1 = document.getElementById('issue-stage-1');
  const stage2 = document.getElementById('issue-stage-2');
  const stage3 = document.getElementById('issue-stage-3');
  const stage1Form = document.getElementById('issue-stage1-form');
  const stage3Form = document.getElementById('issue-stage3-form');
  const stage2BackBtn = document.getElementById('issue-stage2-back-btn');
  const stage2NextBtn = document.getElementById('issue-stage2-next-btn');
  const stage3BackBtn = document.getElementById('issue-stage3-back-btn');
  let retrievedAsset = null;

  if (submitBtn) submitBtn.addEventListener('click', () => { resetSubmitModal(); modal.classList.remove('hidden'); });

  function resetSubmitModal() {
    retrievedAsset = null;
    if (stage1Form) stage1Form.reset();
    if (stage3Form) stage3Form.reset();
    showStage(1);
  }

  function showStage(stage) {
    stage1.classList.toggle('hidden', stage !== 1);
    stage2.classList.toggle('hidden', stage !== 2);
    stage3.classList.toggle('hidden', stage !== 3);
  }

  const closeModal = () => { modal.classList.add('hidden'); resetSubmitModal(); };
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  if (stage1Form) {
    stage1Form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const identifier = document.getElementById('issue-serial-number').value.trim();
      if (!identifier) return;
      showLoading();
      try {
        const response = await api.getAssetByIdentifier(identifier);
        if (response.success && response.data) {
          retrievedAsset = response.data;
          renderAssetInfo(retrievedAsset);
          showStage(2);
        } else {
          showNotification(response.message || 'Asset not found', 'error');
        }
      } catch (error) {
        showNotification('Failed to fetch asset information. Please try again.', 'error');
      } finally {
        hideLoading();
      }
    });
  }

  if (stage2BackBtn) stage2BackBtn.addEventListener('click', () => showStage(1));
  if (stage2NextBtn) stage2NextBtn.addEventListener('click', () => showStage(3));
  if (stage3BackBtn) stage3BackBtn.addEventListener('click', () => showStage(2));

  if (stage3Form) {
    stage3Form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!retrievedAsset) { showNotification('No asset selected. Please start over.', 'error'); return; }
      const issueDescription = document.getElementById('issue-description').value.trim();
      if (!issueDescription) return;
      showLoading();
      try {
        const response = await api.submitAsset({ assetCode: retrievedAsset.assetCode, issueDescription, date: new Date().toISOString() });
        if (response.success) {
          showNotification(response.message, 'success');
          closeModal();
          await handleDashboardPage();
          if (window.currentAssetContext) {
            const { assetType, department } = window.currentAssetContext;
            await loadAssetsData(assetType, department);
          }
        } else {
          showNotification(response.message, 'error');
        }
      } catch (error) {
        showNotification('Failed to submit asset. Please try again.', 'error');
      } finally {
        hideLoading();
      }
    });
  }
}

function renderAssetInfo(asset) {
  const container = document.getElementById('asset-info-display');
  if (!container) return;
  const val = (v) => v || '-';
  const profile = profileOf(asset.assetType);
  const isNetwork = profile === 'network';
  const isPeripheral = profile === 'peripheral';
  const rows = [
    { label: 'Asset Type', value: asset.assetType },
    ...(asset.assetType !== 'Printer' && !isNetwork ? [{ label: 'Department', value: val(asset.department) }] : []),
    ...(profile === 'computer' ? [{ label: 'Username', value: val(asset.username) }] : []),
    ...(profile === 'computer' ? [{ label: 'Employee Code', value: val(asset.employeeCode) }] : []),
    { label: 'Asset Code', value: asset.assetCode },
    ...(profile === 'computer' ? [{ label: 'Hostname', value: val(asset.hostname) }] : []),
    ...(profile === 'computer' ? [{ label: 'Storage', value: val(asset.storage) }] : []),
    ...(profile === 'computer' ? [{ label: 'RAM', value: val(asset.ram) }] : []),
    ...(profile === 'computer' ? [{ label: 'Processor', value: val(asset.processor) }] : []),
    { label: 'Serial Number', value: asset.serialNumber },
    ...(asset.assetType === 'Scanner' ? [{ label: 'Model', value: val(asset.model) }] : []),
    ...(asset.assetType === 'Printer' ? [{ label: 'IP Address', value: val(asset.ipAddress) }] : []),
    { label: 'Location', value: val(asset.location) },
    { label: 'Current Status', value: asset.status || '-' }
  ];
  container.innerHTML = rows.map(row => `
    <div class="asset-info-row">
      <span class="asset-info-label">${escapeHtml(row.label)}</span>
      <span class="asset-info-value">${escapeHtml(row.value)}</span>
    </div>`).join('');
}

function initReissueModal() {
  const modal = document.getElementById('reissue-modal');
  const closeBtn = document.getElementById('reissue-modal-close');
  const cancelBtn = document.getElementById('reissue-cancel-btn');
  const form = document.getElementById('reissue-form');
  const reissueBtn = document.getElementById('reissue-asset-btn');

  if (reissueBtn) reissueBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  const closeModal = () => { modal.classList.add('hidden'); form.reset(); };
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = { assetCode: formData.get('assetCode'), serialNumber: formData.get('serialNumber'), repairRemark: formData.get('repairRemark') };
      showLoading();
      try {
        const response = await api.reissueAsset(data);
        if (response.success) {
          showNotification(response.message, 'success');
          closeModal();
          await handleDashboardPage();
          if (window.currentAssetContext) {
            const { assetType, department } = window.currentAssetContext;
            await loadAssetsData(assetType, department);
          }
        } else {
          showNotification(response.message, 'error');
        }
      } catch (error) {
        showNotification('Failed to reissue asset. Please try again.', 'error');
      } finally {
        hideLoading();
      }
    });
  }
}

function initRemoveAssetModal() {
  const modal = document.getElementById('remove-asset-modal');
  const closeBtn = document.getElementById('remove-asset-modal-close');
  const cancelBtn = document.getElementById('remove-cancel-btn');
  const removeBtn = document.getElementById('remove-asset-btn');
  const stage1 = document.getElementById('remove-stage-1');
  const stage2 = document.getElementById('remove-stage-2');
  const stage3 = document.getElementById('remove-stage-3');
  const stage1Form = document.getElementById('remove-stage1-form');
  const stage2BackBtn = document.getElementById('remove-stage2-back-btn');
  const stage2DeleteBtn = document.getElementById('remove-stage2-delete-btn');
  const confirmCancelBtn = document.getElementById('remove-confirm-cancel-btn');
  const confirmDeleteBtn = document.getElementById('remove-confirm-delete-btn');
  let retrievedAsset = null;

  if (removeBtn) removeBtn.addEventListener('click', () => { resetRemoveModal(); modal.classList.remove('hidden'); });

  function resetRemoveModal() {
    retrievedAsset = null;
    if (stage1Form) stage1Form.reset();
    showRemoveStage(1);
  }

  function showRemoveStage(stage) {
    stage1.classList.toggle('hidden', stage !== 1);
    stage2.classList.toggle('hidden', stage !== 2);
    stage3.classList.toggle('hidden', stage !== 3);
  }

  const closeModal = () => { modal.classList.add('hidden'); resetRemoveModal(); };
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  if (stage1Form) {
    stage1Form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const identifier = document.getElementById('remove-asset-code').value.trim();
      if (!identifier) return;
      showLoading();
      try {
        const response = await api.getAssetByIdentifier(identifier);
        if (response.success && response.data) {
          retrievedAsset = response.data;
          renderRemoveAssetInfo(retrievedAsset);
          showRemoveStage(2);
        } else {
          showNotification(response.message || 'Asset not found', 'error');
        }
      } catch (error) {
        showNotification('Failed to fetch asset information. Please try again.', 'error');
      } finally {
        hideLoading();
      }
    });
  }

  if (stage2BackBtn) stage2BackBtn.addEventListener('click', () => showRemoveStage(1));
  if (stage2DeleteBtn) stage2DeleteBtn.addEventListener('click', () => showRemoveStage(3));
  if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', () => showRemoveStage(2));

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      if (!retrievedAsset) { showNotification('No asset selected. Please start over.', 'error'); return; }
      showLoading();
      try {
        const response = await api.deleteAsset(retrievedAsset.assetCode);
        if (response.success) {
          showNotification(response.message, 'success');
          closeModal();
          await handleDashboardPage();
          if (window.currentAssetContext) {
            const { assetType, department } = window.currentAssetContext;
            await loadAssetsData(assetType, department);
          }
        } else {
          showNotification(response.message, 'error');
          showRemoveStage(2);
        }
      } catch (error) {
        showNotification('Failed to remove asset. Please try again.', 'error');
        showRemoveStage(2);
      } finally {
        hideLoading();
      }
    });
  }
}

function renderRemoveAssetInfo(asset) {
  const container = document.getElementById('remove-asset-info-display');
  if (!container) return;
  const val = (v) => v || '-';
  const profile = profileOf(asset.assetType);
  const isNetwork = profile === 'network';
  const rows = [
    { label: 'Asset Type', value: asset.assetType },
    ...(!isNetwork ? [{ label: 'Department', value: val(asset.department) }] : []),
    ...(profile === 'computer' ? [{ label: 'Username', value: val(asset.username) }] : []),
    ...(profile === 'computer' ? [{ label: 'Employee Code', value: val(asset.employeeCode) }] : []),
    { label: 'Asset Code', value: asset.assetCode },
    ...(profile === 'computer' ? [{ label: 'Hostname', value: val(asset.hostname) }] : []),
    ...(profile === 'computer' ? [{ label: 'Storage', value: val(asset.storage) }] : []),
    ...(profile === 'computer' ? [{ label: 'RAM', value: val(asset.ram) }] : []),
    ...(profile === 'computer' ? [{ label: 'Processor', value: val(asset.processor) }] : []),
    { label: 'Serial Number', value: asset.serialNumber },
    { label: 'Location', value: val(asset.location) },
    { label: 'Status', value: asset.status || '-' }
  ];
  container.innerHTML = rows.map(row => `
    <div class="asset-info-row">
      <span class="asset-info-label">${escapeHtml(row.label)}</span>
      <span class="asset-info-value">${escapeHtml(row.value)}</span>
    </div>`).join('');
}

function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  const messageEl = document.getElementById('notification-message');
  if (!notification || !messageEl) return;
  notification.className = `notification ${type}`;
  messageEl.textContent = message;
  notification.classList.remove('hidden');
  setTimeout(() => notification.classList.add('hidden'), 4000);
}
