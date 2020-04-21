import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { $ } from 'protractor';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.css']
})

export class ConfirmationDialogComponent {
  buttonOneLabel: string = 'OK';
  buttonTwoVisible = true;
  showCopyMsg: boolean = false;
  title: string = "Success";
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    data.title = data.title == undefined ? 'Success' : data.title;
    if (data.isCancelConfirm) {
      this.buttonTwoVisible = data.buttonTwoVisible === undefined ? true : data.buttonTwoVisible;
      this.buttonOneLabel = data.buttonOneLabel === undefined ? 'OK' : data.buttonOneLabel;
    }
  }


  readContent(): string {
    if (this.data && this.data.message) {
      return this.data.message.replace(/<\/?[^>]+(>|$)/g, "");
    }
    else {
      return '';
    }
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
  ngOnInit() {
    this.showCopyMsg = false;
  }
  copyMessage(err: string) {
    const copyText = document.createElement('textarea');
    copyText.value = err;
    document.body.appendChild(copyText);
    copyText.focus();
    copyText.select();
    document.execCommand('copy');
    document.body.removeChild(copyText);
    this.showCopyMsg = true;
    setTimeout(() => {
      this.showCopyMsg = false;
    }, 3000);
  }

  copyORSValue(orsNumber: string)
  {
    this.showCopyMsg = false;
    const copyText = document.createElement('textarea');
    copyText.value = orsNumber;
    document.body.appendChild(copyText);
    copyText.focus();
    copyText.select();
    document.execCommand('copy');
    document.body.removeChild(copyText);
  }
}
