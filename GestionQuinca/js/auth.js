/* ══════════════════════════════════════
   AUTH.JS - Authentication & Security
   ══════════════════════════════════════ */

const Auth = {
  showLogin() {
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').classList.remove('show');
  },

  attemptLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const errorEl = document.getElementById('login-error');

    if (!username || !password) {
      errorEl.textContent = 'Veuillez remplir tous les champs';
      errorEl.classList.add('show');
      return;
    }

    const users = Store.getAll('users');
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
      errorEl.textContent = 'Nom d\'utilisateur ou mot de passe incorrect';
      errorEl.classList.add('show');
      return;
    }

    // Log activity
    Store.add('activityLog', {
      user: user.username,
      action: `Connexion de ${user.name}`,
      type: 'info'
    });

    App.currentUser = user;
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    App.showApp();
    Toast.show(`Bienvenue, ${user.name} !`, 'success');
  }
};
