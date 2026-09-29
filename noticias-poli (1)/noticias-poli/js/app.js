/* ==========================================================
   Noticias Poli - Lógica principal (HTML + JS + Bootstrap)
   Cada página HTML declara data-page en <body> y este archivo
   pinta header, footer y el contenido de esa página.
   ========================================================== */

/* ---------- 1. Configuración y utilidades ---------- */
const KEYS = { noticias: 'noticias_data', favs: 'noticias_favoritos' };
const CATS = ['Educación', 'Tecnología', 'Turismo', 'Comercial'];
const NAV = [['index', 'Home'], ['noticias', 'Noticias'], ['favoritos', 'Favoritos'],
             ['contacto', 'Contacto'], ['acerca', 'Acerca de'], ['gestion', 'Gestión']];
const $ = (s) => document.querySelector(s);
// Escapa texto para evitar inyección de HTML (datos creados por el usuario)
const esc = (t) => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let NOTICIAS = [];          // Lista en memoria
let refrescar = () => {};   // Función de repintado de la página actual

/* ---------- 2. Persistencia (localStorage) ---------- */
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};

// Carga las noticias: primero localStorage; si no existe, desde el JSON local
async function cargarNoticias() {
  let n = store.get(KEYS.noticias, null);
  if (!n) {
    const r = await fetch('data/noticias.json');
    n = await r.json();
    store.set(KEYS.noticias, n);
  }
  return n;
}
const guardarNoticias = () => store.set(KEYS.noticias, NOTICIAS);

/* ---------- 3. Favoritos ---------- */
const favs = () => store.get(KEYS.favs, []);
const esFav = (id) => favs().includes(id);
function toggleFav(id) {
  const f = favs(), i = f.indexOf(id);
  i >= 0 ? f.splice(i, 1) : f.push(id);
  store.set(KEYS.favs, f);
}
const heart = (id) => esFav(id) ? '♥' : '♡';
// Un solo listener para todos los botones de favorito de cualquier vista
document.addEventListener('click', (e) => {
  const b = e.target.closest('.fav-btn');
  if (b) { toggleFav(+b.dataset.id); refrescar(); }
});

/* ---------- 4. Componentes reutilizables ---------- */
// Tarjeta de noticia (idéntica en Home y Noticias, RF-02)
const card = (n) => `
<div class="col-sm-6 col-lg-4"><div class="card h-100 shadow-sm">
  <img src="${esc(n.imagen)}" class="card-img-top" alt="${esc(n.titulo)}">
  <div class="card-body d-flex flex-column">
    <span class="badge text-bg-secondary align-self-start mb-2">${esc(n.categoria)}</span>
    <h5 class="card-title">${esc(n.titulo)}</h5>
    <p class="card-text">${esc(n.descripcion)}</p>
    <div class="mt-auto d-flex justify-content-between align-items-center">
      <a href="detalle.html?id=${n.id}" class="btn btn-primary btn-sm">Ver más</a>
      <button class="btn btn-link fav-btn" data-id="${n.id}" aria-label="Favorito">${heart(n.id)}</button>
    </div>
  </div>
</div></div>`;

// Header con menú de navegación y footer con información general
function layout(page) {
  const activa = page === 'detalle' ? 'noticias' : page;
  $('#header').innerHTML = `
  <nav class="navbar navbar-expand-lg navbar-dark bg-brand"><div class="container">
    <a class="navbar-brand fw-bold" href="index.html">📰 Noticias Poli</a>
    <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#menu" aria-label="Menú"><span class="navbar-toggler-icon"></span></button>
    <div class="collapse navbar-collapse" id="menu"><ul class="navbar-nav ms-auto">
      ${NAV.map(([h, t]) => `<li class="nav-item"><a class="nav-link ${h === activa ? 'active fw-bold' : ''}" href="${h}.html">${t}</a></li>`).join('')}
    </ul></div>
  </div></nav>`;
  $('#footer').innerHTML = `
  <div class="container d-flex flex-wrap justify-content-between gap-2">
    <span>© 2026 Noticias Poli · Bogotá</span>
    <span>info@noticias.com · +57 300 000 0000</span>
    <span><a href="#">Redes</a> · <a href="#">Términos</a></span>
  </div>`;
}

