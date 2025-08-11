class InventoryManager {
  constructor() {
    this.inventory = [];
    this.currentPage = 1;
    this.totalPages = 1;
    this.currentItem = null;
    this.isEditing = false;
    this.suppliers = [];

    this.init();
  }

  init() {
    this.bindEvents();
    this.loadSuppliers();
    this.loadInventory();
  }

  bindEvents() {
    // Add inventory button
    const addBtn = document.getElementById('addInventoryBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.showAddForm());
    }

    // Form submission
    const inventoryForm = document.getElementById('inventoryForm');
    if (inventoryForm) {
      inventoryForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    // Search functionality
    const searchInput = document.getElementById('inventorySearch');
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(() => this.handleSearch(), 300));
    }

    // Filter functionality
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => this.handleFilter());
    }

    const stockStatusFilter = document.getElementById('stockStatusFilter');
    if (stockStatusFilter) {
      stockStatusFilter.addEventListener('change', () => this.handleFilter());
    }

    // Back to list button
    const backToListBtn = document.getElementById('backToInventoryListBtn');
    if (backToListBtn) {
      backToListBtn.addEventListener('click', () => this.hideForm());
    }

    // Cancel edit button
    const cancelEditBtn = document.getElementById('cancelInventoryEditBtn');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => this.cancelEdit());
    }

    // Cancel inventory button
    const cancelInventoryBtn = document.getElementById('cancelInventoryBtn');
    if (cancelInventoryBtn) {
      cancelInventoryBtn.addEventListener('click', () => this.hideForm());
    }

    // Stock update form
    const stockUpdateForm = document.getElementById('stockUpdateForm');
    if (stockUpdateForm) {
      stockUpdateForm.addEventListener('submit', (e) => this.handleStockUpdate(e));
    }

    // Event delegation for dynamically created elements
    this.bindDelegatedEvents();
  }

  bindDelegatedEvents() {
    // Handle edit and delete buttons using event delegation
    document.addEventListener('click', (e) => {
      if (e.target.closest('.edit-inventory-btn')) {
        const button = e.target.closest('.edit-inventory-btn');
        const itemId = button.getAttribute('data-item-id');
        this.editInventory(itemId);
      }

      if (e.target.closest('.delete-inventory-btn')) {
        const button = e.target.closest('.delete-inventory-btn');
        const itemId = button.getAttribute('data-item-id');
        this.deleteInventory(itemId);
      }

      if (e.target.closest('.pagination-link')) {
        e.preventDefault();
        const link = e.target.closest('.pagination-link');
        const page = parseInt(link.getAttribute('data-page'));
        this.loadInventory(page);
      }

      if (e.target.closest('.stock-update-btn')) {
        const button = e.target.closest('.stock-update-btn');
        const itemId = button.getAttribute('data-item-id');
        this.showStockUpdateForm(itemId);
      }
    });
  }

  async loadSuppliers() {
    try {
      const response = await window.api.get('/api/suppliers?limit=1000');
      this.suppliers = response.suppliers || [];
      this.populateSupplierOptions();
    } catch (error) {
      console.error('Error loading suppliers:', error);
      // Continue without suppliers - the form will still work
      this.suppliers = [];
      this.populateSupplierOptions();
    }
  }

  populateSupplierOptions() {
    const supplierSelect = document.getElementById('supplier');
    if (!supplierSelect) return;

    supplierSelect.innerHTML = '<option value="">Select Supplier</option>';
    this.suppliers.forEach(supplier => {
      const option = document.createElement('option');
      option.value = supplier._id;
      option.textContent = `${supplier.name} (${supplier.businessType})`;
      supplierSelect.appendChild(option);
    });
  }

  async loadInventory(page = 1, search = '', category = '', stockStatus = '') {
    try {
      this.showLoading();

      const params = new URLSearchParams({
        page: page,
        limit: 10,
        ...(search && { search }),
        ...(category && { category }),
        ...(stockStatus && { stockStatus })
      });

      const response = await window.api.get(`/api/inventory?${params}`);

      this.inventory = response.inventory;
      this.currentPage = response.pagination.page;
      this.totalPages = response.pagination.pages;

      this.renderInventory();
      this.renderPagination();
      this.updateStats(response.pagination.total);

    } catch (error) {
      this.showError('Failed to load inventory: ' + error.message);
    } finally {
      this.hideLoading();
    }
  }

  renderInventory() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    if (this.inventory.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" class="text-center py-4">
            <i class="fas fa-inbox fa-2x text-muted mb-2"></i>
            <p class="text-muted">No inventory items found</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.inventory.map(item => `
      <tr data-item-id="${item._id}">
        <td>
          <div class="d-flex align-items-center">
            <div class="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2">
              ${item.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="fw-bold">${item.name}</div>
              <small class="text-muted">${item.sku}</small>
            </div>
          </div>
        </td>
        <td>
          <span class="badge bg-secondary">${item.category}</span>
          ${item.subcategory ? `<br><small class="text-muted">${item.subcategory}</small>` : ''}
        </td>
        <td>
          <div class="d-flex align-items-center">
            <span class="fw-bold me-2">${item.currentStock}</span>
            <small class="text-muted">${item.unit}</small>
          </div>
          ${item.minimumStock > 0 ? `<br><small class="text-muted">Min: ${item.minimumStock}</small>` : ''}
        </td>
        <td>
          <span class="badge bg-${this.getStockStatusColor(item.stockStatus)}">
            ${this.getStockStatusText(item.stockStatus)}
          </span>
        </td>
        <td>
          <div class="text-end">
            <div class="fw-bold">$${item.costPrice?.toFixed(2) || '0.00'}</div>
            <small class="text-muted">Cost</small>
          </div>
        </td>
        <td>
          <div class="text-end">
            <div class="fw-bold">$${item.sellingPrice?.toFixed(2) || '0.00'}</div>
            <small class="text-muted">Selling</small>
          </div>
        </td>
        <td>
          <div class="text-end">
            <div class="fw-bold text-${item.profitMargin > 0 ? 'success' : 'muted'}">
              ${item.profitMargin}%
            </div>
            <small class="text-muted">Margin</small>
          </div>
        </td>
        <td>
          ${item.supplier ? `
            <div class="text-truncate" title="${item.supplier.name}">
              <small class="text-muted">${item.supplier.name}</small>
            </div>
          ` : '<small class="text-muted">-</small>'}
        </td>
        <td>
          ${item.expiryDate ? `
            <div class="text-center">
              <div class="fw-bold ${this.isExpiringSoon(item.expiryDate) ? 'text-warning' : ''}">
                ${new Date(item.expiryDate).toLocaleDateString()}
              </div>
              <small class="text-muted">Expires</small>
            </div>
          ` : '<small class="text-muted">-</small>'}
        </td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary edit-inventory-btn" data-item-id="${item._id}" title="Edit Item">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-outline-info stock-update-btn" data-item-id="${item._id}" title="Update Stock">
              <i class="fas fa-boxes"></i>
            </button>
            <button class="btn btn-outline-danger delete-inventory-btn" data-item-id="${item._id}" title="Deactivate Item">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  getStockStatusColor(status) {
    switch (status) {
      case 'out-of-stock': return 'danger';
      case 'low-stock': return 'warning';
      case 'overstocked': return 'info';
      default: return 'success';
    }
  }

  getStockStatusText(status) {
    switch (status) {
      case 'out-of-stock': return 'Out of Stock';
      case 'low-stock': return 'Low Stock';
      case 'overstocked': return 'Overstocked';
      default: return 'Normal';
    }
  }

  isExpiringSoon(expiryDate) {
    const daysUntilExpiry = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  }

  renderPagination() {
    const pagination = document.getElementById('inventoryPagination');
    if (!pagination) return;

    if (this.totalPages <= 1) {
      pagination.innerHTML = '';
      return;
    }

    let paginationHTML = '<ul class="pagination justify-content-center">';

    // Previous button
    paginationHTML += `
      <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link pagination-link" href="#" data-page="${this.currentPage - 1}">Previous</a>
      </li>
    `;

    // Page numbers
    for (let i = 1; i <= this.totalPages; i++) {
      if (i === this.currentPage) {
        paginationHTML += `<li class="page-item active"><span class="page-link">${i}</span></li>`;
      } else {
        paginationHTML += `<li class="page-item"><a class="page-link pagination-link" href="#" data-page="${i}">${i}</a></li>`;
      }
    }

    // Next button
    paginationHTML += `
      <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
        <a class="page-link pagination-link" href="#" data-page="${this.currentPage + 1}">Next</a>
      </li>
    `;

    paginationHTML += '</ul>';
    pagination.innerHTML = paginationHTML;
  }

  showAddForm() {
    this.isEditing = false;
    this.currentItem = null;
    this.showForm();
    this.resetForm();
  }

  async editInventory(itemId) {
    try {
      this.showLoading();
      const response = await window.api.get(`/api/inventory/${itemId}`);
      this.currentItem = response.inventory;
      this.isEditing = true;
      this.showForm();
      this.populateForm(this.currentItem);
      this.hideLoading();
    } catch (error) {
      this.hideLoading();
      this.showError('Failed to load inventory item: ' + error.message);
    }
  }

  showForm() {
    const form = document.getElementById('inventoryFormContainer');
    const table = document.getElementById('inventoryTableContainer');

    if (form) form.classList.remove('hidden');
    if (table) table.classList.add('hidden');
  }

  hideForm() {
    const form = document.getElementById('inventoryFormContainer');
    const table = document.getElementById('inventoryTableContainer');

    if (form) form.classList.add('hidden');
    if (table) table.classList.remove('hidden');

    // Reset form state
    this.isEditing = false;
    this.currentItem = null;
  }

  cancelEdit() {
    if (this.isEditing) {
      if (confirm('Are you sure you want to cancel? Any changes will be lost.')) {
        this.hideForm();
        this.resetForm();
      }
    } else {
      this.hideForm();
      this.resetForm();
    }
  }

  resetForm() {
    const form = document.getElementById('inventoryForm');
    if (form) form.reset();

    // Reset form title
    const formTitle = document.getElementById('inventoryFormTitle');
    if (formTitle) formTitle.textContent = 'Add New Inventory Item';

    // Reset submit button
    const submitBtn = document.getElementById('inventorySubmitBtn');
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Item';

    // Reset form state
    this.isEditing = false;
    this.currentItem = null;
  }

  populateForm(item) {
    const form = document.getElementById('inventoryForm');
    if (!form) return;

    // Update form title
    const formTitle = document.getElementById('inventoryFormTitle');
    if (formTitle) formTitle.textContent = 'Edit Inventory Item';

    // Update submit button
    const submitBtn = document.getElementById('inventorySubmitBtn');
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Item';

    // Populate form fields
    form.elements.name.value = item.name || '';
    form.elements.sku.value = item.sku || '';
    form.elements.category.value = item.category || '';
    form.elements.subcategory.value = item.subcategory || '';
    form.elements.description.value = item.description || '';
    form.elements.unit.value = item.unit || '';
    form.elements.currentStock.value = item.currentStock || 0;
    form.elements.minimumStock.value = item.minimumStock || 0;
    form.elements.maximumStock.value = item.maximumStock || '';
    form.elements.costPrice.value = item.costPrice || 0;
    form.elements.sellingPrice.value = item.sellingPrice || 0;
    form.elements.supplier.value = item.supplier?._id || '';
    form.elements.warehouse.value = item.location?.warehouse || '';
    form.elements.shelf.value = item.location?.shelf || '';
    form.elements.bin.value = item.location?.bin || '';
    form.elements.expiryDate.value = item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '';
    form.elements.batchNumber.value = item.batchNumber || '';
    form.elements.notes.value = item.notes || '';
    form.elements.isActive.checked = item.isActive !== false;
  }

  async handleFormSubmit(e) {
    e.preventDefault();

    try {
      this.showFormLoading();

      const formData = new FormData(e.target);
      const inventoryData = {
        name: formData.get('name'),
        sku: formData.get('sku'),
        category: formData.get('category'),
        subcategory: formData.get('subcategory'),
        description: formData.get('description'),
        unit: formData.get('unit'),
        currentStock: parseFloat(formData.get('currentStock')) || 0,
        minimumStock: parseFloat(formData.get('minimumStock')) || 0,
        maximumStock: formData.get('maximumStock') ? parseFloat(formData.get('maximumStock')) : undefined,
        costPrice: parseFloat(formData.get('costPrice')) || 0,
        sellingPrice: parseFloat(formData.get('sellingPrice')) || 0,
        supplier: formData.get('supplier') || undefined,
        location: {
          warehouse: formData.get('warehouse'),
          shelf: formData.get('shelf'),
          bin: formData.get('bin')
        },
        expiryDate: formData.get('expiryDate') || undefined,
        batchNumber: formData.get('batchNumber'),
        notes: formData.get('notes'),
        isActive: formData.get('isActive') === 'on'
      };

      let response;
      if (this.isEditing) {
        response = await window.api.put(`/api/inventory/${this.currentItem._id}`, inventoryData);
        this.showSuccess('Inventory item updated successfully!');
      } else {
        response = await window.api.post('/api/inventory', inventoryData);
        this.showSuccess('Inventory item created successfully!');
      }

      this.hideForm();
      this.loadInventory();

    } catch (error) {
      console.error('Form submission error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save inventory item';
      this.showError(errorMessage);
    } finally {
      this.hideFormLoading();
    }
  }

  async deleteInventory(itemId) {
    if (!confirm('Are you sure you want to deactivate this inventory item?')) {
      return;
    }

    try {
      await window.api.delete(`/api/inventory/${itemId}`);
      this.showSuccess('Inventory item deactivated successfully');
      this.loadInventory();
    } catch (error) {
      this.showError('Failed to deactivate inventory item: ' + error.message);
    }
  }

  showStockUpdateForm(itemId) {
    const item = this.inventory.find(i => i._id === itemId);
    if (!item) return;

    const modal = document.getElementById('stockUpdateModal');
    if (!modal) return;

    // Populate modal with current values
    const currentStockInput = modal.querySelector('#stockUpdateCurrentStock');
    const minimumStockInput = modal.querySelector('#stockUpdateMinimumStock');
    const maximumStockInput = modal.querySelector('#stockUpdateMaximumStock');

    if (currentStockInput) currentStockInput.value = item.currentStock;
    if (minimumStockInput) minimumStockInput.value = item.minimumStock;
    if (maximumStockInput) maximumStockInput.value = item.maximumStock || '';

    // Store item ID for form submission
    modal.setAttribute('data-item-id', itemId);

    // Show modal
    modal.classList.remove('hidden');
  }

  async handleStockUpdate(e) {
    e.preventDefault();

    const modal = document.getElementById('stockUpdateModal');
    const itemId = modal.getAttribute('data-item-id');

    try {
      const formData = new FormData(e.target);
      const stockData = {
        currentStock: parseFloat(formData.get('currentStock')) || 0,
        minimumStock: parseFloat(formData.get('minimumStock')) || 0,
        maximumStock: formData.get('maximumStock') ? parseFloat(formData.get('maximumStock')) : undefined
      };

      await window.api.patch(`/api/inventory/${itemId}/stock`, stockData);
      this.showSuccess('Stock updated successfully!');
      this.hideStockUpdateModal();
      this.loadInventory();
    } catch (error) {
      this.showError('Failed to update stock: ' + error.message);
    }
  }

  hideStockUpdateModal() {
    const modal = document.getElementById('stockUpdateModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.removeAttribute('data-item-id');
    }
  }

  handleSearch() {
    const searchInput = document.getElementById('inventorySearch');
    const search = searchInput ? searchInput.value : '';
    this.loadInventory(1, search);
  }

  handleFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    const stockStatusFilter = document.getElementById('stockStatusFilter');

    const category = categoryFilter ? categoryFilter.value : '';
    const stockStatus = stockStatusFilter ? stockStatusFilter.value : '';

    this.loadInventory(1, '', category, stockStatus);
  }

  updateStats(total) {
    const inventoryCount = document.getElementById('inventoryCount');
    if (inventoryCount) inventoryCount.textContent = total;
  }

  showLoading() {
    const loadingDiv = document.getElementById('inventoryLoading');
    if (loadingDiv) loadingDiv.classList.remove('hidden');
  }

  hideLoading() {
    const loadingDiv = document.getElementById('inventoryLoading');
    if (loadingDiv) loadingDiv.classList.add('hidden');
  }

  showFormLoading() {
    const submitBtn = document.getElementById('inventorySubmitBtn');
    if (submitBtn) {
      submitBtn.innerHTML = '<span class="loading"></span> Saving...';
      submitBtn.disabled = true;
    }
  }

  hideFormLoading() {
    const submitBtn = document.getElementById('inventorySubmitBtn');
    if (submitBtn) {
      submitBtn.innerHTML = this.isEditing ? '<i class="fas fa-save"></i> Update Item' : '<i class="fas fa-plus"></i> Add Item';
      submitBtn.disabled = false;
    }
  }

  showSuccess(message) {
    window.utils.showNotification(message, 'success');
  }

  showError(message) {
    window.utils.showNotification(message, 'error');
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Export for use in other modules
window.InventoryManager = InventoryManager;