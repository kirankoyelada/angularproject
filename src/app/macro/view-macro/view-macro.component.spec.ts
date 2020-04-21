import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewMacroComponent } from './view-macro.component';

describe('ViewMacroComponent', () => {
  let component: ViewMacroComponent;
  let fixture: ComponentFixture<ViewMacroComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewMacroComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewMacroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
