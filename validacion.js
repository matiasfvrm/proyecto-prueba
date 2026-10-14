/* FigTalent — validación de formularios (nombre, correo y WhatsApp).
   Se usa en el navegador (window.FigValidacion) y también se puede probar con Node. */
(function (root) {
  'use strict';

  const quitarTildes = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  /* ───────────── NOMBRE ───────────── */
  const CONECTORES = ['de', 'del', 'la', 'las', 'los', 'y', 'da', 'das', 'do', 'dos', 'van', 'von', 'di', 'e'];
  const PALABRAS_FALSAS = [
    'test', 'testing', 'prueba', 'pruebas', 'asdf', 'qwerty', 'fulano', 'mengano', 'sutano', 'zutano',
    'perengano', 'nombre', 'apellido', 'usuario', 'user', 'admin', 'demo', 'fake', 'falso', 'falsa',
    'nadie', 'ninguno', 'lorem', 'ipsum', 'anonimo', 'anonima', 'null', 'undefined', 'nose', 'xd',
    'jaja', 'jajaja', 'hola', 'chao', 'abc', 'abcd', 'example', 'ejemplo', 'random', 'nn'
  ];
  const TECLADO = ['qwert', 'werty', 'asdfg', 'sdfgh', 'dfghj', 'fghjk', 'ghjkl', 'zxcvb', 'xcvbn', 'cvbnm', 'poiuy', 'lkjhg', 'mnbvc'];

  function capitalizar(nombre) {
    return nombre.split(' ').map((p, i) =>
      i > 0 && CONECTORES.includes(p.toLowerCase())
        ? p.toLowerCase()
        : p.toLocaleLowerCase('es').replace(/(^|[-'’])(\p{L})/gu, (_, sep, l) => sep + l.toLocaleUpperCase('es'))
    ).join(' ');
  }

  /** Devuelve {ok:true, valor} o {ok:false, error}. */
  function validarNombre(entrada) {
    const s = String(entrada || '').normalize('NFC').replace(/\s+/g, ' ').trim();
    if (!s) return { ok: false, error: 'Escribe tu nombre y apellido.' };
    if (s.length > 60) return { ok: false, error: 'El nombre es demasiado largo.' };
    if (/\d/.test(s)) return { ok: false, error: 'El nombre no puede tener números.' };
    if (!/^\p{L}[\p{L}'’-]*( \p{L}[\p{L}'’-]*)*$/u.test(s)) {
      return { ok: false, error: 'Usa solo letras (sin símbolos ni emojis).' };
    }
    const palabras = s.split(' ');
    const principales = palabras.filter(p => !CONECTORES.includes(p.toLowerCase()));
    if (principales.length < 2) return { ok: false, error: 'Escribe al menos un nombre y un apellido.' };

    const inventado = { ok: false, error: 'Ese nombre no parece real. Escribe tu nombre y apellido verdaderos.' };
    for (const p of principales) {
      const n = quitarTildes(p).replace(/['’-]/g, '');
      if (n.length < 2) return { ok: false, error: 'Cada nombre y apellido debe tener al menos 2 letras.' };
      if (/(.)\1\1/.test(n)) return inventado;                       // "aaa", "lll"
      if (!/[aeiouy]/.test(n) && n !== 'ng') return inventado;      // sin vocales: "brrr", "xyz"
      if (/[bcdfghjklmnñpqrstvwxz]{5,}/.test(n)) return inventado;   // "sdfgh"
      if (/[aeiou]{5,}/.test(n)) return inventado;                   // "aeiou"
      if (PALABRAS_FALSAS.includes(n)) return inventado;
      if (TECLADO.some(t => n.includes(t))) return inventado;
      if (n.length >= 4 && /^(..)\1+$/.test(n)) return inventado;    // "jaja", "lolo lolo"
    }
    const unicas = new Set(principales.map(p => quitarTildes(p)));
    if (unicas.size === 1) return inventado;                         // "Ana Ana"
    return { ok: true, valor: capitalizar(s) };
  }

  /* ───────────── CORREO ───────────── */
  const DOMINIOS_CONOCIDOS = [
    'gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.es', 'outlook.com', 'outlook.es', 'live.com', 'live.com.mx',
    'msn.com', 'yahoo.com', 'yahoo.es', 'yahoo.com.mx', 'ymail.com', 'icloud.com', 'me.com', 'mac.com',
    'aol.com', 'protonmail.com', 'proton.me', 'mail.com', 'gmx.com', 'gmx.es', 'zoho.com', 'yandex.com', 'hey.com'
  ];
  const DOMINIOS_TEMPORALES = [
    'mailinator.com', '10minutemail.com', '10minutemail.net', 'guerrillamail.com', 'guerrillamail.net', 'sharklasers.com',
    'grr.la', 'yopmail.com', 'yopmail.net', 'tempmail.com', 'temp-mail.org', 'temp-mail.io', 'tempmail.net', 'tempail.com',
    'trashmail.com', 'getnada.com', 'nada.email', 'dispostable.com', 'maildrop.cc', 'throwawaymail.com', 'fakeinbox.com',
    'mohmal.com', 'emailondeck.com', 'mintemail.com', 'mailnesia.com', 'mytemp.email', 'tempr.email', 'moakt.com',
    'spamgourmet.com', 'getairmail.com', 'burnermail.io', 'mailcatch.com', 'inboxkitten.com', 'emailfake.com',
    'fakemail.net', 'tmpmail.org', 'tmpmail.net', 'minuteinbox.com', 'discard.email', 'mailpoof.com', 'example.com',
    'example.org', 'example.net', 'test.com', 'prueba.com', 'correo.com', 'email.com'
  ];
  const LOCALES_FALSOS = ['test', 'prueba', 'asdf', 'qwerty', 'fake', 'falso', 'noreply', 'no-reply', 'nadie', 'xxx', 'aaa', 'abc', 'abc123', '123', '1234', '12345', '123456', 'example', 'ejemplo', 'correo', 'email', 'mail'];

  function distancia(a, b) {
    const m = a.length, n = b.length;
    const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[m][n];
  }

  /** Revisión sin red (formato, errores de escritura, correos temporales). */
  function validarCorreoFormato(entrada) {
    const s = String(entrada || '').trim().toLowerCase();
    if (!s) return { ok: false, error: 'Escribe tu correo electrónico.' };
    if (s.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(s)) {
      return { ok: false, error: 'Ese correo no tiene un formato válido (ej. nombre@gmail.com).' };
    }
    const [local, dominio] = s.split('@');
    if (local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
      return { ok: false, error: 'Ese correo no tiene un formato válido.' };
    }
    if (!/\.[a-z]{2,}$/.test(dominio)) return { ok: false, error: 'El dominio del correo no es válido.' };
    if (DOMINIOS_TEMPORALES.includes(dominio)) {
      return { ok: false, error: 'No se aceptan correos temporales o de prueba. Usa tu correo real.' };
    }
    if (LOCALES_FALSOS.includes(local.replace(/[._-]/g, ''))) {
      return { ok: false, error: 'Ese correo no parece real. Usa tu correo personal.' };
    }
    if (!DOMINIOS_CONOCIDOS.includes(dominio)) {
      const sugerido = DOMINIOS_CONOCIDOS.find(d => distancia(dominio, d) <= 2);
      if (sugerido) {
        return { ok: false, error: `¿Quisiste decir ${local}@${sugerido}?`, sugerencia: `${local}@${sugerido}` };
      }
    }
    return { ok: true, valor: s, dominio };
  }

  const cacheMX = new Map();
  /** Consulta DNS pública: ¿el dominio existe y recibe correo? true / false / null (no se pudo consultar). */
  async function dominioRecibeCorreo(dominio) {
    if (cacheMX.has(dominio)) return cacheMX.get(dominio);
    const urls = [
      `https://dns.google/resolve?name=${encodeURIComponent(dominio)}&type=MX`,
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(dominio)}&type=MX`
    ];
    for (const url of urls) {
      try {
        const r = await fetch(url, { headers: { accept: 'application/dns-json' } });
        if (!r.ok) continue;
        const j = await r.json();
        let res;
        if (j.Status === 3) res = false;                               // el dominio no existe
        else if (j.Status !== 0) continue;
        else {
          const mx = (j.Answer || []).filter(a => a.type === 15);
          res = mx.length > 0 && !mx.every(a => /^\d+\s+\.?$/.test(String(a.data).trim())); // "0 ." = no recibe correo
        }
        cacheMX.set(dominio, res);
        return res;
      } catch (e) { /* probar el siguiente servidor */ }
    }
    return null;
  }

  async function validarCorreo(entrada) {
    const f = validarCorreoFormato(entrada);
    if (!f.ok) return f;
    const mx = await dominioRecibeCorreo(f.dominio);
    if (mx === false) return { ok: false, error: `El dominio "${f.dominio}" no existe o no recibe correos.` };
    if (mx === null) return { ok: false, error: 'No pudimos comprobar tu correo. Revisa tu conexión e inténtalo de nuevo.' };
    return f;
  }

  /* ───────────── WHATSAPP ───────────── */
  const TIPOS_NO_WHATSAPP = ['TOLL_FREE', 'PREMIUM_RATE', 'SHARED_COST', 'VOICEMAIL', 'PAGER', 'UAN'];

  /** lib = libphonenumber-js (versión "max"). Devuelve {ok, e164, internacional, pais} o {ok:false, error}. */
  function validarWhatsApp(lib, pais, entrada) {
    if (!lib) return { ok: false, error: 'No se pudo cargar el validador de teléfonos. Recarga la página.' };
    const raw = String(entrada || '').trim();
    if (!raw) return { ok: false, error: 'Escribe tu número de WhatsApp.' };
    if (/[a-z]/i.test(raw)) return { ok: false, error: 'El número solo puede tener dígitos.' };
    let p;
    try { p = lib.parsePhoneNumber(raw, pais); } catch (e) { p = null; }
    if (!p || !p.isValid()) {
      return { ok: false, error: 'Ese número no existe. Revisa el país y los dígitos (puedes escribirlo con o sin el 0 inicial).' };
    }
    const tipo = p.getType();
    if (tipo === 'FIXED_LINE') return { ok: false, error: 'Ese es un teléfono fijo. Escribe tu número de celular con WhatsApp.' };
    if (TIPOS_NO_WHATSAPP.includes(tipo)) return { ok: false, error: 'Ese número es de servicio, no de un celular.' };
    const nac = String(p.nationalNumber);
    const ultimos7 = nac.slice(-7);
    const ficticioNANP = p.countryCallingCode === '1' && /^\d{3}55501\d{2}$/.test(nac); // 555-01XX: números de películas
    if (/(\d)\1{5,}/.test(nac) || '01234567890'.includes(ultimos7) || '98765432109'.includes(ultimos7) || ficticioNANP) {
      return { ok: false, error: 'Ese número no parece real. Escribe tu número de WhatsApp verdadero.' };
    }
    return { ok: true, e164: p.number, internacional: p.formatInternational(), pais: p.country };
  }

  const api = { validarNombre, validarCorreoFormato, validarCorreo, dominioRecibeCorreo, validarWhatsApp, capitalizar };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FigValidacion = api;
})(typeof window !== 'undefined' ? window : globalThis);
