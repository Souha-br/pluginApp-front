import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineChartWidgetComponent } from './line-chart-widget.component';

describe('LineChartWidgetComponent', () => {
  let component: LineChartWidgetComponent;
  let fixture: ComponentFixture<LineChartWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LineChartWidgetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LineChartWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
