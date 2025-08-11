class Dashboard {
  constructor() {
    this.currentSection = 'overview';
    this.supplierManager = null;
    this.inventoryManager = null; // Added
    this.init();
  }

  init() {
    this.bindEvents();
    this.showSection('overview');
  }

  bindEvents() {
    // Navigation event listeners
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.getAttribute('data-section');
        this.showSection(section);
      });
    });

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (window.auth) {
          window.auth.handleLogout();
        }
      });
    }
  }

  showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => {
      section.classList.add('hidden');
    });

    // Remove active class from all nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
      targetSection.classList.remove('hidden');
    }

    // Add active class to nav link
    const activeNavLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeNavLink) {
      activeNavLink.classList.add('active');
    }

    this.currentSection = sectionName;

    // Initialize section-specific functionality
    this.initializeSection(sectionName);
  }

  initializeSection(sectionName) {
    switch (sectionName) {
      case 'suppliers':
        if (!this.supplierManager) {
          this.supplierManager = new SupplierManager();
          // Make it globally accessible for debugging
          window.supplierManager = this.supplierManager;
        }
        break;
      case 'inventory':
        if (!this.inventoryManager) {
          this.inventoryManager = new InventoryManager();
          // Make it globally accessible for debugging
          window.inventoryManager = this.inventoryManager;
        }
        break;
      case 'pricing':
        // Initialize pricing manager when implemented
        break;
      case 'invoices':
        // Initialize invoice manager when implemented
        break;
      case 'orders':
        // Initialize order manager when implemented
        break;
      case 'stock':
        // Initialize stock manager when implemented
        break;
      default:
        break;
    }
  }

  loadSectionData(sectionName) {
    // Load data for the current section
    switch (sectionName) {
      case 'suppliers':
        if (this.supplierManager) {
          this.supplierManager.loadSuppliers();
        }
        break;
      // Add other sections as they're implemented
    }
  }

  async loadDashboardData() {
    try {
      // For now, we'll use placeholder data
      // Later this will come from API calls
      this.updateStats({
        suppliers: 0,
        inventory: 0,
        invoices: 0,
        orders: 0
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  async loadOverviewData() {
    // Load overview statistics
    try {
      // This would be API calls in the future
      console.log('Loading overview data...');
    } catch (error) {
      console.error('Error loading overview data:', error);
    }
  }

  async loadSuppliersData() {
    try {
      console.log('Loading suppliers data...');
      // Placeholder for future implementation
    } catch (error) {
      console.error('Error loading suppliers data:', error);
    }
  }

  async loadInventoryData() {
    try {
      console.log('Loading inventory data...');
      // Placeholder for future implementation
    } catch (error) {
      console.error('Error loading inventory data:', error);
    }
  }

  async loadPricingData() {
    try {
      console.log('Loading pricing data...');
      // Placeholder for future implementation
    } catch (error) {
      console.error('Error loading pricing data:', error);
    }
  }

  async loadInvoicesData() {
    try {
      console.log('Loading invoices data...');
      // Placeholder for future implementation
    } catch (error) {
      console.error('Error loading invoices data:', error);
    }
  }

  async loadOrdersData() {
    try {
      console.log('Loading orders data...');
      // Placeholder for future implementation
    } catch (error) {
      console.error('Error loading orders data:', error);
    }
  }

  async loadStockData() {
    try {
      console.log('Loading stock data...');
      // Placeholder for future implementation
    } catch (error) {
      console.error('Error loading stock data:', error);
    }
  }

  updateStats(stats) {
    const overviewSupplierCount = document.getElementById('overviewSupplierCount');
    const overviewInventoryCount = document.getElementById('overviewInventoryCount');
    const overviewInvoiceCount = document.getElementById('overviewInvoiceCount');
    const overviewOrderCount = document.getElementById('overviewOrderCount');

    if (overviewSupplierCount) overviewSupplierCount.textContent = stats.suppliers || 0;
    if (overviewInventoryCount) overviewInventoryCount.textContent = stats.inventory || 0;
    if (overviewInvoiceCount) overviewInvoiceCount.textContent = stats.invoices || 0;
    if (overviewOrderCount) overviewOrderCount.textContent = stats.orders || 0;
  }

  // Method to refresh dashboard data
  refresh() {
    this.loadDashboardData();
    this.loadSectionData(this.currentSection);
  }

  // Method to show loading state
  showLoading(sectionName) {
    const section = document.getElementById(sectionName);
    if (section) {
      section.innerHTML = `
        <div class="text-center">
          <div class="loading" style="width: 50px; height: 50px; margin: 2rem auto;"></div>
          <p>Loading...</p>
        </div>
      `;
    }
  }

  // Method to show error state
  showError(sectionName, message) {
    const section = document.getElementById(sectionName);
    if (section) {
      section.innerHTML = `
        <div class="text-center">
          <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--error-color); margin-bottom: 1rem;"></i>
          <h3>Error</h3>
          <p>${message}</p>
          <button class="btn btn-primary" onclick="dashboard.refresh()">
            <i class="fas fa-redo"></i> Retry
          </button>
        </div>
      `;
    }
  }
}

// Export for use in other modules
window.Dashboard = Dashboard;