/* ══════════════════════════════════════
   INVOICES.JS - Facturation & Encaissement
   ══════════════════════════════════════ */

const Invoices = {
  render(container) {
    const invoices = Store.getAll('invoices');
    const clients = Store.getAll('clients');

    container.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="toolbar-search">${Icons.search}<input type="text" id="invoice-search" placeholder="Rechercher une facture..."></div>
          <select class="form-select" id="invoice-status-filter" style="width:auto;padding:9px 36px 9px 14px">
            <option value="">Tous les statuts</option>
            <option value="payée">Payée</option>
            <option value="partielle">Partielle</option>
            <option value="impayée">Impayée</option>
          </select>
        </div>
        <div class="toolbar-right">
          <button class="btn btn-primary" onclick="Invoices.openCreateModal()">${Icons.plus} Nouvelle facture</button>
        </div>
      </div>

      <!-- KPI factures -->
      <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi-card success">
          <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <div class="kpi-info">
            <div class="kpi-label">Total encaissé</div>
            <div class="kpi-value" id="kpi-paid">0 FCFA</div>
          </div>
        </div>
        <div class="kpi-card warning">
          <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div class="kpi-info">
            <div class="kpi-label">En attente</div>
            <div class="kpi-value" id="kpi-pending">0 FCFA</div>
          </div>
        </div>
        <div class="kpi-card danger">
          <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
          <div class="kpi-info">
            <div class="kpi-label">Impayées</div>
            <div class="kpi-value" id="kpi-unpaid">0 FCFA</div>
          </div>
        </div>
        <div class="kpi-card primary">
          <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
          <div class="kpi-info">
            <div class="kpi-label">Total factures</div>
            <div class="kpi-value" id="kpi-count">0</div>
          </div>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>N° Facture</th>
              <th>Date</th>
              <th>Client</th>
              <th>Montant total</th>
              <th>Payé</th>
              <th>Reste</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="invoices-tbody"></tbody>
        </table>
      </div>

      <!-- Modal Créer Facture -->
      <div class="modal-overlay" id="invoice-create-modal">
        <div class="modal" style="max-width:700px">
          <div class="modal-header">
            <h3 class="modal-title">Nouvelle Facture</h3>
            <button class="modal-close" onclick="Invoices.closeCreateModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Client *</label>
                <select class="form-select" id="inv-client">
                  <option value="">-- Sélectionner un client --</option>
                  ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Date d'échéance</label>
                <input class="form-input" type="date" id="inv-due-date">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Articles de la facture</label>
              <div id="inv-lines"></div>
              <button class="btn btn-sm btn-outline mt-8" onclick="Invoices.addLine()">+ Ajouter un article</button>
            </div>
            <div style="margin-top:16px;padding:14px;background:var(--bg-tertiary);border-radius:var(--radius-md);display:flex;justify-content:space-between;align-items:center">
              <span class="fw-600">Total :</span>
              <span class="fw-700" style="font-size:1.2rem;color:var(--accent-400)" id="inv-total-preview">0 FCFA</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" onclick="Invoices.closeCreateModal()">Annuler</button>
            <button class="btn btn-primary" onclick="Invoices.saveInvoice()">Créer la facture</button>
          </div>
        </div>
      </div>

      <!-- Modal Encaissement -->
      <div class="modal-overlay" id="payment-modal">
        <div class="modal" style="max-width:480px">
          <div class="modal-header">
            <h3 class="modal-title">💰 Encaissement</h3>
            <button class="modal-close" onclick="Invoices.closePaymentModal()">✕</button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="pay-invoice-id">
            <div style="background:var(--bg-tertiary);border-radius:var(--radius-md);padding:14px;margin-bottom:16px">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span class="text-muted">Facture :</span><span class="fw-700" id="pay-inv-num"></span></div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span class="text-muted">Montant total :</span><span class="fw-700" id="pay-total"></span></div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span class="text-muted">Déjà payé :</span><span class="fw-700 text-success" id="pay-already"></span></div>
              <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid var(--border-color)"><span class="fw-600">Reste à payer :</span><span class="fw-700 text-warning" style="font-size:1.1rem" id="pay-remaining"></span></div>
            </div>
            <div class="form-group">
              <label class="form-label">Montant à encaisser (FCFA) *</label>
              <input class="form-input" type="number" id="pay-amount" placeholder="0" style="font-size:1.1rem;font-weight:700">
            </div>
            <div class="form-group">
              <label class="form-label">Mode de paiement</label>
              <div class="payment-methods">
                <button class="payment-method active" onclick="Invoices.setPayMethod('espèces',this)">💵 Espèces</button>
                <button class="payment-method" onclick="Invoices.setPayMethod('carte',this)">💳 Carte</button>
                <button class="payment-method" onclick="Invoices.setPayMethod('mobile',this)">📱 Mobile</button>
                <button class="payment-method" onclick="Invoices.setPayMethod('chèque',this)">📝 Chèque</button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Référence / Note</label>
              <input class="form-input" id="pay-reference" placeholder="Ex: Reçu n°...">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" onclick="Invoices.closePaymentModal()">Annuler</button>
            <button class="btn btn-success" onclick="Invoices.processPayment()">💰 Encaisser</button>
          </div>
        </div>
      </div>

      <!-- Modal Détail Facture -->
      <div class="modal-overlay" id="invoice-detail-modal">
        <div class="modal" style="max-width:650px">
          <div class="modal-header">
            <h3 class="modal-title" id="detail-title">Facture</h3>
            <button class="modal-close" onclick="Invoices.closeDetailModal()">✕</button>
          </div>
          <div class="modal-body" id="invoice-detail-body"></div>
          <div class="modal-footer">
            <button class="btn btn-outline" onclick="Invoices.closeDetailModal()">Fermer</button>
            <button class="btn btn-outline" onclick="Invoices.printInvoice()" id="detail-print-btn">${Icons.print} Imprimer</button>
          </div>
        </div>
      </div>
    `;

    this.renderTable(invoices);
    this.updateKPIs(invoices);

    document.getElementById('invoice-search').addEventListener('input', () => this.filterInvoices());
    document.getElementById('invoice-status-filter').addEventListener('change', () => this.filterInvoices());
  },

  // ── KPIs ──
  updateKPIs(invoices) {
    const paid = invoices.filter(i => i.status === 'payée').reduce((s, i) => s + i.total, 0);
    const partial = invoices.filter(i => i.status === 'partielle');
    const pendingAmount = partial.reduce((s, i) => s + (i.total - (i.paidAmount || 0)), 0);
    const unpaid = invoices.filter(i => i.status === 'impayée').reduce((s, i) => s + i.total, 0);

    document.getElementById('kpi-paid').textContent = Store.formatPrice(paid + partial.reduce((s, i) => s + (i.paidAmount || 0), 0));
    document.getElementById('kpi-pending').textContent = Store.formatPrice(pendingAmount);
    document.getElementById('kpi-unpaid').textContent = Store.formatPrice(unpaid);
    document.getElementById('kpi-count').textContent = invoices.length;
  },

  // ── Table ──
  renderTable(data) {
    const clients = Store.getAll('clients');
    const tbody = document.getElementById('invoices-tbody');
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state" style="padding:30px"><div class="empty-state-icon">🧾</div><div class="empty-state-text">Aucune facture</div></div></td></tr>';
      return;
    }

    tbody.innerHTML = data.sort((a, b) => new Date(b.date) - new Date(a.date)).map(inv => {
      const client = clients.find(c => c.id === inv.clientId);
      const remaining = inv.total - (inv.paidAmount || 0);
      const statusClass = inv.status === 'payée' ? 'badge-success' : inv.status === 'partielle' ? 'badge-warning' : 'badge-danger';
      const statusIcon = inv.status === 'payée' ? '✅' : inv.status === 'partielle' ? '⏳' : '❌';
      return `<tr>
        <td class="fw-700" style="color:var(--primary-400)">FACT-${String(inv.id).padStart(4, '0')}</td>
        <td>${Store.formatDate(inv.date)}</td>
        <td class="fw-600">${client?.name || 'Client inconnu'}</td>
        <td class="fw-700">${Store.formatPrice(inv.total)}</td>
        <td class="text-success fw-600">${Store.formatPrice(inv.paidAmount || 0)}</td>
        <td class="${remaining > 0 ? 'text-warning' : 'text-success'} fw-600">${Store.formatPrice(remaining)}</td>
        <td><span class="badge ${statusClass}">${statusIcon} ${inv.status}</span></td>
        <td><div class="actions-cell">
          <button class="action-btn" title="Voir" onclick="Invoices.viewDetail(${inv.id})">${Icons.eye}</button>
          ${inv.status !== 'payée' ? `<button class="btn btn-sm btn-success" onclick="Invoices.openPaymentModal(${inv.id})">💰 Encaisser</button>` : ''}
          <button class="action-btn danger" title="Supprimer" onclick="Invoices.deleteInvoice(${inv.id})">${Icons.trash}</button>
        </div></td>
      </tr>`;
    }).join('');
  },

  filterInvoices() {
    const q = document.getElementById('invoice-search').value;
    const status = document.getElementById('invoice-status-filter').value;
    let invoices = q ? Store.search('invoices', q, ['id']) : Store.getAll('invoices');
    // Also search by client name
    if (q) {
      const clients = Store.getAll('clients');
      const allInvoices = Store.getAll('invoices');
      const matchingClientIds = clients.filter(c => c.name.toLowerCase().includes(q.toLowerCase())).map(c => c.id);
      const byClient = allInvoices.filter(i => matchingClientIds.includes(i.clientId));
      invoices = [...new Map([...invoices, ...byClient].map(i => [i.id, i])).values()];
    }
    if (status) invoices = invoices.filter(i => i.status === status);
    this.renderTable(invoices);
    this.updateKPIs(invoices);
  },

  // ── Créer Facture ──
  openCreateModal() {
    document.getElementById('invoice-create-modal').classList.add('active');
    document.getElementById('inv-lines').innerHTML = '';
    this.addLine();
    const d = new Date(Date.now() + 30 * 86400000);
    document.getElementById('inv-due-date').value = d.toISOString().split('T')[0];
    document.getElementById('inv-client').value = '';
    this.updateTotalPreview();
  },

  closeCreateModal() { document.getElementById('invoice-create-modal').classList.remove('active'); },

  addLine() {
    const products = Store.getAll('products');
    const div = document.createElement('div');
    div.className = 'form-row mt-8';
    div.style.alignItems = 'end';
    div.innerHTML = `
      <div class="form-group" style="flex:2">
        <select class="form-select inv-product">
          <option value="">-- Article --</option>
          ${products.map(p => `<option value="${p.id}" data-price="${p.price}">${p.emoji} ${p.name} (${Store.formatPrice(p.price)})</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="max-width:80px">
        <input class="form-input inv-qty" type="number" value="1" min="1" placeholder="Qté">
      </div>
      <div class="form-group" style="max-width:130px">
        <input class="form-input inv-unit-price" type="number" placeholder="Prix unit.">
      </div>
      <div class="form-group" style="max-width:130px">
        <input class="form-input inv-line-total" type="text" readonly placeholder="Total" style="background:var(--bg-tertiary);color:var(--accent-400);font-weight:700">
      </div>
      <button class="btn btn-sm btn-outline" style="height:40px;margin-bottom:16px" onclick="this.parentElement.remove();Invoices.updateTotalPreview()">✕</button>`;
    
    const productSelect = div.querySelector('.inv-product');
    const qtyInput = div.querySelector('.inv-qty');
    const priceInput = div.querySelector('.inv-unit-price');
    const totalInput = div.querySelector('.inv-line-total');

    const updateLine = () => {
      const qty = parseInt(qtyInput.value) || 0;
      const price = parseInt(priceInput.value) || 0;
      totalInput.value = Store.formatPrice(qty * price);
      this.updateTotalPreview();
    };

    productSelect.addEventListener('change', function() {
      const price = this.selectedOptions[0]?.dataset.price || 0;
      priceInput.value = price;
      updateLine();
    });
    qtyInput.addEventListener('input', updateLine);
    priceInput.addEventListener('input', updateLine);

    document.getElementById('inv-lines').appendChild(div);
  },

  updateTotalPreview() {
    let total = 0;
    document.querySelectorAll('#inv-lines .form-row').forEach(row => {
      const qty = parseInt(row.querySelector('.inv-qty')?.value) || 0;
      const price = parseInt(row.querySelector('.inv-unit-price')?.value) || 0;
      total += qty * price;
    });
    document.getElementById('inv-total-preview').textContent = Store.formatPrice(total);
  },

  saveInvoice() {
    const clientId = parseInt(document.getElementById('inv-client').value);
    if (!clientId) { Toast.show('Veuillez sélectionner un client', 'error'); return; }

    const lines = document.querySelectorAll('#inv-lines .form-row');
    if (!lines.length) { Toast.show('Ajoutez au moins un article', 'error'); return; }

    const items = [];
    let total = 0;
    let valid = true;
    lines.forEach(row => {
      const productId = parseInt(row.querySelector('.inv-product')?.value);
      const qty = parseInt(row.querySelector('.inv-qty')?.value) || 0;
      const price = parseInt(row.querySelector('.inv-unit-price')?.value) || 0;
      if (!productId || !qty || !price) { valid = false; return; }
      items.push({ productId, qty, unitPrice: price, lineTotal: qty * price });
      total += qty * price;
    });

    if (!valid || items.length === 0) { Toast.show('Veuillez remplir tous les articles', 'error'); return; }

    const dueDate = document.getElementById('inv-due-date').value;
    const invoice = Store.add('invoices', {
      date: new Date().toISOString(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      clientId,
      items,
      total,
      paidAmount: 0,
      status: 'impayée',
      payments: []
    });

    Store.add('activityLog', { user: App.currentUser.username, action: `Facture FACT-${String(invoice.id).padStart(4, '0')} créée: ${Store.formatPrice(total)}`, type: 'info' });
    Toast.show(`Facture FACT-${String(invoice.id).padStart(4, '0')} créée`, 'success');
    this.closeCreateModal();
    this.render(document.getElementById('content-area'));
  },

  // ── Encaissement ──
  paymentMethod: 'espèces',

  openPaymentModal(invoiceId) {
    const inv = Store.getById('invoices', invoiceId);
    if (!inv || inv.status === 'payée') return;

    const remaining = inv.total - (inv.paidAmount || 0);
    document.getElementById('pay-invoice-id').value = invoiceId;
    document.getElementById('pay-inv-num').textContent = `FACT-${String(inv.id).padStart(4, '0')}`;
    document.getElementById('pay-total').textContent = Store.formatPrice(inv.total);
    document.getElementById('pay-already').textContent = Store.formatPrice(inv.paidAmount || 0);
    document.getElementById('pay-remaining').textContent = Store.formatPrice(remaining);
    document.getElementById('pay-amount').value = remaining;
    document.getElementById('pay-amount').max = remaining;
    document.getElementById('pay-reference').value = '';
    this.paymentMethod = 'espèces';
    document.querySelectorAll('#payment-modal .payment-method').forEach(b => b.classList.remove('active'));
    document.querySelector('#payment-modal .payment-method').classList.add('active');
    document.getElementById('payment-modal').classList.add('active');
  },

  closePaymentModal() { document.getElementById('payment-modal').classList.remove('active'); },

  setPayMethod(method, btn) {
    this.paymentMethod = method;
    document.querySelectorAll('#payment-modal .payment-method').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  },

  processPayment() {
    const invoiceId = parseInt(document.getElementById('pay-invoice-id').value);
    const amount = parseInt(document.getElementById('pay-amount').value);
    const reference = document.getElementById('pay-reference').value.trim();
    const inv = Store.getById('invoices', invoiceId);

    if (!inv) return;
    const remaining = inv.total - (inv.paidAmount || 0);

    if (!amount || amount <= 0) { Toast.show('Montant invalide', 'error'); return; }
    if (amount > remaining) { Toast.show('Le montant dépasse le reste à payer', 'error'); return; }

    const payment = {
      date: new Date().toISOString(),
      amount,
      method: this.paymentMethod,
      reference,
      user: App.currentUser.username
    };

    const newPaid = (inv.paidAmount || 0) + amount;
    const newStatus = newPaid >= inv.total ? 'payée' : 'partielle';
    const payments = [...(inv.payments || []), payment];

    Store.update('invoices', invoiceId, {
      paidAmount: newPaid,
      status: newStatus,
      payments
    });

    // Update client
    if (inv.clientId) {
      const client = Store.getById('clients', inv.clientId);
      if (client) {
        Store.update('clients', inv.clientId, {
          loyalty: (client.loyalty || 0) + Math.floor(amount / 1000)
        });
      }
    }

    Store.add('activityLog', { user: App.currentUser.username, action: `Encaissement ${Store.formatPrice(amount)} sur FACT-${String(invoiceId).padStart(4, '0')} (${this.paymentMethod})`, type: 'success' });

    Toast.show(`Paiement de ${Store.formatPrice(amount)} enregistré !`, 'success');
    this.closePaymentModal();
    this.render(document.getElementById('content-area'));
  },

  // ── Détail Facture ──
  viewDetail(invoiceId) {
    const inv = Store.getById('invoices', invoiceId);
    if (!inv) return;
    const client = Store.getById('clients', inv.clientId);
    const products = Store.getAll('products');
    const remaining = inv.total - (inv.paidAmount || 0);
    const statusClass = inv.status === 'payée' ? 'badge-success' : inv.status === 'partielle' ? 'badge-warning' : 'badge-danger';

    document.getElementById('detail-title').textContent = `Facture FACT-${String(inv.id).padStart(4, '0')}`;

    let paymentsHTML = '';
    if (inv.payments && inv.payments.length > 0) {
      paymentsHTML = `
        <h4 style="margin-top:20px;margin-bottom:10px">💰 Historique des paiements</h4>
        <div class="table-container" style="border:1px solid var(--border-color)">
          <table>
            <thead><tr><th>Date</th><th>Montant</th><th>Mode</th><th>Réf.</th><th>Par</th></tr></thead>
            <tbody>${inv.payments.map(p => `
              <tr>
                <td>${Store.formatDateTime(p.date)}</td>
                <td class="fw-700 text-success">${Store.formatPrice(p.amount)}</td>
                <td><span class="badge badge-primary">${p.method}</span></td>
                <td class="text-muted">${p.reference || '-'}</td>
                <td class="text-muted">${p.user}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    }

    document.getElementById('invoice-detail-body').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
        <div>
          <div class="text-muted" style="font-size:.78rem">Client</div>
          <div class="fw-700">${client?.name || 'Inconnu'}</div>
          <div class="text-muted" style="font-size:.82rem">${client?.phone || ''}</div>
        </div>
        <div style="text-align:right">
          <div class="text-muted" style="font-size:.78rem">Date</div>
          <div class="fw-600">${Store.formatDate(inv.date)}</div>
          ${inv.dueDate ? `<div class="text-muted" style="font-size:.82rem">Échéance: ${Store.formatDate(inv.dueDate)}</div>` : ''}
          <div style="margin-top:6px"><span class="badge ${statusClass}">${inv.status}</span></div>
        </div>
      </div>

      <h4 style="margin-bottom:10px">📋 Articles</h4>
      <div class="table-container" style="border:1px solid var(--border-color)">
        <table>
          <thead><tr><th>Article</th><th>Qté</th><th>Prix unit.</th><th>Total</th></tr></thead>
          <tbody>
            ${inv.items.map(item => {
              const p = products.find(pr => pr.id === item.productId);
              return `<tr>
                <td class="fw-600">${p?.emoji || '📦'} ${p?.name || 'Article inconnu'}</td>
                <td>${item.qty}</td>
                <td>${Store.formatPrice(item.unitPrice)}</td>
                <td class="fw-700">${Store.formatPrice(item.lineTotal)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-top:16px;padding:14px;background:var(--bg-tertiary);border-radius:var(--radius-md)">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span>Total facture</span><span class="fw-700">${Store.formatPrice(inv.total)}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span>Payé</span><span class="fw-700 text-success">${Store.formatPrice(inv.paidAmount || 0)}</span></div>
        <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid var(--border-color)">
          <span class="fw-600">Reste à payer</span>
          <span class="fw-700 ${remaining > 0 ? 'text-warning' : 'text-success'}" style="font-size:1.1rem">${Store.formatPrice(remaining)}</span>
        </div>
      </div>

      ${paymentsHTML}
    `;

    this._currentDetailId = invoiceId;
    document.getElementById('invoice-detail-modal').classList.add('active');
  },

  closeDetailModal() { document.getElementById('invoice-detail-modal').classList.remove('active'); },

  // ── Imprimer ──
  printInvoice() {
    const inv = Store.getById('invoices', this._currentDetailId);
    if (!inv) return;
    const client = Store.getById('clients', inv.clientId);
    const products = Store.getAll('products');

    const printHTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Facture FACT-${String(inv.id).padStart(4, '0')}</title>
<style>
  body{font-family:Arial,sans-serif;padding:40px;color:#222;max-width:800px;margin:0 auto}
  h1{color:#4f46e5;margin-bottom:4px} .subtitle{color:#666;margin-bottom:30px}
  table{width:100%;border-collapse:collapse;margin:20px 0}
  th{background:#f0f0f5;padding:10px;text-align:left;border-bottom:2px solid #ddd;font-size:13px}
  td{padding:10px;border-bottom:1px solid #eee;font-size:14px}
  .total-section{background:#f8f8fc;padding:16px;border-radius:8px;margin-top:20px}
  .total-row{display:flex;justify-content:space-between;margin-bottom:6px}
  .total-row.final{font-size:18px;font-weight:bold;border-top:2px solid #ddd;padding-top:10px;margin-top:10px}
  .header-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px}
  .status{display:inline-block;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:bold}
  .status.payée{background:#d1fae5;color:#065f46}
  .status.partielle{background:#fef3c7;color:#92400e}
  .status.impayée{background:#fee2e2;color:#991b1b}
  @media print{body{padding:20px}}
</style></head><body>
  <h1>🔧 QuincaGest</h1>
  <p class="subtitle">Facture FACT-${String(inv.id).padStart(4, '0')}</p>
  <div class="header-grid">
    <div><strong>Client :</strong> ${client?.name || '-'}<br>${client?.phone || ''}<br>${client?.address || ''}</div>
    <div style="text-align:right"><strong>Date :</strong> ${Store.formatDate(inv.date)}<br>
    ${inv.dueDate ? `<strong>Échéance :</strong> ${Store.formatDate(inv.dueDate)}<br>` : ''}
    <span class="status ${inv.status}">${inv.status.toUpperCase()}</span></div>
  </div>
  <table><thead><tr><th>Article</th><th>Qté</th><th>Prix unit.</th><th>Total</th></tr></thead><tbody>
    ${inv.items.map(it => {const p=products.find(pr=>pr.id===it.productId);return `<tr><td>${p?.name||'Article'}</td><td>${it.qty}</td><td>${Store.formatPrice(it.unitPrice)}</td><td><strong>${Store.formatPrice(it.lineTotal)}</strong></td></tr>`;}).join('')}
  </tbody></table>
  <div class="total-section">
    <div class="total-row"><span>Total :</span><span><strong>${Store.formatPrice(inv.total)}</strong></span></div>
    <div class="total-row"><span>Payé :</span><span style="color:green"><strong>${Store.formatPrice(inv.paidAmount||0)}</strong></span></div>
    <div class="total-row final"><span>Reste à payer :</span><span>${Store.formatPrice(inv.total-(inv.paidAmount||0))}</span></div>
  </div>
  ${inv.payments?.length ? `<h3 style="margin-top:30px">Paiements reçus</h3><table><thead><tr><th>Date</th><th>Montant</th><th>Mode</th><th>Réf.</th></tr></thead><tbody>${inv.payments.map(p=>`<tr><td>${Store.formatDateTime(p.date)}</td><td><strong>${Store.formatPrice(p.amount)}</strong></td><td>${p.method}</td><td>${p.reference||'-'}</td></tr>`).join('')}</tbody></table>` : ''}
  <p style="text-align:center;margin-top:40px;color:#999;font-size:12px">QuincaGest - Application de gestion de quincaillerie</p>
</body></html>`;

    const win = window.open('', '_blank');
    win.document.write(printHTML);
    win.document.close();
    win.print();
  },

  deleteInvoice(id) {
    const inv = Store.getById('invoices', id);
    if (confirm(`Supprimer la facture FACT-${String(id).padStart(4, '0')} ?`)) {
      Store.remove('invoices', id);
      Toast.show('Facture supprimée', 'warning');
      Store.add('activityLog', { user: App.currentUser.username, action: `Facture FACT-${String(id).padStart(4, '0')} supprimée`, type: 'warning' });
      this.render(document.getElementById('content-area'));
    }
  }
};
