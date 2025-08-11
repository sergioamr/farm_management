class SupplierManager {
  constructor() {
    this.suppliers = [];
    this.currentPage = 1;
    this.totalPages = 1;
    this.currentSupplier = null;
    this.isEditing = false;

    this.init();
  }

  init() {
    this.bindEvents();
    this.loadSuppliers();
  }

  bindEvents() {
    // Add supplier button
    const addBtn = document.getElementById('addSupplierBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.showAddForm());
    }

    // Form submission
    const supplierForm = document.getElementById('supplierForm');
    if (supplierForm) {
      supplierForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    // Search functionality
    const searchInput = document.getElementById('supplierSearch');
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(() => this.handleSearch(), 300));
    }

    // Filter functionality
    const businessTypeFilter = document.getElementById('businessTypeFilter');
    if (businessTypeFilter) {
      businessTypeFilter.addEventListener('change', () => this.handleFilter());
    }

    // Back to list button
    const backToListBtn = document.getElementById('backToListBtn');
    if (backToListBtn) {
      backToListBtn.addEventListener('click', () => this.hideForm());
    }

    // Cancel edit button
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => this.cancelEdit());
    }

    // Cancel supplier button
    const cancelSupplierBtn = document.getElementById('cancelSupplierBtn');
    if (cancelSupplierBtn) {
      cancelSupplierBtn.addEventListener('click', () => this.hideForm());
    }

    // Event delegation for dynamically created elements
    this.bindDelegatedEvents();
  }

  bindDelegatedEvents() {
    // Handle edit and delete buttons using event delegation
    document.addEventListener('click', (e) => {
      if (e.target.closest('.edit-supplier-btn')) {
        const button = e.target.closest('.edit-supplier-btn');
        const supplierId = button.getAttribute('data-supplier-id');
        this.editSupplier(supplierId);
      }

      if (e.target.closest('.delete-supplier-btn')) {
        const button = e.target.closest('.delete-supplier-btn');
        const supplierId = button.getAttribute('data-supplier-id');
        this.deleteSupplier(supplierId);
      }

      if (e.target.closest('.pagination-link')) {
        e.preventDefault();
        const link = e.target.closest('.pagination-link');
        const page = parseInt(link.getAttribute('data-page'));
        this.loadSuppliers(page);
      }
    });
  }

  async loadSuppliers(page = 1, search = '', businessType = '') {
    try {
      this.showLoading();

      const params = new URLSearchParams({
        page: page,
        limit: 10,
        ...(search && { search }),
        ...(businessType && { businessType })
      });

      const response = await window.api.get(`/api/suppliers?${params}`);

      this.suppliers = response.suppliers;
      this.currentPage = response.pagination.page;
      this.totalPages = response.pagination.pages;

      this.renderSuppliers();
      this.renderPagination();
      this.updateStats(response.pagination.total);

    } catch (error) {
      this.showError('Failed to load suppliers: ' + error.message);
    } finally {
      this.hideLoading();
    }
  }

  renderSuppliers() {
    const tbody = document.getElementById('suppliersTableBody');
    if (!tbody) return;

    if (this.suppliers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4">
            <i class="fas fa-inbox fa-2x text-muted mb-2"></i>
            <p class="text-muted">No suppliers found</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.suppliers.map(supplier => `
      <tr data-supplier-id="${supplier._id}">
        <td>
          <div class="d-flex align-items-center">
            <div class="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2">
              ${supplier.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="fw-bold">${supplier.name}</div>
              <small class="text-muted">${supplier.businessType}</small>
            </div>
          </div>
        </td>
        <td>${supplier.contactPerson}</td>
        <td>${supplier.email}</td>
        <td>${supplier.phone}</td>
        <td>
          <span class="badge bg-${supplier.isActive ? 'success' : 'secondary'}">
            ${supplier.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <div class="rating">
            ${this.renderRating(supplier.rating)}
          </div>
        </td>
        <td>${supplier.address.city}, ${supplier.address.state}</td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary edit-supplier-btn" data-supplier-id="${supplier._id}" title="Edit Supplier">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-outline-danger delete-supplier-btn" data-supplier-id="${supplier._id}" title="Deactivate Supplier">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  renderRating(rating) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push('<i class="fas fa-star text-warning"></i>');
      } else {
        stars.push('<i class="far fa-star text-muted"></i>');
      }
    }
    return stars.join('');
  }

  renderPagination() {
    const pagination = document.getElementById('suppliersPagination');
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
    this.currentSupplier = null;
    this.showForm();
    this.resetForm();
  }

  async editSupplier(supplierId) {
    try {
      this.showLoading();
      const response = await window.api.get(`/api/suppliers/${supplierId}`);
      this.currentSupplier = response.supplier;
      this.isEditing = true;
      this.showForm();
      this.populateForm(this.currentSupplier);
      this.hideLoading();
    } catch (error) {
      this.hideLoading();
      this.showError('Failed to load supplier: ' + error.message);
    }
  }

  showForm() {
    const form = document.getElementById('supplierFormContainer');
    const table = document.getElementById('suppliersTableContainer');

    if (form) form.classList.remove('hidden');
    if (table) table.classList.add('hidden');
  }

  hideForm() {
    const form = document.getElementById('supplierFormContainer');
    const table = document.getElementById('suppliersTableContainer');

    if (form) form.classList.add('hidden');
    if (table) table.classList.remove('hidden');

    // Reset form state
    this.isEditing = false;
    this.currentSupplier = null;
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
    const form = document.getElementById('supplierForm');
    if (form) form.reset();

    // Reset form title
    const formTitle = document.getElementById('supplierFormTitle');
    if (formTitle) formTitle.textContent = 'Add New Supplier';

    // Reset submit button
    const submitBtn = document.getElementById('supplierSubmitBtn');
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Supplier';

    // Reset form state
    this.isEditing = false;
    this.currentSupplier = null;
  }

  populateForm(supplier) {
    const form = document.getElementById('supplierForm');
    if (!form) return;

    // Update form title
    const formTitle = document.getElementById('supplierFormTitle');
    if (formTitle) formTitle.textContent = 'Edit Supplier';

    // Update submit button
    const submitBtn = document.getElementById('supplierSubmitBtn');
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Supplier';

    // Populate form fields
    form.elements.name.value = supplier.name || '';
    form.elements.contactPerson.value = supplier.contactPerson || '';
    form.elements.email.value = supplier.email || '';
    form.elements.phone.value = supplier.phone || '';
    form.elements.addressStreet.value = supplier.address?.street || '';
    form.elements.addressCity.value = supplier.address?.city || '';
    form.elements.addressState.value = supplier.address?.state || '';
    form.elements.addressZipCode.value = supplier.address?.zipCode || '';
    form.elements.addressCountry.value = supplier.address?.country || 'USA';
    form.elements.businessType.value = supplier.businessType || 'General Supplier';
    form.elements.paymentTerms.value = supplier.paymentTerms || 'Net 30';
    form.elements.creditLimit.value = supplier.creditLimit || 0;
    form.elements.rating.value = supplier.rating || 3;
    form.elements.notes.value = supplier.notes || '';
    form.elements.isActive.checked = supplier.isActive !== false; // Default to true if undefined
  }

  async handleFormSubmit(e) {
    e.preventDefault();

    try {
      this.showFormLoading();

      const formData = new FormData(e.target);
      const supplierData = {
        name: formData.get('name'),
        contactPerson: formData.get('contactPerson'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: {
          street: formData.get('addressStreet'),
          city: formData.get('addressCity'),
          state: formData.get('addressState'),
          zipCode: formData.get('addressZipCode'),
          country: formData.get('addressCountry')
        },
        businessType: formData.get('businessType'),
        paymentTerms: formData.get('paymentTerms'),
        creditLimit: parseFloat(formData.get('creditLimit')) || 0,
        rating: parseInt(formData.get('rating')) || 3,
        notes: formData.get('notes'),
        isActive: formData.get('isActive') === 'on'
      };

      let response;
      if (this.isEditing) {
        response = await window.api.put(`/api/suppliers/${this.currentSupplier._id}`, supplierData);
        this.showSuccess('Supplier updated successfully!');
      } else {
        response = await window.api.post('/api/suppliers', supplierData);
        this.showSuccess('Supplier created successfully!');
      }

      this.hideForm();
      this.loadSuppliers();

    } catch (error) {
      console.error('Form submission error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save supplier';
      this.showError(errorMessage);
    } finally {
      this.hideFormLoading();
    }
  }

  async deleteSupplier(supplierId) {
    if (!confirm('Are you sure you want to deactivate this supplier?')) {
      return;
    }

    try {
      await window.api.delete(`/api/suppliers/${supplierId}`);
      this.showSuccess('Supplier deactivated successfully');
      this.loadSuppliers();
    } catch (error) {
      this.showError('Failed to deactivate supplier: ' + error.message);
    }
  }

  handleSearch() {
    const searchInput = document.getElementById('supplierSearch');
    const search = searchInput ? searchInput.value : '';
    this.loadSuppliers(1, search);
  }

  handleFilter() {
    const businessTypeFilter = document.getElementById('businessTypeFilter');
    const businessType = businessTypeFilter ? businessTypeFilter.value : '';
    this.loadSuppliers(1, '', businessType);
  }

  updateStats(total) {
    const supplierCount = document.getElementById('supplierCount');
    if (supplierCount) supplierCount.textContent = total;
  }

  showLoading() {
    const loadingDiv = document.getElementById('suppliersLoading');
    if (loadingDiv) loadingDiv.classList.remove('hidden');
  }

  hideLoading() {
    const loadingDiv = document.getElementById('suppliersLoading');
    if (loadingDiv) loadingDiv.classList.add('hidden');
  }

  showFormLoading() {
    const submitBtn = document.getElementById('supplierSubmitBtn');
    if (submitBtn) {
      submitBtn.innerHTML = '<span class="loading"></span> Saving...';
      submitBtn.disabled = true;
    }
  }

  hideFormLoading() {
    const submitBtn = document.getElementById('supplierSubmitBtn');
    if (submitBtn) {
      submitBtn.innerHTML = this.isEditing ? '<i class="fas fa-save"></i> Update Supplier' : '<i class="fas fa-plus"></i> Add Supplier';
      submitBtn.disabled = false;
    }
  }

  showEditLoading() {
    const editBtn = document.querySelector(`[onclick="supplierManager.editSupplier('${this.currentSupplier?._id}')"]`);
    if (editBtn) {
      editBtn.innerHTML = '<span class="loading"></span>';
      editBtn.disabled = true;
    }
  }

  hideEditLoading() {
    const editBtn = document.querySelector(`[onclick="supplierManager.editSupplier('${this.currentSupplier?._id}')"]`);
    if (editBtn) {
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.disabled = false;
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
window.SupplierManager = SupplierManager;