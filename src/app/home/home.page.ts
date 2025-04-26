import { Component, OnInit, ViewChild } from '@angular/core';
import { IonModal, Platform } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage  implements OnInit{

  ngOnInit() {
    // Cargar los temporizadores desde el localStorage cuando el componente se inicializa
    this.cargarTemporizadores();
  }

  temporizadores: any = []
  @ViewChild('newTimerModal') modal: IonModal | undefined;
  @ViewChild('timersModal') modal2: IonModal | undefined;

  timerName: string = '';

  minutes: number = 0;
  seconds: number = 0;

  indexModal: number = 0;

  error_modal: any = false

  play: any = false

  intervaloActualizador: any;
  inicioTiempo: number = 0;
  intervaloAlarma: any;

  constructor(private platform: Platform) { }

  formatearTiempo(segundos: any) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segundosRestantes = segundos % 60;

    const horasStr = horas.toString().padStart(2, '0');
    const minutosStr = minutos.toString().padStart(2, '0');
    const segundosStr = segundosRestantes.toString().padStart(2, '0');

    if (horas > 0) {
      return `${horasStr} : ${minutosStr} : ${segundosStr}`;
    } else {
      return `${minutosStr} : ${segundosStr}`;
    }
  }
  formatearTiempoMin(segundos: any) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segundosRestantes = segundos % 60;

    const horasStr = horas.toString().padStart(2, '0');
    const minutosStr = minutos.toString().padStart(2, '0');
    const segundosStr = segundosRestantes.toString().padStart(2, '0');

    if (horas > 0) {
      return minutosStr;
    } else {
      return minutosStr;
    }
  }
  formatearTiempoSeg(segundos: any) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segundosRestantes = segundos % 60;

    const horasStr = horas.toString().padStart(2, '0');
    const minutosStr = minutos.toString().padStart(2, '0');
    const segundosStr = segundosRestantes.toString().padStart(2, '0');

    if (horas > 0) {
      return segundosStr;
    } else {
      return segundosStr;
    }
  }

  async presentModal() {
    if (this.modal) {
      this.timerName = '';
      this.minutes = 0;
      this.seconds = 0;

      this.error_modal = false

      await this.modal.present();

      // Aquí se escucha el cierre CADA VEZ
      const { data, role } = await this.modal.onDidDismiss();
      console.log('Modal cerrado con:', { data, role });

      if (role === 'confirm' && data) {
        this.temporizadores.push({
          nombre: data.name,
          tiempo: data.duration
        });
        this.guardarTemporizadores()
      }
    }
  }

  async presentModal2() {
    if (this.modal2) {
      if (this.temporizadores.length == 0) return
      this.indexModal = 0;
      this.temporizadores[0].tiempoAux = this.temporizadores[0].tiempo
      this.iniciarTemporizador(true)


      await this.modal2.present();

      // Aquí se escucha el cierre CADA VEZ
      const { data, role } = await this.modal2.onDidDismiss();
      this.detenerTemporizador()
      console.log('Modal cerrado con:', { data, role });
    }
  }

  iniciarTemporizador(play: any) {

    this.play = play;
    // Guardamos la fecha actual en milisegundos
    this.inicioTiempo = Date.now();

    // Limpiamos si había algún intervalo anterior
    if (this.intervaloActualizador) {
      clearInterval(this.intervaloActualizador);
    }

    // Cada 200ms revisamos si ya pasó 1 segundo real
    this.intervaloActualizador = setInterval(() => {
      if (!this.play) return; // Solo si play es true
      if (this.temporizadores[this.indexModal].tiempoAux <= 0 && !this.alarma && this.temporizadores.length>this.indexModal+1) {
        this.inicioAlarma()
        return;
      }
      if (this.temporizadores[this.indexModal].tiempoAux <= 0 && !this.alarma && !(this.temporizadores.length>this.indexModal+1)) {
        this.closeModal2()
        return;
      }
      if (this.temporizadores[this.indexModal].tiempoAux <= 0) {
        return;
      } // Solo si el tiempo aún es mayor a 0
      const ahora = Date.now();
      const diferencia = (ahora - this.inicioTiempo) / 1000; // Diferencia en segundos

      if (diferencia >= 1) {
        // Restamos 1 segundo al tiempo
        this.temporizadores[this.indexModal].tiempoAux -= 1;
        // Actualizamos inicioTiempo para medir el próximo segundo
        this.inicioTiempo = ahora;
      }
    }, 200);
  }

  detenerTemporizador() {
    this.play = false;
    this.detenerAlarma()
    if (this.intervaloActualizador) {
      clearInterval(this.intervaloActualizador);
      this.intervaloActualizador = null;
    }
  }


  async startTimer() {
    console.log(this.modal)
    if (this.timerName && ((this.minutes * 60) + this.seconds) > 0) {
      // Aquí puedes procesar la creación del temporizador con los datos ingresados

      // Después de crear el temporizador, puedes cerrar el modal
      if (this.modal) {
        this.modal.dismiss({
          name: this.timerName,
          duration: ((this.minutes * 60) + this.seconds)
        }, 'confirm'); // El segundo argumento es el 'role'
      }
    } else {
      this.error_modal = true;
    }
  }

  async closeModal() {
    if (this.modal) {

      await this.modal.dismiss(null, 'cancel');
    }
  }

  async closeModal2() {
    if (this.modal2) {
      await this.modal2.dismiss(null, 'cancel');
      this.detenerTemporizador()
    }
  }
  eliminar(pos: any) {
    this.temporizadores.splice(pos, 1);
    
    this.guardarTemporizadores()
  }

  siguiente() {
    console.log("asda")
    this.detenerAlarma()
    if (this.temporizadores.length > this.indexModal + 1) {
      this.indexModal = this.indexModal + 1
      this.temporizadores[this.indexModal].tiempoAux = this.temporizadores[this.indexModal].tiempo
      this.iniciarTemporizador(this.play)
    }
  }
  anterior() {
    this.detenerAlarma()
    if (0 <= this.indexModal - 1) {
      this.indexModal = this.indexModal - 1
      this.temporizadores[this.indexModal].tiempoAux = this.temporizadores[this.indexModal].tiempo
      this.iniciarTemporizador(this.play)
    }
  }

  alarma: number | false = false;

  inicioAlarma() {
    console.log("ala2");
    
    // Cargar el sonido si no está cargado
    if (!this.alarmaSonido) {
      this.alarmaSonido = new Audio('assets/alarma.mp3'); // Asegúrate de tener este archivo en tus assets
      this.alarmaSonido.load();
    }
  
    // Si ya hay una alarma corriendo, la limpiamos
    if (this.intervaloAlarma) {
      clearInterval(this.intervaloAlarma);
      this.intervaloAlarma = null;
    }
  
    // Seteamos alarma a 5
    this.alarma = 5;
  
    this.reproducirSonido();
    this.vibrarTelefono();
  
    // Creamos el intervalo que baja alarma cada segundo
    this.intervaloAlarma = setInterval(() => {
      console.log("ala");
  
      if (this.alarma) {
        this.alarma -= 1;
  
        if (this.alarma <= 0) {
          // Cuando llega a 0, llamamos a siguiente
          this.siguiente();
          this.detenerAlarma();
        }
      }
    }, 1000);
  }
  
  detenerAlarma() {
    // Función para limpiar todo cuando termina o se cancela la alarma
    if (this.intervaloAlarma) {
      clearInterval(this.intervaloAlarma);
      this.intervaloAlarma = null;
    }
    this.alarma = false;
    if (this.alarmaSonido) {
      this.alarmaSonido.pause();
      this.alarmaSonido.currentTime = 0;
    }
  }
  
  // Nueva función para reproducir sonido
  private reproducirSonido() {
    if (this.alarmaSonido) {
      this.alarmaSonido.currentTime = 0; // Reiniciar el sonido
      this.alarmaSonido.play().catch(err => {
        console.warn('No se pudo reproducir el sonido:', err);
      });
    }
  }
  
  // Nueva función para vibrar
  private vibrarTelefono() {
    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500]); // Vibrar 500ms, pausa 200ms, vibrar 500ms
    }
  }

  private alarmaSonido: HTMLAudioElement | null = null;

  guardarTemporizadores() {
    try {
      const data = JSON.stringify(this.temporizadores);
      localStorage.setItem('temporizadores', data);
      console.log('Temporizadores guardados.');
    } catch (error) {
      console.error('Error al guardar temporizadores:', error);
    }
  }
  
  cargarTemporizadores() {
    try {
      const data = localStorage.getItem('temporizadores');
      if (data) {
        this.temporizadores = JSON.parse(data);
        console.log('Temporizadores cargados.');
      } else {
        console.log('No hay temporizadores guardados.');
      }
    } catch (error) {
      console.error('Error al cargar temporizadores:', error);
    }
  }
}
