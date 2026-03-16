/* ══════════════════════════════════════
   SALES.JS - Ventes, Facturation & Encaissement (module unifié)
   ══════════════════════════════════════ */

const Sales = {
  cart: [],
  paymentMethod: 'espèces',
  selectedClient: null,
  activeTab: 'pos',

  render(container) {
    const categories = Store.getAll('categories');
    const clients = Store.getAll('clients');

    container.innerHTML = `
      <!-- Onglets POS / Factures -->
      <div class="tab-bar" style="margin-bottom:20px;border-bottom:1px solid var(--border-color);padding-bottom:12px">
        <button class="tab-item ${this.activeTab==='pos'?'active':''}" onclick="Sales.switchTab('pos')">🛒 Point de Vente</button>
        <button class="tab-item ${this.activeTab==='invoices'?'active':''}" onclick="Sales.switchTab('invoices')">🧾 Factures</button>
        <button class="tab-item ${this.activeTab==='quotes'?'active':''}" onclick="Sales.switchTab('quotes')">📝 Devis</button>
      </div>
      <div id="sales-tab-content"></div>

      <!-- Modal Encaissement -->
      <div class="modal-overlay" id="payment-modal">
        <div class="modal" style="max-width:480px">
          <div class="modal-header"><h3 class="modal-title">💰 Encaissement</h3><button class="modal-close" onclick="Sales.closePaymentModal()">✕</button></div>
          <div class="modal-body">
            <input type="hidden" id="pay-invoice-id">
            <div style="background:var(--bg-tertiary);border-radius:var(--radius-md);padding:14px;margin-bottom:16px">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span class="text-muted">Facture :</span><span class="fw-700" id="pay-inv-num"></span></div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span class="text-muted">Montant total :</span><span class="fw-700" id="pay-total"></span></div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span class="text-muted">Déjà payé :</span><span class="fw-700 text-success" id="pay-already"></span></div>
              <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid var(--border-color)"><span class="fw-600">Reste à payer :</span><span class="fw-700 text-warning" style="font-size:1.1rem" id="pay-remaining"></span></div>
            </div>
            <div class="form-group"><label class="form-label">Montant à encaisser (FCFA) *</label><input class="form-input" type="number" id="pay-amount" placeholder="0" style="font-size:1.1rem;font-weight:700"></div>
            <div class="form-group"><label class="form-label">Mode de paiement</label>
              <div class="payment-methods">
                <button class="payment-method active" onclick="Sales.setPayMethod('espèces',this)">💵 Espèces</button>
                <button class="payment-method" onclick="Sales.setPayMethod('carte',this)">💳 Carte</button>
                <button class="payment-method" onclick="Sales.setPayMethod('mobile',this)">📱 Mobile</button>
                <button class="payment-method" onclick="Sales.setPayMethod('chèque',this)">📝 Chèque</button>
              </div>
            </div>
            <div class="form-group"><label class="form-label">Référence / Note</label><input class="form-input" id="pay-reference" placeholder="Ex: Reçu n°..."></div>
          </div>
          <div class="modal-footer"><button class="btn btn-outline" onclick="Sales.closePaymentModal()">Annuler</button><button class="btn btn-success" onclick="Sales.processPayment()">💰 Encaisser</button></div>
        </div>
      </div>

      <!-- Modal Détail Facture -->
      <div class="modal-overlay" id="invoice-detail-modal">
        <div class="modal" style="max-width:650px">
          <div class="modal-header"><h3 class="modal-title" id="detail-title">Facture</h3><button class="modal-close" onclick="Sales.closeDetailModal()">✕</button></div>
          <div class="modal-body" id="invoice-detail-body"></div>
          <div class="modal-footer"><button class="btn btn-outline" onclick="Sales.closeDetailModal()">Fermer</button><button class="btn btn-outline" onclick="Sales.printInvoice()">${Icons.print} Imprimer</button></div>
        </div>
      </div>
    `;

    this.renderTab();
  },

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.tab-bar .tab-item').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab-item[onclick="Sales.switchTab('${tab}')"]`)?.classList.add('active');
    this.renderTab();
  },

  renderTab() {
    const content = document.getElementById('sales-tab-content');
    if (!content) return;
    if (this.activeTab === 'pos') {
      this.renderPOS(content);
    } else if (this.activeTab === 'invoices') {
      this.renderInvoices(content);
    } else {
      this.renderQuotes(content);
    }
  },

  /* ═══════════════════════════════════
     TAB 1 : POINT DE VENTE (POS)
     ═══════════════════════════════════ */
  renderPOS(container) {
    const categories = Store.getAll('categories');
    container.innerHTML = `
      <div class="pos-container">
        <div class="pos-products">
          <div class="toolbar" style="margin-bottom:12px">
            <div class="toolbar-left" style="flex:1">
              <div class="toolbar-search" style="flex:1">${Icons.search}<input type="text" id="pos-search" placeholder="Rechercher un produit..." style="width:100%"></div>
            </div>
          </div>
          <div class="tab-bar" id="pos-categories">
            <button class="tab-item active" data-cat="">Tous</button>
            ${categories.map(c => `<button class="tab-item" data-cat="${c.id}">${c.emoji} ${c.name}</button>`).join('')}
          </div>
          <div class="pos-product-grid" id="pos-grid"></div>
        </div>
        <div class="pos-cart">
          <div class="pos-cart-header"><h3 style="font-size:.95rem;font-weight:700">🛒 Panier</h3><button class="btn btn-sm btn-outline" onclick="Sales.clearCart()">Vider</button></div>
          <div style="padding:8px 18px;border-bottom:1px solid var(--border-color)">
            <select class="form-select" id="pos-client" style="font-size:.82rem;padding:7px 12px">
              <option value="">Client anonyme</option>
              ${Store.getAll('clients').map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="pos-cart-items" id="cart-items">
            <div class="empty-state" style="padding:30px"><div class="empty-state-icon">🛒</div><div class="empty-state-text">Panier vide</div></div>
          </div>
          <div class="pos-cart-summary" id="cart-summary" style="display:none">
            <div class="cart-summary-row"><span>Sous-total</span><span id="cart-subtotal">0 FCFA</span></div>
            <div class="cart-summary-row"><span>Articles</span><span id="cart-count">0</span></div>
            <div class="cart-summary-row total"><span>Total</span><span id="cart-total">0 FCFA</span></div>
          </div>
          <div class="pos-cart-actions">
            <div class="payment-methods" id="pos-payment-methods">
              <button class="payment-method active" onclick="Sales.setPosPayment('espèces',this)">💵 Espèces</button>
              <button class="payment-method" onclick="Sales.setPosPayment('carte',this)">💳 Carte</button>
              <button class="payment-method" onclick="Sales.setPosPayment('mobile',this)">📱 Mobile</button>
            </div>
            <button class="btn btn-success btn-lg w-full" onclick="Sales.checkout()" id="checkout-btn" disabled>Encaisser & Facturer</button>
          </div>
        </div>
      </div>
    `;

    this.renderGrid();
    document.getElementById('pos-search').addEventListener('input', () => this.renderGrid());
    document.getElementById('pos-categories').addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-item')) {
        document.querySelectorAll('#pos-categories .tab-item').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.renderGrid();
      }
    });
    document.getElementById('pos-client').addEventListener('change', (e) => {
      this.selectedClient = e.target.value ? parseInt(e.target.value) : null;
    });
  },

  renderGrid() {
    const search = document.getElementById('pos-search')?.value.toLowerCase() || '';
    const catFilter = document.querySelector('#pos-categories .tab-item.active')?.dataset.cat || '';
    let products = Store.getAll('products').filter(p => p.stock > 0);
    if (search) products = products.filter(p => p.name.toLowerCase().includes(search) || (p.barcode || '').toLowerCase().includes(search));
    if (catFilter) products = products.filter(p => p.category === parseInt(catFilter));

    const grid = document.getElementById('pos-grid');
    if (!grid) return;
    grid.innerHTML = products.map(p => `
      <div class="pos-product-card" onclick="Sales.addToCart(${p.id})">
        <div class="product-emoji">${p.emoji || '📦'}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-price">${Store.formatPrice(p.price)}</div>
        <div class="product-stock">Stock: ${p.stock} ${p.unit}</div>
      </div>
    `).join('') || '<div class="empty-state" style="grid-column:1/-1;padding:40px"><div class="empty-state-icon">🔍</div><div class="empty-state-text">Aucun produit trouvé</div></div>';
  },

  addToCart(productId) {
    const product = Store.getById('products', productId);
    if (!product) return;
    const existing = this.cart.find(i => i.productId === productId);
    if (existing) {
      if (existing.qty >= product.stock) { Toast.show('Stock insuffisant', 'warning'); return; }
      existing.qty++;
    } else {
      this.cart.push({ productId, name: product.name, price: product.price, qty: 1, maxStock: product.stock });
    }
    this.renderCart();
  },

  renderCart() {
    const cartItems = document.getElementById('cart-items');
    const summary = document.getElementById('cart-summary');
    const checkoutBtn = document.getElementById('checkout-btn');
    if (!cartItems) return;

    if (this.cart.length === 0) {
      cartItems.innerHTML = '<div class="empty-state" style="padding:30px"><div class="empty-state-icon">🛒</div><div class="empty-state-text">Panier vide</div></div>';
      if (summary) summary.style.display = 'none';
      if (checkoutBtn) checkoutBtn.disabled = true;
      return;
    }

    if (summary) summary.style.display = 'block';
    if (checkoutBtn) checkoutBtn.disabled = false;

    cartItems.innerHTML = this.cart.map((item, i) => `
      <div class="cart-item">
        <div class="cart-item-info"><div class="cart-item-name">${item.name}</div><div class="cart-item-price">${Store.formatPrice(item.price)} × ${item.qty}</div></div>
        <div class="cart-item-qty"><button class="qty-btn" onclick="Sales.updateQty(${i},-1)">−</button><span style="font-weight:700;min-width:20px;text-align:center">${item.qty}</span><button class="qty-btn" onclick="Sales.updateQty(${i},1)">+</button></div>
        <div class="cart-item-total">${Store.formatPrice(item.price * item.qty)}</div>
        <button class="cart-item-remove" onclick="Sales.removeFromCart(${i})">✕</button>
      </div>
    `).join('');

    const subtotal = this.cart.reduce((s, i) => s + i.price * i.qty, 0);
    const count = this.cart.reduce((s, i) => s + i.qty, 0);
    document.getElementById('cart-subtotal').textContent = Store.formatPrice(subtotal);
    document.getElementById('cart-count').textContent = count;
    document.getElementById('cart-total').textContent = Store.formatPrice(subtotal);
  },

  updateQty(index, delta) {
    const item = this.cart[index]; if (!item) return;
    const newQty = item.qty + delta;
    if (newQty <= 0) { this.removeFromCart(index); return; }
    if (newQty > item.maxStock) { Toast.show('Stock insuffisant', 'warning'); return; }
    item.qty = newQty; this.renderCart();
  },

  removeFromCart(index) { this.cart.splice(index, 1); this.renderCart(); },
  clearCart() { this.cart = []; this.renderCart(); },

  setPosPayment(method, btn) {
    this.paymentMethod = method;
    document.querySelectorAll('#pos-payment-methods .payment-method').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  },

  checkout() {
    if (this.cart.length === 0) return;
    const total = this.cart.reduce((s, i) => s + i.price * i.qty, 0);

    // 1. Save sale
    const sale = { date: new Date().toISOString(), clientId: this.selectedClient, items: this.cart.map(i => ({ productId: i.productId, qty: i.qty, price: i.price })), total, payment: this.paymentMethod, status: 'completed' };
    Store.add('sales', sale);

    // 2. Auto-create invoice (payée)
    const invoice = Store.add('invoices', {
      date: new Date().toISOString(),
      dueDate: new Date().toISOString(),
      clientId: this.selectedClient,
      items: this.cart.map(i => ({ productId: i.productId, qty: i.qty, unitPrice: i.price, lineTotal: i.qty * i.price })),
      total,
      paidAmount: total,
      status: 'payée',
      payments: [{ date: new Date().toISOString(), amount: total, method: this.paymentMethod, reference: 'Vente directe', user: App.currentUser.username }]
    });

    // 3. Update stock
    this.cart.forEach(item => {
      const product = Store.getById('products', item.productId);
      if (product) Store.update('products', item.productId, { stock: product.stock - item.qty });
    });

    // 4. Update client
    if (this.selectedClient) {
      const client = Store.getById('clients', this.selectedClient);
      if (client) Store.update('clients', this.selectedClient, { totalPurchases: (client.totalPurchases || 0) + total, loyalty: (client.loyalty || 0) + Math.floor(total / 1000) });
    }

    // 5. Log
    const clientName = this.selectedClient ? Store.getById('clients', this.selectedClient)?.name : 'Anonyme';
    Store.add('activityLog', { user: App.currentUser.username, action: `Vente & Facture FACT-${String(invoice.id).padStart(4, '0')} : ${Store.formatPrice(total)} - ${clientName}`, type: 'success' });

    Toast.show(`Vente enregistrée & facture FACT-${String(invoice.id).padStart(4, '0')} créée : ${Store.formatPrice(total)}`, 'success');
    this.cart = []; this.selectedClient = null;
    this.render(document.getElementById('content-area'));
    App.updateUserDisplay();
  },

  /* ═══════════════════════════════════
     TAB 2 : FACTURES
     ═══════════════════════════════════ */
  renderInvoices(container) {
    const invoices = Store.getAll('invoices');
    const clients = Store.getAll('clients');

    const paid = invoices.filter(i => i.status === 'payée').reduce((s, i) => s + i.total, 0);
    const partials = invoices.filter(i => i.status === 'partielle');
    const paidFromPartials = partials.reduce((s, i) => s + (i.paidAmount || 0), 0);
    const pendingAmount = partials.reduce((s, i) => s + (i.total - (i.paidAmount || 0)), 0);
    const unpaidAmount = invoices.filter(i => i.status === 'impayée').reduce((s, i) => s + i.total, 0);

    container.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="toolbar-search">${Icons.search}<input type="text" id="invoice-search" placeholder="Rechercher une facture..."></div>
          <select class="form-select" id="invoice-status-filter" style="width:auto;padding:9px 36px 9px 14px">
            <option value="">Tous les statuts</option><option value="payée">Payée</option><option value="partielle">Partielle</option><option value="impayée">Impayée</option>
          </select>
        </div>
        <div class="toolbar-right">
          <button class="btn btn-primary" onclick="Sales.openCreateInvoiceModal()">${Icons.plus} Nouvelle facture</button>
        </div>
      </div>
      <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi-card success"><div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div><div class="kpi-info"><div class="kpi-label">Total encaissé</div><div class="kpi-value">${Store.formatPrice(paid + paidFromPartials)}</div></div></div>
        <div class="kpi-card warning"><div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div class="kpi-info"><div class="kpi-label">En attente</div><div class="kpi-value">${Store.formatPrice(pendingAmount)}</div></div></div>
        <div class="kpi-card danger"><div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><div class="kpi-info"><div class="kpi-label">Impayées</div><div class="kpi-value">${Store.formatPrice(unpaidAmount)}</div></div></div>
        <div class="kpi-card primary"><div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><div class="kpi-info"><div class="kpi-label">Total factures</div><div class="kpi-value">${invoices.length}</div></div></div>
      </div>
      <div class="table-container"><table>
        <thead><tr><th>N° Facture</th><th>Date</th><th>Client</th><th>Montant total</th><th>Payé</th><th>Reste</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody id="invoices-tbody"></tbody>
      </table></div>

      <!-- Modal Créer Facture -->
      <div class="modal-overlay" id="invoice-create-modal">
        <div class="modal" style="max-width:700px">
          <div class="modal-header"><h3 class="modal-title">Nouvelle Facture</h3><button class="modal-close" onclick="Sales.closeCreateInvoiceModal()">✕</button></div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group"><label class="form-label">Client *</label><select class="form-select" id="inv-client"><option value="">-- Sélectionner --</option>${clients.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
              <div class="form-group"><label class="form-label">Date d'échéance</label><input class="form-input" type="date" id="inv-due-date"></div>
            </div>
            <div class="form-group"><label class="form-label">Articles</label><div id="inv-lines"></div><button class="btn btn-sm btn-outline mt-8" onclick="Sales.addInvLine()">+ Ajouter un article</button></div>
            <div style="margin-top:16px;padding:14px;background:var(--bg-tertiary);border-radius:var(--radius-md);display:flex;justify-content:space-between;align-items:center"><span class="fw-600">Total :</span><span class="fw-700" style="font-size:1.2rem;color:var(--accent-400)" id="inv-total-preview">0 FCFA</span></div>
          </div>
          <div class="modal-footer"><button class="btn btn-outline" onclick="Sales.closeCreateInvoiceModal()">Annuler</button><button class="btn btn-primary" onclick="Sales.saveInvoice()">Créer la facture</button></div>
        </div>
      </div>
    `;

    this.renderInvoiceTable(invoices);
    document.getElementById('invoice-search').addEventListener('input', () => this.filterInvoices());
    document.getElementById('invoice-status-filter').addEventListener('change', () => this.filterInvoices());
  },

  renderInvoiceTable(data) {
    const clients = Store.getAll('clients');
    const tbody = document.getElementById('invoices-tbody');
    if (!tbody) return;
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state" style="padding:30px"><div class="empty-state-icon">🧾</div><div class="empty-state-text">Aucune facture</div></div></td></tr>'; return; }

    tbody.innerHTML = data.sort((a,b) => new Date(b.date)-new Date(a.date)).map(inv => {
      const client = clients.find(c => c.id === inv.clientId);
      const remaining = inv.total - (inv.paidAmount || 0);
      const sc = inv.status==='payée'?'badge-success':inv.status==='partielle'?'badge-warning':'badge-danger';
      const si = inv.status==='payée'?'✅':inv.status==='partielle'?'⏳':'❌';
      return `<tr>
        <td class="fw-700" style="color:var(--primary-400)">FACT-${String(inv.id).padStart(4,'0')}</td>
        <td>${Store.formatDate(inv.date)}</td>
        <td class="fw-600">${client?.name||'Anonyme'}</td>
        <td class="fw-700">${Store.formatPrice(inv.total)}</td>
        <td class="text-success fw-600">${Store.formatPrice(inv.paidAmount||0)}</td>
        <td class="${remaining>0?'text-warning':'text-success'} fw-600">${Store.formatPrice(remaining)}</td>
        <td><span class="badge ${sc}">${si} ${inv.status}</span></td>
        <td><div class="actions-cell">
          <button class="action-btn" title="Voir" onclick="Sales.viewDetail(${inv.id})">${Icons.eye}</button>
          ${inv.status!=='payée'?`<button class="btn btn-sm btn-success" onclick="Sales.openPaymentModal(${inv.id})">💰 Encaisser</button>`:''}
          <button class="action-btn danger" title="Supprimer" onclick="Sales.deleteInvoice(${inv.id})">${Icons.trash}</button>
        </div></td>
      </tr>`;
    }).join('');
  },

  filterInvoices() {
    const q = document.getElementById('invoice-search')?.value || '';
    const status = document.getElementById('invoice-status-filter')?.value || '';
    let invoices = Store.getAll('invoices');
    if (q) {
      const ql = q.toLowerCase();
      const clients = Store.getAll('clients');
      const matchIds = clients.filter(c => c.name.toLowerCase().includes(ql)).map(c => c.id);
      invoices = invoices.filter(i => String(i.id).includes(q) || matchIds.includes(i.clientId));
    }
    if (status) invoices = invoices.filter(i => i.status === status);
    this.renderInvoiceTable(invoices);
  },

  // ── Create Invoice Modal ──
  openCreateInvoiceModal() {
    document.getElementById('invoice-create-modal').classList.add('active');
    document.getElementById('inv-lines').innerHTML = '';
    this.addInvLine();
    document.getElementById('inv-due-date').value = new Date(Date.now()+30*86400000).toISOString().split('T')[0];
    document.getElementById('inv-client').value = '';
    this.updateInvTotal();
  },
  closeCreateInvoiceModal() { document.getElementById('invoice-create-modal').classList.remove('active'); },

  addInvLine() {
    const products = Store.getAll('products');
    const div = document.createElement('div');
    div.className = 'form-row mt-8'; div.style.alignItems = 'end';
    div.innerHTML = `
      <div class="form-group" style="flex:2"><select class="form-select inv-product"><option value="">-- Article --</option>${products.map(p=>`<option value="${p.id}" data-price="${p.price}">${p.emoji} ${p.name} (${Store.formatPrice(p.price)})</option>`).join('')}</select></div>
      <div class="form-group" style="max-width:80px"><input class="form-input inv-qty" type="number" value="1" min="1"></div>
      <div class="form-group" style="max-width:130px"><input class="form-input inv-unit-price" type="number" placeholder="Prix"></div>
      <div class="form-group" style="max-width:130px"><input class="form-input inv-line-total" readonly style="background:var(--bg-tertiary);color:var(--accent-400);font-weight:700"></div>
      <button class="btn btn-sm btn-outline" style="height:40px;margin-bottom:16px" onclick="this.parentElement.remove();Sales.updateInvTotal()">✕</button>`;
    const ps=div.querySelector('.inv-product'), qi=div.querySelector('.inv-qty'), pi=div.querySelector('.inv-unit-price'), ti=div.querySelector('.inv-line-total');
    const upd = ()=>{ ti.value=Store.formatPrice((parseInt(qi.value)||0)*(parseInt(pi.value)||0)); this.updateInvTotal(); };
    ps.addEventListener('change',function(){pi.value=this.selectedOptions[0]?.dataset.price||0;upd();});
    qi.addEventListener('input',upd); pi.addEventListener('input',upd);
    document.getElementById('inv-lines').appendChild(div);
  },

  updateInvTotal() {
    let t=0;
    document.querySelectorAll('#inv-lines .form-row').forEach(r=>{t+=(parseInt(r.querySelector('.inv-qty')?.value)||0)*(parseInt(r.querySelector('.inv-unit-price')?.value)||0);});
    const el=document.getElementById('inv-total-preview');
    if(el) el.textContent=Store.formatPrice(t);
  },

  saveInvoice() {
    const clientId=parseInt(document.getElementById('inv-client').value);
    if(!clientId){Toast.show('Sélectionnez un client','error');return;}
    const lines=document.querySelectorAll('#inv-lines .form-row');
    if(!lines.length){Toast.show('Ajoutez au moins un article','error');return;}
    const items=[];let total=0,valid=true;
    lines.forEach(r=>{
      const pid=parseInt(r.querySelector('.inv-product')?.value), qty=parseInt(r.querySelector('.inv-qty')?.value)||0, price=parseInt(r.querySelector('.inv-unit-price')?.value)||0;
      if(!pid||!qty||!price){valid=false;return;}
      items.push({productId:pid,qty,unitPrice:price,lineTotal:qty*price}); total+=qty*price;
    });
    if(!valid||!items.length){Toast.show('Remplissez tous les articles','error');return;}
    const inv=Store.add('invoices',{date:new Date().toISOString(),dueDate:document.getElementById('inv-due-date').value?new Date(document.getElementById('inv-due-date').value).toISOString():null,clientId,items,total,paidAmount:0,status:'impayée',payments:[]});
    Store.add('activityLog',{user:App.currentUser.username,action:`Facture FACT-${String(inv.id).padStart(4,'0')} créée: ${Store.formatPrice(total)}`,type:'info'});
    Toast.show(`Facture FACT-${String(inv.id).padStart(4,'0')} créée`,'success');
    this.closeCreateInvoiceModal();
    this.renderInvoices(document.getElementById('sales-tab-content'));
  },

  // ── Payment Modal ──
  _payMethod: 'espèces',
  openPaymentModal(invoiceId) {
    const inv=Store.getById('invoices',invoiceId); if(!inv||inv.status==='payée')return;
    const remaining=inv.total-(inv.paidAmount||0);
    document.getElementById('pay-invoice-id').value=invoiceId;
    document.getElementById('pay-inv-num').textContent=`FACT-${String(inv.id).padStart(4,'0')}`;
    document.getElementById('pay-total').textContent=Store.formatPrice(inv.total);
    document.getElementById('pay-already').textContent=Store.formatPrice(inv.paidAmount||0);
    document.getElementById('pay-remaining').textContent=Store.formatPrice(remaining);
    document.getElementById('pay-amount').value=remaining;
    document.getElementById('pay-reference').value='';
    this._payMethod='espèces';
    document.querySelectorAll('#payment-modal .payment-method').forEach(b=>b.classList.remove('active'));
    document.querySelector('#payment-modal .payment-method').classList.add('active');
    document.getElementById('payment-modal').classList.add('active');
  },
  closePaymentModal(){document.getElementById('payment-modal').classList.remove('active');},
  setPayMethod(m,btn){this._payMethod=m;document.querySelectorAll('#payment-modal .payment-method').forEach(b=>b.classList.remove('active'));btn.classList.add('active');},

  processPayment() {
    const invoiceId=parseInt(document.getElementById('pay-invoice-id').value);
    const amount=parseInt(document.getElementById('pay-amount').value);
    const reference=document.getElementById('pay-reference').value.trim();
    const inv=Store.getById('invoices',invoiceId); if(!inv)return;
    const remaining=inv.total-(inv.paidAmount||0);
    if(!amount||amount<=0){Toast.show('Montant invalide','error');return;}
    if(amount>remaining){Toast.show('Dépasse le reste à payer','error');return;}
    const payment={date:new Date().toISOString(),amount,method:this._payMethod,reference,user:App.currentUser.username};
    const newPaid=(inv.paidAmount||0)+amount;
    Store.update('invoices',invoiceId,{paidAmount:newPaid,status:newPaid>=inv.total?'payée':'partielle',payments:[...(inv.payments||[]),payment]});
    if(inv.clientId){const c=Store.getById('clients',inv.clientId);if(c)Store.update('clients',inv.clientId,{loyalty:(c.loyalty||0)+Math.floor(amount/1000)});}
    Store.add('activityLog',{user:App.currentUser.username,action:`Encaissement ${Store.formatPrice(amount)} sur FACT-${String(invoiceId).padStart(4,'0')} (${this._payMethod})`,type:'success'});
    Toast.show(`Paiement de ${Store.formatPrice(amount)} enregistré !`,'success');
    this.closePaymentModal();
    this.renderInvoices(document.getElementById('sales-tab-content'));
  },

  // ── Invoice Detail ──
  viewDetail(invoiceId) {
    const inv=Store.getById('invoices',invoiceId); if(!inv)return;
    const client=Store.getById('clients',inv.clientId), products=Store.getAll('products'), remaining=inv.total-(inv.paidAmount||0);
    const sc=inv.status==='payée'?'badge-success':inv.status==='partielle'?'badge-warning':'badge-danger';
    document.getElementById('detail-title').textContent=`Facture FACT-${String(inv.id).padStart(4,'0')}`;
    let payHTML='';
    if(inv.payments?.length){payHTML=`<h4 style="margin-top:20px;margin-bottom:10px">💰 Historique des paiements</h4><div class="table-container" style="border:1px solid var(--border-color)"><table><thead><tr><th>Date</th><th>Montant</th><th>Mode</th><th>Réf.</th><th>Par</th></tr></thead><tbody>${inv.payments.map(p=>`<tr><td>${Store.formatDateTime(p.date)}</td><td class="fw-700 text-success">${Store.formatPrice(p.amount)}</td><td><span class="badge badge-primary">${p.method}</span></td><td class="text-muted">${p.reference||'-'}</td><td class="text-muted">${p.user}</td></tr>`).join('')}</tbody></table></div>`;}
    document.getElementById('invoice-detail-body').innerHTML=`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px"><div><div class="text-muted" style="font-size:.78rem">Client</div><div class="fw-700">${client?.name||'Anonyme'}</div><div class="text-muted" style="font-size:.82rem">${client?.phone||''}</div></div><div style="text-align:right"><div class="text-muted" style="font-size:.78rem">Date</div><div class="fw-600">${Store.formatDate(inv.date)}</div>${inv.dueDate?`<div class="text-muted" style="font-size:.82rem">Échéance: ${Store.formatDate(inv.dueDate)}</div>`:''}<div style="margin-top:6px"><span class="badge ${sc}">${inv.status}</span></div></div></div>
      <h4 style="margin-bottom:10px">📋 Articles</h4>
      <div class="table-container" style="border:1px solid var(--border-color)"><table><thead><tr><th>Article</th><th>Qté</th><th>Prix unit.</th><th>Total</th></tr></thead><tbody>${inv.items.map(it=>{const p=products.find(pr=>pr.id===it.productId);return`<tr><td class="fw-600">${p?.emoji||'📦'} ${p?.name||'Inconnu'}</td><td>${it.qty}</td><td>${Store.formatPrice(it.unitPrice)}</td><td class="fw-700">${Store.formatPrice(it.lineTotal)}</td></tr>`;}).join('')}</tbody></table></div>
      <div style="margin-top:16px;padding:14px;background:var(--bg-tertiary);border-radius:var(--radius-md)"><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span>Total</span><span class="fw-700">${Store.formatPrice(inv.total)}</span></div><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span>Payé</span><span class="fw-700 text-success">${Store.formatPrice(inv.paidAmount||0)}</span></div><div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid var(--border-color)"><span class="fw-600">Reste</span><span class="fw-700 ${remaining>0?'text-warning':'text-success'}" style="font-size:1.1rem">${Store.formatPrice(remaining)}</span></div></div>${payHTML}`;
    this._currentDetailId=invoiceId;
    document.getElementById('invoice-detail-modal').classList.add('active');
  },
  closeDetailModal(){document.getElementById('invoice-detail-modal').classList.remove('active');},

  printInvoice() {
    const inv=Store.getById('invoices',this._currentDetailId); if(!inv)return;
    const client=Store.getById('clients',inv.clientId), products=Store.getAll('products');
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>FACT-${String(inv.id).padStart(4,'0')}</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#222;max-width:800px;margin:0 auto}h1{color:#4f46e5;margin-bottom:4px}.sub{color:#666;margin-bottom:30px}table{width:100%;border-collapse:collapse;margin:20px 0}th{background:#f0f0f5;padding:10px;text-align:left;border-bottom:2px solid #ddd;font-size:13px}td{padding:10px;border-bottom:1px solid #eee;font-size:14px}.ts{background:#f8f8fc;padding:16px;border-radius:8px;margin-top:20px}.tr{display:flex;justify-content:space-between;margin-bottom:6px}.tf{font-size:18px;font-weight:bold;border-top:2px solid #ddd;padding-top:10px;margin-top:10px}.hg{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px}.st{display:inline-block;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:bold}@media print{body{padding:20px}}</style></head><body><h1>🔧 QuincaGest</h1><p class="sub">Facture FACT-${String(inv.id).padStart(4,'0')}</p><div class="hg"><div><strong>Client:</strong> ${client?.name||'-'}<br>${client?.phone||''}<br>${client?.address||''}</div><div style="text-align:right"><strong>Date:</strong> ${Store.formatDate(inv.date)}<br>${inv.dueDate?`<strong>Échéance:</strong> ${Store.formatDate(inv.dueDate)}<br>`:''}<span class="st" style="background:${inv.status==='payée'?'#d1fae5':inv.status==='partielle'?'#fef3c7':'#fee2e2'}">${inv.status.toUpperCase()}</span></div></div><table><thead><tr><th>Article</th><th>Qté</th><th>Prix unit.</th><th>Total</th></tr></thead><tbody>${inv.items.map(it=>{const p=products.find(pr=>pr.id===it.productId);return`<tr><td>${p?.name||'Article'}</td><td>${it.qty}</td><td>${Store.formatPrice(it.unitPrice)}</td><td><strong>${Store.formatPrice(it.lineTotal)}</strong></td></tr>`;}).join('')}</tbody></table><div class="ts"><div class="tr"><span>Total:</span><span><strong>${Store.formatPrice(inv.total)}</strong></span></div><div class="tr"><span>Payé:</span><span style="color:green"><strong>${Store.formatPrice(inv.paidAmount||0)}</strong></span></div><div class="tr tf"><span>Reste:</span><span>${Store.formatPrice(inv.total-(inv.paidAmount||0))}</span></div></div><p style="text-align:center;margin-top:40px;color:#999;font-size:12px">QuincaGest - Gestion de quincaillerie</p></body></html>`;
    const w=window.open('','_blank');w.document.write(html);w.document.close();w.print();
  },

  deleteInvoice(id) {
    if(confirm(`Supprimer la facture FACT-${String(id).padStart(4,'0')} ?`)){
      Store.remove('invoices',id);Toast.show('Facture supprimée','warning');
      Store.add('activityLog',{user:App.currentUser.username,action:`Facture FACT-${String(id).padStart(4,'0')} supprimée`,type:'warning'});
      this.renderInvoices(document.getElementById('sales-tab-content'));
    }
  },

  /* ═══════════════════════════════════
     TAB 3 : DEVIS (QUOTES)
     ═══════════════════════════════════ */
  renderQuotes(container) {
    const quotes = Store.getAll('quotes');
    const clients = Store.getAll('clients');
    const pending = quotes.filter(q => q.status === 'en attente').reduce((s, q) => s + q.total, 0);

    container.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="toolbar-search">${Icons.search}<input type="text" id="quote-search" placeholder="Rechercher un devis..."></div>
        </div>
        <div class="toolbar-right">
          <button class="btn btn-primary" onclick="Sales.openCreateQuoteModal()">${Icons.plus} Nouveau devis</button>
        </div>
      </div>
      <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi-card info"><div class="kpi-icon" style="background:rgba(56,189,248,0.1);color:#38bdf8"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg></div><div class="kpi-info"><div class="kpi-label">Total devis émis</div><div class="kpi-value">${quotes.length}</div></div></div>
        <div class="kpi-card warning"><div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div class="kpi-info"><div class="kpi-label">Montant en attente</div><div class="kpi-value">${Store.formatPrice(pending)}</div></div></div>
      </div>
      <div class="table-container"><table>
        <thead><tr><th>N° Devis</th><th>Date</th><th>Client</th><th>Validité</th><th>Montant total</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody id="quotes-tbody"></tbody>
      </table></div>

      <!-- Modal Créer Devis -->
      <div class="modal-overlay" id="quote-create-modal">
        <div class="modal" style="max-width:700px">
          <div class="modal-header"><h3 class="modal-title">Nouveau Devis</h3><button class="modal-close" onclick="Sales.closeCreateQuoteModal()">✕</button></div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group"><label class="form-label">Client *</label><select class="form-select" id="quote-client"><option value="">-- Sélectionner --</option>${clients.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
              <div class="form-group"><label class="form-label">Date de validité</label><input class="form-input" type="date" id="quote-validity-date"></div>
            </div>
            <div class="form-group"><label class="form-label">Articles</label><div id="quote-lines"></div><button class="btn btn-sm btn-outline mt-8" onclick="Sales.addQuoteLine()">+ Ajouter un article</button></div>
            <div style="margin-top:16px;padding:14px;background:var(--bg-tertiary);border-radius:var(--radius-md);display:flex;justify-content:space-between;align-items:center"><span class="fw-600">Total :</span><span class="fw-700" style="font-size:1.2rem;color:var(--accent-400)" id="quote-total-preview">0 FCFA</span></div>
          </div>
          <div class="modal-footer"><button class="btn btn-outline" onclick="Sales.closeCreateQuoteModal()">Annuler</button><button class="btn btn-primary" onclick="Sales.saveQuote()">Créer le devis</button></div>
        </div>
      </div>

      <!-- Modal Détail Devis -->
      <div class="modal-overlay" id="quote-detail-modal">
        <div class="modal" style="max-width:650px">
          <div class="modal-header"><h3 class="modal-title" id="quote-detail-title">Devis</h3><button class="modal-close" onclick="Sales.closeQuoteDetailModal()">✕</button></div>
          <div class="modal-body" id="quote-detail-body"></div>
          <div class="modal-footer">
            <button class="btn btn-outline" onclick="Sales.closeQuoteDetailModal()">Fermer</button>
            <button class="btn btn-success" id="btn-convert-quote" onclick="Sales.convertQuoteToInvoice()">${Icons.check} Convertir en facture</button>
            <button class="btn btn-outline" onclick="Sales.printQuote()">${Icons.print} Imprimer</button>
          </div>
        </div>
      </div>
    `;

    this.renderQuoteTable(quotes);
    document.getElementById('quote-search').addEventListener('input', () => this.filterQuotes());
  },

  renderQuoteTable(data) {
    const clients = Store.getAll('clients');
    const tbody = document.getElementById('quotes-tbody');
    if (!tbody) return;
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state" style="padding:30px"><div class="empty-state-icon">📝</div><div class="empty-state-text">Aucun devis</div></div></td></tr>'; return; }

    tbody.innerHTML = data.sort((a,b) => new Date(b.date)-new Date(a.date)).map(q => {
      const client = clients.find(c => c.id === q.clientId);
      const sc = q.status==='accepté'?'badge-success':q.status==='en attente'?'badge-warning':'badge-danger';
      return `<tr>
        <td class="fw-700" style="color:var(--primary-400)">DEV-${String(q.id).padStart(4,'0')}</td>
        <td>${Store.formatDate(q.date)}</td>
        <td class="fw-600">${client?.name||'Anonyme'}</td>
        <td>${q.validityDate?Store.formatDate(q.validityDate):'-'}</td>
        <td class="fw-700">${Store.formatPrice(q.total)}</td>
        <td><span class="badge ${sc}">${q.status}</span></td>
        <td><div class="actions-cell">
          <button class="action-btn" title="Voir" onclick="Sales.viewQuoteDetail(${q.id})">${Icons.eye}</button>
          ${(q.status !== 'accepté' && q.status !== 'facturé') ? `<button class="btn btn-sm btn-success" onclick="Sales.quickConvertQuote(${q.id})">Facturer</button>` : ''}
          <button class="action-btn danger" title="Supprimer" onclick="Sales.deleteQuote(${q.id})">${Icons.trash}</button>
        </div></td>
      </tr>`;
    }).join('');
  },

  filterQuotes() {
    const q = document.getElementById('quote-search')?.value.toLowerCase() || '';
    let quotes = Store.getAll('quotes');
    if (q) {
      const clients = Store.getAll('clients');
      const matchIds = clients.filter(c => c.name.toLowerCase().includes(q)).map(c => c.id);
      quotes = quotes.filter(i => String(i.id).includes(q) || matchIds.includes(i.clientId));
    }
    this.renderQuoteTable(quotes);
  },

  openCreateQuoteModal() {
    document.getElementById('quote-create-modal').classList.add('active');
    document.getElementById('quote-lines').innerHTML = '';
    this.addQuoteLine();
    document.getElementById('quote-validity-date').value = new Date(Date.now()+15*86400000).toISOString().split('T')[0];
    document.getElementById('quote-client').value = '';
    this.updateQuoteTotal();
  },
  closeCreateQuoteModal() { document.getElementById('quote-create-modal').classList.remove('active'); },

  addQuoteLine() {
    const products = Store.getAll('products');
    const div = document.createElement('div');
    div.className = 'form-row mt-8'; div.style.alignItems = 'end';
    div.innerHTML = `
      <div class="form-group" style="flex:2"><select class="form-select quote-product"><option value="">-- Article --</option>${products.map(p=>`<option value="${p.id}" data-price="${p.price}">${p.emoji} ${p.name} (${Store.formatPrice(p.price)})</option>`).join('')}</select></div>
      <div class="form-group" style="max-width:80px"><input class="form-input quote-qty" type="number" value="1" min="1"></div>
      <div class="form-group" style="max-width:130px"><input class="form-input quote-unit-price" type="number" placeholder="Prix"></div>
      <div class="form-group" style="max-width:130px"><input class="form-input quote-line-total" readonly style="background:var(--bg-tertiary);color:var(--accent-400);font-weight:700"></div>
      <button class="btn btn-sm btn-outline" style="height:40px;margin-bottom:16px" onclick="this.parentElement.remove();Sales.updateQuoteTotal()">✕</button>`;
    const ps=div.querySelector('.quote-product'), qi=div.querySelector('.quote-qty'), pi=div.querySelector('.quote-unit-price'), ti=div.querySelector('.quote-line-total');
    const upd = ()=>{ ti.value=Store.formatPrice((parseInt(qi.value)||0)*(parseInt(pi.value)||0)); this.updateQuoteTotal(); };
    ps.addEventListener('change',function(){pi.value=this.selectedOptions[0]?.dataset.price||0;upd();});
    qi.addEventListener('input',upd); pi.addEventListener('input',upd);
    document.getElementById('quote-lines').appendChild(div);
  },

  updateQuoteTotal() {
    let t=0;
    document.querySelectorAll('#quote-lines .form-row').forEach(r=>{t+=(parseInt(r.querySelector('.quote-qty')?.value)||0)*(parseInt(r.querySelector('.quote-unit-price')?.value)||0);});
    const el=document.getElementById('quote-total-preview');
    if(el) el.textContent=Store.formatPrice(t);
  },

  saveQuote() {
    const clientId=parseInt(document.getElementById('quote-client').value);
    if(!clientId){Toast.show('Sélectionnez un client','error');return;}
    const lines=document.querySelectorAll('#quote-lines .form-row');
    if(!lines.length){Toast.show('Ajoutez au moins un article','error');return;}
    const items=[];let total=0;
    lines.forEach(r=>{
      const pid=parseInt(r.querySelector('.quote-product')?.value), qty=parseInt(r.querySelector('.quote-qty')?.value)||0, price=parseInt(r.querySelector('.quote-unit-price')?.value)||0;
      if(pid&&qty&&price) { items.push({productId:pid,qty,unitPrice:price,lineTotal:qty*price}); total+=qty*price; }
    });
    if(!items.length){Toast.show('Remplissez tous les articles','error');return;}
    const q=Store.add('quotes',{date:new Date().toISOString(),validityDate:document.getElementById('quote-validity-date').value?new Date(document.getElementById('quote-validity-date').value).toISOString():null,clientId,items,total,status:'en attente'});
    Store.add('activityLog',{user:App.currentUser.username,action:`Devis DEV-${String(q.id).padStart(4,'0')} créé: ${Store.formatPrice(total)}`,type:'info'});
    Toast.show(`Devis DEV-${String(q.id).padStart(4,'0')} créé`,'success');
    this.closeCreateQuoteModal();
    this.renderQuotes(document.getElementById('sales-tab-content'));
  },

  viewQuoteDetail(id) {
    const q=Store.getById('quotes',id); if(!q)return;
    const client=Store.getById('clients',q.clientId), products=Store.getAll('products');
    const sc=q.status==='accepté'?'badge-success':q.status==='en attente'?'badge-warning':'badge-danger';
    document.getElementById('quote-detail-title').textContent=`Devis DEV-${String(q.id).padStart(4,'0')}`;
    document.getElementById('quote-detail-body').innerHTML=`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px"><div><div class="text-muted" style="font-size:.78rem">Client</div><div class="fw-700">${client?.name||'Anonyme'}</div><div class="text-muted" style="font-size:.82rem">${client?.phone||''}</div></div><div style="text-align:right"><div class="text-muted" style="font-size:.78rem">Date</div><div class="fw-600">${Store.formatDate(q.date)}</div>${q.validityDate?`<div class="text-muted" style="font-size:.82rem">Validité: ${Store.formatDate(q.validityDate)}</div>`:''}<div style="margin-top:6px"><span class="badge ${sc}">${q.status}</span></div></div></div>
      <h4 style="margin-bottom:10px">📋 Articles</h4>
      <div class="table-container" style="border:1px solid var(--border-color)"><table><thead><tr><th>Article</th><th>Qté</th><th>Prix unit.</th><th>Total</th></tr></thead><tbody>${q.items.map(it=>{const p=products.find(pr=>pr.id===it.productId);return`<tr><td class="fw-600">${p?.emoji||'📦'} ${p?.name||'Inconnu'}</td><td>${it.qty}</td><td>${Store.formatPrice(it.unitPrice)}</td><td class="fw-700">${Store.formatPrice(it.lineTotal)}</td></tr>`;}).join('')}</tbody></table></div>
      <div style="margin-top:16px;padding:14px;background:var(--bg-tertiary);border-radius:var(--radius-md)"><div style="display:flex;justify-content:space-between;align-items:center"><span class="fw-600">Total</span><span class="fw-700" style="font-size:1.2rem;color:var(--accent-400)">${Store.formatPrice(q.total)}</span></div></div>`;
    this._currentQuoteId=id;
    const btnConv = document.getElementById('btn-convert-quote');
    if (q.status === 'accepté' || q.status === 'facturé') {
      btnConv.style.display = 'none';
    } else {
      btnConv.style.display = 'inline-flex';
    }
    document.getElementById('quote-detail-modal').classList.add('active');
  },
  closeQuoteDetailModal(){document.getElementById('quote-detail-modal').classList.remove('active');},

  printQuote() {
    const q=Store.getById('quotes',this._currentQuoteId); if(!q)return;
    const client=Store.getById('clients',q.clientId), products=Store.getAll('products');
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>DEV-${String(q.id).padStart(4,'0')}</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#222;max-width:800px;margin:0 auto}h1{color:#4f46e5;margin-bottom:4px}.sub{color:#666;margin-bottom:30px}table{width:100%;border-collapse:collapse;margin:20px 0}th{background:#f0f0f5;padding:10px;text-align:left;border-bottom:2px solid #ddd;font-size:13px}td{padding:10px;border-bottom:1px solid #eee;font-size:14px}.ts{background:#f8f8fc;padding:16px;border-radius:8px;margin-top:20px}.tr{display:flex;justify-content:space-between;margin-bottom:6px}.tf{font-size:18px;font-weight:bold;border-top:2px solid #ddd;padding-top:10px;margin-top:10px}.hg{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px}.st{display:inline-block;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:bold}@media print{body{padding:20px}}</style></head><body><h1>🔧 QuincaGest</h1><p class="sub">Devis DEV-${String(q.id).padStart(4,'0')}</p><div class="hg"><div><strong>Client:</strong> ${client?.name||'-'}<br>${client?.phone||''}<br>${client?.address||''}</div><div style="text-align:right"><strong>Date:</strong> ${Store.formatDate(q.date)}<br>${q.validityDate?`<strong>Validité:</strong> ${Store.formatDate(q.validityDate)}<br>`:''}<span class="st" style="background:#fef3c7">${q.status.toUpperCase()}</span></div></div><table><thead><tr><th>Article</th><th>Qté</th><th>Prix unit.</th><th>Total</th></tr></thead><tbody>${q.items.map(it=>{const p=products.find(pr=>pr.id===it.productId);return`<tr><td>${p?.name||'Article'}</td><td>${it.qty}</td><td>${Store.formatPrice(it.unitPrice)}</td><td><strong>${Store.formatPrice(it.lineTotal)}</strong></td></tr>`;}).join('')}</tbody></table><div class="ts"><div class="tr tf"><span>Total:</span><span>${Store.formatPrice(q.total)}</span></div></div><p style="text-align:center;margin-top:40px;color:#999;font-size:12px">Ce devis est valable jusqu'au ${q.validityDate?Store.formatDate(q.validityDate):'--'}.<br>QuincaGest - Gestion de quincaillerie</p></body></html>`;
    const w=window.open('','_blank');w.document.write(html);w.document.close();w.print();
  },

  convertQuoteToInvoice() {
    const q=Store.getById('quotes',this._currentQuoteId); if(!q)return;
    if(!confirm('Convertir ce devis en facture ? Cela le marquera comme accepté.')) return;
    
    Store.update('quotes', q.id, { status: 'facturé' });
    const inv=Store.add('invoices',{date:new Date().toISOString(),dueDate:new Date(Date.now()+30*86400000).toISOString(),clientId:q.clientId,items:q.items,total:q.total,paidAmount:0,status:'impayée',payments:[]});
    Store.add('activityLog',{user:App.currentUser.username,action:`Devis DEV-${String(q.id).padStart(4,'0')} converti en facture FACT-${String(inv.id).padStart(4,'0')}`,type:'success'});
    
    Toast.show(`Devis converti ! Facture FACT-${String(inv.id).padStart(4,'0')} créée.`,'success');
    this.closeQuoteDetailModal();
    this.renderQuotes(document.getElementById('sales-tab-content'));
  },

  quickConvertQuote(id) {
    const q=Store.getById('quotes',id); if(!q)return;
    if(!confirm(`Convertir directement le devis DEV-${String(q.id).padStart(4,'0')} en facture ?`)) return;
    
    Store.update('quotes', q.id, { status: 'facturé' });
    const inv=Store.add('invoices',{date:new Date().toISOString(),dueDate:new Date(Date.now()+30*86400000).toISOString(),clientId:q.clientId,items:q.items,total:q.total,paidAmount:0,status:'impayée',payments:[]});
    Store.add('activityLog',{user:App.currentUser.username,action:`Devis DEV-${String(q.id).padStart(4,'0')} converti en facture FACT-${String(inv.id).padStart(4,'0')}`,type:'success'});
    
    Toast.show(`Devis converti ! Facture FACT-${String(inv.id).padStart(4,'0')} créée.`,'success');
    this.renderQuotes(document.getElementById('sales-tab-content'));
  },

  deleteQuote(id) {
    if(confirm(`Supprimer le devis DEV-${String(id).padStart(4,'0')} ?`)){
      Store.remove('quotes',id);Toast.show('Devis supprimé','warning');
      Store.add('activityLog',{user:App.currentUser.username,action:`Devis DEV-${String(id).padStart(4,'0')} supprimé`,type:'warning'});
      this.renderQuotes(document.getElementById('sales-tab-content'));
    }
  }
};
