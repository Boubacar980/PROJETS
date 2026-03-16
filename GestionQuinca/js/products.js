/* ══════════════════════════════════════
   PRODUCTS.JS - Products & Stock
   ══════════════════════════════════════ */

const Products = {
  render(container) {
    const products = Store.getAll('products');
    const categories = Store.getAll('categories');

    container.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="toolbar-search">
            ${Icons.search}
            <input type="text" id="product-search" placeholder="Rechercher un produit...">
          </div>
          <select class="form-select" id="product-cat-filter" style="width:auto;padding:9px 36px 9px 14px">
            <option value="">Toutes catégories</option>
            ${categories.map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="toolbar-right">
          <button class="btn btn-primary" onclick="Products.openModal()">
            ${Icons.plus} Ajouter un produit
          </button>
        </div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Prix vente</th>
              <th>Prix achat</th>
              <th>Stock</th>
              <th>Seuil min.</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="products-tbody"></tbody>
        </table>
      </div>
      <div class="modal-overlay" id="product-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="product-modal-title">Ajouter un produit</h3>
            <button class="modal-close" onclick="Products.closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="product-edit-id">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nom du produit *</label>
                <input class="form-input" id="prod-name" placeholder="Ex: Marteau 500g">
              </div>
              <div class="form-group">
                <label class="form-label">Catégorie *</label>
                <select class="form-select" id="prod-category">
                  ${categories.map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Prix de vente (FCFA) *</label>
                <input class="form-input" type="number" id="prod-price" placeholder="0">
              </div>
              <div class="form-group">
                <label class="form-label">Prix d'achat (FCFA)</label>
                <input class="form-input" type="number" id="prod-cost" placeholder="0">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Stock actuel</label>
                <input class="form-input" type="number" id="prod-stock" placeholder="0">
              </div>
              <div class="form-group">
                <label class="form-label">Seuil minimum</label>
                <input class="form-input" type="number" id="prod-min" placeholder="5">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Unité</label>
                <select class="form-select" id="prod-unit">
                  <option value="pièce">Pièce</option>
                  <option value="kg">Kilogramme</option>
                  <option value="mètre">Mètre</option>
                  <option value="litre">Litre</option>
                  <option value="boîte">Boîte</option>
                  <option value="sachet">Sachet</option>
                  <option value="sac">Sac</option>
                  <option value="bidon">Bidon</option>
                  <option value="barre">Barre</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Code-barres</label>
                <input class="form-input" id="prod-barcode" placeholder="Ex: MRT001">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" onclick="Products.closeModal()">Annuler</button>
            <button class="btn btn-primary" onclick="Products.saveProduct()">Enregistrer</button>
          </div>
        </div>
      </div>
    `;

    this.renderTable(products);
    document.getElementById('product-search').addEventListener('input', () => this.filterProducts());
    document.getElementById('product-cat-filter').addEventListener('change', () => this.filterProducts());
  },

  renderTable(products) {
    const categories = Store.getAll('categories');
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;

    if (products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state" style="padding:30px"><div class="empty-state-icon">📦</div><div class="empty-state-text">Aucun produit trouvé</div></div></td></tr>';
      return;
    }

    tbody.innerHTML = products.map(p => {
      const cat = categories.find(c => c.id === p.category);
      const statusClass = p.stock === 0 ? 'badge-danger' : p.stock <= p.minStock ? 'badge-warning' : 'badge-success';
      const statusText = p.stock === 0 ? 'Rupture' : p.stock <= p.minStock ? 'Critique' : 'En stock';
      return `<tr>
        <td><div class="product-cell"><div class="product-thumb">${p.emoji || '📦'}</div><div><div class="fw-600">${p.name}</div><div class="text-muted" style="font-size:.75rem">${p.barcode || '-'}</div></div></div></td>
        <td>${cat ? cat.emoji + ' ' + cat.name : '-'}</td>
        <td class="fw-600">${Store.formatPrice(p.price)}</td>
        <td class="text-muted">${Store.formatPrice(p.costPrice)}</td>
        <td class="fw-700">${p.stock} ${p.unit}</td>
        <td class="text-muted">${p.minStock}</td>
        <td><span class="badge ${statusClass}">${statusText}</span></td>
        <td><div class="actions-cell">
          <button class="action-btn" title="Modifier" onclick="Products.editProduct(${p.id})">${Icons.edit}</button>
          <button class="action-btn danger" title="Supprimer" onclick="Products.deleteProduct(${p.id})">${Icons.trash}</button>
        </div></td>
      </tr>`;
    }).join('');
  },

  filterProducts() {
    const q = document.getElementById('product-search').value;
    const cat = document.getElementById('product-cat-filter').value;
    let products = q ? Store.search('products', q, ['name', 'barcode']) : Store.getAll('products');
    if (cat) products = products.filter(p => p.category === parseInt(cat));
    this.renderTable(products);
  },

  openModal(product = null) {
    document.getElementById('product-modal').classList.add('active');
    document.getElementById('product-modal-title').textContent = product ? 'Modifier le produit' : 'Ajouter un produit';
    if (product) {
      document.getElementById('product-edit-id').value = product.id;
      document.getElementById('prod-name').value = product.name;
      document.getElementById('prod-category').value = product.category;
      document.getElementById('prod-price').value = product.price;
      document.getElementById('prod-cost').value = product.costPrice;
      document.getElementById('prod-stock').value = product.stock;
      document.getElementById('prod-min').value = product.minStock;
      document.getElementById('prod-unit').value = product.unit;
      document.getElementById('prod-barcode').value = product.barcode || '';
    } else {
      document.getElementById('product-edit-id').value = '';
      document.querySelectorAll('#product-modal .form-input, #product-modal .form-select').forEach(el => {
        if (el.id !== 'prod-unit' && el.id !== 'prod-category') el.value = '';
      });
    }
  },

  closeModal() {
    document.getElementById('product-modal').classList.remove('active');
  },

  editProduct(id) {
    const product = Store.getById('products', id);
    if (product) this.openModal(product);
  },

  saveProduct() {
    const name = document.getElementById('prod-name').value.trim();
    const price = parseInt(document.getElementById('prod-price').value);
    if (!name || !price) { Toast.show('Nom et prix requis', 'error'); return; }

    const data = {
      name,
      category: parseInt(document.getElementById('prod-category').value),
      price,
      costPrice: parseInt(document.getElementById('prod-cost').value) || 0,
      stock: parseInt(document.getElementById('prod-stock').value) || 0,
      minStock: parseInt(document.getElementById('prod-min').value) || 5,
      unit: document.getElementById('prod-unit').value,
      barcode: document.getElementById('prod-barcode').value.trim(),
      emoji: Store.getById('categories', parseInt(document.getElementById('prod-category').value))?.emoji || '📦'
    };

    const editId = document.getElementById('product-edit-id').value;
    if (editId) {
      Store.update('products', parseInt(editId), data);
      Toast.show('Produit mis à jour', 'success');
      Store.add('activityLog', { user: App.currentUser.username, action: `Produit modifié: ${name}`, type: 'info' });
    } else {
      Store.add('products', data);
      Toast.show('Produit ajouté avec succès', 'success');
      Store.add('activityLog', { user: App.currentUser.username, action: `Nouveau produit: ${name}`, type: 'success' });
    }
    this.closeModal();
    this.filterProducts();
    App.updateUserDisplay();
  },

  deleteProduct(id) {
    const p = Store.getById('products', id);
    if (confirm(`Supprimer "${p.name}" ?`)) {
      Store.remove('products', id);
      Toast.show('Produit supprimé', 'warning');
      Store.add('activityLog', { user: App.currentUser.username, action: `Produit supprimé: ${p.name}`, type: 'warning' });
      this.filterProducts();
      App.updateUserDisplay();
    }
  }
};
