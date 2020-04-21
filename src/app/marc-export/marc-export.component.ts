import { Component, OnInit, AfterViewChecked, ViewChild, ElementRef, ViewChildren, QueryList, OnDestroy, AfterViewInit } from '@angular/core';
import { MarcExportService } from '../services/marc-export.service';
import { SpinnerService } from '../shared/interceptor/spinner.service';
import { MarcExportState } from './marcexport-state';
import { MarcSettingsService } from '../services/marc-settings.service';
import { ExportMarcConfigData, KeyValue } from '../marc/shared/marc';
import { NgForm, FormControl, FormGroup, AbstractControl, ValidatorFn, ValidationErrors, Validators, FormBuilder, FormGroupDirective } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../security/authentication.service';
import { User } from '../security/user';
import { MarcExport } from './marcexport';
import { SubSink } from 'subsink';
import { MatDialog, MatDialogRef } from '@angular/material';
import { ConfirmationDialogComponent } from '../components/shared/confirmation-dialog/confirmation-dialog.component';
import { Observable, of } from 'rxjs';
import { Location } from '@angular/common';
import { startWith, map } from 'rxjs/operators';
import { DateRangeValidator } from './Validator/daterange-validator';
import { UtilService } from '../shared/util.service';
import * as _moment from 'moment';
import { DateTimeAdapter, OWL_DATE_TIME_FORMATS, OWL_DATE_TIME_LOCALE } from 'ng-pick-datetime';
import { MomentDateTimeAdapter, OWL_MOMENT_DATE_TIME_FORMATS } from 'ng-pick-datetime-moment';
import { FormModuleCanDeactivate } from '../can-deactivate/form-can-deactivate';
import { NonZeroNumberValidator } from './Validator/nonzero-number-validator';
import { RecordNumberRangeValidator } from './Validator/recordnumber-range-validator';
import { Title } from '@angular/platform-browser';
declare var $: any;
const moment = require('moment-timezone');

@Component({
  selector: 'app-marcexport',
  templateUrl: './marc-export.component.html',
  providers:[
    {provide:DateTimeAdapter, useClass: MomentDateTimeAdapter, deps: [OWL_DATE_TIME_LOCALE] },
    {provide:OWL_DATE_TIME_FORMATS, useValue: OWL_MOMENT_DATE_TIME_FORMATS },
  ]
})
export class MarcExportComponent extends FormModuleCanDeactivate implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {

  @ViewChild('startDt') startDateTimeCtrl: ElementRef;
  @ViewChild('endDt') endDateTimeCtrl: ElementRef;
  @ViewChild('paramSet') parameterSetNameCtrl: ElementRef;
  @ViewChild(FormGroupDirective) formGroupDir: FormGroupDirective;
  form: FormGroup;
  get parameterSetName() { return this.form.get('parameterSetName'); }
  get dateRange() { return this.form.get('dateRange'); }
  get startDateTime() { return this.form.get('dateRange').get('startDateTime'); }
  get endDateTime() { return this.form.get('dateRange').get('endDateTime'); }
  get ofTagIndicators() { return this.form.get('ofTagIndicators'); }

  get chkCtrlNumberPrefix() { return this.form.get('chkCtrlNumberPrefix'); }
  get dates() { return this.form.get('dates'); }
  get startingRecordNumber() { return this.form.get('startingRecordNumber'); }
  get endingRecordNumber() { return this.form.get('endingRecordNumber'); }

  cWidowHeight: number;
  cHeaderHeight: number;
  cSearchHeight: number;
  cNavHeight: number;
  headerHeight: number;
  newHeight: number;
  newUserHeight: number;
  marcExportState: MarcExportState;
  selectedAll = false;
  maxLength = 3;
  currentUser: User;
  private subSink = new SubSink();
  public maxDateTime: Date = moment.tz(Date.now(), 'America/New_York');
  parameterSetOptions: string[] = [];
  filteredOptions: Observable<string[]>;
  executeDisable = false;
  startRecordNoWarn = false;
  endRecordNoWarn = false;
  newConfigId: string;
  myControl = new FormControl();
  controlNoPrefix: boolean = false;