/* ---------- 5. Páginas ---------- */
const PAGES = {

  /* Home (RF-01): bienvenida, destacadas, CTA y testimonios */
  index() {
    const dest = NOTICIAS.filter(n => n.destacada).slice(0, 3);
    const testimonios = [['Laura M.', 'Me encanta poder guardar mis noticias favoritas.'],
                         ['Carlos R.', 'Un diseño claro y muy fácil de usar.'],
                         ['Sofía P.', 'Las noticias educativas me ayudan en mis estudios.']];
    const pintar = () => {
      $('#app').innerHTML = `
      <section class="hero rounded-4 p-5 mb-5 text-white">
        <h1 class="display-5 fw-bold">Bienvenido a Noticias Poli</h1>
        <p class="lead">Educación, tecnología, turismo y comercio en un solo lugar.</p>
        <a href="noticias.html" class="btn btn-light btn-lg">Explorar noticias</a>
      </section>
      <h2 class="mb-3">Noticias destacadas</h2>
      <div class="row g-4 mb-4">${dest.map(card).join('')}</div>
      <div class="text-center mb-5">
        <a href="noticias.html" class="btn btn-primary me-2">Ver noticias</a>
        <a href="contacto.html" class="btn btn-outline-primary">Contactar</a>
      </div>
      <h2 class="mb-3">Lo que dicen nuestros lectores</h2>
      <div class="row g-3">${testimonios.map(([n, t]) => `
        <div class="col-md-4"><div class="card card-body"><p class="mb-1">“${t}”</p><small class="text-muted">— ${n}</small></div></div>`).join('')}</div>`;
    };
    refrescar = pintar; pintar();
  },

  /* Catálogo con filtro por categoría (RF-02) */
  noticias() {
    let cat = '';
    const pintar = () => {
      const l = NOTICIAS.filter(n => !cat || n.categoria === cat);
      $('#app').innerHTML = `
      <div class="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <h1 class="h2">Catálogo de Noticias</h1>
        <select id="filtro" class="form-select w-auto" aria-label="Filtrar por categoría">
          <option value="">Todas las categorías</option>
          ${CATS.map(c => `<option ${c === cat ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="row g-4">${l.map(card).join('') || '<p>No hay noticias en esta categoría.</p>'}</div>`;
      $('#filtro').onchange = (e) => { cat = e.target.value; pintar(); };
    };
    refrescar = pintar; pintar();
  },

  /* Detalle de la noticia (RF-03): id por query string ?id= */
  detalle() {
    const id = +new URLSearchParams(location.search).get('id');
    const n = NOTICIAS.find(x => x.id === id);
    const pintar = () => {
      if (!n) { $('#app').innerHTML = '<div class="alert alert-warning">Noticia no encontrada. <a href="noticias.html">Volver al catálogo</a></div>'; return; }
      document.title = `${n.titulo} | Noticias Poli`;
      $('#app').innerHTML = `
      <nav aria-label="breadcrumb"><ol class="breadcrumb">
        <li class="breadcrumb-item"><a href="noticias.html">Noticias</a></li>
        <li class="breadcrumb-item active">${esc(n.titulo)}</li></ol></nav>
      <img src="${esc(n.imagen)}" class="img-fluid rounded w-100 detalle-img mb-3" alt="${esc(n.titulo)}">
      <span class="badge text-bg-secondary">${esc(n.categoria)}</span>
      <small class="text-muted ms-2">Publicado: ${esc(n.fecha)}</small>
      <h1 class="mt-2">${esc(n.titulo)}</h1>
      <p class="fs-5">${esc(n.contenido)}</p>
      <button class="btn btn-outline-danger fav-btn" data-id="${n.id}">${esFav(n.id) ? '♥ Quitar de favoritos' : '♡ Agregar a favoritos'}</button>
      <a href="contacto.html" class="btn btn-primary">Contactar</a>`;
    };
    refrescar = pintar; pintar();
  },

  /* Favoritos: lista personalizada, filtros, vaciar y estado vacío */
  favoritos() {
    let cat = '';
    const pintar = () => {
      const todas = NOTICIAS.filter(n => esFav(n.id));
      const l = todas.filter(n => !cat || n.categoria === cat);
      $('#app').innerHTML = `
      <h1 class="h2">Mis favoritos</h1>
      <p class="text-muted">${todas.length} noticia(s) guardada(s)</p>
      <div class="d-flex flex-wrap gap-2 mb-3">
        ${['', ...CATS].map(c => `<button class="btn btn-sm filtro ${c === cat ? 'btn-primary' : 'btn-outline-primary'}" data-c="${c}">${c || 'Todas'}</button>`).join('')}
        <button id="vaciar" class="btn btn-sm btn-outline-danger ms-auto" ${todas.length ? '' : 'disabled'}>Vaciar lista</button>
      </div>
      ${todas.length ? `<ul class="list-group">${l.map(n => `
        <li class="list-group-item d-flex gap-3 align-items-center">
          <img src="${esc(n.imagen)}" alt="" class="thumb rounded">
          <div class="flex-grow-1"><h5 class="mb-0">${esc(n.titulo)}</h5>
            <small class="text-muted">${esc(n.categoria)} · ${esc(n.fecha)}</small>
            <p class="mb-0">${esc(n.descripcion)}</p></div>
          <a href="detalle.html?id=${n.id}" class="btn btn-primary btn-sm">Ver más</a>
          <button class="btn btn-link fav-btn" data-id="${n.id}" aria-label="Quitar">♥</button>
        </li>`).join('')}</ul>`
      : `<div class="empty text-center p-4 rounded">
          <p>Aún no guardas noticias. Explora el catálogo y haz clic en el corazón para agregarlas.</p>
          <a href="noticias.html" class="btn btn-primary">Explorar noticias</a></div>`}`;
      document.querySelectorAll('.filtro').forEach(b => b.onclick = () => { cat = b.dataset.c; pintar(); });
      $('#vaciar').onclick = () => { if (confirm('¿Vaciar toda la lista de favoritos?')) { store.set(KEYS.favs, []); pintar(); } };
    };
    refrescar = pintar; pintar();
  },

  /* Contacto (RF-04): validaciones básicas y mensaje de confirmación */
  contacto() {
    $('#app').innerHTML = `
    <h1 class="h2 mb-3">Contacto</h1>
    <div id="ok" class="alert alert-success d-none" role="alert">¡Gracias! Hemos recibido tu mensaje y te responderemos pronto.</div>
    <form id="form" novalidate class="col-lg-7">
      <div class="mb-3"><label class="form-label" for="nombre">Nombre completo *</label>
        <input id="nombre" class="form-control"><div class="invalid-feedback">El nombre es obligatorio.</div></div>
      <div class="mb-3"><label class="form-label" for="correo">Correo electrónico *</label>
        <input id="correo" type="email" class="form-control"><div class="invalid-feedback">Ingresa un correo válido.</div></div>
      <div class="mb-3"><label class="form-label" for="mensaje">Mensaje *</label>
        <textarea id="mensaje" rows="5" class="form-control"></textarea><div class="invalid-feedback">El mensaje es obligatorio.</div></div>
      <button class="btn btn-primary">Enviar mensaje</button>
    </form>`;
    const reglas = {
      nombre: v => v.trim().length > 0,
      correo: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      mensaje: v => v.trim().length > 0
    };
    $('#form').onsubmit = (e) => {
      e.preventDefault();
      let ok = true;
      for (const [id, valido] of Object.entries(reglas)) {
        const el = $('#' + id), v = valido(el.value);
        el.classList.toggle('is-invalid', !v);
        el.classList.toggle('is-valid', v);
        ok = ok && v;
      }
      $('#ok').classList.toggle('d-none', !ok);
      if (ok) { e.target.reset(); document.querySelectorAll('.is-valid').forEach(x => x.classList.remove('is-valid')); }
    };
  },

  /* Gestión (Mini CRUD): crear, buscar y eliminar con modal de confirmación */
  gestion() {
    let q = '', borrarId = null;
    $('#app').innerHTML = `
    <h1 class="h2">Gestión de noticias</h1>
    <p class="text-muted">Crea o elimina noticias del catálogo.</p>
    <div class="row g-4">
      <div class="col-lg-4"><form id="form" novalidate class="card card-body">
        <h2 class="h5">Nueva noticia</h2>
        <label class="form-label mt-2" for="titulo">Título *</label>
        <input id="titulo" class="form-control" placeholder="Título de la noticia"><div class="invalid-feedback">Obligatorio.</div>
        <label class="form-label mt-2" for="categoria">Categoría *</label>
        <select id="categoria" class="form-select"><option value="">Selecciona una categoría</option>${CATS.map(c => `<option>${c}</option>`).join('')}</select>
        <div class="invalid-feedback">Selecciona una categoría.</div>
        <label class="form-label mt-2" for="imagen">Imagen (URL)</label>
        <input id="imagen" class="form-control" placeholder="https://..."><div class="invalid-feedback">Debe iniciar con http(s)://</div>
        <label class="form-label mt-2" for="descripcion">Descripción *</label>
        <textarea id="descripcion" rows="4" class="form-control" placeholder="Resumen de la noticia"></textarea><div class="invalid-feedback">Obligatoria.</div>
        <button class="btn btn-primary mt-3">Guardar noticia</button>
      </form></div>
      <div class="col-lg-8">
        <input id="buscar" class="form-control mb-3" placeholder="Buscar noticia...">
        <div class="table-responsive"><table class="table align-middle">
          <thead><tr><th>Título</th><th>Categoría</th><th>Fecha</th><th></th></tr></thead><tbody id="filas"></tbody></table></div>
      </div>
    </div>
    <div class="modal fade" id="modal" tabindex="-1"><div class="modal-dialog"><div class="modal-content">
      <div class="modal-body"><h5>¿Eliminar esta noticia?</h5><p class="mb-0">Esta acción no se puede deshacer.</p></div>
      <div class="modal-footer"><button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button id="confirmar" class="btn btn-danger">Eliminar</button></div></div></div></div>`;

    const modal = new bootstrap.Modal($('#modal'));
    const pintar = () => {
      const l = NOTICIAS.filter(n => n.titulo.toLowerCase().includes(q.toLowerCase()));
      $('#filas').innerHTML = l.map(n => `<tr><td>${esc(n.titulo)}</td><td>${esc(n.categoria)}</td><td>${esc(n.fecha)}</td>
        <td class="text-end"><button class="btn btn-sm btn-outline-danger del" data-id="${n.id}">Eliminar</button></td></tr>`).join('')
        || '<tr><td colspan="4" class="text-muted">Sin resultados.</td></tr>';
    };
    refrescar = pintar; pintar();

    $('#buscar').oninput = (e) => { q = e.target.value; pintar(); };
    $('#filas').onclick = (e) => { const b = e.target.closest('.del'); if (b) { borrarId = +b.dataset.id; modal.show(); } };
    $('#confirmar').onclick = () => {
      NOTICIAS = NOTICIAS.filter(n => n.id !== borrarId);
      store.set(KEYS.favs, favs().filter(id => id !== borrarId)); // limpia favoritos huérfanos
      guardarNoticias(); modal.hide(); pintar();
    };
    $('#form').onsubmit = (e) => {
      e.preventDefault();
      const v = (id) => $('#' + id).value.trim();
      const reglas = { titulo: v('titulo'), categoria: v('categoria'), descripcion: v('descripcion'), imagen: !v('imagen') || /^https?:\/\//.test(v('imagen')) };
      let ok = true;
      for (const [id, val] of Object.entries(reglas)) { $('#' + id).classList.toggle('is-invalid', !val); ok = ok && !!val; }
      if (!ok) return;
      const id = Math.max(0, ...NOTICIAS.map(n => n.id)) + 1;
      NOTICIAS.push({ id, titulo: v('titulo'), categoria: v('categoria'),
        fecha: new Date().toISOString().slice(0, 10),
        imagen: v('imagen') || `https://picsum.photos/seed/n${id}/600/400`,
        descripcion: v('descripcion'), contenido: v('descripcion'), destacada: false });
      guardarNoticias(); e.target.reset(); pintar();
    };
  },

  /* Acerca de: información del proyecto */
  acerca() {
    $('#app').innerHTML = `
    <h1 class="h2 mb-3">Acerca de</h1>
    <p>Noticias Poli es una plataforma web tipo periódico desarrollada por el Conjunto 27 del Politécnico Grancolombiano (Ingeniería de Software, módulo Front End).</p>
    <p>Permite explorar noticias educativas, tecnológicas, turísticas y comerciales, ver su detalle, guardarlas en favoritos, contactarnos y gestionar el catálogo.</p>
    <h2 class="h5 mt-4">Tecnologías</h2>
    <ul><li>HTML5, CSS3 y JavaScript</li><li>Bootstrap 5</li><li>JSON local y localStorage</li></ul>`;
  }
};

/* ---------- 6. Arranque ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  const page = document.body.dataset.page;
  layout(page);
  try {
    NOTICIAS = await cargarNoticias();
    PAGES[page]();
  } catch (err) {
    console.error(err);
    $('#app').innerHTML = '<div class="alert alert-danger">No se pudieron cargar las noticias. Abre el sitio con un servidor local (p. ej. Live Server de VS Code) o desde GitHub Pages.</div>';
  }
});
