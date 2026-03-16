/* ══════════════════════════════════════
   SETTINGS.JS - Paramètres & Utilisateurs
   ══════════════════════════════════════ */

const Settings = {
  render(container) {
    if (App.currentUser.role !== 'admin') {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🚫</div><div class="empty-state-text">Accès réservé à l\'administrateur</div></div>';
      return;
    }

    const users = Store.getAll('users');
    container.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-left">
          <h2>👥 Gestion des Utilisateurs</h2>
        </div>
        <div class="toolbar-right">
          <button class="btn btn-primary" onclick="Settings.openUserModal()">${Icons.plus} Nouvel utilisateur</button>
        </div>
      </div>
      
      <div class="table-container" style="margin-top:20px">
        <table>
          <thead>
            <tr>
              <th>Nom complet</th>
              <th>Identifiant</th>
              <th>Rôle</th>
              <th>Accès Modules</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td class="fw-700">
                  <div style="display:flex;align-items:center;gap:10px">
                    <div style="width:32px;height:32px;border-radius:50%;background:var(--primary-600);color:white;display:flex;align-items:center;justify-content:center;font-size:12px">${u.name.substring(0,2).toUpperCase()}</div>
                    ${u.name}
                  </div>
                </td>
                <td class="text-muted">${u.username}</td>
                <td><span class="badge ${u.role === 'admin' ? 'badge-primary' : 'badge-warning'}">${u.role}</span></td>
                <td style="line-height:1.5;font-size:0.8rem">
                  ${u.role === 'admin' ? '<span class="text-success fw-600">Accès Total</span>' : 
                    (u.permissions || []).map(p => {
                      const labels = { dashboard:'Tableau de bord', products:'Produits', sales:'Ventes & Facturation', suppliers:'Fournisseurs', clients:'Clients', orders:'Commandes', reports:'Rapports', settings:'Paramètres' };
                      return `<span class="badge" style="margin:2px;background:var(--bg-tertiary)">${labels[p] || p}</span>`;
                    }).join(' ')}
                </td>
                <td>
                  <div class="actions-cell">
                    <button class="action-btn" title="Modifier" onclick="Settings.openUserModal(${u.id})">${Icons.edit}</button>
                    ${u.role !== 'admin' ? `<button class="action-btn danger" title="Supprimer" onclick="Settings.deleteUser(${u.id})">${Icons.trash}</button>` : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Modal User -->
      <div class="modal-overlay" id="user-modal">
        <div class="modal" style="max-width:550px">
          <div class="modal-header">
            <h3 class="modal-title" id="user-modal-title">Utilisateur</h3>
            <button class="modal-close" onclick="Settings.closeUserModal()">✕</button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="usr-id">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nom complet *</label>
                <input type="text" id="usr-name" class="form-input" placeholder="Ex: Jean Dupont">
              </div>
              <div class="form-group">
                <label class="form-label">Identifiant de connexion *</label>
                <input type="text" id="usr-username" class="form-input" placeholder="Ex: jdupont">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Mot de passe *</label>
                <input type="text" id="usr-password" class="form-input" placeholder="Mot de passe">
              </div>
              <div class="form-group">
                <label class="form-label">Rôle *</label>
                <select id="usr-role" class="form-select" onchange="Settings.togglePerms(this.value)">
                  <option value="vendeur">Vendeur</option>
                  <option value="magasinier">Magasinier</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>

            <div class="form-group" id="usr-perms-container">
              <label class="form-label">Permissions (Modules autorisés)</label>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;background:var(--bg-tertiary);padding:16px;border-radius:var(--radius-md)">
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                  <input type="checkbox" class="usr-perm" value="dashboard" checked> Tableau de bord
                </label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                  <input type="checkbox" class="usr-perm" value="sales"> Ventes & Facturation
                </label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                  <input type="checkbox" class="usr-perm" value="products"> Produits & Stock
                </label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                  <input type="checkbox" class="usr-perm" value="clients"> Clients
                </label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                  <input type="checkbox" class="usr-perm" value="suppliers"> Fournisseurs
                </label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                  <input type="checkbox" class="usr-perm" value="orders"> Commandes (Achats)
                </label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                  <input type="checkbox" class="usr-perm" value="reports"> Rapports & Stats
                </label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" onclick="Settings.closeUserModal()">Annuler</button>
            <button class="btn btn-primary" onclick="Settings.saveUser()">Enregistrer</button>
          </div>
        </div>
      </div>
    `;
  },

  togglePerms(role) {
    const cont = document.getElementById('usr-perms-container');
    if (role === 'admin') {
      cont.style.display = 'none';
      document.querySelectorAll('.usr-perm').forEach(cb => cb.checked = true);
    } else {
      cont.style.display = 'block';
    }
  },

  openUserModal(id = null) {
    const modal = document.getElementById('user-modal');
    modal.classList.add('active');
    
    if (id) {
      const u = Store.getById('users', id);
      document.getElementById('user-modal-title').textContent = "Modifier l'utilisateur";
      document.getElementById('usr-id').value = u.id;
      document.getElementById('usr-name').value = u.name;
      document.getElementById('usr-username').value = u.username;
      document.getElementById('usr-password').value = u.password;
      document.getElementById('usr-role').value = u.role;
      
      this.togglePerms(u.role);
      document.querySelectorAll('.usr-perm').forEach(cb => {
        cb.checked = u.role === 'admin' || (u.permissions && u.permissions.includes(cb.value));
      });
      if(u.role === 'admin') document.getElementById('usr-role').disabled = true;
      else document.getElementById('usr-role').disabled = false;
    } else {
      document.getElementById('user-modal-title').textContent = "Nouvel utilisateur";
      document.getElementById('usr-id').value = '';
      document.getElementById('usr-name').value = '';
      document.getElementById('usr-username').value = '';
      document.getElementById('usr-password').value = '';
      document.getElementById('usr-role').value = 'vendeur';
      document.getElementById('usr-role').disabled = false;
      this.togglePerms('vendeur');
      document.querySelectorAll('.usr-perm').forEach(cb => cb.checked = false);
      document.querySelector('.usr-perm[value="dashboard"]').checked = true;
    }
  },

  closeUserModal() {
    document.getElementById('user-modal').classList.remove('active');
  },

  saveUser() {
    const id = document.getElementById('usr-id').value;
    const name = document.getElementById('usr-name').value.trim();
    const username = document.getElementById('usr-username').value.trim();
    const password = document.getElementById('usr-password').value.trim();
    const role = document.getElementById('usr-role').value;
    
    if (!name || !username || !password) {
      Toast.show('Veuillez remplir les champs obligatoires (*)', 'error');
      return;
    }

    const permissions = [];
    if (role === 'admin') {
      permissions.push('dashboard', 'products', 'sales', 'suppliers', 'clients', 'orders', 'reports', 'settings');
    } else {
      document.querySelectorAll('.usr-perm:checked').forEach(cb => permissions.push(cb.value));
      if (!permissions.includes('dashboard')) permissions.push('dashboard');
    }

    const userData = { name, username, password, role, permissions };

    if (id) {
      Store.update('users', parseInt(id), userData);
      Toast.show('Utilisateur modifié avec succès', 'success');
      Store.add('activityLog', { user: App.currentUser.username, action: `Modification de l'utilisateur ${username}`, type: 'info' });
    } else {
      // Check if username exists
      const existing = Store.getAll('users').find(u => u.username === username);
      if (existing) {
        Toast.show("Cet identifiant est déjà pris", 'error');
        return;
      }
      Store.add('users', userData);
      Toast.show('Utilisateur créé avec succès', 'success');
      Store.add('activityLog', { user: App.currentUser.username, action: `Création de l'utilisateur ${username}`, type: 'info' });
    }

    this.closeUserModal();
    this.render(document.getElementById('content-area'));
  },

  deleteUser(id) {
    const u = Store.getById('users', id);
    if (!u) return;
    if (u.role === 'admin') {
      Toast.show('Impossible de supprimer le compte administrateur principal', 'error');
      return;
    }
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${u.name} ?`)) {
      Store.remove('users', id);
      Toast.show('Utilisateur supprimé', 'success');
      Store.add('activityLog', { user: App.currentUser.username, action: `Suppression de l'utilisateur ${u.username}`, type: 'warning' });
      this.render(document.getElementById('content-area'));
    }
  }
};
