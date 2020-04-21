import { ICopyPasteHandler } from './../shared/service/marc-base-adapter';
import {
  Component,
  OnInit,
  ViewChild,
  AfterViewChecked,
  EventEmitter,
  ChangeDetectorRef,
  ViewChildren,
  QueryList,
  AfterViewInit,
  Renderer2,
  ChangeDetectionStrategy,
  OnDestroy,
  Inject,
  ElementRef,
  HostListener,
  Output,
  Input
} from '@angular/core';
import {
  MarcEditorSettings,
  MarcField,
  MarcSubField,
  MarcIndicator,
  MarcBibData,
  Marc
} from '../shared/marc';
import { MarcService } from '../shared/service/marc-service';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Constants } from 'src/app/constants/constants';
import { NgForm, ControlContainer } from '@angular/forms';
import { FormCanDeactivate } from 'src/app/can-deactivate/form-can-deactivate';
import { CommonService } from 'src/app/shared/service/common.service';
import { ConfirmationDialogComponent } from 'src/app/components/shared/confirmation-dialog/confirmation-dialog.component';
// tslint:disable-next-line: max-line-length
import { MatDialog, MatAutocompleteTrigger, _countGroupLabelsBeforeOption, _getOptionScrollPosition, AUTOCOMPLETE_PANEL_HEIGHT, MatDialogRef } from '@angular/material';
import { Title, DOCUMENT } from '@angular/platform-browser';
import * as $ from 'jquery';
import { SpinnerService } from 'src/app/shared/interceptor/spinner.service';
import { TextEditorComponent } from '../shared/text-editor/texteditor.component';
import { PreviousRouteService } from 'src/app/services/previousRouteService';
import { SubSink } from 'subsink';
import { MarcDTO, MarcSubFieldDTO, MarcFieldDTO, EventParams, EditTagDTO, MarcFieldUpdateEventParams, CopyPasteEventParams } from 'src/app/_dtos/btcat.vm.dtos';
import { DropResult } from 'ngx-smooth-dnd';
import { PageScrollService } from 'ngx-page-scroll-core';
import { ClonerService } from 'src/app/services/cloner.service';
import { MarcFieldComponent } from '../shared/marc-field/marc-field.component';
import { MarcAdapter } from '../shared/service/marc-adapter.service';
import { MarcSettingsService } from 'src/app/services/marc-settings.service';
import { MarcState } from '../shared/store/marc-state';
import { AuthenticationService } from 'src/app/security/authentication.service';
import { Permissions } from 'src/app/security/permissions';
import { UserDetail } from 'src/app/login/login';
import { PrintService } from 'src/app/shared/service/print.service';
import {saveAs as importedSaveAs} from 'file-saver'
import { Hotkey, HotkeysService } from 'angular2-hotkeys';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { TagCreateComponent } from '../shared/tag-create/tag-create.component';
import { ScrollDispatcher } from '@angular/cdk/overlay';
import { MarcEditContainerAdapterService } from '../marc-edit-container/marc-edit-container-adapter.service';
declare const CodeMirror: any;
declare var $: any;

