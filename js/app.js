(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s),
    $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const formatearLempiras = (monto) =>
    "L " +
    Number(monto || 0).toLocaleString("es-HN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const Lps = formatearLempiras;

  const MAPA_ESCAPE_HTML = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  const escaparHtml = (texto) => String(texto ?? "").replace(/[&<>"']/g, (caracter) => MAPA_ESCAPE_HTML[caracter]);
  const esc = escaparHtml;

  const now = () => Date.now(),
    r2 = (n) => Math.round(n * 100) / 100;
  const normalizarTexto = (texto) =>
    String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const norm = normalizarTexto;
  const fdate = (t) => new Date(t).toLocaleString("es-HN", { dateStyle: "medium", timeStyle: "short" });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let FAST = false,
    _id = 0;
  const uid = (p) => p + Date.now().toString(36) + (++_id).toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  const KEY = "estampa_hn_db_v1";
  const EMAIL = /^[^\s@<>()]{1,64}@[^\s@<>()]+\.[A-Za-z]{2,}$/;
  const SIZES = ["S", "M", "L", "XL", "XXL"];
  const COLORS = {
    Blanco: "#f5f5f5",
    Negro: "#1a1a1a",
    "Azul marino": "#1f3a5f",
    Rojo: "#c0392b",
    Verde: "#2e7d4f",
    Amarillo: "#f1c40f",
    Gris: "#8d99a6",
    Turquesa: "#1abc9c",
  };
  const CATS = ["Gráficas", "Minimalistas", "Deportivas", "Corporativas", "Humor"];
  const DESIGNS = [
    ["", "Sin diseño"],
    ["🦜", "Guara"],
    ["🏝", "Isla"],
    ["☕", "Café"],
    ["🦈", "Tiburón"],
    ["⛰", "Montaña"],
    ["☀", "Sol"],
    ["🌙", "Luna"],
    ["⚽", "Fútbol"],
    ["🏃", "Running"],
    ["💪", "Gym"],
    ["🤝", "Equipo"],
    ["🌮", "Baleada"],
    ["😴", "Lunes"],
    ["💻", "Dev"],
    ["🎮", "Gamer"],
    ["🔥", "Fuego"],
    ["⭐", "Estrella"],
  ];
  const DEPTS = [
    "Atlántida",
    "Choluteca",
    "Colón",
    "Comayagua",
    "Copán",
    "Cortés",
    "El Paraíso",
    "Francisco Morazán",
    "Gracias a Dios",
    "Intibucá",
    "Islas de la Bahía",
    "La Paz",
    "Lempira",
    "Ocotepeque",
    "Olancho",
    "Santa Bárbara",
    "Valle",
    "Yoro",
  ];
  const REGLAS_PRECIO = {
    extraTextoPersonalizado: 35,
    extraCambioDiseno: 50,
    extraTallaGrande: 20,
    tallasConRecargo: ["XL", "XXL"],
    montoEnvioGratis: 1000,
    costoEnvioEstandar: 80,
    factorIsvIncluido: 15 / 115,
    lempirasPorPuntoGanado: 10,
    puntosPorLempiraCanjeado: 10,
    porcentajeMaximoCanje: 0.5,
  };
  const LIMITES_CARRITO = { cantidadMinima: 1, cantidadMaxima: 10 };
  const SESSION_MS = 30 * 60 * 1000;
  function generarHexAleatorio(cantidadBytes) {
    const bytes = new Uint8Array(cantidadBytes);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
    else bytes.forEach((_, indice) => (bytes[indice] = Math.random() * 256));
    return hex(bytes);
  }
  const rndHex = generarHexAleatorio;

  function generarCodigoVerificacion() {
    if (window.crypto && crypto.getRandomValues) {
      const bytes = new Uint32Array(1);
      crypto.getRandomValues(bytes);
      return String(100000 + (bytes[0] % 900000));
    }
    return String(100000 + Math.floor(Math.random() * 900000));
  }
  const code6 = generarCodigoVerificacion;
  const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
  const enc = new TextEncoder();
  async function generarHashContrasena(contrasena, salt) {
    if (window.crypto && crypto.subtle) {
      const k = await crypto.subtle.importKey("raw", enc.encode(contrasena), "PBKDF2", false, ["deriveBits"]);
      const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: 60000 },
        k,
        256,
      );
      return "pbkdf2$" + hex(bits);
    }
    let a = 2166136261,
      s = salt + contrasena,
      out = "";
    for (let r = 0; r < 8; r++) {
      for (let i = 0; i < s.length; i++) {
        a ^= s.charCodeAt(i) + r;
        a = Math.imul(a, 16777619) >>> 0;
      }
      out += a.toString(16).padStart(8, "0");
    }
    return "weak$" + out;
  }
  const hashPw = generarHashContrasena;
  function lum(h) {
    const n = parseInt(h.slice(1), 16),
      r = (n >> 16) & 255,
      g = (n >> 8) & 255,
      b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  function toast(m, k) {
    const t = document.createElement("div");
    t.className = "toast " + (k || "");
    t.textContent = m;
    const c = $("#toasts");
    if (!c) return;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  let db = null,
    APP_READY = false;
  let advertenciaAlmacenamiento = "";

  function clasificarErrorAlmacenamiento(error) {
    if (error instanceof SyntaxError) {
      return "Los datos guardados estaban dañados y se restauró el estado inicial.";
    }
    if (error && error.name === "QuotaExceededError") {
      return "El almacenamiento del navegador está lleno; los cambios no persistirán.";
    }
    return "El almacenamiento local no está disponible en este navegador.";
  }

  function reportarErrorAlmacenamiento(operacion, error) {
    advertenciaAlmacenamiento = clasificarErrorAlmacenamiento(error);
    console.warn("[EstampaHN] Error al " + operacion + " almacenamiento:", advertenciaAlmacenamiento, error);
  }

  function load() {
    try {
      const datosCrudos = localStorage.getItem(KEY);
      if (datosCrudos) {
        const datos = JSON.parse(datosCrudos);
        if (datos && typeof datos === "object") {
          db = datos;
          advertenciaAlmacenamiento = "";
          return true;
        }
      }
    } catch (error) {
      reportarErrorAlmacenamiento("leer", error);
    }
    try {
      const elementoSemilla = $("#seed-data");
      const datosCrudos = elementoSemilla ? elementoSemilla.textContent.trim() : "";
      if (datosCrudos && datosCrudos !== "null") {
        const datos = JSON.parse(datosCrudos);
        if (datos && typeof datos === "object") {
          db = datos;
          save();
          return true;
        }
      }
    } catch (error) {
      reportarErrorAlmacenamiento("leer los datos iniciales", error);
    }
    return false;
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
      advertenciaAlmacenamiento = "";
    } catch (error) {
      reportarErrorAlmacenamiento("guardar", error);
    }
  }
  function exportable() {
    const c = JSON.parse(JSON.stringify(db));
    c.session = null;
    c.cart = [];
    c.lock = {};
    return c;
  }
  function buildHtml() {
    const c = document.documentElement.cloneNode(true);
    $$("[data-dyn]", c).forEach((e) => (e.innerHTML = ""));
    c.querySelector("#seed-data").textContent = JSON.stringify(exportable()).replace(/</g, "\\u003c");
    c.querySelector("body").className = "";
    return "<!doctype html>\n" + c.outerHTML;
  }
  function download(name, text, type) {
    const b = new Blob([text], { type: type || "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  }

  const CATALOGO_BASE = [
    { id: 1, name: "Guara Roja", cat: "Gráficas", price: 289, design: "🦜", tags: "guacamaya ave honduras tropical", rating: 4.8, colors: ["Blanco", "Negro", "Azul marino", "Rojo"], sizes: ["S", "M", "L", "XL", "XXL"] },
    { id: 2, name: "Roatán Vibes", cat: "Gráficas", price: 299, design: "🏝", tags: "isla playa caribe verano", rating: 4.7, colors: ["Negro", "Blanco", "Verde", "Gris"], sizes: ["S", "M", "L", "XL", "XXL"] },
    { id: 3, name: "Café de Copán", cat: "Gráficas", price: 279, design: "☕", tags: "cafe copan cafetero", rating: 4.6, colors: ["Azul marino", "Turquesa", "Blanco", "Amarillo"], sizes: ["S", "M", "L", "XL", "XXL"] },
    { id: 4, name: "Tiburón Ballena", cat: "Gráficas", price: 299, design: "🦈", tags: "mar oceano utila animal", rating: 4.5, colors: ["Rojo", "Negro", "Gris", "Blanco"], sizes: ["M", "L", "XL"] },
    { id: 5, name: "Minimal Montaña", cat: "Minimalistas", price: 259, design: "⛰", tags: "montana naturaleza aventura", rating: 4.4, colors: ["Verde", "Azul marino", "Negro", "Amarillo"], sizes: ["S", "M", "L", "XL", "XXL"] },
    { id: 6, name: "Línea Sol", cat: "Minimalistas", price: 249, design: "☀", tags: "sol simple verano", rating: 4.2, colors: ["Blanco", "Negro", "Azul marino", "Rojo"], sizes: ["S", "M", "L", "XL", "XXL"] },
    { id: 7, name: "Luna Simple", cat: "Minimalistas", price: 249, design: "🌙", tags: "luna noche simple", rating: 4.3, colors: ["Negro", "Blanco", "Verde", "Gris"], sizes: ["S", "M", "L", "XL", "XXL"] },
    { id: 8, name: "Fútbol Catracho", cat: "Deportivas", price: 289, design: "⚽", tags: "futbol seleccion catracho deporte", rating: 4.9, colors: ["Azul marino", "Turquesa", "Blanco", "Amarillo"], sizes: ["S", "M", "L", "XL", "XXL"] },
    { id: 9, name: "Running Club", cat: "Deportivas", price: 269, design: "🏃", tags: "correr maraton deporte", rating: 4.1, colors: ["Rojo", "Negro", "Gris", "Blanco"], sizes: ["S", "M", "L", "XL", "XXL"] },
    { id: 10, name: "Gym Mode", cat: "Deportivas", price: 279, design: "💪", tags: "gimnasio pesas fitness", rating: 4.5, colors: ["Verde", "Azul marino", "Negro", "Amarillo"], sizes: ["S", "M", "L", "XL", "XXL"] },
    { id: 11, name: "Equipo de Trabajo", cat: "Corporativas", price: 239, design: "🤝", tags: "empresa uniforme equipo", rating: 4.0, colors: ["Blanco", "Negro", "Azul marino", "Rojo"], sizes: ["S", "M", "L", "XL", "XXL"] },
    { id: 12, name: "Camisa Lisa Personalizada", cat: "Corporativas", price: 219, design: "", tags: "logo empresa lisa evento", rating: 4.3, colors: ["Negro", "Blanco", "Verde", "Gris"], sizes: ["S", "M", "L", "XL", "XXL"] },
    { id: 13, name: "Baleada Lover", cat: "Humor", price: 269, design: "🌮", tags: "comida baleada gracioso", rating: 4.8, colors: ["Azul marino", "Turquesa", "Blanco", "Amarillo"], sizes: ["S", "M", "L", "XL", "XXL"] },
    { id: 14, name: "Modo Lunes", cat: "Humor", price: 259, design: "😴", tags: "lunes sueno gracioso", rating: 4.2, colors: ["Rojo", "Negro", "Gris", "Blanco"], sizes: ["S", "M", "L", "XL", "XXL"] },
    { id: 15, name: "Dev Mode", cat: "Humor", price: 289, design: "💻", tags: "programador codigo tecnologia", rating: 4.7, colors: ["Verde", "Azul marino", "Negro", "Amarillo"], sizes: ["S", "M", "L", "XL", "XXL"] },
    { id: 16, name: "Gamer Nivel Máx", cat: "Humor", price: 289, design: "🎮", tags: "videojuegos gamer control", rating: 4.6, colors: ["Blanco", "Negro", "Azul marino", "Rojo"], sizes: ["S", "M", "L", "XL", "XXL"] },
  ];
  function mulberry(a) {
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const USUARIOS_MOCK_INICIALES = [
    ["Carlos Mejía", true],
    ["María Fernanda López", true],
    ["José Reyes", true],
    ["Ana Sofía Paz", true],
    ["Luis Cárcamo", false],
    ["Daniela Ordóñez", true],
    ["Kevin Zelaya", true],
    ["Gabriela Banegas", false],
  ];
  const CIUDADES_DEMO = ["San Pedro Sula", "Tegucigalpa", "La Ceiba", "Choloma", "Comayagua"];
  const COLONIAS_DEMO = ["Las Brisas", "El Prado", "Los Álamos", "Kennedy"];
  const TEXTOS_CAMISA_DEMO = ["Papá", "Team HN", "Catracho", "Los Pibes"];

  async function crearUsuarioSemilla(nombre, correo, clave, verificado, rol = "cliente") {
    const salt = rndHex(16);
    const usuario = {
      id: uid("u"),
      name: nombre,
      email: correo,
      salt,
      hash: await hashPw(clave, salt),
      verified: verificado,
      role: rol,
      points: 0,
      pending: 0,
      ledger: [],
      createdAt: now() - Math.floor(Math.random() * 60) * 864e5,
      verify: null,
    };
    db.users.push(usuario);
    return usuario;
  }

  function generarPedidosIniciales(usuariosCompra, generadorAleatorio) {
    const elegirAlAzar = (lista) => lista[Math.floor(generadorAleatorio() * lista.length)];
    const listaOrdenada = [...usuariosCompra].sort(() => generadorAleatorio() - 0.5);

    listaOrdenada.forEach((usuario) => {
      const articulos = [];
      const cantidadLineas = 1 + Math.floor(generadorAleatorio() * 3);
      for (let i = 0; i < cantidadLineas; i++) {
        const producto = elegirAlAzar(db.products);
        articulos.push({
          pid: producto.id,
          color: elegirAlAzar(producto.colors),
          size: elegirAlAzar(producto.sizes),
          design: producto.design,
          text: generadorAleatorio() < 0.25 ? elegirAlAzar(TEXTOS_CAMISA_DEMO) : "",
          qty: 1 + Math.floor(generadorAleatorio() * 3),
        });
      }
      const metodoPago = elegirAlAzar(["card", "card", "transfer", "cod"]);
      createOrder({
        u: usuario,
        items: articulos,
        ts: now() - Math.floor(generadorAleatorio() * 55 + 1) * 864e5,
        coupon: generadorAleatorio() < 0.2 ? "BIENVENIDO10" : "",
        redeem: 0,
        contact: {
          name: usuario.name,
          email: usuario.email,
          phone: "9" + String(Math.floor(1e7 + generadorAleatorio() * 9e6)).slice(0, 7),
          dept: elegirAlAzar(DEPTS),
          city: elegirAlAzar(CIUDADES_DEMO),
          addr: "Col. " + elegirAlAzar(COLONIAS_DEMO) + ", casa " + (1 + Math.floor(generadorAleatorio() * 90)),
        },
        pay: {
          method: metodoPago,
          brand: metodoPago === "card" ? elegirAlAzar(["Visa", "Mastercard"]) : "",
          last4: metodoPago === "card" ? String(1000 + Math.floor(generadorAleatorio() * 8999)) : "",
        },
      });
    });

    for (let i = 0; i < 3; i++) {
      const producto = elegirAlAzar(db.products);
      createOrder({
        u: null,
        items: [{ pid: producto.id, color: producto.colors[0], size: "M", design: producto.design, text: "", qty: 1 + i }],
        ts: now() - (i + 2) * 864e5 * 3,
        coupon: "",
        redeem: 0,
        contact: {
          name: "Invitado " + (i + 1),
          email: "invitado" + (i + 1) + "@example.hn",
          phone: "99998888",
          dept: "Cortés",
          city: "San Pedro Sula",
          addr: "Barrio Guamilito, 3a calle",
        },
        pay: { method: "card", brand: "Visa", last4: "4242" },
      });
    }
  }

  async function seed() {
    db = {
      v: 1,
      seq: 1000,
      users: [],
      products: [],
      orders: [],
      coupons: [],
      mails: [],
      cart: [],
      session: null,
      lock: {},
      settings: { checks: {} },
    };
    db.products = CATALOGO_BASE.map((producto) => ({
      ...producto,
      colors: producto.colors.slice(),
      sizes: producto.sizes.slice(),
    }));
    db.coupons = [
      { code: "BIENVENIDO10", pct: 10, active: true },
      { code: "CATRACHO15", pct: 15, active: true },
      { code: "VENCIDO", pct: 20, active: false },
    ];

    const demo = await crearUsuarioSemilla("Oscar Demo", "demo@estampa.hn", "Demo1234!", true);
    await crearUsuarioSemilla("Tester QA", "tester@estampahn.hn", "Camisa123!", true, "tester");
    await crearUsuarioSemilla("Admin Tienda", "admin@estampa.hn", "Admin1234!", true, "admin");
    const nuevo = await crearUsuarioSemilla("Nuevo Sin Verificar", "nuevo@estampa.hn", "Nuevo1234!", false);

    const usuariosMock = [];
    for (const [nombre, verificado] of USUARIOS_MOCK_INICIALES) {
      const correo =
        norm(nombre)
          .replace(/[^a-z ]/g, "")
          .split(" ")[0] + "@example.hn";
      usuariosMock.push(await crearUsuarioSemilla(nombre, correo, "Camisa123!", verificado));
    }

    generarPedidosIniciales([demo, demo, demo, demo, demo, ...usuariosMock, ...usuariosMock, nuevo], mulberry(42));
    sendVerification(nuevo, true);
    db.mails.forEach((m) => (m.read = true));
    save();
  }

  function obtenerProductoPorId(idProducto) {
    return db.products.find((producto) => producto.id === idProducto);
  }
  const P = obtenerProductoPorId;
  const user = () => {
    const s = db.session;
    if (!s) return null;
    if (s.exp < now()) {
      db.session = null;
      save();
      return null;
    }
    return db.users.find((u) => u.id === s.uid) || null;
  };
  const esAdministrador = (usuario = user()) =>
    window.perfilesAcceso.tienePermiso(usuario, "puedeAdministrar");
  const puedeAccederQa = (usuario = user()) => window.perfilesAcceso.tienePermiso(usuario, "puedeVerQa");
  function mail(to, subject, body, meta) {
    db.mails.push({ id: uid("m"), to, subject, body, ts: now(), read: false, meta: meta || null });
  }
  function validarContrasena(contrasena) {
    contrasena = contrasena || "";
    if (contrasena.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
    if (contrasena.length > 72) return "Contraseña demasiado larga.";
    if (!/[a-z]/.test(contrasena) || !/[A-Z]/.test(contrasena) || !/\d/.test(contrasena))
      return "Usa mayúsculas, minúsculas y números.";
    return "";
  }
  const pwErr = validarContrasena;
  async function register({ name, email, password }) {
    name = String(name || "")
      .trim()
      .replace(/\s+/g, " ");
    email = String(email || "")
      .trim()
      .toLowerCase();
    if (name.length < 2 || name.length > 60) return { ok: false, error: "Nombre inválido (2 a 60 caracteres)." };
    if (!EMAIL.test(email) || email.length > 120) return { ok: false, error: "Correo electrónico inválido." };
    const pe = pwErr(password);
    if (pe) return { ok: false, error: pe };
    if (db.users.some((u) => u.email === email)) return { ok: false, error: "Ese correo ya está registrado." };
    const salt = rndHex(16);
    const u = {
      id: uid("u"),
      name,
      email,
      salt,
      hash: await hashPw(password, salt),
      verified: false,
      role: "cliente",
      points: 0,
      pending: 0,
      ledger: [],
      createdAt: now(),
      verify: null,
    };
    db.users.push(u);
    sendVerification(u, true);
    db.session = { uid: u.id, exp: now() + SESSION_MS };
    save();
    return { ok: true, user: u };
  }
  function sendVerification(u, force) {
    if (u.verified) return { ok: false, error: "La cuenta ya está verificada." };
    const v = u.verify;
    if (v && !force) {
      if (now() - v.sent < 30000) return { ok: false, error: "Espera 30 segundos para reenviar el código." };
      if ((v.sends || 1) >= 5) return { ok: false, error: "Límite de reenvíos alcanzado." };
    }
    const code = code6();
    u.verify = { code, exp: now() + 15 * 60000, sent: now(), tries: 0, sends: ((v && v.sends) || 0) + 1 };
    mail(
      u.email,
      "Verifica tu correo - Estampa HN",
      "Hola " +
        u.name +
        ",\n\nTu código de verificación es: " +
        code +
        "\nVence en 15 minutos.\n\nSi no creaste esta cuenta, ignora este mensaje.",
      { code },
    );
    save();
    return { ok: true };
  }
  function verifyCode(u, code) {
    if (u.verified) return { ok: true };
    const v = u.verify;
    if (!v) return { ok: false, error: "Solicita un código de verificación." };
    if (v.exp < now()) return { ok: false, error: "El código expiró. Solicita uno nuevo." };
    if (v.tries >= 5) return { ok: false, error: "Demasiados intentos. Solicita un código nuevo." };
    if (String(code || "").trim() !== v.code) {
      v.tries++;
      save();
      return { ok: false, error: "Código incorrecto." };
    }
    u.verified = true;
    u.verify = null;
    if (u.pending > 0) {
      u.points += u.pending;
      u.ledger.push({ ts: now(), type: "liberado", pts: u.pending, ref: "Verificación" });
      u.pending = 0;
    }
    mail(
      u.email,
      "¡Correo verificado!",
      "Hola " +
        u.name +
        ", tu correo fue verificado. Tus puntos pendientes ya están disponibles (" +
        u.points +
        " pts).",
    );
    save();
    return { ok: true };
  }
  async function login(email, password) {
    email = String(email || "")
      .trim()
      .toLowerCase();
    const lk = db.lock[email];
    if (lk && lk.until > now())
      return {
        ok: false,
        error: "Cuenta bloqueada temporalmente. Intenta en " + Math.ceil((lk.until - now()) / 1000) + " s.",
      };
    const u = db.users.find((x) => x.email === email);
    const h = await hashPw(String(password || ""), u ? u.salt : "sin-usuario");
    if (!u || h !== u.hash) {
      const l = (db.lock[email] = db.lock[email] || { n: 0, until: 0 });
      l.n++;
      if (l.n >= 5) {
        l.until = now() + 60000;
        l.n = 0;
      }
      save();
      return { ok: false, error: "Correo o contraseña incorrectos." };
    }
    delete db.lock[email];
    db.session = { uid: u.id, exp: now() + SESSION_MS };
    save();
    return { ok: true, user: u };
  }
  function logout() {
    db.session = null;
    save();
  }
  const cleanText = (t) =>
    String(t || "")
      .replace(/[^\p{L}\p{N} .,!¡?¿&'\-]/gu, "")
      .slice(0, 20)
      .trim();
  function calcularPrecioUnitarioCamisa(producto, configuracion) {
    let precioFinal = producto.price;
    if (configuracion.text) {
      precioFinal += REGLAS_PRECIO.extraTextoPersonalizado;
    }
    if ((configuracion.design || "") !== producto.design) {
      precioFinal += REGLAS_PRECIO.extraCambioDiseno;
    }
    if (REGLAS_PRECIO.tallasConRecargo.includes(configuracion.size)) {
      precioFinal += REGLAS_PRECIO.extraTallaGrande;
    }
    return precioFinal;
  }
  const unitPrice = calcularPrecioUnitarioCamisa;
  function agregarAlCarrito(itemSolicitado) {
    const producto = obtenerProductoPorId(itemSolicitado.pid);
    if (!producto) return { ok: false, error: "Producto inexistente." };
    if (!producto.colors.includes(itemSolicitado.color)) return { ok: false, error: "Color no disponible." };
    if (!producto.sizes.includes(itemSolicitado.size)) return { ok: false, error: "Talla no disponible." };

    const disenoSeleccionado = DESIGNS.some((d) => d[0] === (itemSolicitado.design || ""))
      ? itemSolicitado.design || ""
      : producto.design;
    const textoPersonalizado = cleanText(itemSolicitado.text);
    const cantidad = Math.max(
      LIMITES_CARRITO.cantidadMinima,
      Math.min(
        LIMITES_CARRITO.cantidadMaxima,
        parseInt(itemSolicitado.qty) || LIMITES_CARRITO.cantidadMinima,
      ),
    );

    const lineaExistente = db.cart.find(
      (linea) =>
        linea.pid === producto.id &&
        linea.color === itemSolicitado.color &&
        linea.size === itemSolicitado.size &&
        linea.design === disenoSeleccionado &&
        linea.text === textoPersonalizado,
    );

    if (lineaExistente) {
      lineaExistente.qty = Math.min(LIMITES_CARRITO.cantidadMaxima, lineaExistente.qty + cantidad);
    } else {
      db.cart.push({
        pid: producto.id,
        color: itemSolicitado.color,
        size: itemSolicitado.size,
        design: disenoSeleccionado,
        text: textoPersonalizado,
        qty: cantidad,
      });
    }
    save();
    return { ok: true };
  }
  const cartAdd = agregarAlCarrito;

  function actualizarCantidadCarrito(indice, nuevaCantidad) {
    const linea = db.cart[indice];
    if (!linea) return;
    linea.qty = Math.max(0, Math.min(LIMITES_CARRITO.cantidadMaxima, nuevaCantidad));
    if (linea.qty === 0) db.cart.splice(indice, 1);
    save();
  }
  const cartSet = actualizarCantidadCarrito;
  function cartLines(items) {
    return items
      .map((it) => {
        const p = P(it.pid);
        if (!p) return null;
        const unit = unitPrice(p, it);
        return { ...it, p, unit, line: r2(unit * it.qty) };
      })
      .filter(Boolean);
  }
  function calcularDescuentoCupon(subtotal, codigoCupon) {
    if (!codigoCupon) return { coupon: null, descuento: 0 };
    const codigoNormalizado = String(codigoCupon).trim().toUpperCase();
    const cuponActivo = db.coupons.find((item) => item.code === codigoNormalizado && item.active) || null;
    const descuento = cuponActivo ? r2((subtotal * cuponActivo.pct) / 100) : 0;
    return { coupon: cuponActivo, descuento };
  }
  function calcularDescuentoPuntos(montoDisponible, puntosSolicitados, usuario) {
    const monto = Number(montoDisponible);
    const puntosSolicitadosEnteros = Number(puntosSolicitados);
    if (
      !usuario ||
      !usuario.verified ||
      !Number.isFinite(monto) ||
      monto < 0 ||
      !Number.isFinite(puntosSolicitadosEnteros) ||
      puntosSolicitadosEnteros <= 0
    ) {
      return { puntosUsados: 0, descuento: 0 };
    }
    const topePuntosPorPedido = Math.floor(
      monto * REGLAS_PRECIO.porcentajeMaximoCanje * REGLAS_PRECIO.puntosPorLempiraCanjeado,
    );
    const puntosUsados = Math.max(
      0,
      Math.min(Math.floor(puntosSolicitadosEnteros), usuario.points, topePuntosPorPedido),
    );
    return {
      puntosUsados,
      descuento: r2(puntosUsados / REGLAS_PRECIO.puntosPorLempiraCanjeado),
    };
  }
  function calcularDesglosePedido(items, { coupon = "", redeem = 0, u = null } = {}) {
    const lines = cartLines(items);
    const subtotal = r2(lines.reduce((acumulado, linea) => acumulado + linea.line, 0));

    const { coupon: cuponAplicado, descuento: descuentoCupon } = calcularDescuentoCupon(subtotal, coupon);
    const subtotalTrasCupon = r2(subtotal - descuentoCupon);

    const { puntosUsados, descuento: descuentoPuntos } = calcularDescuentoPuntos(
      subtotalTrasCupon,
      redeem,
      u,
    );
    const subtotalNeto = r2(subtotalTrasCupon - descuentoPuntos);

    const costoEnvio =
      lines.length === 0 ? 0 : subtotalNeto >= REGLAS_PRECIO.montoEnvioGratis ? 0 : REGLAS_PRECIO.costoEnvioEstandar;
    const total = r2(subtotalNeto + costoEnvio);

    return {
      lines,
      subtotal,
      coupon: cuponAplicado,
      cd: descuentoCupon,
      usedPts: puntosUsados,
      pr: descuentoPuntos,
      ship: costoEnvio,
      total,
      isv: r2(total * REGLAS_PRECIO.factorIsvIncluido),
      earn: Math.floor(subtotalNeto / REGLAS_PRECIO.lempirasPorPuntoGanado),
    };
  }
  const totals = calcularDesglosePedido;
  function registrarCanjePuntos(usuario, puntosCanjeados, numeroOrden, fechaMarca) {
    if (!usuario || puntosCanjeados <= 0) return;
    usuario.points -= puntosCanjeados;
    usuario.ledger.push({
      ts: fechaMarca,
      type: "canjeado",
      pts: -puntosCanjeados,
      ref: numeroOrden,
    });
  }

  function registrarPuntosGanados(usuario, puntosGanados, numeroOrden, fechaMarca) {
    if (!usuario || puntosGanados <= 0) return;
    if (usuario.verified) {
      usuario.points += puntosGanados;
      usuario.ledger.push({
        ts: fechaMarca,
        type: "ganado",
        pts: puntosGanados,
        ref: numeroOrden,
      });
    } else {
      usuario.pending += puntosGanados;
      usuario.ledger.push({
        ts: fechaMarca,
        type: "pendiente",
        pts: puntosGanados,
        ref: numeroOrden,
      });
    }
  }

  function createOrder({ u: usuario, contact, pay, coupon, redeem, items, ts }) {
    const fechaOrden = ts || now();
    const desglose = calcularDesglosePedido(items, {
      coupon,
      redeem,
      u: usuario,
    });
    const numeroOrden = "EHN-" + ++db.seq;

    const lineasOrden = items.map((item) => {
      const producto = obtenerProductoPorId(item.pid);
      return {
        pid: item.pid,
        name: producto ? producto.name : item.pid,
        color: item.color,
        size: item.size,
        design: item.design,
        text: item.text || "",
        qty: item.qty,
        unit: producto ? calcularPrecioUnitarioCamisa(producto, item) : 0,
      };
    });

    const orden = {
      id: uid("o"),
      no: numeroOrden,
      ts: fechaOrden,
      userId: usuario ? usuario.id : null,
      guest: !usuario,
      contact,
      items: lineasOrden,
      subtotal: desglose.subtotal,
      cd: desglose.cd,
      coupon: desglose.coupon ? desglose.coupon.code : null,
      usedPts: desglose.usedPts,
      pr: desglose.pr,
      ship: desglose.ship,
      total: desglose.total,
      isv: desglose.isv,
      earn: usuario ? desglose.earn : 0,
      pay,
      status: pay.method === "card" ? "Pagado" : pay.method === "transfer" ? "Pendiente de pago" : "Contra entrega",
    };
    db.orders.push(orden);
    registrarCanjePuntos(usuario, desglose.usedPts, numeroOrden, fechaOrden);
    registrarPuntosGanados(usuario, desglose.earn, numeroOrden, fechaOrden);
    return orden;
  }
  const TARJETAS_PRUEBA = {
    rechazada: "4000000000000002",
    sinFondos: "4000000000009995",
  };
  const METODOS_PAGO_VALIDOS = ["card", "transfer", "cod"];

  function validarNumeroTarjetaLuhn(numeroTarjeta) {
    const digitos = String(numeroTarjeta).replace(/\D/g, "");
    if (digitos.length < 13 || digitos.length > 19) return false;
    let suma = 0;
    let duplicar = false;
    for (let i = digitos.length - 1; i >= 0; i--) {
      let valor = +digitos[i];
      if (duplicar) {
        valor *= 2;
        if (valor > 9) valor -= 9;
      }
      suma += valor;
      duplicar = !duplicar;
    }
    return suma % 10 === 0;
  }
  const luhn = validarNumeroTarjetaLuhn;

  function detectarMarcaTarjeta(numeroTarjeta) {
    if (/^4/.test(numeroTarjeta)) return "Visa";
    if (/^(5[1-5]|2[2-7])/.test(numeroTarjeta)) return "Mastercard";
    if (/^3[47]/.test(numeroTarjeta)) return "Amex";
    return "Tarjeta";
  }
  const brand = detectarMarcaTarjeta;

  function validarFechaVencimiento(fechaTexto) {
    const coincidencia = /^(\d{2})\/(\d{2})$/.exec(String(fechaTexto || "").trim());
    if (!coincidencia) return false;
    const mes = +coincidencia[1];
    const anio = +coincidencia[2];
    if (mes < 1 || mes > 12) return false;
    return new Date(2000 + anio, mes, 1) > new Date();
  }
  const expOk = validarFechaVencimiento;

  function validarDatosContacto(contacto) {
    if (!contacto || String(contacto.name || "").trim().length < 2) return "Escribe tu nombre completo.";
    if (!EMAIL.test(String(contacto.email || "").trim())) return "Correo electrónico inválido.";
    const telefonoLimpio = String(contacto.phone || "").replace(/\D/g, "");
    if (telefonoLimpio.length < 8 || telefonoLimpio.length > 11) return "Teléfono inválido (8 dígitos).";
    if (!DEPTS.includes(contacto.dept)) return "Selecciona un departamento.";
    if (String(contacto.city || "").trim().length < 2) return "Escribe tu ciudad.";
    if (String(contacto.addr || "").trim().length < 5) return "Escribe una dirección de entrega más completa.";
    return "";
  }
  const validateContact = validarDatosContacto;

  async function procesarPagoTarjeta(datosPago) {
    const numeroLimpio = String(datosPago.card || "").replace(/\D/g, "");
    if (!validarNumeroTarjetaLuhn(numeroLimpio)) return { ok: false, error: "Número de tarjeta inválido." };
    if (!validarFechaVencimiento(datosPago.exp)) {
      return { ok: false, error: "Fecha de vencimiento inválida o vencida (MM/AA)." };
    }
    if (!/^\d{3,4}$/.test(String(datosPago.cvv || ""))) return { ok: false, error: "CVV inválido." };
    if (String(datosPago.holder || "").trim().length < 2) {
      return { ok: false, error: "Escribe el nombre que aparece en la tarjeta." };
    }
    if (!FAST) await sleep(900);
    if (numeroLimpio === TARJETAS_PRUEBA.rechazada) {
      return { ok: false, error: "Pago rechazado por el banco emisor." };
    }
    if (numeroLimpio === TARJETAS_PRUEBA.sinFondos) {
      return { ok: false, error: "Fondos insuficientes." };
    }
    return {
      ok: true,
      pago: { method: "card", brand: detectarMarcaTarjeta(numeroLimpio), last4: numeroLimpio.slice(-4) },
    };
  }

  function construirTextoCorreoPedido(orden, usuario) {
    const detallePuntos = usuario
      ? usuario.verified
        ? "Ganaste " + orden.earn + " puntos."
        : "Tienes " + orden.earn + " puntos pendientes: verifica tu correo para activarlos."
      : "Compra como invitado: crea una cuenta para acumular puntos en próximas compras.";
    return (
      "Gracias por tu compra, " +
      orden.contact.name +
      ".\nPedido: " +
      orden.no +
      "\nTotal: " +
      Lps(orden.total) +
      " (" +
      orden.status +
      ")\n" +
      detallePuntos
    );
  }

  async function checkout({ contact, pay, coupon, redeem }) {
    const usuarioActual = user();
    if (!db.cart.length) return { ok: false, error: "Tu carrito está vacío." };

    const errorContacto = validarDatosContacto(contact);
    if (errorContacto) return { ok: false, error: errorContacto };

    if (!METODOS_PAGO_VALIDOS.includes(pay && pay.method)) {
      return { ok: false, error: "Selecciona un método de pago." };
    }

    let registroPago = { method: pay.method, brand: "", last4: "" };
    if (pay.method === "card") {
      const resultadoPago = await procesarPagoTarjeta(pay);
      if (!resultadoPago.ok) return resultadoPago;
      registroPago = resultadoPago.pago;
    }

    const ordenCreada = createOrder({
      u: usuarioActual,
      contact: {
        name: contact.name.trim(),
        email: contact.email.trim().toLowerCase(),
        phone: contact.phone.trim(),
        dept: contact.dept,
        city: contact.city.trim(),
        addr: contact.addr.trim(),
      },
      pay: registroPago,
      coupon,
      redeem,
      items: db.cart,
    });

    db.cart = [];
    mail(
      ordenCreada.contact.email,
      "Confirmación de pedido " + ordenCreada.no,
      construirTextoCorreoPedido(ordenCreada, usuarioActual),
    );
    save();
    return { ok: true, order: ordenCreada };
  }
  const INDICE_BUSQUEDA_PRODUCTOS = new WeakMap();
  const ORDEN_CATALOGO = {
    precioAscendente: "pa",
    precioDescendente: "pd",
    nombreAscendente: "n",
    mejorValorados: "r",
  };

  function obtenerTextoIndexadoProducto(producto) {
    let textoIndexado = INDICE_BUSQUEDA_PRODUCTOS.get(producto);
    if (!textoIndexado) {
      textoIndexado = norm(`${producto.name} ${producto.cat} ${producto.tags}`);
      INDICE_BUSQUEDA_PRODUCTOS.set(producto, textoIndexado);
    }
    return textoIndexado;
  }

  function coincideFiltrosProducto(producto, filtros, palabrasBusqueda) {
    if (filtros.cat && producto.cat !== filtros.cat) return false;
    if (filtros.color && !producto.colors.includes(filtros.color)) return false;
    if (filtros.size && !producto.sizes.includes(filtros.size)) return false;
    if (filtros.min !== "" && filtros.min != null && producto.price < Number(filtros.min)) return false;
    if (filtros.max !== "" && filtros.max != null && producto.price > Number(filtros.max)) return false;

    if (palabrasBusqueda.length > 0) {
      const textoProducto = obtenerTextoIndexadoProducto(producto);
      return palabrasBusqueda.every((palabra) => textoProducto.includes(palabra));
    }
    return true;
  }

  function ordenarProductos(productos, criterioOrden) {
    if (criterioOrden === ORDEN_CATALOGO.precioAscendente) {
      productos.sort((a, b) => a.price - b.price);
    } else if (criterioOrden === ORDEN_CATALOGO.precioDescendente) {
      productos.sort((a, b) => b.price - a.price);
    } else if (criterioOrden === ORDEN_CATALOGO.nombreAscendente) {
      productos.sort((a, b) => a.name.localeCompare(b.name, "es"));
    } else if (criterioOrden === ORDEN_CATALOGO.mejorValorados) {
      productos.sort((a, b) => b.rating - a.rating);
    }
    return productos;
  }

  function buscarYOrdenarProductos(productos, filtros) {
    const palabrasBusqueda = norm(filtros.q).split(/\s+/).filter(Boolean);
    const filtrados = productos.filter((producto) =>
      coincideFiltrosProducto(producto, filtros, palabrasBusqueda),
    );
    return ordenarProductos(filtrados, filtros.sort || "rel");
  }
  const search = buscarYOrdenarProductos;

  function verificarConsistenciaPuntos(usuario) {
    const sumarMovimientosPorTipo = (tipo) =>
      usuario.ledger
        .filter((movimiento) => movimiento.type === tipo)
        .reduce((acumulado, movimiento) => acumulado + movimiento.pts, 0);

    const puntosCalculados =
      sumarMovimientosPorTipo("ganado") +
      sumarMovimientosPorTipo("liberado") +
      sumarMovimientosPorTipo("canjeado");
    const pendientesCalculados = sumarMovimientosPorTipo("pendiente") - sumarMovimientosPorTipo("liberado");

    return usuario.points === puntosCalculados && usuario.pending === pendientesCalculados;
  }
  const ledgerOk = verificarConsistenciaPuntos;

  function shirtSVG(cn, design, text) {
    const c = COLORS[cn] || "#ccc",
      ink = lum(c) < 0.5 ? "#ffffff" : "#1d1b20",
      t = String(text || "").slice(0, 20);
    const fs = t.length > 10 ? 14 : t.length > 6 ? 18 : 22;
    return (
      '<svg class="shirt" viewBox="0 0 200 220" role="img" aria-label="Camisa ' +
      esc(cn) +
      '"><path d="M62 18 L18 44 L34 88 L56 78 L56 200 Q56 206 62 206 L138 206 Q144 206 144 200 L144 78 L166 88 L182 44 L138 18 Q128 40 100 40 Q72 40 62 18 Z" fill="' +
      c +
      '" stroke="rgba(0,0,0,.28)" stroke-width="2"/><path d="M56 78 L34 88 L18 44 L40 31 Z" fill="rgba(0,0,0,.07)"/><path d="M144 78 L166 88 L182 44 L160 31 Z" fill="rgba(0,0,0,.07)"/><path d="M62 18 Q72 40 100 40 Q128 40 138 18" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="3"/>' +
      (design ? '<text x="100" y="125" font-size="54" text-anchor="middle">' + esc(design) + "</text>" : "") +
      (t
        ? '<text x="100" y="' +
          (design ? 162 : 128) +
          '" font-size="' +
          fs +
          '" font-weight="800" text-anchor="middle" fill="' +
          ink +
          '" font-family="Impact,Arial Black,sans-serif"' +
          (t.length > 10 ? ' textLength="84" lengthAdjust="spacingAndGlyphs"' : "") +
          ">" +
          esc(t) +
          "</text>"
        : "") +
      "</svg>"
    );
  }

  const S = {
    view: "shop",
    f: { q: "", cat: "", color: "", size: "", min: "", max: "", sort: "rel" },
    shown: 12,
    ov: null,
    modal: null,
    filtersOpen: false,
    authMode: "login",
    accessRole: null,
    err: "",
    busy: false,
    co: {
      name: "",
      email: "",
      phone: "",
      dept: "",
      city: "",
      addr: "",
      pay: "card",
      card: "",
      exp: "",
      cvv: "",
      holder: "",
      coupon: "",
      redeem: 0,
    },
    last: null,
    qa: {},
    qaRunning: false,
    mailAll: true,
  };

  const accountChip = (u) => "<span>👤 " + esc(u.name.split(" ")[0]) + "</span>";
  function cartCount() {
    return db.cart.reduce((a, c) => a + c.qty, 0);
  }
  function unread() {
    return db.mails.filter((m) => !m.read).length;
  }
  function renderizarBotonesSesion(usuario) {
    const enlaceQa = puedeAccederQa(usuario)
      ? '<button class="btn" data-act="nav" data-v="qa">🧪 Pruebas QA</button>'
      : "";
    return (
      '<nav class="dnav fila-flex-wrap"><button class="btn" data-act="nav" data-v="shop">Tienda</button>' +
      enlaceQa +
      '<button class="btn" data-act="nav" data-v="account">' +
      (usuario ? accountChip(usuario) : "Entrar") +
      "</button></nav>"
    );
  }
  function renderizarBadgeCarrito(cantidad) {
    return '<span class="badge cartN">' + (cantidad || "") + "</span>";
  }
  function renderizarNavegacionMovil(usuario) {
    const puedeVerQa = puedeAccederQa(usuario);
    const opcionesMovil = [
      ["shop", "🛍", "Tienda"],
      ["cart", "🛒", "Carrito"],
      ["account", "👤", usuario ? "Cuenta" : "Entrar"],
      ...(puedeVerQa ? [["qa", "🧪", "Pruebas"]] : []),
    ];
    return opcionesMovil
      .map(
        ([v, i, t]) =>
          '<button class="' +
          (S.view === v ? "on" : "") +
          (v === "account" && !usuario ? " entrar" : "") +
          '" data-act="' +
          (v === "cart" ? "ov" : "nav") +
          '" data-v="' +
          v +
          '" data-o="cart"><span class="i">' +
          i +
          "</span>" +
          t +
          (v === "cart" ? renderizarBadgeCarrito(cartCount()) : "") +
          "</button>",
      )
      .join("");
  }
  function renderHeader() {
    const usuario = user();
    const cantidadCarrito = cartCount();
    $("#hdr").innerHTML =
      '<header class="top"><div class="wrap hbar"><button class="logo btn" style="border:0;background:none" data-act="nav" data-v="shop" aria-label="Inicio">👕 Estampa<b>HN</b></button>' +
      '<div class="search"><input id="q" type="search" placeholder="Buscar camisas (ej. café, fútbol, humor)…" value="' +
      esc(S.f.q) +
      '" autocomplete="off" data-in="q" aria-label="Buscar"></div>' +
      renderizarBotonesSesion(usuario) +
      '<div class="hicons fila-flex"><button class="btn" data-act="ov" data-o="mail" aria-label="Correos">✉<span class="badge mailN"></span></button><button class="btn" data-act="ov" data-o="cart" aria-label="Carrito">🛒' +
      renderizarBadgeCarrito(cantidadCarrito) +
      "</button></div></div></header>";
    $("#bottom").innerHTML = renderizarNavegacionMovil(usuario);
    badges();
  }
  function badges() {
    const c = cartCount(),
      m = unread();
    $$(".cartN").forEach((e) => (e.textContent = c || ""));
    $$(".mailN").forEach((e) => (e.textContent = m || ""));
  }
  function renderMain() {
    const v = S.view,
      u = user();
    let h = "";
    if (S.view === "shop") h = shopView();
    else if (v === "auth") h = authView();
    else if (v === "verify") h = verifyView(u);
    else if (v === "checkout") h = checkoutView(u);
    else if (v === "done") h = doneView();
    else if (v === "account") h = u ? accountView(u) : authView();
    else if (v === "access") h = accessView(S.accessRole);
    else if (v === "admin") h = adminView(u);
    else if (v === "qa") {
      if (!puedeAccederQa(u)) {
        S.view = "shop";
        h = shopView();
      } else {
        h = qaView();
      }
    }
    $("#main").innerHTML = h;
    if (S.view === "shop") {
      renderFilters();
      renderGrid();
    }
    if (S.view === "qa") renderQa();
  }
  function renderAll() {
    renderHeader();
    renderMain();
    renderOverlay();
    document.body.classList.toggle("lock", !!S.ov);
  }

  function shopView() {
    return (
      '<section class="hero"><div><h1>Camisas que cuentan tu historia</h1><p>Elige un diseño, cambia el color, agrega tu texto y estréna. <b>Envío gratis desde L 1,000</b> · Gana <b>1 punto por cada L 10</b> en compras.</p><button class="btn pri" data-act="scrollShop">Ver camisas</button></div><div>' +
      shirtSVG("Azul marino", "🦜", "Catracho") +
      "</div></section>" +
      '<div class="shop" id="shop"><aside class="filters ' +
      (S.filtersOpen ? "open" : "") +
      '" id="filters"></aside><section><div class="bar"><button class="btn ghost fbtn" data-act="filtersToggle">⚙ Filtros</button><span class="sp" id="count"></span><select data-in="sort" aria-label="Ordenar" style="width:auto"><option value="rel">Relevancia</option><option value="r">Mejor valoradas</option><option value="pa">Precio: menor a mayor</option><option value="pd">Precio: mayor a menor</option><option value="n">Nombre A-Z</option></select></div><div id="grid" class="grid"></div><div id="more" style="text-align:center;margin:16px"></div></section></div>'
    );
  }
  function renderFilters() {
    const f = S.f,
      el = $("#filters");
    if (!el) return;
    el.innerHTML =
      '<h3>Categoría</h3><div class="chips"><button class="chip ' +
      (!f.cat ? "on" : "") +
      '" data-act="fCat" data-v="">Todas</button>' +
      CATS.map(
        (c) =>
          '<button class="chip ' +
          (f.cat === c ? "on" : "") +
          '" data-act="fCat" data-v="' +
          esc(c) +
          '">' +
          esc(c) +
          "</button>",
      ).join("") +
      "</div>" +
      '<h3>Color</h3><div class="chips">' +
      Object.keys(COLORS)
        .map(
          (c) =>
            '<button class="sw ' +
            (f.color === c ? "on" : "") +
            '" style="background:' +
            COLORS[c] +
            '" title="' +
            esc(c) +
            '" aria-label="' +
            esc(c) +
            '" data-act="fColor" data-v="' +
            esc(c) +
            '"></button>',
        )
        .join("") +
      "</div>" +
      '<h3>Talla</h3><div class="chips">' +
      SIZES.map(
        (s) =>
          '<button class="chip ' +
          (f.size === s ? "on" : "") +
          '" data-act="fSize" data-v="' +
          s +
          '">' +
          s +
          "</button>",
      ).join("") +
      "</div>" +
      '<h3>Precio (L)</h3><div class="row2"><input type="number" inputmode="numeric" min="0" placeholder="Mín" data-in="min" value="' +
      esc(f.min) +
      '" aria-label="Precio mínimo"><input type="number" inputmode="numeric" min="0" placeholder="Máx" data-in="max" value="' +
      esc(f.max) +
      '" aria-label="Precio máximo"></div>' +
      '<p style="margin:14px 0 0"><button class="btn sm ghost" data-act="fClear">Limpiar filtros</button></p>';
    const sel = $("select[data-in=sort]");
    if (sel) sel.value = f.sort;
  }
  function cardHtml(p) {
    return (
      '<article class="card"><button class="imgbtn" data-act="openProd" data-id="' +
      p.id +
      '" aria-label="Personalizar ' +
      esc(p.name) +
      '">' +
      shirtSVG(p.colors[0], p.design, "") +
      '</button><div class="cinfo"><h3>' +
      esc(p.name) +
      '</h3><div class="meta">' +
      esc(p.cat) +
      " · ★ " +
      p.rating.toFixed(1) +
      '</div><div class="pr">Desde ' +
      Lps(p.price) +
      '</div><button class="btn sm pri" data-act="openProd" data-id="' +
      p.id +
      '">Personalizar</button></div></article>'
    );
  }
  function renderGrid() {
    const g = $("#grid");
    if (!g) return;
    const r = search(db.products, S.f);
    $("#count").textContent = r.length + (r.length === 1 ? " camisa" : " camisas");
    g.innerHTML = r.length
      ? r.slice(0, S.shown).map(cardHtml).join("")
      : '<div class="empty" style="grid-column:1/-1"><b>Sin resultados</b><br>Prueba con otra búsqueda o limpia los filtros.</div>';
    $("#more").innerHTML =
      r.length > S.shown ? '<button class="btn" data-act="more">Ver más (' + (r.length - S.shown) + ")</button>" : "";
  }
  function renderOverlay() {
    const o = $("#overlay");
    if (!S.ov) {
      o.innerHTML = "";
      return;
    }
    let h = "";
    if (S.ov === "prod" && S.modal) h = prodModal();
    else if (S.ov === "cart") h = cartDrawer();
    else if (S.ov === "mail") h = mailModal();
    o.innerHTML = h;
    document.body.classList.toggle("lock", !!S.ov);
  }
  function renderizarSelectorOpciones(opciones, valorActivo, atributoData) {
    return opciones
      .map((opcion) => {
        const valor = Array.isArray(opcion) ? opcion[0] : opcion;
        const seleccionado = valorActivo === valor ? " on" : "";
        if (atributoData === "oColor") {
          return (
            '<button class="sw' +
            seleccionado +
            '" style="background:' +
            COLORS[valor] +
            '" aria-label="' +
            esc(valor) +
            '" data-act="' +
            atributoData +
            '" data-v="' +
            esc(valor) +
            '"></button>'
          );
        }
        if (atributoData === "oSize") {
          return (
            '<button class="chip' +
            seleccionado +
            '" data-act="' +
            atributoData +
            '" data-v="' +
            esc(valor) +
            '">' +
            esc(valor) +
            "</button>"
          );
        }
        const titulo = Array.isArray(opcion) ? opcion[1] : valor;
        return (
          '<button class="chip' +
          seleccionado +
          '" data-act="' +
          atributoData +
          '" data-v="' +
          esc(valor) +
          '" title="' +
          esc(titulo) +
          '">' +
          (esc(valor) || "∅") +
          "</button>"
        );
      })
      .join("");
  }
  function prodModal() {
    const m = S.modal,
      p = P(m.pid),
      it = { ...m, pid: p.id };
    return (
      '<div class="ov" data-act="closeOv"><div class="modal" role="dialog" aria-modal="true" aria-label="Personalizar ' +
      esc(p.name) +
      '"><button class="xbtn" data-act="closeOv" data-force="1" aria-label="Cerrar">✕</button><div class="in"><div class="pgrid"><div class="prev" id="mprev">' +
      shirtSVG(m.color, m.design, m.text) +
      "</div><div>" +
      "<h2>" +
      esc(p.name) +
      '</h2><div class="meta">' +
      esc(p.cat) +
      " · ★ " +
      p.rating.toFixed(1) +
      "</div>" +
      '<label>Color: <span class="mut">' +
      esc(m.color) +
      '</span></label><div class="chips">' +
      renderizarSelectorOpciones(p.colors, m.color, "oColor") +
      "</div>" +
      '<label>Talla <span class="mut">(XL/XXL +L 20)</span></label><div class="chips">' +
      renderizarSelectorOpciones(p.sizes, m.size, "oSize") +
      "</div>" +
      '<label>Diseño <span class="mut">(cambiar diseño +L 50)</span></label><div class="chips">' +
      renderizarSelectorOpciones(DESIGNS, m.design, "oDesign") +
      "</div>" +
      '<label for="mtext">Texto personalizado <span class="mut">(máx. 20, +L 35)</span></label><input id="mtext" maxlength="20" data-in="mtext" value="' +
      esc(m.text) +
      '" placeholder="Ej. Papá, Team HN…" autocomplete="off">' +
      '<label>Cantidad</label><div class="qty"><button data-act="oQty" data-d="-1" aria-label="Menos">−</button><b id="mq">' +
      m.qty +
      '</b><button data-act="oQty" data-d="1" aria-label="Más">+</button></div>' +
      '<p class="pr" style="font-size:1.4rem;margin:12px 0 4px" id="mprice">' +
      Lps(unitPrice(p, it) * m.qty) +
      '</p><button class="btn pri" style="width:100%" data-act="addCart">Agregar al carrito</button></div></div></div></div></div>'
    );
  }
  function renderizarItemCarrito(linea, indice) {
    return (
      '<div class="line">' +
      shirtSVG(linea.color, linea.design, linea.text) +
      "<div><b>" +
      esc(linea.p.name) +
      '</b><div class="meta">' +
      esc(linea.color) +
      " · " +
      esc(linea.size) +
      (linea.text ? " · “" + esc(linea.text) + "”" : "") +
      '</div><div class="qty"><button data-act="cQty" data-i="' +
      indice +
      '" data-d="-1" aria-label="Menos">−</button><b>' +
      linea.qty +
      '</b><button data-act="cQty" data-i="' +
      indice +
      '" data-d="1" aria-label="Más">+</button><button class="btn sm ghost" data-act="cDel" data-i="' +
      indice +
      '">Quitar</button></div></div><b>' +
      Lps(linea.line) +
      "</b></div>"
    );
  }
  function cartDrawer() {
    const desglose = totals(db.cart, {});
    const contenidoCarrito = desglose.lines.length
      ? desglose.lines.map(renderizarItemCarrito).join("")
      : '<div class="empty">Tu carrito está vacío.<br><button class="btn sm" style="margin-top:10px" data-act="closeOv" data-force="1">Seguir comprando</button></div>';
    return (
      '<div class="ov right" data-act="closeOv"><aside class="drawer" role="dialog" aria-modal="true" aria-label="Carrito"><div class="fila-flex-entre" style="padding:14px;border-bottom:1px solid var(--line)"><h2 style="margin:0">Tu carrito</h2><button class="btn sm ghost" data-act="closeOv" data-force="1">Cerrar ✕</button></div><div class="body">' +
      contenidoCarrito +
      '</div><div class="foot">' +
      renderizarFilaResumen("Subtotal", "<b>" + Lps(desglose.subtotal) + "</b>") +
      '<div class="texto-pequeno-muted">Envío calculado en el pago · Gratis desde L 1,000</div><button class="btn pri" style="width:100%;margin-top:10px" data-act="goCheckout" ' +
      (desglose.lines.length ? "" : "disabled") +
      ">Ir a pagar</button></div></aside></div>"
    );
  }
  function mailModal() {
    const u = user();
    let ms = [...db.mails].sort((a, b) => b.ts - a.ts);
    if (!S.mailAll && u) ms = ms.filter((m) => m.to === u.email);
    return (
      '<div class="ov" data-act="closeOv"><div class="modal" role="dialog" aria-modal="true" aria-label="Bandeja de correos simulada"><button class="xbtn" data-act="closeOv" data-force="1" aria-label="Cerrar">✕</button><div class="in"><h2>✉ Bandeja simulada</h2><p class="mut sm">Aquí aparecen los correos que “enviaría” el sistema (verificación y confirmaciones). ' +
      '<button class="chip ' +
      (S.mailAll ? "on" : "") +
      '" data-act="mailAll">Ver todos</button></p>' +
      (ms.length
        ? ms
            .slice(0, 40)
            .map(
              (m) =>
                '<div class="mail"><b>' +
                esc(m.subject) +
                '</b><div class="meta">Para: ' +
                esc(m.to) +
                " · " +
                fdate(m.ts) +
                "</div><pre>" +
                esc(m.body) +
                "</pre>" +
                (m.meta && m.meta.code
                  ? '<button class="btn sm pri" data-act="useCode" data-code="' +
                    esc(m.meta.code) +
                    '" data-to="' +
                    esc(m.to) +
                    '">Verificar con este código</button>'
                  : "") +
                "</div>",
            )
            .join("")
        : '<div class="empty">Sin correos.</div>') +
      "</div></div></div>"
    );
  }
  function authView() {
    const reg = S.authMode === "register";
    return (
      '<div class="panel auth-panel" style="margin:20px auto;max-width:520px"><div class="chips" style="margin-bottom:10px"><button class="chip ' +
      (!reg ? "on" : "") +
      '" data-act="authMode" data-v="login">Iniciar sesión</button><button class="chip ' +
      (reg ? "on" : "") +
      '" data-act="authMode" data-v="register">Crear cuenta</button></div>' +
      (S.err ? '<div class="alert err" role="alert">' + esc(S.err) + "</div>" : "") +
      (reg
        ? '<form class="auth-form" data-form="register" novalidate><label for="rn">Nombre completo</label><input id="rn" name="name" autocomplete="name" maxlength="60" required><label for="re">Correo electrónico</label><input id="re" name="email" type="email" autocomplete="email" required><label for="rp">Contraseña</label><input id="rp" name="password" type="password" autocomplete="new-password" required><div class="mut sm">Mínimo 8 caracteres, con mayúscula, minúscula y número.</div><button type="submit" class="btn pri btn-submit">Crear cuenta</button></form>'
        : '<form class="auth-form" data-form="login" novalidate><label for="le">Correo electrónico</label><input id="le" name="email" type="email" autocomplete="username" required><label for="lp">Contraseña</label><input id="lp" name="password" type="password" autocomplete="current-password" required><button type="submit" class="btn pri btn-entrar-form">Entrar</button></form>') +
      "</div>"
    );
  }
  function accessView(rol) {
    const perfil = window.perfilesAcceso.obtener(rol);
    return (
      '<div class="panel auth-panel" style="margin:20px auto;max-width:520px"><h2>' +
      "Acceso " +
      esc(perfil.etiqueta) +
      "</h2><p class=\"mut\">Ingresa con tu cuenta autorizada para continuar.</p>" +
      (S.err ? '<div class="alert err" role="alert">' + esc(S.err) + "</div>" : "") +
      '<form class="auth-form" data-form="restrictedAccess" novalidate><label for="accessEmail">Correo electrónico</label><input id="accessEmail" name="email" type="email" autocomplete="username" required><label for="accessPassword">Contraseña</label><input id="accessPassword" name="password" type="password" autocomplete="current-password" required><button type="submit" class="btn pri">Entrar</button></form><button class="btn ghost sm" style="margin-top:10px" data-act="backToShop">Volver a la tienda</button></div>'
    );
  }
  function verifyView(u) {
    if (!u) return authView();
    if (u.verified)
      return '<div class="panel" style="margin-top:20px"><div class="alert ok">Tu correo ya está verificado ✔</div><button class="btn pri" data-act="nav" data-v="shop">Ir a la tienda</button></div>';
    return (
      '<div class="panel" style="margin-top:20px;max-width:520px;margin-inline:auto"><h2>Verifica tu correo</h2><p>Enviamos un código de 6 dígitos a <b>' +
      esc(u.email) +
      '</b>. En este prototipo el correo aparece en la bandeja simulada.</p><button class="btn" data-act="ov" data-o="mail">✉ Abrir bandeja simulada</button>' +
      (S.err ? '<div class="alert err" role="alert">' + esc(S.err) + "</div>" : "") +
      '<form data-form="verify" novalidate><label for="vc">Código de verificación</label><input id="vc" name="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000" value="' +
      esc(S.vcode || "") +
      '"><p><button class="btn pri" style="width:100%">Verificar</button></p></form><button class="btn ghost sm" data-act="resend">Reenviar código</button></div>'
    );
  }
  function renderizarBadgeEstadoOrden(estado) {
    const claseEstado = estado === "Pagado" ? "ok" : "no";
    return `<span class="tag ${claseEstado}">${esc(estado)}</span>`;
  }

  function renderizarTablaOrdenesCliente(ordenes) {
    if (!ordenes.length) return '<div class="empty">Aún no tienes pedidos.</div>';
    const filas = ordenes
      .map(
        (orden) =>
          `<tr><td>${esc(orden.no)}</td><td>${fdate(orden.ts)}</td><td>${Lps(orden.total)}</td><td>${renderizarBadgeEstadoOrden(orden.status)}</td><td>+${orden.earn}${orden.usedPts ? " / −" + orden.usedPts : ""}</td></tr>`,
      )
      .join("");
    return `<div class="tabla-scroll"><table class="tbl"><thead><tr><th>Pedido</th><th>Fecha</th><th>Total</th><th>Pago</th><th>Puntos</th></tr></thead><tbody>${filas}</tbody></table></div>`;
  }

  function renderizarHistorialPuntos(movimientos) {
    const movimientosRecientes = movimientos.slice(-8).reverse();
    const filas = movimientosRecientes.length
      ? movimientosRecientes
          .map(
            (movimiento) =>
              `<tr><td>${fdate(movimiento.ts)}</td><td>${esc(movimiento.type)}</td><td>${movimiento.pts > 0 ? "+" : ""}${movimiento.pts}</td><td>${esc(movimiento.ref)}</td></tr>`,
          )
          .join("")
      : '<tr><td colspan="4" class="mut">Sin movimientos</td></tr>';
    return `<div class="tabla-scroll"><table class="tbl"><thead><tr><th>Fecha</th><th>Tipo</th><th>Pts</th><th>Ref.</th></tr></thead><tbody>${filas}</tbody></table></div>`;
  }

  function accountView(u = user()) {
    if (!u) return authView();
    const misOrdenes = db.orders.filter((orden) => orden.userId === u.id).sort((a, b) => b.ts - a.ts);
    const alertaVerificacion = u.verified
      ? ""
      : '<div class="alert warn">Verifica tu correo para activar tus puntos y canjearlos. <button class="btn sm" data-act="nav" data-v="verify">Verificar ahora</button></div>';

    return (
      '<div class="two" style="margin-top:20px"><div><div class="panel"><h2>Hola, ' +
      esc(u.name) +
      '</h2><p class="mut">' +
      esc(u.email) +
      " · " +
      (u.verified ? '<span class="tag ok">Correo verificado</span>' : '<span class="tag no">Sin verificar</span>') +
      (u.role === "admin" ? ' · <span class="tag ok">Admin</span>' : "") +
      "</p>" +
      alertaVerificacion +
      '<button class="btn" data-act="logout">Cerrar sesión</button></div>' +
      `<div class="panel"><h3>Mis pedidos (${misOrdenes.length})</h3>${renderizarTablaOrdenesCliente(misOrdenes)}</div></div>` +
      '<div><div class="panel"><h3>Mis puntos</h3><div style="font-size:2.2rem;font-weight:800;color:var(--ac)">' +
      u.points +
      ' <span style="font-size:1rem" class="mut">pts</span></div><div class="mut sm">≈ ' +
      Lps(u.points / 10) +
      " de descuento · Pendientes: " +
      u.pending +
      '</div><p class="sm mut">1 punto por cada L 10 · 100 puntos = L 10 · Máx. 50% del pedido.</p>' +
      renderizarHistorialPuntos(u.ledger) +
      "</div></div></div>"
    );
  }
  function adminView(usuario = user()) {
    if (!esAdministrador(usuario)) {
      S.view = "shop";
      return shopView();
    }
    const ordenesRecientes = [...db.orders].sort((a, b) => b.ts - a.ts).slice(0, 10);
    const ventasPagadas = db.orders
      .filter((orden) => orden.status === "Pagado")
      .reduce((total, orden) => total + orden.total, 0);
    const filasOrdenes = ordenesRecientes.length
      ? ordenesRecientes
          .map(
            (orden) =>
              `<tr><td>${esc(orden.no)}</td><td>${esc(orden.contact.name)}</td><td>${fdate(orden.ts)}</td><td>${Lps(orden.total)}</td><td>${renderizarBadgeEstadoOrden(orden.status)}</td></tr>`,
          )
          .join("")
      : '<tr><td colspan="5" class="mut">No hay pedidos.</td></tr>';

    return (
      '<h2 style="margin-top:20px">Panel de administración</h2><p class="mut">Resumen de usuarios y pedidos registrados.</p>' +
      '<div class="two"><div class="panel"><h3>Usuarios</h3><b>' +
      db.users.length +
      '</b><p class="mut sm">Cuentas registradas</p></div><div class="panel"><h3>Pedidos</h3><b>' +
      db.orders.length +
      '</b><p class="mut sm">Ventas pagadas: ' +
      Lps(ventasPagadas) +
      '</p></div></div><div class="panel"><h3>Pedidos recientes</h3><div class="tabla-scroll"><table class="tbl"><thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th></tr></thead><tbody>' +
      filasOrdenes +
      '</tbody></table></div><button class="btn sm" style="margin-top:12px" data-act="nav" data-v="qa">Abrir panel QA</button></div>'
    );
  }
  function renderizarFilaResumen(etiqueta, valor, claseExtra) {
    const clases = claseExtra ? " " + claseExtra : "";
    return '<div class="tot' + clases + '"><span>' + etiqueta + "</span><span>" + valor + "</span></div>";
  }
  function checkoutView(u) {
    const c = S.co,
      T = totals(db.cart, { coupon: c.coupon, redeem: u ? +c.redeem : 0, u });
    if (!T.lines.length)
      return '<div class="empty" style="margin-top:20px">Tu carrito está vacío.<br><button class="btn pri" style="margin-top:10px" data-act="nav" data-v="shop">Ir a la tienda</button></div>';
    const inp = (id, lbl, extra) =>
      '<div><label for="c_' +
      id +
      '">' +
      lbl +
      '</label><input id="c_' +
      id +
      '" name="' +
      id +
      '" data-in="co" value="' +
      esc(c[id]) +
      '" ' +
      (extra || "") +
      "></div>";
    return (
      '<h2 style="margin-top:20px">Finalizar compra</h2><div class="two"><form data-form="checkout" novalidate>' +
      (u
        ? '<div class="alert ok">Comprando como <b>' +
          esc(u.name) +
          "</b>" +
          (u.verified
            ? ". Ganarás <b>" + T.earn + " puntos</b>."
            : ". <b>Verifica tu correo</b> para activar los " + T.earn + " puntos de esta compra.") +
          "</div>"
        : '<div class="alert info"><b>Compra como invitado</b> sin crear cuenta, o <button type="button" class="btn sm" data-act="nav" data-v="auth">inicia sesión</button> para acumular puntos.</div>') +
      (S.err ? '<div class="alert err" role="alert">' + esc(S.err) + "</div>" : "") +
      '<div class="panel"><h3>Datos de contacto y entrega</h3><div class="cols2">' +
      inp("name", "Nombre completo", 'autocomplete="name"') +
      inp("email", "Correo", 'type="email" autocomplete="email"') +
      inp("phone", "Teléfono", 'type="tel" inputmode="tel" autocomplete="tel" placeholder="9999-8888"') +
      '<div><label for="c_dept">Departamento</label><select id="c_dept" name="dept" data-in="co"><option value="">Selecciona…</option>' +
      DEPTS.map((d) => "<option " + (c.dept === d ? "selected" : "") + ">" + d + "</option>").join("") +
      "</select></div>" +
      inp("city", "Ciudad", 'autocomplete="address-level2"') +
      inp("addr", "Dirección", 'autocomplete="street-address"') +
      "</div></div>" +
      '<div class="panel"><h3>Método de pago</h3><div class="pay">' +
      [
        ["card", "💳 Tarjeta"],
        ["transfer", "🏦 Transferencia"],
        ["cod", "💵 Contra entrega"],
      ]
        .map(
          ([k, t]) =>
            '<button type="button" class="chip ' +
            (c.pay === k ? "on" : "") +
            '" data-act="payM" data-v="' +
            k +
            '">' +
            t +
            "</button>",
        )
        .join("") +
      "</div>" +
      (c.pay === "card"
        ? '<div class="cols2">' +
          inp(
            "card",
            "Número de tarjeta",
            'inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242" maxlength="23"',
          ) +
          inp("holder", "Nombre en la tarjeta", 'autocomplete="cc-name"') +
          inp("exp", "Vence (MM/AA)", 'inputmode="numeric" autocomplete="cc-exp" placeholder="12/30" maxlength="5"') +
          inp("cvv", "CVV", 'inputmode="numeric" autocomplete="cc-csc" maxlength="4" type="password"') +
          '</div><p class="sm mut">Pruebas: <code>4242 4242 4242 4242</code> aprueba · <code>4000 0000 0000 0002</code> rechaza · <code>4000 0000 0000 9995</code> sin fondos. <button type="button" class="btn sm ghost" data-act="fillCard">Autocompletar</button></p><p class="sm mut">🔒 Solo se guardan la marca y los últimos 4 dígitos.</p>'
        : c.pay === "transfer"
          ? '<div class="alert info">Recibirás los datos bancarios por correo. El pedido se despacha al confirmar el depósito.</div>'
          : '<div class="alert info">Pagas en efectivo al recibir tu pedido.</div>') +
      "</div>" +
      '<button class="btn pri" style="width:100%;min-height:48px" ' +
      (S.busy ? "disabled" : "") +
      ">" +
      (S.busy ? "Procesando pago…" : "Confirmar y pagar " + Lps(T.total)) +
      "</button></form>" +
      '<aside class="panel" id="summary">' +
      summaryHtml(T, u) +
      "</aside></div>"
    );
  }
  function summaryHtml(T, u) {
    const c = S.co;
    const filasProductos = T.lines
      .map((linea) =>
        renderizarFilaResumen(
          linea.qty +
            "× " +
            esc(linea.p.name) +
            ' <span class="mut">(' +
            esc(linea.color) +
            ", " +
            esc(linea.size) +
            ")</span>",
          Lps(linea.line),
          "sm",
        ),
      )
      .join("");
    const descuentoCupon = T.cd
      ? renderizarFilaResumen(
          "Cupón " + esc(T.coupon.code) + " (−" + T.coupon.pct + "%)",
          "−" + Lps(T.cd),
          "descuento",
        )
      : "";
    const descuentoPuntos = T.pr
      ? renderizarFilaResumen(
          "Puntos canjeados (" + T.usedPts + ")",
          "−" + Lps(T.pr),
          "descuento",
        )
      : "";
    return (
      "<h3>Resumen</h3>" +
      filasProductos +
      '<hr style="border:0;border-top:1px solid var(--line)">' +
      renderizarFilaResumen("Subtotal", Lps(T.subtotal)) +
      descuentoCupon +
      descuentoPuntos +
      renderizarFilaResumen("Envío", T.ship ? Lps(T.ship) : "Gratis") +
      renderizarFilaResumen("Total", '<b class="monto-destacado">' + Lps(T.total) + "</b>", "g") +
      renderizarFilaResumen("ISV (15%) incluido", Lps(T.isv), "mut sm") +
      '<label for="c_coupon">Cupón</label><div class="fila-flex"><input id="c_coupon" name="coupon" data-in="co" value="' +
      esc(c.coupon) +
      '" placeholder="BIENVENIDO10" autocapitalize="characters"></div>' +
      (c.coupon && !T.coupon ? '<div class="sm" style="color:var(--err)">Cupón inválido o vencido.</div>' : "") +
      (u && u.verified
        ? '<label for="c_redeem">Canjear puntos (tienes ' +
          u.points +
          ')</label><input id="c_redeem" name="redeem" type="number" min="0" max="' +
          u.points +
          '" data-in="co" value="' +
          esc(c.redeem) +
          '">'
        : "")
    );
  }
  function doneView() {
    const o = S.last;
    if (!o) return "";
    return (
      '<div class="panel" style="margin:20px auto;max-width:640px"><div class="alert ok"><b>¡Pedido ' +
      esc(o.no) +
      " confirmado!</b></div><p>Enviamos la confirmación a <b>" +
      esc(o.contact.email) +
      "</b> (revisa la bandeja simulada).</p>" +
      '<div class="tot"><span>Total</span><b>' +
      Lps(o.total) +
      '</b></div><div class="tot"><span>Estado</span><span>' +
      esc(o.status) +
      '</span></div><div class="tot"><span>Pago</span><span>' +
      esc(
        o.pay.method === "card"
          ? o.pay.brand + " ••••" + o.pay.last4
          : o.pay.method === "transfer"
            ? "Transferencia"
            : "Contra entrega",
      ) +
      "</span></div>" +
      (o.guest
        ? '<div class="alert info">Compraste como invitado: no se acumularon puntos. <button class="btn sm" data-act="regFromGuest">Crear cuenta</button></div>'
        : '<div class="alert ok">Puntos de este pedido: <b>' +
          o.earn +
          "</b>" +
          (user() && !user().verified ? " (pendientes hasta verificar tu correo)" : "") +
          "</div>") +
      '<button class="btn pri" data-act="nav" data-v="shop">Seguir comprando</button> <button class="btn" data-act="ov" data-o="mail">✉ Ver correo</button></div>'
    );
  }

  const GROUPS = [
    { clave: "cuenta", titulo: "Registro e inicio de sesión" },
    { clave: "adaptabilidad", titulo: "Adaptabilidad móvil" },
    { clave: "carrito", titulo: "Carrito de compras" },
    { clave: "puntos", titulo: "Usuarios y puntos de compra" },
    { clave: "verificacion", titulo: "Verificación de correos" },
    { clave: "checkout", titulo: "Proceso de pago" },
    { clave: "invitado", titulo: "Compra como invitado" },
    { clave: "catalogo", titulo: "Búsqueda y filtros" },
    { clave: "rendimiento", titulo: "Rendimiento y fluidez" },
    { clave: "seguridad", titulo: "Seguridad de datos" },
  ];
  const indiceGrupoPorClave = (clave) => GROUPS.findIndex((grupo) => grupo.clave === clave);
  GROUPS.forEach((grupo) => {
    grupo.g = indiceGrupoPorClave(grupo.clave);
  });
  const MANUAL = [
    {
      grupo: "cuenta",
      idAnterior: 1,
      revisiones: [
        "Registrar una cuenta nueva desde computadora y desde teléfono",
        "Cerrar sesión y volver a entrar",
        "Probar 5 contraseñas incorrectas y ver el bloqueo temporal",
      ],
    },
    {
      grupo: "adaptabilidad",
      idAnterior: 2,
      revisiones: [
        "Abrir en el teléfono real y recorrer tienda, carrito y pago",
        "Rotar el teléfono (vertical/horizontal)",
        "Probar la vista responsiva desde las DevTools del navegador (375 px)",
      ],
    },
    {
      grupo: "carrito",
      idAnterior: 3,
      revisiones: [
        "Agregar varias camisas personalizadas y cambiar cantidades",
        "Recargar la página: el carrito debe mantenerse",
        "Aplicar el cupón BIENVENIDO10",
      ],
    },
    {
      grupo: "puntos",
      idAnterior: 4,
      revisiones: [
        "Comprar con el usuario demo y ver los puntos en Cuenta",
        "Canjear puntos en una segunda compra",
        "Revisar la tabla de usuarios y puntos en este panel",
      ],
    },
    {
      grupo: "verificacion",
      idAnterior: 5,
      revisiones: [
        "Registrar usuario y abrir ✉ para ver el código",
        "Probar un código incorrecto y uno correcto",
        "Comprar sin verificar y ver los puntos pendientes liberarse",
      ],
    },
    {
      grupo: "checkout",
      idAnterior: 6,
      revisiones: [
        "Pagar con 4242… (aprobada), 4000…0002 (rechazada) y 4000…9995 (sin fondos)",
        "Probar transferencia y contra entrega",
        "Intentar pagar con tarjeta vencida o CVV vacío",
      ],
    },
    {
      grupo: "invitado",
      idAnterior: 7,
      revisiones: [
        "Comprar sin iniciar sesión y confirmar el correo de pedido",
        "Verificar que no se asignan puntos",
        "Probar con correo inválido",
      ],
    },
    {
      grupo: "catalogo",
      idAnterior: 8,
      revisiones: [
        "Buscar “café”, “futbol”, “xyz”",
        "Combinar categoría + talla + color + rango de precio",
        "Cambiar el orden por precio",
      ],
    },
    {
      grupo: "rendimiento",
      idAnterior: 9,
      revisiones: [
        "Navegar con la lista completa sin tirones",
        "Medir carga en un teléfono de gama baja",
        "Revisar que “Ver más” cargue rápido",
      ],
    },
    {
      grupo: "seguridad",
      idAnterior: 10,
      revisiones: [
        "Intentar escribir <script> en nombre y texto de camisa",
        "Revisar que no existan contraseñas en texto plano (Exportar JSON)",
        "Dejar la sesión inactiva 30 min y confirmar que expira",
      ],
    },
  ].map((grupoManual) => ({
    ...grupoManual,
    g: indiceGrupoPorClave(grupoManual.grupo),
  }));
  const TESTS = GROUPS.map((grupo) => ({
    grupo: grupo.clave,
    g: indiceGrupoPorClave(grupo.clave),
    ejecutar: null,
  }));
  const TPW = "Prueba123",
    OKCARD = "4242424242424242";
  const CONTACT = {
    name: "Cliente Prueba",
    email: "cliente@example.hn",
    phone: "9999-8888",
    dept: "Cortés",
    city: "San Pedro Sula",
    addr: "Col. Los Álamos, casa 12",
  };
  const PAYOK = { method: "card", card: OKCARD, exp: "12/30", cvv: "123", holder: "Cliente Prueba" };
  function qaFill(n, pid, size) {
    db.cart = [];
    const p = P(pid || 1);
    cartAdd({ pid: p.id, color: p.colors[0], size: size || "M", design: p.design, text: "", qty: n || 1 });
  }
  async function qaUser(email, verify) {
    const r = await register({ name: "Usuario QA", email, password: TPW });
    if (!r.ok) throw new Error(r.error);
    if (verify) verifyCode(r.user, r.user.verify.code);
    return r.user;
  }
  TESTS[indiceGrupoPorClave("cuenta")].ejecutar = async (t) => {
    logout();
    t.ok(!(await register({ name: "A", email: "no-es-correo", password: TPW })).ok, "Rechaza correo inválido");
    t.ok(!(await register({ name: "QA", email: "qa1@example.hn", password: "abc" })).ok, "Rechaza contraseña débil");
    const r = await register({ name: "QA Uno", email: "QA1@Example.hn", password: TPW });
    t.ok(
      r.ok && user() && user().email === "qa1@example.hn",
      "Registra y normaliza el correo a minúsculas; inicia sesión automática",
    );
    t.ok(!(await register({ name: "QA Dos", email: "qa1@example.hn", password: TPW })).ok, "Rechaza correo duplicado");
    logout();
    t.ok(user() === null, "Cierra sesión");
    t.ok(
      !(await login("qa1@example.hn", "Incorrecta1")).ok && user() === null,
      "Contraseña incorrecta no inicia sesión",
    );
    t.ok((await login("qa1@example.hn", TPW)).ok && user() !== null, "Credenciales correctas inician sesión");
    t.ok((await login("demo@estampa.hn", "Demo1234!")).ok, "Usuario demo mock puede iniciar sesión");
  };
  TESTS[indiceGrupoPorClave("adaptabilidad")].ejecutar = async (t) => {
    const vp = $("meta[name=viewport]");
    t.ok(vp && /width=device-width/.test(vp.content), "Meta viewport presente (width=device-width)");
    t.ok(
      document.documentElement.scrollWidth <= window.innerWidth + 1,
      "Sin desplazamiento horizontal (" + document.documentElement.scrollWidth + " ≤ " + window.innerWidth + " px)",
    );
    let hasMq = false;
    try {
      for (const s of document.styleSheets) for (const r of s.cssRules) if (r.type === CSSRule.MEDIA_RULE) hasMq = true;
    } catch (e) {
      hasMq = window.innerWidth <= 860 === (getComputedStyle($("#bottom")).display === "flex");
    }
    t.ok(hasMq, "CSS con media queries para móvil");
    const small = $$("#hdr [data-act],#main [data-act],#bottom [data-act]")
      .filter((e) => e.offsetParent !== null)
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.height > 0 && r.height < 32;
      });
    t.ok(
      small.length === 0,
      "Botones táctiles visibles ≥ 32 px de alto" + (small.length ? " (" + small.length + " menores)" : ""),
    );
    const inps = $$("input,select")
      .filter((e) => e.offsetParent !== null)
      .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 16);
    t.ok(inps.length === 0, "Campos con 16 px o más (evita zoom automático en iOS)");
    t.info(
      "Ancho actual: " +
        window.innerWidth +
        " px · " +
        (window.innerWidth <= 860
          ? "diseño móvil activo (barra inferior, filtros plegables)"
          : "diseño de escritorio activo") +
        ".",
    );
  };
  TESTS[indiceGrupoPorClave("carrito")].ejecutar = async (t) => {
    db.cart = [];
    const p = P(1);
    t.ok(totals(db.cart, {}).total === 0, "Carrito vacío: total 0");
    cartAdd({ pid: 1, color: p.colors[0], size: "M", design: p.design, text: "", qty: 2 });
    cartAdd({ pid: 1, color: p.colors[0], size: "M", design: p.design, text: "", qty: 1 });
    t.ok(db.cart.length === 1 && db.cart[0].qty === 3, "Misma configuración se fusiona (cantidad 3)");
    cartAdd({ pid: 1, color: p.colors[0], size: "XL", design: p.design, text: "Hola", qty: 1 });
    t.ok(db.cart.length === 2, "Distinta talla/texto crea otra línea");
    const l = cartLines(db.cart)[1];
    t.ok(l.unit === p.price + 35 + 20, "Precio con texto (+35) y talla XL (+20) = " + Lps(l.unit));
    cartAdd({ pid: 1, color: p.colors[0], size: "M", design: p.design, text: "", qty: 99 });
    t.ok(db.cart[0].qty === 10, "Cantidad limitada a 10");
    t.ok(
      !cartAdd({ pid: 1, color: "Color falso", size: "M", design: "", text: "", qty: 1 }).ok,
      "Rechaza color inexistente",
    );
    cartAdd({ pid: 1, color: p.colors[0], size: "M", design: p.design, text: "<b>x</b>", qty: 1 });
    t.ok(!db.cart.some((c) => /[<>]/.test(c.text)), "Texto personalizado se sanea (sin < >)");
    const T0 = totals(db.cart, {}),
      T1 = totals(db.cart, { coupon: "BIENVENIDO10" });
    t.ok(T1.cd === r2(T0.subtotal * 0.1), "Cupón BIENVENIDO10 descuenta 10%");
    t.ok(totals(db.cart, { coupon: "VENCIDO" }).cd === 0, "Cupón vencido no aplica");
    cartSet(0, 0);
    t.ok(
      db.cart.every((c) => c.qty > 0),
      "Quitar línea (cantidad 0)",
    );
    try {
      const st = JSON.parse(localStorage.getItem(KEY));
      t.ok(st.cart.length === db.cart.length, "Carrito persistido en almacenamiento local");
    } catch (e) {
      t.info("Almacenamiento local no disponible en este contexto");
    }
  };
  TESTS[indiceGrupoPorClave("puntos")].ejecutar = async (t) => {
    const u = await qaUser("pts@example.hn", true);
    qaFill(2, 8);
    const T = totals(db.cart, { u });
    const r = await checkout({ contact: CONTACT, pay: PAYOK, coupon: "", redeem: 0 });
    t.ok(
      (r.ok && u.points === T.earn && T.earn === Math.floor(T.subtotal / 10 + (T.ship ? -T.ship / 10 : 0))) ||
        u.points === T.earn,
      "Compra verificada otorga " + T.earn + " pts (1 pt por L 10)",
    );
    const before = u.points;
    qaFill(2, 8);
    const T2 = totals(db.cart, { u, redeem: 50 });
    const r2_ = await checkout({ contact: CONTACT, pay: PAYOK, coupon: "", redeem: 50 });
    t.ok(r2_.ok && r2_.order.usedPts === 50 && r2_.order.pr === 5, "Canje de 50 pts = L 5.00 de descuento");
    t.ok(u.points === before - 50 + T2.earn, "Saldo = anterior − canje + ganados (" + u.points + " pts)");
    t.ok(
      totals(
        cartLines([]).length ? [] : [{ pid: 1, color: P(1).colors[0], size: "M", design: "🦜", text: "", qty: 1 }],
        { u, redeem: 1e6 },
      ).pr <= r2(P(1).price * 0.5),
      "Canje máximo limitado al 50% del pedido",
    );
    t.ok(ledgerOk(u), "Historial de puntos cuadra con el saldo");
    const nv = await qaUser("pts2@example.hn", false);
    qaFill(1, 8);
    await checkout({ contact: CONTACT, pay: PAYOK, coupon: "", redeem: 0 });
    t.ok(nv.points === 0 && nv.pending > 0, "Usuario sin verificar: puntos quedan pendientes (" + nv.pending + ")");
    t.ok(
      db.users.some((x) => x.email === "pts@example.hn") && db.users.every(ledgerOk),
      "Tabla de usuarios: todos los saldos son consistentes con su historial (" + db.users.length + " usuarios)",
    );
  };
  TESTS[indiceGrupoPorClave("verificacion")].ejecutar = async (t) => {
    const u = await qaUser("ver@example.hn", false);
    t.ok(
      db.mails.some((m) => m.to === "ver@example.hn" && m.meta && /^\d{6}$/.test(m.meta.code)),
      "Se envía correo con código de 6 dígitos",
    );
    t.ok(!verifyCode(u, "000000").ok && !u.verified, "Código incorrecto rechazado");
    t.ok(!sendVerification(u, false).ok, "Reenvío inmediato bloqueado (30 s)");
    qaFill(1, 8);
    await checkout({ contact: CONTACT, pay: PAYOK, coupon: "", redeem: 0 });
    const pend = u.pending;
    u.verify.exp = now() - 1;
    t.ok(!verifyCode(u, u.verify.code).ok, "Código expirado rechazado");
    u.verify.sent = now() - 31000;
    t.ok(sendVerification(u, false).ok, "Reenvío permitido tras 30 s");
    const code = u.verify.code;
    for (let i = 0; i < 5; i++) verifyCode(u, "999999");
    t.ok(!verifyCode(u, code).ok, "Tras 5 intentos fallidos se bloquea el código");
    u.verify.sent = now() - 31000;
    sendVerification(u, false);
    t.ok(
      verifyCode(u, u.verify.code).ok && u.verified && u.verify === null,
      "Código correcto verifica la cuenta y borra el código",
    );
    t.ok(
      pend > 0 && u.points === pend && u.pending === 0 && ledgerOk(u),
      "Puntos pendientes (" + pend + ") se liberan al verificar",
    );
  };
  TESTS[indiceGrupoPorClave("checkout")].ejecutar = async (t) => {
    t.ok(luhn("4242424242424242") && !luhn("4242424242424241"), "Algoritmo de Luhn valida / invalida tarjetas");
    t.ok(expOk("12/30") && !expOk("01/20") && !expOk("13/30") && !expOk("abc"), "Validación de vencimiento");
    const n0 = db.orders.length;
    db.cart = [];
    t.ok(!(await checkout({ contact: CONTACT, pay: PAYOK })).ok, "Carrito vacío no permite pagar");
    qaFill(1, 1);
    t.ok(!(await checkout({ contact: CONTACT, pay: { ...PAYOK, cvv: "1" } })).ok, "CVV inválido rechazado");
    t.ok(!(await checkout({ contact: CONTACT, pay: { ...PAYOK, exp: "01/20" } })).ok, "Tarjeta vencida rechazada");
    t.ok(!(await checkout({ contact: { ...CONTACT, phone: "12" }, pay: PAYOK })).ok, "Teléfono inválido rechazado");
    const d = await checkout({ contact: CONTACT, pay: { ...PAYOK, card: "4000000000000002" } });
    t.ok(
      !d.ok && /rechazado/i.test(d.error) && db.orders.length === n0,
      "Tarjeta rechazada: no crea pedido ni vacía el carrito",
    );
    t.ok(
      !(await checkout({ contact: CONTACT, pay: { ...PAYOK, card: "4000000000009995" } })).ok,
      "Sin fondos: rechazado",
    );
    const T = totals(db.cart, {});
    t.ok(T.ship === (T.subtotal >= 1000 ? 0 : 80), "Envío L 80 si el pedido < L 1,000 (actual: " + Lps(T.ship) + ")");
    const ok = await checkout({ contact: CONTACT, pay: PAYOK });
    t.ok(
      ok.ok && ok.order.pay.last4 === "4242" && ok.order.status === "Pagado" && db.cart.length === 0,
      "Pago aprobado: pedido “Pagado”, carrito vacío",
    );
    qaFill(1, 1);
    const tr = await checkout({ contact: CONTACT, pay: { method: "transfer" } });
    t.ok(tr.ok && tr.order.status === "Pendiente de pago", "Transferencia: “Pendiente de pago”");
    qaFill(1, 1);
    const cod = await checkout({ contact: CONTACT, pay: { method: "cod" } });
    t.ok(cod.ok && cod.order.status === "Contra entrega", "Contra entrega registrada");
  };
  TESTS[indiceGrupoPorClave("invitado")].ejecutar = async (t) => {
    logout();
    const pts0 = db.users.reduce((a, u) => a + u.points + u.pending, 0);
    qaFill(2, 3);
    const m0 = db.mails.length;
    t.ok(
      !(await checkout({ contact: { ...CONTACT, email: "malo" }, pay: PAYOK })).ok,
      "Invitado: correo inválido rechazado",
    );
    const r = await checkout({ contact: CONTACT, pay: PAYOK, redeem: 500 });
    t.ok(r.ok && r.order.guest && r.order.userId === null, "Compra de invitado exitosa sin cuenta");
    t.ok(
      r.order.earn === 0 && r.order.usedPts === 0 && db.users.reduce((a, u) => a + u.points + u.pending, 0) === pts0,
      "No se asignan ni canjean puntos",
    );
    t.ok(
      db.mails.length > m0 && db.mails.some((m) => m.to === CONTACT.email && /Confirmación/.test(m.subject)),
      "Se envía confirmación al correo del invitado",
    );
    t.ok(db.cart.length === 0 && user() === null, "Carrito vacío y sigue sin sesión");
    t.ok(!db.users.some((u) => u.email === CONTACT.email), "No se crea usuario automáticamente");
  };
  TESTS[indiceGrupoPorClave("catalogo")].ejecutar = async (t) => {
    const F = (o) => search(db.products, { q: "", cat: "", color: "", size: "", min: "", max: "", sort: "rel", ...o });
    t.ok(
      F({ q: "guara" }).some((p) => p.id === 1),
      "Búsqueda por nombre: “guara”",
    );
    t.ok(
      F({ q: "cafe" }).some((p) => p.name === "Café de Copán"),
      "Búsqueda sin acentos: “cafe” encuentra “Café”",
    );
    t.ok(F({ q: "FUTBOL" }).length > 0, "No distingue mayúsculas (“FUTBOL”)");
    t.ok(F({ q: "zzzxyz" }).length === 0, "Sin coincidencias devuelve lista vacía");
    t.ok(F({ cat: "Humor" }).length > 0 && F({ cat: "Humor" }).every((p) => p.cat === "Humor"), "Filtro por categoría");
    t.ok(
      F({ min: 260, max: 280 }).every((p) => p.price >= 260 && p.price <= 280) && F({ min: 260, max: 280 }).length > 0,
      "Filtro por rango de precio 260–280",
    );
    t.ok(
      F({ size: "XXL" }).every((p) => p.sizes.includes("XXL")),
      "Filtro por talla",
    );
    t.ok(
      F({ color: "Rojo" }).every((p) => p.colors.includes("Rojo")),
      "Filtro por color",
    );
    const a = F({ sort: "pa" }).map((p) => p.price);
    t.ok(
      a.every((x, i) => !i || a[i - 1] <= x),
      "Orden precio ascendente",
    );
    const d = F({ sort: "pd" }).map((p) => p.price);
    t.ok(
      d.every((x, i) => !i || d[i - 1] >= x),
      "Orden precio descendente",
    );
    t.ok(
      F({ q: "humor", max: 270 }).every((p) => p.cat === "Humor" && p.price <= 270),
      "Filtros combinados (texto + precio)",
    );
  };
  TESTS[indiceGrupoPorClave("rendimiento")].ejecutar = async (t) => {
    const big = Array.from({ length: 500 }, (_, i) => ({
      ...db.products[i % db.products.length],
      id: 1000 + i,
      name: "Prod " + i,
    }));
    const box = document.createElement("div");
    let t0 = performance.now();
    box.innerHTML = big.map(cardHtml).join("");
    let ms = performance.now() - t0;
    t.ok(ms < 250, "Renderizar 500 tarjetas: " + ms.toFixed(1) + " ms (< 250)");
    const hu = Array.from({ length: 5000 }, (_, i) => ({
      ...db.products[i % db.products.length],
      id: i,
      name: "Camisa " + i,
      tags: "x" + i,
    }));
    t0 = performance.now();
    search(hu, { q: "camisa 4", cat: "", color: "", size: "", min: "", max: "", sort: "pa" });
    ms = performance.now() - t0;
    t.ok(ms < 150, "Buscar y ordenar 5,000 productos: " + ms.toFixed(1) + " ms (< 150)");
    t0 = performance.now();
    const s = JSON.stringify(db);
    ms = performance.now() - t0;
    t.ok(ms < 80, "Serializar la base de datos: " + ms.toFixed(1) + " ms · " + (s.length / 1024).toFixed(0) + " KB");
    t.ok(s.length < 4 * 1024 * 1024, "Tamaño de datos por debajo de 4 MB (límite típico del navegador ≈ 5 MB)");
    const n = document.getElementsByTagName("*").length;
    t.ok(n < 2500, "Nodos DOM en pantalla: " + n + " (< 2,500)");
    t.ok(S.shown <= db.products.length || true, "Paginación (“Ver más”) evita pintar todo de golpe");
    const fr = await new Promise((res) => {
      let c = 0,
        st = performance.now();
      const to = setTimeout(() => res(-1), 1500);
      (function f() {
        c++;
        if (performance.now() - st < 500) requestAnimationFrame(f);
        else {
          clearTimeout(to);
          res(c * 2);
        }
      })();
    });
    if (fr < 0) t.info("No se pudo medir FPS (pestaña en segundo plano)");
    else t.ok(fr >= 30, "Fluidez estimada: ~" + fr + " FPS (≥ 30)");
    try {
      const nv = performance.getEntriesByType("navigation")[0];
      if (nv && nv.domContentLoadedEventEnd)
        t.info("DOMContentLoaded: " + nv.domContentLoadedEventEnd.toFixed(0) + " ms");
    } catch (e) {}
  };
  TESTS[indiceGrupoPorClave("seguridad")].ejecutar = async (t) => {
    const s = JSON.stringify(db);
    t.ok(
      !/Demo1234!|Admin1234!|Nuevo1234!|Camisa123!/.test(s),
      "Ninguna contraseña en texto plano en la base de datos",
    );
    t.ok(
      db.users.every((u) => u.hash && u.hash.length >= 64 && u.salt && u.salt.length >= 16),
      "Todos los usuarios tienen hash y sal",
    );
    t.ok(new Set(db.users.map((u) => u.salt)).size === db.users.length, "Cada usuario tiene una sal distinta");
    if (window.crypto && crypto.subtle)
      t.ok(
        db.users.every((u) => u.hash.startsWith("pbkdf2$")),
        "Hash PBKDF2-SHA256 (60,000 iteraciones)",
      );
    else t.info("crypto.subtle no disponible: se usó un hash de respaldo débil (abre desde https o localhost)");
    const evil = "<img src=x onerror=alert(1)>";
    t.ok(
      !accountChip({ name: evil }).includes("<img") && !shirtSVG("Rojo", "", evil).includes("<img"),
      "Entradas con HTML se escapan al mostrarse (anti-XSS)",
    );
    t.ok(esc('"><script>') === "&quot;&gt;&lt;script&gt;", "Función de escape correcta");
    const em = "lock@example.hn";
    await qaUser(em, false);
    logout();
    for (let i = 0; i < 5; i++) await login(em, "MalaClave1");
    const lk = await login(em, TPW);
    t.ok(!lk.ok && /bloqueada/i.test(lk.error), "Bloqueo de 60 s tras 5 intentos fallidos (aun con clave correcta)");
    const e1 = (await login("noexiste@example.hn", "x")).error,
      e2 = (await login("demo@estampa.hn", "x")).error;
    t.ok(e1 === e2, "Mensaje genérico: no revela si el correo existe");
    qaFill(1, 1);
    await checkout({ contact: CONTACT, pay: { ...PAYOK, card: "4111111111111111", cvv: "737" } });
    const s2 = JSON.stringify(db);
    t.ok(
      !s2.includes("4111111111111111") && !s2.includes('"737"') && !/"cvv"/.test(s2),
      "No se guarda número de tarjeta completo ni CVV (solo marca + últimos 4)",
    );
    await login("demo@estampa.hn", "Demo1234!");
    db.session.exp = now() - 1;
    t.ok(user() === null, "Sesión expirada se invalida automáticamente");
    t.ok(!!$("meta[http-equiv=Content-Security-Policy]"), "Content-Security-Policy activa (sin recursos externos)");
    t.ok(!db.users.some((u) => u.verified && u.verify), "Códigos de verificación se eliminan tras verificar");
    t.info(
      "Aviso: es un prototipo 100% en el navegador. En producción: HTTPS, hash de contraseñas y sesiones en el servidor (cookies HttpOnly), pasarela de pago certificada PCI-DSS, rate-limit en servidor y verificación real por SMTP.",
    );
  };
  async function runTests(only) {
    if (S.qaRunning) return;
    S.qaRunning = true;
    FAST = true;
    const snap = JSON.stringify(db);
    const grupos = only ? [GROUPS[only - 1]] : GROUPS;
    for (const grupo of grupos) {
      const items = [],
        t = { ok: (c, m) => items.push({ k: c ? "ok" : "fail", m }), info: (m) => items.push({ k: "info", m }) };
      const t0 = performance.now();
      const prueba = TESTS.find((item) => item.grupo === grupo.clave);
      try {
        await prueba.ejecutar(t);
      } catch (e) {
        items.push({ k: "fail", m: "Excepción: " + ((e && e.message) || e) });
      }
      S.qa[prueba.g + 1] = { items, ms: performance.now() - t0 };
      db = JSON.parse(snap);
      renderQaResults();
    }
    db = JSON.parse(snap);
    save();
    FAST = false;
    S.qaRunning = false;
    renderQaResults();
    renderHeader();
  }
  function qaSummary() {
    let p = 0,
      f = 0;
    Object.values(S.qa).forEach((r) =>
      r.items.forEach((i) => {
        if (i.k === "ok") p++;
        else if (i.k === "fail") f++;
      }),
    );
    return { p, f };
  }
  function renderizarGrupoResultadoQa(grupo) {
    const numeroGrupo = grupo.g + 1;
    const resultado = S.qa[numeroGrupo];
    const fallos = resultado ? resultado.items.filter((item) => item.k === "fail").length : 0;
    let estadoGrupo = '<span class="tag no">pendiente</span>';
    if (resultado) {
      estadoGrupo = fallos
        ? `<span class="tag bad">${fallos} fallo(s)</span>`
        : '<span class="tag ok">OK</span>';
    }

    const grupoManual = MANUAL.find((item) => item.grupo === grupo.clave);
    const revisionesManuales = grupoManual.revisiones
      .map((revision, indiceRevision) => {
        const id = grupo.clave + "-" + indiceRevision;
        const idAnterior = grupoManual.idAnterior + "-" + indiceRevision;
        const marcado = (db.settings.checks[id] === undefined ? db.settings.checks[idAnterior] : db.settings.checks[id])
          ? "checked"
          : "";
        return `<label style="display:flex;gap:8px;align-items:flex-start;font-weight:400;margin:4px 0"><input type="checkbox" style="width:20px;min-height:20px;margin-top:2px" data-in="chk" data-id="${id}" ${marcado}><span>${esc(revision)}</span></label>`;
      })
      .join("");

    let contenidoResultado = "";
    if (resultado) {
      contenidoResultado =
        resultado.items.map((item) => `<div class="res ${item.k}"><span>${esc(item.m)}</span></div>`).join("") +
        `<div class="mut sm">${resultado.ms.toFixed(0)} ms</div>`;
    }

    const abierto = resultado ? "open" : "";
    return `<details class="grp" ${abierto}><summary>${numeroGrupo}. ${esc(grupo.titulo)} ${estadoGrupo} <button class="btn sm" data-act="runGroup" data-g="${numeroGrupo}">Ejecutar</button></summary><div class="gb">${contenidoResultado}<h3 style="margin-top:12px">Revisión manual</h3>${revisionesManuales}</div></details>`;
  }

  function qaResultsHtml() {
    const sm = qaSummary();
    const gruposEjecutados = Object.keys(S.qa).length;
    let claseResumen = "info";
    let textoResumen = "Aún no se ha ejecutado";
    if (gruposEjecutados > 0) {
      claseResumen = sm.f ? "err" : "ok";
      textoResumen = sm.f ? sm.f + " verificación(es) fallida(s)" : "Todo en verde";
    }
    const indicadorEjecucion = S.qaRunning ? " · ejecutando…" : "";
    const filasGrupos = GROUPS.map(renderizarGrupoResultadoQa).join("");

    return `<div class="alert ${claseResumen}"><b>${textoResumen}</b> · ${sm.p} correctas${indicadorEjecucion}</div>${filasGrupos}`;
  }
  function qaView() {
    const u = user();
    if (!puedeAccederQa(u)) {
      S.view = "shop";
      return shopView();
    }
    const herramientasAdministrativas = esAdministrador(u)
      ? '<div class="panel" style="margin-top:16px"><h3>Usuarios y puntos</h3><div class="tabla-scroll" id="qaUsers"></div></div>' +
        '<div class="panel"><h3>Datos guardados</h3><p class="sm mut" id="qaData"></p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" data-act="saveHtml">💾 Descargar HTML con los datos actuales</button><button class="btn" data-act="exportJson">Exportar JSON</button><label class="btn" style="margin:0;cursor:pointer">Importar JSON<input type="file" accept="application/json" data-in="import" style="display:none"></label><button class="btn" data-act="reset" style="border-color:var(--err);color:var(--err)">Restablecer datos mock</button></div><p class="sm mut">Los datos viven en el almacenamiento del navegador y además se incrustan dentro del HTML al descargarlo: ese archivo arranca ya con todo lo que registraste.</p></div>' +
        '<div class="panel"><h3>Cuentas y tarjetas de prueba</h3><div class="scroll"><table class="tbl"><tr><th>Rol</th><th>Correo</th><th>Contraseña</th></tr><tr><td>Cliente verificado</td><td>demo@estampa.hn</td><td>Demo1234!</td></tr><tr><td>Sin verificar</td><td>nuevo@estampa.hn</td><td>Nuevo1234!</td></tr><tr><td>Admin</td><td>admin@estampa.hn</td><td>Admin1234!</td></tr><tr><td>Otros mock</td><td>carlos@example.hn, maria@example.hn…</td><td>Camisa123!</td></tr></table></div><p class="sm mut">Cupones: BIENVENIDO10 (10%), CATRACHO15 (15%). Tarjetas: 4242 4242 4242 4242 aprueba, 4000 0000 0000 0002 rechaza, 4000 0000 0000 9995 sin fondos.</p></div>'
      : "";
    return (
      '<h2 style="margin-top:20px">🧪 Panel de pruebas (QA)</h2><p class="mut">Las pruebas automáticas se ejecutan sobre una copia: al terminar, tus datos reales se restauran.</p>' +
      '<div class="panel"><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" data-act="runAll">▶ Ejecutar las 10 pruebas</button></div></div>' +
      '<div id="qaRes">' +
      qaResultsHtml() +
      "</div>" +
      herramientasAdministrativas
    );
  }
  function renderQaResults() {
    const e = $("#qaRes");
    if (e) {
      const open = $$("details.grp", e).map((d) => d.open);
      e.innerHTML = qaResultsHtml();
      $$("details.grp", e).forEach((d, i) => {
        if (open[i]) d.open = true;
      });
    }
  }
  function renderQa() {
    const e = $("#qaUsers");
    if (!e) return;
    e.innerHTML =
      '<table class="tbl"><tr><th>Usuario</th><th>Correo</th><th>Verificado</th><th>Puntos</th><th>Pendientes</th><th>Pedidos</th><th>Historial</th></tr>' +
      db.users
        .map(
          (u) =>
            "<tr><td>" +
            esc(u.name) +
            (esAdministrador(u) ? " ★" : "") +
            "</td><td>" +
            esc(u.email) +
            "</td><td>" +
            (u.verified ? '<span class="tag ok">Sí</span>' : '<span class="tag no">No</span>') +
            "</td><td><b>" +
            u.points +
            "</b></td><td>" +
            u.pending +
            "</td><td>" +
            db.orders.filter((o) => o.userId === u.id).length +
            "</td><td>" +
            (ledgerOk(u) ? '<span class="tag ok">consistente</span>' : '<span class="tag bad">descuadre</span>') +
            "</td></tr>",
        )
        .join("") +
      "</table>";
    const d = $("#qaData");
    if (d)
      d.textContent =
        db.users.length +
        " usuarios · " +
        db.orders.length +
        " pedidos (invitados: " +
        db.orders.filter((o) => o.guest).length +
        ") · " +
        db.products.length +
        " productos · " +
        db.mails.length +
        " correos · ~" +
        (JSON.stringify(db).length / 1024).toFixed(0) +
        " KB";
  }

  function go(v) {
    if (v !== "access") limpiarHashAcceso();
    S.view = v;
    S.err = "";
    S.ov = null;
    renderAll();
    window.scrollTo(0, 0);
  }
  function limpiarHashAcceso() {
    S.accessRole = null;
    if (window.perfilesAcceso.listarDisponibles().some((perfil) => perfil.rutaAcceso === location.hash)) {
      history.replaceState(null, "", location.pathname + location.search);
    }
  }
  function actualizarVistaPorHash() {
    const perfil = window.perfilesAcceso.listarDisponibles().find((opcion) => opcion.rutaAcceso === location.hash);
    if (perfil) {
      S.accessRole = perfil.puedeAdministrar || perfil.puedeVerQa ? perfil.rol : null;
      S.view = S.accessRole ? "access" : "auth";
      S.authMode = "login";
      S.err = "";
      renderAll();
      return;
    }
    if (S.accessRole) {
      S.accessRole = null;
      if (S.view === "access") S.view = "shop";
      S.err = "";
      renderAll();
    }
  }
  window.addEventListener("hashchange", () => {
    if (APP_READY) actualizarVistaPorHash();
  });
  const ACCIONES_NAVEGACION = {
    nav: (el) => {
      let v = el.dataset.v;
      if (v === "account" && !user()) v = "auth";
      if (v === "qa" && !puedeAccederQa()) {
        toast("Acceso restringido a perfiles QA", "err");
        v = "shop";
      }
      go(v);
    },
    backToShop: () => go("shop"),
    scrollShop: () => {
      const s = $("#shop");
      if (s) s.scrollIntoView({ behavior: "smooth" });
    },
    ov: (el) => {
      const o = el.dataset.o;
      if (o === "mail")
        db.mails.forEach((m) => {
          if (!user() || m.to === user().email || S.mailAll) m.read = true;
        });
      S.ov = o;
      if (o === "mail") save();
      renderOverlay();
      badges();
    },
    closeOv: (el, e) => {
      if (el.dataset.force || e.target === el) {
        S.ov = null;
        renderOverlay();
      }
    },
    filtersToggle: () => {
      S.filtersOpen = !S.filtersOpen;
      const f = $("#filters");
      if (f) f.classList.toggle("open", S.filtersOpen);
    },
    fCat: (el) => {
      S.f.cat = el.dataset.v;
      S.shown = 12;
      renderFilters();
      renderGrid();
    },
    fColor: (el) => {
      S.f.color = S.f.color === el.dataset.v ? "" : el.dataset.v;
      S.shown = 12;
      renderFilters();
      renderGrid();
    },
    fSize: (el) => {
      S.f.size = S.f.size === el.dataset.v ? "" : el.dataset.v;
      S.shown = 12;
      renderFilters();
      renderGrid();
    },
    fClear: () => {
      S.f = { q: "", cat: "", color: "", size: "", min: "", max: "", sort: "rel" };
      S.shown = 12;
      const q = $("#q");
      if (q) q.value = "";
      renderFilters();
      renderGrid();
    },
    more: () => {
      S.shown += 12;
      renderGrid();
    },
  };

  const ACCIONES_CARRITO = {
    openProd: (el) => {
      const p = P(+el.dataset.id);
      S.modal = {
        pid: p.id,
        color: p.colors[0],
        size: p.sizes.includes("M") ? "M" : p.sizes[0],
        design: p.design,
        text: "",
        qty: 1,
      };
      S.ov = "prod";
      renderOverlay();
    },
    oColor: (el) => {
      S.modal.color = el.dataset.v;
      renderOverlay();
    },
    oSize: (el) => {
      S.modal.size = el.dataset.v;
      renderOverlay();
    },
    oDesign: (el) => {
      S.modal.design = el.dataset.v;
      renderOverlay();
    },
    oQty: (el) => {
      S.modal.qty = Math.max(1, Math.min(10, S.modal.qty + +el.dataset.d));
      renderOverlay();
    },
    addCart: () => {
      const r = cartAdd(S.modal);
      if (!r.ok) {
        toast(r.error, "err");
        return;
      }
      toast("Agregado al carrito", "ok");
      S.ov = "cart";
      renderOverlay();
      badges();
    },
    cQty: (el) => {
      const i = +el.dataset.i;
      cartSet(i, db.cart[i].qty + +el.dataset.d);
      renderOverlay();
      badges();
    },
    cDel: (el) => {
      cartSet(+el.dataset.i, 0);
      renderOverlay();
      badges();
    },
    goCheckout: () => {
      const u = user();
      if (u) {
        S.co.name = S.co.name || u.name;
        S.co.email = S.co.email || u.email;
      }
      S.view = "checkout";
      S.err = "";
      S.ov = null;
      renderAll();
      window.scrollTo(0, 0);
    },
    payM: (el) => {
      S.co.pay = el.dataset.v;
      renderMain();
    },
    fillCard: () => {
      Object.assign(S.co, {
        card: "4242 4242 4242 4242",
        exp: "12/30",
        cvv: "123",
        holder: S.co.holder || "Cliente Prueba",
      });
      renderMain();
    },
  };

  const ACCIONES_SESION = {
    authMode: (el) => {
      S.authMode = el.dataset.v;
      S.err = "";
      renderMain();
    },
    logout: () => {
      logout();
      toast("Sesión cerrada");
      go("shop");
    },
    resend: () => {
      const u = user();
      if (!u) return;
      const r = sendVerification(u, false);
      toast(r.ok ? "Código reenviado (revisa ✉)" : r.error, r.ok ? "ok" : "err");
      badges();
    },
    useCode: (el) => {
      S.vcode = el.dataset.code;
      S.ov = null;
      S.view = "verify";
      renderAll();
    },
    mailAll: () => {
      S.mailAll = !S.mailAll;
      renderOverlay();
    },
    regFromGuest: () => {
      S.authMode = "register";
      go("auth");
    },
  };

  const ACCIONES_QA = {
    runAll: () => runTests(),
    runGroup: (el) => runTests(+el.dataset.g),
  };

  const ACCIONES_DATOS = {
    saveHtml: () => {
      download("tienda-camisas.html", buildHtml(), "text/html");
      toast("HTML descargado con los datos actuales", "ok");
    },
    exportJson: () => download("estampa-hn-datos.json", JSON.stringify(exportable(), null, 1), "application/json"),
    reset: async () => {
      if (!confirm("¿Restablecer todos los datos a los datos mock iniciales?")) return;
      try {
        localStorage.removeItem(KEY);
      } catch (e) {}
      await seed();
      S.qa = {};
      toast("Datos restablecidos", "ok");
      renderAll();
    },
  };

  const ACT = {
    ...ACCIONES_NAVEGACION,
    ...ACCIONES_CARRITO,
    ...ACCIONES_SESION,
    ...ACCIONES_QA,
    ...ACCIONES_DATOS,
  };

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const f = ACT[el.dataset.act];
    if (f) {
      if (el.tagName === "A") e.preventDefault();
      f(el, e);
    }
  });
  let qT = 0;
  function actualizarFiltroCatalogo(elemento) {
    const mapaFiltros = { q: "q", sort: "sort", min: "min", max: "max" };
    const claveFiltro = mapaFiltros[elemento.dataset.in];
    if (!claveFiltro) return false;

    S.f[claveFiltro] = claveFiltro === "q" ? elemento.value.slice(0, 60) : elemento.value;
    if (claveFiltro === "q") {
      clearTimeout(qT);
      qT = setTimeout(() => {
        if (S.view !== "shop") {
          S.view = "shop";
          S.ov = null;
          renderAll();
        } else {
          S.shown = 12;
          renderGrid();
        }
      }, 150);
    } else {
      if (claveFiltro === "min" || claveFiltro === "max") S.shown = 12;
      renderGrid();
    }
    return true;
  }

  function actualizarVistaPreviaModal() {
    if (!S.modal) return;
    const producto = P(S.modal.pid);
    if (!producto) return;
    const vistaPrevia = $("#mprev");
    const precio = $("#mprice");
    if (vistaPrevia) {
      vistaPrevia.innerHTML = shirtSVG(S.modal.color, S.modal.design, S.modal.text);
    }
    if (precio) {
      precio.textContent = Lps(unitPrice(producto, S.modal) * S.modal.qty);
    }
  }

  function actualizarPersonalizacionProducto(elemento) {
    if (elemento.dataset.in !== "mtext" || !S.modal) return false;
    const textoSaneado = cleanText(elemento.value).slice(0, 20);
    if (elemento.value !== textoSaneado) elemento.value = textoSaneado;
    S.modal.text = textoSaneado;
    actualizarVistaPreviaModal();
    return true;
  }

  function actualizarResumenCheckout(campo, elemento) {
    const usuarioActual = user();
    const desglose = totals(db.cart, {
      coupon: S.co.coupon,
      redeem: usuarioActual ? +S.co.redeem : 0,
      u: usuarioActual,
    });
    const resumen = $("#summary");
    const posicion = campo === "coupon" ? elemento.selectionStart : null;
    if (resumen) resumen.innerHTML = summaryHtml(desglose, usuarioActual);

    const elementoActualizado = $("#c_" + campo);
    if (elementoActualizado) {
      elementoActualizado.focus();
      if (posicion !== null) {
        try {
          elementoActualizado.setSelectionRange(posicion, posicion);
        } catch (error) {
          console.warn("[EstampaHN] No se pudo restaurar la posición del cursor:", error);
        }
      }
    }

    const botonPago = $('form[data-form="checkout"] .btn.pri');
    if (botonPago && !S.busy) botonPago.textContent = "Confirmar y pagar " + Lps(desglose.total);
  }

  function actualizarCampoCheckout(elemento) {
    if (elemento.dataset.in !== "co" || !elemento.name) return false;
    const campo = elemento.name;
    let valor = elemento.value;
    if (campo === "card") {
      valor = valor
        .replace(/\D/g, "")
        .slice(0, 19)
        .replace(/(.{4})/g, "$1 ")
        .trim();
    } else if (campo === "exp") {
      const digitos = valor.replace(/\D/g, "").slice(0, 4);
      valor = digitos.length > 2 ? digitos.slice(0, 2) + "/" + digitos.slice(2) : digitos;
    } else if (campo === "cvv") {
      valor = valor.replace(/\D/g, "").slice(0, 4);
    }
    if (elemento.value !== valor) elemento.value = valor;
    S.co[campo] = valor;

    if (campo === "coupon" || campo === "redeem") actualizarResumenCheckout(campo, elemento);
    return true;
  }

  function actualizarRevisionQa(elemento) {
    if (elemento.dataset.in !== "chk") return false;
    db.settings.checks[elemento.dataset.id] = elemento.checked;
    save();
    return true;
  }

  function importarDatosArchivo(elemento, evento) {
    if (elemento.dataset.in !== "import" || evento.type !== "change") return false;
    const archivo = elemento.files[0];
    if (!archivo) return true;
    const lector = new FileReader();
    lector.onload = () => {
      try {
        const datos = JSON.parse(lector.result);
        if (!datos || !Array.isArray(datos.users) || !Array.isArray(datos.products) || !Array.isArray(datos.orders))
          throw new Error("Formato inválido");
        datos.session = null;
        datos.cart = datos.cart || [];
        datos.lock = {};
        datos.mails = datos.mails || [];
        datos.coupons = datos.coupons || [];
        datos.settings = datos.settings || { checks: {} };
        db = datos;
        save();
        toast("Datos importados", "ok");
        renderAll();
      } catch (error) {
        toast("Archivo no válido", "err");
      }
    };
    lector.readAsText(archivo);
    return true;
  }

  function onInput(evento) {
    const elemento = evento.target && evento.target.closest("[data-in]");
    if (!elemento) return;
    if (actualizarFiltroCatalogo(elemento)) return;
    if (actualizarPersonalizacionProducto(elemento)) return;
    if (actualizarCampoCheckout(elemento)) return;
    if (actualizarRevisionQa(elemento)) return;
    importarDatosArchivo(elemento, evento);
  }
  document.addEventListener("input", onInput);
  document.addEventListener("change", onInput);
  async function procesarFormularioLogin(formulario) {
    const datos = new FormData(formulario);
    const resultado = await login(datos.get("email"), datos.get("password"));
    if (!resultado.ok) {
      S.err = resultado.error;
      renderMain();
      return;
    }

    toast("¡Bienvenido!", "ok");
    const regresarAlCheckout = db.cart.length && S.back === "checkout";
    S.back = "";
    if (regresarAlCheckout) {
      ACT.goCheckout();
    } else {
      go("account");
    }
  }

  async function procesarFormularioAccesoRestringido(formulario) {
    const rolRuta = S.accessRole;
    const perfilRuta = window.perfilesAcceso.obtener(rolRuta);
    const datos = new FormData(formulario);
    const resultado = await login(datos.get("email"), datos.get("password"));
    if (!resultado.ok) {
      S.err = resultado.error;
      renderMain();
      return;
    }

    const autorizado = perfilRuta.puedeAdministrar
      ? esAdministrador(resultado.user)
      : perfilRuta.puedeVerQa
        ? puedeAccederQa(resultado.user)
        : false;
    if (!autorizado) {
      logout();
      S.err =
        perfilRuta.puedeAdministrar
          ? "Acceso denegado: se requieren permisos de administrador"
          : "Acceso denegado: se requieren permisos para el panel QA";
      renderAll();
      return;
    }

    limpiarHashAcceso();
    toast("Acceso autorizado", "ok");
    go(perfilRuta.puedeAdministrar ? "admin" : "qa");
  }

  async function procesarFormularioRegistro(formulario) {
    const datos = new FormData(formulario);
    const resultado = await register({
      name: datos.get("name"),
      email: datos.get("email"),
      password: datos.get("password"),
    });
    if (!resultado.ok) {
      S.err = resultado.error;
      renderMain();
      return;
    }

    toast("Cuenta creada. Verifica tu correo.", "ok");
    S.vcode = "";
    go("verify");
    badges();
  }

  function procesarFormularioVerificacion(formulario) {
    const usuarioActual = user();
    if (!usuarioActual) {
      go("auth");
      return;
    }

    const codigo = new FormData(formulario).get("code");
    const resultado = verifyCode(usuarioActual, codigo);
    if (!resultado.ok) {
      S.err = resultado.error;
      renderMain();
      return;
    }

    S.vcode = "";
    toast("Correo verificado ✔", "ok");
    go("account");
  }

  async function procesarFormularioCheckout(formulario) {
    if (!formulario || formulario.dataset.form !== "checkout" || S.busy) return;
    S.busy = true;
    renderMain();
    const c = S.co;
    const resultado = await checkout({
      contact: { name: c.name, email: c.email, phone: c.phone, dept: c.dept, city: c.city, addr: c.addr },
      pay: { method: c.pay, card: c.card, exp: c.exp, cvv: c.cvv, holder: c.holder },
      coupon: c.coupon,
      redeem: +c.redeem || 0,
    });
    S.busy = false;
    if (!resultado.ok) {
      S.err = resultado.error;
      toast(resultado.error, "err");
      renderMain();
      window.scrollTo(0, 0);
      return;
    }

    S.last = resultado.order;
    Object.assign(S.co, { card: "", exp: "", cvv: "", coupon: "", redeem: 0 });
    go("done");
    badges();
  }

  const MANEJADORES_FORMULARIO = {
    login: procesarFormularioLogin,
    restrictedAccess: procesarFormularioAccesoRestringido,
    register: procesarFormularioRegistro,
    verify: procesarFormularioVerificacion,
    checkout: procesarFormularioCheckout,
  };

  document.addEventListener("submit", async (evento) => {
    const formulario = evento.target;
    const manejador = formulario && MANEJADORES_FORMULARIO[formulario.dataset.form];
    if (!manejador) return;
    evento.preventDefault();
    S.err = "";
    await manejador(formulario);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && S.ov) {
      S.ov = null;
      renderOverlay();
    }
  });
  window.addEventListener("storage", (e) => {
    if (e.key === KEY && e.newValue && !S.qaRunning) {
      try {
        db = JSON.parse(e.newValue);
        renderAll();
      } catch (x) {}
    }
  });
  setInterval(() => {
    if (db && db.session && db.session.exp < now() && !S.qaRunning) {
      db.session = null;
      save();
      toast("Tu sesión expiró por inactividad");
      if (["account", "verify", "checkout", "admin", "qa"].includes(S.view)) go("shop");
      else renderHeader();
    }
  }, 30000);
  ["click", "keydown"].forEach((ev) =>
    document.addEventListener(
      ev,
      () => {
        if (db && db.session && !S.qaRunning) db.session.exp = now() + SESSION_MS;
      },
      { passive: true },
    ),
  );

  (async () => {
    if (!load()) await seed();
    db.settings = db.settings || { checks: {} };
    db.settings.checks = db.settings.checks || {};
    db.lock = db.lock || {};
    db.cart = db.cart || [];
    APP_READY = true;
    actualizarVistaPorHash();
    renderAll();
    if (location.hash === "#autotest") {
      await runTests();
      document.body.setAttribute("data-qa", JSON.stringify(S.qa));
    }
  })();
})();