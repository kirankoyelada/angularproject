import { Component, OnInit, ChangeDetectorRef, Renderer2, QueryList, ViewChildren, ViewChild, ChangeDetectionStrategy, Inject, EventEmitter, ElementRef, HostListener, AfterViewInit, OnDestroy, AfterViewChecked } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonService } from 'src/app/shared/service/common.service';
import { MarcRecord } from 'src/app/services/search';
import { NgForm } from '@angular/forms';
import { MatDialog, MatAutocompleteTrigger, _countGroupLabelsBeforeOption, _getOptionScrollPosition, AUTOCOMPLETE_PANEL_HEIGHT, MatDialogRef } from '@angular/material';
import { ConfirmationDialogComponent } from 'src/app/components/shared/confirmation-dialog/confirmation-dialog.component';
import { Location } from '@angular/common';
import { MarcEditorSettings, Marc, MarcField, MarcBibData, MergeMarc } from '../shared/marc';
import { MarcService } from '../shared/service/marc-service';
import { MarcDTO, EditTagDTO, EventParams, MarcFieldDTO, MarcSubFieldDTO } from 'src/app/_dtos/btcat.vm.dtos';
import { Constants } from 'src/app/constants/constants';
import { SpinnerService } from 'src/app/shared/interceptor/spinner.service';
import { MarcFieldComponent } from '../shared/marc-field/marc-field.component';
import { FormCanDeactivate } from 'src/app/can-deactivate/form-can-deactivate';
import { SubSink } from 'subsink';
import { TextEditorComponent } from '../shared/text-editor/texteditor.component';
import { Title, DOCUMENT } from '@angular/platform-browser';
import { ClonerService } from 'src/app/services/cloner.service';
import { PageScrollService } from 'ngx-page-scroll-core';
import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/overlay';
import { DropResult } from 'smooth-dnd';
import { MarcMergeAdapterService } from '../shared/service/marc-merge-adapter.service';
import { AuthenticationService } from 'src/app/security/authentication.service';
import { Permissions } from 'src/app/security/permissions';
import { MergeMarcState } from '../shared/store/marc-merge-state';
import { ConfigurationService } from 'src/app/services/configuration.service';
declare const CodeMirror: any;
declare var $: any;