@Component({
  selector: 'marc-create',
  templateUrl: './marc-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    { provide: ControlContainer, useExisting: NgForm }
  ]
})
export class MarcCreateComponent extends FormCanDeactivate
  implements ICopyPasteHandler, OnDestroy, AfterViewInit, AfterViewChecked, OnInit {
  isActive: boolean;

  get leaderData(): string {
    return this.marcState.leaderDataValue;
  }
  get toBeRemovedTags(): EditTagDTO[] {
    return this.marcState.toBeRemovedTags;
  }

  constructor(
    private service: MarcService,
    private marcSettingsService: MarcSettingsService,
    public marcAdapter: MarcAdapter,
    private route: ActivatedRoute,
    private _location: Location,
    private scroll: ScrollDispatcher,
    private renderer2: Renderer2,
    private commonService: CommonService,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private _titleService: Title,
    private spinnerService: SpinnerService,
    private previousRouteService: PreviousRouteService,
    private pageScrollService: PageScrollService,
    @Inject(DOCUMENT) private document: any,
    private clonerService: ClonerService,
    private authenticationService: AuthenticationService,
    private printService: PrintService,
    private hotkeysService: HotkeysService,
    private configurationService:ConfigurationService
  ) {
    super(router, authenticationService);
    this.loadMarcSettings();
    this.loadHotKeys();
    this.maxRecordLength = configurationService.currentConfiguration().maxRecordLength;
  }
  @ViewChildren(MatAutocompleteTrigger, { read: MatAutocompleteTrigger }) matAutocompleteTrigger: QueryList<MatAutocompleteTrigger>;
  @ViewChildren('marcField') marcFields: QueryList<MarcFieldComponent>;
  @ViewChild('form') form: NgForm;
  @ViewChild('addNewBtn') addnewBtn: ElementRef;
  @Input() marcState: MarcState;
  @Input() recordSource:string;
  @Output() outputEvent: EventEmitter<MarcState> = new EventEmitter<MarcState>();
  @Output() saveEvent: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() backEvent: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() offsetHeight = 165;
  marcId: string;
  marc: Marc;
  existingMARCData: MarcBibData[] = [];
  canMoveNextByMaxLength = true;
  searchCount: any;
  marcSettings: MarcEditorSettings;
  CWidowHeight: number;
  CHeaderHeight: number;
  CSearchHeight: number;
  CNavHeight: number;
  HeaderHeight: number;
  NewHeight: number;


  operationType: string;
  cloneMode: boolean = false;
  id: string;
  mandatoryerrorMsg = '';
  heading = 'Bibliographic Record';
  leaderDataWithHyphons: string;
  private subs = new SubSink();
  warningDialogRef: MatDialogRef<ConfirmationDialogComponent, any>;
  //Print MARC
  lineSpaceSelection: string = '2';
  // Download MARC
  fileData: File = null;
  savetoCustomerWS: boolean = false;
  isAutoScroll = true;

  orsNumber: string = '';
  subsink = new SubSink();

  isAltMPressed: boolean = false;
  isAltWPressed: boolean = false;
  isAltLPressed: boolean = false;
  isCtrlMPressed: boolean = false;
  isCtrlWPressed: boolean = false;
  isCtrlLPressed: boolean = false;
  maxRecordLength: number = 10;

  // Life Cycle Events
  ngAfterViewInit(): void {
    this.subs.sink = this.matAutocompleteTrigger.changes.subscribe((trigger) => {
      trigger.toArray().map((item) => {
        // set default scroll position to 0
        item.autocomplete._setScrollTop(0);
        item._scrollToOption = () => {
          const index: number = item.autocomplete._keyManager.activeItemIndex || 0;
          const labelCount = _countGroupLabelsBeforeOption(index, item.autocomplete.options, item.autocomplete.optionGroups);
          // tslint:disable-next-line: max-line-length
          const newScrollPosition = _getOptionScrollPosition(index, 25, item.autocomplete._getScrollTop(), AUTOCOMPLETE_PANEL_HEIGHT);
          item.autocomplete._setScrollTop(newScrollPosition);
        };
      });
    });
  }
  @HostListener('window:beforeunload')
  @HostListener('window:keydown', ['$event'])
  keyEvent(event: KeyboardEvent) {
    //Check whether the browser is Safari or not
    //If it is Safari then use keys Control+m , Control+w, Control+l for Saving record to Main, Workspace and Customer Workspace resply
    //Else use keys Alt+m , Alt+w, Alt+l for Saving record to Main, Workspace and Customer Workspace resply
    var isSafari = /Apple Computer/.test(window.navigator.vendor);
    if (isSafari) {
      //Print selected MARC record on Key 'Control+P' press
      if (event.ctrlKey && event.keyCode === 80 && !this.spinnerService._loading && !$('#printInfoEdit').is(':visible')) { //'P' key value is 80
        if ($('.modal-backdrop').length > 0 || $('.cdk-overlay-dark-backdrop').length > 0) {
          return;
        } this.lineSpaceSelection = '2';
        document.getElementById('btnPrintView').click();
      }
      //Save data to Main
      if (event.ctrlKey && event.keyCode === 77 && !this.spinnerService._loading && !this.isCtrlMPressed) { //'m' key value is 77
        //this.saveMarcRecordToMain(this.form);
        if ($('.modal-backdrop').length > 0 || $('.cdk-overlay-dark-backdrop').length > 0) {
          return;
        }
        document.getElementById('btnSaveToMain').click();
        this.isCtrlMPressed = true;
        event.preventDefault();
        event.stopPropagation();
        event.returnValue = false;
      }
      //Save data to Workspace
      if (event.ctrlKey && event.keyCode === 87 && !this.spinnerService._loading && !this.isCtrlWPressed) { //'w' key value is 87
        //this.saveMarcRecordToWorkSpace(this.form);
        if ($('.modal-backdrop').length > 0 || $('.cdk-overlay-dark-backdrop').length > 0) {
          return;
        }
        document.getElementById('btnSaveToWS').click();
        this.isCtrlWPressed = true;
        event.preventDefault();
        event.stopPropagation();
        event.returnValue = false;
      }
      //Save data to CLS Customer Workspace
      if (event.ctrlKey && event.keyCode === 76 && !this.spinnerService._loading && !this.isCtrlLPressed) { //'l' key value is 76
        //this.saveMarcRecordToCutomerWorkSpace(this.form);
        if ($('.modal-backdrop').length > 0 || $('.cdk-overlay-dark-backdrop').length > 0) {
          return;
        }
        var btnSaveCusWs = document.getElementById('btnSaveToCusWS');
        if (btnSaveCusWs) {
          btnSaveCusWs.click();
          this.isCtrlLPressed = true;
          event.preventDefault();
          event.stopPropagation();
          event.returnValue = false;
        }
      }
      //Generate ORS
      if (event.ctrlKey && event.keyCode === 82 && !this.spinnerService._loading && this.operationType === 'z3950-edit') { //'r' key value is 82
        //this.generateORSNumber(this.form);
        if ($('.modal-backdrop').length > 0 || $('.cdk-overlay-dark-backdrop').length > 0) {
          return;
        }
        document.getElementById('addORSField').focus();
        document.getElementById('addORSField').click();
        event.preventDefault();
        event.stopPropagation();
        event.returnValue = false;
      }
    }
    else {
      //Print selected MARC record on Key 'Alt+P' press
      if (event.altKey && event.keyCode === 80 && !this.spinnerService._loading && !$('#printInfoEdit').is(':visible')) { //'P' key value is 80
        if ($('.modal-backdrop').length > 0 || $('.cdk-overlay-dark-backdrop').length > 0) {
          return;
        } this.lineSpaceSelection = '2';
        document.getElementById('btnPrintView').click();
      }
      //Save data to Main
      if (event.altKey && event.keyCode === 77 && !this.spinnerService._loading && !this.isAltMPressed) { //'m' key value is 77
        //this.saveMarcRecordToMain(this.form);
        if ($('.modal-backdrop').length > 0 || $('.cdk-overlay-dark-backdrop').length > 0) {
          return;
        }
        document.getElementById('btnSaveToMain').click();
        this.isAltMPressed = true;
        event.preventDefault();
        event.stopPropagation();
        event.returnValue = false;
      }
      //Save data to Workspace
      if (event.altKey && event.keyCode === 87 && !this.spinnerService._loading && !this.isAltWPressed) { //'w' key value is 87
        //this.saveMarcRecordToWorkSpace(this.form);
        if ($('.modal-backdrop').length > 0 || $('.cdk-overlay-dark-backdrop').length > 0) {
          return;
        }
        document.getElementById('btnSaveToWS').click();
        this.isAltWPressed = true;
        event.preventDefault();
        event.stopPropagation();
        event.returnValue = false;
      }
      //Save data to CLS Customer Workspace
      if (event.altKey && event.keyCode === 76 && !this.spinnerService._loading && !this.isAltLPressed) { //'l' key value is 76
        //this.saveMarcRecordToCutomerWorkSpace(this.form);
        if ($('.modal-backdrop').length > 0 || $('.cdk-overlay-dark-backdrop').length > 0) {
          return;
        }
        var btnSaveCusWs = document.getElementById('btnSaveToCusWS');
        if (btnSaveCusWs) {
          btnSaveCusWs.click();
          this.isAltLPressed = true;
          event.preventDefault();
          event.stopPropagation();
          event.returnValue = false;
        }
      }
      //Generate ORS
      if (event.altKey && event.keyCode === 82 && !this.spinnerService._loading && this.operationType === 'z3950-edit') { //'r' key value is 82
        //this.generateORSNumber(this.form);
        if ($('.modal-backdrop').length > 0 || $('.cdk-overlay-dark-backdrop').length > 0) {
          return;
        }
        document.getElementById('addORSField').focus();
        document.getElementById('addORSField').click();
        event.preventDefault();
        event.stopPropagation();
        event.returnValue = false;
      }
    }
  }

  resetShortCutKeys() {
    this.isAltMPressed = false;
    this.isAltWPressed = false;
    this.isAltLPressed = false;
    this.isCtrlMPressed = false;
    this.isCtrlWPressed = false;
    this.isCtrlLPressed = false;
  }

  openPrintPopup(){
  this.lineSpaceSelection = '2';
  }

  ngOnDestroy(): void {
    //
    this.marcFields.forEach(x => {
      x.closeAutoComplete();
    });
    this.subs.unsubscribe();
  }
  ngAfterViewChecked() {
    this.CustomHeightFunction();
    $(window).resize(e => {
      this.CustomHeightFunction();
    });
  }
  // Needed & but refactoring needed
  ngOnInit() {
    this._titleService.setTitle('BTCAT | Create Record');
    this.recordSource = this.recordSource ? this.recordSource : this.commonService.getRecordSource();
    if (this.route.url && this.route.url['_value'] && this.route.url['_value'].length > 0) {
      this.operationType = this.route.url['_value'][0].path;
      if (this.operationType === 'z3950-clone') {
        this._titleService.setTitle('BTCAT | Clone Editor');
        //sessionStorage.setItem("z3950recordcount", "1");
      }
      if (this.operationType === 'multiple-edit') {
        this.operationType = 'z3950-edit';
      }
      if (this.operationType === 'z3950-edit') {
        this._titleService.setTitle('BTCAT | MARC Editor');
      }
    }
    if (this.operationType) {
      const type = this.operationType.split('-')[1];

      this.heading = type.charAt(0).toUpperCase() + type.slice(1) + ' ' + this.heading;
      this.cloneMode = this.operationType.indexOf('clone') != -1;
    }
    this.subs.sink = this.route.params.subscribe(params => {
      this.marcId = params.id; // (+) converts string 'id' to a number
      this.searchCount = params.count;
    });
    // Here condition to loadZ3950MarcDetails should be IsZ3050Search, not based on serachcount
    // if (this.searchCount === undefined) {
    if (this.commonService.isZ3950ProfileSearch()) {
      const recordLength=sessionStorage.getItem('z3950recordcount');
      this.searchCount=recordLength;
      this.loadZ3950MarcDetails();
    } else
      if (this.marcId && this.operationType) {
        this.LoadMarcDetails();
      }

    this.initializeCodeMirrorMode();
    this.handleScroll();
    this.scrollToTop();
  }
  scrollToTop() {
    this.marcAdapter.scrollToTop$.subscribe(isActivated => {
      this.pageScrollService.scroll({
        document: this.document,
        scrollTarget: `#marcRow0`,
        scrollViews: [document.getElementById('marceditgrid')]
      });
    });
  }
  handleScroll() {
    this.subsink.sink = this.scroll
          .scrolled()
          .subscribe(() => {
            if (this.isAutoScroll) {
              this.marcFields.forEach(x => {
                x.closeAutoComplete();
              });
            } else {
              this.isAutoScroll = true;
            }

          });
  }

  loadZ3950MarcDetails() {
    if (!this.marcState) {
      this.marc = JSON.parse(sessionStorage.getItem('z3950MarcItem'));
      this.subs.sink = this.marcAdapter.fetchZ3950Marc(this.marc, this.isExternalUser).subscribe(state => {
        this.marcState = state;
        this.updateZ3950FieldRules();
      });
    } else {
      this.updateZ3950FieldRules();
    }
  }

  updateZ3950FieldRules() {
    let result = null;
    if (window.location.href.search('z3950-edit') > 0 || this.operationType === 'z3950-edit') {
      result = this.marcState.marc.fields;
    } else {
      // tslint:disable-next-line: max-line-length
      result = this.marcState.marc.fields.filter(x => x.tag != '001' && x.tag != '003' && x.tag != '005' && x.tag != '010' && x.tag != '035' && x.tag != '919' && x.tag != '997' && x.tag != '949');
    }

    this.marcState.marc.fields = result;
    if (this.operationType === 'z3950-clone') {
      this.cloneRules(this.marcState.marc);
    }

    this.pageScrollService.scroll({
      document: this.document,
      scrollTarget: `#marcRow0`,
      scrollViews: [document.getElementById('marceditgrid')]
    });
  }

  // initalize code mirror mode
  initializeCodeMirrorMode() {
    CodeMirror.defineSimpleMode('simplemode', {
      start: [
        {
          regex: '\\' + this.marcSettings.delimiter + '[a-zA-Z0-9]{1}',
          token: 'keyword'
        },
        {
          regex: '\\' + this.marcSettings.delimiter,
          token: 'keyword'
        }
      ],
      meta: {
        dontIndentStates: ['comment'],
        lineComment: '//'
      }
    });
  }
  onFieldUpdate(eventargs: EventParams, field: MarcFieldDTO) {
    const index = eventargs.position > -1 ? eventargs.position : -1;
    this.subs.sink = this.marcAdapter.updateMarcField(field, index).subscribe(state => {
      this.validateMarcField(field);
      if (field.type === 'controlfield' || field.tag === '000') {
        if (field && field.isValid && (field.tag === '006' || field.tag === '000' || field.tag === '007' || field.tag === '008')) {
          field.isFieldExpandable = true;
          field.isFieldExpanded = false;
          this.marcFields.toArray()[index].showEditSubEle();
        }
      }
      this.marcState = state;
      this.outputEvent.emit(this.marcState);
    });

  }
  onBlurMarcField(eventargs: MarcFieldUpdateEventParams) {
    const field = eventargs.field ? eventargs.field : new MarcFieldDTO();
    const index = eventargs.position > -1 ? eventargs.position : -1;
    this.subs.sink = this.marcAdapter.blurMarcField(field, index).subscribe(state => {
      this.marcState = state;
    });
  }
  update008Data(item: any) {
    this.subs.sink = this.marcAdapter.updateMarcField008(item).subscribe(state => {
      this.marcState = state;
    });
  }
  validateMarcField(field: MarcFieldDTO) {
    if (!this.marcState.overrideMarc21) {
      if (field && field.tag && field.tag.length === 3 && field.isValid) {
        const selectedItem = this.existingMARCData.find(marcbib => marcbib.tag === (field.tag === '000' ? 'Leader' : field.tag));
        if (selectedItem) {
          field.type = selectedItem.type;
          if (!selectedItem.repeatable) {

            let findDuplicates = this.marcState.marc.fields.filter(h =>
              h.tag.includes(field.tag)
            );

            if (field.tag === '000') {
              findDuplicates = this.marcState.marc.fields.filter(h =>
                h.tag.includes(field.tag) || h.tag.includes('Leader')
              );
            }
            if (findDuplicates.length > 1) {
              field.isValid = false;
              field.errMsg = 'Not repeatable';
            }
          }
        }
      }
    }
  }
  // Private functions
  // Needed & Validated
  trackByFn(index: number, item: MarcFieldDTO) {
    return item.id;
  }
  CustomHeightFunction() {
    this.CWidowHeight = $(window).height();
    this.CHeaderHeight = $('app-header nav').height();
    this.CSearchHeight = $('app-search-box .search_filter').height();
    this.CNavHeight = $('.mainNavSection').height();
    this.HeaderHeight = this.CHeaderHeight + this.CSearchHeight + this.CNavHeight;
    this.NewHeight = this.CWidowHeight - this.HeaderHeight;
    // This is added to remove extra white spaces other than logo header, searchbar and Navigation bar
    this.NewHeight = this.NewHeight - 130;
    this.cdr.markForCheck();
  }
  // Needed, but use adapter service
  loadMarcSettings() {
    this.existingMARCData = this.marcSettingsService.getMarcBibData();
    this.marcSettings = this.marcSettingsService.getMarcSettingsData();
  }
  // Needed & but refactoring needed
  LoadMarcDetails() {
    if (this.marcId && this.operationType) {
      if (this.operationType && (this.operationType.indexOf('clone') > -1)) {
        this.spinnerService.onRequestStarted();
        this.subs.sink = this.marcAdapter.getClonedMarc(this.marcId).subscribe((item: MarcState) => {
          this.marcState = item;
          this.updatePreferenceForLocation(this.marcState);
          this.spinnerService.onRequestFinished();
        });
      } else {
        this.spinnerService.onRequestStarted();
        this.subs.sink = this.marcAdapter.getMarcTemplate(this.marcId).subscribe((item: MarcState) => {
          var leaderField = item.marc.fields.find(a => a.tag === 'Leader');
          if(leaderField){
            this.leaderDataWithHyphons = leaderField.data.replace(/ /g, '-');
            leaderField.data = leaderField.data.replace(/#/g, ' ');
            leaderField.subFieldDescription = leaderField.subFieldDescription.replace(/#/g, ' ');
          }
          this.marcState = item;
          this.recordSource = sessionStorage.getItem('marcRecordSource'); // TODO: Use common service to get the recordsource
          this.updatePreferenceForLocation(this.marcState);
          this.spinnerService.onRequestFinished();
        });
      }

    }
  }


  // z3950 clone
  CloneMarcRecord() {
    var marcItem = JSON.parse(sessionStorage.getItem('z3950MarcItem'));
    this.cloneRules(marcItem);
    this.commonService.setZ3950MarcItem(marcItem);
    this.router.navigate([
      '/z3950-clone'
    ]);
  }

  printMarcRecord() {
    const convertedMarc = this.clonerService.deepClone<MarcDTO>(this.marcState.marc);
    let finalDataArray = this.extractRecordFromFormControl(convertedMarc);
    convertedMarc.fields = finalDataArray;
    //******Print PDF Preview *******
    this.printService.generatePDFPrintPreview(convertedMarc, this.lineSpaceSelection);
    document.getElementById('closePrintViewBtn').click();
    this.lineSpaceSelection='2';
  }

  ClosePrintPopup(){
    document.getElementById('closePrintViewBtn').click();
    this.lineSpaceSelection='2';
  }

  extractRecordFromFormControl(marc: MarcDTO) {
    let isValid = true;

    let finalDataArray = [];
    const fixedFieldArray = [];
    let leaderField: any;
    if (marc && marc.fields && marc.fields.length > 0) {
      // Fixed Fields
      marc.fields.forEach(field => {
        if (
          field.tag &&
          field.tag != null &&
          field.tag.toString().trim() !== ''
        ) {
          field.tag = field.tag.toString();
          if (Constants.ControlFields.findIndex(t => t === field.tag) !== -1) {
            if (field.data != null) {
              field.data = field.data.replace(/#/g, ' ');
            }
            if (field.subFieldDescription != null) {
              field.subFieldDescription = field.subFieldDescription.replace(/#/g, ' ');
            }
            fixedFieldArray.push(field);
          } else if (field.tag === 'Leader') {
            leaderField = field;
          }
        }
      });

      if (fixedFieldArray && fixedFieldArray.length > 0) {
        finalDataArray = fixedFieldArray.sort((a, b) =>
          a.tag > b.tag ? 1 : b.tag > a.tag ? -1 : 0
        );
      }

      if (leaderField) {
        leaderField.data = leaderField.data.replace(/#/g, ' ');
        leaderField.subFieldDescription = leaderField.subFieldDescription.replace(/#/g, ' ');
        finalDataArray.unshift(leaderField);
      }
      // Sub fields
      marc.fields.forEach(field => {
        if (
          field.tag &&
          field.tag != null &&
          field.tag.toString().trim() !== ''
        ) {
          field.tag = field.tag.toString();
          if (
            !(
              Constants.ControlFields.findIndex(t => t === field.tag) !== -1 ||
              field.tag === 'Leader'
            )
          ) {
            if (
              field.subFieldDescription &&
              field.subFieldDescription != null &&
              field.subFieldDescription.trim() !== '' &&
              this.marcSettings.delimiter
            ) {
              const subFieldData = this.commonService.lTrim(field.subFieldDescription).split(this.marcSettings.delimiter);
              // const subFieldData = field.subFieldDescription.trim().split(this.marcSettings.delimiter);
              if (
                subFieldData &&
                subFieldData != null &&
                subFieldData.length > 1
              ) {
                if (subFieldData[0] === '' && subFieldData[1] !== '') {
                  const exitsubfileds = field.subfields;
                  field.subfields = [];
                  let i = 0;
                  subFieldData.forEach(f => {
                    const subField = new MarcSubFieldDTO();
                    if (f !== '') {
                      const code = f.charAt(0);
                      let data = '';
                      if (code && code != null && code !== '') {
                        data = f.slice(1);
                        // if (data && data != null && data.trim() !== '') {
                        //   if (data.slice(-1).trim() === '') {
                        //     data = data.slice(0, -1);
                        //   }
                        //   if (data.slice(0, 1).trim() === '') {
                        //     data = data.substr(1);
                        //   }
                        // }
                        subField.code = code;
                        subField.data = data;
                        if (exitsubfileds[i] && exitsubfileds[i].authorityId != null) {
                          subField.authorityId = exitsubfileds[i].authorityId;
                        }
                        field.subfields.push(subField);
                      }
                      i++;
                    }
                  });
                }
              }
            } else {
              field.subfields = [];
            }
            if (field.ind1 === '#') {
              field.ind1 = ' ';
            }
            if (field.ind2 === '#') {
              field.ind2 = ' ';
            }
            finalDataArray.push(field);
          }
        }
      });
    }
    return finalDataArray;
  }

  cloneRules(marcItem: any) {
    //get user preference from user object
    let userInfo: UserDetail = JSON.parse(localStorage.getItem('User'));
    if (userInfo || userInfo !== undefined) {
      if (marcItem.fields || marcItem) {
        //get 040 tag
        var field = marcItem.fields.find(x => x.tag === '040'); //find 040 tag is present or not
        if (field === undefined) { // if not present generate it and add a and c subfields
          field = this.generate040Tag(false, undefined);
          marcItem.fields.push(field);
        } else {
          let result = field.subfields.find(x => x.code === 'a' || x.code === 'c'); // if 040 tag is there but a and c sub fields are not there
          if (result === undefined) {
            this.generate040Tag(true, field); //generate a and c subfields
          } else {
            this.generate040Tag(true, field); // if a or c sub fields missing
          }

        }
        this.updatePreferenceForLocation(field);
      }
    }
  }
  generate040Tag(tagExists: boolean, field: any): MarcField {
    //let tag040= this.marcAdapter.createNewField('040');
    let tag040 = new MarcField();
    let subfieldA = new MarcSubField();
    let subfieldC = new MarcSubField();
    if (!tagExists && field === undefined) {
      tag040.tag = '040';
      tag040.subfields = [];
      //subfields a and c
      subfieldA.code = 'a';
      subfieldA.data = '';
      tag040.subfields.push(subfieldA)
      subfieldC.code = 'c';
      subfieldC.data = '';
      tag040.subfields.push(subfieldC);
    } else {
      tag040 = field; //identify which sub field is missing and if missing subfiled add it else ignore it.
      if (!field.subfields.find(x => x.code === 'a')) {
        //subfields a and c
        subfieldA.code = 'a';
        subfieldA.data = '';
        tag040.subfields.push(subfieldA)
      }
      if (!field.subfields.find(x => x.code === 'c')) {
        subfieldC.code = 'c';
        subfieldC.data = '';
        tag040.subfields.push(subfieldC);
      }
    }
    return tag040;
  }
  //end of z3950 clone
  updatePreferenceForLocation(marcState: any) {
    if (this.marcState && this.marcState.marc.fields) {
      //get user preference from user object
      let userInfo: UserDetail = JSON.parse(localStorage.getItem('User'));
      var index = this.marcState.marc.fields.findIndex(x => x.tag === '040'); //get 040 tag
      if (index != -1) {
        var field = this.marcState.marc.fields[index];
        if (field && field.subfields) {
          var subfieldDesc = '';
          var tag = field.subfields.forEach(x => {
            if (x.code === 'a' || x.code === 'c') {
              if (userInfo.Location != null) {
                x.data = userInfo.Location;
              } else {
                x.data = 'NjBwBT';
              }
            }
          });
          //subfieldDesc=(field.subfields && field.subfields.length !== 0) ? field.subfields.map(x => `${'#'}${x.code} ${x.data}`).join(' ') : '';
          //field.subFieldDescription=subfieldDesc;
          this.marcState.marc.fields[index] = this.marcAdapter.transformField(field, index);
        }
      }
    }
  }
  // Needed & but refactoring needed. Why JQuery?
  showDialogPopup(msg: string) {
    let data;
    if (!this.marcState.overrideMarc21) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      height: 'auto',
      disableClose: true,
      data: {
        isCopyErrorMsg: false,
        isErrorMsg: true,
        message: msg
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      this.resetShortCutKeys();
      data = result;
      $('#saveMarcRec').focus();
    });
  }
    return data;
  }
  showWarningDialogPopup(msg: string) {
    if (!this.marcState.overrideMarc21) {
    this.warningDialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      height: 'auto',
      disableClose: true,
      data: {
        isCopyErrorMsg: false,
        isCancelConfirm: true,
        message: msg
      }
    });
  }
    return this.warningDialogRef;
  }
  SaveMarcRecord(myForm: NgForm) {
    this.SaveMarcRecordDetails(myForm);
  }

  // Show confirmation message if form dirty
  confirmationMessageLengthValidation(form: NgForm) {
    if (!this.marcState.overrideMarc21) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      height: 'auto',
      disableClose: true,
      data: {
        isCopyErrorMsg: false,
        isCancelConfirm: true,
        message:
          'The length of the record has exceeded the maximum limit of 5000 bytes. Do you still want to proceed?'
      }
    });

    dialogRef.afterClosed().subscribe(
      result => {
        this.resetShortCutKeys();
        if (result) {
          form.form.markAsPristine();
          this.SaveMarcRecordDetails(form);
        } else {
          form.form.markAsDirty();
          $('#saveMarcRec').focus();
        }
      },
      error => { }
    );
    }
  }

  SaveMarcRecordDetails(myForm: NgForm) {
    this.mandatoryerrorMsg = '';
    const convertedMarc = this.clonerService.deepClone<MarcDTO>(this.marcState.marc);
    let finalDataArray = this.extractRecordFromFormControl(convertedMarc);

    if (finalDataArray.length > 0) {
      let message: string;
      const obsoleteCount = 0;
      this.marcState.marc.fields = finalDataArray;
      convertedMarc.fields = finalDataArray;
      // TODO: Handle Validation using form controls
      // obsoleteCount=this.validateObsoleteData(this.editorComponents,this.marcCopy);
      if (obsoleteCount === 0) {
        message = this.validateISBNUPCData(this.marcState.marc.fields);
        this.mandatoryerrorMsg = this.validateMandatoryTags();
        if (this.mandatoryerrorMsg !== '') {
          this.showDialogPopup(this.mandatoryerrorMsg);
        }
        const isSave = false;
        // if mandatory field are not there, display popup for ISBN,ISSN and UPC warning message
        if (this.mandatoryerrorMsg === '') {
          if (!this.marcState.overrideMarc21 && this.maxRecordLength < this.marcState.totalRecordLength && message !== '') {
            this.showWarningDialogPopup(Constants.RecordLengthWarningMessage);
            this.warningDialogRef.afterClosed().subscribe(result => {
              this.resetShortCutKeys();
              if (result) {
                this.showWarningDialogPopup(Constants.ISBNUPCISSNWarningMessage.replace('{0}', message));
                this.warningDialogRef.afterClosed().subscribe(result => {
                  if (result) {
                    this.saveToServer(myForm);
                  } else {
                    this.resetShortCutKeys();
                    $('#saveMarcRec').focus();
                  }
                });
              }
            });
          } else if (!this.marcState.overrideMarc21 && this.maxRecordLength < this.marcState.totalRecordLength) {
            this.showWarningDialogPopup(Constants.RecordLengthWarningMessage);
            this.warningDialogRef.afterClosed().subscribe(result => {
              if (result) {
                this.saveToServer(myForm);
              } else {
                this.resetShortCutKeys();
                $('#saveMarcRec').focus();
              }
            });
          } else if (!this.marcState.overrideMarc21 && message !== '') {
            this.showWarningDialogPopup(Constants.ISBNUPCISSNWarningMessage.replace('{0}', message));
            this.warningDialogRef.afterClosed().subscribe(result => {
              if (result) {
                this.saveToServer(myForm);
              } else {
                this.resetShortCutKeys();
                $('#saveMarcRec').focus();
              }
            });
          } else {
            this.saveToServer(myForm);
          }
        }
      }
    }
  }
  validateISBNUPCData(marcRecords: any) {
    let warningMsg = '';
    if (!this.marcState.overrideMarc21) {
      const startWthRegex = /^[0-9].*$/;
      // checking for null or undefined
      if (marcRecords) {
        marcRecords.forEach(element => { // for each marc record
          let isValidate = Constants.TaglengthToValidate.filter(h =>
            h.tag == element.tag
          );
          if (element.tag === '024') {
            isValidate = isValidate.filter(a => a.indicator == element.ind1);
          }
          if (isValidate && isValidate.length > 0) {
            // checking for subfield null or undefined
            if (element && element.subfields) {
              element.subfields.forEach(subfield => {
                if (subfield && isValidate.find(h => h.subField === subfield.code)) {
                  let returnValue;
                  if (subfield.data && !startWthRegex.test(subfield.data)) {
                    returnValue = false;
                  } else {
                    returnValue = Constants.validateISBNUPCData(subfield.code, subfield.data, element);
                  }
                  if (returnValue === false) {
                    const tag = element.tag === '020' ? 'ISBN' : (element.tag === '022' ? 'ISSN' : 'UPC');
                    if (warningMsg === '') {
                      warningMsg = warningMsg != '' ? warningMsg + ' and ' + tag : tag;
                    }
                    else if (!warningMsg.includes(tag)) {
                      warningMsg = warningMsg != '' ? warningMsg + ' and ' + tag : tag;
                         }
                  }
                }
              });
            }
          }
        });
      }
    }
    return warningMsg;
  }
  validateMandatoryTags() {
    let errorMsg = '';
    if (!this.marcState.overrideMarc21) {
      const mandatoryTags = Constants.MandatoryTags;
      mandatoryTags.forEach(element => {
        if (element.tag !== '260') {
          const isTagexists = this.marcState.marc.fields.find(a => a.tag === element.tag);
          if (isTagexists) {
            let subfieldMsg = '';
            if (element.subFields != null) {
              element.subFields.forEach(sub => {
                if (!isTagexists.subfields.find(a => a.code == sub)) {
                  subfieldMsg = subfieldMsg != '' ? (subfieldMsg + ',' + this.marcSettings.delimiter + sub) : this.marcSettings.delimiter + sub;
                }
              });
            }
            if (element.subElementsPos) {
              element.subElementsPos.forEach(ele => {
                if (element.length > 1) {
                  const charArray = ele.split('-');
                  const data = isTagexists.data.substring(
                    parseInt(charArray[0]),
                    parseInt(charArray[1]) + 1
                  );
                  if (data.indexOf(' ') > -1) {
                    subfieldMsg = subfieldMsg != '' ? (subfieldMsg + ',' + ele) : (ele);
                  }
                } else {
                  const data = isTagexists.data.charAt(ele);
                  if (ele !== '17' && ele !== '18') {
                    if (data.indexOf(' ') > -1) {
                      subfieldMsg = subfieldMsg != '' ? (subfieldMsg + ',' + ele) : (ele);
                    }
                  } else if (this.leaderDataWithHyphons && element.tag === 'Leader' && (ele === '17' || ele === '18')) {
                    const data = this.leaderDataWithHyphons ? this.leaderDataWithHyphons.charAt(ele) : '';
                    if (data.indexOf('-') > -1) {
                      subfieldMsg = subfieldMsg != '' ? (subfieldMsg + ',' + ele) : (ele);
                    }
                  }
                }
              });
            }
            if (subfieldMsg !== '') {

              errorMsg = errorMsg != '' ? (errorMsg + '<br/>' + (element.tag == 'Leader' ? 'LDR' : element.tag) + ': ' + subfieldMsg) : ((element.tag == 'Leader' ? 'LDR' : element.tag) + ': ' + subfieldMsg);
            }
          } else {

            errorMsg = errorMsg != '' ? (errorMsg + '<br/>' + (element.tag == 'Leader' ? 'LDR' : element.tag)) : (element.tag == 'Leader' ? 'LDR' : element.tag);
          }
        } else {
          const tagExists = this.marcState.marc.fields.filter(a => a.tag === '260' || a.tag === '264');
          if (tagExists.length === 0) {
            errorMsg = errorMsg !== '' ? (errorMsg + '<br/>' + '260/264') : '260/264';
          } else {
            if (!tagExists.find(a => a.subfields.filter(x => x.code === 'c').length > 0)) {
              errorMsg = errorMsg != '' ? (errorMsg + '<br/> 260/264: ' + this.marcSettings.delimiter + 'c') : '260/264: ' + this.marcSettings.delimiter + 'c';
            }
          }
        }
      });
    }
    return errorMsg != '' ? 'Please populate the following mandatory tags/subfields/subelements to save the MARC record: <br/><br/>' + errorMsg : errorMsg;
  }
  validateObsoleteData(manupulatedData: QueryList<TextEditorComponent>, originalData: MarcDTO) {
    let obsoleteCount = 0;
    const obsoleteTags: any = [];
    const data = originalData.fields;
    manupulatedData.forEach(changedData => {
      const result = data.find(x => x.id === changedData.field.id);
      if (changedData.data !== result.subFieldDescription || changedData.field.ind1 !== result.ind1 || changedData.field.ind2 !== result.ind2) {
        changedData.field.isTagChanged = true;
        obsoleteTags.push(changedData);
      }
    });
    // get all modified data
    obsoleteTags.forEach(x => {
      this.validateTag(x.field);
      if (x.field.isValid === false) {
        obsoleteCount = obsoleteCount + 1;
      }
    });
    return obsoleteCount;
  }
  ValidateRepeatableTag(field: MarcFieldDTO) {
    const selectedItem = field ? this.existingMARCData.find(marcbib => marcbib.tag === field.tag) : null;
    if (!selectedItem.repeatable) {

      let findDuplicates = this.marcState.marc.fields.filter(h =>
        h.tag.includes(field.tag)
      );

      if (field.tag === 'Leader') {
        findDuplicates = this.marcState.marc.fields.filter(h =>
          h.tag.includes(field.tag) || h.tag.includes('000')
        );
      }
      if (findDuplicates.length > 1) {
        field.isValid = false;
        field.errMsg = 'Not repeatable';
      }
    }
  }
  cancel(form) {
    this.marcState.displayWarnMessage = false;
    if (form.dirty) {
      form.form.markAsPristine();
    }
    if (this.marcId === undefined) {
      this.marc = this.marcState ? this.marcState.marc :JSON.parse(sessionStorage.getItem('z3950MarcItem'));
      this.subs.sink = this.marcAdapter.fetchZ3950Marc(this.marc, this.isExternalUser).subscribe(state => {
        this.marcState = state;
        if (this.operationType === 'z3950-clone') {
          let result = this.marcState.marc.fields.filter(x => x.tag != '001' && x.tag != '003' && x.tag != '005' && x.tag != '010' && x.tag != '035' && x.tag != '919' && x.tag != '997' && x.tag != '949'); //get local tags
          this.marcState.marc.fields = result;
          this.updatePreferenceForLocation(this.marcState);
        } else if (this.operationType === 'z3950-edit') {
          let result = this.marcState.marc.fields; //get local tags
          this.marcState.marc.fields = result;
          this.outputEvent.emit(this.marcState);
          // this.updatePreferenceForLocation(this.marcState);
        }
        this.pageScrollService.scroll({
          document: this.document,
          scrollTarget: `#marcRow0`,
          scrollViews: [document.getElementById('marceditgrid')]
        });
      });
      this.isActive = false;
    }
    else if (this.marcId && this.operationType) {
      if (this.operationType && (this.operationType.indexOf('clone') > -1)) {
        this.subs.sink = this.marcAdapter.getClonedMarc(this.marcId).subscribe(state => {
          this.marcState = state;
          this.pageScrollService.scroll({
            document: this.document,
            scrollTarget: `#marcRow0`,
            scrollViews: [document.getElementById('marceditgrid')]
          });
        });
      }
      else {
        this.subs.sink = this.marcAdapter.getMarcTemplate(this.marcId).subscribe(state => {
          this.marcState = state;
          //this.updatePreferenceForLocation(this.marcState);
          this.pageScrollService.scroll({
            document: this.document,
            scrollTarget: `#marcRow0`,
            scrollViews: [document.getElementById('marceditgrid')]
          });
        });
      }
      this.isActive = false;
      this.updatePreferenceForLocation(this.marcState);
    }
    $('.macroActive').removeClass('macroActive');
  }
  back(form: NgForm) {
    this.spinnerService.onRequestFinished();
    const basicSearchRequest = JSON.parse(
      localStorage.getItem(Constants.LocalStorage.BIBSEARCHREQUEST)
    );
    const z3950SearchRequest = JSON.parse(
      localStorage.getItem(Constants.LocalStorage.SEARCHZ3950REQUEST)
    );
    if (this.searchCount !== 1 ||
      (this.searchCount === 1 && basicSearchRequest && basicSearchRequest.SearchRequest[0].facetValue != null) ||
      (this.searchCount === 1 && z3950SearchRequest && z3950SearchRequest.SearchRequest[0].facetValue === null)) {
      if (form.dirty) {
        this.confirmationMessage(form);
      } else {
        form.form.markAsPristine();
        if (this.operationType && (this.operationType.indexOf('create') > -1)) {
          this.router.navigate(['/new-record']);
        } else if (this.searchCount === '1') {
          localStorage.removeItem(Constants.LocalStorage.BIBSEARCHREQUEST);
          localStorage.removeItem(Constants.LocalStorage.SEARCHZ3950REQUEST);
          this.router.navigate(['/search']);
        } else {
          // tslint:disable-next-line: max-line-length
          if (this.operationType === 'z3950-edit' || this.operationType === 'z3950-clone' || this.operationType === 'bibliographic-clone') {
            var count = sessionStorage.getItem('z3950recordcount');
            if (count && parseInt(count) > 1) {
               this._location.back();
            } else {
               this.router.navigate(['/search']);
            }
          } else {
            this._location.back();
          }
        }
      }
    } else {
      localStorage.removeItem(Constants.LocalStorage.BIBSEARCHREQUEST);
      localStorage.removeItem(Constants.LocalStorage.SEARCHZ3950REQUEST);
      this.router.navigate(['/search']);
    }
  }
  // Show confirmation message if form dirty
  confirmationMessage(form: NgForm) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      height: 'auto',
      disableClose: true,
      data: {
        isCopyErrorMsg: false,
        isCancelConfirm: true,
        message: 'There are unsaved changes. Are you sure you want to leave this page? '
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      // issue-2977
      if (this.router.url.indexOf('multiple-edit') > 0) {
        form.form.markAsPristine();
        this.backEvent.emit(result);
      } else if (result && this.searchCount == 1) {
        form.form.markAsPristine();
        localStorage.removeItem(Constants.LocalStorage.BIBSEARCHREQUEST);
        localStorage.removeItem(Constants.LocalStorage.SEARCHZ3950REQUEST);
        this.router.navigate(['/search']);

      } else if (result) {
        form.form.markAsPristine();
        // this._location.back();
        this.router.navigate([this.previousRouteService.getPreviousUrl()]);
      }
    }, (error) => {
    });
  }
  disableDrag(field: MarcField): boolean {
    return (
      Constants.ControlFields.findIndex(t => t === field.tag) !== -1 ||
      field.tag === 'Leader'
    );
  }
  saveMarcRecordToMain(form: NgForm) {
    this.savetoCustomerWS = false;
    this.validateAllFields();
    if ((this.cloneMode && this.hasAccess(Permissions.CLN_BIB_MN)) || (!this.cloneMode && this.hasAccess(Permissions.CRT_BIB_MN))) {
      // Validate all tags
      this.marcState.marc.fields.forEach(field => {
        field.isValid = true;
        field.errMsg = '';
        this.validateTag(field);
      });
      setTimeout(() => {
        const items = document.getElementsByClassName('border-danger');
        if (items.length === 0) {
          this.marcState.marc.isSaveToBTCATMain = true;
          this.marcState.displayWarnMessage = false;
          const obsoleteCount = 0;
          if (obsoleteCount === 0) {
            this.SaveMarcRecord(form);
          }
        } else {
          this.resetShortCutKeys();
          this.marcState.displayWarnMessage = true;
        }
      });
    }
  }
  saveMarcRecordToWorkSpace(form: NgForm) {
    this.savetoCustomerWS = false;
    this.validateAllFields();

    if (this.operationType === 'z3950-edit') {
      this.cloneMode = true;
    }
    if ((this.cloneMode && this.hasAccess(Permissions.CLN_BIB_WS)) || (!this.cloneMode && this.hasAccess(Permissions.CRT_BIB_WS))) {
      // Validate all tags
      this.marcState.marc.fields.forEach(field => {
        field.isValid = true;
        field.errMsg = '';
        this.validateTag(field);
      });
      setTimeout(() => {
        const items = document.getElementsByClassName('border-danger');
        // const warningItem = document.getElementsByClassName('border-warning');
        if (items.length === 0) {
          this.marcState.marc.isSaveToBTCATMain = false;
          this.marcState.displayWarnMessage = false;
          const obsoleteCount = 0;
          if (obsoleteCount === 0) {
            this.SaveMarcRecord(form);
          }
          // }
        } else {
          this.resetShortCutKeys();
          this.marcState.displayWarnMessage = true;
        }
      });
    }
  }

  saveMarcRecordToCutomerWorkSpace(form: NgForm) {
    this.validateAllFields();
    if (this.isExternalUser && this.currentCustomerId && this.operationType === 'z3950-edit') {
      this.savetoCustomerWS = true;
      if (this.operationType === 'z3950-edit') {
        this.cloneMode = true;
      }// Validate all tags
      this.marcState.marc.fields.forEach(field => {
        field.isValid = true;
        field.errMsg = '';
        this.validateTag(field);
      });
      setTimeout(() => {
        const items = document.getElementsByClassName('border-danger');
        if (items.length === 0) {
          this.marcState.marc.isSaveToBTCATMain = false;
          this.marcState.displayWarnMessage = false;
          const obsoleteCount = 0;
          if (obsoleteCount === 0) {
            this.SaveMarcRecord(form);
          }
          // }
        } else {
          this.resetShortCutKeys();
          this.marcState.displayWarnMessage = true;
        }
      });
    }
  }
  isDeleteDisabled(isDeleteDisabled: boolean, tag: string): boolean {
    return this.marcState.overrideMarc21 && !(tag === '005' || tag === '997' || tag === 'Leader') ? false : isDeleteDisabled; // INstead of false, get isDeleteDisabledOnOverride from syssettings
  }
  isEditable(field: MarcFieldDTO): boolean {
    // tslint:disable-next-line: max-line-length
    // return (this.marcState.overrideMarc21 && !field.isFieldExpandable && !(field.tag === '005' || field.tag === '997')) ? true
    // : (field.isFieldExpandable && field.isValid && !field.isNew) ? false : field.isFieldEditable; // INstead of false, get isEditableOnOverride from syssettings
    return ((field.isNew || field.isTagChanged) ? true :
            (this.marcState.overrideMarc21 && !field.isFieldExpandable && !(field.tag === '005' || field.tag === '997') ?
            true : field.isFieldEditable ));
  }
  handleEnterKeyPressed(eventargs: EventParams) {
    if ((this.cloneMode && this.hasAccessAny([Permissions.CLN_BIB_MN, Permissions.CLN_BIB_WS])) ||
      (!this.cloneMode && this.hasAccessAny([Permissions.CRT_BIB_MN, Permissions.CRT_BIB_WS]))) {
      this.form.form.markAsDirty();
      const controlPosition = this.getNewFieldPosition(eventargs.controlPosition);
      this.subs.sink = this.marcAdapter.addMarcFieldOnEnter(controlPosition).subscribe(state => {
        this.marcState = state;
        this.setFocusOnTag(controlPosition + 1);
      });
    }
  }
  handleUpDownPressed(eventargs: EventParams) {
    let nextIndex = -1;
    // get next index by skiping disabled controls
    if (eventargs.action === 'focus-bottom-element') {
      for (let i = eventargs.controlPosition + 1; i < this.marcState.marc.fields.length; i++) {
        const field = this.marcState.marc.fields[i];
        if (field && (!(field.tag) || field.tag === '003' ||
          (Constants.ControlFields.findIndex(t => t === field.tag) === -1 && field.tag !== '997' && field.tag !== 'Leader'))) {
          nextIndex = i;
          break;
        }
      }
    } else {
      for (let i = eventargs.controlPosition - 1; i > 0; i--) {
        const field = this.marcState.marc.fields[i];
        if (field && (!(field.tag) || field.tag === '003' ||
          (Constants.ControlFields.findIndex(t => t === field.tag) === -1 && field.tag !== '997'))) {
          nextIndex = i;
          break;
        }
      }
    }

    // return if next control is not found
    if (nextIndex === -1) {
      return;
    }
    const id = 'marcField' + nextIndex;
    const nextMarcField = this.marcFields.find(x => x.id === id);
    // focus next Tag control
    if (eventargs.controlName === 'tag') {
      nextMarcField.setTagCaretPosition(eventargs.position.ch, eventargs.position.ch);
    } else if (eventargs.controlName === 'indicator1') {
      nextMarcField.setInd1CaretPosition(eventargs.position.ch, eventargs.position.ch);
    } else if (eventargs.controlName === 'indicator2') {
      nextMarcField.setInd2CaretPosition(eventargs.position.ch, eventargs.position.ch);
    } else if (eventargs.controlName === 'marcDesc') {
      nextMarcField.setSubfieldCaretPosition(eventargs.position);
    }
  }
  handleShiftTabPressed(eventargs: EventParams, index: number) {
    this.canMoveNextByMaxLength = false;
    if (eventargs.action === 'focus-left-element') {
      const elem: Element = document.getElementById('editIndicator2' + index);
      setTimeout(() => {
        if (elem !== undefined && elem !== null) {
          // TODO: Bug 2021
          this.renderer2.selectRootElement('#editIndicator2' + index).select();
          // $('#editIndicator2' + index).select();
        }
      }, 0);
    }
  }
  AddNewMarcField(myForm: NgForm) {
    myForm.form.markAsDirty();
    const index = this.marcState.currentMarcFieldPosition > -1
      ? this.getNewFieldPosition(this.marcState.currentMarcFieldPosition) : this.marcState.marc.fields.length - 1;
    this.subs.sink = this.marcAdapter.addMarcFieldOnEnter(index).subscribe(state => {
      this.marcState = state;
      this.setFocusOnTag(index + 1);
    });
  }
  deleteMarcField(eventargs: EventParams, form: NgForm, field: MarcFieldDTO) {
    form.form.markAsDirty();
    this.subs.sink = this.marcAdapter.deleteMarcField(eventargs.position).subscribe(state => {
      this.marcState = state;
      this.setFocusOnTagNoScroll(eventargs.position);
    });
  }

  UpdateControlFieldValue(event: any, field: any) {
    field.isValidData = true;
    if (event.target.value && field.tag === '003') {
      field.subFieldDescription = event.target.value;
      field.data = event.target.value;
    }
  }
  validateTag(field: any) {
    if (!this.marcState.overrideMarc21) {
      if (field.tag && field.tag === null || field.tag.trim() === '') {
        field.isValid = false;
        field.errMsg = 'Required';
        return field;
      } else if (field.tag.trim().length < 3) {
        field.isValid = false;
        field.errMsg = 'Length should be 3';
        return field;
      }
      else if (field && field.isValid && (field.tag.trim().length === 3 || field.tag.trim() === 'Leader')) {
        const tag = field.tag == '000' ? 'Leader' : field.tag;
        const selectedItem = this.existingMARCData.find(a => a.tag === tag);
        if (selectedItem) {
          if (!selectedItem.repeatable) {
            const findDuplicates = this.marcState.marc.fields.filter(h =>
              (h.tag == 'Leader' ? '000' : h.tag) === (field.tag === 'Leader' ? '000' : field.tag)
            );
            if (findDuplicates.length > 1) {
              field.isValid = false;
              field.errMsg = 'Not repeatable';
            }
          }
          if (field.isTagChanged && selectedItem.isObsolete === true) {
            field.isValid = false;
            field.errMsg = 'Obsolete tag';
          }
        }
        if (field.isTagChanged && field.tag !== '000' && Constants.SystemGeneratedTags && Constants.SystemGeneratedTags.find(a => a === field.tag)) {
          field.isValid = false;
          field.errMsg = field.tag + ' is system generated';
        }
        if (field.isTagChanged && Constants.NotAllowedTagsInCreate && !(this.operationType.indexOf('edit') > -1) && Constants.NotAllowedTagsInCreate.find(a => a === field.tag)) {
          field.isValid = false;
          if (field.tag === '000') {
            field.errMsg = 'Not repeatable';
          }
          else {
            field.errMsg = field.tag + ' is system generated';
          }
        }
      }
    } else if (field.tag === '000' || (Constants.SystemGeneratedTags && Constants.SystemGeneratedTags.find(a => a === field.tag) && this.marcState.marc.fields.filter(h =>
      h.tag.includes(field.tag)
    ).length > 1)) {
      field.isValid = false;
      if (field.tag === '000')
      {
        field.errMsg = 'Not repeatable';
      }
      else
      {
      field.errMsg = field.tag + ' is system generated';
      }
    } else {
      field.isValid = true;
      field.errMsg = '';
    }
  }
  onDrop(dropResult: DropResult) {
    const nonFixedFieldIndex: number = this.marcState.marc.fields.findIndex(
      f =>
        (Constants.ControlFields.findIndex(t => t === f.tag) !== -1 ||
          f.tag === 'Leader') === false
    );
    // field can not dropped above fixed fields.
    if (dropResult.addedIndex < nonFixedFieldIndex) {
      dropResult.addedIndex = nonFixedFieldIndex;
    }
    if (dropResult.removedIndex !== dropResult.addedIndex) {
      this.form.form.markAsDirty();
    }
    this.subs.sink = this.marcAdapter.dragMarcField(this.marcState.marc.fields, dropResult).subscribe(state => this.marcState = state);
  }
  setFocusOnTagNoScroll(index: number) {
    setTimeout(() => {
      const nextMarcField = this.marcFields.find(x => x.id === `marcField${index}`);
      if (nextMarcField && nextMarcField.tagElement && nextMarcField.tagElement.nativeElement) {
        nextMarcField.tagElement.nativeElement.select();
      } else {
        if (this.addnewBtn) {
          this.addnewBtn.nativeElement.focus();
        }
      }
    }, 0);
  }
  setFocusOnTag(index) {
    const subscriber = new EventEmitter<boolean>();

    this.subs.add(subscriber.subscribe((val) => {
      setTimeout(() => {
        this.isAutoScroll = false;
        const nextMarcField = this.marcFields.find(x => x.id === `marcField${index}`);
        if (nextMarcField && nextMarcField.tagElement && nextMarcField.tagElement.nativeElement) {
          nextMarcField.tagElement.nativeElement.select();
        } else {
          if (this.addnewBtn) {
            this.addnewBtn.nativeElement.focus();
          }
        }

      }, 0);
    }));
    setTimeout(() => {
      if (index > 1) {
        this.pageScrollService.scroll({
          document: this.document,
          scrollTarget: `#marcRow${index}`,
          scrollViews: [document.getElementById('marceditgrid')],
          advancedInlineOffsetCalculation: true,
          scrollOffset: 40,
          interruptible: false,
          scrollFinishListener: subscriber,
        });
      } else {
        this.pageScrollService.scroll({
          document: this.document,
          scrollTarget: `#marcField0`,
          scrollViews: [document.getElementById('marceditgrid')],
          interruptible: false,
          scrollOffset: 40,
          advancedInlineOffsetCalculation: true,
          scrollFinishListener: subscriber,
        });
      }


    }, 0);
  }
  // TODO: Needed but not finished
  saveToServer(myForm: NgForm) {
    this.spinnerService.onRequestStarted();
    if (
      localStorage.getItem(Constants.LocalStorage.ACTOR) !== null &&
      localStorage.getItem(Constants.LocalStorage.ACTOR) !== ''
    ) {
      this.marcState.marc.lastModifiedBy = localStorage.getItem(Constants.LocalStorage.ACTOR);
    }
    myForm.form.markAsPristine();
    if (this.operationType) {
      if (
        localStorage.getItem(Constants.LocalStorage.ACTOR) !== null &&
        localStorage.getItem(Constants.LocalStorage.ACTOR) !== ''
      ) {
        this.marcState.marc.createdBy = localStorage.getItem(Constants.LocalStorage.ACTOR);
      }
      let userInfo: UserDetail = JSON.parse(localStorage.getItem('User'));
      var prefix;
      if (userInfo && userInfo.ControlNumber != null) {
        prefix = userInfo.ControlNumber;
      } else {
        prefix = 'bl';
      }
      var isZ3950Edit: boolean = false;
      var isupdate010: boolean = false;
      if (this.operationType === 'z3950-edit') {
        isZ3950Edit = true;
        prefix = '';
        if (!(this.marcState.marc.fields.find(x => x.tag === '010'))) {
          isupdate010 = true;
        } else {
          isupdate010 = false;
        }
      }
      this.subs.sink = this.service.createMarcRecord(this.marcState.marc, prefix, this.cloneMode ? '' : this.marcId, isZ3950Edit, isupdate010, this.savetoCustomerWS, this.currentCustomerId).subscribe(result => {
        this.spinnerService.onRequestFinished();
        this.postSaveOperation(result);
      },
        (error) => {
          if (error.status == 403) {
            this.spinnerService.onRequestFinished();
            alert(error.statusText);
          }
          else {
            this.spinnerService.onRequestFinished();
            throw (error);
          }
        });

    }

  }
  postSaveOperation(result: any) {
    let message;
    //Collapse all the expanded tags
    this.marcState.marc.fields.forEach(field => {
      if(field.isFieldExpandable){
        field.isFieldExpanded = false;
      }
    });
    if (result.IsSuccess) {
      message = 'The MARC record has been created successfully with following identifiers: <br/><br/> Database Record Number: '
        + result.DataBaseRecordNumber + '<br/>Record Control Number: ' + result.ControlNumber;
      localStorage.removeItem(Constants.LocalStorage.FILTERPARAMS);

      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '500px',
        height: 'auto',
        disableClose: true,
        data: {
          isCopyErrorMsg: false,
          isCancelConfirm: false,
          message
        }
      });
      dialogRef.afterClosed().subscribe(() => {
        this.resetShortCutKeys();
        if (this.savetoCustomerWS && this.operationType === 'z3950-edit') {
          localStorage.removeItem(Constants.LocalStorage.BIBSEARCHREQUEST);
          localStorage.removeItem(Constants.LocalStorage.SEARCHZ3950REQUEST);
          this.router.url.indexOf('multiple-edit') > 0 ? this.saveEvent.emit(true) : this.router.navigate(['/search']);
        } else {
          this.router.url.indexOf('multiple-edit') > 0 ? this.saveEvent.emit(true) : this.back(this.form);
        }
      });
    } else {
      this.resetShortCutKeys();
      this.marcState.displayWarnMessage = true;
      if (result.Index > -1) {
        const id = 'marcField' + result.Index;
        const descCtrl = this.marcFields.find(x => x.id === id);
        const cmInstance = descCtrl === undefined ? null : descCtrl.editorComponent;
        if (cmInstance !== undefined && cmInstance !== null) {
          setTimeout(() => {
            if (cmInstance && cmInstance.editor) {
              cmInstance.editor.checkData();
            }
          }, 0);
        }
      }
    }
  }

  viewRecordHistory(recordNumber: Number) {
    this.router.navigate(['/record-history', recordNumber]);
  }

  getNewFieldPosition(index): number {
    const nonFixedFieldIndex: number = this.marcState.marc.fields.findIndex(
      f =>
        (Constants.ControlFields.findIndex(t => t === f.tag) !== -1 ||
          f.tag === 'Leader') === false && f.isFieldEditable === true
    );
    // new field can not added above fixed fields.
    if (index < nonFixedFieldIndex) {
      index = nonFixedFieldIndex - 1;
    }
    return index;
  }
  updateLastFocusedIndex(index) {
    this.marcAdapter.updatecurrentMarcFieldPosition(index);
  }

  onMacroExecuted(marcRecord: any) {
    this.form.form.markAsDirty();
    this.marcState.marc = this.clonerService.deepClone<MarcDTO>(this.marcAdapter.transform(marcRecord));
    this.leaderDataWithHyphons = this.marcState.marc.fields.find(a => a.tag === 'Leader').data.replace(/ /g, '-');
  }

  onMarcRecordShowErrorMsg(marcRecord: any) {
    this.cancel(this.form);
  }

  openNav() {
    $('.MarcEditor').css('margin-right', '220px');
    $('.macroSideNav').width(210);
    $('.macroSideNavHeaderCollapsed').hide();
  }

  closeNav() {
    $('.MarcEditor').css('margin-right', '1rem');
    $('.macroSideNav').width(0);
    $('.macroSideNavHeaderCollapsed').show();
  }

  // Download

  openDownloadPopup(){
    this.fileData = null;
    $('.custom-file-label').html('Choose a File');
  }

  public onChange(fileInput: any) {
    this.marcState.displayWarnMessage = false;
    this.fileData = <File>fileInput[0];
    var ext = this.fileData.name.substr(this.fileData.name.lastIndexOf('.') + 1);
    $('.custom-file-label').html(this.fileData.name);
    if (ext != 'mrc') {
      alert('Invalid file format. Please upload only .mrc file.');
      this.fileData = null;
      $('.custom-file-label').html('');
    }
  }

  downloadMarcRecord() {
    document.getElementById('closeDownloadBtn').click();
    this.spinnerService.spinnerStart();
    const convertedMarc = this.clonerService.deepClone<MarcDTO>(this.marcState.marc);
    let finalDataArray = this.extractRecordFromFormControl(convertedMarc);
    convertedMarc.fields = finalDataArray;
    let fileName = 'marcRecord.mrc';
    const formData = new FormData();
    if(this.fileData){
      fileName = this.fileData.name;
      formData.append('file', this.fileData, this.fileData.name);
    }
    formData.append('marc',JSON.stringify(this.marcState.marc));
    this.service.downloadMarc(formData).subscribe((data)=>{
      importedSaveAs(data, fileName);
      this.spinnerService.spinnerStop();
  },
      (error) => {
          console.log(error);
          this.spinnerService.spinnerStop();
      });
  }

  openFileUpload() {
    $('#fileUpload').click();
  }


  AddORSMarcField(myForm: NgForm) {
    myForm.form.markAsDirty();
    let marcField: MarcField;
    let index = -1;

    index = this.marcState.marc.fields.findIndex(a => a.tag === '901');
    while (index != -1) {
      index = this.marcState.marc.fields.findIndex(a => a.tag === '901');
      if (index != -1) {
        this.subsink.sink = this.marcAdapter.deleteMarcField(index).subscribe(state => {
          this.marcState = state;
        });
      }
    }

    marcField = new MarcField();
    marcField.tag = '901';
    marcField.subfields = [];
    let marcSubField: MarcSubField;
    marcSubField = new MarcSubField();
    marcSubField.code = 'a';
    marcSubField.data = this.orsNumber;
    marcField.subfields.push(marcSubField);

    var fields = this.marcState.marc.fields.filter(f => parseInt(f.tag) > 901);

    if (fields.length > 0) {
      fields = fields.sort((a, b) =>
        a.tag > b.tag ? 1 : b.tag > a.tag ? -1 : 0
      );
      index = this.marcState.marc.fields.findIndex(f => f.tag == fields[0].tag) - 1;
    }
    else {
      index = this.marcState.marc.fields.length;
    }

    this.subsink.sink = this.marcAdapter.addORSMarcFieldOnEnter(index, marcField).subscribe(state => {
      this.marcState = state;
      if (fields.length > 0)
      {
        this.setFocusOnTag(index + 1);
      }
      else{
        this.setFocusOnTag(index);
      }
    });
  }

  generateORSNumber(myForm: NgForm) {
    this.service.generateORSNumber().subscribe(result => {
      this.spinnerService.spinnerStop();
      this.orsNumber = result.Message;
      var isEdge = /Edge\/(\d+)/.exec(window.navigator.userAgent);
      var isChrome = !isEdge && /Chrome\//.test(window.navigator.userAgent);
      if (isChrome) {
        this.AddORSMarcField(myForm);
        this.copyToClipboard();
      }
      else {
        this.orsAlertMessage(this.form, 'ORS ID has been generated successfully.');
      }
    },
      (error) => {
        if (error.status == 403) {
          this.spinnerService.spinnerStop();
          alert(error.statusText);
        }
        else {
          this.spinnerService.spinnerStop();
          throw (error);
        }
      });
  }

  copyToClipboard() {
    const copyText = document.createElement('textarea');
    copyText.value = this.orsNumber;
    document.body.appendChild(copyText);
    copyText.focus();
    copyText.select();
    document.execCommand('copy');
    document.body.removeChild(copyText);
  }

  orsAlertMessage(form:NgForm,msgText:string){
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: msgText && msgText.length > 200 ? '500px' : '300px',
      height: 'auto',
      disableClose: true,
      data: {
        isCopyErrorMsg: false,
        isCancelConfirm: false,
        isErrorMsg: false,
        isORSMsg: true,
        message:msgText,
        title:'Success',
        orsNumber: this.orsNumber
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      this.AddORSMarcField(this.form);
    });
  }



  getPositionNumberFromID(id: string): number {
    // tslint:disable-next-line: max-line-length
    return +(id.startsWith('editIndicator') ? id.substring(14) : (id.startsWith('editMarcDesc') ? id.substring(12) : (id.startsWith('editTagData') ? id.substring(11) : id.substring(7))));
  }

  getSelectionPositions(): number[] {
    var selObj = window.getSelection();
    var selRange = selObj.getRangeAt(0);
    const positions = [];
    const c = selRange.cloneContents().querySelectorAll('*');
    if (c.length > 0) {
      c.forEach(e => {
        // tslint:disable-next-line: max-line-length
        if (e.id.startsWith('editMarcDesc') || e.id.startsWith('editIndicator') || e.id.startsWith('editTagData') || e.id.startsWith('editTag')) {
          const position: number = this.getPositionNumberFromID(e.id);
          if (positions.indexOf(position) <= -1) {
            positions.push(position);
          }
        }
      });
    } else {
      const eid = event.srcElement.id;
      if (eid.startsWith('editMarcDesc') || eid.startsWith('editIndicator') || eid.startsWith('editTagData') || eid.startsWith('editTag')) {
        positions.push(this.getPositionNumberFromID(eid));
      }
    }
    return positions;
  }
  loadHotKeys() {

    // Copy of Marc Fields in Marc Editor
    this.hotkeysService.add(
      new Hotkey('ctrl+shift+c', (event: KeyboardEvent): boolean => {
        const positions = this.getSelectionPositions();
        console.log('Following rows to be copied:');
        positions.forEach(id => {
          console.log(id);
        });

        if (positions.length > 0) {
          this.onCopyActivated(positions);
        }
        return false;
      }, ['INPUT', 'SELECT', 'TEXTAREA'], 'Copy Ctrl+Shift+C'));

    // Cut of Marc Fields in Marc Editor
    this.hotkeysService.add(
      new Hotkey('ctrl+shift+x', (event: KeyboardEvent): boolean => {
        const positions = this.getSelectionPositions();
        console.log('Following rows to be copied:');
        positions.forEach(id => {
          console.log(id);
        });
        if (positions.length > 0) {
          this.onCutActivated(positions);
        }
        return false;
      }, ['INPUT', 'SELECT', 'TEXTAREA'], 'Copy Ctrl+Shift+C'));

    // Paste of MARC Fields in Marc Editor
    this.hotkeysService.add(
      new Hotkey('ctrl+shift+v', (event: KeyboardEvent): boolean => {
        var selObj = window.getSelection();
        let replace = false;

        if (selObj.type !== 'Caret') {
          replace = true;
        }
        const positions = this.getSelectionPositions();

        if ( positions.length > 0 ) {
          this.onPasteActivated(positions, replace);
        }
        return false;
      }, ['INPUT', 'SELECT', 'TEXTAREA'], 'Paste Ctrl+Shift+V'));

  }

  onCopyActivated(positions: number[]) {
    const eventParams: CopyPasteEventParams = {
      action: 'row-copy-key-pressed',
      copyPositions: positions
    };
    this.marcAdapter.handleCopyActivity(eventParams, this);
  }

  onCutActivated(positions: number[]) {
    const eventParams: CopyPasteEventParams = {
      action: 'row-cut-key-pressed',
      copyPositions: positions
    };
    this.marcAdapter.handleCutActivity(eventParams, this);
  }


  onPasteActivated(positions: number[], replace: boolean) {
    const eventParams: CopyPasteEventParams = {
      action: 'row-paste-key-pressed',
      pastePositions: positions,
      replacePositions: replace
    };
    this.marcAdapter.handlePasteActivity(eventParams, this);
  }
  saveCopiedMARCFieldsToLocalStorage(dataObj: any) {
    const clipObj = { type: 'MARC21', data: dataObj };
    const val = JSON.stringify(clipObj);
    localStorage.setItem(Constants.LocalStorage.COPIEDMARCFIELDS, val);
  }

  grabCopiedMARCFieldsFromLocalStorage(): boolean {
    const copiedFields = localStorage.getItem(Constants.LocalStorage.COPIEDMARCFIELDS);
    if (copiedFields) {
      const val = JSON.parse(copiedFields);
      if (val && val.data) {
        this.service.CopiedFields = [];
        val.data.forEach((d: MarcFieldDTO) => { this.service.CopiedFields.push(d); });
        return true;
      }
    }
    return false;
  }
  validateAllFields()
  {
    if(this.marcState && !this.marcState.overrideMarc21)
    {
    if(this.marcFields)
    {
      this.marcFields.forEach(field => {

      field.fieldValidations();
      });
    }
  }
  }
  openTagCreation() {
    let dialogRef = this.dialog.open(TagCreateComponent, {
      width: '500px',
      height: '500px',
      disableClose: true,
      data: this.barcodeSubField,
      autoFocus: false
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.length > 0) {
        console.log(result);
        let scannedData: string[] = result;
        let marcFields: MarcField[] = [];
        let index = -1;
        var indexes = [], i = 0;
        this.marcState.marc.fields.forEach(x => {
          if (x.tag === '949') {
            indexes.push(i);
          }
          i++;
        });
        scannedData.forEach(data => {
          let newField = new MarcField();
          newField.tag = '949';
          newField.subfields = [];
          let marcSubField: MarcSubField;
          marcSubField = new MarcSubField();
          marcSubField.code = this.barcodeSubField;
          marcSubField.data = data;
          newField.subfields.push(marcSubField);
          marcFields.push(newField);
        });


        var fields = this.marcState.marc.fields.filter(f => parseInt(f.tag) > 949);
        if (fields.length > 0) {
          fields = fields.sort((a, b) =>
            a.tag > b.tag ? 1 : b.tag > a.tag ? -1 : 0
          );
          index = this.marcState.marc.fields.findIndex(f => f.tag == fields[0].tag) - 1;
        }
        else {
          index = this.marcState.marc.fields.length - 1;
        }

        this.subsink.sink = this.marcAdapter.add949TagFields(index, marcFields).subscribe(state => {
          this.marcState = state;
          if (marcFields.length > 0) {
            this.setFocusOnTag(index + marcFields.length);
          }
          else {
            this.setFocusOnTag(index);
          }
        });
      }
    });
  }
  isBarCodeEnable(): boolean{
    if(this.isExternalUser && (this.barcodeSubField !=null || this.barcodeSubField != undefined)){
      return false;
    }
     else
      return true;
  }
}
