import { Component, OnInit, ElementRef, ViewChild, ViewChildren, QueryList } from "@angular/core";
import { SpinnerService } from 'src/app/shared/interceptor/spinner.service';
import { CLSExtractOrderProcessLog, Customers, CustomerAccount, NOSProcessLog } from 'src/app/customer/shared/customer';
import { ExtractService } from './extract.service';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { CustomerService } from 'src/app/customer/shared/services/customer.service';
import { SubSink } from 'subsink';
import { NgForm } from '@angular/forms';
import { MatAutocompleteTrigger, _countGroupLabelsBeforeOption, _getOptionScrollPosition, AUTOCOMPLETE_PANEL_HEIGHT, MatDialog } from '@angular/material';
import { ConfirmationDialogComponent } from 'src/app/components/shared/confirmation-dialog/confirmation-dialog.component';
const moment = require('moment-timezone');
import { Location } from "@angular/common";
import { CommonService } from 'src/app/shared/service/common.service';
declare var $: any;

@Component({
    selector: 'app-viewlogs',
    templateUrl: './viewlogs.component.html'
})
export class ViewLogsComponent implements OnInit {

    @ViewChild("form") form: NgForm;
    @ViewChild('orderStartDt') orderStartDateCtrl: ElementRef;
    @ViewChild('orderEndDt') orderEndDateCtrl: ElementRef;
    @ViewChild('nosStartDt') nosStartDateCtrl: ElementRef;
    @ViewChild('nosEndDt') nosEndDateCtrl: ElementRef;
    @ViewChildren(MatAutocompleteTrigger, { read: MatAutocompleteTrigger }) matAutocompleteTrigger: QueryList<MatAutocompleteTrigger>;

    clsExtractOrderProcessLog = new CLSExtractOrderProcessLog();
    extarctedOrderProcessLogs: CLSExtractOrderProcessLog[] = [];
    orderStartDate: Date;
    orderEndDate: Date;
    searchCustomer: any = null;
    selectedCustomer: any = null;
    private subs = new SubSink();
    customers: Customers[];
    public maxDateTime: Date = moment.tz(Date.now(), 'America/New_York');
    generatedType: boolean = true;
    orderProcessLogTable: boolean = false;
    orderEndDateError: boolean = false;
    orderStartDateError: boolean = false;
    orderEndDateTooltip: string = '';
    orderStartDateTooltip: string = '';
    displayWarnMessage: boolean = false;
    accountNumberError: boolean = false;
    accountNumberTooltip: string = '';
    orderATSNumberError: boolean = false;
    orderATSNumberTooltip: string = '';
    nosProcessLog = new NOSProcessLog();
    extratcedNOSProcessLog: NOSProcessLog[] = [];
    nosStartDate: Date;
    nosEndDate: Date;
    nosStartDateError: boolean = false;
    nosStartDateTooltip: string = '';
    nosEndDateError: boolean = false;
    nosEndDateTooltip: string = '';
    nosProcessLogTable: boolean = false;
    nosATSNumberError: boolean = false;
    nosATSNumberTooltip: string = '';
    institutionId: string ='';
    institutes: any[] = [];
    // Search Split Issue fix
    CWidowHeight: number;
    CHeaderHeight: number;
    CNavHeight: number;
    HeaderHeight: number;
    NewHeight: number;
    CSearchHeight: number;
    CompareBtn: number;
    constructor(
        private spinnerService: SpinnerService,
        private extractService: ExtractService,
        private _titleService: Title,
        private router: Router,
        private cutomerService: CustomerService,
        private location: Location,
        private dialog: MatDialog,
        private commonService: CommonService
    ) { }

    ngOnInit() {
        this._titleService.setTitle('BTCAT | View Logs');
        // this.clsExtractOrderProcessLog.generatedType = "Manual";
        this.commonService.getActiveInstitutions().subscribe(result =>{
            if(result){
              this.institutes = result;
              this.institutionId = this.institutes.find(x=>x.displayName == 'B&T').id;
              this.getCustomersByInstitute(this.institutionId);
            }
            });
        // this.getAllCustomers();
        this.setESTTime();
    }

