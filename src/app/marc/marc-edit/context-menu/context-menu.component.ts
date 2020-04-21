import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatSelect } from '@angular/material';

@Component({
  selector: 'app-context-menu',
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.css']
})
export class ContextMenuComponent implements OnInit {
  @ViewChild('mySelect') mySelect: MatSelect;
  constructor( private cdr: ChangeDetectorRef,) { }
  @Output() onDataSelected: EventEmitter<any> = new EventEmitter<any>();
  @Input() filteredSubFields : any = [];;
  @Input() x=0;
  @Input() y=0;
  selectedData: string;

  ngOnInit(){
    
  }

  ngAfterViewInit() {
    this.mySelect.open();
     this.cdr.detectChanges();
  }
  

  public valueSelected(): void {
    this.onDataSelected.emit(this.selectedData);
}

}
