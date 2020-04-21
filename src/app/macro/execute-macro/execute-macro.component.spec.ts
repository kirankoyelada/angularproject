import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExecuteMacroComponent } from './execute-macro.component';

describe('ExecuteMacroComponent', () => {
  let component: ExecuteMacroComponent;
  let fixture: ComponentFixture<ExecuteMacroComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExecuteMacroComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExecuteMacroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
