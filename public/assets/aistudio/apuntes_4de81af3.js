/* =====================================================================
   Apuntes · Moxen
   Una app de notas dentro de una ventana de vidrio esmerilado, con sus
   semáforos dibujados (cerrar encoge la ventana hacia el dock y un clic en
   su ícono la devuelve con un rebote; minimizar la deja de miniatura; el
   verde la agranda con un resorte), una barra lateral de carpetas, una
   lista de notas con vista previa y un editor donde se escribe de verdad.

     · Cada nota tiene su papel pastel (limón, rosa, menta o cielo). Al elegir
       otro papel en el selector, el color se propaga por la hoja con una OLA
       circular que nace en el botón pulsado y un aro de luz que la acompaña.
       Al abrir otra nota con otro color la ola nace en la tarjeta que pulsaste.
     · La chincheta CAE sobre la hoja con un resorte y rebota; la nota sube a
       «Fijadas» (la lista se recoloca con FLIP). Al quitarla, vuela hacia arriba.
     · «Nueva nota» despliega una hoja desde el propio botón (con resorte), añade
       la tarjeta arriba y pone el foco en el título. El texto se guarda solo:
       «Editando…» y, a los pocos instantes, «Guardado ✓» con la marca que se traza.
     · Las notas se arrastran a una carpeta de la barra lateral: la tarjeta
       viaja pegada al puntero (con su resorte y su inclinación), la carpeta
       bajo ella se agranda y, al soltar, la nota vuela al ícono y los
       contadores ruedan. Con el dedo, mantén pulsada la nota un instante.

   Se monta sobre [data-apuntes] (ver index.html):

     const a = Apuntes(document.querySelector('[data-apuntes]'), {
       carpetas: [{ id: 'ideas', nombre: 'Ideas' }, …],            // hasta 4: llevan su color
       notas: [{ id, titulo, texto, carpeta, papel: 0–3, fijada, edit }, …],
       alCambiar: (tipo, nota) => {},   // 'guarda' | 'mueve' | 'fija' | 'papel' | 'nueva' | 'elimina'
     });
     a.nueva();   a.elige('n2');   a.cierra();   a.abre();

   Teclado: Ctrl/⌘ + N crea una nota; en la lista ↑ ↓ cambian de nota e Intro pasa
   al texto; en el editor, Intro en el título salta al texto; el chip de carpeta abre
   un menú (↑ ↓ Intro Esc) para mover la nota sin arrastrar; el selector de papel es
   un grupo de radios (← →). Los colores son variables de apuntes.css (--ap-p0 … --ap-p3).
   Solo se anima transform, opacity y clip-path; sin dependencias.
   ===================================================================== */
