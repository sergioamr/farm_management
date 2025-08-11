class PricingManager {
  constructor() {
    this.pricing = [];
    this.currentPage = 1;
    this.totalPages = 1;
    this.currentItem = null;
    this.isEditing = false;
    this.suppliers = [];
    this.inventory = [];
    this.bulkPricingCounter = 1;

    this.init();
  }

  init() {
    this.bindEvents();
    this.loadSuppliers();
    this.loadInventory();
    this.loadPricing();
  }

  bindEvents() {
    // Add pricing button
    const addBtn = document.getElementById('addPricingBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.showAddForm());
    }

    // Form submission
    const pricingForm = document.getElementById('pricingForm');
    if (pricingForm) {
      pricingForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    // Search functionality
    const searchInput = document.getElementById('pricingSearch');
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(() => this.handleSearch(), 300));
    }

    // Filter functionality
    const supplierFilter = document.getElementById('supplierFilter');
    if (supplierFilter) {
      supplierFilter.addEventListener('change', () => this.handleFilter());
    }

    const inventoryFilter = document.getElementById('inventoryFilter');
    if (inventoryFilter) {
      inventoryFilter.addEventListener('change', () => this.handleFilter());
    }

    const currencyFilter = document.getElementById('currencyFilter');
    if (currencyFilter) {
      currencyFilter.addEventListener('change', () => this.handleFilter());
    }

    // Back to list button
    const backToListBtn = document.getElementById('backToPricingListBtn');
    if (backToListBtn) {
      backToListBtn.addEventListener('click', () => this.hideForm());
    }

    // Cancel edit button
    const cancelEditBtn = document.getElementById('cancelPricingEditBtn');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => this.cancelEdit());
    }

    // Cancel pricing button
    const cancelPricingBtn = document.getElementById('cancelPricingBtn');
    if (cancelPricingBtn) {
      cancelPricingBtn.addEventListener('click', () => this.hideForm());
    }

    // Bulk pricing buttons
    const addBulkPricingBtn = document.getElementById('addBulkPricingBtn');
    if (addBulkPricingBtn) {
      addBulkPricingBtn.addEventListener('click', () => this.addBulkPricingRow());
    }

    // Event delegation for dynamically created elements
    this.bindDelegatedEvents();
  }

  bindDelegatedEvents() {
    // Handle edit and delete buttons using event delegation
    document.addEventListener('click', (e) => {
      if (e.target.closest('.edit-pricing-btn')) {
        const button = e.target.closest('.edit-pricing-btn');
        const itemId = button.getAttribute('data-item-id');
        this.editPricing(itemId);
      }

      if (e.target.closest('.delete-pricing-btn')) {
        const button = e.target.closest('.delete-pricing-btn');
        const itemId = button.getAttribute('data-item-id');
        this.deletePricing(itemId);
      }

      if (e.target.closest('.pagination-link')) {
        e.preventDefault();
        const link = e.target.closest('.pagination-link');
        const page = parseInt(link.getAttribute('data-page'));
        this.loadPricing(page);
      }

      if (e.target.closest('.remove-bulk-pricing')) {
        const button = e.target.closest('.remove-bulk-pricing');
        const item = button.closest('.bulk-pricing-item');
        if (item) {
          item.remove();
        }
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
      this.suppliers = [];
      this.populateSupplierOptions();
    }
  }

  async loadInventory() {
    try {
      const response = await window.api.get('/api/inventory?limit=1000');
      this.inventory = response.inventory || [];
      this.populateInventoryOptions();
    } catch (error) {
      console.error('Error loading inventory:', error);
      this.inventory = [];
      this.populateInventoryOptions();
    }
  }

  populateSupplierOptions() {
    const supplierSelect = document.getElementById('supplier');
    const supplierFilter = document.getElementById('supplierFilter');

    if (supplierSelect) {
      supplierSelect.innerHTML = '<option value="">Select Supplier</option>';
      this.suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier._id;
        option.textContent = `${supplier.name} (${supplier.businessType})`;
        supplierSelect.appendChild(option);
      });
    }

    if (supplierFilter) {
      supplierFilter.innerHTML = '<option value="">All Suppliers</option>';
      this.suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier._id;
        option.textContent = supplier.name;
        supplierFilter.appendChild(option);
      });
    }
  }

  populateInventoryOptions() {
    const inventorySelect = document.getElementById('inventory');
    const inventoryFilter = document.getElementById('inventoryFilter');

    if (inventorySelect) {
      inventorySelect.innerHTML = '<option value="">Select Inventory Item</option>';
      this.inventory.forEach(item => {
        const option = document.createElement('option');
        option.value = item._id;
        option.textContent = `${item.name} (${item.sku})`;
        inventorySelect.appendChild(option);
      });
    }

    if (inventoryFilter) {
      inventoryFilter.innerHTML = '<option value="">All Items</option>';
      this.inventory.forEach(item => {
        const option = document.createElement('option');
        option.value = item._id;
        option.textContent = item.name;
        inventoryFilter.appendChild(option);
      });
    }
  }

  async loadPricing(page = 1, search = '', supplier = '', inventory = '', currency = '') {
    try {
      this.showLoading();

      const params = new URLSearchParams({
        page: page,
        limit: 10,
        ...(search && { search }),
        ...(supplier && { supplier }),
        ...(inventory && { inventory }),
        ...(currency && { currency })
      });

      const response = await window.api.get(`/api/pricing?${params}`);

      this.pricing = response.pricing;
      this.currentPage = response.pagination.page;
      this.totalPages = response.pagination.pages;

      this.renderPricing();
      this.renderPagination();
      this.updateStats(response.pagination.total);

    } catch (error) {
      this.showError('Failed to load pricing: ' + error.message);
    } finally {
      this.hideLoading();
    }
  }

  renderPricing() {
    const tbody = document.getElementById('pricingTableBody');
    if (!tbody) return;

    if (this.pricing.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-4">
            <i class="fas fa-tags fa-2x text-muted mb-2"></i>
            <p class="text-muted">No pricing found</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.pricing.map(item => `
      <tr data-item-id="${item._id}">
        <td>
          <div class="d-flex align-items-center">
            <div class="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2">
              ${item.supplier?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div>
              <div class="fw-bold">${item.supplier?.name || 'N/A'}</div>
              <small class="text-muted">${item.supplier?.businessType || ''}</small>
            </div>
          </div>
        </td>
        <td>
          <div class="d-flex align-items-center">
            <div class="avatar-sm bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-2">
              ${item.inventory?.name?.charAt(0).toUpperCase() || 'I'}
            </div>
            <div>
              <div class="fw-bold">${item.inventory?.name || 'N/A'}</div>
              <small class="text-muted">${item.inventory?.sku || ''}</small>
            </div>
          </div>
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
          <span class="badge bg-secondary">${item.currency || 'USD'}</span>
        </td>
        <td>
          ${item.bulkPricing && item.bulkPricing.length > 0 ?
            `<span class="badge bg-info">${item.bulkPricing.length} tiers</span>` :
            '<small class="text-muted">-</small>'
          }
        </td>
        <td>
          <span class="badge bg-${item.isActive ? 'success' : 'danger'}">
            ${item.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary edit-pricing-btn" data-item-id="${item._id}" title="Edit Pricing">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-outline-danger delete-pricing-btn" data-item-id="${item._id}" title="Deactivate Pricing">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  renderPagination() {
    const pagination = document.getElementById('pricingPagination');
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

  async editPricing(itemId) {
    try {
      this.showLoading();
      const response = await window.api.get(`/api/pricing/${itemId}`);
      this.currentItem = response.pricing;
      this.isEditing = true;
      this.showForm();
      this.populateForm(this.currentItem);
      this.hideLoading();
    } catch (error) {
      this.hideLoading();
      this.showError('Failed to load pricing: ' + error.message);
    }
  }

  showForm() {
    const form = document.getElementById('pricingFormContainer');
    const table = document.getElementById('pricingTableContainer');

    if (form) form.classList.remove('hidden');
    if (table) table.classList.add('hidden');
  }

  hideForm() {
    const form = document.getElementById('pricingFormContainer');
    const table = document.getElementById('pricingTableContainer');

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
    const form = document.getElementById('pricingForm');
    if (form) form.reset();

    // Reset form title
    const formTitle = document.getElementById('pricingFormTitle');
    if (formTitle) formTitle.textContent = 'Add New Pricing';

    // Reset submit button
    const submitBtn = document.getElementById('pricingSubmitBtn');
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Pricing';

    // Reset form state
    this.isEditing = false;
    this.currentItem = null;

    // Reset bulk pricing
    this.resetBulkPricing();
  }

  resetBulkPricing() {
    const container = document.getElementById('bulkPricingContainer');
    if (container) {
      container.innerHTML = `
        <div class="bulk-pricing-item mb-2">
          <div class="row">
            <div class="col-md-4">
              <input type="number" name="bulkPricing[0][quantity]" class="form-control" placeholder="Quantity" min="1">
            </div>
            <div class="col-md-4">
              <input type="number" name="bulkPricing[0][price]" class="form-control" placeholder="Price" step="0.01" min="0">
            </div>
            <div class="col-md-3">
              <input type="number" name="bulkPricing[0][discount]" class="form-control" placeholder="Discount %" min="0" max="100">
            </div>
            <div class="col-md-1">
              <button type="button" class="btn btn-outline-danger btn-sm remove-bulk-pricing">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }
    this.bulkPricingCounter = 1;
  }

  addBulkPricingRow() {
    const container = document.getElementById('bulkPricingContainer');
    if (!container) return;

    const newRow = document.createElement('div');
    newRow.className = 'bulk-pricing-item mb-2';
    newRow.innerHTML = `
      <div class="row">
        <div class="col-md-4">
          <input type="number" name="bulkPricing[${this.bulkPricingCounter}][quantity]" class="form-control" placeholder="Quantity" min="1">
        </div>
        <div class="col-md-4">
          <input type="number" name="bulkPricing[${this.bulkPricingCounter}][price]" class="form-control" placeholder="Price" step="0.01" min="0">
        </div>
        <div class="col-md-3">
          <input type="number" name="bulkPricing[${this.bulkPricingCounter}][discount]" class="form-control" placeholder="Discount %" min="0" max="100">
        </div>
        <div class="col-md-1">
          <button type="button" class="btn btn-outline-danger btn-sm remove-bulk-pricing">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;

    container.appendChild(newRow);
    this.bulkPricingCounter++;
  }

  populateForm(item) {
    const form = document.getElementById('pricingForm');
    if (!form) return;

    // Update form title
    const formTitle = document.getElementById('pricingFormTitle');
    if (formTitle) formTitle.textContent = 'Edit Pricing';

    // Update submit button
    const submitBtn = document.getElementById('pricingSubmitBtn');
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Pricing';

    // Populate form fields
    form.elements.supplier.value = item.supplier?._id || '';
    form.elements.inventory.value = item.inventory?._id || '';
    form.elements.costPrice.value = item.costPrice || 0;
    form.elements.sellingPrice.value = item.sellingPrice || 0;
    form.elements.currency.value = item.currency || 'USD';
    form.elements.minimumOrderQuantity.value = item.minimumOrderQuantity || 1;
    form.elements.leadTime.value = item.leadTime || 0;
    form.elements.paymentTerms.value = item.paymentTerms || 'Net 30';
    form.elements.effectiveDate.value = item.effectiveDate ? new Date(item.effectiveDate).toISOString().split('T')[0] : '';
    form.elements.expiryDate.value = item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '';
    form.elements.notes.value = item.notes || '';
    form.elements.isActive.checked = item.isActive !== false;

    // Populate bulk pricing
    this.populateBulkPricing(item.bulkPricing || []);
  }

  populateBulkPricing(bulkPricing) {
    const container = document.getElementById('bulkPricingContainer');
    if (!container) return;

    container.innerHTML = '';
    this.bulkPricingCounter = 0;

    if (bulkPricing.length === 0) {
      this.addBulkPricingRow();
      return;
    }

    bulkPricing.forEach((item, index) => {
      const newRow = document.createElement('div');
      newRow.className = 'bulk-pricing-item mb-2';
      newRow.innerHTML = `
        <div class="row">
          <div class="col-md-4">
            <input type="number" name="bulkPricing[${index}][quantity]" class="form-control" placeholder="Quantity" min="1" value="${item.quantity || ''}">
          </div>
          <div class="col-md-4">
            <input type="number" name="bulkPricing[${index}][price]" class="form-control" placeholder="Price" step="0.01" min="0" value="${item.price || ''}">
          </div>
          <div class="col-md-3">
            <input type="number" name="bulkPricing[${index}][discount]" class="form-control" placeholder="Discount %" min="0" max="100" value="${item.discount || ''}">
          </div>
          <div class="col-md-1">
            <button type="button" class="btn btn-outline-danger btn-sm remove-bulk-pricing">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;

      container.appendChild(newRow);
      this.bulkPricingCounter = index + 1;
    });
  }

  async handleFormSubmit(e) {
    e.preventDefault();

    try {
      this.showFormLoading();

      const formData = new FormData(e.target);
      const pricingData = {
        supplier: formData.get('supplier'),
        inventory: formData.get('inventory'),
        costPrice: parseFloat(formData.get('costPrice')) || 0,
        sellingPrice: parseFloat(formData.get('sellingPrice')) || 0,
        currency: formData.get('currency'),
        minimumOrderQuantity: parseInt(formData.get('minimumOrderQuantity')) || 1,
        leadTime: parseInt(formData.get('leadTime')) || 0,
        paymentTerms: formData.get('paymentTerms'),
        effectiveDate: formData.get('effectiveDate') || undefined,
        expiryDate: formData.get('expiryDate') || undefined,
        notes: formData.get('notes'),
        isActive: formData.get('isActive') === 'on',
        bulkPricing: this.getBulkPricingData()
      };

      let response;
      if (this.isEditing) {
        response = await window.api.put(`/api/pricing/${this.currentItem._id}`, pricingData);
        this.showSuccess('Pricing updated successfully!');
      } else {
        response = await window.api.post('/api/pricing', pricingData);
        this.showSuccess('Pricing created successfully!');
      }

      this.hideForm();
      this.loadPricing();

    } catch (error) {
      console.error('Form submission error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save pricing';
      this.showError(errorMessage);
    } finally {
      this.hideFormLoading();
    }
  }

  getBulkPricingData() {
    const bulkPricing = [];
    const container = document.getElementById('bulkPricingContainer');
    if (!container) return bulkPricing;

    const rows = container.querySelectorAll('.bulk-pricing-item');
    rows.forEach((row, index) => {
      const quantity = row.querySelector(`input[name="bulkPricing[${index}][quantity]"]`)?.value;
      const price = row.querySelector(`input[name="bulkPricing[${index}][price]"]`)?.value;
      const discount = row.querySelector(`input[name="bulkPricing[${index}][discount]"]`)?.value;

      if (quantity && price) {
        bulkPricing.push({
          quantity: parseInt(quantity),
          price: parseFloat(price),
          discount: discount ? parseFloat(discount) : undefined
        });
      }
    });

    return bulkPricing;
  }

  async deletePricing(itemId) {
    if (!confirm('Are you sure you want to deactivate this pricing?')) {
      return;
    }

    try {
      await window.api.delete(`/api/pricing/${itemId}`);
      this.showSuccess('Pricing deactivated successfully');
      this.loadPricing();
    } catch (error) {
      this.showError('Failed to deactivate pricing: ' + error.message);
    }
  }

  handleSearch() {
    const searchInput = document.getElementById('pricingSearch');
    const search = searchInput ? searchInput.value : '';
    this.loadPricing(1, search);
  }

  handleFilter() {
    const supplierFilter = document.getElementById('supplierFilter');
    const inventoryFilter = document.getElementById('inventoryFilter');
    const currencyFilter = document.getElementById('currencyFilter');

    const supplier = supplierFilter ? supplierFilter.value : '';
    const inventory = inventoryFilter ? inventoryFilter.value : '';
    const currency = currencyFilter ? currencyFilter.value : '';

    this.loadPricing(1, '', supplier, inventory, currency);
  }

  updateStats(total) {
    const pricingCount = document.getElementById('pricingCount');
    if (pricingCount) pricingCount.textContent = total;
  }

  showLoading() {
    const loadingDiv = document.getElementById('pricingLoading');
    if (loadingDiv) loadingDiv.classList.remove('hidden');
  }

  hideLoading() {
    const loadingDiv = document.getElementById('pricingLoading');
    if (loadingDiv) loadingDiv.classList.add('hidden');
  }

  showFormLoading() {
    const submitBtn = document.getElementById('pricingSubmitBtn');
    if (submitBtn) {
      submitBtn.innerHTML = '<span class="loading"></span> Saving...';
      submitBtn.disabled = true;
    }
  }

  hideFormLoading() {
    const submitBtn = document.getElementById('pricingSubmitBtn');
    if (submitBtn) {
      submitBtn.innerHTML = this.isEditing ? '<i class="fas fa-save"></i> Update Pricing' : '<i class="fas fa-plus"></i> Add Pricing';
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
window.PricingManager = PricingManager;