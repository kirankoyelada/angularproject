import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MarcRecordHistoryComponent } from './marc-record-history.component';

describe('MarcRecordHistoryComponent', () => {
  let component: MarcRecordHistoryComponent;
  let fixture: ComponentFixture<MarcRecordHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MarcRecordHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarcRecordHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
