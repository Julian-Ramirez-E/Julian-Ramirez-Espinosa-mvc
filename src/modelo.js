/**
 * MODELO · Notas del semestre                                           (PARTE 2 de la guía)
 *
 * SABE: qué es una evaluación, las reglas (pesos, rangos, nota mínima) y cómo se calcula el resumen.
 * NO SABE: que existe una pantalla, el DOM, localStorage, alert()... Por eso se prueba sin navegador.
 *
 * Se comunica con el resto SIN conocerlo: avisa de sus cambios con el patrón Observer (suscribir).
 *
 * Tu trabajo: reemplazar cada "TODO" por código real hasta que `npm run test:modelo` quede en verde.
 * Las reglas exactas y los mensajes de error están en la guía (Parte 2) y en pruebas/modelo.pruebas.js.
 */

export const NOTA_MINIMA = 3.0; // para aprobar
export const NOTA_MAXIMA = 5.0;
export const UMBRAL_RIESGO = 4.0; // si necesitas más que esto en lo que falta, estás "en riesgo"
export const MAX_NOMBRE = 40;

const EPS = 1e-9; // tolerancia para comparar decimales (0.1 + 0.2 no es exactamente 0.3 en un computador)

/** Error de negocio: su mensaje se puede mostrar tal cual al usuario. */
export class ErrorDeReglas extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorDeReglas';
  }
}

/** Ayuda ya escrita: redondea hacia ARRIBA (la nota que "necesitas" nunca debe quedarse corta). */
const redondearArriba = (valor, decimales = 2) => {
  const f = 10 ** decimales;
  return Math.ceil(valor * f - EPS) / f;
};

export class NotasModelo {
  #almacen;
  #evaluaciones;
  #siguienteId;
  #suscriptores = new Set();

  // Ya escrito: recibe el almacén (no sabe cuál es), carga lo guardado y calcula el próximo id.
  constructor(almacen) {
    this.#almacen = almacen;
    this.#evaluaciones = almacen.cargar();
    this.#siguienteId = this.#evaluaciones.reduce((max, e) => Math.max(max, e.id), 0) + 1;
  }

  // Ya escrito: devuelve COPIAS, para que nadie cambie el estado interno saltándose las reglas.
  get evaluaciones() {
    return this.#evaluaciones.map((e) => ({ ...e }));
  }

  // ---------------------------------------------------------------- 2A · Agregar y validar
  agregar({ nombre, peso, nota = null }) {
    if (!nombre || nombre.trim() === '') {
      throw new ErrorDeReglas('El nombre es obligatorio.');
    }
    const nombreLimpio = nombre.trim();

    if (nombreLimpio.length > MAX_NOMBRE) {
      throw new ErrorDeReglas('El nombre no puede superar 40 caracteres.');
    }

    const yaExiste = this.#evaluaciones.some(
      (e) => e.nombre.toLowerCase() === nombreLimpio.toLowerCase()
    );
    if (yaExiste) {
      throw new ErrorDeReglas('Ya existe una evaluación con ese nombre.');
    }

    const p = Number(peso);
    if (isNaN(p) || p < 1 || p > 100) {
      throw new ErrorDeReglas('El peso debe estar entre 1 y 100.');
    }

    let n = null;
    if (nota !== null && nota !== undefined && nota !== '') {
      n = Number(nota);
      if (isNaN(n) || n < 0 || n > NOTA_MAXIMA) {
        throw new ErrorDeReglas('La nota debe estar entre 0 y 5.');
      }
    }

    const pesoTotalActual = this.#evaluaciones.reduce((acc, e) => acc + e.peso, 0);
    if (pesoTotalActual + p > 100) {
      const disponible = 100 - pesoTotalActual;
      throw new ErrorDeReglas(`Los pesos no pueden sumar más de 100 % (te quedan ${disponible} %).`);
    }

    const nueva = {
      id: this.#siguienteId++,
      nombre: nombreLimpio,
      peso: p,
      nota: n
    };

    this.#evaluaciones.push(nueva);
    this.#cambio();
    return nueva;
  }

  // ---------------------------------------------------------------- 2B · Calificar y eliminar
  calificar(id, nota) {
    const evaluacion = this.#evaluaciones.find((e) => e.id === id);
    if (!evaluacion) {
      throw new ErrorDeReglas('No existe la evaluación.');
    }

    if (nota === null || nota === undefined || nota === '') {
      evaluacion.nota = null;
    } else {
      const n = Number(nota);
      if (isNaN(n) || n < 0 || n > NOTA_MAXIMA) {
        throw new ErrorDeReglas('La nota debe estar entre 0 y 5.');
      }
      evaluacion.nota = n;
    }

    this.#cambio();
  }

  eliminar(id) {
    const indice = this.#evaluaciones.findIndex((e) => e.id === id);
    if (indice === -1) {
      throw new ErrorDeReglas('No existe la evaluación.');
    }

    this.#evaluaciones.splice(indice, 1);
    this.#cambio();
  }

  // ---------------------------------------------------------------- 2C · Resumen
  resumen() {
    let acumulado = 0;
    let pesoCalificado = 0;

    for (const e of this.#evaluaciones) {
      if (e.nota !== null) {
        acumulado += (e.peso * e.nota) / 100;
        pesoCalificado += e.peso;
      }
    }

    const pesoPendiente = 100 - pesoCalificado;

    let notaNecesaria = null;
    if (pesoPendiente > 0) {
      const falta = NOTA_MINIMA - acumulado;
      if (falta <= 0) {
        notaNecesaria = 0;
      } else {
        const calculo = (falta * 100) / pesoPendiente;
        notaNecesaria = redondearArriba(calculo, 2);
      }
    }

    let estado = 'en-camino';
    if (acumulado + EPS >= NOTA_MINIMA) {
      estado = 'aprobado';
    } else if (pesoPendiente === 0 || (notaNecesaria !== null && notaNecesaria > NOTA_MAXIMA)) {
      estado = 'imposible';
    } else if (notaNecesaria !== null && notaNecesaria > UMBRAL_RIESGO) {
      estado = 'en-riesgo';
    } else {
      estado = 'en-camino';
    }

    return {
      acumulado: Number(acumulado.toFixed(2)),
      pesoCalificado,
      pesoPendiente,
      notaNecesaria,
      estado
    };
  }

  // ---------------------------------------------------------------- 2D · Observer y persistencia
  suscribir(suscriptor) {
    this.#suscriptores.add(suscriptor);
    return () => {
      this.#suscriptores.delete(suscriptor);
    };
  }

  #cambio() {
    this.#almacen.guardar(this.#evaluaciones);
    for (const suscriptor of Array.from(this.#suscriptores)) {
      suscriptor();
    }
  }
}