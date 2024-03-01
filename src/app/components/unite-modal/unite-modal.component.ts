import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MessageComponent } from '../message/message.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import 'chartjs-plugin-dragdata';
import { HttpClientModule } from '@angular/common/http';
import { ProjectService } from 'src/app/services/project.service';
import { DataService } from 'src/app/services/data-service.service';
/* import { Chart, registerables } from 'node_modules/chart.js';
Chart.register(...registerables); */
declare var bootstrap: any;
declare var Chart: any;
interface Escenario {
  id: any;
  name: string;
  years: { [year: string]: string }[];
  locked: boolean;
}
@Component({
  selector: 'app-unite-modal',
  standalone: true,
  imports: [MessageComponent, FormsModule, CommonModule, HttpClientModule],
  providers: [ProjectService],
  templateUrl: './unite-modal.component.html',
  styleUrl: './unite-modal.component.scss',
})
export class UniteModalComponent implements OnInit {
  @ViewChild('uniteModal') miModal!: ElementRef;

  years: string[] = [];
  @Input() edit: boolean = false;
  escenarysFromDb: any[] = [];
  escenarys: any[] = [];
  model: Escenario = { id: '', name: '', years: [], locked: false };
  showForm: boolean = false;
  selectedEscenary: any = '#';
  renderChartVariable!: any;
  createEscenaryChartVariable!: any;
  yMax: number = 1000;
  escenario: any = [
    { name: 'Escenario 1', yearFrom: 2020, yearTo: 2024 },
    { name: 'Escenario 2', yearFrom: 2020, yearTo: 2024 },
  ];
  @Output() sendEsceneriesEvent = new EventEmitter<any>();
  @Output() printAllEvent = new EventEmitter<any>();
  values!: any;
  @Input() cleanEsceneries: any[] = [];
  yearsToSee: any[] = [];
  @Input() lockedScenary: boolean = false;
  @Input() nodeId!: any;
  deleteEsceneries: boolean = false;
  unite!: any;
  constructor(
    private projectSvc: ProjectService,
    private dataService: DataService,
    private cdRef: ChangeDetectorRef
  ) {}
  ngOnInit(): void {
    this.dataService.data$.subscribe((data) => {
      this.deleteEsceneries = data;
      console.log(data);
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cleanEsceneries']) {
      this.editScenarys();
      console.log('clean change');
    }
    if (changes['edit']) {
      if (!this.edit) {
        /* this.emptyScenarys(); */

        this.editScenarys();
      }
      if (this.edit) {
        this.editScenarys();
      }
      this.createModel();
    }
  }

  ngAfterViewInit() {
    const modal = new bootstrap.Modal(this.miModal.nativeElement);

    modal._element.addEventListener('shown.bs.modal', () => {
      if (!this.edit) {
        console.log(this.years, this.escenarys[0], 'yearsssssss');
      }
    });

    modal._element.addEventListener('hidden.bs.modal', () => {
      if (this.escenarys[+this.selectedEscenary]) {
        this.projectSvc
          .updateScenery(this.escenarys[+this.selectedEscenary].id, {
            years: this.model.years[0],
          })
          .subscribe((res: any) => {
            this.projectSvc.getNode(this.nodeId).subscribe((res: any) => {
              this.escenarys = res.sceneries;
            });

            this.printAllEvent.emit();
          });
      }
      this.showForm = false;
      this.model.locked = false;
      if (this.renderChartVariable) this.renderChartVariable.destroy();
      if (this.createEscenaryChartVariable)
        this.createEscenaryChartVariable.destroy();
      if (!this.edit) {
        this.sendEsceneries();
        this.selectedEscenary = '#';
      } else {
        /*  this.edit = false; */
        this.selectedEscenary = '#';
        /*  this.escenarys = []; */
      }

      const openButton = document.querySelector('#exampleModalButton');

      // Verifica si el botón existe antes de intentar cerrar el modal
      if (openButton) {
        // Simula un clic en el botón para cerrar el modal
        (openButton as HTMLElement).click();
      }
    });
  }
  submitEscenario(escenarioForm: any) {
    const newEscenary = {
      node_id: this.nodeId,
      name: this.model.name,
      years: JSON.parse(JSON.stringify(this.model.years[0])),
      status: this.model.locked === true ? 0 : 1,
    };

    this.projectSvc.saveScenery(newEscenary).subscribe((res: any) => {
      console.log(res);
      this.printAllEvent.emit();
      if (this.edit) {
        this.projectSvc.getNode(this.nodeId).subscribe((res: any) => {
          this.escenarys = res.sceneries;
        });
      }
    });

    this.escenarys.push(newEscenary);
    this.showForm = false;

    console.log(this.escenarys);
    this.createEscenaryChartVariable.destroy();
  }
  addEscenary() {
    this.showForm = !this.showForm;
    this.model.locked = false;
    if (this.showForm) {
      if (this.renderChartVariable) this.renderChartVariable.destroy();
      this.values = undefined;
      this.escenarys = this.cleanEsceneries;
      this.years = [this.escenarys[0].years];
      this.selectedEscenary = '#';
      this.model.name = '';
      this.createModel();

      this.createEscenaryChart();
    } else {
      this.editScenarys();
    }
  }

  createModel() {
    console.log('model');
    const keys = Object.keys(this.escenarys[0].years);

    const years: any = {};
    keys.forEach((clave: string) => {
      var newVal = 0;
      if (localStorage.getItem('uniteVal')) {
        if ((localStorage.getItem('uniteVal') as any).includes('%')) {
          const valueBase = parseFloat(
            (localStorage.getItem('uniteVal') as any).replace('%', '')
          );

          newVal = valueBase / 100;
        } else {
          newVal = parseFloat(localStorage.getItem('uniteVal') as any);
        }
      }
      /* years[clave] = this.unite ? this.unite : (this.edit ? 0 : (localStorage.getItem('uniteVal') ? newVal : 0) ); */
      if (this.unite && this.unite == newVal) {
        years[clave] = this.unite;
      } else {
        years[clave] = newVal ? newVal : 0;
      }
    });

    console.log(years);

    if (this.escenarys[+this.selectedEscenary]) {
      this.model['years'] = [
        this.edit ? this.escenarys[+this.selectedEscenary].years : years,
      ];
      this.model['locked'] =
        this.escenarys[+this.selectedEscenary].status === 0 ? true : false;
      console.log(this.escenarys[+this.selectedEscenary].years, 'run');
    } else {
      this.model['years'] = [years];
    }

    console.log(this.model['years'], 'years');
  }

  renderChart() {
    const years = Object.keys(
      JSON.parse(JSON.stringify(this.escenarys[0].years))
    );

    /*     const values = years.map(
      (key) => +this.escenarys[this.selectedEscenary].years[0][key]
    ); */

    const values = Object.values(this.escenarys[this.selectedEscenary].years);
    console.log(this.escenarys[this.selectedEscenary], 'values');
    if (!this.values) {
      this.values = values;
    }

    const plugins: any =
      this.model.locked === false
        ? {
            dragData: {
              round: 1,
              showTooltip: true,
              onDragStart: function (
                e: any,
                datasetIndex: any,
                index: any,
                value: any
              ) {
                /* console.log(e); */
              },
              onDrag: (e: any, datasetIndex: any, index: any, value: any) => {
                e.target.style.cursor = 'grabbing';
                /* console.log(value); */
                /*                 this.calcularMontoConIncremento();
                this.renderChartVariable.options.scales.y.max = this.yMax; */
                this.renderChartVariable.options.scales.y.max =
                  this.calcularMontoConIncremento() < 1000
                    ? 1000
                    : this.calcularMontoConIncremento();
              },
              onDragEnd: (
                e: any,
                datasetIndex: any,
                index: any,
                value: any
              ) => {
                e.target.style.cursor = 'default';
                this.model.years[0][years[index]] = value;
                this.escenarys[this.selectedEscenary].years =
                  this.model.years[0];
                console.log({
                  years: this.model.years,
                });

                /*           if (this.edit) {
                  this.projectSvc
                    .updateScenery(this.escenarys[+this.selectedEscenary].id, {
                      years: this.model.years[0],
                    })
                    .subscribe((res: any) => {
                      this.projectSvc
                        .getNode(this.nodeId)
                        .subscribe((res: any) => {
                          this.escenarys = res.sceneries;
                        });

                      this.printAllEvent.emit();
                    });
                } */
              },
            },
          }
        : {};

    const option: any = {
      type: 'line',
      data: {
        labels: years,
        datasets: [
          {
            label: '# of Votes',
            data: this.values,
            fill: true,
            tension: 0.4,
            borderWidth: 1,
            pointHitRadius: 25,
          },
        ],
      },
      options: {
        scales: {
          y: {
            min: 0,
            max:
              this.calcularMontoConIncremento() === 0
                ? 1000
                : this.calcularMontoConIncremento(),
          },
        },
        onHover: function (e: any) {
          const point = e.chart.getElementsAtEventForMode(
            e,
            'nearest',
            { intersect: true },
            false
          );
          if (point.length) e.native.target.style.cursor = 'grab';
          else e.native.target.style.cursor = 'default';
        },
        plugins: plugins,
      },
    };
    const escenary = JSON.parse(
      JSON.stringify(this.escenarys[+this.selectedEscenary])
    );
    years.forEach((clave, index) => {
      escenary.years[clave] = this.values[index].toString();
    });

    this.escenarys[+this.selectedEscenary] = escenary;

    console.log(this.escenarys[+this.selectedEscenary].id, 'sl,dlm');

    if (this.edit) {
      this.projectSvc
        .updateScenery(this.escenarys[+this.selectedEscenary].id, {
          years: this.escenarys[+this.selectedEscenary].years,
        })
        .subscribe((res: any) => {
          this.projectSvc.getNode(this.nodeId).subscribe((res: any) => {
            this.escenarys = res.sceneries;
          });
          this.printAllEvent.emit();
        });
    }

    this.renderChartVariable = new Chart('chartJSContainer', option);
    this.calcularMontoConIncremento();
  }
  onSelectChange() {
    if (this.selectedEscenary !== '#') {
      if (this.createEscenaryChartVariable)
        this.createEscenaryChartVariable.destroy();
      if (this.renderChartVariable) {
        this.renderChartVariable.destroy();
      }
      this.model.name = this.escenarys[+this.selectedEscenary].name;
      this.model.years = JSON.parse(
        JSON.stringify([this.escenarys[this.selectedEscenary].years])
      );
      this.values = undefined;
      console.log(this.escenarys, 'ese');
      this.createModel();
      this.renderChart();
      this.calcularMontoConIncremento();
    }
  }

  createEscenaryChart() {
    const years = Object.keys(this.escenarys[0].years);

    if (!this.values)
      this.values = years.map((key) => (this.unite ? this.unite : 0));

    const plugins: any =
      this.model.locked === false
        ? {
            dragData: {
              round: 1,
              showTooltip: true,
              onDragStart: function (
                e: any,
                datasetIndex: any,
                index: any,
                value: any
              ) {
                /* console.log(e); */
              },
              onDrag: (e: any, datasetIndex: any, index: any, value: any) => {
                e.target.style.cursor = 'grabbing';
                /* console.log(value); */

                this.createEscenaryChartVariable.options.scales.y.max =
                  this.calcularMontoConIncremento() < 1000
                    ? 1000
                    : this.calcularMontoConIncremento();
              },
              onDragEnd: (
                e: any,
                datasetIndex: any,
                index: any,
                value: any
              ) => {
                e.target.style.cursor = 'default';
                this.model.years[0][years[index]] = value;
                console.log(this.model);
                console.log(value, datasetIndex, index);
              },
            },
          }
        : {};

    const option: any = {
      type: 'line',
      data: {
        labels: years,
        datasets: [
          {
            label: '# of Votes',
            data: this.values,
            fill: true,
            tension: 0.4,
            borderWidth: 1,
            pointHitRadius: 25,
          },
        ],
      },
      options: {
        scales: {
          y: {
            min: 0,
            max:
              this.calcularMontoConIncremento() === 0
                ? 1000
                : this.calcularMontoConIncremento(),
          },
        },
        onHover: function (e: any) {
          const point = e.chart.getElementsAtEventForMode(
            e,
            'nearest',
            { intersect: true },
            false
          );
          if (point.length) e.native.target.style.cursor = 'grab';
          else e.native.target.style.cursor = 'default';
        },
        plugins: plugins,
      },
    };

    this.createEscenaryChartVariable = new Chart('chartJSContainer', option);
  }
  changeValue(i: number, value: any) {
    this.values[i] = +value;

    this.createEscenaryChartVariable.destroy();
    this.createEscenaryChart();
    console.log(this.escenarys[+this.selectedEscenary].years[0], 'value');
  }
  changeValue2(i: number, value: any, inputId: any) {
    if (value.includes('%')) {
      const valueBase = parseFloat(value.replace('%', ''));

      this.values[i] = +valueBase / 100;

      setTimeout(() => {
        this.model.years[0][inputId.toString()] = (+valueBase / 100).toString();
      }, 250);
    } else {
      this.values[i] = +value;
    }

    this.renderChartVariable.destroy();
    this.renderChart();
  }
  yearKey(year: any): string {
    return Object.keys(year)[0];
  }

  emptyScenarys() {
    const escenario = this.escenario[0];
    const obj: any = {};
    for (let year = escenario.yearFrom; year <= escenario.yearTo; year++) {
      obj[+year] = '0';
    }
    this.yearsToSee.push(obj);
    for (let i = 0; i < this.escenario.length; i++) {
      const element = this.escenario[i];
      this.escenarys.push({ name: element.name, years: this.yearsToSee });
    }
    this.years = this.escenarys[0].years;
  }

  editScenarys() {
    /*     const escenario = this.escenario[0];
    const obj: any = {};
    for (let year = escenario.yearFrom; year <= escenario.yearTo; year++) {
      obj[+year] = '0';
    }
    this.yearsToSee.push(obj);
    for (let i = 0; i < this.escenario.length; i++) {
      const element = this.escenario[i];
      this.escenarys.push({ name: element.name, years: this.yearsToSee });
    } */

    console.log(this.cleanEsceneries, 'CLEAMD');

    if (this.edit) {
      this.projectSvc.getNode(this.nodeId).subscribe((res: any) => {
        this.escenarys = res.sceneries;
        this.unite = res.unite;
        this.years = [this.escenarys[0].years];

        console.log(this.escenarys[0].years, 'años edit');
      });
    } else {
      this.unite = null;
      this.escenarys = this.cleanEsceneries;
      this.years = [this.escenarys[0].years];
    }
  }
  changeLocked() {
    console.log(this.escenarys[+this.selectedEscenary].id);
    this.projectSvc
      .updateScenery(this.escenarys[+this.selectedEscenary].id, {
        years: this.model.years[0],
        status: this.model.locked ? 0 : 1,
      })
      .subscribe((res: any) => {
        console.log(res, 'res');
      });
    if (this.renderChartVariable) {
      this.renderChartVariable.destroy();
      this.renderChart();
    }
    if (this.createEscenaryChartVariable) {
      this.createEscenaryChartVariable.destroy();
      this.createEscenaryChart();
    }

    /*     this.createEscenaryChartVariable.destroy();
    this.createEscenaryChart(); */
  }

  lockedScenarys() {
    this.renderChartVariable.destroy();
    this.renderChart();
  }

  sendEsceneries() {
    this.sendEsceneriesEvent.emit(this.escenarys);
  }
  onInputFocus(event: any) {
    // Puedes realizar acciones cuando el input obtiene el foco, si es necesario
  }

  onInputBlur(event: any) {
    // Puedes realizar acciones cuando el input pierde el foco
    // Además, puedes volver a enfocar el input si es necesario
    event.target.focus();
  }
  forceFocus(id: string) {
    document.getElementById(id)?.focus();
  }
  trackByFn(index: any, item: any) {
    return index;
  }

  calcularMontoConIncremento() {
    // Filtrar solo las cantidades que son números

    if (this.values) {
      // Filtrar y convertir a números
      console.log(this.values, 'VALUES');
      const cantidadesNumeros: number[] = this.values.map((cantidad: any) =>
        typeof cantidad === 'string'
          ? parseFloat(cantidad)
          : (cantidad as number)
      );

      // Encontrar la cantidad más alta
      const cantidadMaxima: number | undefined = Math.max(...cantidadesNumeros);

      if (cantidadMaxima !== undefined) {
        // Calcular el 20% de la cantidad más alta
        const incremento: number = cantidadMaxima * 0.2;

        // Sumar el 20% a la cantidad más alta
        const resultado: number = cantidadMaxima + incremento;
        this.yMax = resultado;
        if (this.renderChartVariable) {
          this.renderChartVariable.options.scales.y.max =
            this.yMax === 0 ? 1000 : this.yMax;
        }

        if (this.createEscenaryChartVariable) {
          this.createEscenaryChartVariable.options.scales.y.max = 1000;
        }

        console.log(resultado, this.values, 'resultado');
        return resultado;
      } else {
        // Manejar el caso en que no haya cantidades válidas
        throw new Error('No hay cantidades válidas para calcular.');
      }
    } else {
      return 1000;
    }
  }
  onKeyDown(event: KeyboardEvent): void {
    const allowedChars = /[0-9%.]/;

    if (!allowedChars.test(event.key) && event.key !== 'Backspace') {
      event.preventDefault();
    }
  }
}
