/* ══════════════════════════════════════
   ORDERS.JS - Purchase Orders Module
   ══════════════════════════════════════ */
const Orders = {
  render(container) {
    const orders = Store.getAll('orders');
    const suppliers = Store.getAll('suppliers');
    container.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-left"><div class="toolbar-search">${Icons.search}<input type="text" id="order-search" placeholder="Rechercher..."></div>
          <select class="form-select" id="order-status-filter" style="width:auto;padding:9px 36px 9px 14px">
            <option value="">Tous les statuts</option><option value="en attente">En attente</option><option value="en cours">En cours</option><option value="livrée">Livrée</option>
          </select>
        </div>
        <div class="toolbar-right"><button class="btn btn-primary" onclick="Orders.openModal()">${Icons.plus} Nouvelle commande</button></div>
      </div>
      <div class="table-container">
        <table><thead><tr><th>#</th><th>Fournisseur</th><th>Date</th><th>Livraison prévue</th><th>Total</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody id="orders-tbody"></tbody></table>
      </div>
      <div class="modal-overlay" id="order-modal">
        <div class="modal" style="max-width:640px">
          <div class="modal-header"><h3 class="modal-title">Nouvelle commande</h3><button class="modal-close" onclick="Orders.closeModal()">✕</button></div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group"><label class="form-label">Fournisseur *</label>
                <select class="form-select" id="ord-supplier">${suppliers.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select>
              </div>
              <div class="form-group"><label class="form-label">Date livraison prévue</label><input class="form-input" type="date" id="ord-date"></div>
            </div>
            <div class="form-group"><label class="form-label">Produits de la commande</label>
              <div id="order-lines"></div>
              <button class="btn btn-sm btn-outline mt-8" onclick="Orders.addLine()">+ Ajouter un produit</button>
            </div>
          </div>
          <div class="modal-footer"><button class="btn btn-outline" onclick="Orders.closeModal()">Annuler</button><button class="btn btn-primary" onclick="Orders.save()">Enregistrer</button></div>
        </div>
      </div>`;
    this.renderTable(orders);
    document.getElementById('order-search').addEventListener('input', () => this.filter());
    document.getElementById('order-status-filter').addEventListener('change', () => this.filter());
  },
  filter() {
    let orders = Store.getAll('orders');
    const status = document.getElementById('order-status-filter').value;
    if (status) orders = orders.filter(o => o.status === status);
    this.renderTable(orders);
  },
  renderTable(data) {
    const suppliers = Store.getAll('suppliers');
    const tbody = document.getElementById('orders-tbody');
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state" style="padding:20px"><div class="empty-state-text">Aucune commande</div></div></td></tr>'; return; }
    tbody.innerHTML = data.sort((a,b) => new Date(b.date)-new Date(a.date)).map(o => {
      const sup = suppliers.find(s=>s.id===o.supplierId);
      const statusClass = o.status==='livrée'?'badge-success':o.status==='en cours'?'badge-info':'badge-warning';
      return `<tr>
        <td class="fw-600">#CMD-${String(o.id).padStart(3,'0')}</td>
        <td>${sup?.name||'-'}</td>
        <td>${Store.formatDate(o.date)}</td>
        <td>${o.expectedDate?Store.formatDate(o.expectedDate):'-'}</td>
        <td class="fw-700">${Store.formatPrice(o.total)}</td>
        <td><span class="badge ${statusClass}">${o.status}</span></td>
        <td><div class="actions-cell">
          ${o.status!=='livrée'?`<button class="btn btn-sm btn-success" onclick="Orders.receive(${o.id})">Réceptionner</button>`:'<span class="text-muted" style="font-size:.78rem">✅</span>'}
          <button class="action-btn danger" onclick="Orders.del(${o.id})">${Icons.trash}</button>
        </div></td></tr>`;
    }).join('');
  },
  openModal() {
    document.getElementById('order-modal').classList.add('active');
    document.getElementById('order-lines').innerHTML = '';
    this.addLine();
    const d = new Date(Date.now()+7*86400000);
    document.getElementById('ord-date').value = d.toISOString().split('T')[0];
  },
  closeModal() { document.getElementById('order-modal').classList.remove('active'); },
  addLine() {
    const products = Store.getAll('products');
    const div = document.createElement('div');
    div.className = 'form-row mt-8';
    div.innerHTML = `
      <div class="form-group"><select class="form-select ord-product">${products.map(p=>`<option value="${p.id}" data-cost="${p.costPrice}">${p.emoji} ${p.name}</option>`).join('')}</select></div>
      <div class="form-group" style="max-width:100px"><input class="form-input ord-qty" type="number" value="10" min="1" placeholder="Qté"></div>
      <div class="form-group" style="max-width:120px"><input class="form-input ord-price" type="number" placeholder="Prix unit." value="${products[0]?.costPrice||0}"></div>
      <button class="btn btn-sm btn-outline" style="height:40px;margin-top:24px" onclick="this.parentElement.remove()">✕</button>`;
    div.querySelector('.ord-product').addEventListener('change', function() {
      const cost = this.selectedOptions[0]?.dataset.cost || 0;
      div.querySelector('.ord-price').value = cost;
    });
    document.getElementById('order-lines').appendChild(div);
  },
  save() {
    const lines = document.querySelectorAll('#order-lines .form-row');
    if (!lines.length) { Toast.show('Ajoutez au moins un produit','error'); return; }
    const items = []; let total = 0;
    lines.forEach(line => {
      const productId = parseInt(line.querySelector('.ord-product').value);
      const qty = parseInt(line.querySelector('.ord-qty').value) || 0;
      const price = parseInt(line.querySelector('.ord-price').value) || 0;
      items.push({ productId, qty, price });
      total += qty * price;
    });
    Store.add('orders', {
      supplierId: parseInt(document.getElementById('ord-supplier').value),
      date: new Date().toISOString(),
      expectedDate: document.getElementById('ord-date').value ? new Date(document.getElementById('ord-date').value).toISOString() : null,
      items, total, status: 'en attente'
    });
    Store.add('activityLog', { user: App.currentUser.username, action: `Commande créée: ${Store.formatPrice(total)}`, type: 'info' });
    Toast.show('Commande créée','success');
    this.closeModal(); this.renderTable(Store.getAll('orders'));
  },
  receive(id) {
    const order = Store.getById('orders', id);
    if (!order || order.status === 'livrée') return;
    // Update stock
    order.items.forEach(item => {
      const product = Store.getById('products', item.productId);
      if (product) Store.update('products', item.productId, { stock: product.stock + item.qty });
    });
    Store.update('orders', id, { status: 'livrée' });
    Store.add('activityLog', { user: App.currentUser.username, action: `Commande #${id} réceptionnée - Stock mis à jour`, type: 'success' });
    Toast.show('Commande réceptionnée, stock mis à jour !','success');
    this.renderTable(Store.getAll('orders'));
    App.updateUserDisplay();
  },
  del(id) { if (confirm('Supprimer cette commande ?')) { Store.remove('orders',id); Toast.show('Supprimée','warning'); this.renderTable(Store.getAll('orders')); } }
};
