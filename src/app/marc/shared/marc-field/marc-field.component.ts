import { startWith } from 'rxjs/operators';
import { Component, OnInit, Input, Renderer2, ViewChild, EventEmitter, Output, ElementRef, AfterViewInit, ViewChildren, QueryList } from '@angular/core';
import { MarcFieldDTO, EditTagDTO, EventParams, MarcFieldUpdateEventParams, MarcBibDataDTO, CopyPasteEventParams } from 'src/app/_dtos/btcat.vm.dtos';
import { Observable, of } from 'rxjs';
import { MatAutocomplete, MatAutocompleteTrigger, _countGroupLabelsBeforeOption, _getOptionScrollPosition, AUTOCOMPLETE_PANEL_HEIGHT } from '@angular/material';
import { MarcIndicator, MarcEditorSettings } from '../marc';
import { TextEditorComponent } from '../text-editor/texteditor.component';
import { EventActions } from '../utils';
import { NgForm, ControlContainer } from '@angular/forms';
import { ValidationParams } from '../../validators/validation-dto';
import { Constants } from 'src/app/constants/constants';
import { ActivatedRoute } from '@angular/router';
import { MarcEditSubElementsComponent } from '../../shared/marc-subelements/marc-edit-subelements.component';
import { MarcAdapter } from '../service/marc-adapter.service';
import { MarcSettingsService } from 'src/app/services/marc-settings.service';
import { HotkeysService, Hotkey } from 'angular2-hotkeys';
import { forEach } from '@angular/router/src/utils/collection';
import { ClonerService } from 'src/app/services/cloner.service';
import { UserConfigurationService } from 'src/app/users/user-configuration.service';

