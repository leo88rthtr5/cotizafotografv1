/* THE KNIGHT CODE | Cotizador Fotografía v1.1
   Modelo C Híbrido | Ubicación y Traslado
   Vanilla ES6+ | Zero Dependencies
*/

const $ = (id) => document.getElementById(id);
const fmtMoney = (n) => '$' + Math.round(n).toLocaleString('es-MX') + ' MXN';

const PRECIOS = {
  duracion: {
    1: { label: '1 hr', base: 1500 },
    2: { label: '2 hr', base: 2800 },
    4: { label: '4 hr', base: 5000 },
    8: { label: '8 hr', base: 9000 }
  },
  tipo: {
    retrato: { label: 'Retrato', factor: 1.0 },
    evento: { label: 'Evento Social', factor: 1.3 },
    producto: { label: 'Producto / Comercial', factor: 1.6 }
  },
  extras: {
    segundo: { label: 'Segundo Fotógrafo', costo: 1500, tipo: 'fijo' },
    edicion: { label: 'Edición Avanzada', costo: 120, tipo: 'variable' },
    express: { label: 'Entrega Express 24h', factor: 0.25, tipo: 'porcentaje' }
  },
  traslado: {
    centro: { label: 'Estudio / Tehuacán Centro', costo: 0 },
    tehuacan: { label: 'Dentro de Tehuacán', costo: 150 },
    conurbada: { label: 'Zona Conurbada', costo: 400 },
    intermedia: { label: 'Ciudad Intermedia', costo: 800 },
    otra: { label: 'Otra locación', costo: null }
  }
};

const state = {
  duracion: 1,
  tipo: 'retrato',
  extras: new Set(),
  zona: 'centro',
  notas: ''
};

function init() {
  $('fechaCotizacion').textContent = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });

  // Duración
  document.querySelectorAll('[data-duracion]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.duracion = parseInt(btn.dataset.duracion);
      updateUI();
    });
  });

  // Tipo
  document.querySelectorAll('[data-tipo]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.tipo = btn.dataset.tipo;
      updateUI();
    });
  });

  // Extras
  document.querySelectorAll('[data-extra]').forEach(chk => {
    chk.addEventListener('change', () => {
      const key = chk.dataset.extra;
      if (chk.checked) state.extras.add(key);
      else state.extras.delete(key);
      updateUI();
    });
  });

  // Ubicación / Traslado
  document.querySelectorAll('[data-zona]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.zona = btn.dataset.zona;
      updateUI();
    });
  });

  // Notas
  $('notas').addEventListener('input', (e) => {
    state.notas = e.target.value.trim();
  });

  // Copiar
  $('btnCopiar').addEventListener('click', copiarResumen);

  updateUI();
}

function calculate() {
  const dur = PRECIOS.duracion[state.duracion];
  const tipo = PRECIOS.tipo[state.tipo];

  let subtotal = dur.base * tipo.factor;
  let extrasCosto = 0;

  state.extras.forEach(key => {
    const ext = PRECIOS.extras[key];
    if (ext.tipo === 'fijo') extrasCosto += ext.costo;
    if (ext.tipo === 'variable') extrasCosto += ext.costo * 20;
    if (ext.tipo === 'porcentaje') extrasCosto += subtotal * ext.factor;
  });

  const trasladoData = PRECIOS.traslado[state.zona];
  let trasladoCosto = 0;
  if (trasladoData.costo !== null) {
    trasladoCosto = trasladoData.costo;
  }

  const total = subtotal + extrasCosto + trasladoCosto;
  return { subtotal, extrasCosto, trasladoCosto, trasladoData, total, dur, tipo };
}

function updateUI() {
  const { subtotal, extrasCosto, trasladoCosto, trasladoData, total, dur, tipo } = calculate();

  // Activos
  document.querySelectorAll('[data-duracion]').forEach(b => b.classList.toggle('active', parseInt(b.dataset.duracion) === state.duracion));
  document.querySelectorAll('[data-tipo]').forEach(b => b.classList.toggle('active', b.dataset.tipo === state.tipo));
  document.querySelectorAll('[data-zona]').forEach(b => b.classList.toggle('active', b.dataset.zona === state.zona));

  // Labels
  $('duracionLabel').textContent = dur.label.toUpperCase();
  $('tipoLabel').textContent = tipo.label.toUpperCase();
  $('ubicacionLabel').textContent = trasladoData.label.toUpperCase();

  // Resumen
  $('resDuracion').textContent = `${dur.label} × ${fmtMoney(dur.base * tipo.factor)}`;
  $('resTipo').textContent = `${tipo.label} (×${tipo.factor})`;
  $('resExtras').textContent = state.extras.size === 0 ? 'Ninguno' : fmtMoney(extrasCosto);
  $('resTraslado').textContent = trasladoData.costo !== null ? fmtMoney(trasladoCosto) : 'Por confirmar';
  $('resTotal').textContent = fmtMoney(total);

  // WhatsApp
  const phone = '5212381234567'; // <-- CONFIGURA AQUÍ
  const msg = generarMensaje(total, dur, tipo, trasladoData, trasladoCosto, extrasCosto);
  $('btnWhatsApp').href = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

function generarMensaje(total, dur, tipo, trasladoData, trasladoCosto, extrasCosto) {
  let lines = [];
  lines.push('Hola, solicito información sobre una sesión fotográfica.');
  lines.push('');
  lines.push(`*Duración:* ${dur.label}`);
  lines.push(`*Tipo:* ${tipo.label}`);
  lines.push(`*Ubicación:* ${trasladoData.label}`);
  if (trasladoData.costo === null) {
    lines.push('*Traslado:* Por confirmar según dirección exacta.');
  } else {
    lines.push(`*Traslado:* ${fmtMoney(trasladoCosto)}`);
  }
  if (state.extras.size > 0) {
    lines.push('*Extras:*');
    state.extras.forEach(key => {
      const e = PRECIOS.extras[key];
      lines.push(`- ${e.label}`);
    });
  } else {
    lines.push('*Extras:* Ninguno');
  }
  lines.push('');
  lines.push(`*Total estimado:* ${fmtMoney(total)}`);
  if (state.notas) {
    lines.push('');
    lines.push(`*Notas:* ${state.notas}`);
  }
  lines.push('');
  lines.push('¿Podemos confirmar fecha y detalles?');
  return lines.join('\n');
}

function copiarResumen() {
  const { total, dur, tipo, trasladoData, trasladoCosto, extrasCosto } = calculate();
  const text = generarMensaje(total, dur, tipo, trasladoData, trasladoCosto, extrasCosto);
  navigator.clipboard.writeText(text).then(() => {
    const btn = $('btnCopiar');
    const prev = btn.textContent;
    btn.textContent = 'Copiado ✓';
    setTimeout(() => btn.textContent = prev, 1500);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}