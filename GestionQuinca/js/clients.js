/* ══════════════════════════════════════
   CLIENTS.JS - Clients Module
   ══════════════════════════════════════ */
const Clients = {
  render(container) {
    const clients = Store.getAll('clients');
    container.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-left"><div class="toolbar-search">${Icons.search}<input type="text" id="client-search" placeholder="Rechercher un client..."></div></div>
        <div class="toolbar-right"><button class="btn btn-primary" onclick="Clients.openModal()">${Icons.plus} Ajouter</button></div>
      </div>
      <div class="table-container">
        <table><thead><tr><th>Client</th><th>Téléphone</th><th>Email</th><th>Adresse</th><th>Total achats</th><th>Fidélité</th><th>Actions</th></tr></thead>
        <tbody id="clients-tbody"></tbody></table>
      </div>
      <div class="modal-overlay" id="client-modal">
        <div class="modal">
          <div class="modal-header"><h3 class="modal-title" id="client-modal-title">Ajouter un client</h3><button class="modal-close" onclick="Clients.closeModal()">✕</button></div>
          <div class="modal-body">
            <input type="hidden" id="client-edit-id">
            <div class="form-group"><label class="form-label">Nom complet *</label><input class="form-input" id="cli-name" placeholder="Nom du client"></div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Téléphone</label><input class="form-input" id="cli-phone" placeholder="+224 6XX XX XX XX"></div>
              <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="cli-email" placeholder="email@example.com"></div>
            </div>
            <div class="form-group"><label class="form-label">Adresse</label><input class="form-input" id="cli-address" placeholder="Quartier, Ville"></div>
          </div>
          <div class="modal-footer"><button class="btn btn-outline" onclick="Clients.closeModal()">Annuler</button><button class="btn btn-primary" onclick="Clients.save()">Enregistrer</button></div>
        </div>
      </div>`;
    this.renderTable(clients);
    document.getElementById('client-search').addEventListener('input', () => {
      const q = document.getElementById('client-search').value;
      this.renderTable(q ? Store.search('clients', q, ['name','phone','email']) : Store.getAll('clients'));
    });
  },
  renderTable(data) {
    const tbody = document.getElementById('clients-tbody');
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state" style="padding:20px"><div class="empty-state-text">Aucun client</div></div></td></tr>'; return; }
    tbody.innerHTML = data.map(c => `<tr>
      <td><div class="product-cell"><div class="user-avatar" style="width:32px;height:32px;font-size:.75rem">${c.name.split(' ').map(n=>n[0]).join('').substring(0,2)}</div><span class="fw-600">${c.name}</span></div></td>
      <td>${c.phone||'-'}</td><td class="text-muted">${c.email||'-'}</td><td class="text-muted">${c.address||'-'}</td>
      <td class="fw-600">${Store.formatPrice(c.totalPurchases||0)}</td>
      <td><span class="badge badge-primary">⭐ ${c.loyalty||0} pts</span></td>
      <td><div class="actions-cell">
        <button class="action-btn" onclick="Clients.edit(${c.id})">${Icons.edit}</button>
        <button class="action-btn danger" onclick="Clients.del(${c.id})">${Icons.trash}</button>
      </div></td></tr>`).join('');
  },
  openModal(c=null) {
    document.getElementById('client-modal').classList.add('active');
    document.getElementById('client-modal-title').textContent = c ? 'Modifier' : 'Ajouter un client';
    document.getElementById('client-edit-id').value = c ? c.id : '';
    document.getElementById('cli-name').value = c?.name||''; document.getElementById('cli-phone').value = c?.phone||'';
    document.getElementById('cli-email').value = c?.email||''; document.getElementById('cli-address').value = c?.address||'';
  },
  closeModal() { document.getElementById('client-modal').classList.remove('active'); },
  edit(id) { this.openModal(Store.getById('clients', id)); },
  save() {
    const name = document.getElementById('cli-name').value.trim();
    if (!name) { Toast.show('Nom requis','error'); return; }
    const data = { name, phone: document.getElementById('cli-phone').value.trim(), email: document.getElementById('cli-email').value.trim(), address: document.getElementById('cli-address').value.trim() };
    const id = document.getElementById('client-edit-id').value;
    if (id) { Store.update('clients', parseInt(id), data); Toast.show('Client modifié','success'); }
    else { data.loyalty = 0; data.totalPurchases = 0; Store.add('clients', data); Toast.show('Client ajouté','success'); }
    this.closeModal(); this.renderTable(Store.getAll('clients'));
  },
  del(id) { const c = Store.getById('clients',id); if (confirm(`Supprimer "${c.name}" ?`)) { Store.remove('clients',id); Toast.show('Supprimé','warning'); this.renderTable(Store.getAll('clients')); } }
};
