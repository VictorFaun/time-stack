import { Component, OnInit, ViewChild } from '@angular/core';
import { IonModal, Platform } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  // #region Propiedades

  // Array para almacenar los temporizadores creados por el usuario
  temporizadores: any = [];

  // Referencias a los componentes IonModal en la plantilla HTML
  @ViewChild('newTimerModal') newTimerModal: IonModal | undefined; // Modal para crear un nuevo temporizador
  @ViewChild('timersModal') runningTimersModal: IonModal | undefined; // Modal para mostrar los temporizadores en ejecución

  // Variables para el formulario de creación de un nuevo temporizador
  timerName: string = '';
  minutes: number = 0;
  seconds: number = 0;

  // Índice del temporizador actual que se está mostrando en el modal de ejecución
  indexModal: number = 0;

  // Bandera para mostrar errores en el modal de nuevo temporizador
  error_modal: boolean = false;

  // Bandera para controlar si el temporizador actual está en ejecución
  play: boolean = false;

  // Variables para la lógica del temporizador en ejecución
  intervaloActualizador: any; // Intervalo para actualizar la visualización del tiempo
  inicioTiempo: number = 0; // Marca de tiempo del inicio del temporizador
  intervaloAlarma: any; // Intervalo para controlar la alarma

  // Variable para controlar el estado y la duración de la alarma (false si no hay alarma)
  alarma: number | false = false;

  // Objeto de audio para reproducir el sonido de la alarma
  private alarmaSonido: HTMLAudioElement | null = null;

  // #endregion

  constructor(private platform: Platform) {}

  // Método que se ejecuta al inicializar el componente
  ngOnInit() {
    this.cargarTemporizadores(); // Cargar los temporizadores guardados desde el almacenamiento local
  }

  // #region Métodos de Formateo de Tiempo

  // Formatea el tiempo en segundos a un formato HH:MM:SS o MM:SS
  formatearTiempo(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segundosRestantes = segundos % 60;

    const horasStr = horas.toString().padStart(2, '0');
    const minutosStr = minutos.toString().padStart(2, '0');
    const segundosStr = segundosRestantes.toString().padStart(2, '0');

    return horas > 0 ? `${horasStr} : ${minutosStr} : ${segundosStr}` : `${minutosStr} : ${segundosStr}`;
  }

  // Formatea el tiempo en segundos para mostrar solo los minutos (con formato de dos dígitos)
  formatearTiempoMin(segundos: number): string {
    const minutos = Math.floor((segundos % 3600) / 60);
    return minutos.toString().padStart(2, '0');
  }

  // Formatea el tiempo en segundos para mostrar solo los segundos (con formato de dos dígitos)
  formatearTiempoSeg(segundos: number): string {
    const segundosRestantes = segundos % 60;
    return segundosRestantes.toString().padStart(2, '0');
  }

  // #endregion

  // #region Métodos del Modal de Nuevo Temporizador

  // Presenta el modal para crear un nuevo temporizador
  async presentModal() {
    if (this.newTimerModal) {
      // Reiniciar los valores del formulario
      this.timerName = '';
      this.minutes = 0;
      this.seconds = 0;
      this.error_modal = false;

      await this.newTimerModal.present();

      // Escuchar el evento de cierre del modal
      const { data, role } = await this.newTimerModal.onDidDismiss();
      console.log('Modal de nuevo temporizador cerrado con:', { data, role });

      // Si el usuario confirma y hay datos, agregar el nuevo temporizador
      if (role === 'confirm' && data) {
        this.temporizadores.push({
          nombre: data.name,
          tiempo: data.duration,
          tiempoAux: data.duration, // Inicializar el tiempo auxiliar para el conteo
        });
        this.guardarTemporizadores(); // Guardar la lista de temporizadores
      }
    }
  }

  // Cierra el modal de nuevo temporizador
  async closeModal() {
    if (this.newTimerModal) {
      await this.newTimerModal.dismiss(null, 'cancel');
    }
  }

  // Inicia el proceso de creación y guardado de un nuevo temporizador
  async startTimer() {
    // Validar que se haya ingresado un nombre y un tiempo mayor a cero
    if (this.timerName && (this.minutes * 60 + this.seconds) > 0) {
      // Cerrar el modal y pasar los datos del nuevo temporizador
      if (this.newTimerModal) {
        this.newTimerModal.dismiss(
          {
            name: this.timerName,
            duration: this.minutes * 60 + this.seconds,
          },
          'confirm'
        );
      }
    } else {
      this.error_modal = true; // Mostrar error si no se cumplen las validaciones
    }
  }

  // #endregion

  // #region Métodos del Modal de Temporizadores en Ejecución

  // Presenta el modal para mostrar y controlar los temporizadores en ejecución
  async presentModal2() {
    if (this.runningTimersModal) {
      // Si no hay temporizadores, no hacer nada
      if (this.temporizadores.length === 0) return;

      this.indexModal = 0; // Iniciar con el primer temporizador
      this.temporizadores[0].tiempoAux = this.temporizadores[0].tiempo; // Inicializar el tiempo auxiliar
      this.iniciarTemporizador(true); // Iniciar el temporizador automáticamente al abrir el modal

      await this.runningTimersModal.present();

      // Escuchar el evento de cierre del modal
      const { data, role } = await this.runningTimersModal.onDidDismiss();
      this.detenerTemporizador(); // Detener el temporizador al cerrar el modal
      console.log('Modal de temporizadores en ejecución cerrado con:', { data, role });
    }
  }

  // Cierra el modal de temporizadores en ejecución
  async closeModal2() {
    if (this.runningTimersModal) {
      await this.runningTimersModal.dismiss(null, 'cancel');
      this.detenerTemporizador(); // Asegurarse de detener el temporizador al cerrar
    }
  }

  // #endregion

  // #region Lógica del Temporizador

  // Inicia o reanuda el temporizador actual
  iniciarTemporizador(play: boolean) {
    this.play = play;
    this.inicioTiempo = Date.now(); // Guardar el tiempo de inicio

    // Limpiar cualquier intervalo anterior para evitar conflictos
    if (this.intervaloActualizador) {
      clearInterval(this.intervaloActualizador);
    }

    // Establecer un intervalo para actualizar el tiempo cada 200ms
    this.intervaloActualizador = setInterval(() => {
      if (!this.play) return; // No actualizar si el temporizador está pausado

      const tiempoAuxActual = this.temporizadores[this.indexModal]?.tiempoAux;

      // Verificar si el tiempo ha llegado a cero y si no hay una alarma activa
      if (tiempoAuxActual <= 0 && !this.alarma) {
        // Si hay más temporizadores en la lista, iniciar la alarma
        if (this.temporizadores.length > this.indexModal + 1) {
          this.inicioAlarma();
          return;
        } else {
          // Si es el último temporizador, cerrar el modal
          this.closeModal2();
          return;
        }
      }

      // Si el tiempo aún es mayor a cero, calcular la diferencia
      if (tiempoAuxActual > 0) {
        const ahora = Date.now();
        const diferencia = (ahora - this.inicioTiempo) / 1000; // Diferencia en segundos

        // Si ha pasado al menos 1 segundo real
        if (diferencia >= 1) {
          this.temporizadores[this.indexModal].tiempoAux -= 1; // Decrementar el tiempo restante
          this.inicioTiempo = ahora; // Actualizar el tiempo de inicio para el próximo segundo
        }
      }
    }, 200);
  }

  // Detiene el temporizador actual
  detenerTemporizador() {
    this.play = false;
    this.detenerAlarma(); // Detener cualquier alarma activa
    if (this.intervaloActualizador) {
      clearInterval(this.intervaloActualizador);
      this.intervaloActualizador = null;
    }
  }

  // #endregion

  // #region Control de la Lista de Temporizadores

  // Elimina un temporizador de la lista
  eliminar(pos: number) {
    this.temporizadores.splice(pos, 1);
    this.guardarTemporizadores(); // Guardar la lista actualizada
  }

  // Muestra el siguiente temporizador en el modal de ejecución
  siguiente() {
    this.detenerAlarma(); // Detener la alarma antes de pasar al siguiente
    if (this.temporizadores.length > this.indexModal + 1) {
      this.indexModal++;
      this.temporizadores[this.indexModal].tiempoAux = this.temporizadores[this.indexModal].tiempo; // Reiniciar el tiempo auxiliar
      this.iniciarTemporizador(this.play); // Continuar o iniciar el temporizador
    }
  }

  // Muestra el temporizador anterior en el modal de ejecución
  anterior() {
    this.detenerAlarma(); // Detener la alarma antes de pasar al anterior
    if (this.indexModal > 0) {
      this.indexModal--;
      this.temporizadores[this.indexModal].tiempoAux = this.temporizadores[this.indexModal].tiempo; // Reiniciar el tiempo auxiliar
      this.iniciarTemporizador(this.play); // Continuar o iniciar el temporizador
    }
  }

  // #endregion

  // #region Lógica de la Alarma

  // Inicia la secuencia de la alarma
  inicioAlarma() {
    console.log('Alarma activada');

    // Cargar el sonido de la alarma si no está cargado
    if (!this.alarmaSonido) {
      this.alarmaSonido = new Audio('assets/alarma.mp3'); // Asegúrate de tener el archivo en la ruta correcta
      this.alarmaSonido.load();
    }

    // Limpiar cualquier intervalo de alarma anterior
    if (this.intervaloAlarma) {
      clearInterval(this.intervaloAlarma);
      this.intervaloAlarma = null;
    }

    this.alarma = 5; // Establecer la duración de la alarma en segundos

    this.reproducirSonido();

    // Intervalo para decrementar el tiempo de la alarma cada segundo
    this.intervaloAlarma = setInterval(() => {
      console.log('Tiempo de alarma restante:', this.alarma);
      if (this.alarma) {
        this.alarma--;
        if (this.alarma <= 0) {
          this.siguiente(); // Pasar al siguiente temporizador al finalizar la alarma
          this.detenerAlarma(); // Detener la alarma
        }
      }
    }, 1000);
  }

  // Detiene la alarma
  detenerAlarma() {
    if (this.intervaloAlarma) {
      clearInterval(this.intervaloAlarma);
      this.intervaloAlarma = null;
    }
    this.alarma = false;
    if (this.alarmaSonido) {
      this.alarmaSonido.pause();
      this.alarmaSonido.currentTime = 0; // Reiniciar la posición del sonido
    }
  }

  // Reproduce el sonido de la alarma
  private reproducirSonido() {
    if (this.alarmaSonido) {
      this.alarmaSonido.currentTime = 0; // Reiniciar el sonido
      this.alarmaSonido.play().catch((err) => {
        console.warn('Error al reproducir el sonido de la alarma:', err);
      });
    }
  }

  // #endregion

  // #region Almacenamiento Local

  // Guarda la lista de temporizadores en el almacenamiento local
  guardarTemporizadores() {
    try {
      const data = JSON.stringify(this.temporizadores);
      localStorage.setItem('temporizadores', data);
      console.log('Temporizadores guardados en el localStorage.');
    } catch (error) {
      console.error('Error al guardar los temporizadores:', error);
    }
  }

  // Carga la lista de temporizadores desde el almacenamiento local
  cargarTemporizadores() {
    try {
      const data = localStorage.getItem('temporizadores');
      if (data) {
        this.temporizadores = JSON.parse(data);
        console.log('Temporizadores cargados desde el localStorage.');
      } else {
        console.log('No se encontraron temporizadores en el localStorage.');
      }
    } catch (error) {
      console.error('Error al cargar los temporizadores:', error);
    }
  }

  // #endregion
}