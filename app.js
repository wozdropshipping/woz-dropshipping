/* app.js - Woz Dropshipping v3 (filtros corregidos y optimizados) */
const productListEl = document.getElementById('productList');
const productTemplate = document.getElementById('productTemplate');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const countryFilter = document.getElementById('countryFilter');
const providerFilter = document.getElementById('providerFilter');
const ratingFilter = document.getElementById('ratingFilter');
const clearFiltersBtn = document.getElementById('clearFilters');
const loadingEl = document.getElementById('loading');
const globalDroppersEl = document.getElementById('globalDroppers');

let PRODUCTS = [];
let VISIBLE = [];
let BATCH = 20;
let appended = 0;
let MAX_PRODUCTS = 500;

/* ----------- Utils ----------- */
function formatGs(n){
  const num = Math.round(Number(n) || 0);
  return 'Gs. ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function pick(arr){ return arr[randInt(0,arr.length-1)]; }

/* ----------- Datos base ----------- */
const adjectives = ["Compacto","Ligero","Premium","Plegable","Moderno","Urban","Pro","Deluxe","Económico","Ergonómico","Seguro","Infantil","Multiuso","Resistente"];
const items = ["Carrito para bebé","Silla de bebe","Casco urbano","Luces LED para bici","Candado de cable","Mochila porta-niños","Alforja","Soporte celular para bici","Guardabarros","Portaequipaje","Timbrillo eléctrico","Manubrio plegable","Asiento gel","Bomba portátil","Guantes urbanos","Lentes fotocromáticos","Portabotellas","Cubierta antipinchazos","Cesta para bici","Pantalón reflectante"];
const providers = [
  {name:"Amazon",country:"internacional"},
  {name:"AliExpress",country:"internacional"},
  {name:"eBay",country:"internacional"},
  {name:"Mercado Libre",country:"nacional"},
  {name:"Tiendas del Barrio",country:"nacional"},
  {name:"Baby Store Corp.",country:"nacional"},
  {name:"Tienda tu Espacio",country:"nacional"},
  {name:"NYC Services.",country:"internacional"},
  {name:"LocalShop",country:"nacional"},
  {name:"GlobalTrade",country:"internacional"}
];

/* ----------- Generar productos ----------- */
function generateProducts(){
  const arr=[];
  for(let i=1;i<=MAX_PRODUCTS;i++){
    const title = `${pick(adjectives)} ${pick(items)} ${i}`;
    const providerObj = pick(providers);
    const priceProvider = randInt(20000, 900000);
    const markup = randInt(120, 260) / 100;
    const priceSuggested = Math.round(priceProvider*markup/1000)*1000;
    const rating = (randInt(30,50)/10).toFixed(1);
    const reviews = randInt(400, 5000);
    const droppers = randInt(20,1200);
    arr.push({
      id: i,
      title,
      provider: providerObj.name,
      providerVerified: Math.random() > 0.25,
      providerCountry: providerObj.country,
      priceProvider,
      priceSuggested,
      rating: Number(rating),
      reviews,
      droppers,
      droppersDir: Math.random()>0.5?1:-1
    });
  }
  return arr;
}

/* ----------- Filtros dinámicos ----------- */
function fillProviderFilter(){
  const set = new Set(PRODUCTS.map(p=>p.provider));
  const entries = Array.from(set).sort();
  providerFilter.innerHTML = `<option value="all">Todos los proveedores</option>` +
    entries.map(e=>`<option value="${e}">${e}</option>`).join('');
}

/* ----------- Render producto ----------- */
function renderProduct(p){
  const tpl = productTemplate.content.cloneNode(true);
  const card = tpl.querySelector('.product-card');
  card.dataset.id = p.id;

  tpl.querySelector('.title').textContent = p.title;
  tpl.querySelector('.provider-name').textContent = p.provider;
  if (!p.providerVerified) tpl.querySelector('.verified').style.display = 'none';

  tpl.querySelector('.price-provider').textContent = formatGs(p.priceProvider);
  tpl.querySelector('.price-suggested').textContent = formatGs(p.priceSuggested);
  tpl.querySelector('.reviews').textContent = `${p.reviews} reseñas`;
  tpl.querySelector('.droppers-count').textContent = p.droppers;

  const starsEl = tpl.querySelector('.stars');
  starsEl.innerHTML = generateStars(p.rating);

  /* Extra */
  const soldEl = tpl.querySelector('.sold-count');
  if (soldEl) soldEl.textContent = `Este producto se ha vendido ${randInt(200, 15000)} veces`;

  const profitabilityEl = tpl.querySelector('.profitability');
  if (p.priceSuggested > p.priceProvider * 1.8) {
    profitabilityEl.textContent = "Alta rentabilidad";
    profitabilityEl.className = "profitability high";
  } else {
    profitabilityEl.textContent = "Rentabilidad regular";
    profitabilityEl.className = "profitability regular";
  }

  productListEl.appendChild(tpl);
}

/* Render lote */
function renderBatch(){
  const next = VISIBLE.slice(appended, appended + BATCH);
  next.forEach(p => renderProduct(p));
  appended += next.length;
  loadingEl.style.display = appended >= VISIBLE.length ? 'none' : 'block';
}

/* ----------- Estrellas ----------- */
function generateStars(r){
  const full = Math.floor(r);
  let html = '';
  const starFull = `<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#ffb400"/></svg>`;
  const starEmpty = `<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="none" stroke="#e6e6e6" stroke-width="1.2"/></svg>`;
  for(let i = 0; i < 5; i++){
    html += `<span class="star">${i < full ? starFull : starEmpty}</span>`;
  }
  html += ` <span style="font-weight:600;color:#222;margin-left:8px">${r.toFixed(1)}</span>`;
  return html;
}

/* ----------- Aplicar filtros ----------- */
function applyFilters(){
  const q = searchInput.value.trim().toLowerCase();
  const sortVal = sortSelect.value;
  const countryVal = countryFilter.value;
  const provVal = providerFilter.value;
  const ratingVal = ratingFilter.value;

  VISIBLE = PRODUCTS.filter(p=>{
    if(q && !p.title.toLowerCase().includes(q)) return false;
    if(countryVal !== 'all' && p.providerCountry !== countryVal) return false;
    if(provVal !== 'all' && p.provider !== provVal) return false;
    if(ratingVal !== 'all' && p.rating < Number(ratingVal)) return false;
    return true;
  });

  if(sortVal === 'price_low') VISIBLE.sort((a,b)=>a.priceSuggested - b.priceSuggested);
  else if(sortVal === 'price_high') VISIBLE.sort((a,b)=>b.priceSuggested - a.priceSuggested);
  else if(sortVal === 'rating_high') VISIBLE.sort((a,b)=>b.rating - a.rating);
  else VISIBLE.sort((a,b)=>a.id - b.id);

  productListEl.innerHTML = '';
  appended = 0;
  renderBatch();
}

/* ----------- Scroll infinito ----------- */
window.addEventListener('scroll', () => {
  if(appended >= VISIBLE.length) return;
  const nearBottom = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 600);
  if(nearBottom) renderBatch();
});

