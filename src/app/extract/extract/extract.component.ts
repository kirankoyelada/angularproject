import { Component, OnInit, ViewChild, TemplateRef, ElementRef, QueryList, ViewChildren } from "@angular/core";
import { ExtractService } from "./extract.service";
import { CLSCustomerLabelConfigurationDTO } from "../../customer/_dtos/btcat.customer.vm.dtos";
import {
    Customers, LabelExtractConfig, LabelExtractConfigNotification, LabelExtractConfigNotificationRecord, LabelExtractLog, InCompleteRecords, CLSMARCOutProcessExtractLog, OCLCExportState, UnFlipRecordsRequest
} from "../../customer/shared/customer";
import { Title } from "@angular/platform-browser";
import { SpinnerService } from "src/app/shared/interceptor/spinner.service";
import { Customer } from "../../customer/shared/customer";
import { isObject } from "util";
import { NgForm, FormControl, FormGroup, FormBuilder, Validators, FormGroupDirective } from "@angular/forms";
import { CustomerFilterPipe } from "src/app/customer-filter-pipe.pipe";
import { MatDialog, MatAutocompleteTrigger, _countGroupLabelsBeforeOption, _getOptionScrollPosition, AUTOCOMPLETE_PANEL_HEIGHT } from "@angular/material";
import { ConfirmationDialogComponent } from "src/app/components/shared/confirmation-dialog/confirmation-dialog.component";
import { Location } from "@angular/common";
import { Router } from "@angular/router";
import { SubSink } from "subsink";
import { FormCanDeactivate } from "src/app/can-deactivate/form-can-deactivate";
import { AuthenticationService } from "src/app/security/authentication.service";
import { DropResult } from "smooth-dnd";
import * as _ from "lodash";
import { CustomerService } from '../../customer/shared/services/customer.service';
import { MarcExportService } from 'src/app/services/marc-export.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AngularWaitBarrier } from 'blocking-proxy/built/lib/angular_wait_barrier';
import { element } from '@angular/core/src/render3';
import { MarcSettingsService } from 'src/app/services/marc-settings.service';
import { MarcEditorSettings } from 'src/app/marc/shared/marc';
import { DateRangeValidator } from 'src/app/marc-export/Validator/daterange-validator';
import { Undo979Tag } from './undo979tag.component';
import { CommonService } from 'src/app/shared/service/common.service';
const moment = require('moment-timezone');

declare var $: any;