    ngAfterViewInit(): void {
        this.subs.sink = this.matAutocompleteTrigger.changes.subscribe(trigger => {
            trigger.toArray().map(item => {
                // set default scroll position to 0
                item.autocomplete._setScrollTop(0);
                item._scrollToOption = () => {
                    const index: number =
                        item.autocomplete._keyManager.activeItemIndex || 0;
                    const labelCount = _countGroupLabelsBeforeOption(
                        index,
                        item.autocomplete.options,
                        item.autocomplete.optionGroups
                    );
                    // tslint:disable-next-line: max-line-length
                    const newScrollPosition = _getOptionScrollPosition(
                        index,
                        25,
                        item.autocomplete._getScrollTop(),
                        AUTOCOMPLETE_PANEL_HEIGHT
                    );
                    item.autocomplete._setScrollTop(newScrollPosition);
                };
            });
        });
    }

    /* search split fix function - var values */
    customHeightFunction() {
        this.CWidowHeight = $(window).height();
        this.CHeaderHeight = $('app-header nav').height();
        this.CSearchHeight = $('.search_filter').height();
        this.CNavHeight = $('.mainNavSection').height();
        this.CompareBtn = $('header.tableHeaderCounts').height();
        this.HeaderHeight =
            this.CHeaderHeight +
            this.CSearchHeight +
            this.CNavHeight +
            this.CompareBtn;
        this.NewHeight = this.CWidowHeight - this.HeaderHeight;
        this.NewHeight = this.NewHeight - 95;
    }