(function () {
  'use strict';

  /* ── resortes ─────────────────────────────────────────────────────── */
  const lim = (v, a, b) => Math.max(a, Math.min(b, v));
  const resorte = (x, k, c) => ({ x, v: 0, meta: x, k, c });
  function avanza(r, h) { r.v += (r.k * (r.meta - r.x) - r.c * r.v) * h; r.x += r.v * h; }
  const paso2 = (r, dt) => { const hh = dt / 2; avanza(r, hh); avanza(r, hh); };
  const reposa = (r, e) => Math.abs(r.meta - r.x) < (e || .01) && Math.abs(r.v) < (e || .01) * 10;
  // un resorte convertido en curva CSS linear(), para lo que se anima con WAAPI
  function muelle(k, c) {
    const pts = [0];
    let x = 0, v = 0, t = 0;
    while (t < 3) {
      v += (k * (1 - x) - c * v) / 240; x += v / 240; t += 1 / 240;
      pts.push(x);
      if (t > .15 && Math.abs(1 - x) < .001 && Math.abs(v) < .01) break;
    }
    const out = [];
    for (let i = 0; i <= 40; i++) out.push(pts[Math.round(i / 40 * (pts.length - 1))].toFixed(4));
    out[40] = '1';
    return { easing: 'linear(' + out.join(', ') + ')', duration: Math.round(t * 1000) };
  }
  function h(tag, clase, texto) { const e = document.createElement(tag); if (clase) e.className = clase; if (texto != null) e.textContent = texto; return e; }

  /* ── las notas de ejemplo ─────────────────────────────────────────── */
  const CARPETAS = [{ id: 'ideas', nombre: 'Ideas' }, { id: 'trabajo', nombre: 'Trabajo' }, { id: 'casa', nombre: 'Casa' }, { id: 'lecturas', nombre: 'Lecturas' }];
  const NOTAS = [
    { id: 'n1', titulo: 'Ideas para el sábado', carpeta: 'ideas', papel: 0, fijada: false, edit: 'Hoy',
      texto: 'Un desayuno largo en el balcón.\nPasar por la feria de las flores.\nLlevar la cámara y un cuaderno.\nPreguntar quién se suma a la caminata de la tarde.' },
    { id: 'n2', titulo: 'Lista del mercado', carpeta: 'casa', papel: 2, fijada: false, edit: 'Hoy',
      texto: '– Tomates y albahaca\n– Pan de masa madre\n– Limones\n– Aceite de oliva\n– Flores para la mesa' },
    { id: 'n3', titulo: 'Reunión de lunes', carpeta: 'trabajo', papel: 3, fijada: true, edit: 'Ayer',
      texto: 'Revisar el calendario de entregas.\nAcordar quién presenta el avance.\nPendiente: ordenar la carpeta de referencias y mandar el resumen antes de las cinco.' },
    { id: 'n4', titulo: 'Libro por leer', carpeta: 'lecturas', papel: 1, fijada: false, edit: 'Ayer',
      texto: 'Un ensayo corto sobre la paciencia.\nSubrayar lo que sirva para el taller de otoño y copiar dos frases en la libreta.' },
    { id: 'n5', titulo: 'Recetas de invierno', carpeta: 'casa', papel: 0, fijada: false, edit: 'Lun',
      texto: 'Sopa de zapallo con jengibre.\nPan de nueces para el domingo.\nCompota de manzana con canela.' },
    { id: 'n6', titulo: 'Metas del mes', carpeta: 'ideas', papel: 3, fijada: false, edit: 'Lun',
      texto: 'Caminar cada mañana.\nTerminar el cuaderno de bocetos.\nEscribir una carta a mano.' },
    { id: 'n7', titulo: 'Ideas de portada', carpeta: 'trabajo', papel: 1, fijada: false, edit: 'Dom',
      texto: 'Una forma grande y un color, nada más.\nProbar la tipografía en cursiva sobre fondo crema.' },
    { id: 'n8', titulo: 'Frases que me gustan', carpeta: 'lecturas', papel: 2, fijada: false, edit: 'Dom',
      texto: '«Lo simple también se trabaja.»\n«Primero el ritmo, después el adorno.»' },
  ];

  const ICO = {
    carpeta: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.500 8a2 2 0 0 1 2-2h4l2 2.500h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/></svg>',
    todas: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4.500" width="14" height="15" rx="3"/><path d="M9 9.500h6M9 13h4"/></svg>',
    pin: '<svg class="ap-nota-pin" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 4 5 5-3 1-3.500 3.500.5 4.500-2 2-3.500-3.500L5 20.500M9 13l-3-3 2-2 4.500.5L16 5"/></svg>',
  };
  const quita = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function Apuntes(escritorio, opciones) {
    const o = Object.assign({ carpetas: CARPETAS, notas: NOTAS, alCambiar: null }, opciones);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const q = s => escritorio.querySelector(s);
    const ventana = q('[data-ventana]'), dock = q('[data-dock]'), dockApp = q('[data-dock-app]'), dockMini = q('[data-dock-mini]'), corre = q('[data-corre]');
    const ulCarp = q('[data-carpetas]'), ulFij = q('[data-fijadas]'), ulNotas = q('[data-notas]'), etFij = q('[data-et-fij]'), etNotas = q('[data-et-notas]');
    const vacia = q('[data-vacia]'), scrollLista = q('[data-lista-scroll]'), barraT = q('[data-barra-t]'), barraC = q('[data-barra-c]');
    const busca = q('[data-busca]'), btnNueva = q('[data-nueva]');
    const papel = q('[data-papel]'), olaEl = q('[data-ola]'), aro = q('[data-aro]'), chinche = q('[data-chinche]');
    const titulo = q('[data-titulo]'), cuerpo = q('[data-cuerpo]'), chip = q('[data-chip]'), chipPt = q('[data-chip-pt]'), chipT = q('[data-chip-t]'), menu = q('[data-menu]');
    const btnFija = q('[data-fija]'), btnBorra = q('[data-borra]'), editEl = q('[data-edit]'), papeles = q('[data-papeles]');
    const estado = q('[data-estado]'), estadoT = q('[data-estado-t]'), palabras = q('[data-palabras]'), vivo = q('[data-vivo]');
    const curva = 'cubic-bezier(.22, 1, .36, 1)';
    const estrecha = () => matchMedia('(max-width: 820px)').matches;
    const NOMBRES_PAPEL = ['Limón', 'Rosa', 'Menta', 'Cielo'];

    /* ── el cilindro que rueda ───────────────────────────────────────── */
    function rueda(cont, txt, sube) {
      const viejo = cont.lastElementChild;
      if (viejo && viejo.textContent === txt) return;
      const nuevo = h('i', null, txt); cont.append(nuevo);
      if (!viejo) return;
      if (reduce) { viejo.remove(); return; }
      const d = sube ? 1 : -1;
      nuevo.animate([{ transform: 'translateY(' + 100 * d + '%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: curva });
      viejo.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(' + -100 * d + '%)', opacity: 0 }], { duration: 420, easing: curva, fill: 'forwards' }).onfinish = () => viejo.remove();
    }
    const anuncia = t => { vivo.textContent = ''; setTimeout(() => { vivo.textContent = t; }, 30); };

    /* ── los datos ───────────────────────────────────────────────────── */
    const carpetas = o.carpetas.slice(0, 4).map(c => ({ id: c.id, nombre: c.nombre, cuenta: 0 }));
    const carpetaDe = id => carpetas.find(c => c.id === id);
    let orden = 0;
    const notas = o.notas.map(n => Object.assign({ texto: '', titulo: '', papel: 0, fijada: false, edit: 'Hoy', carpeta: carpetas[0].id }, n, { orden: ++orden }));
    notas.reverse().forEach((n, i) => { n.orden = i + 1; }); notas.reverse();       // la primera de la lista es la más reciente
    let seq = notas.length, sel = null, carpetaAct = 'todas', consulta = '', papelSig = 1;
    const recuenta = () => { carpetas.forEach(c => { c.cuenta = notas.filter(n => n.carpeta === c.id).length; }); };
    recuenta();

    /* ── la barra lateral ────────────────────────────────────────────── */
    const todas = { id: 'todas', nombre: 'Todas las notas' };
    [todas, ...carpetas].forEach(c => {
      const li = h('li'), b = h('button', 'ap-carp' + (c.id === 'todas' ? '' : ' ap-k-' + c.id)); b.type = 'button'; b.dataset.id = c.id;
      b.setAttribute('aria-current', String(c.id === carpetaAct));
      b.innerHTML = (c.id === 'todas' ? ICO.todas : ICO.carpeta) + '<span class="ap-carp-n"></span><span class="ap-carp-c"><span class="ap-rc"><i></i></span></span>';
      b.querySelector('.ap-carp-n').textContent = c.nombre;
      li.append(b); ulCarp.append(li); c.btn = b; c.num = b.querySelector('.ap-rc');
      b.addEventListener('click', () => vistaCarpeta(c.id));
    });
    function pintaCuentas() {
      todas.cuenta = notas.length;
      [todas, ...carpetas].forEach(c => { const t = String(c.cuenta); if (c.num.lastElementChild.textContent !== t) { const prev = +c.num.lastElementChild.textContent || 0; if (!c.num.lastElementChild.textContent) c.num.lastElementChild.textContent = t; else rueda(c.num, t, c.cuenta > prev); } });
    }

    /* ── las tarjetas ────────────────────────────────────────────────── */
    function clasesNota(n) { return 'ap-nota ap-p' + n.papel + ' ap-k-' + n.carpeta + (n.fijada ? ' ap-fijada' : ''); }
    function resumen(n) { return n.texto.replace(/\s+/g, ' ').trim().slice(0, 140); }
    function pintaTarjeta(n) {
      const li = n.el;
      const antes = li.classList.contains('ap-origen');
      li.className = clasesNota(n) + (antes ? ' ap-origen' : '');
      n.elT.textContent = n.titulo; n.elP.textContent = resumen(n);
      n.elC.textContent = carpetaDe(n.carpeta).nombre; n.elH.textContent = n.edit;
      li.setAttribute('aria-label', (n.titulo || 'Nueva nota') + ', ' + carpetaDe(n.carpeta).nombre + (n.fijada ? ', fijada' : ''));
    }
    function creaTarjeta(n) {
      const li = h('li'); li.setAttribute('role', 'option'); li.tabIndex = -1; li.dataset.id = n.id; li.setAttribute('aria-selected', 'false');
      n.elT = h('span', 'ap-nota-t'); n.elP = h('span', 'ap-nota-p');
      const m = h('span', 'ap-nota-m'); n.elC = h('span'); n.elH = h('time');
      m.append(h('i'), n.elC, n.elH);
      li.append(n.elT, n.elP, m); li.insertAdjacentHTML('beforeend', ICO.pin);
      n.el = li; pintaTarjeta(n);
      engancha(n);
    }
    notas.forEach(creaTarjeta);

    /* qué notas se ven: la carpeta elegida y la búsqueda */
    const cumple = n => (carpetaAct === 'todas' || n.carpeta === carpetaAct) && (!consulta || quita(n.titulo + ' ' + n.texto).includes(consulta));
    function arregla() {
      const lista = notas.filter(cumple).sort((a, b) => b.orden - a.orden);
      const fij = lista.filter(n => n.fijada), res = lista.filter(n => !n.fijada);
      notas.forEach(n => { n.vis = lista.includes(n); if (!n.vis) n.el.remove(); });
      fij.forEach(n => ulFij.append(n.el)); res.forEach(n => ulNotas.append(n.el));
      etFij.hidden = ulFij.hidden = !fij.length; etNotas.hidden = ulNotas.hidden = !res.length || !fij.length;
      vacia.hidden = lista.length > 0;
      barraNum(lista.length);
      // el tabindex de la lista: solo uno es tabulable
      const t = lista.includes(sel) ? sel : lista[0];
      notas.forEach(n => { n.el.tabIndex = n === t ? 0 : -1; });
    }
    let nBarra = -1;
    function barraNum(n) { if (n !== nBarra) { rueda(barraC, String(n), n > nBarra); nBarra = n; } }
    function entrada(el, k) { if (reduce) return; el.animate([{ opacity: 0, transform: 'translateY(16px) scale(.95)' }, { opacity: 1, transform: 'none' }], { duration: 560, delay: k * 45, easing: curva, fill: 'backwards' }); }
    /* FLIP: lo que ya estaba viaja de su sitio viejo al nuevo con un resorte; lo nuevo entra */
    function flip(fn) {
      const antes = new Map();
      notas.forEach(n => { if (n.vis && n.el.isConnected) antes.set(n, n.el.getBoundingClientRect()); });
      fn();
      if (reduce) return;
      const m = muelle(230, 22); let k = 0;
      notas.forEach(n => {
        if (!n.vis || !n.el.isConnected) return;
        const a = antes.get(n), d = n.el.getBoundingClientRect();
        if (!a) { entrada(n.el, k++); return; }
        const dx = a.left - d.left, dy = a.top - d.top;
        if (Math.abs(dx) + Math.abs(dy) < 1) return;
        n.el.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'translate(0,0)' }], { duration: m.duration, easing: m.easing, composite: 'add' });
      });
    }

    /* ── la carpeta que se ve ────────────────────────────────────────── */
    function vistaCarpeta(id) {
      if (id === carpetaAct) return;
      const prev = [todas, ...carpetas].findIndex(c => c.id === carpetaAct), nuevo = [todas, ...carpetas].findIndex(c => c.id === id);
      carpetaAct = id;
      [todas, ...carpetas].forEach(c => c.btn.setAttribute('aria-current', String(c.id === id)));
      rueda(barraT, id === 'todas' ? todas.nombre : carpetaDe(id).nombre, nuevo > prev);
      flip(arregla);
      anuncia((id === 'todas' ? todas.nombre : carpetaDe(id).nombre) + ': ' + notas.filter(cumple).length + ' notas');
    }
    busca.addEventListener('input', () => { consulta = quita(busca.value.trim()); flip(arregla); });

    /* ── el editor ───────────────────────────────────────────────────── */
    function cuentaPalabras(t) { return (t.trim().match(/\S+/g) || []).length; }
    function pintaPapeles(n) {
      papeles.querySelectorAll('button').forEach((b, i) => { b.setAttribute('aria-checked', String(i === n.papel)); b.tabIndex = i === n.papel ? 0 : -1; });
    }
    NOMBRES_PAPEL.forEach((nom, i) => {
      const b = h('button', 'ap-p' + i); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-label', 'Papel ' + nom.toLowerCase()); b.title = 'Papel ' + nom.toLowerCase();
      b.addEventListener('click', () => { if (sel) cambiaPapel(sel, i, b); });
      b.addEventListener('keydown', e => {
        const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0; if (!d) return;
        e.preventDefault(); const k = (i + d + 4) % 4, nb = papeles.children[k]; nb.focus(); if (sel) cambiaPapel(sel, k, nb);
      });
      papeles.append(b);
    });
    function ponPapelClase(i) { for (let k = 0; k < 4; k++) papel.classList.toggle('ap-p' + k, k === i); }
    function pintaChip(n) {
      const c = carpetaDe(n.carpeta);
      chip.className = 'ap-chip ap-k-' + n.carpeta; chipT.textContent = c.nombre;
    }
    function muestra(n, op) {
      op = op || {};
      terminaOla();
      const cambiaColor = ponPapelRef !== n.papel;
      sel = n;
      notas.forEach(x => { x.el.setAttribute('aria-selected', String(x === n)); if (x.vis) x.el.tabIndex = x === n ? 0 : -1; });
      titulo.textContent = n.titulo; cuerpo.textContent = n.texto;
      pintaChip(n); pintaPapeles(n); editEl.textContent = 'Editada ' + n.edit.toLowerCase();
      btnFija.setAttribute('aria-pressed', String(n.fijada)); btnFija.setAttribute('aria-label', n.fijada ? 'Quitar la chincheta' : 'Fijar la nota'); btnFija.title = btnFija.getAttribute('aria-label');
      papel.classList.toggle('ap-con-chinche', n.fijada);
      pintaCuerpo(n); ponEstado(false);
      if (cambiaColor) {
        if (op.x != null && !reduce) ola(n.papel, op.x, op.y); else { ponPapelClase(n.papel); ponPapelRef = n.papel; }
      }
      if (op.contenido !== false && !reduce) {
        [titulo, cuerpo].forEach((e, i) => e.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: 60 + i * 60, easing: curva, fill: 'backwards' }));
      }
    }
    function pintaCuerpo(n) { palabras.lastElementChild.textContent = String(cuentaPalabras(n.texto)); }
    let ponPapelRef = 0;
    function elige(n, op) {
      if (typeof n === 'string') n = notas.find(x => x.id === n);
      if (!n || sel === n) return;
      const previa = sel;
      muestra(n, op);
      if (previa && !previa.titulo && !previa.texto) descarta(previa);
      anuncia((n.titulo || 'Nueva nota') + ', ' + carpetaDe(n.carpeta).nombre);
    }

    /* la ola: el papel nuevo nace en un punto y se extiende hasta la última esquina */
    let animOla = null, animAro = null;
    function terminaOla() { if (animOla) { animOla.finish(); } }
    function ola(pap, cx, cy) {
      const r = papel.getBoundingClientRect(), x = cx - r.left, y = cy - r.top;
      const R = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y)) + 6;
      olaEl.className = 'ap-ola ap-p' + pap; olaEl.style.visibility = 'visible';
      animOla = olaEl.animate([{ clipPath: 'circle(0px at ' + x + 'px ' + y + 'px)' }, { clipPath: 'circle(' + R + 'px at ' + x + 'px ' + y + 'px)' }], { duration: 820, easing: 'cubic-bezier(.35, .6, .2, 1)', fill: 'forwards' });
      aro.style.left = x + 'px'; aro.style.top = y + 'px';
      animAro = aro.animate([{ transform: 'scale(.3)', opacity: .95 }, { transform: 'scale(' + (R * 2 / 40) + ')', opacity: 0 }], { duration: 820, easing: 'cubic-bezier(.35, .6, .2, 1)' });
      const a = animOla;
      a.onfinish = a.oncancel = () => { ponPapelClase(pap); ponPapelRef = pap; olaEl.style.visibility = 'hidden'; a.cancel(); if (animOla === a) animOla = null; };
    }
    function cambiaPapel(n, i, desde) {
      if (n.papel === i) return;
      const b = desde.getBoundingClientRect();
      n.papel = i; pintaPapeles(n); pintaTarjeta(n);
      if (reduce) { ponPapelClase(i); ponPapelRef = i; } else { terminaOla(); ola(i, b.left + b.width / 2, b.top + b.height / 2); }
      edita(n, true);
      if (o.alCambiar) o.alCambiar('papel', n);
      anuncia('Papel ' + NOMBRES_PAPEL[i].toLowerCase());
    }

    /* escribir: el texto se guarda solo */
    let tGuarda = 0;
    function ponEstado(editando) {
      estado.classList.toggle('ap-edita', editando);
      estadoT.textContent = editando ? 'Editando…' : 'Guardado';
    }
    function edita(n, sinTexto) {
      n.edit = 'Hoy'; n.elH.textContent = 'Hoy'; editEl.textContent = 'Editada hoy';
      ponEstado(true); clearTimeout(tGuarda);
      tGuarda = setTimeout(() => { ponEstado(false); if (o.alCambiar) o.alCambiar('guarda', n); }, 450);
    }
    titulo.addEventListener('input', () => {
      if (!sel) return;
      if (!titulo.textContent.trim() && titulo.firstChild) titulo.textContent = '';
      sel.titulo = titulo.textContent.replace(/\s+/g, ' ').trim(); pintaTarjeta(sel); edita(sel);
    });
    cuerpo.addEventListener('input', () => {
      if (!sel) return;
      if (!cuerpo.textContent.trim() && cuerpo.firstChild) cuerpo.textContent = '';
      sel.texto = cuerpo.innerText.replace(/\n+$/, ''); pintaTarjeta(sel); pintaCuerpo(sel); edita(sel);
    });
    [titulo, cuerpo].forEach(e => e.addEventListener('paste', ev => {
      ev.preventDefault(); const t = (ev.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, e === titulo ? t.replace(/\s+/g, ' ') : t);
    }));
    titulo.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); cuerpo.focus(); colocaAlFinal(cuerpo); } });

    function colocaAlFinal(el) {
      const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    }

    /* la chincheta: cae con resorte y rebota; al quitarla vuela hacia arriba */
    function fija(n, valor) {
      if (n.fijada === valor) return;
      n.fijada = valor; pintaTarjeta(n);
      flip(arregla);
      if (sel === n) {
        btnFija.setAttribute('aria-pressed', String(valor)); btnFija.setAttribute('aria-label', valor ? 'Quitar la chincheta' : 'Fijar la nota'); btnFija.title = btnFija.getAttribute('aria-label');
        chincheta(valor);
      }
      if (o.alCambiar) o.alCambiar('fija', n);
      anuncia(valor ? 'Nota fijada' : 'Nota sin fijar');
    }
    function chincheta(on) {
      if (reduce) { papel.classList.toggle('ap-con-chinche', on); return; }
      if (on) {
        papel.classList.add('ap-con-chinche');
        const m = muelle(190, 10);
        chinche.animate([{ transform: 'translateY(-96px) rotate(26deg) scale(1.4)', opacity: 0 }, { opacity: 1, offset: .1 }, { transform: 'none', opacity: 1 }], { duration: Math.max(m.duration, 800), easing: m.easing });
        papel.animate([{ transform: 'none' }, { transform: 'translateY(2.5px) scale(.996)', offset: .5 }, { transform: 'none' }], { duration: 300, delay: 170, easing: 'ease-out' });
      } else {
        chinche.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-96px) rotate(-22deg) scale(1.3)', opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.5, 0, .85, .45)' }).onfinish = () => { if (!sel || !sel.fijada) papel.classList.remove('ap-con-chinche'); };
      }
    }
    btnFija.addEventListener('click', () => { if (sel) fija(sel, !sel.fijada); });

    /* eliminar y descartar */
    function descarta(n) {
      const i = notas.indexOf(n); if (i < 0) return;
      notas.splice(i, 1); recuenta(); pintaCuentas();
      const li = n.el;
      if (reduce) { li.remove(); flip(arregla); return; }
      li.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.9)' }], { duration: 240, easing: 'ease-in', fill: 'forwards' }).onfinish = () => { li.remove(); n.vis = false; flip(arregla); };
    }
    function elimina(n) {
      if (!n) return;
      const lista = notas.filter(cumple).sort((a, b) => b.orden - a.orden); const k = lista.indexOf(n);
      const sig = lista[k + 1] || lista[k - 1] || notas.find(x => x !== n);
      descarta(n);
      if (o.alCambiar) o.alCambiar('elimina', n);
      anuncia('Nota eliminada');
      if (sig) { sel = null; muestra(sig, { x: null }); }
    }
    btnBorra.addEventListener('click', () => { if (sel && notas.length > 1) elimina(sel); });

    /* nueva nota: una hoja que se despliega desde el botón */
    function nueva() {
      if (busca.value) { busca.value = ''; consulta = ''; }
      const n = { id: 'n' + (++seq), titulo: '', texto: '', carpeta: carpetaAct === 'todas' ? carpetas[0].id : carpetaAct, papel: papelSig++ % 4, fijada: false, edit: 'Hoy', orden: ++orden };
      const previa = sel;
      notas.unshift(n); creaTarjeta(n); recuenta(); pintaCuentas();
      flip(() => { arregla(); });
      scrollLista.scrollTo({ left: 0, top: 0, behavior: reduce ? 'auto' : 'smooth' });
      terminaOla(); sel = null; muestra(n, { contenido: false });
      ponPapelClase(n.papel); ponPapelRef = n.papel; olaEl.style.visibility = 'hidden';
      if (previa && !previa.titulo && !previa.texto) descarta(previa);
      if (!reduce) {
        const r = papel.getBoundingClientRect(), b = btnNueva.getBoundingClientRect();
        papel.style.transformOrigin = (b.left + b.width / 2 - r.left) + 'px ' + (b.top + b.height / 2 - r.top) + 'px';
        const m = muelle(120, 14);
        papel.animate([{ transform: 'scale(.1)', opacity: 0, clipPath: 'inset(0 0 60% 0 round 22px)' }, { transform: 'none', opacity: 1, clipPath: 'inset(0 0 0 0 round 22px)' }], { duration: Math.max(m.duration, 700), easing: m.easing }).onfinish = () => { papel.style.transformOrigin = ''; };
      }
      setTimeout(() => { titulo.focus(); }, reduce ? 0 : 160);
      if (o.alCambiar) o.alCambiar('nueva', n);
      anuncia('Nueva nota');
      return n;
    }
    btnNueva.addEventListener('click', nueva);
    q('[data-vacia-b]').addEventListener('click', () => { vistaCarpeta('todas'); nueva(); });

    /* mover a una carpeta: con el menú del chip o arrastrando */
    function mueve(n, id) {
      if (n.carpeta === id || !carpetaDe(id)) return;
      const antes = n.carpeta;
      n.carpeta = id; recuenta(); pintaCuentas(); pintaTarjeta(n);
      carpetaDe(id).btn.classList.remove('ap-recibe'); void carpetaDe(id).btn.offsetWidth; carpetaDe(id).btn.classList.add('ap-recibe');
      flip(arregla);
      if (sel === n) pintaChip(n);
      if (o.alCambiar) o.alCambiar('mueve', n);
      anuncia('Nota movida a ' + carpetaDe(id).nombre + ' desde ' + carpetaDe(antes).nombre);
    }
    function abreMenu() {
      menu.textContent = '';
      carpetas.forEach(c => {
        const b = h('button', 'ap-k-' + c.id); b.type = 'button'; b.setAttribute('role', 'menuitemradio'); b.setAttribute('aria-checked', String(sel && sel.carpeta === c.id));
        b.append(h('i'), document.createTextNode(c.nombre));
        b.addEventListener('click', () => { if (sel) mueve(sel, c.id); cierraMenu(true); });
        menu.append(b);
      });
      menu.hidden = false; chip.setAttribute('aria-expanded', 'true');
      if (!reduce) { const m = muelle(220, 17); menu.animate([{ opacity: 0, transform: 'scale(.82)' }, { opacity: 1, transform: 'none' }], { duration: m.duration, easing: m.easing }); }
      const act = menu.querySelector('[aria-checked="true"]') || menu.firstElementChild; act.focus();
    }
    function cierraMenu(foco) { if (menu.hidden) return; menu.hidden = true; chip.setAttribute('aria-expanded', 'false'); if (foco) chip.focus(); }
    chip.addEventListener('click', () => { if (menu.hidden) abreMenu(); else cierraMenu(true); });
    menu.addEventListener('keydown', e => {
      const bs = [...menu.children], i = bs.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); bs[(i + 1) % bs.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); bs[(i - 1 + bs.length) % bs.length].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cierraMenu(true); }
      else if (e.key === 'Tab') cierraMenu(false);
    });
    document.addEventListener('pointerdown', e => { if (!menu.hidden && !e.target.closest('.ap-carp-chip')) cierraMenu(false); });

    /* ── tarjetas: elegir con clic o teclado, y arrastrar a una carpeta ── */
    let arrastre = null, ultTouch = null;
    function engancha(n) {
      const el = n.el; let g = null;
      el.addEventListener('pointerdown', e => {
        if (e.button > 0) return;
        n.supr = false;
        g = { id: e.pointerId, x0: e.clientX, y0: e.clientY, ux: e.clientX, uy: e.clientY, activo: false, touch: e.pointerType !== 'mouse', t: 0 };
        if (g.touch) g.t = setTimeout(() => { if (g && !g.activo) empieza(n, g); }, 300);
      });
      el.addEventListener('pointermove', e => {
        if (!g || e.pointerId !== g.id) return;
        g.ux = e.clientX; g.uy = e.clientY;
        const d = Math.hypot(e.clientX - g.x0, e.clientY - g.y0);
        if (!g.activo) {
          if (g.touch) { if (d > 9) { clearTimeout(g.t); g = null; } return; }
          if (d < 6) return;
          empieza(n, g);
        }
        if (arrastre) { arrastre.px = e.clientX; arrastre.py = e.clientY; sigueArrastre(); }
      });
      const fin = e => {
        if (!g || (e && e.pointerId !== g.id)) return;
        clearTimeout(g.t); const activo = g.activo; g = null;
        if (activo) { n.supr = true; suelta(); }
      };
      el.addEventListener('pointerup', fin); el.addEventListener('pointercancel', fin);
      el.addEventListener('lostpointercapture', () => { if (g && g.activo) fin(); });
      el.addEventListener('click', e => {
        if (n.supr) { n.supr = false; return; }
        elige(n, { x: e.clientX, y: e.clientY });
      });
      el.addEventListener('keydown', e => {
        const lista = notas.filter(x => x.vis).sort((a, b) => (b.fijada - a.fijada) || (b.orden - a.orden)), i = lista.indexOf(n);
        let d = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') d = lista[Math.min(lista.length - 1, i + 1)];
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') d = lista[Math.max(0, i - 1)];
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elige(n, { x: null }); cuerpo.focus(); return; }
        else return;
        e.preventDefault(); if (d) { d.el.focus({ preventScroll: false }); elige(d, { x: null }); }
      });
    }
    function empieza(n, g) {
      g.activo = true;
      const r = n.el.getBoundingClientRect();
      const gh = n.el.cloneNode(true); gh.className = clasesNota(n) + ' ap-fantasma'; gh.removeAttribute('role'); gh.removeAttribute('aria-selected'); gh.tabIndex = -1; gh.style.width = r.width + 'px'; gh.style.height = r.height + 'px'; gh.setAttribute('aria-hidden', 'true');
      document.body.append(gh);
      arrastre = { n, g, gh, r, ox: g.ux - r.left, oy: g.uy - r.top, px: g.ux, py: g.uy, x: resorte(r.left, 520, 38), y: resorte(r.top, 520, 38), rot: 0, sobre: null, cajas: carpetas.filter(c => c.id !== n.carpeta).map(c => ({ c, r: c.btn.getBoundingClientRect() })) };
      n.el.classList.add('ap-origen');
      try { n.el.setPointerCapture(g.id); } catch (_) { /* no pasa nada */ }
      arrastre.cajas.forEach(k => k.c.btn.classList.add('ap-posible'));
      if (g.touch) document.addEventListener('touchmove', bloquea, { passive: false });
      sigueArrastre(true);
    }
    const bloquea = e => { if (arrastre) e.preventDefault(); };
    function sigueArrastre(inicio) {
      const a = arrastre; if (!a) return;
      a.x.meta = a.px - a.ox; a.y.meta = a.py - a.oy;
      if (inicio) { a.x.x = a.x.meta; a.y.x = a.y.meta; }
      // la carpeta bajo la tarjeta (se mide con el puntero y un margen generoso)
      let s = null;
      a.cajas.forEach(k => { if (a.px >= k.r.left - 8 && a.px <= k.r.right + 8 && a.py >= k.r.top - 6 && a.py <= k.r.bottom + 6) s = k; });
      if (s !== a.sobre) { if (a.sobre) a.sobre.c.btn.classList.remove('ap-sobre'); if (s) s.c.btn.classList.add('ap-sobre'); a.sobre = s; }
    }
    function suelta() {
      const a = arrastre; if (!a) return;
      arrastre = null; document.removeEventListener('touchmove', bloquea);
      a.cajas.forEach(k => k.c.btn.classList.remove('ap-posible', 'ap-sobre'));
      const gh = a.gh, x = a.x.x, y = a.y.x;
      if (a.sobre && !reduce) {
        // vuela al ícono de la carpeta, encogiéndose
        const ic = a.sobre.c.btn.querySelector('svg').getBoundingClientRect();
        const tx = ic.left + ic.width / 2 - a.r.width / 2, ty = ic.top + ic.height / 2 - a.r.height / 2;
        const destino = a.sobre.c;
        gh.animate([{ transform: 'translate3d(' + x + 'px,' + y + 'px,0) scale(1.04)', opacity: 1 }, { transform: 'translate3d(' + tx + 'px,' + ty + 'px,0) scale(.1)', opacity: 0 }], { duration: 400, easing: 'cubic-bezier(.5, 0, .75, .3)', fill: 'forwards' }).onfinish = () => { gh.remove(); a.n.el.classList.remove('ap-origen'); mueve(a.n, destino.id); };
      } else if (a.sobre) {
        gh.remove(); a.n.el.classList.remove('ap-origen'); mueve(a.n, a.sobre.c.id);
      } else if (!reduce) {
        // no cayó en ninguna carpeta: la tarjeta vuelve a su sitio con un resorte
        const r2 = a.n.el.getBoundingClientRect(), m = muelle(200, 17);
        gh.animate([{ transform: 'translate3d(' + x + 'px,' + y + 'px,0) scale(1.04)' }, { transform: 'translate3d(' + r2.left + 'px,' + r2.top + 'px,0) scale(1)' }], { duration: m.duration, easing: m.easing, fill: 'forwards' }).onfinish = () => { gh.remove(); a.n.el.classList.remove('ap-origen'); };
      } else { gh.remove(); a.n.el.classList.remove('ap-origen'); }
    }

    /* ── la ventana: semáforos y dock ────────────────────────────────── */
    let estadoV = 'abierta', grande = false, animV = null;
    const tam = { w: resorte(0, 150, 21), h: resorte(0, 150, 21) };
    function tamanios() {
      const vw = innerWidth, vh = innerHeight;
      return grande ? [vw - 28, vh - 106] : [Math.min(1060, vw - 40), Math.min(640, vh - 124)];
    }
    function aplicaTam(inst) {
      if (estrecha()) { ventana.style.removeProperty('--ap-w'); ventana.style.removeProperty('--ap-h'); return; }
      const [w, hh] = tamanios(); tam.w.meta = w; tam.h.meta = hh;
      if (inst || reduce || tam.w.x === 0) { tam.w.x = w; tam.h.x = hh; tam.w.v = tam.h.v = 0; pintaTam(); }
    }
    function pintaTam() { ventana.style.setProperty('--ap-w', tam.w.x.toFixed(1) + 'px'); ventana.style.setProperty('--ap-h', tam.h.x.toFixed(1) + 'px'); }
    function centro(r) { return [r.left + r.width / 2, r.top + r.height / 2]; }
    function haciaDock(destinoEl, dur) {
      const w = ventana.getBoundingClientRect(), d = destinoEl.getBoundingClientRect();
      const [wx, wy] = centro(w), [dx, dy] = centro(d);
      return { dx: dx - wx, dy: dy - wy, sx: Math.max(.04, d.width / w.width * .8), sy: Math.max(.04, d.height / w.height * .7) };
    }
    function oculta(destinoEl, minimiza) {
      if (estadoV !== 'abierta') return;
      estadoV = minimiza ? 'min' : 'cerrada';
      cierraMenu(false);
      if (minimiza) { dockMini.hidden = false; dockMini.style.setProperty('--ap-p0', getComputedStyle(papel).getPropertyValue('--pp')); }
      const t = haciaDock(minimiza ? dockMini : dockApp);
      corre.classList.toggle('ap-no', !minimiza);
      dockApp.setAttribute('aria-pressed', String(minimiza));
      ventana.inert = true;
      anuncia(minimiza ? 'Ventana minimizada' : 'Ventana cerrada');
      const fin = () => { ventana.style.visibility = 'hidden'; if (animV) { animV.cancel(); animV = null; } };
      if (reduce) { fin(); return; }
      if (minimiza) dockMini.animate([{ transform: 'scale(.3) translateY(14px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 560, delay: 260, easing: curva, fill: 'backwards' });
      animV = ventana.animate([{ transform: 'none', opacity: 1, offset: 0 }, { transform: 'translate(' + t.dx * .55 + 'px,' + t.dy * .5 + 'px) scale(' + (1 + t.sx) / 2.4 + ',' + (1 + t.sy) / 2.6 + ')', opacity: 1, offset: .55 }, { transform: 'translate(' + t.dx + 'px,' + t.dy + 'px) scale(' + t.sx + ',' + t.sy + ')', opacity: 0, offset: 1 }], { duration: minimiza ? 640 : 520, easing: 'cubic-bezier(.55, .05, .8, .45)', fill: 'forwards' });
      animV.onfinish = fin;
    }
    function restaura() {
      if (estadoV === 'abierta') {
        if (!reduce) dockApp.animate([{ transform: 'none' }, { transform: 'translateY(-14px)', offset: .4 }, { transform: 'none' }], { duration: 520, easing: 'ease-out' });
        return;
      }
      const venia = estadoV; estadoV = 'abierta';
      const t = haciaDock(venia === 'min' ? dockMini : dockApp);
      if (animV) { animV.cancel(); animV = null; }
      ventana.style.visibility = ''; ventana.inert = false;
      corre.classList.remove('ap-no'); dockApp.setAttribute('aria-pressed', 'true');
      dockMini.hidden = true;
      anuncia('Ventana abierta');
      if (!reduce) {
        const m = muelle(165, 17);
        ventana.animate([{ transform: 'translate(' + t.dx + 'px,' + t.dy + 'px) scale(' + t.sx + ',' + t.sy + ')', opacity: 0 }, { opacity: 1, offset: .2 }, { transform: 'none', opacity: 1 }], { duration: Math.max(m.duration, 800), easing: m.easing });
        dockApp.animate([{ transform: 'none' }, { transform: 'translateY(-16px)', offset: .35 }, { transform: 'none' }], { duration: 560, easing: 'ease-out' });
      }
      cuerpo.blur();
    }
    ventana.querySelectorAll('[data-luz]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.luz;
      if (k === 'cierra') oculta(dockApp, false);
      else if (k === 'minimiza') oculta(dockMini, true);
      else { grande = !grande; b.setAttribute('aria-pressed', String(grande)); b.setAttribute('aria-label', grande ? 'Reducir la ventana' : 'Ampliar la ventana'); aplicaTam(false); }
    }));
    dockApp.addEventListener('click', restaura); dockMini.addEventListener('click', restaura);

    /* ── atajos del documento ────────────────────────────────────────── */
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') { e.preventDefault(); if (estadoV !== 'abierta') restaura(); setTimeout(nueva, estadoV === 'abierta' ? 0 : 400); }
      else if (e.key === 'Escape' && !menu.hidden) cierraMenu(true);
    });

    /* ── el cuadro: el tamaño de la ventana y la tarjeta que se arrastra ─ */
    let antes = 0;
    function cuadro(ts) {
      const dt = lim((ts - (antes || ts)) / 1000, 0, 1 / 30); antes = ts;
      if (!reposa(tam.w, .3) || !reposa(tam.h, .3)) { if (reduce) { tam.w.x = tam.w.meta; tam.h.x = tam.h.meta; } else { paso2(tam.w, dt); paso2(tam.h, dt); } pintaTam(); }
      if (arrastre) {
        const a = arrastre;
        if (reduce) { a.x.x = a.x.meta; a.y.x = a.y.meta; a.x.v = 0; } else { paso2(a.x, dt); paso2(a.y, dt); }
        const rot = reduce ? 0 : lim(a.x.v * .0045, -9, 9);
        a.gh.style.transform = 'translate3d(' + a.x.x.toFixed(1) + 'px,' + a.y.x.toFixed(1) + 'px,0) rotate(' + rot.toFixed(2) + 'deg) scale(1.04)';
      }
      requestAnimationFrame(cuadro);
    }

    /* ── arranque ────────────────────────────────────────────────────── */
    function arranca() {
      recuenta(); pintaCuentas();
      rueda(barraT, todas.nombre, true);
      arregla();
      aplicaTam(true);
      sel = null; muestra(notas[0], { contenido: false });
      notas.filter(n => n.vis).forEach((n, k) => entrada(n.el, k));
      requestAnimationFrame(cuadro);
    }
    addEventListener('resize', () => aplicaTam(false), { passive: true });
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(arranca);

    return { nueva, elige: id => elige(id, { x: null }), cierra: () => oculta(dockApp, false), abre: restaura, mueve: (id, c) => { const n = notas.find(x => x.id === id); if (n) mueve(n, c); } };
  }

  window.Apuntes = Apuntes;
})();
