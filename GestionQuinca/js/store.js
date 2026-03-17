/* ══════════════════════════════════════
   STORE.JS - Data Layer (localStorage)
   ══════════════════════════════════════ */

const Store = {
  // ── Core CRUD ──
  getAll(key) {
    return JSON.parse(localStorage.getItem(key) || '[]');
  },
  save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },
  getById(key, id) {
    return this.getAll(key).find(item => item.id === id);
  },
  add(key, item) {
    const items = this.getAll(key);
    item.id = this.nextId(key);
    item.createdAt = new Date().toISOString();
    items.push(item);
    this.save(key, items);
    return item;
  },
  update(key, id, updates) {
    const items = this.getAll(key);
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save(key, items);
      return items[idx];
    }
    return null;
  },
  remove(key, id) {
    const items = this.getAll(key).filter(i => i.id !== id);
    this.save(key, items);
  },
  nextId(key) {
    const items = this.getAll(key);
    return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
  },
  search(key, query, fields) {
    const q = query.toLowerCase();
    return this.getAll(key).filter(item =>
      fields.some(f => String(item[f] || '').toLowerCase().includes(q))
    );
  },

  // ── Demo Data Seed ──
  seed() {
    if (localStorage.getItem('_seeded_reset')) return;

    // Users : We only keep the main admin
    this.save('users', [
      { id: 1, username: 'admin', password: 'admin', name: 'Administrateur', role: 'admin', permissions: ['dashboard', 'products', 'sales', 'suppliers', 'clients', 'orders', 'reports', 'settings'] }
    ]);

    // Categories (Pré-remplies avec les rayons habituels d'une quincaillerie)
    this.save('categories', [
      { id: 1, name: 'Outillage à main', emoji: '🔨' },
      { id: 2, name: 'Outillage électroportatif', emoji: '⚡' },
      { id: 3, name: 'Plomberie & Sanitaire', emoji: '🚿' },
      { id: 4, name: 'Peinture & Droguerie', emoji: '🎨' },
      { id: 5, name: 'Visserie & Boulonnerie', emoji: '🔩' },
      { id: 6, name: 'Serrurerie & Sécurité', emoji: '🔒' },
      { id: 7, name: 'Jardin & Extérieur', emoji: '🌱' },
      { id: 8, name: 'Gros-œuvre & Matériaux', emoji: '🧱' },
      { id: 9, name: 'Électricité & Éclairage', emoji: '💡' },
      { id: 10, name: 'Quincaillerie de meuble', emoji: '🚪' },
      { id: 11, name: 'EPI & Sécurité au travail', emoji: '🦺' }
    ]);

    // Products
    this.save('products', []);

    // Suppliers
    this.save('suppliers', []);

    // Clients
    this.save('clients', []);

    // Sales
    this.save('sales', []);

    // Orders
    this.save('orders', []);

    // Invoices
    this.save('invoices', []);

    // Quotes (Devis)
    this.save('quotes', []);

    // Activity log
    this.save('activityLog', [
      { id: 1, date: new Date().toISOString(), user: 'admin', action: 'Système réinitialisé à zéro', type: 'warning' }
    ]);

    localStorage.setItem('_seeded_reset', '1');
  },

  // ── Helpers ──
  formatPrice(amount) {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  },
  formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },
  formatDateTime(dateStr) {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
  getCriticalProducts() {
    return this.getAll('products').filter(p => p.stock <= p.minStock);
  },
  getTodaySales() {
    const today = new Date().toDateString();
    return this.getAll('sales').filter(s => new Date(s.date).toDateString() === today);
  },
  getTotalRevenue(days = 30) {
    const since = Date.now() - days * 86400000;
    return this.getAll('sales')
      .filter(s => new Date(s.date).getTime() >= since)
      .reduce((sum, s) => sum + s.total, 0);
  }
};