@Component({
  selector: 'marc-field',
  templateUrl: './marc-field.component.html',
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class MarcFieldComponent implements AfterViewInit, OnInit {
  @Input() position = 0;
  @Input() id: string;
  @Input() field: MarcFieldDTO;
  // TODO: Add types
  @Input() existingMARCData: MarcBibDataDTO[] = [];
  @Input() form: NgForm;
  @Input() tagsRemoved: EditTagDTO[];
  @Input() nonRepeatableTags: string[] = [];
  @Input() leaderDataWithHyphons: string;
  @Input() leaderData: string;
  @Input() isDeleteDisabled: boolean;
  @Input() isEditable: boolean;
  @Input() overrideValidation: boolean;
  @Input() isDragDisabled: boolean;
  @Output() leaderDataWithHyphonsChange = new EventEmitter<string>();
  @Output() fieldChanged = new EventEmitter<MarcFieldUpdateEventParams>();
  // @Output() fieldChanged = new EventEmitter<MarcFieldUpdateEventParams>();
  // @Output() tagfocused = new EventEmitter<MarcFieldUpdateEventParams>();
  // @Output() ind1Changed = new EventEmitter<MarcFieldUpdateEventParams>();
  // @Output() ind2Changed = new EventEmitter<MarcFieldUpdateEventParams>();
  // @Output() editMarcChanged = new EventEmitter<MarcFieldUpdateEventParams>();
  @Output() fieldOnblur = new EventEmitter<MarcFieldUpdateEventParams>();
  // @Output() ind1Onblur = new EventEmitter<MarcFieldUpdateEventParams>();
  // @Output() ind2Onblur = new EventEmitter<MarcFieldUpdateEventParams>();
  // @Output() editMarcOnblur = new EventEmitter<MarcFieldUpdateEventParams>();
  @Output() enterKeypress = new EventEmitter<EventParams>();
  @Output() copyActivated = new EventEmitter<CopyPasteEventParams>();
  @Output() cutActivated = new EventEmitter<CopyPasteEventParams>();
  @Output() pasteActivated = new EventEmitter<CopyPasteEventParams>();
  @Output() shiftTabKeypress = new EventEmitter<EventParams>();
  // tslint:disable-next-line: no-output-on-prefix
  @Output() onLeaderDataChange = new EventEmitter<any>();
  // @Output() upKeypress = new EventEmitter<EventParams>();
  @Output() upDownKeypress = new EventEmitter<EventParams>();
  @Output() deleteBtnClick = new EventEmitter<EventParams>();
  @ViewChild('editorComponent') editorComponent: TextEditorComponent;
  @ViewChild('subElementsComponent') subElementsComponent: MarcEditSubElementsComponent;
  @ViewChild('inputDesc') textAreaComponent: ElementRef;
  @ViewChild('inputTag') tagElement: ElementRef;
  @ViewChild('inputind1') ind1Element: ElementRef;
  @ViewChild('inputind2') ind2Element: ElementRef;
  @ViewChild('tagAutocomplete') tagAutocomplete: MatAutocomplete;
  @ViewChild('ind1Autocomplete') ind1Autocomplete: MatAutocomplete;
  @ViewChild('ind2Autocomplete') ind2Autocomplete: MatAutocomplete;
  @ViewChildren(MatAutocompleteTrigger, { read: MatAutocompleteTrigger }) matAutocompleteTrigger: QueryList<MatAutocompleteTrigger>;
  fieldType: string;


  // TODO: State shouldn't be handled here. This is a temporary solution until all controls are added into forms
  @Output() marcFieldDirtyState = new EventEmitter<boolean>();
  @Input() isValidateSubfield :boolean = true;
  fieldSubFieldDescription: string;
  isTagFieldDirty = false;
  isInd1FieldDirty = false;
  isInd2FieldDirty = false;
  revealSpaceStatus = false;
  readRevealSpaceStatus = false;
  isSubfieldFieldDirty = false;
  tagOriginalState: string;
  ind1OriginalState: string;
  ind2OriginalState: string;
  subfieldOriginalState: string;

  canMoveNextByMaxLength = true;
  leaderDescription = '';
  // tslint:disable-next-line: max-line-length
  tagValidationParams: ValidationParams;
  filteredMarcTags: Observable<EditTagDTO[]>;
  filteredIndicators1: Observable<MarcIndicator[]>;
  filteredIndicators2: Observable<MarcIndicator[]>;
  // TODO: Add types
  filteredSubFields: any = [];
  operationType: any;
  @Input() marcSettings:MarcEditorSettings;
  constructor(
    private hotkeysService: HotkeysService,
    private marcAdapter: MarcAdapter,
    private renderer2: Renderer2,
    private route: ActivatedRoute,
    private clonerService: ClonerService,
    private userConf: UserConfigurationService
  ) {

    // To ensure that if User Preference is changed its reflected
    this.userConf.revealSpaces$.subscribe(showSpaces => {
      this.readRevealSpaceStatus = true;
      this.revealSpaceStatus = showSpaces;
      this.fieldSubFieldDescription = this.FormatDataForRevealSpace(this.fieldSubFieldDescription, showSpaces);
    });
  }

  FormatDataForRevealSpace(data: string, revealSpace: boolean): string {
    let data2: string;
    if (revealSpace && this.field.tag === '003') {
      data2 = data.split(' ').join('□');
    } else {
      data2 = data.split('□').join(' ');
    }
    return data2;
  }
  getPositionNumberFromID(id: string): number {
    return +(id.startsWith('editIndicator') ? id.substring(14) : (id.startsWith('editMarcDesc') ? id.substring(12) : (id.startsWith('editTagData') ? id.substring(11) : id.substring(7))));
  }

  getSelectionPositions(): number[] {
    var selObj = window.getSelection();
    var selRange = selObj.getRangeAt(0);
    const positions = [];
    const c = selRange.cloneContents().querySelectorAll('*');
    if (c.length > 0) {
      c.forEach(e => {
        if (e.id.startsWith('editMarcDesc') || e.id.startsWith('editIndicator') || e.id.startsWith('editTagData') || e.id.startsWith('editTag')) {
          const position: number = this.getPositionNumberFromID(e.id);
          if (positions.indexOf(position) <= -1) {
            positions.push(position);
          }
        }
      });
    } else {
      positions.push(this.getPositionNumberFromID(event.srcElement.id));
    }
    return positions;
  }
  loadHotKeys() {

    //Copy of Marc Fields in Marc Editor
    this.hotkeysService.add(
      new Hotkey('ctrl+shift+c', (event: KeyboardEvent): boolean => {
        const positions = this.getSelectionPositions();
        console.log("Following rows to be copied:");
        positions.forEach(id => {
          console.log(id);
        });

        this.onCopyActivated(positions);
        return false;
      }, ['INPUT', 'SELECT', 'TEXTAREA'], 'Copy Ctrl+Shift+C'));

    //Cut of Marc Fields in Marc Editor
    this.hotkeysService.add(
      new Hotkey('ctrl+shift+x', (event: KeyboardEvent): boolean => {
        const positions = this.getSelectionPositions();
        console.log("Following rows to be copied:");
        positions.forEach(id => {
          console.log(id);
        });

        this.onCutActivated(positions);
        return false;
      }, ['INPUT', 'SELECT', 'TEXTAREA'], 'Copy Ctrl+Shift+C'));

    //Paste of MARC Fields in Marc Editor
    this.hotkeysService.add(
      new Hotkey('ctrl+shift+v', (event: KeyboardEvent): boolean => {
        var selObj = window.getSelection();
        var selRange = selObj.getRangeAt(0);
        var c = selRange.cloneContents().querySelectorAll('*');
        let replace = false;

        if (c.length > 0) {
          replace = true;
        }
        const positions = this.getSelectionPositions();

        this.onPasteActivated(positions, replace);

        return false;
      }, ['INPUT', 'SELECT', 'TEXTAREA'], 'Paste Ctrl+Shift+V'));

  }

  ngOnInit() {
    this.fieldSubFieldDescription = this.FormatDataForRevealSpace( this.field.subFieldDescription, this.IsRevealSpaceActive() );
    // tslint:disable-next-line: no-string-literal
    if (this.route.url && this.route.url['_value'] && this.route.url['_value'].length > 0) {
      // tslint:disable-next-line: no-string-literal
      this.operationType = this.route.url['_value'][0].path;
    }

    if (this.field && this.field.tag === 'Leader' || this.field.tag === '006' || this.field.tag === '007' || this.field.tag === '008') {
      this.field.isFieldExpandable = true;
    }
    this.tagOriginalState = this.field.tag;
    this.ind1OriginalState = this.field.ind1;
    this.ind2OriginalState = this.field.ind2;
    this.subfieldOriginalState = this.field.subFieldDescription;
    if (this.overrideValidation) {
      this.field.errMsg = '';
      this.field.ind1ErrMsg = '';
      this.field.ind2ErrMsg = '';
      this.field.isIndi1valid = true;
      this.field.isIndi2valid = true;
      this.field.isSubfieldValid = true;
      if(!(this.field.tag ==='000' && !this.field.isValid)){
        this.field.isValid = true;
      }
      this.field.isValidData = true;
    }
  }
  ngAfterViewInit(): void {
    this.tagValidationParams = { controls: [this.tagElement.nativeElement.name], field: this.field, bibData: this.existingMARCData };
    this.matAutocompleteTrigger.changes.subscribe((trigger) => {
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
    if(!this.overrideValidation){
      const texteditorControl = this.editorComponent ? this.editorComponent : null;
      if (texteditorControl) {
            texteditorControl.checkData(true);
          }
    }
  }
  // Edit Tag Events
  onTagChange(inputTag: string) {
    // OnChange make MoveNextByMaxLength active
    this.canMoveNextByMaxLength = true;
    // TODO: Remove 1
    this.field.isFieldExpandable = false;
    this.field.isFieldExpanded = false;
    // TODO: Remove 2
    this.field.isLeaderCtrlField = false;
    // TODO: Remove 3
    this.field.isSubfieldValid = true;
    // TODO: Remove 4
    if (inputTag && inputTag.length === 3) {
      this.field.tag = inputTag;
      // TODO: Remove 5
      this.field.isValid = true;
      // TODO: Remove 6
      this.field.isTagChanged = true;
      // TODO: Add type & existingMARCData should be @Input
      const selectedItem = this.existingMARCData.find(marcbib => marcbib.tag === (inputTag === '000' ? 'Leader' : inputTag));
      if (selectedItem) {
        if ((inputTag === '000' && !this.field.isLeaderCtrlField) || this.fieldType != selectedItem.type || (this.fieldType === 'controlfield' && selectedItem.type === 'controlfield')) {
          this.resetFields();
        } else {
          const texteditorControl = this.editorComponent ? this.editorComponent : null;
          if (texteditorControl) {
            texteditorControl.checkData(true);
          }
          // this.validateIndicator2Value();
        }
        this.field.type = selectedItem.type;
        this.fieldType = selectedItem.type;
      } else {
        this.field.type = null;
        this.fieldType = null;
      }
      if (this.field.type !== 'controlfield' && inputTag !== '000') {
        this.getSubFieldAutoCompleteByTag(this.field.tag);
      }

      // todo need to handle this logic
      // Why the condition dataItem.isTagChanged? TODO: Don't modify dto for validation. Need to use form controls.
      if (!this.overrideValidation && this.field.isTagChanged && this.field.tag !='000'&& Constants.SystemGeneratedTags && Constants.SystemGeneratedTags.find(a => a === inputTag)) {
        this.field.isValid = false;
        this.field.errMsg = inputTag + ' is system generated';
      }
      if (this.field.type === 'controlfield' || inputTag === '000') {
        this.field.isLeaderCtrlField = true;
      } else {
        this.field.isLeaderCtrlField = false;
      }
      this.filteredMarcTags = of([]);
      if (this.field.type === 'controlfield' || this.field.tag === '000') {
          setTimeout(() => {
            const elem: Element = document.getElementById('editMarcDesc' + this.position);
            if (elem != null) {
              this.renderer2.selectRootElement('#editMarcDesc' + this.position).focus();
            }
          }, 0);
      }
    } else {
      // tslint:disable-next-line: max-line-length
      this.filteredMarcTags = this.overrideValidation ? of(this.marcAdapter.getOverrideEditTags(inputTag, this.tagsRemoved)) : of(this.marcAdapter.getEditTags(inputTag, this.tagsRemoved));
      if (this.field.type === 'controlfield' || this.field.tag === '000') {
        // this.tagIndex = index;
        this.field.type = null;
        setTimeout(() => {
          const elem: Element = document.getElementById('editTagData' + this.position);
          if (elem != null) {
            this.renderer2.selectRootElement('#editTagData' + this.position).focus();
          }
        }, 0);
      }
      this.field.tag = inputTag;
    }
    // TODO: State shouldn't be handled here. This is a temporary solution until all controls are added into forms
    if (inputTag === this.tagOriginalState) {
      this.isTagFieldDirty = false;
    } else {
      this.isTagFieldDirty = true;
    }
    // TODO: State shouldn't be handled here. This is a temporary solution until all controls are added into forms
    this.emitState();
    const eventParams: MarcFieldUpdateEventParams = {
      field: this.field,
      position: this.position,
      action: 'marc-field-updated'
    };
    this.fieldChanged.emit(eventParams);
  }
  onTextAreaFocus(event: any) {
    // TODO: Need to create an object to maintain state. As of now adding a new variable to teh data object
    if (this.field.isLeaderCtrlField && this.field.isSubfieldValid) {
      event.target.classList.remove('border-danger');
    } else {
      event.target.classList.add('border-danger');
    }
  }
  resetFields() {
    this.field.subFieldDescription = '';
    this.fieldSubFieldDescription = '';
    this.field.data = '';
    this.field.ind1 = '';
    this.field.ind2 = '';
    this.field.ind1ErrMsg = '';
    this.field.ind2ErrMsg = '';
    this.field.isTagChanged = true;
    this.field.isIndi1valid = true;
    this.field.isIndi2valid = true;
    this.field.isSubfieldValid = true;
    this.field.subfields = [];
    const texteditorControl = this.editorComponent ? this.editorComponent : null;
    if (this.field.type == null && texteditorControl) {
      texteditorControl.writeValue('');
    }
  }
  onTagFocusOut(event: any, trigger: MatAutocompleteTrigger) {
    if (event.relatedTarget && event.relatedTarget.nodeName !== 'MAT-OPTION'
      && trigger !== null && trigger !== undefined) {
      trigger.closePanel();
    }
    this.validateTag();
    this.validateInd1();
    this.validateInd2();
    event.preventDefault();
    // TODO: State shouldn't be handled here. This is a temporary solution until all controls are added into forms
    this.emitState();
    const eventParams: MarcFieldUpdateEventParams = {
      field: this.field,
      position: this.position,
      action: 'marc-field-blur'
    };
    this.fieldOnblur.emit(eventParams);
  }
  onTagFocus(event: any) {
    setTimeout(() => {
      if (this.field && (this.field.tag === '' || this.field.tag.length < 3)) {
        this.filteredMarcTags = this.overrideValidation ? of(this.marcAdapter.getOverrideEditTags(this.field.tag, this.tagsRemoved)) : of(this.marcAdapter.getEditTags(this.field.tag, this.tagsRemoved));
      } else {
        this.filteredMarcTags = of([]);
      }
    });
    // Why  this.field.isFieldExpanded = false;?
    if (!this.field.isValid && this.field.isFieldEditable && (this.field.tag === '000' || this.field.tag === 'Leader' || this.field.tag === '008')) {
      this.field.isFieldExpanded = false;
    }
    if (this.field) {

      // issue-4569
      if (!this.overrideValidation && this.field.isTagChanged && this.field.tag !='000' && Constants.SystemGeneratedTags && Constants.SystemGeneratedTags.find(a => a === this.field.tag)) {
        this.field.isValid = false;
        this.field.errMsg = this.field.tag + ' is system generated';
      }

      this.field.isValid = true;
      this.field.errMsg = '';


    }
    event.preventDefault();
    // this.emitField();
  }
  // Shared Events

  onCopyActivated(positions: number[]) {
    const eventParams: CopyPasteEventParams = {
      action: 'row-copy-key-pressed',
      copyPositions: positions
    };

    this.copyActivated.emit(eventParams);
  }

  onCutActivated(positions: number[]) {
    const eventParams: CopyPasteEventParams = {
      action: 'row-cut-key-pressed',
      copyPositions: positions
    };

    this.cutActivated.emit(eventParams);
  }


  onPasteActivated(positions: number[], replace: boolean) {
    const eventParams: CopyPasteEventParams = {
      action: 'row-paste-key-pressed',
      pastePositions: positions,
      replacePositions: replace
    };
    this.pasteActivated.emit(eventParams);
  }

  onEnterKeyPress(trigger: MatAutocompleteTrigger) {
    const eventParams: EventParams = {
      controlName: null,
      position: this.id,
      action: 'enter-key-pressed',
      controlPosition: this.position
    };
    if (this.field && (!(this.field.tag) || this.field.tag === '003' || (this.field.tag ==='001' && this.overrideValidation) ||
      (this.field.isFieldEditable && this.field.tag !== 'Leader'))) {
      if (trigger !== null && trigger !== undefined && !trigger.panelOpen) {
        this.canMoveNextByMaxLength = false;
        this.enterKeypress.emit(eventParams);
        trigger.closePanel();
      } else if (this.field && (this.field.tag === '003' || (this.field.tag ==='001' && this.overrideValidation)) && trigger == null) {
        this.enterKeypress.emit(eventParams);
      }

    }
  }
  onUpKeyPress(event: any, controlName: string, trigger: MatAutocompleteTrigger) {
    event.preventDefault();
    if (controlName === 'marcDesc' || (trigger !== null && trigger !== undefined && !trigger.panelOpen)) {
      this.canMoveNextByMaxLength = false;
      // this.cdr.markForCheck();
      const element = event.target ? event.target : event.srcElement;
      const position = { line: 0, ch: element.selectionStart };
      const eventParams: EventParams = {
        controlName,
        position,
        action: 'focus-top-element',
        controlPosition: this.position
      };
      // this.handleUpDownPressed(keyboardEmitterParams, index);
      if (trigger) {
        trigger.closePanel();
      }
      // TODO Emit Event
      this.upDownKeypress.emit(eventParams);
    }
  }
  onShiftEnterPress(event: any) {
    if (event.preventDefault) {
      event.preventDefault();
    }
    event.returnValue = false;
    event.stopPropagation();
  }
  onCtrlZPressed(event: any) {
    const fieldData = this.existingMARCData.find(c => c.tag === this.field.tag);
    if (event && event.srcElement && event.srcElement.id.includes('editIndicator') && event.srcElement.value === ' ') {
      event.srcElement.value = '';
      if (event.srcElement.id.includes('editIndicator1')) {
        this.filteredIndicators1 = of(fieldData.ind1);
      } else  {
        this.filteredIndicators2 = of(fieldData.ind2);
      }
    }
    this.canMoveNextByMaxLength = false;
  }
  onDownKeyPress(event: any, controlName: string, trigger: MatAutocompleteTrigger) {
    event.preventDefault();
    if (controlName === 'marcDesc' || (trigger !== null && trigger !== undefined && !trigger.panelOpen)) {
      this.canMoveNextByMaxLength = false;
      // this.cdr.markForCheck();
      const element = event.target ? event.target : event.srcElement;
      const position = { line: 0, ch: element.selectionStart };
      const eventParams: EventParams = {
        controlName,
        position,
        action: 'focus-bottom-element',
        controlPosition: this.position
      };
      // this.handleUpDownPressed(keyboardEmitterParams, index);
      if (trigger !== null && trigger !== undefined && !trigger.panelOpen) {
        trigger.closePanel();
      }
      // TODO Emit Event
      this.upDownKeypress.emit(eventParams);
    }
  }
  // Indicator Events
  onIndicator1Change(inputVal: string) {
    // TODO: Handle in the parent class
    // myForm.form.markAsDirty();
    // inputVal = inputVal.length > 1 ? inputVal.trim() : inputVal;
    if (!this.canMoveNextByMaxLength) {
      this.canMoveNextByMaxLength = true;
    }
    this.field.ind1 = inputVal ? inputVal : '';

    if (inputVal && inputVal.length === 1) {
      if (this.field.tag === '024') {
        const texteditorControl = this.editorComponent ? this.editorComponent : null;
        setTimeout(() => {
          if (texteditorControl !== undefined && texteditorControl !== null) {
            texteditorControl.checkData(true);
          }
        }, 0);
      }
      this.filteredIndicators1 = of([]);
    } else {
      const fieldData = this.existingMARCData.find(c => c.tag === this.field.tag);
      if (fieldData) {
        this.filteredIndicators1 = of(fieldData.ind1);
      }
    }
    // TODO: State shouldn't be handled here. This is a temporary solution until all controls are added into forms
    if (inputVal === this.ind1OriginalState) {
      this.isInd1FieldDirty = false;
    } else {
      this.isInd1FieldDirty = true;
    }
  }
  onIndicator2Change(inputVal: string) {
    // TODO: Handle in the parent class
    // myForm.form.markAsDirty();
    if (!this.canMoveNextByMaxLength) {
      this.canMoveNextByMaxLength = true;
    }
    this.field.ind2 = inputVal ? inputVal : '';
    if (inputVal && inputVal.length === 1) {
      this.filteredIndicators2 = of([]);
    } else {
      const fieldData = this.existingMARCData.find(c => c.tag === this.field.tag);
      if (fieldData) {
        this.filteredIndicators2 = of(fieldData.ind2);
      }
    }
    // TODO: State shouldn't be handled here. This is a temporary solution until all controls are added into forms
    if (inputVal === this.ind2OriginalState) {
      this.isInd2FieldDirty = false;
    } else {
      this.isInd2FieldDirty = true;
    }
  }
  onIndicator1Focus(event: any) {
    this.filteredIndicators1 = of([]);
    event.target.classList.remove('border-danger');
    if (this.field.ind1) {
      this.field.ind1ErrMsg = '';
      this.field.isIndi1valid = true;
    }
    if (event.target.value === null || event.target.value === '') {
      this.field.ind1 = '';
      const fieldData = this.existingMARCData.find(c => c.tag === this.field.tag);
      if (fieldData) {
        this.filteredIndicators1 = of(fieldData.ind1);
      }
    }
    // this.emitField();
  }
  onIndicator2Focus(event: any) {
    this.filteredIndicators2 = of([]);
    event.target.classList.remove('border-danger');
    if (this.field.ind2) {
      this.field.ind2ErrMsg = '';
      this.field.isIndi2valid = true;
    }
    if (event.target.value == null || event.target.value === '') {
      this.field.ind2 = '';
      const fieldData = this.existingMARCData.find(c => c.tag === this.field.tag);
      if (fieldData) {
        this.filteredIndicators2 = of(fieldData.ind2);
      }
    }
    // this.emitField();
  }
  onIndicator1FocusOut(event: any, trigger: MatAutocompleteTrigger) {
    // TODO: STate Management Issue
    this.field.ind1 = event.target.value;
    if (event.relatedTarget && event.relatedTarget.nodeName !== 'MAT-OPTION'
      && trigger !== null && trigger !== undefined) {
      trigger.closePanel();
    }
    this.validateTag();
    this.validateInd1();
    this.validateInd2();
    // TODO: State shouldn't be handled here. This is a temporary solution until all controls are added into forms
    this.emitState();
    const eventParams: MarcFieldUpdateEventParams = {
      field: this.field,
      position: this.position,
      action: 'marc-field-blur'
    };
    this.fieldOnblur.emit(eventParams);
  }
  onIndicator2FocusOut(event: any, trigger: MatAutocompleteTrigger) {
    // TODO: STate Management Issue
    this.field.ind2 = event.target.value;
    if (event.relatedTarget && event.relatedTarget.nodeName !== 'MAT-OPTION'
      && trigger !== null && trigger !== undefined) {
      trigger.closePanel();
    }
    this.validateTag();
    this.validateInd1();
    this.validateInd2();
    // TODO: State shouldn't be handled here. This is a temporary solution until all controls are added into forms
    this.emitState();
    const eventParams: MarcFieldUpdateEventParams = {
      field: this.field,
      position: this.position,
      action: 'marc-field-blur'
    };
    this.fieldOnblur.emit(eventParams);
  }
  validateIndicator2Value() {
    const ind2Data = this.field.ind2;
    if (this.field && this.field.tag.trim() != null && ind2Data && ind2Data != null && ind2Data !== '') {
      const isFieldExists = this.existingMARCData.find(a => a.tag === this.field.tag);
      if (
        isFieldExists &&
        isFieldExists.ind2 &&
        isFieldExists.ind2.length > 0 &&
        !isFieldExists.ind2.find(a => a.code === ind2Data)
      ) {
        this.field.isIndi2valid = false;
        this.field.ind2ErrMsg = 'Indicator is invalid';
      } else if (this.field.isTagChanged && isFieldExists && isFieldExists.ind2 &&
        isFieldExists.ind2.find(a => a.code === ind2Data && a.isObsolete === true)) {
        this.field.isIndi2valid = false;
        this.field.ind2ErrMsg = 'Indicator is obsolete';
      } else {
        this.field.isIndi2valid = true;
        this.field.ind2ErrMsg = '';
      }
    }
  }
  OnInd1Change(event: any) {
    this.field.isTagChanged = true;
    event.target.classList.remove('border-danger');

    if (this.field.ind1 === '' && event) {
      this.onIndicator1Focus(event);
    }
    // event.preventDefault();
    // this.emitField();
  }
  OnInd2Change(event: any) {
    this.field.isTagChanged = true;
    // const ind2Data = event.target.value;
    event.target.classList.remove('border-danger');
    if (this.field.ind2 === '' && event) {
      this.onIndicator2Focus(event);
    }
  }
  onSubfieldChange(data: string) {
    this.field.isTagChanged = true;
    this.fieldSubFieldDescription = this.FormatDataForRevealSpace(data, this.IsRevealSpaceActive());
    this.field.subFieldDescription = data;
    // if (!this.overrideValidation) {
    const eventParams: MarcFieldUpdateEventParams = {
        field: this.field,
        position: this.position,
        action: 'marc-field-blur'
      };
    this.fieldChanged.emit(eventParams);
    // }

  }
  handleInd2TabKeyPressed(event: any) {
    // textEditor readonly, then default behavior
    if (this.editorComponent.readonly) {
      return;
    }
    else {
      event.preventDefault();
      this.editorComponent.focusHandler();
    }
  }
  // Text Editor Events
  handleTextEditorEnterKeyPressed() {
    const eventParams: EventParams = {
      controlName: null,
      position: this.id,
      action: 'enter-key-pressed',
      controlPosition: this.position
    };
    this.enterKeypress.emit(eventParams);
  }
  handleTextEditorUpDownPressed(eventargs: EventParams) {
    eventargs.controlPosition = this.position;
    this.upDownKeypress.emit(eventargs);
  }
  handleTextEditorShiftTabPressed(eventargs: EventParams) {
    this.canMoveNextByMaxLength = false;
    if (eventargs.action === EventActions.FOCUS_LEFT_ELEMENT) {
      setTimeout(() => {
        if (this.ind2Element !== undefined && this.ind2Element !== null) {
          // As per angular community there is no efficient way to select or setfocus using Renderer2
          this.ind2Element.nativeElement.select();
        }
      }, 0);
    }
  }
  // TODO: State shouldn't be handled here. This is a temporary solution until all controls are added into forms
  onTextEditorFocusOut(data: string) {
    if (data === this.subfieldOriginalState) {
      this.isSubfieldFieldDirty = false;
    } else {
      this.isSubfieldFieldDirty = true;
    }
    this.validateTag();
    this.validateInd1();
    this.validateInd2();
    this.emitState();
    const eventParams: MarcFieldUpdateEventParams = {
      field: this.field,
      position: this.position,
      action: 'marc-field-blur'
    };
    this.fieldOnblur.emit(eventParams);
  }

  IsRevealSpaceActive() {
    if (this.field.tag === '003') {
      if (!this.readRevealSpaceStatus) {
        this.revealSpaceStatus = this.userConf.getRevealSpaces();
      }
    } else {
      this.revealSpaceStatus = false;
    }
    return this.revealSpaceStatus;
  }

  UpdateMarcDescValueOnKeyPress(event) {
    var srcField = event.srcElement;
    if (typeof(srcField) !== "undefined" && srcField !== null) {
      var sKey = event.keyCode;
      if(sKey === 32 &&  this.IsRevealSpaceActive()) { // space
        const inputLetter = ' ';
        var caretPos = srcField.selectionStart;
        var startString = srcField.value.slice(0, srcField.selectionStart);
        var endString = srcField.value.slice(srcField.selectionEnd, srcField.value.length);
        srcField.value = this.FormatDataForRevealSpace(startString + inputLetter + endString, true);
        this.setCaretPosition(srcField, caretPos+1); // '+1' puts the caret after the input
        event.preventDefault ? event.preventDefault() : event.returnValue = false; //for IE8
      }
    }
  }
  setCaretPosition(elem, caretPos) {
    if (elem != null) {
        if (elem.createTextRange) {
            var range = elem.createTextRange();
            range.move('character', caretPos);
            range.select();
        } else {
            if (elem.selectionStart) {
                elem.focus();
                elem.setSelectionRange(caretPos, caretPos);
            } else {
                elem.focus();
            }
        }
    }
  }

  // TODO: Why do I need this? Can't we handle this logic out of this method?
  UpdateControlFieldValue(data: string) {
    this.field.isValidData = true;
    if (data && (this.field.tag === '003' || (this.overrideValidation && this.field.tag ==='001'))) {
      // Why do I need subFieldDescription and Data? How are they different?
      let newval = data;
      if (this.field.tag === '003') {
        newval = this.FormatDataForRevealSpace(newval, false);
      }
      this.field.subFieldDescription = newval;
      this.field.data = newval;
      const eventParams: MarcFieldUpdateEventParams = {
        field: this.field,
        position: this.position,
        action: 'marc-field-updated'
      };
      this.fieldChanged.emit(eventParams);
      // this.onTextEditorFocusOut(this.field);
      // this.onTextEditorFocusOut(this.field.subFieldDescription);
    }
  }
  // AutoComplete Events
  setSelectedTag(selectedItem: EditTagDTO) {
    // TODO: Can I move this to ngOnChange??
    this.canMoveNextByMaxLength = true;
    if (this.field && selectedItem) {
      this.field.isValid = true;
      // TODO: CHeck why?
      // this.isTagChange = true;
      this.field.tag = selectedItem.tag;
      // this.cdr.markForCheck();
      this.field.type = selectedItem.type;
      // TODO: REPEATABLE LOGIC SHOULD BE MOVED To PRATENT
      // if (!selectedItem.repeatable) {
      //   const isTagexists = this.marc.fields.find(a => a.tag === selectedItem.tag);
      //   if (isTagexists) {
      //     dataItem.isValid = false;
      //   }
      // }
      // TODO: Handle using directive if possible
      setTimeout(() => {
        if (this.ind1Element != null) {
          // TODO: Bug 2021
          this.ind1Element.nativeElement.select();
        }
        if (selectedItem.type === 'controlfield') {
          if (this.textAreaComponent != null) {
            // TODO: Bug 2021
            this.textAreaComponent.nativeElement.select();
          }
        }
      }, 0);
    }
    // this.emitField();
  }
  setSelectedInd1() {
    this.filteredIndicators1 = of([]);
    this.canMoveNextByMaxLength = true;
    setTimeout(() => {
      if (this.ind2Element != null) {
        // TODO: Bug 2021
        this.ind2Element.nativeElement.select();
      }
    }, 0);
    // this.emitField();
  }
  setSelectedInd2() {
    this.canMoveNextByMaxLength = true;
    this.filteredIndicators2 = of([]);
    // TODO: Not Needed
    // this.filteredIndicators2[index] = of([]);
    // const id = 'editMarcDesc' + index;
    // TODO: Not Needed
    // const descCtrl = this.editorComponents.find(x => x.parentElement.id === id);
    // const cmInstance = descCtrl === undefined ? descCtrl : descCtrl.editor;
    setTimeout(() => {
      if (this.editorComponent && this.editorComponent.editor) {
        // TODO: Not Needed
        // if (descCtrl !== undefined && descCtrl !== null) {
        this.editorComponent.focusHandler();
      }
    }, 0);
    // this.emitField();
  }
  onMouseDown() {
    this.clearAutocomplete();
  }
  onDragHandlerShiftTabPressed(e: any) {
    if (this.field && this.field.tag !== '997') {
      e.preventDefault();
      const texteditorControl = this.editorComponent ? this.editorComponent : null;
      const textAreaControl = (this.field.isLeaderCtrlField && this.textAreaComponent) ? this.textAreaComponent : null;
      setTimeout(() => {
        if (texteditorControl !== undefined && texteditorControl !== null) {
          texteditorControl.focusLastSubfield();
        }
        if (textAreaControl !== undefined && textAreaControl !== null) {
          textAreaControl.nativeElement.focus();
        }
      }, 0);
    }
  }
  // Focus to text-editor if drag button is disabled
  onDeleteShiftTabPressed(e: any) {
    if (this.isDragDisabled) {
      this.onDragHandlerShiftTabPressed(e);
    } else {
      return true;
    }
  }
  onDelete() {
    if (!this.isDeleteDisabled) {
      const eventParams: EventParams = {
        controlName: null,
        position: this.position,
        action: 'delete-marc-field'
      };
      this.deleteBtnClick.emit(eventParams);
    }
  }
  // Expandable Event
  showEditSubEle() {
      this.field.isFieldExpanded = !this.field.isFieldExpanded;
  }
  handleLeaderDataWithHyphonsChange(event: string) {
    this.leaderDataWithHyphons = event;
    this.leaderDataWithHyphonsChange.emit(this.leaderDataWithHyphons);
  }
  private clearAutocomplete() {
    this.filteredIndicators1 = of([]);
    this.filteredIndicators2 = of([]);
    this.filteredMarcTags = of([]);
  }
  // Utility Methods
  setTagCaretPosition(startPosition: string, endPosition: string): void {
    const tagCtrl = this.tagElement === undefined ? this.tagElement : this.tagElement.nativeElement;
    setTimeout(() => {
      if (tagCtrl !== undefined && tagCtrl !== null) {
        tagCtrl.focus();
        tagCtrl.setSelectionRange(startPosition, endPosition);
      }
    }, 0);
  }
  setInd1CaretPosition(startPosition: string, endPosition: string): void {
    const ind1Ctrl = this.ind1Element === undefined ? this.ind1Element : this.ind1Element.nativeElement;
    setTimeout(() => {
      if (ind1Ctrl !== undefined && ind1Ctrl !== null) {
        ind1Ctrl.focus();
        ind1Ctrl.setSelectionRange(startPosition, endPosition);
      }
    }, 0);
  }
  setInd2CaretPosition(startPosition: string, endPosition: string): void {
    const ind2Ctrl = this.ind2Element === undefined ? this.ind2Element : this.ind2Element.nativeElement;
    setTimeout(() => {
      if (ind2Ctrl !== undefined && ind2Ctrl !== null) {
        ind2Ctrl.focus();
        ind2Ctrl.setSelectionRange(startPosition, endPosition);
      }
    }, 0);
  }
  setSubfieldCaretPosition(position: any): void {
    const cmInstance = this.editorComponent === undefined ? this.editorComponent : this.editorComponent.editor;
    const textareaCtrl = this.textAreaComponent === undefined ? this.textAreaComponent : this.textAreaComponent.nativeElement;
    setTimeout(() => {
      if (cmInstance !== undefined && cmInstance != null) {
        cmInstance.focus();
        cmInstance.setCursor(position.line, position.ch);
        // cmInstance.setCursor(eventargs.position.line, eventargs.position.ch);
      }
      if (textareaCtrl !== undefined && textareaCtrl !== null) {
        textareaCtrl.focus();
        textareaCtrl.setSelectionRange(position.ch, position.ch);
      }
    }, 0);
  }
  // Private Methods
  private getSubFieldAutoCompleteByTag(tag: string) {
    if (tag && tag.trim() !== '') {
      let subfieldData = [];
      this.filteredSubFields = [];
      const fieldData = this.existingMARCData.find(c => c.tag === tag);
      if (fieldData) {
        subfieldData = fieldData.subfields;
      }
      return subfieldData;
    }
  }
  displayValidationMessage(control: any) {
    console.log(control);
  }
  getUpdatedvalue(item: any) {
    if (item != null && item.updatedvalue != null) {
      // TODO: Handle based on data
      if (this.field.isLeaderCtrlField && this.textAreaComponent) {
        if (item.isValidRow) {
          this.textAreaComponent.nativeElement.classList.remove('border-danger');
        } else {
          this.textAreaComponent.nativeElement.classList.add('border-danger');
        }
      }
      if (this.field) {
        this.fieldSubFieldDescription = this.FormatDataForRevealSpace( item.updatedvalue, this.IsRevealSpaceActive() );
        this.field.subFieldDescription = item.updatedvalue;
        this.field.data = item.updatedvalue;
        this.field.isValidData = item.isValidRow;
        this.field.isSubfieldValid = item.isValidRow;
        if (this.field.tag === '000' || this.field.tag === 'Leader') {
          // TODO : Need to optimize
          this.leaderDescription = this.getSubFieldData(item.updatedvalue);
          this.field.subFieldDescription = this.leaderDescription;
          this.fieldSubFieldDescription = this.FormatDataForRevealSpace( this.field.subFieldDescription, this.IsRevealSpaceActive() );;
          this.onLeaderDataChange.emit(item);
        }
        // this.getTotalRecordLength();
        // TODO: Emit field data
      }
    }
    // Check dirty check for subfield/sub element data
    this.onTextEditorFocusOut(this.field.subFieldDescription);
  }
  getSubFieldData(data: string): string {
    if (data) {
      return data.substring(5, 10) + data.substring(17, 20);
    }
    return '';
  }
  // TODO: State shouldn't be handled here. This is a temporary solution until all controls are added into forms
  emitState() {
    if ((this.isTagFieldDirty && (this.tagAutocomplete && !this.tagAutocomplete.isOpen)) ||
      (this.isInd1FieldDirty && (this.ind1Autocomplete && !this.ind1Autocomplete.isOpen)) ||
      (this.isInd2FieldDirty && (this.ind2Autocomplete && !this.ind2Autocomplete.isOpen)) ||
      this.isSubfieldFieldDirty) {
      this.marcFieldDirtyState.emit(true);
    } else {
      this.marcFieldDirtyState.emit(false);
    }
  }
  closeAutoComplete() {
    this.matAutocompleteTrigger.forEach(matAutocomplete => {
      matAutocomplete.closePanel();
    });
    if (this.editorComponent) {
      this.editorComponent.closeAutocomplete();
    }
  }
  // Validators
  private validateTag() {
    if (!this.overrideValidation) {
      if (this.field.tag && this.field.tag === null || this.field.tag.trim() === '') {
        this.field.isValid = false;
        this.field.errMsg = 'Required';
        return this.field;
      } else if (this.field.tag.trim().length < 3) {
        this.field.isValid = false;
        this.field.errMsg = 'Length should be 3';
        return this.field;
      } else if (this.field && this.field.isValid && this.field.tag.trim().length === 3) {
        const selectedItem = this.existingMARCData.find(a => a.tag === this.field.tag);
        if (selectedItem) {
          // if (!selectedItem.repeatable) {
          //   const findDuplicates = this.marc.fields.filter(h =>
          //     h.tag.includes(field.tag)
          //   );
          //   if (findDuplicates.length > 1) {
          //     field.isValid = false;
          //     field.errMsg = 'Not repeatable';
          //   }
          // }
          // why this.field.isTagChanged?
          if (this.field.isTagChanged && selectedItem.isObsolete === true) {
            // if (selectedItem.isObsolete === true) {
            this.field.isValid = false;
            this.field.errMsg = 'Obsolete tag';
          }
        }
        // why this.field.isTagChanged?
        if (this.field.isTagChanged && this.field.tag !='000' && Constants.SystemGeneratedTags && Constants.SystemGeneratedTags.find(a => a === this.field.tag)) {
          this.field.isValid = false;
          this.field.errMsg = this.field.tag + ' is system generated';
        }
        // Why !(this.operationType.indexOf('edit') > -1)?
        if (this.field.isTagChanged && this.field.tag !='000' && Constants.SystemGeneratedTagsInCreate
          && !(this.operationType.indexOf('template') === -1 && (this.operationType.indexOf('edit') > -1 || this.operationType.indexOf('merge') > -1))
          && Constants.SystemGeneratedTagsInCreate.find(a => a === this.field.tag)) {
          this.field.isValid = false;
          this.field.errMsg = this.field.tag + ' is system generated';
        }
      }
    } else if (this.field.tag ==='000' ||(this.field.isTagChanged && Constants.SystemGeneratedTags && Constants.SystemGeneratedTags.find(a => a === this.field.tag))) {
      this.field.isValid = false;
      if(this.field.tag ==='000')
      {
        this.field.errMsg = 'Not repeatable';
      }
      else{
      this.field.errMsg = this.field.tag + ' is system generated';
      }
    }
  }
  validateInd2() {
    if (!this.overrideValidation) {
      const ind2Data = this.ind2Element ? this.ind2Element.nativeElement.value.trim() : '';
      if (this.field && (this.field.tag === null || this.field.tag.trim() === '')
        && ind2Data && ind2Data !== null && ind2Data.trim() !== '') {
        this.field.isValid = false;
        this.field.errMsg = 'Required';
      } else {
        this.Ind2Validator(this.field.isTagChanged,ind2Data);
      }
    }
  }
  validateInd1() {
    if (!this.overrideValidation) {
      const ind1Data = this.ind1Element ? this.ind1Element.nativeElement.value.trim() : '';
      if (this.field && (this.field.tag === null || this.field.tag.trim() === '') && ind1Data && ind1Data !== null && ind1Data !== '') {
        this.field.isValid = false;
        this.field.errMsg = 'Required';
      } else {
        this.ind1Validator(this.field.isTagChanged,ind1Data);
      }
    }
  }

  //to do Code optiomization required
  validateInd1OnSave() {
    if (!this.overrideValidation) {
      const ind1Data = this.field.ind1.trim();
      if (this.field && (this.field.tag === null || this.field.tag.trim() === '') && ind1Data && ind1Data !== null && ind1Data !== '') {
        this.field.isValid = false;
        this.field.errMsg = 'Required';
      } else {
        this.ind1Validator(true,ind1Data);
      }
    }
  }

  validateInd2OnSave() {
    if (!this.overrideValidation) {
      const ind2Data = this.field.ind2.trim();
      if (this.field && (this.field.tag === null || this.field.tag.trim() === '')
        && ind2Data && ind2Data !== null && ind2Data.trim() !== '') {
        this.field.isValid = false;
        this.field.errMsg = 'Required';
      } else {
        this.Ind2Validator(true,ind2Data);
      }
    }
  }

  Ind2Validator(isTagChanged,val)
  {
    if (!this.overrideValidation) {
      const ind2Data = val
      if (this.field && (this.field.tag === null || this.field.tag.trim() === '')
        && ind2Data && ind2Data !== null && ind2Data.trim() !== '') {
        this.field.isValid = false;
        this.field.errMsg = 'Required';
      } else {
        if (this.field && this.field.tag.trim() != null && ind2Data && ind2Data != null && ind2Data !== '') {
          const isFieldExists = this.existingMARCData.find(a => a.tag === this.field.tag);
          if (isTagChanged &&
            isFieldExists &&
            isFieldExists.ind2 &&
            isFieldExists.ind2.length > 0 &&
            !isFieldExists.ind2.find(a => a.code === ind2Data)
          ) {
            this.field.isIndi2valid = false;
            this.field.ind2ErrMsg = 'Indicator is invalid';
          } else if (this.field.isTagChanged && isFieldExists && isFieldExists.ind2 &&
            isFieldExists.ind2.length > 0 && isFieldExists.ind2.find(a => a.code === ind2Data && a.isObsolete === true)) {
            this.field.isIndi2valid = false;
            this.field.ind2ErrMsg = 'Indicator is obsolete';
          } else {
            this.field.isIndi2valid = true;
            this.field.ind2ErrMsg = '';
          }
        }
      }
    }
  }
  ind1Validator(isTagChanged,val)
  {
    if (!this.overrideValidation) {
      const ind1Data = val.trim();
      if (this.field && (this.field.tag === null || this.field.tag.trim() === '') && ind1Data && ind1Data !== null && ind1Data !== '') {
        this.field.isValid = false;
        this.field.errMsg = 'Required';
      } else {
        if (this.field && this.field.tag.trim() != null && ind1Data && ind1Data != null && ind1Data !== '') {
          const isFieldExists = this.existingMARCData.find(a => a.tag === this.field.tag);
          if (isTagChanged &&
            isFieldExists &&
            isFieldExists.ind1 &&
            isFieldExists.ind1.length > 0 &&
            !isFieldExists.ind1.find(a => a.code === ind1Data)
          ) {
            this.field.isIndi1valid = false;
            this.field.ind1ErrMsg = 'Indicator is invalid';
          } else if (this.field.isTagChanged && isFieldExists && isFieldExists.ind1
            && isFieldExists.ind1.find(a => a.code === ind1Data && a.isObsolete === true)) {
            this.field.isIndi1valid = false;
            this.field.ind1ErrMsg = 'Indicator is obsolete';
          } else {
            this.field.isIndi1valid = true;
            this.field.ind1ErrMsg = '';
          }
        }
      }
    }
  }
  public fieldValidations()
  {
    this.validateTag();
    this.validateInd1OnSave();
  this.validateInd2OnSave();
  const texteditorControl = this.editorComponent ? this.editorComponent : null;
  if (texteditorControl) {
    texteditorControl.checkData();
  }
  if(this.field.tag ==='Leader' || this.field.type ==='controlfield')
  {
    this.ValidateSubElements();
  }
  }
ValidateSubElements() {
  const tagData = this.clonerService.deepClone<MarcBibDataDTO>(this.existingMARCData.find(a => a.tag === (this.field.tag === '000' ? 'Leader' :this.field.tag)));
  if (this.field.tag === '008') {
    const type = this.leaderData.charAt(6);
    const leaderData = this.existingMARCData.find(a => a.tag === 'Leader');
    if (
      leaderData &&
      leaderData.subElements &&
      leaderData.subElements.length > 0
    ) {
      const subElementData = leaderData.subElements.find(a => a.element === '06');
      if (
        subElementData &&
        subElementData.values &&
        subElementData.values.length > 0
      ) {
        const elementData = subElementData.values.find(a => a.code === type);
        if (elementData && tagData.subElements != null) {
          const subEleData = tagData.subElements.find(a => a.element === '18-34');
          if (subEleData && subEleData.materialType != null) {
            const relativeFields = subEleData.materialType.find(a => a.type.toLowerCase() === elementData.materialType.toLowerCase());
            const index = tagData.subElements.findIndex(a => a.element === '18-34');
            if (index) {
              tagData.subElements.splice(index, 1, ...relativeFields.relativefields);
            }
          }
        }
      }
    }
  }
  if (this.field.tag === '007' || this.field.tag === '006') {
    const subElementData = tagData.subElements[0];
    if (
      subElementData &&
      subElementData.values != null &&
      subElementData.values.length > 0
    ) {
      if (this.field.data == null) {
        this.field.data = '';
      }
      const value = subElementData.values.find(
        a => a.code == this.field.data.charAt(0)
      );
      tagData.subElements = [];
      tagData.subElements[0] = subElementData;
      if (value && value.materialType && value.materialType != null) {
        const relativefields = subElementData.materialType.find(a => a.type.toLowerCase() == value.materialType.toLowerCase());
        Array.prototype.push.apply(tagData.subElements, relativefields.relativefields);
      }
    }
  }
  if (tagData && tagData.subElements && tagData.subElements.length > 0) {
    const subFieldDescription = this.field.data;
    tagData.subElements.forEach(subElement => {
      if (subFieldDescription && subFieldDescription !== '') {
        if (subElement.length != null && subElement.length !== '') {
          if (+subElement.length > 1) {
            const charArray = subElement.element.split('-');
            const data = subFieldDescription.substring(
              parseInt(charArray[0]),
              parseInt(charArray[1]) + 1
            );
            let isOnLoad = true;
            if (this.field.tag === '008' && subElement.element === '35-37' && data.length === 3) {
              if(this.field.originalData)
              {
              const originalLang = this.field.originalData.substring(
                parseInt(charArray[0]),
                parseInt(charArray[1]) + 1
              );
              if (originalLang != data) {
                isOnLoad = false;
              }
            }
            }
            subElement['isValid'] = this.isValidSubElementData(subElement, data, isOnLoad);
          } else {
            const data = subFieldDescription.charAt(+subElement.element);
            subElement['isValid'] = this.isValidSubElementData(subElement, data, true);
          }
        }
      }
    });
    const isValidRow = tagData.subElements.filter(x => x.isValid == false).length > 0 ? false : true;
    if(isValidRow == false)
    {
    this.field.isValidData = isValidRow;
    this.field.isSubfieldValid = isValidRow;
    this.field.isFieldExpanded = true;
    }
  }
}
isValidSubElementData(subElement: any, value: any, isOnLoad: boolean) {
  let isValid = true;
  if (!this.overrideValidation) {
    if (
      value &&
      value != null &&
      value.trim() != '' &&
      subElement.validationRules &&
      subElement.validationRules != null
    ) {
      if (subElement.length > 1) {
        if (subElement.length == 4 && value == '||||') {
          isValid = true;
          return isValid;
        } else if (subElement.length == 2 && value == '||') {
          isValid = true;
          return isValid;
        } else if (subElement.length == 3) {
          if (value == '|||') {
            isValid = true;
            return isValid;
          }
          if (
            subElement.element == '06-08' &&
            subElement.description == 'Image bit depth (06-08)'
          ) {
            if (value > 0 && value < 1000) {
              isValid = true;
              return isValid;
            }
          }
          if (subElement.description.indexOf('Running time for motion pictures and videorecordings') > -1) {
            if (value >= 0 && value < 1000 || (value == '---') || (value == 'nnn')) {
              isValid = true;
              return isValid;
            } else {
              isValid = false;
            }
          }
        }
        if (
          value.length == subElement.length && subElement.validationRules != null && subElement.validationRules.length > 0 &&
          subElement.validationRules[0].length == subElement.length
        ) {
          if (value.trim() != '' && !isOnLoad && subElement.element == '35-37' && this.field.tag == '008') {
            const data = subElement.values.find(a => a.code == value);
            if (data === undefined) {
              isValid = false;
            }
            if (data && data.isDisable) {
              isValid = false;
            }
          } else if (
            value.trim() != '' &&
            subElement.validationRules.indexOf(value) == -1
          ) {
            isValid = false;
          }
        } else {
          if (subElement.validationRules.indexOf('#') > -1) {
            value = value.replace(/\s/g, '');
          }
          const data = value.split('');
          if (
            data &&
            (subElement.validationRules != undefined && subElement.validationRules.length > 0 &&
              data.some(x => subElement.validationRules.indexOf(x) == -1))
          ) {
            isValid = false;
          }
        }
      } else {
        // if (subElement.validationRules.indexOf(event.target.value) == -1) {
        if (
          value.trim() != '' &&
          subElement.validationRules.indexOf(value) == -1
        ) {
          isValid = false;
        }
      }
    }
    if (
      subElement && subElement.description.indexOf('Place of publication, production, or execution') > -1
    ) {
      const pattern = /^[a-zA-Z\s]+$/;
      if (value && value != null && value.trim() != '') {
        if (!(pattern.test(value))) {
          isValid = false;
        } else {
          isValid = true;
        }
        return isValid;
      }
    }
  }
  return isValid;
}
}
