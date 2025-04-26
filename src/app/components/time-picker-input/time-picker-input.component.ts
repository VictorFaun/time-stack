import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { GestureController } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-time-picker-input',
  templateUrl: './time-picker-input.component.html',
  styleUrls: ['./time-picker-input.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class TimePickerInputComponent implements OnInit, AfterViewInit {
  @Input() label: string = '';
  @Input() value: number = 0;
  @Input() max: number = 59;
  @Output() valueChange = new EventEmitter<number>();

  @ViewChild('container', { static: true }) container!: ElementRef;

  private startY: number = 0;
  private startValue: number = 0;

  constructor(
    private gestureCtrl: GestureController,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    const gesture = this.gestureCtrl.create({
      el: this.container.nativeElement,
      threshold: 0,
      gestureName: 'time-picker-swipe',
      onStart: (detail) => {
        this.startY = detail.currentY;
        this.startValue = this.value;
      },
      onMove: (detail) => {
        const deltaY = this.startY - detail.currentY;
        const step = Math.floor(deltaY / 40);
        let newValue = this.startValue + step;

        // Loop around
        if (newValue < 0) newValue = this.max;
        if (newValue > this.max) newValue = 0;

        if (newValue !== this.value) {
          this.value = newValue; // ✅ actualiza el valor directamente
          this.valueChange.emit(this.value); // ✅ emite cambio
          this.cdr.detectChanges(); // ✅ fuerza actualización visual
        }
      }
    });

    gesture.enable();
  }

  getAdjacentNumbers(current: number, count: number): number[] {
    const numbers = [];
    for (let i = -count; i <= count; i++) {
      let num = current + i;
      if (num < 0) num = this.max + 1 + num;
      if (num > this.max) num = num - this.max - 1;
      numbers.push(num);
    }
    return numbers;
  }

  trackByFn(index: number): number {
    return index;
  }

  mathMax(num1: number, num2: number) {
    return num1 > num2 ? num1 : num2;
  }

  mathAbs(num: number) {
    return num < 0 ? -num : num;
  }
  
}
