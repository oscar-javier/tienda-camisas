class RegistroPerfilesAcceso {
  constructor() {
    this.perfiles = new Map();
  }

  registrar(rol, configuracion) {
    this.perfiles.set(rol, {
      rol,
      etiqueta: configuracion.etiqueta,
      puedeVerQa: Boolean(configuracion.puedeVerQa),
      puedeAdministrar: Boolean(configuracion.puedeAdministrar),
      puedeCambiarPerfil: Boolean(configuracion.puedeCambiarPerfil),
    });
    return this;
  }

  obtener(rol) {
    return (
      this.perfiles.get(rol) || {
        rol: "invitado",
        etiqueta: "Invitado",
        puedeVerQa: false,
        puedeAdministrar: false,
        puedeCambiarPerfil: false,
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
    puedeVerQa: false,
    puedeAdministrar: false,
    puedeCambiarPerfil: false,
  })
  .registrar("tester", {
    etiqueta: "Tester QA",
    puedeVerQa: true,
    puedeAdministrar: false,
    puedeCambiarPerfil: true,
  })
  .registrar("admin", {
    etiqueta: "Administrador",
    puedeVerQa: true,
    puedeAdministrar: true,
    puedeCambiarPerfil: true,
  });
