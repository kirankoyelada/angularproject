import { Component } from '@angular/core';
import { SpinnerService } from 'src/app/shared/interceptor/spinner.service';

import * as $ from 'jquery';
import { MacroService } from '../shared/service/macro.service';
import { MatDialog } from '@angular/material';
import { ConfirmationDialogComponent } from 'src/app/components/shared/confirmation-dialog/confirmation-dialog.component';
@Component({
    selector: "macro-admin",
    templateUrl: "./macro-admin.component.html"
})
export class MacroAdminComponent {
    createMacro: boolean = true;
    customerOnly: boolean = false;
    displayWarnMessage: false;
    cWidowHeight: number;
    cHeaderHeight: number;
    cSearchHeight: number;
    cNavHeight: number;
    headerHeight: number;
    newHeight: number;
    newMacroHeight: number;
    newMacrolistHeight: number;
    pythonCacheWarning:string = "<br/><font color='red'>Warning: Python Cache could not be cleared successfully. Please inform the IT Team to restart the Python API for changes to take effect.</font>"

    fileData: File = null;
    constructor(private spinnerService: SpinnerService,
        private macroService: MacroService,
        private dialog: MatDialog) {

    }

    // set the page height dynamically based on resizing the screen
    customHeightFunction() {
        this.cWidowHeight = $(window).height();
        this.cHeaderHeight = $('app-header nav').height();
        this.cSearchHeight = $('app-search-box .search_filter').height();
        this.cNavHeight = $('.mainNavSection').height();
        this.headerHeight =
        this.cHeaderHeight + this.cSearchHeight + this.cNavHeight;
        this.newHeight = this.cWidowHeight - this.headerHeight;
        this.newHeight = this.newHeight - 100;
        this.newMacroHeight = this.newHeight - 32;
        this.newMacrolistHeight = this.newHeight - 170;
    }

    ngAfterViewChecked() {
        // set the page hight based on the expand and collapse search icon.
        this.customHeightFunction();

        $(window).resize(() => {
            this.customHeightFunction();
        });
    }


    onChange(fileInput: any) {
        this.displayWarnMessage = false;
        this.fileData = <File>fileInput[0];
        var ext = this.fileData.name.substr(this.fileData.name.lastIndexOf('.') + 1);
        $('.custom-file-label').html(this.fileData.name);
        if (ext != 'py') {
            alert('Invalid file format. Please upload only .py file.');
            this.fileData = null;
            $('.custom-file-label').html('Browse');
        }
    }

    saveMacro() {
        this.spinnerService.spinnerStart();
        const formData = new FormData();
        if (this.fileData) {
            formData.append('pythonFile', this.fileData, this.fileData.name);
        }
        if (this.createMacro) {
            this.macroService.createMacro(formData, this.customerOnly).subscribe((data) => {
                this.spinnerService.spinnerStop();
                if (data) {        
                    let postSaveMessage = "The macro(s) defined in <strong>" + this.fileData.name + "</strong> have been created successfully.<br/> Count: " + data.macroCount;
                    if(data.displayPythonCacheWarning){
                        postSaveMessage += this.pythonCacheWarning;
                    }
                    this.postSaveOperation(postSaveMessage);
                }
            },
                (error) => {
                    console.log(error);
                    this.spinnerService.spinnerStop();                    
                    let errorMessage = `Error Code: ${error.status}\nMessage: ${error.error.Message}`;
                    this.alert(errorMessage);
                });
        }
        else {
            this.macroService.replaceMacro(formData).subscribe((data) => {
                this.spinnerService.spinnerStop();
                if (data) {
                    let postSaveMessage = "The script <strong>" + this.fileData.name +"</strong> has been uploaded successfully.";
                    if(data.displayPythonCacheWarning){
                        postSaveMessage += this.pythonCacheWarning;
                    }
                    this.postSaveOperation(postSaveMessage);
                }
            },
                (error) => {
                    console.log(error);
                    this.spinnerService.spinnerStop();
                    let errorMessage = `Error Code: ${error.status}\nMessage: ${error.error.Message}`;
                    this.alert(errorMessage);
                });
        }
    }

    postSaveOperation(message: string) {
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
            width: "500px",
            height: "auto",
            disableClose: true,
            data: {
                isCopyErrorMsg: false,
                isCancelConfirm: false,
                message: message
            }
        });
        dialogRef.afterClosed().subscribe(() => {
            this.fileData = null;
            $('.custom-file-label').html('Browse');
        });

    }

    cancel() {
        this.fileData = null;
        this.createMacro = true;
        this.customerOnly = false;  
        $('.custom-file-label').html('Browse');
    }

    onModeChange(){
        this.fileData = null;
        this.customerOnly = false;
        $('.custom-file-label').html('Browse');
    }


    openFileUpload() {
        $('#fileUpload').click();
    }

    
  alert(message: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: message && message.length > 200 ? '500px' : '300px',
      height: 'auto',
      disableClose: true,
      data: {
        isCancelConfirm: false,
        isCopyErrorMsg: false,
        message: message,
        title: 'Error'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

}