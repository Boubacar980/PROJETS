/* ══════════════════════════════════════
   REPORTS.JS - Reports & Statistics
   ══════════════════════════════════════ */
const Reports = {
  render(container) {
    const sales = Store.getAll('sales');
    const products = Store.getAll('products');
    const today = new Date().toDateString();
    const todaySales = sales.filter(s => new Date(s.date).toDateString() === today);
    const todayTotal = todaySales.reduce((s, v) => s + v.total, 0);
    
    // Calcul du bénéfice du jour
    let todayCost = 0;
    todaySales.forEach(s => {
      s.items?.forEach(item => {
        const p = Store.getById('products', item.productId);
        if (p) todayCost += (p.costPrice || 0) * item.qty;
      });
    });
    const todayProfit = todayTotal - todayCost;

    const weekTotal = Store.getTotalRevenue(7);
    const monthTotal = Store.getTotalRevenue(30);
    const totalStock = products.reduce((s, p) => s + p.stock, 0);
    const stockValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0);
    const criticals = Store.getCriticalProducts();
    const clients = Store.getAll('clients');
    const topClient = [...clients].sort((a, b) => (b.totalPurchases || 0) - (a.totalPurchases || 0))[0];

    container.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-left"><h3>📊 Rapports & Statistiques</h3></div>
        <div class="toolbar-right"><button class="btn btn-outline" onclick="window.print()">${Icons.print} Imprimer</button></div>
      </div>
      <div class="kpi-grid">
        <div class="kpi-card success"><div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <div class="kpi-info"><div class="kpi-label">CA Aujourd'hui</div><div class="kpi-value">${Store.formatPrice(todayTotal)}</div><div class="kpi-trend">${todaySales.length} ventes</div></div></div>
        
        <div class="kpi-card info"><div class="kpi-icon" style="background:rgba(56,189,248,0.1);color:#38bdf8"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div>
          <div class="kpi-info"><div class="kpi-label">Bénéfice du jour</div><div class="kpi-value">${Store.formatPrice(todayProfit)}</div><div class="kpi-trend text-info">${todayTotal > 0 ? ((todayProfit/todayTotal)*100).toFixed(1) : 0}% de marge</div></div></div>

        <div class="kpi-card primary"><div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
          <div class="kpi-info"><div class="kpi-label">CA Semaine</div><div class="kpi-value">${Store.formatPrice(weekTotal)}</div></div></div>
        <div class="kpi-card warning"><div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
          <div class="kpi-info"><div class="kpi-label">CA Mois</div><div class="kpi-value">${Store.formatPrice(monthTotal)}</div></div></div>
        <div class="kpi-card danger"><div class="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/></svg></div>
          <div class="kpi-info"><div class="kpi-label">Valeur du stock</div><div class="kpi-value">${Store.formatPrice(stockValue)}</div><div class="kpi-trend">${totalStock} articles, ${criticals.length} critiques</div></div></div>
      </div>

      <div class="charts-grid">
        <div class="card">
          <div class="card-header"><h3 class="card-title">🏆 Top 10 Produits les plus vendus</h3></div>
          <div class="table-container" style="border:none">
            <table><thead><tr><th>Produit</th><th>Qté vendue</th><th>Revenus</th></tr></thead>
            <tbody id="top-products"></tbody></table>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3 class="card-title">⚠️ Produits en stock critique</h3></div>
          <div class="table-container" style="border:none">
            <table><thead><tr><th>Produit</th><th>Stock</th><th>Seuil min.</th><th>Statut</th></tr></thead>
            <tbody id="critical-products"></tbody></table>
          </div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="card">
          <div class="card-header"><h3 class="card-title">👥 Meilleurs Clients</h3></div>
          <div class="table-container" style="border:none">
            <table><thead><tr><th>Client</th><th>Total achats</th><th>Fidélité</th></tr></thead>
            <tbody id="top-clients"></tbody></table>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3 class="card-title">📈 Ventes des 10 derniers jours</h3></div>
          <div class="chart-container"><canvas id="reportChart"></canvas></div>
        </div>
      </div>
    `;

    // Top products
    const productSales = {};
    sales.forEach(s => s.items?.forEach(i => {
      if (!productSales[i.productId]) productSales[i.productId] = { qty: 0, revenue: 0 };
      productSales[i.productId].qty += i.qty;
      productSales[i.productId].revenue += i.qty * i.price;
    }));
    const topProducts = Object.entries(productSales).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 10);
    document.getElementById('top-products').innerHTML = topProducts.length ? topProducts.map(([pid, data]) => {
      const p = Store.getById('products', parseInt(pid));
      return `<tr><td class="fw-600">${p?.emoji || '📦'} ${p?.name || 'Inconnu'}</td><td>${data.qty}</td><td class="fw-700 text-success">${Store.formatPrice(data.revenue)}</td></tr>`;
    }).join('') : '<tr><td colspan="3" class="text-muted text-center">Aucune donnée</td></tr>';

    // Critical products
    document.getElementById('critical-products').innerHTML = criticals.length ? criticals.map(p =>
      `<tr><td class="fw-600">${p.emoji} ${p.name}</td><td class="fw-700 ${p.stock===0?'text-danger':'text-warning'}">${p.stock}</td><td class="text-muted">${p.minStock}</td>
       <td><span class="badge ${p.stock===0?'badge-danger':'badge-warning'}">${p.stock===0?'Rupture':'Critique'}</span></td></tr>`
    ).join('') : '<tr><td colspan="4" class="text-center text-success">✅ Tous OK</td></tr>';

    // Top clients
    const sortedClients = [...clients].sort((a, b) => (b.totalPurchases || 0) - (a.totalPurchases || 0)).slice(0, 5);
    document.getElementById('top-clients').innerHTML = sortedClients.map(c =>
      `<tr><td class="fw-600">${c.name}</td><td class="fw-700">${Store.formatPrice(c.totalPurchases||0)}</td><td><span class="badge badge-primary">⭐ ${c.loyalty||0}</span></td></tr>`
    ).join('');

    // Chart
    this.drawChart();
  },

  drawChart() {
    const canvas = document.getElementById('reportChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width; canvas.height = rect.height;
    const sales = Store.getAll('sales');
    const days = [], values = [];
    for (let i = 9; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      days.push(d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }));
      values.push(sales.filter(s => new Date(s.date).toDateString() === d.toDateString()).reduce((sum, s) => sum + s.total, 0));
    }
    const maxVal = Math.max(...values, 1);
    const p = { top: 20, right: 20, bottom: 40, left: 70 };
    const w = canvas.width - p.left - p.right, h = canvas.height - p.top - p.bottom;

    // Grid
    ctx.strokeStyle = 'rgba(100,100,180,0.1)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = p.top + (h / 4) * i;
      ctx.beginPath(); ctx.moveTo(p.left, y); ctx.lineTo(canvas.width - p.right, y); ctx.stroke();
      ctx.fillStyle = '#6b6b8d'; ctx.font = '10px Inter'; ctx.textAlign = 'right';
      ctx.fillText(Store.formatPrice(Math.round(maxVal - (maxVal / 4) * i)), p.left - 6, y + 4);
    }

    // Line + Area
    const grad = ctx.createLinearGradient(0, p.top, 0, p.top + h);
    grad.addColorStop(0, 'rgba(99,102,241,0.3)'); grad.addColorStop(1, 'rgba(99,102,241,0)');
    ctx.beginPath();
    const points = days.map((_, i) => ({ x: p.left + (i / (days.length - 1)) * w, y: p.top + h - (values[i] / maxVal) * h }));
    ctx.moveTo(points[0].x, p.top + h);
    points.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(points[points.length - 1].x, p.top + h);
    ctx.fillStyle = grad; ctx.fill();

    ctx.beginPath();
    points.forEach((pt, i) => i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
    ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 2.5; ctx.stroke();

    // Dots
    points.forEach(pt => { ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2); ctx.fillStyle = '#818cf8'; ctx.fill(); ctx.strokeStyle = '#1a1a3e'; ctx.lineWidth = 2; ctx.stroke(); });

    // Labels
    days.forEach((label, i) => { ctx.fillStyle = '#6b6b8d'; ctx.font = '10px Inter'; ctx.textAlign = 'center'; ctx.fillText(label, p.left + (i / (days.length - 1)) * w, canvas.height - 10); });
  }
};
