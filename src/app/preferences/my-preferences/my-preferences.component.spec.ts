import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MyPreferencesComponent } from './my-preferences.component';

describe('MyPreferencesComponent', () => {
  let component: MyPreferencesComponent;
  let fixture: ComponentFixture<MyPreferencesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MyPreferencesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyPreferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
