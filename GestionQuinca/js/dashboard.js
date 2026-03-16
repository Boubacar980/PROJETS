/* ══════════════════════════════════════
   DASHBOARD.JS - Dashboard Module
   ══════════════════════════════════════ */

const Dashboard = {
  render(container) {
    const todaySales = Store.getTodaySales();
    const todayRevenue = todaySales.reduce((s, v) => s + v.total, 0);
    const monthRevenue = Store.getTotalRevenue(30);
    const products = Store.getAll('products');
    const criticals = Store.getCriticalProducts();
    const clients = Store.getAll('clients');

    // Calculate daily margin
    let todayCost = 0;
    todaySales.forEach(sale => {
      sale.items?.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) todayCost += (product.costPrice || 0) * item.qty;
      });
    });
    const todayMargin = todayRevenue - todayCost;
    const marginPercent = todayRevenue > 0 ? Math.round((todayMargin / todayRevenue) * 100) : 0;

    container.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card primary">
          <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <div class="kpi-info">
            <div class="kpi-label">CA du mois</div>
            <div class="kpi-value">${Store.formatPrice(monthRevenue)}</div>
            <div class="kpi-trend up">↑ 12% vs mois dernier</div>
          </div>
        </div>
        <div class="kpi-card success">
          <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>
          <div class="kpi-info">
            <div class="kpi-label">Ventes aujourd'hui</div>
            <div class="kpi-value">${todaySales.length} ventes</div>
            <div class="kpi-trend up">${Store.formatPrice(todayRevenue)}</div>
          </div>
        </div>
        <div class="kpi-card" style="border-left-color: #8b5cf6">
          <div class="kpi-icon" style="background: rgba(139,92,246,0.1); color: #8b5cf6"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div>
          <div class="kpi-info">
            <div class="kpi-label">Bénéfice du jour</div>
            <div class="kpi-value">${Store.formatPrice(todayMargin)}</div>
            <div class="kpi-trend up">${marginPercent}% de marge</div>
          </div>
        </div>
        <div class="kpi-card warning">
          <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg></div>
          <div class="kpi-info">
            <div class="kpi-label">Total produits</div>
            <div class="kpi-value">${products.length}</div>
            <div class="kpi-trend ${criticals.length > 0 ? 'down' : 'up'}">${criticals.length} en stock critique</div>
          </div>
        </div>
        <div class="kpi-card danger">
          <div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          <div class="kpi-info">
            <div class="kpi-label">Clients</div>
            <div class="kpi-value">${clients.length}</div>
            <div class="kpi-trend up">↑ 3 nouveaux ce mois</div>
          </div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📊 Ventes récentes (7 jours)</h3>
          </div>
          <div class="chart-container"><canvas id="salesChart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📦 Répartition par catégorie</h3>
          </div>
          <div class="chart-container"><canvas id="categoryChart"></canvas></div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">⚠️ Alertes de stock</h3>
          </div>
          <ul class="alert-list" id="stock-alerts"></ul>
          ${criticals.length === 0 ? '<div class="empty-state" style="padding:20px"><div class="empty-state-text text-success">✅ Tous les stocks sont OK</div></div>' : ''}
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">🕐 Activité récente</h3>
          </div>
          <ul class="alert-list" id="activity-log"></ul>
        </div>
      </div>
    `;

    // Stock alerts
    const alertList = document.getElementById('stock-alerts');
    criticals.forEach(p => {
      const cat = Store.getById('categories', p.category);
      alertList.innerHTML += `
        <li class="alert-item">
          <span class="alert-dot ${p.stock === 0 ? 'danger' : 'warning'}"></span>
          <span>${cat?.emoji || '📦'} <strong>${p.name}</strong></span>
          <span class="badge ${p.stock === 0 ? 'badge-danger' : 'badge-warning'}" style="margin-left:auto">${p.stock} ${p.unit}(s)</span>
        </li>`;
    });

    // Activity log
    const logList = document.getElementById('activity-log');
    const logs = Store.getAll('activityLog').sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
    logs.forEach(log => {
      logList.innerHTML += `
        <li class="alert-item">
          <span class="alert-dot ${log.type === 'success' ? 'info' : log.type === 'warning' ? 'warning' : 'info'}"></span>
          <div style="flex:1;min-width:0">
            <div style="font-size:.82rem;font-weight:600">${log.action}</div>
            <div style="font-size:.72rem;color:var(--text-tertiary)">${log.user} · ${Store.formatDateTime(log.date)}</div>
          </div>
        </li>`;
    });

    // Draw Charts
    this.drawSalesChart();
    this.drawCategoryChart();
  },

  drawSalesChart() {
    const canvas = document.getElementById('salesChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const sales = Store.getAll('sales');
    const days = [];
    const values = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dayStr = d.toDateString();
      const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
      days.push(label);
      const dayTotal = sales.filter(s => new Date(s.date).toDateString() === dayStr).reduce((sum, s) => sum + s.total, 0);
      values.push(dayTotal);
    }

    const maxVal = Math.max(...values, 1);
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const w = canvas.width - padding.left - padding.right;
    const h = canvas.height - padding.top - padding.bottom;

    // Grid lines
    ctx.strokeStyle = 'rgba(100,100,180,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (h / 4) * i;
      ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(canvas.width - padding.right, y); ctx.stroke();
      ctx.fillStyle = '#6b6b8d';
      ctx.font = '11px Inter';
      ctx.textAlign = 'right';
      ctx.fillText(Store.formatPrice(Math.round(maxVal - (maxVal / 4) * i)), padding.left - 8, y + 4);
    }

    // Bars
    const barW = w / days.length * 0.6;
    const gap = w / days.length;
    const gradient = ctx.createLinearGradient(0, padding.top, 0, canvas.height - padding.bottom);
    gradient.addColorStop(0, '#818cf8');
    gradient.addColorStop(1, '#4f46e5');

    days.forEach((label, i) => {
      const barH = (values[i] / maxVal) * h;
      const x = padding.left + i * gap + (gap - barW) / 2;
      const y = padding.top + h - barH;

      ctx.fillStyle = gradient;
      ctx.beginPath();
      const r = 4;
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barW - r, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
      ctx.lineTo(x + barW, padding.top + h);
      ctx.lineTo(x, padding.top + h);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.fill();

      // Label
      ctx.fillStyle = '#a5a5c0';
      ctx.font = '11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(label, padding.left + i * gap + gap / 2, canvas.height - 12);
    });
  },

  drawCategoryChart() {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const categories = Store.getAll('categories');
    const products = Store.getAll('products');
    const data = categories.map(cat => ({
      name: cat.name,
      emoji: cat.emoji,
      count: products.filter(p => p.category === cat.id).length
    })).filter(d => d.count > 0);

    const total = data.reduce((s, d) => s + d.count, 0);
    const colors = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#38bdf8', '#a78bfa', '#fb923c', '#ec4899'];
    const cx = canvas.width / 2 - 60;
    const cy = canvas.height / 2;
    const radius = Math.min(cx, cy) - 20;

    let startAngle = -Math.PI / 2;
    data.forEach((d, i) => {
      const sliceAngle = (d.count / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      startAngle += sliceAngle;
    });

    // Center hole (donut)
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a3e';
    ctx.fill();
    ctx.fillStyle = '#f0f0ff';
    ctx.font = 'bold 18px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(total, cx, cy + 2);
    ctx.font = '11px Inter';
    ctx.fillStyle = '#a5a5c0';
    ctx.fillText('produits', cx, cy + 18);

    // Legend
    const legendX = canvas.width - 130;
    let legendY = 20;
    data.forEach((d, i) => {
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(legendX, legendY, 10, 10);
      ctx.fillStyle = '#a5a5c0';
      ctx.font = '11px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(`${d.emoji} ${d.name} (${d.count})`, legendX + 16, legendY + 9);
      legendY += 22;
    });
  }
};