  constructor(private service: MarcExportService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private spinnerService: SpinnerService,
    private marcSettingsService: MarcSettingsService,
    private location: Location,
    private router: Router,
    private route: ActivatedRoute,
    private _titleService: Title,
    private authenticationService: AuthenticationService,
    private utilService: UtilService) {
    super(router, authenticationService);
  }

  ngOnInit(): void {
    if (this.route.snapshot && this.route.snapshot.data['title'] && this.route.snapshot.data['title'].length > 0) {
      let title = this.route.snapshot.data['title'];
      this._titleService.setTitle(title);
    }
    this.setESTTime();
    this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
    this.setMarcConfigState();
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

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.parameterSetOptions.filter(option => option.toLowerCase().includes(filterValue));
  }

  filterParams(name: string) {
    return this.marcExportState.marcExportConfigList.filter(list =>
      list.parameterSetName.toLowerCase().indexOf(name.toLowerCase()) === 0);
  }
  ngAfterViewInit(): void {
    this.buildForm();
  }

  buildForm() {
    this.form = this.fb.group({
      parameterSetName: ['', Validators.required],
      dateRange: this.fb.group({
        startDateTime: ['', Validators.required],
        endDateTime: ['', Validators.required]
      }, { validators: DateRangeValidator }),
      ofTagIndicators: ['', Validators.required],
      chkCtrlNumberPrefix: ['', Validators.required],

      startingRecordNumber: [''],
      endingRecordNumber: [''],
    }, { updateOn: 'blur' });
  }
  setMarcConfigState() {
    this.spinnerService.spinnerStart();
    this.newConfigId = '';
    this.controlNoPrefix = false;
    this.subSink.sink = this.service.getAllMarcExportConfig().subscribe(config => {
      this.initializeState(config);
      this.spinnerService.spinnerStop();
    },
      err => {
        if (err.status === 404) {
          this.initializeState(null);
        }
        this.spinnerService.spinnerStop();
      }, () => {
        this.marcExportState.filteredConfigList = this.parameterSetName.valueChanges
          .pipe(
            startWith(''),
            map(state => state ? this.filterParams(state) : this.marcExportState.marcExportConfigList.slice())
          );
      });
  }
  ngAfterViewChecked() {
    //this.maxDateTime=moment(Date.now()).utcOffset('-0500');
    // set the page hight based on the expand and collapse search icon.
    this.customHeightFunction();

    $(window).resize(_ => {
      this.customHeightFunction();
    });

    $('.owl-dt-calendar-table-divider').append('<span class=\'sr-only\'> calendar test </span>');
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  initializeState(config: MarcExport[]): void {
    const marcExport = this.getDefaultState();
    const configData = this.marcSettingsService.getExportMarcConfigData();
    configData.tagIndicatorsKeyValue = configData.tagIndicatorsKeyValue.sort(this.utilService.compare);
    //configData.marcFormatKeyValue = configData.marcFormatKeyValue.sort(this.utilService.compare);
    const sortedConfig = config.sort((a, b) => (a.parameterSetName > b.parameterSetName) ? 1 : -1);
    this.marcExportState = {
      currentMarcExportConfig: marcExport,
      marcExportConfigList: sortedConfig ? sortedConfig : [],
      filteredConfigList: sortedConfig ? of(sortedConfig) : of([]),
      exportMarcConfigData: configData,
      lastParamSet: null,
      isParamSetModified: false,
      paramFocused: true,
      startDateFocused: false,
      endDateFocused: false,
      tagIndicatorFocused: false,

      ctrlPrefixFocused: false,
      toFocused: false
    };
    if (this.marcExportState != null && this.marcExportState.marcExportConfigList.length != 0) {

      this.marcExportState.marcExportConfigList.forEach(config => {
        this.parameterSetOptions.push(config.parameterSetName);
      });
    }
    this.filteredOptions = this.parameterSetName.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filter(value))
      );
  }
  getDefaultState(): MarcExport {
    const marcExport: MarcExport = {
      id: '',
      parameterSetName: '',
      startDateTime: null,
      endDateTime: null,
      tagIndicatorCount: '',
      ctrlNumberPrefix: [],

      renumberTags: [],
      tagsToDelete: [],
      tagsToRetain: [],
      createdBy: this.currentUser ? this.currentUser.UserName : '',
      createdDate: null,
      modifiedBy: this.currentUser ? this.currentUser.UserName : '',
      modifiedDate: null,
      startingRecordNumber: null,
      endingRecordNumber: null
    };
    return marcExport;
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
    this.newUserHeight = this.newHeight - 32;
  }
  onTagIndicatorChange(event) {
    this.marcExportState.currentMarcExportConfig.tagIndicatorCount = event.target.value;
    this.form.markAsDirty();
  }
  onStartandEndChange(event: any, type: string) {
    if (type === "from")
      this.marcExportState.currentMarcExportConfig.startingRecordNumber = event.target.value;
    else if (type === "to")
      this.marcExportState.currentMarcExportConfig.endingRecordNumber = event.target.value;
  }
  onBlur(event) {
    if (event.relatedTarget && event.relatedTarget.nodeName === 'MAT-OPTION') {
      this.marcExportState.paramFocused = true;
      this.marcExportState.startDateFocused = true;
      this.marcExportState.endDateFocused = true;
      this.marcExportState.tagIndicatorFocused = true;

      this.marcExportState.ctrlPrefixFocused = true;
      this.marcExportState.toFocused = true;
    } else {
      this.marcExportState.paramFocused = false;
      this.marcExportState.startDateFocused = false;
      this.marcExportState.endDateFocused = false;
      this.marcExportState.tagIndicatorFocused = false;

      this.marcExportState.ctrlPrefixFocused = false;
      this.marcExportState.toFocused = false;
    }
    if (event.srcElement && event.srcElement.value) {
      const value = event.srcElement.value;
      this.setConfigState(value);
    }
  }
  // ParamSet Change Event
  selectedParamSet(paramSetName) {
    if (paramSetName) {
      this.form.markAsPristine();
      this.executeDisable = true;
      this.marcExportState.isParamSetModified = false;
      this.setConfigState(paramSetName);
    }
  }

  onChangeParameterSet(event) {
    this.marcExportState.isParamSetModified = true;
    if (event.srcElement && event.srcElement.value) {
      const value = event.srcElement.value;
      // tslint:disable-next-line: max-line-length
      this.marcExportState.filteredConfigList = of(this.marcExportState.marcExportConfigList.filter(c => c.parameterSetName.startsWith(value)));
    }
  }

  setConfigState(paramSetName: string) {
    const marcExports = this.marcExportState.marcExportConfigList.find(x => x.parameterSetName === paramSetName);
    if (marcExports) {
      this.marcExportState.currentMarcExportConfig = Object.assign({}, marcExports);
      this.marcExportState.lastParamSet = this.marcExportState.currentMarcExportConfig.parameterSetName;
      this.marcExportState.filteredConfigList = of([]);
      let selectAll = true;
      this.marcExportState.exportMarcConfigData.ctrlNumberPrefixValues.forEach(
        ele => {
          if (!this.marcExportState.currentMarcExportConfig.ctrlNumberPrefix.includes(ele)) {
            selectAll = false;
          }
        }
      )

      // if(!this.marcExportState.currentMarcExportConfig.ctrlNumberPrefix.includes("0") && this.marcExportState.exportMarcConfigData.ctrlNumberPrefixValues.length ===
      //    this.marcExportState.currentMarcExportConfig.ctrlNumberPrefix.length)
      if (selectAll) {
        this.marcExportState.currentMarcExportConfig.ctrlNumberPrefix.push("0");
      }
      else {
        if (this.marcExportState.currentMarcExportConfig.ctrlNumberPrefix.includes("0")) {
          var index = this.marcExportState.currentMarcExportConfig.ctrlNumberPrefix.indexOf('0');
          if (index > -1) {
            this.marcExportState.currentMarcExportConfig.ctrlNumberPrefix.splice(index, 1);
          }
        }
      }

    }
  }


  // Picker Events
  pickerStartDateClosed() {
    if (this.startDateTimeCtrl && this.startDateTimeCtrl.nativeElement) {
      this.startDateTimeCtrl.nativeElement.focus();
    }
  }

  pickerStartDateOpen() {
    if (this.marcExportState && this.marcExportState.currentMarcExportConfig) {
      if (this.marcExportState.currentMarcExportConfig.startDateTime == null) {
        var est = moment.tz(Date.now(), 'America/New_York');
        var month = est.format('MM');
        var day = est.format('DD');
        var year = est.format('YYYY');
        var hour = est.format('HH');
        var minutes = est.format('mm');
        this.maxDateTime = new Date(Number(year), (Number(month) - 1), Number(day), Number(hour), Number(minutes));
        this.marcExportState.currentMarcExportConfig.startDateTime = new Date(Number(year), (Number(month) - 1), Number(day), Number(hour), Number(minutes));
      }
    }
  }

  pickerEndDateOpen() {
    if (this.marcExportState && this.marcExportState.currentMarcExportConfig) {
      if (this.marcExportState.currentMarcExportConfig.endDateTime == null) {
        var est = moment.tz(Date.now(), 'America/New_York');
        var month = est.format('MM');
        var day = est.format('DD');
        var year = est.format('YYYY');
        var hour = est.format('HH');
        var minutes = est.format('mm');
        this.maxDateTime = new Date(Number(year), (Number(month) - 1), Number(day), Number(hour), Number(minutes));
        this.marcExportState.currentMarcExportConfig.endDateTime = new Date(Number(year), (Number(month) - 1), Number(day), Number(hour), Number(minutes));
        //this.marcExportState.currentMarcExportConfig.endDateTime= moment(Date.now()).utcOffset('-0500');
      }
    }
  }

  pickerEndDateClosed(event) {
    if (this.endDateTimeCtrl && this.endDateTimeCtrl.nativeElement) {
      this.endDateTimeCtrl.nativeElement.focus();
    }
  }
  // Button events
  execute() {
    if (this.form.valid) {
      this.spinnerService.spinnerStart();
      var start = moment(this.marcExportState.currentMarcExportConfig.startDateTime).format('YYYY-MM-DDTHH:mm:ss');
      var end = moment(this.marcExportState.currentMarcExportConfig.endDateTime).format('YYYY-MM-DDTHH:mm:ss');
      // tslint:disable-next-line: max-line-length
      this.subSink.sink = this.service.executeMarcExportConfig(this.marcExportState.currentMarcExportConfig, this.currentUser.UserName, start, end)
        .subscribe(val => {
          this.spinnerService.spinnerStop();
          const output = val.Message;
          const message = (output === 'Export Job already started with the given criteria' ? output : `MARCout process started successfully !`);
          const dialogRef = this.confirmationMessage(message, false);
          dialogRef.afterClosed().subscribe(
            result => {
              if (result) {
                // this.parameterSetNameCtrl.nativeElement.focus();
              }
            },
            error => { },
            () => console.log('completed')
          );
        });
    }
  }
  save() {
    if (this.form.valid) {
      this.spinnerService.spinnerStart();
      //  const filteredctrlNumberPrefix = this.marcExportState.currentMarcExportConfig.ctrlNumberPrefix.filter(item => item !== '0');
      // this.marcExportState.currentMarcExportConfig.ctrlNumberPrefix = filteredctrlNumberPrefix;
      if (this.marcExportState.currentMarcExportConfig.createdBy === '') {
        this.marcExportState.currentMarcExportConfig.createdBy = this.currentUser ? this.currentUser.UserName : '';
        this.marcExportState.currentMarcExportConfig.modifiedBy = this.currentUser ? this.currentUser.UserName : '';
      } else {
        this.marcExportState.currentMarcExportConfig.modifiedBy = this.currentUser ? this.currentUser.UserName : '';
      }
      const currentConfigState = this.marcExportState.marcExportConfigList.filter(c => c.parameterSetName ===
        this.marcExportState.currentMarcExportConfig.parameterSetName);
      if (currentConfigState.length === 0) {
        this.marcExportState.currentMarcExportConfig.createdDate = null;
        this.marcExportState.currentMarcExportConfig.modifiedDate = null;
      } else {
        this.marcExportState.currentMarcExportConfig.modifiedDate = null;
      }
      // tslint:disable-next-line: max-line-length
      this.marcExportState.currentMarcExportConfig.startDateTime = moment.tz(this.marcExportState.currentMarcExportConfig.startDateTime, 'America/New_York').format();
      // tslint:disable-next-line: max-line-length
      this.marcExportState.currentMarcExportConfig.endDateTime = moment.tz(this.marcExportState.currentMarcExportConfig.endDateTime, 'America/New_York').format();
      const newConfig = this.marcExportState.marcExportConfigList
        .filter(val => val.parameterSetName.toLowerCase() ===
          this.marcExportState.currentMarcExportConfig.parameterSetName.toLowerCase());
      if (newConfig.length === 0) {
        this.marcExportState.currentMarcExportConfig.id = '';
      }

      if (this.newConfigId && newConfig.length === 0) {
        this.marcExportState.currentMarcExportConfig.id = this.newConfigId;
      }
      this.subSink.sink = this.service.saveMarcExportConfig(this.marcExportState.currentMarcExportConfig).subscribe(result => {
        this.spinnerService.spinnerStop();
        this.form.markAsPristine();
        this.formGroupDir.ngSubmit.emit();
        (this.formGroupDir as any).submitted = true;
        this.postSaveOperation(result);
      });
    }
  }
  postSaveOperation(result: any) {
    let message;
    if (result) {
      message = `Parameter ${this.marcExportState.currentMarcExportConfig.parameterSetName} Saved Successfully !`;
      const dialogRef = this.confirmationMessage(message, false);
      this.subSink.sink = dialogRef.afterClosed().subscribe(val => {
        if (val) {
          this.newConfigId = result.Message;
          // this.form.reset();
          // this.setMarcConfigState();
          //  this.parameterSetNameCtrl.nativeElement.focus();
        }
      },
        err => {
          // TODO: Write to Telemetry
          console.log(err.message);
        });
    }
  }
  back() {
    if (this.form && this.form.dirty) {
      const message = 'There are unsaved changes. Are you sure you want to leave this page? ';
      const dialogRef = this.confirmationMessage(message, true);
      dialogRef.afterClosed().subscribe(
        result => {
          if (result) {
            this.location.back();
          }
        },
        error => { },
        () => console.log('completed')
      );
    } else {
      this.location.back();
    }
  }
  newState() {
    const message = 'Are you sure you want to reset the configuration? ';
    const dialogRef = this.confirmationMessage(message, true);
    dialogRef.afterClosed().subscribe(
      result => {
        if (result) {
          this.parameterSetOptions = [];
          this.form.markAsPristine();
          this.form.markAsUntouched();
          this.setMarcConfigState();
          //this.parameterSetNameCtrl.nativeElement.focus();
        } else { this.form.markAsDirty(); }
      },
      error => { },
      () => console.log('completed')
    );
  }
  cancel() {
    const message = 'Are you sure you want to reset the configuration to previous active state? ';
    const dialogRef = this.confirmationMessage(message, true);
    dialogRef.afterClosed().subscribe(
      result => {
        if (result) {
          this.form.markAsPristine();
          const paramName = this.marcExportState.lastParamSet;
          const savedConfig = paramName ? this.marcExportState.marcExportConfigList.find(x => x.parameterSetName === paramName) : null;
          if (savedConfig) {
            this.marcExportState.currentMarcExportConfig = Object.assign({}, savedConfig);
            this.marcExportState.filteredConfigList = of([]);
          } else {
            this.form.markAsUntouched();
            this.setMarcConfigState();
          }
          //this.parameterSetNameCtrl.nativeElement.focus();
        } else { this.form.markAsDirty(); }
      },
      error => { },
    );
  }
  confirmationMessage(message, isCancelConfirm): MatDialogRef<ConfirmationDialogComponent, any> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      height: 'auto',
      disableClose: true,
      data: {
        isCopyErrorMsg: false,
        isCancelConfirm: isCancelConfirm,
        message
      }
    });
    return dialogRef;
  }
  // Validators
  validateStartDate() {
    if (this.startDateTime.errors && !this.marcExportState.startDateFocused) {
      if (this.startDateTime.errors.owlDateTimeParse) {
        return 'Invalid';
      } else if (this.startDateTime.errors.owlDateTimeMax) {
        return 'State Date cannot be greater than current date';
      } else if (this.startDateTime.errors.required) {
        return 'Required';
      }
    }
    else if (this.dateRange.errors && this.dateRange.errors.invalidDateRange) {
      return 'Start DateTime should be before End DateTime';
    }
  }
  validateEndDate() {
    if (this.endDateTime.errors && !this.marcExportState.endDateFocused) {
      if (this.endDateTime.errors.owlDateTimeParse) {
        return 'Invalid';
      } else if (this.endDateTime.errors.owlDateTimeMax) {
        return 'End Date cannot be greater than current date';
      } else if (this.endDateTime.errors.required) {
        return 'Required';
      }
    } else if (this.dateRange.errors && this.dateRange.errors.invalidDateRange) {
      return 'End DateTime should be after Start DateTime';
    }
  }
  validateParam() {
    if (this.parameterSetName.errors && !this.marcExportState.paramFocused) {
      if (this.parameterSetName.errors.required) {
        return 'Required';
      }
    }
  }
  validateTagIndicator() {
    if (this.ofTagIndicators.errors && !this.marcExportState.tagIndicatorFocused) {
      if (this.ofTagIndicators.errors.required) {
        return 'Required';
      }
    }
  }

  validatectrlPrefix() {
    if (this.chkCtrlNumberPrefix.errors) {
      if (this.chkCtrlNumberPrefix.errors.required) {
        return 'Required';
      }
    }
  }

  validateStartRecordNumber() {
    // if (this.startingRecordNumber.errors) {
    //   if (this.startingRecordNumber.errors.invalidRecordNumberRange) {
    //     return 'Ending Record No should be greater than Starting Record No';
    //   } else if (this.startingRecordNumber.errors.numberZero) {
    //     return 'Starting Record No cannot be 0';
    //   } else if (this.startingRecordNumber.errors.required) {
    //     return 'Starting Record No cannot be empty';
    //   }
    // }
    this.startRecordNoWarn = false;
    var startingNo = this.marcExportState.currentMarcExportConfig.startingRecordNumber;
    var endingNo = this.marcExportState.currentMarcExportConfig.endingRecordNumber;
    if ((startingNo != null && startingNo.toString() != "")) {
      if (Number(startingNo) == 0) {
        this.form.setErrors({ 'incorrect': true });
        this.startRecordNoWarn = true;
        return 'Starting Record No cannot be 0';
      }

    }
    else if (((endingNo != null && endingNo.toString() != "" && endingNo.toString() != "0"))) {
      this.startRecordNoWarn = true;
      this.form.setErrors({ 'incorrect': true });
      return 'Starting Record No cannot be empty';
    }
  }

  validateEndRecordNumber() {
    // if (this.startingRecordNumber.errors) {
    //   if (this.startingRecordNumber.errors.invalidRecordNumberRange) {
    //     return 'Ending Record No should be greater than Starting Record No';
    //   } else if (this.startingRecordNumber.errors.numberZero) {
    //     return 'Starting Record No cannot be 0';
    //   } else if (this.startingRecordNumber.errors.required) {
    //     return 'Starting Record No cannot be empty';
    //   }
    // }
    this.endRecordNoWarn = false;
    var startingNo = this.marcExportState.currentMarcExportConfig.startingRecordNumber;
    var endingNo = this.marcExportState.currentMarcExportConfig.endingRecordNumber;
    if ((endingNo != null && endingNo.toString() != "") && (startingNo != null && startingNo.toString() != "")
      && (endingNo.toString() != "0" && startingNo.toString() != "0")) {
      if (Number(endingNo) <= Number(startingNo)) {
        this.form.setErrors({ 'incorrect': true });
        this.endRecordNoWarn = true;
        return 'Ending Record No should be greater than Starting Record No';
      }
    }
    else if ((endingNo != null && endingNo.toString() != "")) {
      if (Number(endingNo) == 0) {
        this.form.setErrors({ 'incorrect': true });
        this.endRecordNoWarn = true;
        return 'Ending Record No cannot be 0';
      }
    }
    else if (((startingNo != null && startingNo.toString() != "" && startingNo.toString() != "0")) && !this.marcExportState.toFocused && this.endingRecordNumber.touched) {
      this.endRecordNoWarn = true;
      this.form.setErrors({ 'incorrect': true });
      return 'Ending Record No cannot be empty';
    }

  }

  controlNoPrefixBlur() {
    if (this.marcExportState.currentMarcExportConfig.ctrlNumberPrefix.length == 0)
      this.controlNoPrefix = true;
  }
}