    // multiple marc view methods -- End
    ngAfterViewChecked() {
        /* search split fix function  */
        this.customHeightFunction();
        $(window).resize(e => {
            this.customHeightFunction();
        });
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

    getCustomersByInstitute(institutionType: string) {
        this.spinnerService.spinnerStart();
        this.subs.sink = this.cutomerService.getCustomersByInstitution(institutionType).subscribe((item: Customers[]) => {
            this.customers = [];
            this.customers = item;
            this.spinnerService.spinnerStop();
        },
          (error) => {
            console.log(error);
            this.spinnerService.spinnerStop();
          }
        );
      }

      onInstitutionTypeChange(form: NgForm) {
        this.clear(form);
        this.getCustomersByInstitute(this.institutionId);
      }

    // getAllCustomers() {
    //     this.spinnerService.spinnerStart();
    //     this.subs.sink = this.cutomerService.getCustomers().subscribe((item) => {
    //         this.customers = item;
    //         this.spinnerService.spinnerStop();
    //     },
    //         (error) => {
    //             console.log(error);
    //             this.spinnerService.spinnerStop();
    //         }
    //     );
    // }

    displayFn(customer: CustomerAccount): string {
        let customerDisplayName = '';
        if (customer && customer.customerName) {
            customerDisplayName = customer ? customer.customerName : '';
        }
        return customerDisplayName;
    }

    selectCustomer(selectedCustomerData: any, form: NgForm) {
        this.selectedCustomer = selectedCustomerData;
    }

    customerNameEntered(enteredText: any) {
        if (!enteredText) {
            this.selectedCustomer = null;
        }
        this.markAsDirty();
    }

    markAsDirty() {
        this.form.form.markAsDirty();
    }

    searchOrderProcessLog() {
        this.displayWarnMessage = false;
        const items = document.getElementsByClassName('border-danger');
        if (items.length > 0) {
            this.displayWarnMessage = true;
        }
        if (!this.displayWarnMessage) {
            this.extarctedOrderProcessLogs = [];
            this.orderProcessLogTable = false;
            if (this.selectedCustomer) {
                this.clsExtractOrderProcessLog.customerId = this.selectedCustomer.id;
                this.clsExtractOrderProcessLog.customerName = this.selectedCustomer.customerName;
            }

            if (this.generatedType)
                this.clsExtractOrderProcessLog.generatedType = 'AdHoc';
            else
                this.clsExtractOrderProcessLog.generatedType = 'Scheduled';

            if (this.orderStartDate != null) {
                var startDate = moment(this.orderStartDate).format('YYYY-MM-DD');
                this.clsExtractOrderProcessLog.startDate = startDate;
            }

            if (this.orderEndDate != null) {
                var endDate = moment(this.orderEndDate).format('YYYY-MM-DD');
                this.clsExtractOrderProcessLog.endDate = endDate;
            }

            this.spinnerService.spinnerStart();
            this.extractService.getOrderProcessLog(this.clsExtractOrderProcessLog)
                .subscribe(result => {
                    this.extarctedOrderProcessLogs = result;
                    if (this.extarctedOrderProcessLogs && this.extarctedOrderProcessLogs.length > 0) {
                        this.orderProcessLogTable = true;
                    }
                    else {
                        this.showDialogPopup(this.form, 'No Records found for the searched details.')
                    }
                    this.form.form.markAsPristine();
                    this.spinnerService.spinnerStop();
                },
                    error => {
                        if (error.status == 403) {
                            this.spinnerService.spinnerStop();
                            if (this.form.dirty) {
                                this.form.form.markAsPristine();
                            }
                            alert(error.statusText);
                            this.router.navigate(['/unauthorized']);
                        } else {
                            this.spinnerService.spinnerStop();
                            throw error;
                        }
                    }
                );
        }
    }

    disableOrderLogButton() {
        if (this.selectedCustomer || this.clsExtractOrderProcessLog.accountNumber || this.clsExtractOrderProcessLog.atsNumber ||
            this.clsExtractOrderProcessLog.outputFileName || (this.orderStartDate && this.orderEndDate))
            return false;
        else
            return true;
    }

    clear(myForm: NgForm) {
        myForm.form.markAsPristine();
        // Order section fields
        this.clsExtractOrderProcessLog = new CLSExtractOrderProcessLog();
        this.extarctedOrderProcessLogs = [];
        this.orderProcessLogTable = false;
        this.searchCustomer = null;
        this.selectedCustomer = null;
        this.orderStartDate = null;
        this.orderEndDate = null;
        this.generatedType = true;
        this.displayWarnMessage = false;
        this.orderEndDateError = false;
        this.orderStartDateError = false;
        this.orderEndDateTooltip = '';
        this.orderStartDateTooltip = '';
        this.accountNumberError = false;
        this.accountNumberTooltip = '';
        this.orderATSNumberError = false;
        this.orderATSNumberTooltip = '';

        // NOS section fields
        this.nosProcessLog = new NOSProcessLog();
        this.extratcedNOSProcessLog = [];
        this.nosStartDate = null;
        this.nosEndDate = null;
        this.nosStartDateError = false;
        this.nosStartDateTooltip = '';
        this.nosEndDateError = false;
        this.nosEndDateTooltip = '';
        this.nosEndDateTooltip = '';
        this.nosProcessLogTable = false;
        this.nosATSNumberError = false;
        this.nosATSNumberTooltip = '';
    }

    back(myForm: NgForm) {
        if (myForm && myForm.form.dirty) {
            this.confirmationMessage(myForm);
        } else {
            this.location.back();
        }
    }

    // Show confirmation message if form dirty
    confirmationMessage(form: NgForm) {
        let dialogRef = this.dialog.open(ConfirmationDialogComponent, {
            width: '500px',
            height: 'auto',
            disableClose: true,
            data: {
                isCopyErrorMsg: false,
                isCancelConfirm: true,
                message:
                    'There are unsaved changes. Are you sure you want to leave this page? '
            }
        });

        dialogRef.afterClosed().subscribe(
            result => {
                if (result) {
                    form.form.markAsPristine();
                    this.location.back();
                } else form.form.markAsDirty();
            },
            error => { }
        );
    }

    showDialogPopup(form: NgForm, message: any) {
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
            width: '500px',
            height: 'auto',
            disableClose: true,
            data: {
                title: 'Notification',
                isCopyErrorMsg: false,
                isCancelConfirm: false,
                message: message
            }
        });