@Component({
  selector: 'merge-marc',
  templateUrl: './merge-marc.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class MergeMarcComponent extends FormCanDeactivate implements OnInit,
                                AfterViewInit, OnDestroy, AfterViewChecked {
  @ViewChildren(MatAutocompleteTrigger, { read: MatAutocompleteTrigger }) matAutocompleteTrigger: QueryList<MatAutocompleteTrigger>;
  @ViewChildren(MarcFieldComponent) marcFields: QueryList<MarcFieldComponent>;
  @ViewChild('form') form: NgForm;
  @ViewChild('moveallLeft') moveallLeft: ElementRef;
  @ViewChildren('leftDiv') leftDivs: QueryList<ElementRef>;
  @ViewChildren('finalDiv') finalDivs: QueryList<ElementRef>;
  @ViewChildren('rightDiv') rightDivs: QueryList<ElementRef>;

  marcParams: string;
  recordHistoryMarcParams: string;
  destMarcRecHistoryId: string;
  otherMarcRecHistoryId: string;
  isRecordHistoryMarc = false;
  mergeMarcState: MergeMarcState;
  overrideMarc21 = false;

  marcSettings: MarcEditorSettings;
  existingMARCData: MarcBibData[] = [];
  nonRepeatableTags: string[] = [];

  mergeMarcs: MarcRecord[] = [];
  sourceMarcId: string;
  sourceMarcSource: string;
  destinationMarcId: string;
  destinationMarcSource: string;
  finalMarcId: string;
  CWidowHeight: number;
  CHeaderHeight: number;
  CSearchHeight: number;
  CNavHeight: number;
  HeaderHeight: number;
  NewHeight: number;
  maxRecordLength: number = 10;

  leaderDataWithHyphons: string;
  private subs = new SubSink();

  // totalRecordLength = 0;
  warningDialogRef: MatDialogRef<ConfirmationDialogComponent, any>;

  displayWarnMessage = false;
  mandatoryerrorMsg = '';
  // tslint:disable-next-line: max-line-length
  // TODO: This object is not needed. Transform the object to data model before sending it back to server. Other option is to handle it in server, but that adds dependency
  marc: MarcDTO;
  retainValue = true;
  lastFocused = -1 ;
  isAllCustomerSelected = false;

  get leaderData(): string {
    if (this.mergeMarcState.marc && this.mergeMarcState.marc.fields) {
      const leader = this.mergeMarcState.marc.fields.find(f => f.tag === 'Leader');
      if (leader) {
        return leader.data;
      } else {
        return '';
      }
    }
    return '';
  }
  constructor(
    private router: Router,
    private renderer2: Renderer2,
    private route: ActivatedRoute,
    private service: MarcService,
    private location: Location,
    private dialog: MatDialog,
    private spinnerService: SpinnerService,
    private marcMergeAdapter: MarcMergeAdapterService,
    private cdr: ChangeDetectorRef,
    private _titleService: Title,
    private clonerService: ClonerService,
    private pageScrollService: PageScrollService,
    private scrollDispatcher: ScrollDispatcher,
    private commonService:CommonService,
    @Inject(DOCUMENT) private document: any,
    private authenticationService: AuthenticationService, 
    private configurationService: ConfigurationService
  ) {
    super(router, authenticationService);
    if (
      localStorage.getItem(Constants.LocalStorage.MARCSETTINGS) != null &&
      localStorage.getItem(Constants.LocalStorage.MARCBIBDATA) != null
    ) {
      this.marcSettings = JSON.parse(localStorage.getItem(Constants.LocalStorage.MARCSETTINGS));
      this.existingMARCData = JSON.parse(localStorage.getItem(Constants.LocalStorage.MARCBIBDATA));
      this.nonRepeatableTags = this.existingMARCData.filter(f => !f.repeatable).map(f => f.tag);
    } else {
      this.loadMarcSettings();
    }

    this.maxRecordLength = configurationService.currentConfiguration().maxRecordLength;
  }

  onCloseHandled() {
    $('#mergeConfirmationPopup').modal('hide');
  }

  ngOnInit(): void {
    this._titleService.setTitle('BTCAT | Merge Marc');
    // check current route is record history page
    this.isRecordHistoryMarc = this.router.url.includes('/merge-record-history-marc');
    const items = JSON.parse(
      localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS)
    );
    if (items != null && items.length > 0) {
      this.isAllCustomerSelected = items.findIndex(i => i.isActive && i.profileName === 'All Customers') != -1;
    }

    this.subs.sink = this.route.params.subscribe(params => {
      // get marcParams from param
        var recordHistoryDestinationSource=this.isRecordHistoryMarc?params.recordHistoryMarcParams.split(':')[1]:null;
        this.marcParams = params.marcParams ? params.marcParams : '';
        const marcParmList: string[] = this.marcParams ? this.marcParams.split(':') : [];
        const customerName = localStorage.getItem(Constants.LocalStorage.CUSTOMERNAME);
        if (this.isExternalUser && this.commonService.isMarc21ValidationsEnable() === "true") {
          this.overrideMarc21 = true;
        }
        else {
          this.overrideMarc21 = false;
        }
        if (!this.isRecordHistoryMarc) {
            if (marcParmList && marcParmList.length === 4) {
              this.sourceMarcId = marcParmList[0];
              this.destinationMarcId = marcParmList[1];
              this.sourceMarcSource = '(' + marcParmList[2] + ')';
              this.destinationMarcSource = '(' + marcParmList[3] + ')';
            }
        } else {
          // Get record history marc params
          this.recordHistoryMarcParams = params.recordHistoryMarcParams;
          if (this.recordHistoryMarcParams) {
            const recordHistoryMarcParmList: string[] = this.recordHistoryMarcParams.split(':');
            if (recordHistoryMarcParmList) {
              this.destMarcRecHistoryId = recordHistoryMarcParmList[0];
              this.destinationMarcSource = '(' + recordHistoryMarcParmList[1] + ')';
              this.otherMarcRecHistoryId = recordHistoryMarcParmList[2];
              this.sourceMarcSource = '(' + recordHistoryMarcParmList[3] + ')';
            }
          }
        }

        this.loadMarcDetails();
      this.onScroll();
      this.initializeCodeMirrorMode();
    });
  }

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

    this.subs.sink = this.scrollDispatcher.scrolled().subscribe((scrollable: CdkScrollable) => {
      const top = scrollable.measureScrollOffset('top');
      const id = scrollable.getElementRef().nativeElement.id;
      if (id == 'marceditgrid' || id == 'sourceDiv' || id == 'destinationDiv') {
        Array.from(this.scrollDispatcher.scrollContainers.keys())
          .filter(otherScrollable => otherScrollable && otherScrollable !== scrollable)
          .forEach(otherScrollable => {
            if (otherScrollable.measureScrollOffset('top') !== top) {
              otherScrollable.scrollTo({ top });
            }
          });
      }
    });
  }

  @HostListener('window:beforeunload')
  ngOnDestroy(): void {
    //
    this.marcFields.forEach(x => {
      x.closeAutoComplete();
    });
    this.subs.unsubscribe();
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

  // load marc setting
  loadMarcSettings() {
    this.subs.sink = this.service.getMarcSettings().subscribe((item) => {
      if (item && item) {
        this.marcSettings = item.MarcEditorSettings;
        localStorage.setItem(Constants.LocalStorage.MARCSETTINGS, JSON.stringify(this.marcSettings));
        localStorage.setItem(Constants.LocalStorage.DEFAULTENVSETTINGS, JSON.stringify(this.marcSettings));
        if (item.BibMarcData && item.BibMarcData.length > 0) {
          const marcBibData = item.BibMarcData.sort((a: any, b: any) => a.tag - b.tag);
          localStorage.setItem(Constants.LocalStorage.MARCBIBDATA, JSON.stringify(marcBibData));
          this.nonRepeatableTags = marcBibData.filter(f => !f.repeatable).map(f => f.tag);
        }
      }
    });
  }

  // load marc details
  loadMarcDetails() {
    this.spinnerService.onRequestStarted();
    if (this.sourceMarcId && this.sourceMarcId.length > 0 && this.destinationMarcId && this.destinationMarcId.length > 0) {
      this.subs.sink = this.marcMergeAdapter.getMarcRecordsForMerge(this.sourceMarcId, this.destinationMarcId, this.overrideMarc21)
          .subscribe((state) => {
            this.mergeMarcState = state;
            this.handleScroll();
            this.spinnerService.onRequestFinished();
          });
    } else if (this.isRecordHistoryMarc) {
      // tslint:disable-next-line: max-line-length
      this.subs.sink = this.marcMergeAdapter.getMarcRecordHistoryForMerge(this.destMarcRecHistoryId, this.otherMarcRecHistoryId, this.overrideMarc21)
          .subscribe((state) => {
            this.mergeMarcState = state;
            this.handleScroll();
            this.spinnerService.onRequestFinished();
          });
    } else {
      this.subs.sink = this.marcMergeAdapter.getDefaultMarcRecordsForMerge(this.overrideMarc21)
      .subscribe((state) => {
        this.mergeMarcState = state;
        this.handleScroll();
        this.spinnerService.onRequestFinished();
      });
    }
  }

  handleScroll() {
    $('#destinationDiv').scrollTop(0);
    $('#marceditgrid').scrollTop(0);
    $('#sourceDiv').scrollTop(0);
  }

  // Get the record source for a marc to display
  getRecordSource(marc: Marc): string {
    if (marc) {
      return (marc.isBTCATMain ? '(BTCAT Main)' : '(BTCAT Workspace)');
    } else {
      return '';
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
        message:
          'There are unsaved changes. Are you sure you want to leave this page? '
      }
    });

    this.subs.sink = dialogRef.afterClosed().subscribe(
      result => {
        if (result) {
          form.form.markAsPristine();
          this.location.back();
        } else { form.form.markAsDirty(); }
      },
      error => { }
    );
  }

  // Go to back from the merge page
  back(form: NgForm) {
    if (form && form.form.dirty) {
      this.confirmationMessage(form);
    } else {
      this.location.back();
    }
  }

  /* search split fix function - var values */
  CustomHeightFunction() {
    this.CWidowHeight = $(window).height();
    this.CHeaderHeight = $('app-header nav').height();
    this.CSearchHeight = $('app-search-box .search_filter').height();
    this.CNavHeight = $('.mainNavSection').height();
    this.HeaderHeight =
      this.CHeaderHeight +
      this.CSearchHeight +
      this.CNavHeight;
    this.NewHeight = this.CWidowHeight - this.HeaderHeight;
    this.NewHeight = this.NewHeight - 90;
    this.cdr.detectChanges();
  }
  ngAfterViewChecked() {
    this.CustomHeightFunction();

    $(window).resize(e => {
      this.CustomHeightFunction();
    });
  }

  updateLastFocusedIndex(index) {
    this.lastFocused = index;
  }
  // Move single from left/right pane to final pane
  moveField(field: MarcField, index: number, myForm: NgForm) {
    myForm.form.markAsDirty();
    this.subs.sink = this.marcMergeAdapter.onMoveField(field, index).subscribe(state => {
      this.mergeMarcState = state;
      this.validateMarcField(this.mergeMarcState.marc.fields[index]);
    });
  }
  //  Move all from left/right pane to final pane
  moveAllFields(myForm: NgForm, isDestinationPane: boolean) {
    myForm.form.markAsDirty();
    this.spinnerService.onRequestStarted();
    this.subs.sink = this.marcMergeAdapter.onMoveAllFields(isDestinationPane, this.nonRepeatableTags)
        .subscribe(state => {
          this.mergeMarcState = state;
          this.spinnerService.onRequestFinished();
        });
  }
  addExistingField(field: MarcField, index: number) {
    // const markField = this.marcMergeAdapter.transformField(field, index);
    // // this.finalMarcDTO.fields.push(markField);
    // this.finalMarcDTO.fields.splice(index + 1, 0, markField);
    // const newField = new MarcField;
    // newField.tag = field.tag;
    // this.mergeMarc.destination.fields.splice(index + 1, 0, newField);
    // this.mergeMarc.source.fields.splice(index + 1, 0, newField);
  }
  // Handle the enter key on the editor
  handleEnterKeyPressed(eventargs: EventParams, myForm: NgForm) {
    if (!this.hasAccessAny([Permissions.EDT_BIB_MN, Permissions.EDT_BIB_WS]) || !this.isAllCustomerSelected) {
    myForm.form.markAsDirty();
    const index = eventargs.controlPosition;
    this.addNewField(index, myForm);
    }
  }
  // Handle the up and down keys on the editor
  handleUpDownPressed(eventargs: EventParams) {
    let nextIndex = -1;
    // get next index by skiping disabled controls
    if (eventargs.action === 'focus-bottom-element') {
      for (let i = eventargs.controlPosition + 1; i < this.mergeMarcState.marc.fields.length; i++) {
        const field = this.mergeMarcState.marc.fields[i];
        if (field && (!(field.tag) || field.tag === '003' ||
          (Constants.ControlFields.findIndex(t => t === field.tag) === -1 && field.tag !== '997' && field.tag !== 'Leader'))) {
          nextIndex = i;
          break;
        }
      }
    } else {
      for (let i = eventargs.controlPosition - 1; i > 0; i--) {
        const field = this.mergeMarcState.marc.fields[i];
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
  // Handle the shift tab key on the editor
  handleShiftTabPressed(eventargs: EventParams, index: number) {
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
  // Add new marc fiedls
  AddNewMarcField(myForm: NgForm) {
    if (!this.hasAccessAny([Permissions.EDT_BIB_MN, Permissions.EDT_BIB_WS]) || !this.isAllCustomerSelected) {

      myForm.form.markAsDirty();
      const index = this.lastFocused > -1 ? this.lastFocused : this.mergeMarcState.marc.fields.length - 1;
      this.addNewField(index, myForm);
    }
  }
  addNewField( index: number, myForm: NgForm) {
    myForm.form.markAsDirty();
    const nonFixedFieldIndex: number = this.mergeMarcState.marc.fields.findIndex(
      f =>
        (Constants.ControlFields.findIndex(t => t === f.tag) !== -1 ||
          f.tag === 'Leader') === false
    );
    // new field can not added above fixed fields.
    if (index < nonFixedFieldIndex) {
      index = nonFixedFieldIndex - 1;
    }
    this.subs.sink = this.marcMergeAdapter.onAddNewField(index).subscribe(state => {
      this.mergeMarcState = state;
      this.setFocusOnTag(index + 1);
    });
  }
  setFocusOnTagNoScroll(index: number) {
    setTimeout(() => {
      const nextMarcField = this.marcFields.find(x => x.id === `marcField${index}`);
      if (nextMarcField && nextMarcField.tagElement && nextMarcField.tagElement.nativeElement) {
        nextMarcField.tagElement.nativeElement.select();
      }
    }, 0);
  }
  // set the focus on current tags.
  setFocusOnTag(index) {
    const subscriber = new EventEmitter<boolean>();

    this.subs.sink = subscriber.subscribe((val) => {
      setTimeout(() => {
        const nextMarcField = this.marcFields.find(x => x.id === `marcField${index}`);
        if (nextMarcField && nextMarcField.tagElement && nextMarcField.tagElement.nativeElement) {
          nextMarcField.tagElement.nativeElement.select();
        }
      }, 100);
    });
    setTimeout(() => {
      if (index > 1) {
        this.pageScrollService.scroll({
          document: this.document,
          scrollTarget: `#marcRow${index}`,
          scrollViews: [document.getElementById('marceditgrid')],
          interruptible: false,
          scrollOffset: 40,
          advancedInlineOffsetCalculation: true,
          scrollFinishListener: subscriber,
        });
      } else {
        this.pageScrollService.scroll({
          document: this.document,
          scrollTarget: `#marcRow0`,
          scrollViews: [document.getElementById('marceditgrid')],
          interruptible: false,
          scrollOffset: 40,
          advancedInlineOffsetCalculation: true,
          scrollFinishListener: subscriber,
        });
      }
    }, 0);
  }

  // TODO: MISC. Need to check while refactoring
  deleteMarcField(eventargs: EventParams, form: NgForm, field: MarcFieldDTO) {
    form.form.markAsDirty();


    const index = this.mergeMarcState.marc.fields.findIndex(f => f === field);
    const position = eventargs.position;
    this.subs.sink = this.marcMergeAdapter.onDeleteMarcField(position, field).subscribe(state => {
      this.mergeMarcState = state;
      this.validateMarcField(this.mergeMarcState.marc.fields[index]);
      if (field.isNew) {
        this.lastFocused = -1;
      }

      // remove repeatable errors
      if (field.tag && field.tag.trim() !== '') {
        if (this.mergeMarcState.marc) {
          const duplicateFields = this.mergeMarcState.marc.fields.filter(h => (h.tag === 'Leader' ? '000' : h.tag) == (field.tag === 'Leader' ? '000' : field.tag) && ((h.tag === 'Leader' ? '000' : h.tag) === '000' || !this.isEmptyField(h)));
          if (duplicateFields && duplicateFields.length === 1) {
            duplicateFields[0].isValid = true;
          }
        }
      }
      if (index === this.mergeMarcState.marc.fields.length) {
        this.moveallLeft.nativeElement.focus();
      } else {
        this.setFocusOnTagNoScroll(index);
      }
    });
  }

  onFieldBlur(field: MarcFieldDTO) {
    if (field && field.tag && field.tag.length === 3) {
      this.subs.sink = this.marcMergeAdapter.onTagUpdate(field, this.nonRepeatableTags).subscribe(state => {
        const index = state.marc.fields.findIndex(f => f === field);
        this.validateMarcField(state.marc.fields[index]);
        this.mergeMarcState = state;
      });
    }
  }

  onFieldUpdate(field: MarcFieldDTO) {
    if (field && field.tag && field.tag.length === 3) {
      this.subs.sink = this.marcMergeAdapter.onTagUpdate(field, this.nonRepeatableTags).subscribe(state => {
        const index = state.marc.fields.findIndex(f => f === field);
        this.validateMarcField(state.marc.fields[index]);
        if (field.type === 'controlfield' || field.tag === '000') {
          if (field && field.isValid && (field.tag === '006' || field.tag === '000' || field.tag === '007' || field.tag === '008')) {
            field.isFieldExpandable = true;
            field.isFieldExpanded = false;
            this.marcFields.toArray()[index].showEditSubEle();
          }
        }

        this.mergeMarcState = state;
      });
    }
  }

  // Update 008 tag
  update008Data(item: any) {
    this.subs.sink = this.marcMergeAdapter.onUpdateMarcField008(item).subscribe(state => {
      this.mergeMarcState = state;
    });
  }
  // Check the state and update record
  checkState(e, field: MarcFieldDTO, index: number) {
    if (e) {
      field.color = null;
      this.form.form.markAsDirty();
    }
    // check tag validation
    // this.validateMarcField(field);
    this.subs.sink = this.marcMergeAdapter.onUpdateMarcField(field, index).subscribe(state => {
      this.mergeMarcState = state;
    });
  }

  private pad(num: number, size: number): string {
    let s = num + '';
    while (s.length < size) { s = '0' + s; }
    return s;
  }
  // Refresh the editor
  startOver(form) {
    this.lastFocused = -1;
    if (form.dirty) {
      form.form.markAsPristine();
    }
    this.displayWarnMessage = false;
    this.loadMarcDetails();
  }
  // Save the marc details
  SaveMarcRecordDetails(myForm: NgForm) {
    this.mandatoryerrorMsg = '';
    const isValid = true;
    this.marc = { ...this.mergeMarcState.marc };
    // tslint:disable-next-line: max-line-length
    this.marc.fields = this.mergeMarcState.marc.fields.filter(f => f.tag && (f.tag === '005' || f.data || f.ind1 || f.ind2 || f.subFieldDescription));
    let finalDataArray = [];
    const fixedFieldArray = [];
    let leaderField: any;
    if (this.marc && this.marc.fields && this.marc.fields.length > 0) {
      // Fixed Fields
      this.marc.fields.forEach(field => {
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
      this.marc.fields.forEach(field => {
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
              field.subFieldDescription.trim() !== ''
            ) {
              const subFieldData = this.commonService.lTrim(field.subFieldDescription).split(this.marcSettings.delimiter);
              // const subFieldData = field.subFieldDescription.trim()
              //   .split(this.marcSettings.delimiter);
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
                        if (exitsubfileds && exitsubfileds.length > i && exitsubfileds[i] && exitsubfileds[i].authorityId != null) {
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
            if (field.ind1 == '#') {
              field.ind1 = ' ';
            }
            if (field.ind2 == '#') {
              field.ind2 = ' ';
            }
            finalDataArray.push(field);
          }
        }
      });
    }

    if (finalDataArray.length > 0) {
      let message: string;
      const obsoleteCount = 0;
      this.marc.fields = finalDataArray;
      // TODO: Handle Validation using form controls
      // obsoleteCount=this.validateObsoleteData(this.editorComponents,this.marcCopy);
      if (obsoleteCount === 0) {
        message = this.validateISBNUPCData(this.marc.fields);
        this.mandatoryerrorMsg = this.validateMandatoryTags();
        if (this.mandatoryerrorMsg != '') {
          this.showDialogPopup(this.mandatoryerrorMsg);
        }
        const isSave = false;
        // if mandatory field are not there, display popup for ISBN,ISSN and UPC warning message
        if (this.mandatoryerrorMsg == '') {
          if (this.maxRecordLength < this.mergeMarcState.totalRecordLength && message != '' && !this.overrideMarc21) {
            this.showWarningDialogPopup(Constants.RecordLengthWarningMessage);
            this.subs.sink = this.warningDialogRef.afterClosed().subscribe(result => {
              if (result) {
                this.showWarningDialogPopup(Constants.ISBNUPCISSNWarningMessage.replace('{0}', message));
                this.subs.sink = this.warningDialogRef.afterClosed().subscribe(result => {
                  if (result) {
                    this.saveToServer(myForm);
                  } else {
                    $('#saveMarcRec').focus();
                  }
                });
              }
            });
          } else if (this.maxRecordLength < this.mergeMarcState.totalRecordLength && !this.overrideMarc21) {
            this.showWarningDialogPopup(Constants.RecordLengthWarningMessage);
            this.subs.sink = this.warningDialogRef.afterClosed().subscribe(result => {
              if (result) {
                this.saveToServer(myForm);
              } else {
                $('#saveMarcRec').focus();
              }
            });
          } else if (message != ''  && !this.overrideMarc21) {
            this.showWarningDialogPopup(Constants.ISBNUPCISSNWarningMessage.replace('{0}', message));
            this.subs.sink = this.warningDialogRef.afterClosed().subscribe(result => {
              if (result) {
                this.saveToServer(myForm);
              } else {
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
  // Validate the ISBN data
  validateISBNUPCData(marcRecords: any) {
    let warningMsg = '';
    const startWthRegex = /^[0-9].*$/;
    // checking for null or undefined
    if (marcRecords && !this.overrideMarc21) {
      marcRecords.forEach(element => { // for each marc record
        let isValidate = Constants.TaglengthToValidate.filter(h =>
          h.tag == element.tag
        );
        if (element.tag === '024') {
          isValidate = isValidate.filter(a => a.indicator === element.ind1);
        }
        // checking for subfield null or undefined
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
    return warningMsg;
  }
  // Validate the mandatory tags
  validateMandatoryTags() {
    let errorMsg = '';
    const mandatoryTags = Constants.MandatoryTags;
    if (!this.overrideMarc21) {
      mandatoryTags.forEach(element => {
        if (element.tag !== '260') {
          const isTagexists = this.marc.fields.find(a => a.tag === element.tag);
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
          const tagExists = this.marc.fields.filter(a => a.tag === '260' || a.tag === '264');
          if (tagExists.length === 0) {
            errorMsg = errorMsg !== '' ? (errorMsg + '<br/>' + '260/264') : '260/264';
          } else {
            if (!tagExists.find(a => a.subfields && a.subfields.filter(x => x.code === 'c').length > 0)) {
              errorMsg = errorMsg != '' ? (errorMsg + '<br/> 260/264: ' + this.marcSettings.delimiter + 'c') : '260/264: ' + this.marcSettings.delimiter + 'c';
            }
          }
        }
      });
    }
    return errorMsg != '' ? 'Please populate the following mandatory tags/subfields/subelements to save the MARC record: <br/><br/>' + errorMsg : errorMsg;
  }
  // Validate the obselete data
  validateObsoleteData(manupulatedData: QueryList<TextEditorComponent>, originalData: MarcDTO) {
    let obsoleteCount = 0;
    if (!this.overrideMarc21) {
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
    }
    return obsoleteCount;
  }
  // Validate the repeatable tag
  validateMarcField(field: MarcFieldDTO) {
    let findDuplicates: MarcFieldDTO[] = [];
    if (field) {
      if (field && field.tag && field.tag.length === 3 &&
        this.nonRepeatableTags && (this.nonRepeatableTags.indexOf(field.tag) !== -1 || field.tag === '000')  &&
        !this.isEmptyField(field)) {
          if (!this.overrideMarc21) {
            if (field.tag === '000') {
              findDuplicates = this.mergeMarcState.marc.fields.filter(h => h.tag.includes('Leader') || h.tag.includes('000'));
            } else if (field.type === 'controlfield' && (!field.tag.includes('001') && !field.tag.includes('005'))) {
              findDuplicates = this.mergeMarcState.marc.fields.filter(h => h.tag.includes(field.tag));
            } else {
              findDuplicates = this.mergeMarcState.marc.fields.filter(f =>
                f.tag.includes(field.tag) && (f.data || f.ind1 || f.ind2 || f.subFieldDescription)
              );
            }

            if (findDuplicates.length > 1) {
              field.isValid = false;
              field.errMsg = 'Not repeatable';
            // tslint:disable-next-line: max-line-length
            } else if (field.isValid && field.isTagChanged && Constants.SystemGeneratedTags && Constants.SystemGeneratedTags.find(a => a === field.tag)) {
              field.isValid = false;
              field.errMsg = field.tag + ' is system generated';
            } else if (!field.isValid && field.errMsg.includes('Not repeatable')) {
              field.isValid = true;
              field.errMsg = '';
            }
          } else {
            if (field.tag === '000') {
              findDuplicates = this.mergeMarcState.marc.fields.filter(h => h.tag.includes('Leader') || h.tag.includes('000'));
            }
            if (findDuplicates.length > 1) {
              field.isValid = false;
              field.errMsg = 'Not repeatable';
            // tslint:disable-next-line: max-line-length
            } else if (!field.isValid && field.errMsg.includes('Not repeatable')) {
              field.isValid = true;
              field.errMsg = '';
            }
          }

      } else if (!field.isValid && field.errMsg.includes('Not repeatable')) {
        field.isValid = true;
        field.errMsg = '';
      }
    }

  }
  // Validate the tag
  validateTag(field: any) {
    if (!this.overrideMarc21) {
      if (field.tag && field.tag === null || field.tag.trim() === '') {
        field.isValid = false;
        field.errMsg = 'Required';
        return field;
      } else if (field.tag.trim().length < 3) {
        field.isValid = false;
        field.errMsg = 'Length should be 3';
        return field;
      } else if (field && field.isValid && (field.tag.trim().length === 3  || field.tag.trim() === 'Leader')) {
        this.validateMarcField(field);
        // const selectedItem = this.existingMARCData.find(a => a.tag === field.tag);
        // if (selectedItem) {
        //   if (!selectedItem.repeatable) {
        //     const findDuplicates = this.mergeMarcState.marc.fields.filter(h =>
        //       h.tag.includes(field.tag)
        //     );
        //     if (findDuplicates.length > 1) {
        //       field.isValid = false;
        //       field.errMsg = 'Not repeatable';
        //     }
        //   }
        //   if (field.isTagChanged && selectedItem.isObsolete === true) {
        //     field.isValid = false;
        //     field.errMsg = 'Obsolete tag';
        //   }
        // }
        // if (field.isTagChanged && Constants.SystemGeneratedTags && Constants.SystemGeneratedTags.find(a => a === field.tag)) {
        //   field.isValid = false;
        //   field.errMsg = field.tag + ' is system generated';
        // }
      }
    }
    else if (field.tag ==='000' ||(field.isTagChanged && Constants.SystemGeneratedTags && Constants.SystemGeneratedTags.find(a => a === field.tag))) {
      field.isValid = false;
      if(field.tag ==='000')
      {
        field.errMsg = 'Not repeatable';
      }
      else{
      field.errMsg = field.tag + ' is system generated';
      }
    }
  }
  // Needed & but refactoring needed. Why JQuery?
  showDialogPopup(msg: string) {
    let data;
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
    this.subs.sink = dialogRef.afterClosed().subscribe(result => {
      data = result;
      $('#saveMarcRec').focus();
    });
    return data;
  }
  // Show the warning dialog popup
  showWarningDialogPopup(msg: string) {
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
    return this.warningDialogRef;
  }
  // TODO: Needed but not finished
  saveToServer(myForm: NgForm) {
    this.spinnerService.onRequestStarted();
    // this.spinnerService.spinnerStart();
    if (
      localStorage.getItem(Constants.LocalStorage.ACTOR) !== null &&
      localStorage.getItem(Constants.LocalStorage.ACTOR) !== ''
    ) {
      this.marc.lastModifiedBy = localStorage.getItem(Constants.LocalStorage.ACTOR);
    }
    myForm.form.markAsPristine();

    this.subs.sink = this.service.mergeMarcRecord(this.marc, this.sourceMarcId, this.retainValue).subscribe(result => {
      this.spinnerService.onRequestFinished();
      this.postSaveOperation(result);
    },
    (error) => {
      if (error.status == 403) {
        this.spinnerService.onRequestFinished();
        alert(error.statusText);
        this.router.navigate(['/unauthorized']);
      } else {
        this.spinnerService.onRequestFinished();
        throw(error);
      }
    });
  }
  // TODO: Needed but not finished
  postSaveOperation(result: any) {
    let message;
    if (result.IsSuccess) {
      message = 'The destination record has been updated successfully.';
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
      this.subs.sink = dialogRef.afterClosed().subscribe(() => {
        this.router.navigate(['/search']);
      });
    } else {
      this.displayWarnMessage = true;
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
  // Complete the merge process
  completeMerge(myForm: NgForm) {
    this.subs.sink = this.marcMergeAdapter.onCompleteMerge().subscribe(state => {
      this.mergeMarcState = state;
      this.SaveMarcRecordDetails(myForm);
    });
  }
  // On scroll close autocomplete
  onScroll() {
    this.subs.sink = this.scrollDispatcher
          .scrolled()
          .subscribe(() => {
            this.marcFields.forEach(x => {
              x.closeAutoComplete();
            });
          });
  }
  isEmptyField(field: MarcField) {
    return !(field && (field.data || field.ind1 || field.ind2 || field.subfields || field.subFieldDescription));
  }
  compareData(field: MarcField, finalField: MarcFieldDTO): boolean {
    const transformedField = this.marcMergeAdapter.transformField(field, 0);
    return transformedField.tag == finalField.tag &&
    transformedField.ind1 == finalField.ind1 &&
    transformedField.ind2 == finalField.ind2 &&
    transformedField.data == finalField.data &&
    transformedField.subFieldDescription == finalField.subFieldDescription;
  }
  openModal() {
    if (!this.isRecordHistoryMarc) {
      // Validate all tags
      this.mergeMarcState.marc.fields.forEach(field => {
        field.isValid = true;
        field.errMsg = '';
        this.validateTag(field);

      });
      this.validateAllFields();
      setTimeout(() => {
        const items = document.getElementsByClassName('border-danger');
        this.retainValue = true;
        if (items.length === 0) {
          this.displayWarnMessage = false;
          $('#mergeConfirmationPopup').modal('show');
        } else {
          this.displayWarnMessage = true;
        }
      }, 0);
    } else {
      // Validate all tags for record history marc and directly calling to complete merge function without confirmation prompt dialog
      this.mergeMarcState.marc.fields.forEach(field => {
        field.isValid = true;
        field.errMsg = '';
        this.validateTag(field);
      });
      setTimeout(() => {
        const items = document.getElementsByClassName('border-danger');
        this.retainValue = true;
        if (items.length === 0) {
          this.displayWarnMessage = false;
          this.completeMerge(this.form);
        } else {
          this.displayWarnMessage = true;
        }
      }, 0);
    }
  }
  onDrop(dropResult: DropResult) {
    const nonFixedFieldIndex: number = this.mergeMarcState.marc.fields.findIndex(
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
    this.lastFocused = dropResult.addedIndex;
    this.subs.sink = this.marcMergeAdapter.onDrop(dropResult).subscribe(state => {
      this.mergeMarcState = state;
    });
  }
  minHeight(index: number): number {
    let leftdivHeight = this.leftDivs.toArray()[index] ? this.leftDivs.toArray()[index].nativeElement.children[1].children[0].clientHeight : 25;
    let rightdivHeight = this.rightDivs.toArray()[index] ? this.rightDivs.toArray()[index].nativeElement.children[1].children[0].clientHeight : 25;
    let finaldivHeight = this.finalDivs.toArray()[index] ? this.finalDivs.toArray()[index].nativeElement.children[0].children[0].clientHeight : 32;
    const tag = this.mergeMarcState.marc.fields[index].tag;
    if (tag === 'Leader' || tag === '000' || tag === '006' || tag === '007' || tag === '008') {
      // get description textarea height
      finaldivHeight = this.finalDivs.toArray()[index] ? this.finalDivs.toArray()[index].nativeElement.children[0].children[0].children[2].clientHeight : 32;
      leftdivHeight = 25;
      rightdivHeight = 25;
    }
    return Math.max(leftdivHeight + 18 , rightdivHeight + 18, finaldivHeight + 10, 43.67);
  }

  // OnOverideMarc21() {
  //   const value = this.overrideMarc21;
  //   this.subs.sink = this.marcMergeAdapter.overrideMarc21(value).subscribe(state => {
  //     this.mergeMarcState = state;
  //   });
  // }

  isDeleteDisabled(isDeleteDisabled: boolean, tag: string): boolean {
    return this.overrideMarc21 && !(tag === '005' || tag === '997' || tag === 'Leader') ? false : isDeleteDisabled; // INstead of false, get isDeleteDisabledOnOverride from syssettings
  }
  isEditable(field: MarcFieldDTO): boolean {
    // tslint:disable-next-line: max-line-length
    // return (this.mergeMarcState.overrideMarc21 && !field.isFieldExpandable && !(field.tag === '005' || field.tag === '997')) ? true
    // : (field.isFieldExpandable && field.isValid && !field.isNew) ? false : field.isFieldEditable; // INstead of false, get isEditableOnOverride from syssettings
    return ((field.isNew || field.isTagChanged) ? true :
            (this.mergeMarcState.overrideMarc21 && !field.isFieldExpandable && !(field.tag === '005' || field.tag === '997') ?
            true : field.isFieldEditable ));
  }
  validateAllFields()
  {
    if(this.mergeMarcState && !this.mergeMarcState.overrideMarc21)
    {
    if(this.marcFields)
    {
      this.marcFields.forEach(field => {

      field.fieldValidations();
      });
    }
  }
  }
}
