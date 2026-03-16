/* ══════════════════════════════════════
   SUPPLIERS.JS - Suppliers Module
   ══════════════════════════════════════ */
const Suppliers = {
  render(container) {
    const suppliers = Store.getAll('suppliers');
    container.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="toolbar-search">${Icons.search}<input type="text" id="supplier-search" placeholder="Rechercher un fournisseur..."></div>
        </div>
        <div class="toolbar-right">
          <button class="btn btn-primary" onclick="Suppliers.openModal()">${Icons.plus} Ajouter</button>
        </div>
      </div>
      <div class="table-container">
        <table><thead><tr><th>Fournisseur</th><th>Contact</th><th>Téléphone</th><th>Email</th><th>Notes</th><th>Actions</th></tr></thead>
        <tbody id="suppliers-tbody"></tbody></table>
      </div>
      <div class="modal-overlay" id="supplier-modal">
        <div class="modal">
          <div class="modal-header"><h3 class="modal-title" id="supplier-modal-title">Ajouter un fournisseur</h3><button class="modal-close" onclick="Suppliers.closeModal()">✕</button></div>
          <div class="modal-body">
            <input type="hidden" id="supplier-edit-id">
            <div class="form-group"><label class="form-label">Nom *</label><input class="form-input" id="sup-name" placeholder="Nom de l'entreprise"></div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Contact</label><input class="form-input" id="sup-contact" placeholder="Nom du contact"></div>
              <div class="form-group"><label class="form-label">Téléphone</label><input class="form-input" id="sup-phone" placeholder="+224 6XX XX XX XX"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="sup-email" placeholder="email@example.com"></div>
              <div class="form-group"><label class="form-label">Adresse</label><input class="form-input" id="sup-address" placeholder="Ville, Pays"></div>
            </div>
            <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" id="sup-notes" placeholder="Notes..."></textarea></div>
          </div>
          <div class="modal-footer"><button class="btn btn-outline" onclick="Suppliers.closeModal()">Annuler</button><button class="btn btn-primary" onclick="Suppliers.save()">Enregistrer</button></div>
        </div>
      </div>`;
    this.renderTable(suppliers);
    document.getElementById('supplier-search').addEventListener('input', () => {
      const q = document.getElementById('supplier-search').value;
      this.renderTable(q ? Store.search('suppliers', q, ['name','contact','phone']) : Store.getAll('suppliers'));
    });
  },
  renderTable(data) {
    const tbody = document.getElementById('suppliers-tbody');
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state" style="padding:20px"><div class="empty-state-text">Aucun fournisseur</div></div></td></tr>'; return; }
    tbody.innerHTML = data.map(s => `<tr>
      <td class="fw-600">${s.name}</td><td>${s.contact||'-'}</td><td>${s.phone||'-'}</td><td class="text-muted">${s.email||'-'}</td>
      <td class="text-muted" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.notes||'-'}</td>
      <td><div class="actions-cell">
        <button class="action-btn" onclick="Suppliers.edit(${s.id})">${Icons.edit}</button>
        <button class="action-btn danger" onclick="Suppliers.del(${s.id})">${Icons.trash}</button>
      </div></td></tr>`).join('');
  },
  openModal(s=null) {
    document.getElementById('supplier-modal').classList.add('active');
    document.getElementById('supplier-modal-title').textContent = s ? 'Modifier' : 'Ajouter un fournisseur';
    document.getElementById('supplier-edit-id').value = s ? s.id : '';
    document.getElementById('sup-name').value = s?.name||''; document.getElementById('sup-contact').value = s?.contact||'';
    document.getElementById('sup-phone').value = s?.phone||''; document.getElementById('sup-email').value = s?.email||'';
    document.getElementById('sup-address').value = s?.address||''; document.getElementById('sup-notes').value = s?.notes||'';
  },
  closeModal() { document.getElementById('supplier-modal').classList.remove('active'); },
  edit(id) { this.openModal(Store.getById('suppliers', id)); },
  save() {
    const name = document.getElementById('sup-name').value.trim();
    if (!name) { Toast.show('Nom requis','error'); return; }
    const data = { name, contact: document.getElementById('sup-contact').value.trim(), phone: document.getElementById('sup-phone').value.trim(), email: document.getElementById('sup-email').value.trim(), address: document.getElementById('sup-address').value.trim(), notes: document.getElementById('sup-notes').value.trim() };
    const id = document.getElementById('supplier-edit-id').value;
    if (id) { Store.update('suppliers', parseInt(id), data); Toast.show('Fournisseur modifié','success'); }
    else { Store.add('suppliers', data); Toast.show('Fournisseur ajouté','success'); }
    this.closeModal(); this.renderTable(Store.getAll('suppliers'));
  },
  del(id) { const s = Store.getById('suppliers',id); if (confirm(`Supprimer "${s.name}" ?`)) { Store.remove('suppliers',id); Toast.show('Supprimé','warning'); this.renderTable(Store.getAll('suppliers')); } }
};