        dialogRef.afterClosed().subscribe(() => {
            if (form.dirty) {
                form.form.markAsPristine();
            }
        });
    }

    orderPickerStartDateOpen() {
        if (this.orderStartDate == null) {
            var est = moment.tz(Date.now(), 'America/New_York');
            var month = est.format('MM');
            var day = est.format('DD');
            var year = est.format('YYYY');
            var hour = est.format('HH');
            var minutes = est.format('mm');
            this.maxDateTime = new Date(Number(year), (Number(month) - 1), Number(day), Number(hour), Number(minutes));
            this.orderStartDate = new Date(Number(year), (Number(month) - 1), Number(day), Number(hour), Number(minutes));
        }
    }

    orderPickerStartDateClosed() {
        if (this.orderEndDate == null) {
            this.orderEndDate = this.maxDateTime;
        }

        this.orderStartDateError = false;
        this.orderStartDateTooltip = '';
        if (this.orderStartDateCtrl && this.orderStartDateCtrl.nativeElement) {
            this.orderStartDateCtrl.nativeElement.focus();
        }
        if (this.orderStartDate && this.orderEndDate == null) {
            this.orderEndDateError = true;
            this.orderEndDateTooltip = 'Required';
        }
        else if (this.orderStartDate > this.orderEndDate) {
            this.orderEndDateError = true;
            this.orderStartDateError = true;
            this.orderEndDateTooltip = 'End Date should be after Start Date';
            this.orderStartDateTooltip = 'Start Date should be before End Date';
        }
        else if (this.orderStartDate == null && this.orderEndDate == null) {
            this.orderEndDateError = false;
            this.orderStartDateError = false;
            this.orderEndDateTooltip = '';
            this.orderStartDateTooltip = '';
        }
        else {
            this.orderEndDateError = false;
            this.orderStartDateError = false;
            this.orderEndDateTooltip = '';
            this.orderStartDateTooltip = '';
        }
        this.markAsDirty();
    }

    orderPickerEndDateOpen() {
        if (this.orderEndDate == null) {
            var est = moment.tz(Date.now(), 'America/New_York');
            var month = est.format('MM');
            var day = est.format('DD');
            var year = est.format('YYYY');
            var hour = est.format('HH');
            var minutes = est.format('mm');
            this.maxDateTime = new Date(Number(year), (Number(month) - 1), Number(day), Number(hour), Number(minutes));
            this.orderEndDate = new Date(Number(year), (Number(month) - 1), Number(day), Number(hour), Number(minutes));
        }
    }

    orderPickerEndDateClosed() {
        this.orderEndDateError = false;
        this.orderEndDateTooltip = '';
        if (this.orderEndDateCtrl && this.orderEndDateCtrl.nativeElement) {
            this.orderEndDateCtrl.nativeElement.focus();
        }
        if (this.orderEndDate && this.orderStartDate == null) {
            this.orderStartDateError = true;
            this.orderStartDateTooltip = 'Required';
        }
        else if (this.orderEndDate < this.orderStartDate) {
            this.orderEndDateError = true;
            this.orderStartDateError = true;
            this.orderEndDateTooltip = 'End Date should be after Start Date';
            this.orderStartDateTooltip = 'Start Date should be before End Date';
        }
        else if (this.orderEndDate == null && this.orderStartDate == null) {
            this.orderEndDateError = false;
            this.orderStartDateError = false;
            this.orderEndDateTooltip = '';
            this.orderStartDateTooltip = '';
        }
        else {
            this.orderEndDateError = false;
            this.orderStartDateError = false;
            this.orderEndDateTooltip = '';
            this.orderStartDateTooltip = '';
        }
        this.markAsDirty();
    }

    isOrderStartDateEntered(startDateEntered: any) {
        if (!startDateEntered && this.orderEndDate == null) {
            this.orderEndDateError = false;
            this.orderStartDateError = false;
            this.orderEndDateTooltip = '';
            this.orderStartDateTooltip = '';
        }
        else if (!startDateEntered && this.orderEndDate != null) {
            this.orderStartDateError = true;
            this.orderStartDateTooltip = 'Required';
            this.orderEndDateError = false;
            this.orderEndDateTooltip = '';
        }
    }

    isOrderEndDateEntered(endDateEntered: any) {
        if (!endDateEntered && this.orderStartDate == null) {
            this.orderEndDateError = false;
            this.orderStartDateError = false;
            this.orderEndDateTooltip = '';
            this.orderStartDateTooltip = '';
        }
        else if (!endDateEntered && this.orderStartDate != null) {
            this.orderEndDateError = true;
            this.orderEndDateTooltip = 'Required';
            this.orderStartDateError = false;
            this.orderStartDateTooltip = '';
        }
    }

    orderAccountNumbersValidate(enteredAccountNumber: any) {
        this.markAsDirty();
        if (enteredAccountNumber) {
            if (enteredAccountNumber.startsWith(' ')) {
                this.accountNumberError = true;
                this.accountNumberTooltip = 'First character should not starts with blank space';
            }
            else if (enteredAccountNumber.endsWith(' ')) {
                this.accountNumberError = true;
                this.accountNumberTooltip = 'Last character should not ends with blank space';
            }
            else {
                if (enteredAccountNumber.includes(' ')) {
                    let accountNumbers = enteredAccountNumber.split(' ');
                    // Check only 10 account numbers should be allowed
                    if (accountNumbers.length > 10) {
                        this.accountNumberError = true;
                        this.accountNumberTooltip = 'Max 10 Account numbers are allowed';
                    }
                    else {
                        let invalidAccountExists = false;
                        accountNumbers.some(accountNumber => {
                            let regex = new RegExp('[A-Za-z]', 'g');
                            let alphaExists = accountNumber.match(regex);
                            if (alphaExists && alphaExists.length > 0) {
                                if (accountNumber.length < 8 || accountNumber.length > 12) {
                                    this.accountNumberError = true;
                                    this.accountNumberTooltip = 'Invalid account number';
                                    invalidAccountExists = true;
                                }
                                else if (!invalidAccountExists) {
                                    this.accountNumberError = false;
                                    this.accountNumberTooltip = '';
                                }
                            }
                            else {
                                if (accountNumber.length < 7 || accountNumber.length > 12) {
                                    this.accountNumberError = true;
                                    this.accountNumberTooltip = 'Invalid account number';
                                    invalidAccountExists = true;
                                }
                                else if (!invalidAccountExists) {
                                    this.accountNumberError = false;
                                    this.accountNumberTooltip = '';
                                }
                            }
                        });
                    }
                }
                else {
                    if (enteredAccountNumber.length < 7 || enteredAccountNumber.length > 12) {
                        this.accountNumberError = true;
                        this.accountNumberTooltip = 'Invalid account number';
                    }
                    else {
                        this.accountNumberError = false;
                        this.accountNumberTooltip = '';
                    }
                }
            }
        }
        else {
            this.accountNumberError = false;
            this.accountNumberTooltip = '';
        }
    }

    orderATSNumberValidate(enteredATSNumber: any) {
        this.markAsDirty();
        if (enteredATSNumber) {
            if (enteredATSNumber.startsWith(' ')) {
                this.orderATSNumberError = true;
                this.orderATSNumberTooltip = 'First character should not starts with blank space';
            }
            else if (enteredATSNumber.endsWith(' ')) {
                this.orderATSNumberError = true;
                this.orderATSNumberTooltip = 'Last character should not ends with blank space';
            }
            else {
                if (enteredATSNumber.includes(' ')) {
                    let atsNumbers = enteredATSNumber.split(' ');
                    // Check only 10 ATS numbers should be allowed
                    if (atsNumbers.length > 10) {
                        this.orderATSNumberError = true;
                        this.orderATSNumberTooltip = 'Max 10 ATS numbers are allowed';
                    }
                    else {
                        let invalidATSExists = false;
                        atsNumbers.some(atsNumber => {
                            if (atsNumber.length < 10 || atsNumber.length > 14) {
                                this.orderATSNumberError = true;
                                this.orderATSNumberTooltip = 'Invalid ATS number';
                                invalidATSExists = true;
                            }
                            else if (!invalidATSExists) {
                                this.orderATSNumberError = false;
                                this.orderATSNumberTooltip = '';
                            }
                        });
                    }
                }
                else {
                    if (enteredATSNumber.length < 10 || enteredATSNumber.length > 14) {
                        this.orderATSNumberError = true;
                        this.orderATSNumberTooltip = 'Invalid ATS number';
                    }
                    else {
                        this.orderATSNumberError = false;
                        this.orderATSNumberTooltip = '';
                    }
                }
            }
        }
        else {
            this.orderATSNumberError = false;
            this.orderATSNumberTooltip = '';
        }
    }

    nosPickerStartDateOpen() {
        if (this.nosStartDate == null) {
            var est = moment.tz(Date.now(), 'America/New_York');
            var month = est.format('MM');
            var day = est.format('DD');
            var year = est.format('YYYY');
            var hour = est.format('HH');
            var minutes = est.format('mm');
            this.maxDateTime = new Date(Number(year), (Number(month) - 1), Number(day), Number(hour), Number(minutes));
            this.nosStartDate = new Date(Number(year), (Number(month) - 1), Number(day), Number(hour), Number(minutes));
        }
    }

    nosPickerStartDateClosed() {
        if (this.nosEndDate == null) {
            this.nosEndDate = this.maxDateTime;
        }

        this.nosStartDateError = false;
        this.nosStartDateTooltip = '';
        if (this.nosStartDateCtrl && this.nosStartDateCtrl.nativeElement) {
            this.nosStartDateCtrl.nativeElement.focus();
        }
        if (this.nosStartDate && this.nosEndDate == null) {
            this.nosEndDateError = true;
            this.nosEndDateTooltip = 'Required';
        }
        else if (this.nosStartDate > this.nosEndDate) {
            this.nosEndDateError = true;
            this.nosStartDateError = true;
            this.nosEndDateTooltip = 'End Date should be after Start Date';
            this.nosStartDateTooltip = 'Start Date should be before End Date';
        }
        else if (this.nosStartDate == null && this.nosEndDate == null) {
            this.nosEndDateError = false;
            this.nosStartDateError = false;
            this.nosEndDateTooltip = '';
            this.nosStartDateTooltip = '';
        }
        else {
            this.nosEndDateError = false;
            this.nosStartDateError = false;
            this.nosEndDateTooltip = '';
            this.nosStartDateTooltip = '';
        }
        this.markAsDirty();
    }

    nosPickerEndDateOpen() {
        if (this.nosEndDate == null) {
            var est = moment.tz(Date.now(), 'America/New_York');
            var month = est.format('MM');
            var day = est.format('DD');
            var year = est.format('YYYY');
            var hour = est.format('HH');
            var minutes = est.format('mm');
            this.maxDateTime = new Date(Number(year), (Number(month) - 1), Number(day), Number(hour), Number(minutes));
            this.nosEndDate = new Date(Number(year), (Number(month) - 1), Number(day), Number(hour), Number(minutes));
        }
    }

    nosPickerEndDateClosed() {
        this.nosEndDateError = false;
        this.nosEndDateTooltip = '';
        if (this.nosEndDateCtrl && this.nosEndDateCtrl.nativeElement) {
            this.nosEndDateCtrl.nativeElement.focus();
        }
        if (this.nosEndDate && this.nosStartDate == null) {
            this.nosStartDateError = true;
            this.nosStartDateTooltip = 'Required';
        }
        else if (this.nosEndDate < this.nosStartDate) {
            this.nosEndDateError = true;
            this.nosStartDateError = true;
            this.nosEndDateTooltip = 'End Date should be after Start Date';
            this.nosStartDateTooltip = 'Start Date should be before End Date';
        }
        else if (this.nosEndDate == null && this.nosStartDate == null) {
            this.nosEndDateError = false;
            this.nosStartDateError = false;
            this.nosEndDateTooltip = '';
            this.nosStartDateTooltip = '';
        }
        else {
            this.nosEndDateError = false;
            this.nosStartDateError = false;
            this.nosEndDateTooltip = '';
            this.nosStartDateTooltip = '';
        }
        this.markAsDirty();
    }

    isNOSStartDateEntered(startDateEntered: any) {
        if (!startDateEntered && this.nosEndDate == null) {
            this.nosEndDateError = false;
            this.nosStartDateError = false;
            this.nosEndDateTooltip = '';
            this.nosStartDateTooltip = '';
        }
        else if (!startDateEntered && this.nosEndDate != null) {
            this.nosStartDateError = true;
            this.nosStartDateTooltip = 'Required';
            this.nosEndDateError = false;
            this.nosEndDateTooltip = '';
        }
    }

    isNOSEndDateEntered(endDateEntered: any) {
        if (!endDateEntered && this.nosStartDate == null) {
            this.nosEndDateError = false;
            this.nosStartDateError = false;
            this.nosEndDateTooltip = '';
            this.nosStartDateTooltip = '';
        }
        else if (!endDateEntered && this.nosStartDate != null) {
            this.nosEndDateError = true;
            this.nosEndDateTooltip = 'Required';
            this.nosStartDateError = false;
            this.nosStartDateTooltip = '';
        }
    }

    disableNOSLogButton() {
        if (this.nosProcessLog.fileName || (this.nosStartDate && this.nosEndDate) || this.nosProcessLog.atsNumber) {
            return false;
        }
        else {
            return true;
        }
    }

    searchNOSProcessLog(myForm: NgForm) {
        this.displayWarnMessage = false;
        const items = document.getElementsByClassName('border-danger');
        if (items.length > 0) {
            this.displayWarnMessage = true;
        }
        if (!this.displayWarnMessage) {
            this.extarctedOrderProcessLogs = [];
            this.nosProcessLogTable = false;

            if (this.nosStartDate != null) {
                var startDate = moment(this.nosStartDate).format('YYYY-MM-DD');
                this.nosProcessLog.startDate = startDate;
            }

            if (this.nosEndDate != null) {
                var endDate = moment(this.nosEndDate).format('YYYY-MM-DD');
                this.nosProcessLog.endDate = endDate;
            }

            this.spinnerService.spinnerStart();
            this.extractService.getNOSProcessLog(this.nosProcessLog)
                .subscribe(result => {
                    this.extarctedOrderProcessLogs = result;
                    if (this.extarctedOrderProcessLogs && this.extarctedOrderProcessLogs.length > 0) {
                        this.nosProcessLogTable = true;
                    }
                    else {
                        this.showDialogPopup(this.form, 'No Records found for the searched details.')
                    }
                    this.form.form.markAsPristine();
                    this.spinnerService.spinnerStop();
                },
                    error => {
                        if (error.status == 403) {
                            this.spinnerService.spinnerStop();
                            if (this.form.dirty) {
                                this.form.form.markAsPristine();
                            }
                            alert(error.statusText);
                            this.router.navigate(['/unauthorized']);
                        } else {
                            this.spinnerService.spinnerStop();
                            throw error;
                        }
                    }
                );
        }
    }

    nosATSNumberValidate(enteredATSNumber: any) {
        this.markAsDirty();
        if (enteredATSNumber) {
            if (enteredATSNumber.startsWith(' ')) {
                this.nosATSNumberError = true;
                this.nosATSNumberTooltip = 'First character should not starts with blank space';
            }
            else if (enteredATSNumber.endsWith(' ')) {
                this.nosATSNumberError = true;
                this.nosATSNumberTooltip = 'Last character should not ends with blank space';
            }
            else {
                if (enteredATSNumber.includes(' ')) {
                    let atsNumbers = enteredATSNumber.split(' ');
                    // Check only 10 ATS numbers should be allowed
                    if (atsNumbers.length > 10) {
                        this.nosATSNumberError = true;
                        this.nosATSNumberTooltip = 'Max 10 ATS numbers are allowed';
                    }
                    else {
                        let invalidATSExists = false;
                        atsNumbers.some(atsNumber => {
                            if (atsNumber.length < 10 || atsNumber.length > 14) {
                                this.nosATSNumberError = true;
                                this.nosATSNumberTooltip = 'Invalid ATS number';
                                invalidATSExists = true;
                            }
                            else if (!invalidATSExists) {
                                this.nosATSNumberError = false;
                                this.nosATSNumberTooltip = '';
                            }
                        });
                    }
                }
                else {
                    if (enteredATSNumber.length < 10 || enteredATSNumber.length > 14) {
                        this.nosATSNumberError = true;
                        this.nosATSNumberTooltip = 'Invalid ATS number';
                    }
                    else {
                        this.nosATSNumberError = false;
                        this.nosATSNumberTooltip = '';
                    }
                }
            }
        }
        else {
            this.nosATSNumberError = false;
            this.nosATSNumberTooltip = '';
        }
    }
}