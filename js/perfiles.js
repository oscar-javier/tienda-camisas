class RegistroPerfilesAcceso {
  constructor() {
    this.perfiles = new Map();
  }

  registrar(rol, configuracion) {
    this.perfiles.set(rol, {
      rol,
      etiqueta: configuracion.etiqueta,
      rutaAcceso: configuracion.rutaAcceso,
      puedeVerQa: Boolean(configuracion.puedeVerQa),
      puedeAdministrar: Boolean(configuracion.puedeAdministrar),
    });
    return this;
  }

  obtener(rol) {
    return (
      this.perfiles.get(rol) || {
        rol: "invitado",
        etiqueta: "Invitado",
        rutaAcceso: "#entrar",
        puedeVerQa: false,
        puedeAdministrar: false,
      }
    );
  }

  tienePermiso(usuario, permiso) {
    if (!usuario) return false;
    return Boolean(this.obtener(usuario.role)[permiso]);
  }

  listarDisponibles() {
    return Array.from(this.perfiles.values());
  }
}

window.RegistroPerfilesAcceso = RegistroPerfilesAcceso;
window.perfilesAcceso = new RegistroPerfilesAcceso()
  .registrar("cliente", {
    etiqueta: "Cliente",
    rutaAcceso: "#entrar",
    puedeVerQa: false,
    puedeAdministrar: false,
  })
  .registrar("tester", {
    etiqueta: "Tester QA",
    rutaAcceso: "#tester",
    puedeVerQa: true,
    puedeAdministrar: false,
  })
  .registrar("admin", {
    etiqueta: "Administrador",
    rutaAcceso: "#admin",
    puedeVerQa: true,
    puedeAdministrar: true,
  });
