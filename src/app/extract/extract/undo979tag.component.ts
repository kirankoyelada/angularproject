import { Component, ViewChild, ElementRef, OnInit, Inject } from "@angular/core";
import { isObject } from 'util';
import { Customers, Customer } from 'src/app/customer/shared/customer';
import { SpinnerService } from 'src/app/shared/interceptor/spinner.service';
import { ExtractService } from './extract.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ConfirmationDialogComponent } from 'src/app/components/shared/confirmation-dialog/confirmation-dialog.component';
import { Router } from '@angular/router';
const moment = require('moment-timezone');

@Component({
    selector: "app-undo979tag",
    templateUrl: "./undo979tag.component.html"
})
export class Undo979Tag implements OnInit {

    @ViewChild('undostart') undoStartDateCtrl: ElementRef;

    searchCustomerUndo: any;
    customers: Customers[];
    isvalidUndoCustomer: boolean = false;
    isvalidUndoCustomerRequired: boolean = false;
    public maxDateTime: Date = moment.tz(Date.now(), 'America/New_York');
    undoStartDate: Date = null;
    isvalidUndoStartDateRequired: boolean = false;

    constructor(
        private spinnerService: SpinnerService,
        private extractService: ExtractService,
        private dialog: MatDialog,
        private router: Router,
        public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
    }

    ngOnInit() {
        console.log(this.data.lCustomers);
        this.customers = this.data.lCustomers;
        this.setESTTime();
    }

    onNoClick(): void {
        this.clearUndo979TagDialog();
        this.dialogRef.close();
    }

    cancel() {
        this.clearUndo979TagDialog();
        this.dialogRef.close();
    }

    setESTTime() {
        var est = moment.tz(Date.now(), 'America/New_York');
        var month = est.format('MM');
        var day = est.format('DD');
        var year = est.format('YYYY');
        var hour = est.format('HH');
        var minutes = est.format('mm');
        this.maxDateTime = new Date(Number(year), (Number(month) - 1), Number(day), Number(hour), Number(minutes));
    }

    findCustomerUndo() {
        if (
            this.searchCustomerUndo != undefined &&
            this.searchCustomerUndo != "" &&
            this.searchCustomerUndo != "Customer not found"
        ) {

            if (!isObject(this.searchCustomerUndo)) {
                let findCustomer = this.customers.find(x => {
                    if (x.customerName) {
                        let customerName = x.customerName;
                        return (
                            customerName.toLowerCase() === this.searchCustomerUndo.toLowerCase()
                        );
                    }
                });
            }
        }
    }

    displayFnUndo(customer: Customer): string {
        let customerDisplayName = "";
        if (customer && customer.customerName) {
            customerDisplayName = customer.customerName;
        } else {
            customerDisplayName = customer ? customer.customerId : "";
        }
        return customerDisplayName;
    }

    validateUpdateUndoCustomerName(enteredText: any) {
        if (enteredText) {
            this.isvalidUndoCustomer = true;
            this.isvalidUndoCustomerRequired = false;
            this.removeAriaDescribedByAttribute('undo979TagCustomer');
        }
        else {
            this.isvalidUndoCustomer = false;
            this.isvalidUndoCustomerRequired = true;
        }
    }

    pickerUndoStartDateOpen() {
        if (this.undoStartDate) {
            var est = moment.tz(Date.now(), 'America/New_York');
            var month = est.format('MM');
            var day = est.format('DD');
            var year = est.format('YYYY');
            this.undoStartDate = new Date(Number(year), (Number(month) - 1), Number(day));
        }
    }

    pickerUndoStartDateClosed() {
        if (this.undoStartDateCtrl && this.undoStartDateCtrl.nativeElement) {
            this.undoStartDateCtrl.nativeElement.focus();
        }
        if (!this.undoStartDate) {
            this.isvalidUndoStartDateRequired = true;
        }
        else {
            this.isvalidUndoStartDateRequired = false;
            this.removeAriaDescribedByAttribute('startDateTimeUndo');
        }
    }

    enableUndoExecute() {
        if (this.undoStartDate && this.isvalidUndoCustomer) {
            return false;
        }
        else {
            return true;
        }
    }

    executeUndo979() {
        var undoStartDate = moment(this.undoStartDate).format('YYYYMMDD');
        this.spinnerService.spinnerStart();
        this.extractService.undo979TagOCLCExtract(this.searchCustomerUndo.id, undoStartDate).subscribe((result) => {
            this.spinnerService.spinnerStop();
            const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
                width: "500px",
                height: "auto",
                disableClose: true,
                data: {
                    title: 'Notification',
                    isCopyErrorMsg: false,
                    isCancelConfirm: false,
                    message: result.Message
                }
            });
            dialogRef.afterClosed().subscribe(() => {
                this.dialogRef.close();
            });
        },
            error => {
                if (error.status == 403) {
                    this.spinnerService.spinnerStop();
                    this.dialogRef.close();
                    alert(error.statusText);
                    this.router.navigate(["/unauthorized"]);
                } else {
                    this.spinnerService.spinnerStop();
                    this.dialogRef.close();
                    throw error;
                }
            });
    }

    clearUndo979TagDialog() {
        this.undoStartDate = null;
        this.searchCustomerUndo = "";
        this.isvalidUndoCustomerRequired = false;
        this.isvalidUndoCustomer = false;
    }

    removeAriaDescribedByAttribute(elementId:string){
        document.getElementById(elementId).removeAttribute('aria-describedby');
      }
}