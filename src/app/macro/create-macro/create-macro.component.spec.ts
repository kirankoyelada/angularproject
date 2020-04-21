import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMacroComponent } from './create-macro.component';

describe('CreateMacroComponent', () => {
  let component: CreateMacroComponent;
  let fixture: ComponentFixture<CreateMacroComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateMacroComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateMacroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