/* ----------- Eventos ----------- */
searchInput.addEventListener('input', applyFilters);  // 🔥 ahora busca en tiempo real
sortSelect.addEventListener('change', applyFilters);
countryFilter.addEventListener('change', applyFilters);
providerFilter.addEventListener('change', applyFilters);
ratingFilter.addEventListener('change', applyFilters);

clearFiltersBtn.addEventListener('click', () => {
  searchInput.value='';
  sortSelect.value='relevance';
  countryFilter.value='all';
  providerFilter.value='all';
  ratingFilter.value='all';
  applyFilters();
});

/* ----------- Droppers dinámicos ----------- */
let currentTotal = 34305;
let targetTotal = 10000000000034305;

function startDroppersClock(){
  // Actualiza droppers individuales
  setInterval(() => {
    PRODUCTS.forEach(p => {
      const change = randInt(0, 8) * p.droppersDir;
      p.droppers = Math.max(0, p.droppers + change);
      if (Math.random() < 0.02) p.droppersDir *= -1;

      const card = document.querySelector(`.product-card[data-id="${p.id}"]`);
      if (card) {
        const dEl = card.querySelector('.droppers-count');
        if (dEl) dEl.textContent = p.droppers;
      }
    });

    targetTotal = PRODUCTS.reduce((sum, p) => sum + p.droppers, 0);
  }, 2500);

  // Contador global
  setInterval(() => {
    if (currentTotal === targetTotal) return;
    currentTotal += (currentTotal < targetTotal) ? 1 : -1;
    globalDroppersEl.textContent = currentTotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }, 2500);

  // Contador por región
  const regionCounts = {
    py: 12350, ar: 105098, br: 89420,
    cl: 42880, uy: 15230, pe: 67110, co: 78900
  };

  setInterval(() => {
    for (const key in regionCounts) {
      const change = randInt(-3, 3);
      regionCounts[key] = Math.max(0, regionCounts[key] + change);
      const el = document.querySelector(`.region-count[data-country="${key}"]`);
      if (el) {
        el.textContent = regionCounts[key].toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      }
    }
  }, 1000);
}

/* ----------- Init ----------- */
function init(){
  PRODUCTS = generateProducts();
  fillProviderFilter();
  applyFilters();
  startDroppersClock();
}
init();