@Component({
    selector: "app-label-extract",
    templateUrl: "./extract.component.html"
})
export class ExtractComponent extends FormCanDeactivate
    implements OnInit {
    // Search Split Issue fix
    CWidowHeight: number;
    CHeaderHeight: number;
    CNavHeight: number;
    HeaderHeight: number;
    NewHeight: number;
    CSearchHeight: number;
    CompareBtn: number;

    @ViewChild("form") form: NgForm;
    @ViewChild('startDt') startDateTimeCtrl: ElementRef;
    @ViewChild('endDt') endDateTimeCtrl: ElementRef;
    @ViewChild(FormGroupDirective) formGroupDir: FormGroupDirective;
    @ViewChildren(MatAutocompleteTrigger, { read: MatAutocompleteTrigger }) matAutocompleteTrigger: QueryList<MatAutocompleteTrigger>;

    myControl = new FormControl();
    private subs = new SubSink();
    customers: Customers[];
    lCustomersForUndoScreen: Customers[];
    searchCustomer: any;
    loadControlsScreen: boolean;
    displayWarnMessage: boolean;
    clsCustomerExtractConfigurationDto: any;
    ATSNumbers: any;
    clLabelExtractConfig: LabelExtractConfig;
    clsLabelExtractLog: LabelExtractLog;
    localTitle: string;
    labelExtractLog = new LabelExtractLog();
    textAreaErrorDisplay: boolean;
    extractType: string;
    isValidExtractType: boolean = false;
    isvalidCustomer: boolean = false;
    maxAtsNumberErrorDisplay: boolean = false;
    textOutput: string = "";
    cursorOffsetAfterOutput: number = 0;
    onPaste: boolean = false;
    charlimit: number = 10;
    maxLines: number = 100;
    widthPerCharacter: number = 10;
    isValidAtsNumber: boolean = false
    marcSettings: MarcEditorSettings;
    isvalidCustomerRequired: boolean = false;
    isValidExtractTypeRequired: boolean = false;
    textAreaErrorDisplayRequired: boolean;
    duplicateATSNumberExists: boolean;
    duplicateATSNumberExistsTooltip: string;
    isInvalidAtsNumbers: number = 0;
    validAtsNumbers: string[];
    inValidCustomer: boolean = false;
    inValidCustomerNameTooltip: string;

    // OCLC extract declarations
    oclcExportState: OCLCExportState;
    public maxDateTime: Date = moment.tz(Date.now(), 'America/New_York');
    startDateError: boolean = false;
    startDateTooltip: string = '';
    endDateError: boolean = false;
    endDateTooltip: string = '';

    //cls marc out process declarations
    clsMARCOutProcessExtractLog: CLSMARCOutProcessExtractLog;
    unFlipRecordsData: UnFlipRecordsRequest;
    institutes: any[] = [];
    institutionId: string = '';
    defaultInstituteId: string = '';

    constructor(
        private extractService: ExtractService,
        private _titleService: Title,
        private spinnerService: SpinnerService,
        private dialog: MatDialog,
        private router: Router,
        private authenticationService: AuthenticationService,
        private location: Location,
        private cutomerService: CustomerService,
        private service: MarcExportService, private modalService: NgbModal,
        private marcSettingsService: MarcSettingsService,
        private fb: FormBuilder,
        private commonService: CommonService
    ) {
        super(router, authenticationService);
        this.marcSettings = this.marcSettingsService.getMarcSettingsData();

    }

    ngOnInit() {
        //sample data for modal popup
        this.extractType = "Select";

        // Set the title
        this._titleService.setTitle("BTCAT | Extract");

        // Start spninner here
        this.spinnerService.spinnerStart();
        this.commonService.getActiveInstitutions().subscribe(result => {
            if (result) {
                this.institutes = result;
                this.institutionId = this.institutes.find(x => x.displayName == 'B&T').id;
                this.defaultInstituteId = this.institutionId;
                this.getCustomersByInstituttion(this.institutionId);
            }
        },
            (error) => {
                console.log(error);
            });

        this.setESTTime();
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        // this.setMarcConfigState();
        this.oclcExportState = this.getDefaultState();
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

    setESTTime() {
        var est = moment.tz(Date.now(), 'America/New_York');
        var month = est.format('MM');
        var day = est.format('DD');
        var year = est.format('YYYY');
        var hour = est.format('HH');
        var minutes = est.format('mm');
        this.maxDateTime = new Date(Number(year), (Number(month) - 1), Number(day), Number(hour), Number(minutes));
    }

    getDefaultState(): OCLCExportState {
        const oclcExport: OCLCExportState = {
            customerId: '',
            customerName: '',
            startDateTime: null,
            endDateTime: null,
            extractedBy: this.currentUser ? this.currentUser.UserName : '',
            extractCount: 0,
            error: '',
            userStartDateTime: null,
            userEndDateTime: null,
        };
        return oclcExport;
    }

    //This method is used to get the saved customer collection
    getCustomersByInstituttion(institutionType: string) {
        this.spinnerService.spinnerStart();
        this.subs.sink = this.cutomerService.getCustomersByInstitution(institutionType).subscribe((item: Customers[]) => {
            this.customers = [];
            this.lCustomersForUndoScreen = [];
            this.customers = item;
            this.lCustomersForUndoScreen = [...this.customers];
            this.spinnerService.spinnerStop();
        },
            (error) => {
                console.log(error);
                this.spinnerService.spinnerStop();
            }
        );
    }

    onInstitutionTypeChange(form: NgForm) {
        this.getCustomersByInstituttion(this.institutionId);        
        this.ATSNumbers = [];
        this.isValidAtsNumber = false;
        this.maxAtsNumberErrorDisplay = false;
        this.textAreaErrorDisplay = false;
        this.oclcExportState.startDateTime = null;
        this.oclcExportState.endDateTime = null;
        this.startDateError = false;
        this.startDateTooltip = '';
        this.endDateError = false;
        this.endDateTooltip = '';
        this.ATSNumbers = '';        
        this.searchCustomer = '';
        this.inValidCustomer = false;
        this.inValidCustomerNameTooltip = '';                     
        this.duplicateATSNumberExists = false;
        this.textAreaErrorDisplayRequired = false;
        this.duplicateATSNumberExistsTooltip = '';
        this.isvalidCustomer = false;           
        this.isvalidCustomerRequired = false;
    }

    displayFn(customer: Customer): string {
        let customerDisplayName = "";
        if (customer && customer.customerName) {
            customerDisplayName = customer.customerName;
        } else {
            customerDisplayName = customer ? customer.customerId : "";
        }
        return customerDisplayName;
    }

    findCustomer() {
        if (
            this.searchCustomer != undefined &&
            this.searchCustomer != "" &&
            this.searchCustomer != "Customer not found"
        ) {

            if (!isObject(this.searchCustomer)) {
                let findCustomer = this.customers.find(x => {
                    if (x.customerName) {
                        let customerName = x.customerName;
                        return (
                            customerName.toLowerCase() === this.searchCustomer.toLowerCase()
                        );
                    }
                });
            }
        }
        let isValidCustomerCount = 0;
        this.customers.forEach(element => {
            if (isObject(this.searchCustomer)) {
                if (element.customerName && element.customerName.toLowerCase() === this.searchCustomer.customerName.toLowerCase()) {
                    isValidCustomerCount++;
                }
            }
            else if (element.customerName && element.customerName.toLowerCase() === this.searchCustomer.toLowerCase()) {
                isValidCustomerCount++;
            }
        });
        if (isValidCustomerCount == 1) {
            this.isvalidCustomer = true;
            this.inValidCustomer = false;
            this.inValidCustomerNameTooltip = '';
        }
        else {
            this.isvalidCustomer = false;
            this.inValidCustomer = true;
            this.inValidCustomerNameTooltip = 'In valid customer name';
        }
    }

    validateUpdateCustomerName(enteredText: any) {
        if (enteredText) {
            this.isvalidCustomer = true;
        }
        else {
            this.isvalidCustomer = false;
        }
    }

    selectedCustomer() {
        this.inValidCustomer = false;
        this.inValidCustomerNameTooltip = '';
        this.removeAriaDescribedByAttribute('customer');
    }


    enableSave(extractType) {
        if (extractType.toLowerCase() === "lableExtract".toLowerCase()) {
            this.maxLines = 100;
            this.charlimit = 10;
            return !this.isValidExtractType || !this.isvalidCustomer || !this.isValidAtsNumber || this.duplicateATSNumberExists || this.inValidCustomer;
        }
        else if (extractType.toLowerCase() === "clsExtract".toLowerCase()) {
            this.maxLines = 20;
            this.charlimit = 14;
            return !this.isValidExtractType || !this.isvalidCustomer || !this.isValidAtsNumber || this.inValidCustomer || this.duplicateATSNumberExists;
        }
        else if (extractType.toLowerCase() === "oclcExtract".toLowerCase()) {
            if (this.oclcExportState.startDateTime && this.oclcExportState.endDateTime && this.isvalidCustomer && !this.inValidCustomer) {
                return false;
            }
            else {
                return true;
            }
        }
        else if (extractType.toLowerCase() === "Unflip".toLowerCase()) {
            this.maxLines = 10;
            this.charlimit = 14;
            return !this.isValidExtractType || !this.isvalidCustomer || !this.isValidAtsNumber || this.inValidCustomer || this.duplicateATSNumberExists;
        }
        else {
            return true;
        }
    }

    Extract(myForm: NgForm) {
        if (this.extractType.toLowerCase() === "lableExtract".toLowerCase()) {
            this.maxLines = 100;
            this.charlimit = 10;
            this.clsLableDataExtract(myForm);
        }
        else if (this.extractType.toLowerCase() === "clsExtract".toLowerCase()) {
            this.maxLines = 20;
            this.charlimit = 14;
            this.clsMARCOutProcessExtract(myForm);
        }
        else if ((this.extractType.toLowerCase() === "oclcExtract".toLowerCase())) {
            this.oclcExtract(myForm);
        }
        else if ((this.extractType.toLowerCase() === "unFlip".toLowerCase())) {
            this.unFlipMarcRecordsProcess(myForm);
        }
    }

    //unFlipMarcRecordsProcess
    unFlipMarcRecordsProcess(myForm: NgForm) {
        this.maxAtsNumberErrorDisplay = false;
        let atsNumbers;
        let isInvalidAtsNumbers: number = 0;
        const pattern = /^([a-zA-Z0-9]+)$/;
        let validAtsNumbers = [];
        if (this.ATSNumbers) {
            atsNumbers = this.ATSNumbers.split('\n');
            atsNumbers.forEach(element => {
                if (element) {
                    if (element != undefined) {
                        element = element.replace(/\s/g, "");
                        if (!pattern.test(element)) {
                            isInvalidAtsNumbers++;
                        }
                        else {
                            validAtsNumbers.push(element);
                        }
                    }
                }
            });
        }

        if (isInvalidAtsNumbers >= 1)
            this.textAreaErrorDisplay = true;
        else
            this.textAreaErrorDisplay = false;
        if (!this.textAreaErrorDisplay) {

            this.unFlipRecordsData = {
                CustomerId: this.searchCustomer.id,
                CustomerName: this.searchCustomer.customerName,
                AtsNumbers: validAtsNumbers,
                NonMatchedATSNumbers: []
            };

            this.spinnerService.spinnerStart();
            this.extractService.convert960To949TagUnflipProcess(
                this.unFlipRecordsData
            ).subscribe(result => {
                this.spinnerService.spinnerStop();
                let message;
                if (result) {
                    message = this.getUnFlipNotificationMessage(result);
                    this.saveConfirmationMesage(myForm, message, 'Notification');
                }
            },
                error => {
                    if (error.status == 403) {
                        this.spinnerService.spinnerStop();
                        if (myForm.dirty) {
                            myForm.form.markAsPristine();
                        }
                        alert(error.statusText);
                        this.router.navigate(["/unauthorized"]);
                    } else {
                        this.spinnerService.spinnerStop();
                        throw error;
                    }
                }
            );
        }
    }




    oclcExtract(myForm: NgForm) {
        const items = document.getElementsByClassName('border-danger');
        if (items.length == 0) {
            this.oclcExportState.customerId = this.searchCustomer.id;
            this.oclcExportState.customerName = this.searchCustomer.customerName;
            var startDate = moment(this.oclcExportState.startDateTime).format('YYYY-MM-DD');
            var endDate = moment(this.oclcExportState.endDateTime).format('YYYY-MM-DD');
            this.oclcExportState.userStartDateTime = startDate;
            this.oclcExportState.userEndDateTime = endDate;
            console.log(this.oclcExportState);
            this.spinnerService.spinnerStart();
            this.extractService.extractOCLCMARCManual(this.oclcExportState).subscribe((result) => {
                this.spinnerService.spinnerStop();
                if (result && result.error) {
                    this.showDialogPopup(myForm, result.error);
                }
                else if (result) {
                    let successMesage = 'OCLC data extract completed.';
                    this.showDialogPopup(myForm, successMesage);
                }
                else {
                    let failureMesage = 'OCLC data extract failed.';
                    this.showDialogPopup(myForm, failureMesage);
                }
                console.log('Result from OCLC extact API', result);
            },
                error => {
                    if (error.status == 403) {
                        this.spinnerService.spinnerStop();
                        if (myForm.dirty) {
                            myForm.form.markAsPristine();
                        }
                        alert(error.statusText);
                        this.router.navigate(["/unauthorized"]);
                    } else {
                        this.spinnerService.spinnerStop();
                        throw error;
                    }
                });
        }
    }

    showDialogPopup(form: NgForm, message: any) {
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
            width: "500px",
            height: "auto",
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
            // Clear fields
            this.oclcExportState.startDateTime = null;
            this.oclcExportState.endDateTime = null;
            this.searchCustomer = '';
        });
    }

    clsLableDataExtract(myForm: NgForm) {
        this.maxAtsNumberErrorDisplay = false;
        let atsNumbers;
        let isInvalidAtsNumbers: number = 0;
        const pattern = /^([a-zA-Z0-9]+)$/;
        let validAtsNumbers = [];
        if (this.ATSNumbers) {
            atsNumbers = this.ATSNumbers.split('\n');
            atsNumbers.forEach(element => {
                if (element) {
                    if (element != undefined) {
                        element = element.replace(/\s/g, "");
                        if (!pattern.test(element) || element.length != 10) {
                            isInvalidAtsNumbers++;
                        }
                        else {
                            validAtsNumbers.push(element);
                        }
                    }
                }
            });
        }
        if (isInvalidAtsNumbers >= 1)
            this.textAreaErrorDisplay = true;
        else
            this.textAreaErrorDisplay = false;
        if (!this.textAreaErrorDisplay && !this.inValidCustomer) {

            this.clsLabelExtractLog = {
                CustomerId: this.searchCustomer.id,
                CustomerName: this.searchCustomer.customerName,
                AtsNumbers: validAtsNumbers,
                extractedBy: this.currentUser.UserName,
                LabelExtractCount: 0,
                InCompleteRecords: {},
                NonMatchedATSNumbers: []
            };

            this.spinnerService.spinnerStart();
            this.extractService.extractCLSLableConfiguration(
                this.clsLabelExtractLog
            ).subscribe(result => {
                this.spinnerService.spinnerStop();
                let message;
                if (result) {
                    message = this.getNotificationMessage(result);
                    this.saveConfirmationMesage(myForm, message, 'Notification');
                }
            },
                error => {
                    if (error.status == 403) {
                        this.spinnerService.spinnerStop();
                        if (myForm.dirty) {
                            myForm.form.markAsPristine();
                        }
                        alert(error.statusText);
                        this.router.navigate(["/unauthorized"]);
                    } else {
                        this.spinnerService.spinnerStop();
                        throw error;
                    }
                }
            );
        }
    }


    //extractCLSMARCOutProcessManual
    clsMARCOutProcessExtract(myForm: NgForm) {
        this.maxAtsNumberErrorDisplay = false;
        let atsNumbers;
        let isInvalidAtsNumbers: number = 0;
        const pattern = /^([a-zA-Z0-9]+)$/;
        let validAtsNumbers = [];
        if (this.ATSNumbers) {
            atsNumbers = this.ATSNumbers.split('\n');
            atsNumbers.forEach(element => {
                if (element) {
                    if (element != undefined) {
                        element = element.replace(/\s/g, "");
                        if (!pattern.test(element)) {
                            isInvalidAtsNumbers++;
                        }
                        else {
                            validAtsNumbers.push(element);
                        }
                    }
                }
            });
        }

        if (isInvalidAtsNumbers >= 1)
            this.textAreaErrorDisplay = true;
        else
            this.textAreaErrorDisplay = false;
        if (!this.textAreaErrorDisplay) {

            this.clsMARCOutProcessExtractLog = {
                CustomerId: this.searchCustomer.id,
                CustomerName: this.searchCustomer.customerName,
                AtsNumbers: validAtsNumbers,
                extractedBy: this.currentUser.UserName,
                InCompleteRecords: {},
                NonMatchedATSNumbers: [],
                CLSMarcOutFiles: [],
                ErrorMessage: ''
            };

            this.spinnerService.spinnerStart();
            this.extractService.extractCLSMARCOutProcessManual(
                this.clsMARCOutProcessExtractLog
            ).subscribe(result => {
                this.spinnerService.spinnerStop();
                let message;
                if (result) {
                    if (result.ErrorMessage == undefined || result.ErrorMessage == null)
                        message = this.getCLSNotificationMessage(result);
                    else
                        message = result.ErrorMessage
                    this.saveConfirmationMesage(myForm, message, 'Notification');
                }
            },
                error => {
                    if (error.status == 403) {
                        this.spinnerService.spinnerStop();
                        if (myForm.dirty) {
                            myForm.form.markAsPristine();
                        }
                        alert(error.statusText);
                        this.router.navigate(["/unauthorized"]);
                    } else {
                        this.spinnerService.spinnerStop();
                        throw error;
                    }
                }
            );
        }
    }


    isShow(extractType) {
        if (extractType.toLowerCase() === this.extractType.toLowerCase()) {
            return true;
        }
        else {
            return false;
        }
    }


    /* search split fix function - var values */
    CustomHeightFunction() {
        this.CWidowHeight = $(window).height();
        this.CHeaderHeight = $("app-header nav").height();
        this.CSearchHeight = $(".search_filter").height();
        this.CNavHeight = $(".mainNavSection").height();
        this.CompareBtn = $("header.tableHeaderCounts").height();
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
        this.CustomHeightFunction();
        $(window).resize(e => {
            this.CustomHeightFunction();
        });
    }

    clear(myForm: NgForm) {
        // Reset the form to initiatial stage
        // Before resetting the form, show the confirmation dialog for unsaved changes
        if (myForm.dirty) {
            myForm.form.markAsPristine();
        }
        this.clearFields();
        this.institutionId = this.defaultInstituteId;
        this.getCustomersByInstituttion(this.institutionId);
    }

    private clearFields() {
        this.searchCustomer = "";
        this.ATSNumbers = [];
        this.extractType = 'Select';
        this.isValidAtsNumber = false;
        this.maxAtsNumberErrorDisplay = false;
        this.textAreaErrorDisplay = false;
        this.oclcExportState.startDateTime = null;
        this.oclcExportState.endDateTime = null;
        this.startDateError = false;
        this.startDateTooltip = '';
        this.endDateError = false;
        this.endDateTooltip = '';
    }

    back(myForm: NgForm) {
        if (myForm && myForm.form.dirty) {
            this.confirmationMessage(myForm);
        } else {
            this.location.back();
        }
    }

    markAsDirtyField(myForm: NgForm) {
        myForm.form.markAsDirty();
    }

    // Show confirmation message if form dirty
    confirmationMessage(form: NgForm) {
        let dialogRef = this.dialog.open(ConfirmationDialogComponent, {
            width: "500px",
            height: "auto",
            disableClose: true,
            data: {
                isCopyErrorMsg: false,
                isCancelConfirm: true,
                message:
                    "There are unsaved changes. Are you sure you want to leave this page? "
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

    getNotificationMessage(objLabelExtractlog: LabelExtractLog): string {
        let labelExtractlog = JSON.parse(JSON.stringify(objLabelExtractlog));
        let notificationData = '<html><div><p align="center"> <b>Label Data Extract Completed.</b></p></div>';
        if (labelExtractlog.AtsNumbers) {
            notificationData += '<div class="col-12"><div class="row popupRow"><div class="col pl-0 pr-small"><h3>ATS Number(s):</h3><div class="atsNumbersBlock">';
            labelExtractlog.AtsNumbers.forEach(element => {
                notificationData += '<p class="m-0">' + element + '</p>'
            });

            notificationData += '</div></div><div class="col pr-0 opl-small"><h3>Number Of Labels Extracted:</h3><div> <p class="m-0">' + labelExtractlog.LabelExtractCount + '</p></div></div></div></div>';
        }

        if (labelExtractlog.NonMatchedATSNumbers && labelExtractlog.NonMatchedATSNumbers.length > 0) {
            notificationData += '<div class="col-6"><div class="row popupRow"><div class="col opl-small pl-0"><h3>ATS number(s) to be reviewed:</h3><div class="atsNumbersBlock">';
            labelExtractlog.NonMatchedATSNumbers.forEach(element => {
                notificationData += '<p class="m-0">' + element + '</p>'
            });
            notificationData += '</div></div></div></div>';
        }
        let inCompleteRecordsLength;
        if (labelExtractlog.IncompleteRecords)
            inCompleteRecordsLength = Object.keys(labelExtractlog.IncompleteRecords);
        if (inCompleteRecordsLength.length > 0) {
            notificationData += '<table id="modelTabel" class="table table-bordered table-hover table-sm" cellspacing="0" width="100%"><thead class="table-active"><tr><th>Record Number</th> <th>Missing mandatory fields</th></tr></thead><tbody>'
            for (let incompleteRecord in labelExtractlog.IncompleteRecords) {
                let inCompleteValue = '';
                let inCompleteRecordsValue;
                inCompleteRecordsValue = labelExtractlog.IncompleteRecords[incompleteRecord]

                inCompleteRecordsValue.forEach(inCompleteRecordValue => {

                    if (inCompleteRecordValue != undefined) {

                        inCompleteRecordValue = inCompleteRecordValue.replace(/[|]+/g, this.marcSettings.delimiter);
                        if (inCompleteValue) {
                            inCompleteValue = inCompleteValue + "," + inCompleteRecordValue;
                        } else {
                            inCompleteValue = inCompleteRecordValue;
                        }
                    } else {
                    }

                });
                let splitInCompleteValue = null;
                let noOf949Tags = [];
                if (inCompleteValue.includes(',')) {
                    splitInCompleteValue = inCompleteValue.split(',');
                    splitInCompleteValue.forEach(x => {
                        if (x.startsWith('949')) {
                            noOf949Tags.push(x);
                        }
                    });
                }
                if (noOf949Tags.length > 1) {
                    inCompleteValue = 'Multiple 949 missed';
                }

                notificationData += '<tr><td>' + incompleteRecord + '</td><td>' + inCompleteValue + '</td></tr>';
            }
            notificationData += '</tbody></table>';
        } else if (labelExtractlog.LabelExtractCount == undefined || labelExtractlog.LabelExtractCount.length == 0) {

            notificationData += '<div><p class="text-center mb-0">There are no records for the selected ATS numbers.</p></div>'
        }
        notificationData += '</html>';
        return notificationData;
    }


    getCLSNotificationMessage(clsExtractlogInfo: CLSMARCOutProcessExtractLog): string {
        let clsExtractlog = JSON.parse(JSON.stringify(clsExtractlogInfo));
        let notificationData = '<html><div><p align="center"> <b>CLS/JB Data Extract Completed.</b></p></div>';
        if (clsExtractlog.AtsNumbers) {
            notificationData += '<div class="col-12"><div class="row popupRow"><div class="col-6 pl-0 pr-small"><h3>ATS Number(s):</h3><div class="atsNumbersBlock">';
            clsExtractlog.AtsNumbers.forEach(element => {
                notificationData += '<p class="m-0">' + element + '</p>'
            });
            notificationData += '</div></div>';
        }

        if (clsExtractlog.NonMatchedATSNumbers && clsExtractlog.NonMatchedATSNumbers.length > 0) {
            notificationData += '<div class="col"><div class="row popupRow"><div class="col opl-small pl-0"><h3>ATS number(s) to be reviewed:</h3><div class="atsNumbersBlock">';
            clsExtractlog.NonMatchedATSNumbers.forEach(element => {
                notificationData += '<p class="m-0">' + element + '</p>'
            });
            notificationData += '</div></div></div></div>';
        }
        if (clsExtractlog.CLSMarcOutFiles != undefined) {
            if (clsExtractlog.CLSMarcOutFiles.length > 0) {
                notificationData += '<table id="modelTabel" class="table table-bordered table-hover table-sm mb-1" cellspacing="0" width="100%"><thead class="table-active"><tr><th> Account Number</th> <th>File Name </th> <th>Records Count</th> <th>Number of items (949 tags) in the file</th> </tr></thead><tbody>'
                for (let j = 0; j < clsExtractlog.CLSMarcOutFiles.length; j++) {
                    let accountnumber = clsExtractlog.CLSMarcOutFiles[j].AccountNumber === null ? "" : clsExtractlog.CLSMarcOutFiles[j].AccountNumber;
                    let accountnumbers = "";
                    if (accountnumber != "") {
                        let accntNumbers = accountnumber.split(',');
                        let i = 0;
                        accntNumbers.forEach(element => {
                            i++;
                            if (i == accntNumbers.length)
                                accountnumbers += element;
                            else
                                accountnumbers += element + '</br>'

                        });
                    }
                    notificationData += '<tr><td>' + accountnumbers + '</td><td>' + clsExtractlog.CLSMarcOutFiles[j].FileName + '</td><td>' + clsExtractlog.CLSMarcOutFiles[j].RecordsCount + '</td><td>' + clsExtractlog.CLSMarcOutFiles[j].NumberOf949TagsInFile + '</td></tr>';
                }
                notificationData += '</tbody></table>';
            }
        }

        if (clsExtractlog.CLSMarcOutFiles === undefined || clsExtractlog.CLSMarcOutFiles.length === 0) {
            if (clsExtractlog.NonMatchedATSNumbers && clsExtractlog.NonMatchedATSNumbers.length === 0)
                notificationData += '<div><p class="text-center mb-0">There are no records for the selected ATS numbers.</p></div>'
        }
        notificationData += '</html>';
        return notificationData;
    }

    getUnFlipNotificationMessage(UnFlipRecordsInfo: UnFlipRecordsRequest): string {
        let unflipRecordsresponse = JSON.parse(JSON.stringify(UnFlipRecordsInfo));
        let notificationData = '<html><div><p align="center"> <b>Unflip Process Completed.</b></p></div>';
        if (unflipRecordsresponse.AtsNumbers) {
            notificationData += '<div class="col-12"><div class="row popupRow"><div class="col-6 pl-0 pr-small"><h3>ATS Number(s):</h3><div class="atsNumbersBlock">';
            unflipRecordsresponse.AtsNumbers.forEach(element => {
                notificationData += '<p class="m-0">' + element + '</p>'
            });
            notificationData += '</div></div>';
        }

        if (unflipRecordsresponse.NonMatchedATSNumbers && unflipRecordsresponse.NonMatchedATSNumbers.length > 0) {
            notificationData += '<div class="col"><div class="row popupRow"><div class="col opl-small pl-0"><h3>ATS number(s) to be reviewed:</h3><div class="atsNumbersBlock">';
            unflipRecordsresponse.NonMatchedATSNumbers.forEach(element => {
                notificationData += '<p class="m-0">' + element + '</p>'
            });
            notificationData += '</div></div></div></div>';
        }

        notificationData += '</html>';
        return notificationData;
    }


    saveConfirmationMesage(form: NgForm, confirmMessage: string, title: string) {
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
            width: "500px",
            height: "auto",
            disableClose: true,
            data: {
                title: title,
                isCopyErrorMsg: false,
                isCancelConfirm: false,
                message: confirmMessage
            }
        });
        dialogRef.afterClosed().subscribe(() => {
            this.searchCustomer = "";
            this.ATSNumbers = [];
            this.extractType = "Select";
            this.isValidExtractType = false;
            this.isvalidCustomer = false;
            this.isValidAtsNumber = false;
            this.duplicateATSNumberExists = false;
            this.onPaste = false;
        });
    }

    validateRequiredFields(value: any, type: any) {
        if (value && type == 'extractType') {
            this.extractType = value;
            if (this.extractType != 'Select') {
                this.isValidExtractTypeRequired = false;
                this.removeAriaDescribedByAttribute('extract-type');
            }
            else
                this.isValidExtractTypeRequired = true;
        }

        if (type == 'customer') {
            if (value != undefined && value != '') {
                this.isvalidCustomerRequired = false;
                this.inValidCustomer = false;
                this.removeAriaDescribedByAttribute('customer');
            }
            else {
                this.isvalidCustomerRequired = true;
                this.inValidCustomer = true;
            }
        }
    }

    buttonDisable(value: any, type: any) {
        if (value && type == 'extractType') {
            this.searchCustomer = '';
            this.extractType = value;
            if (this.extractType != 'Select')
                this.isValidExtractType = true;
            else {
                this.isValidExtractType = false;
                this.isvalidCustomerRequired = false;
                this.inValidCustomer = false;
                this.inValidCustomerNameTooltip = '';
            }

        }

        // Clear field on change of dropdown
        if (value == 'clsExtract' || value == 'lableExtract' || value == 'oclcExtract' || value == 'unflip') {
            this.isValidExtractType = true;
            this.ATSNumbers = '';
            this.ATSNumbers = [];
            this.searchCustomer = '';
            this.inValidCustomer = false;
            this.inValidCustomerNameTooltip = '';
            this.textAreaErrorDisplay = false;
            this.maxAtsNumberErrorDisplay = false;
            this.textAreaErrorDisplayRequired = false;
            this.duplicateATSNumberExists = false;
            this.textAreaErrorDisplayRequired = false;
            this.duplicateATSNumberExistsTooltip = '';
            this.isvalidCustomer = false;
            this.isValidAtsNumber = false;
            this.isvalidCustomerRequired = false;
        }

        // Clear field on change of dropdown
        if (value == 'clsExtract' || value == 'lableExtract' || value == 'unflip') {
            this.oclcExportState.startDateTime = null;
            this.oclcExportState.endDateTime = null;
            this.startDateError = false;
            this.startDateTooltip = '';
            this.endDateError = false;
            this.endDateTooltip = '';

        }
    }

    formatText(event, length, maxlines) {
        if (event.inputType == 'insertLineBreak') {
            let tags = event.target.value.split('\n');
            let lastTagIndex = tags.length - 2;
            let lastVaue = tags[lastTagIndex];
            if (lastVaue.length != length) {
                this.validateATsNumbers(event, length, maxlines);
            }
        }
        else {
            this.validateATsNumbers(event, length, maxlines);
        }

        if (!this.textAreaErrorDisplay && !this.maxAtsNumberErrorDisplay &&
            !this.textAreaErrorDisplayRequired && !this.duplicateATSNumberExists) {
            if (this.extractType == 'lableExtract') {
                this.removeAriaDescribedByAttribute('ATSNumbers');
            }
            else if ((this.extractType == 'clsExtract' || this.extractType == 'unflip')) {
                this.removeAriaDescribedByAttribute('clsATSNumbers');
            }
        }
    }

    validateATsNumbers(event, length, maxlines) {
        this.maxLines = maxlines;
        this.textAreaErrorDisplayRequired = false;
        const pattern = /^[a-zA-Z0-9\s]*$/;
        if (!pattern.test(event.target.value)) {
            event.target.value = event.target.value.replace(/[^a-zA-Z0-9\s]/g, "");
        }

        if (this.ATSNumbers != undefined &&
            (this.ATSNumbers != undefined && this.ATSNumbers.length > 1))
            this.isValidAtsNumber = true;
        else
            this.isValidAtsNumber = false;

        let textarea = event.target as HTMLTextAreaElement;
        let textAreaValue = textarea.value;

        let lines = textarea.value.split(/\r*\n/g)
        let atsNumbers = [];
        if (this.onPaste) {
            for (var i = 0; i < lines.length; i++) {
                let lastLineCutedTxt = '';
                lines[i] = lines[i].trim();
                if (lines[i].length > this.charlimit) {
                    lastLineCutedTxt = lines[i].slice(this.charlimit);
                    lines[i] = lines[i].slice(0, this.charlimit);
                    atsNumbers.push(lines[i]);

                }
                else atsNumbers.push(lines[i]);
            }
        }
        else {
            let lastLineCutedTxt = '';
            for (var i = 0; i < lines.length; i++) {
                lines[i] = lines[i].trim();
                lines[i] = lastLineCutedTxt + lines[i];

                if (lines[i].length > this.charlimit) {
                    lastLineCutedTxt = lines[i].slice(this.charlimit);
                    lines[i] = lines[i].slice(0, this.charlimit);
                    atsNumbers.push(lines[i]);

                }
                else atsNumbers.push(lines[i]);
            }
            if (lastLineCutedTxt != '')
                atsNumbers.push(lastLineCutedTxt);

        }

        let validAtsNumbers: string[] = [];
        if (atsNumbers) {
            atsNumbers.forEach(element => {
                if (element) {
                    if (element != undefined) {
                        element = element.replace(/\s/g, "");
                        if (!pattern.test(element) || element.length != length) {
                        }
                        else {
                            validAtsNumbers.push(element);
                        }
                    }
                }
            });
        }
        if (validAtsNumbers.length > this.maxLines) {
            textarea.value = validAtsNumbers.slice(0, this.maxLines).join('\n');
            event.target.value = textarea.value.replace(/^\s*[\r\n]/gm, '');
        }
        else {
            textarea.value = atsNumbers.slice(0, this.maxLines).join('\n');
            event.target.value = textarea.value.replace(/^\s*[\r\n]/gm, '');

        }
        this.ATSNumbers = event.target.value;
        let invalidTags = false;
        if (event.target.value) {
            let enteredAtsNumbers = event.target.value.split('\n');
            // Validating minimum 10 or 14 digits ATS number should be there
            if (enteredAtsNumbers) {
                enteredAtsNumbers.forEach(x => {
                    if (x && x.length > 0 && x.length < length) {

                        if (length == 14) {
                            if (x.length < 10 || x.length > length) {
                                this.duplicateATSNumberExists = true;
                                invalidTags = true;
                                this.duplicateATSNumberExistsTooltip = 'ATS Number(s) should be between 10 to ' + length + ' characters';
                            }
                        } else {
                            this.duplicateATSNumberExists = true;
                            invalidTags = true;
                            this.duplicateATSNumberExistsTooltip = 'ATS Number(s) should be of ' + length + ' characters';
                        }
                    }
                });
            }
            if (!invalidTags) {
                // Validate if any same duplicate ATS number is entered
                let lastIndexPosition = enteredAtsNumbers.length - 1;
                let lastItemValue = enteredAtsNumbers[lastIndexPosition];
                if (lastItemValue.length == length) {
                    enteredAtsNumbers = enteredAtsNumbers.map(v => v.toLowerCase());
                    let enteredAtsNumbersWithDuplicate = new Set(enteredAtsNumbers);
                    if (enteredAtsNumbers.length > enteredAtsNumbersWithDuplicate.size) {
                        this.duplicateATSNumberExists = true;
                        this.duplicateATSNumberExistsTooltip = 'Duplicate ATS Number exists';

                    }
                    else {
                        this.duplicateATSNumberExists = false;
                        this.duplicateATSNumberExistsTooltip = '';
                    }
                }
                else {
                    enteredAtsNumbers = enteredAtsNumbers.map(v => v.toLowerCase());
                    let enteredAtsNumbersWithDuplicate = new Set(enteredAtsNumbers);
                    if (enteredAtsNumbers.length > enteredAtsNumbersWithDuplicate.size) {
                        this.duplicateATSNumberExists = true;
                        this.duplicateATSNumberExistsTooltip = 'Duplicate ATS number exists';
                    }
                    else {
                        this.duplicateATSNumberExists = false;
                        this.duplicateATSNumberExistsTooltip = '';
                    }
                }
            }
        }
    }

    onBlur(value: any) {
        if (value.length == 0)
            this.textAreaErrorDisplayRequired = true;
        else {
            this.maxAtsNumberErrorDisplay = false;
            this.textAreaErrorDisplay = false;
            this.textAreaErrorDisplayRequired = false;
            if (!this.duplicateATSNumberExists && this.extractType == 'lableExtract') {
                this.removeAriaDescribedByAttribute('ATSNumbers');
            }
            else if (!this.duplicateATSNumberExists && (this.extractType == 'clsExtract' || this.extractType == 'unflip')) {
                this.removeAriaDescribedByAttribute('clsATSNumbers');
            }
        }
    }

    handlePaste(item: any) {
        this.onPaste = true;
    }

    // OCLC extract
    // Picker Events
    pickerStartDateClosed() {
        if (this.startDateTimeCtrl && this.startDateTimeCtrl.nativeElement) {
            this.startDateTimeCtrl.nativeElement.focus();
        }
        if (this.oclcExportState.startDateTime) {
            this.startDateError = false;
            this.startDateTooltip = '';
            this.removeAriaDescribedByAttribute('startDateTime');
        }
        else {
            this.startDateError = true;
            this.startDateTooltip = 'Required';
        }
        if (this.oclcExportState.startDateTime && this.oclcExportState.endDateTime) {
            if (this.oclcExportState.startDateTime > this.oclcExportState.endDateTime) {
                this.endDateError = true;
                this.startDateError = true;
                this.endDateTooltip = 'End Date should be after Start Date';
                this.startDateTooltip = 'Start Date should be before End Date';
            }
            else {
                this.startDateError = false;
                this.startDateTooltip = '';
                this.removeAriaDescribedByAttribute('startDateTime');
                if (this.oclcExportState.endDateTime) {
                    this.endDateError = false;
                    this.endDateTooltip = '';
                    this.removeAriaDescribedByAttribute('endDateTime');
                }
            }
        }
    }

    pickerEndDateClosed(event) {
        if (this.endDateTimeCtrl && this.endDateTimeCtrl.nativeElement) {
            this.endDateTimeCtrl.nativeElement.focus();
        }
        if (this.oclcExportState.endDateTime) {
            this.endDateError = false;
            this.endDateTooltip = '';
            this.removeAriaDescribedByAttribute('endDateTime');
        }
        else {
            this.endDateError = true;
            this.endDateTooltip = 'Required';
        }
        if (this.oclcExportState.endDateTime && this.oclcExportState.startDateTime) {
            if (this.oclcExportState.endDateTime < this.oclcExportState.startDateTime) {
                this.endDateError = true;
                this.startDateError = true;
                this.endDateTooltip = 'End Date should be after Start Date';
                this.startDateTooltip = 'Start Date should be before End Date';
            }
            else {
                this.endDateError = false;
                this.endDateTooltip = '';
                this.removeAriaDescribedByAttribute('endDateTime');
                if (this.oclcExportState.startDateTime) {
                    this.startDateError = false;
                    this.startDateTooltip = '';
                    this.removeAriaDescribedByAttribute('startDateTime');
                }
            }
        }

    }

    pickerStartDateOpen() {
        if (this.oclcExportState && this.oclcExportState.startDateTime) {
            if (this.oclcExportState.startDateTime == null) {
                var est = moment.tz(Date.now(), 'America/New_York');
                var month = est.format('MM');
                var day = est.format('DD');
                var year = est.format('YYYY');
                var hour = est.format('HH');
                var minutes = est.format('mm');
                this.maxDateTime = new Date(Number(year), (Number(month) - 1), Number(day), Number(hour), Number(minutes));
                this.oclcExportState.startDateTime = new Date(Number(year), (Number(month) - 1), Number(day), Number(hour), Number(minutes));
            }
        }
    }

    pickerEndDateOpen() {
        if (this.oclcExportState && this.oclcExportState.endDateTime) {
            if (this.oclcExportState.endDateTime == null) {
                var est = moment.tz(Date.now(), 'America/New_York');
                var month = est.format('MM');
                var day = est.format('DD');
                var year = est.format('YYYY');
                var hour = est.format('HH');
                var minutes = est.format('mm');
                this.maxDateTime = new Date(Number(year), (Number(month) - 1), Number(day), Number(hour), Number(minutes));
                this.oclcExportState.endDateTime = new Date(Number(year), (Number(month) - 1), Number(day), Number(hour), Number(minutes));
            }
        }
    }

    loadUndo979Dialog() {
        const dialogRef = this.dialog.open(Undo979Tag, {
            width: "500px",
            height: "auto",
            disableClose: true,
            data: {
                lCustomers: this.lCustomersForUndoScreen
            }
        });
        dialogRef.afterClosed().subscribe(
            result => {
            });

    }

    viewLogs() {
        this.router.navigate(["/cls-extract-viewlogs"]);
    }

    removeAriaDescribedByAttribute(elementId: string) {
        document.getElementById(elementId).removeAttribute('aria-describedby');
    }
}
