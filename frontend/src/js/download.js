import { api } from './api.js';
import { getToken } from './api.js';

export function initDownload() {
  const downloadBtn = document.getElementById('download-btn');
  if (downloadBtn) downloadBtn.addEventListener('click', handleDownload);
}

async function handleDownload() {
  showLoading();
  try {
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');

    const params = {
      searchTerm: searchInput ? searchInput.value.trim() : '',
      status: statusFilter ? statusFilter.value : 'All'
    };

    const context = window.currentAssetContext || {};
    if (context.assetType) params.assetType = context.assetType;
    if (context.department) params.department = context.department;

    await downloadCsv(api.getDownloadUrl(params), `assets_export_${new Date().toISOString().slice(0, 10)}.csv`);
    showNotification('Download started successfully!', 'success');
  } catch (error) {
    console.error('Download error:', error);
    showNotification('Failed to download data. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

export async function downloadAllData() {
  await downloadCsv(api.getDownloadAllUrl(), `all_assets_${new Date().toISOString().slice(0, 10)}.csv`);
}

async function downloadCsv(url, filename) {
  const token = getToken();
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Session expired');
    throw new Error(`Download failed (${response.status})`);
  }
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

function showNotification(message, type = 'info') {
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) existingNotification.remove();

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed; top: 100px; right: 20px; bottom: auto; padding: 16px 24px;
    background: ${type === 'success' ? '#dcfce7' : type === 'error' ? '#fee2e2' : '#dbeafe'};
    color: ${type === 'success' ? '#166534' : type === 'error' ? '#991b1b' : '#1e40af'};
    border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 3000; animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function showLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.remove('hidden');
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.add('hidden');
}

window.showNotification = showNotification;
