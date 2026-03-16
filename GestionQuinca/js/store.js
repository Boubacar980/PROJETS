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
    if (localStorage.getItem('_seeded')) return;

    // Users
    this.save('users', [
      { id: 1, username: 'admin', password: 'admin', name: 'Administrateur', role: 'admin', permissions: ['dashboard', 'products', 'sales', 'suppliers', 'clients', 'orders', 'reports', 'settings'] },
      { id: 2, username: 'vendeur', password: 'vendeur', name: 'Moussa Diallo', role: 'vendeur', permissions: ['dashboard', 'sales', 'products', 'clients'] },
      { id: 3, username: 'magasinier', password: 'magasin', name: 'Ibrahim Koné', role: 'magasinier', permissions: ['dashboard', 'products', 'orders', 'suppliers'] }
    ]);

    // Categories
    this.save('categories', [
      { id: 1, name: 'Outillage', emoji: '🔧' },
      { id: 2, name: 'Électricité', emoji: '⚡' },
      { id: 3, name: 'Plomberie', emoji: '🚿' },
      { id: 4, name: 'Peinture', emoji: '🎨' },
      { id: 5, name: 'Visserie', emoji: '🔩' },
      { id: 6, name: 'Serrurerie', emoji: '🔒' },
      { id: 7, name: 'Jardinage', emoji: '🌱' },
      { id: 8, name: 'Matériaux', emoji: '🧱' }
    ]);

    // Products
    this.save('products', [
      { id: 1, name: 'Marteau 500g', category: 1, price: 4500, costPrice: 2800, stock: 45, minStock: 10, unit: 'pièce', barcode: 'MRT001', emoji: '🔨' },
      { id: 2, name: 'Tournevis cruciforme', category: 1, price: 2000, costPrice: 1200, stock: 60, minStock: 15, unit: 'pièce', barcode: 'TVS001', emoji: '🪛' },
      { id: 3, name: 'Pince universelle', category: 1, price: 3500, costPrice: 2200, stock: 30, minStock: 8, unit: 'pièce', barcode: 'PNC001', emoji: '🔧' },
      { id: 4, name: 'Câble électrique 2.5mm (m)', category: 2, price: 800, costPrice: 450, stock: 500, minStock: 100, unit: 'mètre', barcode: 'CBL001', emoji: '⚡' },
      { id: 5, name: 'Interrupteur simple', category: 2, price: 1500, costPrice: 900, stock: 80, minStock: 20, unit: 'pièce', barcode: 'INT001', emoji: '💡' },
      { id: 6, name: 'Prise double', category: 2, price: 2500, costPrice: 1500, stock: 55, minStock: 15, unit: 'pièce', barcode: 'PRS001', emoji: '🔌' },
      { id: 7, name: 'Tuyau PVC 50mm (m)', category: 3, price: 1200, costPrice: 700, stock: 200, minStock: 50, unit: 'mètre', barcode: 'TYU001', emoji: '🔵' },
      { id: 8, name: 'Robinet lavabo', category: 3, price: 8500, costPrice: 5500, stock: 3, minStock: 5, unit: 'pièce', barcode: 'RBN001', emoji: '🚰' },
      { id: 9, name: 'Coude PVC 90°', category: 3, price: 500, costPrice: 250, stock: 120, minStock: 30, unit: 'pièce', barcode: 'CDE001', emoji: '↩️' },
      { id: 10, name: 'Peinture acrylique 5L', category: 4, price: 15000, costPrice: 9500, stock: 20, minStock: 5, unit: 'bidon', barcode: 'PNT001', emoji: '🪣' },
      { id: 11, name: 'Rouleau peinture 25cm', category: 4, price: 3000, costPrice: 1800, stock: 35, minStock: 10, unit: 'pièce', barcode: 'RLU001', emoji: '🖌️' },
      { id: 12, name: 'Vis à bois 5x50 (boîte)', category: 5, price: 2500, costPrice: 1400, stock: 90, minStock: 20, unit: 'boîte', barcode: 'VIS001', emoji: '🔩' },
      { id: 13, name: 'Boulon M8x60 (sachet)', category: 5, price: 1800, costPrice: 1000, stock: 70, minStock: 15, unit: 'sachet', barcode: 'BLN001', emoji: '⚙️' },
      { id: 14, name: 'Cadenas 50mm', category: 6, price: 6000, costPrice: 3800, stock: 2, minStock: 5, unit: 'pièce', barcode: 'CDN001', emoji: '🔒' },
      { id: 15, name: 'Serrure encastrée', category: 6, price: 12000, costPrice: 7500, stock: 15, minStock: 5, unit: 'pièce', barcode: 'SRR001', emoji: '🗝️' },
      { id: 16, name: 'Sécateur', category: 7, price: 5500, costPrice: 3500, stock: 18, minStock: 5, unit: 'pièce', barcode: 'SEC001', emoji: '✂️' },
      { id: 17, name: 'Ciment 50kg', category: 8, price: 5000, costPrice: 4200, stock: 100, minStock: 20, unit: 'sac', barcode: 'CMT001', emoji: '🧱' },
      { id: 18, name: 'Fer à béton 12mm (barre)', category: 8, price: 3500, costPrice: 2800, stock: 7, minStock: 10, unit: 'barre', barcode: 'FER001', emoji: '🏗️' },
      { id: 19, name: 'Scie à métaux', category: 1, price: 4000, costPrice: 2500, stock: 25, minStock: 5, unit: 'pièce', barcode: 'SCM001', emoji: '🪚' },
      { id: 20, name: 'Mètre ruban 5m', category: 1, price: 2500, costPrice: 1500, stock: 40, minStock: 10, unit: 'pièce', barcode: 'MTR001', emoji: '📏' }
    ]);

    // Suppliers
    this.save('suppliers', [
      { id: 1, name: 'QuincaPro SARL', contact: 'Amadou Bah', phone: '+224 620 00 11 22', email: 'contact@quincapro.com', address: 'Conakry, Guinée', notes: 'Fournisseur principal outillage' },
      { id: 2, name: 'ElectroBat', contact: 'Mamadou Sow', phone: '+224 625 33 44 55', email: 'info@electrobat.com', address: 'Conakry, Guinée', notes: 'Matériel électrique' },
      { id: 3, name: 'PlombiService', contact: 'Oumar Barry', phone: '+224 628 66 77 88', email: 'plombiservice@mail.com', address: 'Conakry, Guinée', notes: 'Plomberie et sanitaire' },
      { id: 4, name: 'MatériauPlus', contact: 'Ibrahima Diallo', phone: '+224 621 99 00 11', email: 'materiauplus@mail.com', address: 'Conakry, Guinée', notes: 'Ciment, fer, matériaux de construction' }
    ]);

    // Clients
    this.save('clients', [
      { id: 1, name: 'Alpha Bah', phone: '+224 622 11 22 33', email: 'alpha@mail.com', address: 'Kaloum', loyalty: 150, totalPurchases: 245000 },
      { id: 2, name: 'Fatoumata Camara', phone: '+224 625 44 55 66', email: 'fatou@mail.com', address: 'Ratoma', loyalty: 85, totalPurchases: 128000 },
      { id: 3, name: 'Mamadou Diallo', phone: '+224 628 77 88 99', email: 'mamadou@mail.com', address: 'Matam', loyalty: 320, totalPurchases: 567000 },
      { id: 4, name: 'Aissatou Balde', phone: '+224 620 12 34 56', email: 'aissatou@mail.com', address: 'Dixinn', loyalty: 45, totalPurchases: 67000 },
      { id: 5, name: 'Entreprise BTP Alpha', phone: '+224 621 98 76 54', email: 'btp@mail.com', address: 'Matoto', loyalty: 500, totalPurchases: 1250000 }
    ]);

    // Sales (demo history)
    const now = Date.now();
    const day = 86400000;
    this.save('sales', [
      { id: 1, date: new Date(now - day * 0).toISOString(), clientId: 1, items: [{ productId: 1, qty: 2, price: 4500 }, { productId: 12, qty: 3, price: 2500 }], total: 16500, payment: 'espèces', status: 'completed' },
      { id: 2, date: new Date(now - day * 0).toISOString(), clientId: 3, qty: 1, items: [{ productId: 17, qty: 10, price: 5000 }, { productId: 18, qty: 5, price: 3500 }], total: 67500, payment: 'mobile', status: 'completed' },
      { id: 3, date: new Date(now - day * 1).toISOString(), clientId: 2, items: [{ productId: 5, qty: 4, price: 1500 }, { productId: 6, qty: 2, price: 2500 }], total: 11000, payment: 'carte', status: 'completed' },
      { id: 4, date: new Date(now - day * 1).toISOString(), clientId: 5, items: [{ productId: 17, qty: 20, price: 5000 }, { productId: 18, qty: 10, price: 3500 }], total: 135000, payment: 'mobile', status: 'completed' },
      { id: 5, date: new Date(now - day * 2).toISOString(), clientId: null, items: [{ productId: 10, qty: 1, price: 15000 }, { productId: 11, qty: 2, price: 3000 }], total: 21000, payment: 'espèces', status: 'completed' },
      { id: 6, date: new Date(now - day * 3).toISOString(), clientId: 4, items: [{ productId: 14, qty: 1, price: 6000 }], total: 6000, payment: 'espèces', status: 'completed' },
      { id: 7, date: new Date(now - day * 5).toISOString(), clientId: 1, items: [{ productId: 3, qty: 1, price: 3500 }, { productId: 2, qty: 2, price: 2000 }], total: 7500, payment: 'espèces', status: 'completed' },
      { id: 8, date: new Date(now - day * 7).toISOString(), clientId: 3, items: [{ productId: 7, qty: 20, price: 1200 }, { productId: 9, qty: 10, price: 500 }], total: 29000, payment: 'mobile', status: 'completed' }
    ]);

    // Orders
    this.save('orders', [
      { id: 1, supplierId: 1, date: new Date(now - day * 3).toISOString(), items: [{ productId: 1, qty: 50, price: 2800 }, { productId: 3, qty: 30, price: 2200 }], total: 206000, status: 'livrée', expectedDate: new Date(now - day * 1).toISOString() },
      { id: 2, supplierId: 4, date: new Date(now - day * 1).toISOString(), items: [{ productId: 17, qty: 100, price: 4200 }, { productId: 18, qty: 50, price: 2800 }], total: 560000, status: 'en cours', expectedDate: new Date(now + day * 3).toISOString() },
      { id: 3, supplierId: 2, date: new Date(now).toISOString(), items: [{ productId: 4, qty: 500, price: 450 }], total: 225000, status: 'en attente', expectedDate: new Date(now + day * 7).toISOString() }
    ]);

    // Invoices
    this.save('invoices', [
      { id: 1, date: new Date(now - day * 5).toISOString(), dueDate: new Date(now + day * 25).toISOString(), clientId: 5, items: [{ productId: 17, qty: 50, unitPrice: 5000, lineTotal: 250000 }, { productId: 18, qty: 20, unitPrice: 3500, lineTotal: 70000 }], total: 320000, paidAmount: 320000, status: 'payée', payments: [{ date: new Date(now - day * 5).toISOString(), amount: 200000, method: 'mobile', reference: 'OM-78452', user: 'vendeur' }, { date: new Date(now - day * 2).toISOString(), amount: 120000, method: 'espèces', reference: 'Reçu #45', user: 'admin' }] },
      { id: 2, date: new Date(now - day * 3).toISOString(), dueDate: new Date(now + day * 27).toISOString(), clientId: 3, items: [{ productId: 1, qty: 5, unitPrice: 4500, lineTotal: 22500 }, { productId: 15, qty: 2, unitPrice: 12000, lineTotal: 24000 }, { productId: 10, qty: 3, unitPrice: 15000, lineTotal: 45000 }], total: 91500, paidAmount: 50000, status: 'partielle', payments: [{ date: new Date(now - day * 2).toISOString(), amount: 50000, method: 'carte', reference: 'CB-9981', user: 'vendeur' }] },
      { id: 3, date: new Date(now - day * 1).toISOString(), dueDate: new Date(now + day * 29).toISOString(), clientId: 1, items: [{ productId: 4, qty: 100, unitPrice: 800, lineTotal: 80000 }, { productId: 5, qty: 10, unitPrice: 1500, lineTotal: 15000 }], total: 95000, paidAmount: 0, status: 'impayée', payments: [] }
    ]);

    // Quotes (Devis)
    this.save('quotes', [
      { id: 1, date: new Date(now - day * 2).toISOString(), validityDate: new Date(now + day * 13).toISOString(), clientId: 2, items: [{ productId: 10, qty: 5, unitPrice: 15000, lineTotal: 75000 }, { productId: 11, qty: 10, unitPrice: 3000, lineTotal: 30000 }], total: 105000, status: 'en attente' }
    ]);

    // Activity log
    this.save('activityLog', [
      { id: 1, date: new Date(now).toISOString(), user: 'admin', action: 'Connexion au système', type: 'info' },
      { id: 2, date: new Date(now - day * 0.1).toISOString(), user: 'vendeur', action: 'Vente #1 - 16 500 FCFA', type: 'success' },
      { id: 3, date: new Date(now - day * 0.2).toISOString(), user: 'admin', action: 'Commande #3 créée pour ElectroBat', type: 'info' }
    ]);

    localStorage.setItem('_seeded', '1');
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
