/* app.js - Woz Dropshipping (versión robusta y debug-friendly) */
document.addEventListener('DOMContentLoaded', () => {
  const debug = true;
  const log = (...args) => { if (debug) console.log('[app.js]', ...args); };

  // obtener elementos (con tolerancia si faltan)
  const $ = id => document.getElementById(id);
  const productListEl = $('productList');
  const productTemplate = $('productTemplate');
  const searchInput = $('searchInput');
  const sortSelect = $('sortSelect');
  const countryFilter = $('countryFilter');
  const providerFilter = $('providerFilter');
  const ratingFilter = $('ratingFilter');
  const clearFiltersBtn = $('clearFilters');
  const loadingEl = $('loading');
  const globalDroppersEl = $('globalDroppers');

  // Validaciones básicas
  if (!productListEl) { console.error('Elemento #productList no encontrado en el DOM.'); return; }
  if (!productTemplate) { console.error('Elemento #productTemplate no encontrado en el DOM.'); return; }

  // estado
  let PRODUCTS = [];
  let VISIBLE = [];
  let BATCH = 20;
  let appended = 0;
  let MAX_PRODUCTS = 500;

  /* ---------- Helpers ---------- */
  function formatGs(n){
    const num = Math.round(Number(n) || 0);
    return 'Gs. ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function pick(arr){ return arr[randInt(0,arr.length-1)]; }

  /* ---------- Datos base ---------- */
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

  /* ---------- Generar productos ---------- */
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

  /* ---------- Fill provider filter (seguro) ---------- */
  function fillProviderFilter(){
    if (!providerFilter) { log('providerFilter no existe — salteando fillProviderFilter'); return; }
    const set = new Set(PRODUCTS.map(p=>p.provider));
    const entries = Array.from(set).sort();
    providerFilter.innerHTML = `<option value="all">Todos los proveedores</option>` +
      entries.map(e=>`<option value="${e}">${e}</option>`).join('');
    log('providerFilter rellenado con', entries.length, 'proveedores');
  }

  /* ---------- Render producto individual ---------- */
  function renderProduct(p){
    try {
      const tpl = productTemplate.content.cloneNode(true);
      const card = tpl.querySelector('.product-card');
      if (!card) {
        console.warn('productTemplate no contiene .product-card — abortando render para', p.id);
        return;
      }
      card.dataset.id = p.id;

      const titleEl = tpl.querySelector('.title');
      if (titleEl) titleEl.textContent = p.title;

      const providerEl = tpl.querySelector('.provider-name');
      if (providerEl) providerEl.textContent = p.provider;

      const verifiedEl = tpl.querySelector('.verified');
      if (verifiedEl) verifiedEl.style.display = p.providerVerified ? '' : 'none';

      const priceProvEl = tpl.querySelector('.price-provider');
      if (priceProvEl) priceProvEl.textContent = formatGs(p.priceProvider);

      const priceSugEl = tpl.querySelector('.price-suggested');
      if (priceSugEl) priceSugEl.textContent = formatGs(p.priceSuggested);

      const reviewsEl = tpl.querySelector('.reviews');
      if (reviewsEl) reviewsEl.textContent = `${p.reviews} reseñas`;

      const droppersEl = tpl.querySelector('.droppers-count');
      if (droppersEl) droppersEl.textContent = p.droppers;

      const starsEl = tpl.querySelector('.stars');
      if (starsEl) starsEl.innerHTML = generateStars(p.rating);

      const soldEl = tpl.querySelector('.sold-count');
      if (soldEl) soldEl.textContent = `Este producto se ha vendido ${randInt(200, 15000)} veces`;

      const profitabilityEl = tpl.querySelector('.profitability');
      if (profitabilityEl) {
        if (p.priceSuggested > p.priceProvider * 1.8) {
          profitabilityEl.textContent = "Alta rentabilidad";
          profitabilityEl.className = "profitability high";
        } else {
          profitabilityEl.textContent = "Rentabilidad regular";
          profitabilityEl.className = "profitability regular";
        }
      }

      productListEl.appendChild(tpl);
    } catch (err) {
      console.error('Error renderProduct id=', p && p.id, err);
    }
  }

  /* ---------- Render lote ---------- */
  function renderBatch(){
    const next = VISIBLE.slice(appended, appended + BATCH);
    if (next.length === 0) {
      // si no quedan items, ocultar loading
      if (loadingEl) loadingEl.style.display = 'none';
      return;
    }
    next.forEach(p => renderProduct(p));
    appended += next.length;
    if (loadingEl) loadingEl.style.display = appended >= VISIBLE.length ? 'none' : 'block';
  }

  /* ---------- Estrellas ---------- */
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

  /* ---------- Mensaje "Sin resultados" ---------- */
  function ensureNoResultsNode(){
    let node = document.getElementById('noResultsMsg');
    if (!node) {
      node = document.createElement('div');
      node.id = 'noResultsMsg';
      node.style.display = 'none';
      node.style.textAlign = 'center';
      node.style.padding = '14px 0';
      node.style.color = '#666';
      node.textContent = 'No se encontraron productos con esos filtros.';
      productListEl.parentNode.insertBefore(node, productListEl.nextSibling);
    }
    return node;
  }

  /* ---------- Aplicar filtros ---------- */
  function applyFilters(){
    try {
      const q = (searchInput && searchInput.value || '').trim().toLowerCase();
      const sortVal = sortSelect ? sortSelect.value : 'relevance';
      const countryVal = countryFilter ? countryFilter.value : 'all';
      const provVal = providerFilter ? providerFilter.value : 'all';
      const ratingVal = ratingFilter ? ratingFilter.value : 'all';

      VISIBLE = PRODUCTS.filter(p=>{
        if(q && !p.title.toLowerCase().includes(q)) return false;
        if(countryVal !== 'all' && p.providerCountry !== countryVal) return false;
        if(provVal !== 'all' && p.provider !== provVal) return false;
        if(ratingVal !== 'all' && p.rating < Number(ratingVal)) return false;
        return true;
      });

      // mostrar/ocultar mensaje sin resultados
      const noResultsNode = ensureNoResultsNode();
      if (VISIBLE.length === 0) {
        if (noResultsNode) noResultsNode.style.display = 'block';
        if (loadingEl) loadingEl.style.display = 'none';
        productListEl.innerHTML = ''; // limpiar listado
        appended = 0;
        log('applyFilters -> 0 resultados');
        return;
      } else {
        if (noResultsNode) noResultsNode.style.display = 'none';
      }

      // ordenar
      if(sortVal === 'price_low') VISIBLE.sort((a,b)=>a.priceSuggested - b.priceSuggested);
      else if(sortVal === 'price_high') VISIBLE.sort((a,b)=>b.priceSuggested - a.priceSuggested);
      else if(sortVal === 'rating_high') VISIBLE.sort((a,b)=>b.rating - a.rating);
      else VISIBLE.sort((a,b)=>a.id - b.id);

      // render
      productListEl.innerHTML = '';
      appended = 0;
      renderBatch();
      log('applyFilters ->', VISIBLE.length, 'visibles');
    } catch (err) {
      console.error('Error en applyFilters:', err);
    }
  }

  /* ---------- Scroll infinito ---------- */
  window.addEventListener('scroll', () => {
    try {
      if (appended >= VISIBLE.length) return;
      const nearBottom = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 600);
      if (nearBottom) renderBatch();
    } catch (err) {
      console.error('Error en scroll handler:', err);
    }
  });

  /* ---------- Eventos (con chequeo) ---------- */
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      // pequeño debounce simple
      if (window._wozSearchTimeout) clearTimeout(window._wozSearchTimeout);
      window._wozSearchTimeout = setTimeout(() => applyFilters(), 200);
    });
  } else log('searchInput no encontrado');

  if (sortSelect) sortSelect.addEventListener('change', applyFilters);
  if (countryFilter) countryFilter.addEventListener('change', applyFilters);
  if (providerFilter) providerFilter.addEventListener('change', applyFilters);
  if (ratingFilter) ratingFilter.addEventListener('change', applyFilters);

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (sortSelect) sortSelect.value = 'relevance';
      if (countryFilter) countryFilter.value = 'all';
      if (providerFilter) providerFilter.value = 'all';
      if (ratingFilter) ratingFilter.value = 'all';
      applyFilters();
    });
  } else log('clearFiltersBtn no encontrado');

  /* ---------- Droppers (simulación) ---------- */
  let currentTotal = 34305;
  let targetTotal = 10000000000034305;

  function startDroppersClock(){
    // Actualiza droppers individuales cada 2500ms
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

    // Animación suave del contador global
    setInterval(() => {
      if (!globalDroppersEl) return;
      if (currentTotal === targetTotal) return;
      currentTotal += (currentTotal < targetTotal) ? 1 : -1;
      globalDroppersEl.textContent = currentTotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }, 2500);

    // Contador por país
    const regionCounts = {
      py: 12350,
      ar: 105098,
      br: 89420,
      cl: 42880,
      uy: 15230,
      pe: 67110,
      co: 78900
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

  /* ---------- Init ---------- */
  function init(){
    log('init -> generando productos...');
    PRODUCTS = generateProducts();
    fillProviderFilter();
    applyFilters();
    startDroppersClock();
    log('init -> listo');
  }

  init();

  // Abrir modal al hacer click en "Vender este producto"
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('vender-btn')) {
      document.getElementById('venderModal').style.display = 'flex';
    }
    if (e.target.classList.contains('close')) {
      document.getElementById('venderModal').style.display = 'none';
    }
  });

  // Cerrar modal al hacer click fuera del contenido
  document.getElementById('venderModal').addEventListener('click', function(e) {
    if (e.target === this) this.style.display = 'none';
  });

  document.getElementById('mobileFiltersToggle').addEventListener('click', function() {
    const filters = document.querySelector('.filters');
    if (filters.style.display === 'flex') {
      filters.style.display = 'none';
    } else {
      filters.style.display = 'flex';
      filters.style.flexWrap = 'wrap';
    }
  });
});

