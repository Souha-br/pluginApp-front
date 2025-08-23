import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketListWidgetComponent } from './ticket-list-widget.component';

describe('TicketListWidgetComponent', () => {
  let component: TicketListWidgetComponent;
  let fixture: ComponentFixture<TicketListWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TicketListWidgetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TicketListWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
