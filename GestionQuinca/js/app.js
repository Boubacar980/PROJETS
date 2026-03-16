/* ══════════════════════════════════════
   APP.JS - SPA Router & Init
   ══════════════════════════════════════ */

const App = {
  currentPage: 'dashboard',
  currentUser: null,

  init() {
    Store.seed();
    this.checkAuth();
  },

  checkAuth() {
    const saved = sessionStorage.getItem('currentUser');
    if (saved) {
      this.currentUser = JSON.parse(saved);
      this.showApp();
    } else {
      Auth.showLogin();
    }
  },

  showApp() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
    this.updateUserDisplay();
    this.navigate('dashboard');
    this.bindNav();
    this.bindMobile();
  },

  updateUserDisplay() {
    const u = this.currentUser;
    document.getElementById('user-name').textContent = u.name;
    const roleLabels = { admin: 'Administrateur', vendeur: 'Vendeur', magasinier: 'Magasinier' };
    document.getElementById('user-role').textContent = roleLabels[u.role] || u.role;
    document.getElementById('user-avatar').textContent = u.name.split(' ').map(n => n[0]).join('').substring(0, 2);
    // Update critical products badge
    const crit = Store.getCriticalProducts().length;
    const badge = document.getElementById('nav-badge-products');
    if (badge) { badge.textContent = crit; badge.style.display = crit > 0 ? 'inline' : 'none'; }

    // Hide unauthorized sidebar items
    document.querySelectorAll('.nav-item').forEach(item => {
      const page = item.dataset.page;
      item.style.display = this.canAccess(page) ? 'flex' : 'none';
    });
  },

  bindNav() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        // Check role access
        if (!this.canAccess(page)) {
          Toast.show('Accès refusé pour votre rôle', 'error');
          return;
        }
        this.navigate(page);
        // Close mobile sidebar
        document.querySelector('.sidebar').classList.remove('open');
        document.querySelector('.sidebar-overlay').classList.remove('active');
      });
    });
  },

  bindMobile() {
    document.getElementById('menu-toggle').addEventListener('click', () => {
      document.querySelector('.sidebar').classList.toggle('open');
      document.querySelector('.sidebar-overlay').classList.toggle('active');
    });
    document.querySelector('.sidebar-overlay').addEventListener('click', () => {
      document.querySelector('.sidebar').classList.remove('open');
      document.querySelector('.sidebar-overlay').classList.remove('active');
    });
  },

  canAccess(page) {
    if (!this.currentUser) return false;
    if (this.currentUser.role === 'admin') return true;
    return this.currentUser.permissions?.includes(page) || false;
  },

  navigate(page) {
    this.currentPage = page;
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Update page title
    const titles = {
      dashboard: 'Tableau de bord',
      products: 'Produits & Stock',
      sales: 'Ventes & Facturation',

      suppliers: 'Fournisseurs',
      clients: 'Clients',
      orders: 'Commandes',
      reports: 'Rapports',
      settings: 'Paramètres'
    };
    document.getElementById('page-title').textContent = titles[page] || page;

    // Render page
    const content = document.getElementById('content-area');
    content.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-tertiary)">Chargement...</div>';

    switch (page) {
      case 'dashboard': Dashboard.render(content); break;
      case 'products': Products.render(content); break;
      case 'sales': Sales.render(content); break;
      case 'suppliers': Suppliers.render(content); break;
      case 'clients': Clients.render(content); break;
      case 'orders': Orders.render(content); break;
      case 'reports': Reports.render(content); break;
      case 'settings': Settings.render(content); break;

      default: content.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🚧</div><div class="empty-state-text">Module en cours de développement</div></div>';
    }
  },

  logout() {
    sessionStorage.removeItem('currentUser');
    this.currentUser = null;
    document.getElementById('app-container').style.display = 'none';
    Auth.showLogin();
  }
};

// ── Toast Notifications ──
const Toast = {
  show(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, duration);
  }
};

// ── SVG Icons Helper ──
const Icons = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6,9 6,2 18,2 18,9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>'
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
