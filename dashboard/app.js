// Token Radar Dashboard Logic

const data = window.RADAR;
const table = document.getElementById('board-table');
const tbody = document.getElementById('board-body');
const filterInput = document.getElementById('filter-input');
const categoryFilter = document.getElementById('category-filter');
const sortSelect = document.getElementById('sort-select');
const detailSection = document.getElementById('detail-section');
const detailTitle = document.getElementById('detail-title');
const detailContent = document.getElementById('detail-content');
const closeBtn = document.getElementById('close-detail');

let rows = data.rows;
let filtered = rows;
let sortBy = 'implied';
let watchlistSize = data.watchlist_size;

function formatNumber(n) {
  if (n >= 1e9) return (n/1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
  return n.toString();
}

function formatPrice(n) {
  return '$' + n.toLocaleString();
}

function formatPercent(n) {
  const sign = n >= 0 ? '+' : '';
  return sign + n.toFixed(1) + '%';
}

function getGrowthClass(n) {
  if (n >= 10) return 'value-high';
  if (n <= -10) return 'value-low';
  return '';
}

function sortRows(key) {
  if (key === 'implied') {
    rows.sort((a,b) => b.implied_value_usd - a.implied_value_usd || a.rank - b.rank);
  } else if (key === 'tvl') {
    rows.sort((a,b) => b.tvl_usd - a.tvl_usd);
  } else if (key === 'growth') {
    rows.sort((a,b) => (b.change_7d||0) - (a.change_7d||0));
  }
  rows.forEach((r,i) => r._sortRank = i+1);
}

function applyFilters() {
  const term = filterInput.value.toLowerCase().trim();
  filtered = rows.filter(r => {
    const matchesTerm = r.slug.toLowerCase().includes(term) || r.name.toLowerCase().includes(term);
    const cat = categoryFilter.value;
    const matchesCat = !cat || r.category === cat;
    return matchesTerm && matchesCat;
  });
  render();
}

function render() {
  tbody.innerHTML = filtered.map(r => {
    const isWatchlist = r.rank <= watchlistSize;
    return '<tr data-slug="'+r.slug+'" class="'+(isWatchlist?'watchlist':'')+ '">'
      +'<td>'+(isWatchlist?'*':'o')+'</td>'
      +'<td>'+(isWatchlist?'<strong>'+r.name+'</strong>':r.name)+'</td>'
      +'<td>' + formatNumber(r.tvl_usd) + '</td>'
      +'<td class="'+getGrowthClass(r.change_7d||0)+'"' + (r.change_7d>=10||r.change_7d<=-10?'style="color:'+(r.change_7d>=10?'var(--color-high)':(r.change_7d<=-10?'var(--color-low)':'inherit'))+'"':'') + '>' + formatPercent(r.change_7d||0) + '</td>'
      +'<td>' + (r.age_days!==null?r.age_days+'d':'—') + '</td>'
      +'<td class="price">' + formatPrice(r.implied_value_usd) + '</td>'
      +'<td>' + r.chains.join(', ') + '</td>'
      +'</tr>';
  }).join('');
}

function openDetail(slug) {
  const r = rows.find(x => x.slug === slug);
  if (!r) return;
  detailTitle.textContent = r.name + ' (Implied: ' + formatPrice(r.implied_value_usd) + ')';
  detailContent.innerHTML = '<p><strong>TVL:</strong> ' + formatNumber(r.tvl_usd) + '</p>'
    + '<p><strong>Category:</strong> ' + (r.category||'—') + '</p>'
    + '<p><strong>Chains:</strong> ' + r.chains.join(', ') + '</p>'
    + '<p><strong>7d Change:</strong> ' + formatPercent(r.change_7d||0) + '</p>'
    + '<p><strong>Age:</strong> ' + (r.age_days!==null?r.age_days+' days': 'Unknown') + '</p>'
    + '<p><strong>Model:</strong> growth×' + r.growth_multiplier.toFixed(2) + ', maturity×' + r.maturity_multiplier.toFixed(2) + '</p>'
    + '<div class="farm-steps"><h4>Farm Plan</h4><ol>'
    + (r.farm_steps||[]).map(s => '<li>'+s+'</li>').join('')
    + '</ol></div>';
  detailSection.classList.remove('hidden');
}

function hideDetail() {
  detailSection.classList.add('hidden');
}

// Build category options
const cats = new Set(rows.map(r => r.category).filter(Boolean));
[...cats].sort().forEach(c => {
  const opt = document.createElement('option');
  opt.value = c;
  opt.textContent = c;
  categoryFilter.appendChild(opt);
});

// Event listeners
tbody.addEventListener('click', e => {
  const tr = e.target.closest('tr');
  if (tr) {
    document.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
    tr.classList.add('selected');
    openDetail(tr.dataset.slug);
  }
});
closeBtn.addEventListener('click', hideDetail);
filterInput.addEventListener('input', applyFilters);
categoryFilter.addEventListener('change', applyFilters);
sortSelect.addEventListener('change', (e) => {
  sortBy = e.target.value;
  sortRows(sortBy);
  applyFilters();
});

// Initial sort and render
sortRows(sortBy);
render();

// URL support for detail view and filters
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('slug')) openDetail(urlParams.get('slug'));
if (urlParams.has('category')) {
  categoryFilter.value = urlParams.get('category');
  applyFilters();
}