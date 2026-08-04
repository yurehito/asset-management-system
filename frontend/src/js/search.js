let searchTimeout = null;
const SEARCH_DELAY = 300;

export function initSearch(onSearch) {
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const searchTerm = e.target.value.trim();
        const status = statusFilter ? statusFilter.value : 'All';
        onSearch({ searchTerm, status });
      }, SEARCH_DELAY);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        clearTimeout(searchTimeout);
        const searchTerm = searchInput.value.trim();
        const status = statusFilter ? statusFilter.value : 'All';
        onSearch({ searchTerm, status });
      }
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      const searchTerm = searchInput ? searchInput.value.trim() : '';
      const status = statusFilter.value;
      onSearch({ searchTerm, status });
    });
  }
}

export function clearSearch() {
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');
  if (searchInput) searchInput.value = '';
  if (statusFilter) statusFilter.value = 'All';
}

export function getSearchValues() {
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');
  return { searchTerm: searchInput ? searchInput.value.trim() : '', status: statusFilter ? statusFilter.value : 'All' };
}
