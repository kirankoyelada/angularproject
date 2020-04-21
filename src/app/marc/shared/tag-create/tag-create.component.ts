import { Component, Inject, ElementRef, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
declare var $: any;

@Component({
    selector: "tag-create",
    templateUrl: "./tag-create.component.html",
    styleUrls: ['./tag-create.component.css']
  })
  export class TagCreateComponent {
    @ViewChild('scanInput') private scanInput: ElementRef;
    subField: string = 'a'
    scanData: string;
    dataList: string[] = [];

    constructor(
        private dialogRef: MatDialogRef<TagCreateComponent>,
        @Inject(MAT_DIALOG_DATA) private data: any) {
        if(data){
            this.subField = data;
        }
    }
    
    ngAfterViewInit(){        
        this.scanInput.nativeElement.focus();
    }
    add(){
        if (this.scanData) {
            this.dataList.push(this.scanData);
            this.scanData = '';
            setTimeout(() => {
                this.scanInput.nativeElement.focus()
                $('.fixedHeaderMatPopupBody').scrollTop($('.fixedHeaderMatPopupBody')[0].scrollHeight - $('.fixedHeaderMatPopupBody')[0].clientHeight);

            }
                , 5);
        }
    }

    deleteScannedData(index){
        this.dataList.splice(index, 1);
    }

    save(){
        this.dialogRef.close(this.dataList.filter(data=> data && this.data.length > 0));
    }

    cancel() {
        this.dialogRef.close();
    }

  }