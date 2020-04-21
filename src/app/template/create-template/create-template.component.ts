import {
  Component,
  OnInit,
  ViewChild,
  AfterViewChecked,
  ChangeDetectorRef,
  ViewChildren,
  ElementRef,
  QueryList,
  AfterViewInit,
  Renderer2,
  OnDestroy,
  Inject,
  EventEmitter,
  ChangeDetectionStrategy
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Constants } from 'src/app/constants/constants';
import { NgForm } from '@angular/forms';
import { FormCanDeactivate } from 'src/app/can-deactivate/form-can-deactivate';
import { CommonService } from 'src/app/shared/service/common.service';
import { ConfirmationDialogComponent } from 'src/app/components/shared/confirmation-dialog/confirmation-dialog.component';
// tslint:disable-next-line: max-line-length
import { MatDialog, MatAutocompleteTrigger, _countGroupLabelsBeforeOption, _getOptionScrollPosition, AUTOCOMPLETE_PANEL_HEIGHT } from '@angular/material';
import { Title, DOCUMENT } from '@angular/platform-browser';
import * as $ from 'jquery';
import { SpinnerService } from 'src/app/shared/interceptor/spinner.service';
import { SubSink } from 'subsink';
import {
  MarcSubFieldDTO,
  MarcFieldDTO,
  EventParams,
  EditTagDTO,
  TemplateDTO,
  MarcFieldUpdateEventParams,
  CopyPasteEventParams
} from 'src/app/_dtos/btcat.vm.dtos';
import { TextEditorComponent } from 'src/app/marc/shared/text-editor/texteditor.component';
import {
  MarcEditorSettings,
  MarcField,
  TemplateType,
  MarcBibData
} from 'src/app/marc/shared/marc';
import { TemplateService } from '../shared/service/template.service';
import { TemplateDataAdapter } from '../shared/service/template-data-adapter.service';
import { PageScrollService } from 'ngx-page-scroll-core';
import { DropResult } from 'smooth-dnd';
import { Location } from '@angular/common';
import { MarcFieldComponent } from 'src/app/marc/shared/marc-field/marc-field.component';
import { ClonerService } from 'src/app/services/cloner.service';
import { TemplateState } from '../shared/store/template-state';
import { MarcSettingsService } from 'src/app/services/marc-settings.service';
import { AuthenticationService } from 'src/app/security/authentication.service';
import { Permissions } from 'src/app/security/permissions';
import * as _ from 'lodash';
import { Hotkey, HotkeysService } from 'angular2-hotkeys';
import { ICopyPasteHandler } from 'src/app/marc/shared/service/marc-base-adapter';
import { ConfigurationService } from 'src/app/services/configuration.service';
declare const CodeMirror: any;
declare var $: any;

@Component({
  selector: 'app-create-template',
  templateUrl: './create-template.component.html'
})
export class CreateTemplateComponent extends FormCanDeactivate
  implements OnDestroy, AfterViewInit, AfterViewChecked, OnInit {
  // form properties
  @ViewChildren(MatAutocompleteTrigger, { read: MatAutocompleteTrigger }) matAutocompleteTrigger: QueryList<MatAutocompleteTrigger>;
  @ViewChildren('editorComponent') editorComponents: QueryList<TextEditorComponent>;
  @ViewChildren('inputDesc') leaderCtrlFields: QueryList<ElementRef>;
  @ViewChildren('inputTag') tagFields: QueryList<ElementRef>;
  @ViewChildren('inputind1') indicator1Fields: QueryList<ElementRef>;
  @ViewChildren('inputind2') indicator2Fields: QueryList<ElementRef>;
  @ViewChildren('marcField') marcFields: QueryList<MarcFieldComponent>;
  @ViewChild('form') form: NgForm;
  @ViewChild('addNewBtn') addnewBtn: ElementRef;
  @ViewChild('templateName') templateName: ElementRef;
  // TODO: Uncomment. Removed to move state to service layer
  // contextmenu = false;
  // contextmenuIndex = -1;
  // contextmenuX = 0;
  // contextmenuY = 0;
  // marcId: string;
  existingMARCData: MarcBibData[] = [];
  // TODO: Uncomment. Removed to move state to service layer
  // isAddNewBtnClicked = false;
  // toBeRemovedTags: EditTagDTO[];
  // isTagChange = false;
  // isNewCursor = false;
  // tagIndex = -1;
  // isUpdating = false;
  displayDuplicateWarnMessage = false;
  canMoveNextByMaxLength = true;
  leaderDescription = '';
  // filteredMarcTags: Array<Observable<EditTagDTO[]>>;
  // filteredSubFields: any = [];
  // filteredIndicators1: any = [];
  // filteredIndicators2: any = [];
  // subFieldsData: any = [];
  templateState: TemplateState;
  // isShowMsg = false;
  // isLoaded = false;
  // searchCount: any;
  // inputTagId: any;
  marcSettings: MarcEditorSettings;
  // isExpandSearchItem: any;
  // hideSubElements: any = [];
  cWidowHeight: number;
  cHeaderHeight: number;
  cSearchHeight: number;
  cNavHeight: number;
  headerHeight: number;
  newHeight: number;
  // tagValidations: any[] = [];
  private subs = new SubSink();
  // showBackBtn: boolean;
  nRFHeight: any;
  templateTypes: TemplateType[];
  templateDescription: string;
  templateInsitution: string;
  templateLevel: string;
  // templateName: string;
  templateType: string;
  fields: MarcField[];
  displayWarnMessage = false;
  isNew = false;
  isEdit = false;
  isClone = false;
  templateId: any;
  // templateCopytemplateCopy: TemplateDTO = new TemplateDTO();
  isNameRequired = true;
  isTypeRequired = true;
  isLevelRequired = true;
  isInstitutionRequired = true;
  currentTemplateText = '';
  directoryLength = 12;
  indicatorsLength = 2;
  dataLength = 0;
  endOfField = 1;
  endOfDirectory = 1;
  endOfRecord = 1;
  totalRecordLength = 0;
  lastFocused = -1 ;
  leaderDataWithHyphons: string;
  maxRecordLength: number = 10;

  // Permissions
  get hasWritePermission(): boolean {

    return ((this.isEdit || this.isClone) && this.templateState &&
    (this.templateState.template &&
    ( this.templateState.template.level === 'Global' && this.hasAccess(Permissions.CED_GTEMP)) ||

    (this.templateState.template.level === 'Institutional' && this.hasAccess(Permissions.CED_ITEMP)) ||
    (this.templateState.template.level === 'Local' && this.hasAccess(Permissions.CED_LTEMP)))
    || (!(this.isEdit || this.isClone) && (this.hasAccess(Permissions.CED_GTEMP) ||

    this.hasAccess(Permissions.CED_ITEMP) || this.hasAccess(Permissions.CED_LTEMP))));
    }
  get  toBeRemovedTags(): EditTagDTO[] {
    return this.templateState.toBeRemovedTags;
  }
  // constructor method is used to apply the dependencey injection for below services.
  constructor(
    private service: TemplateService,
    private route: ActivatedRoute,
    private renderer2: Renderer2,
    private commonService: CommonService,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    // tslint:disable-next-line: variable-name
    private _titleService: Title,
    private spinnerService: SpinnerService,
    private templateDataAdapter: TemplateDataAdapter,
    private templateService: TemplateService,
    private marcSettingsService: MarcSettingsService,
    private pageScrollService: PageScrollService,
    // tslint:disable-next-line: deprecation
    @Inject(DOCUMENT) private document: any,
    private location: Location,
    private clonerService: ClonerService,
    private authenticationService: AuthenticationService,
    private hotkeysService: HotkeysService,
    private configurationService: ConfigurationService
  ) {
    super(router, authenticationService);
    this.loadMarcSettings();
    this.loadHotKeys();
    this.maxRecordLength = configurationService.currentConfiguration().maxRecordLength;
  }

  // life cycle events
  ngOnInit() {
    this._titleService.setTitle('BTCAT | New Template');
    // Get the mode and Id from the parameters for the Edit and clone
    this.isEdit = false;
    this.isClone = false;
    const currentUrl = this.router.url;
    this.currentTemplateText = 'New Template';
    if (currentUrl.indexOf('edit-template') > 0) {
      this.isEdit = true;
      this._titleService.setTitle('BTCAT | Edit Template');
      this.currentTemplateText = 'Edit Template';
    } else if (currentUrl.indexOf('clone-template') > 0) {
      this.isClone = true;
      this._titleService.setTitle('BTCAT | Clone Template');
      this.currentTemplateText = 'Clone Template';
    }
    this.route.params.subscribe(params => {
      this.templateId = params.id;
      this.isNew = params.isNew;
    });
    // this.showBackBtn = true;

    if (this.isEdit || this.isClone) {
      this.getTemplateById(this.templateId);
    } else {
      this.subs.sink = this.templateDataAdapter.getNewTemplate().subscribe(state => {
          this.templateState = this.clonerService.deepClone<TemplateState>(state);
          if(this.templateState.template.fields.find(a => a.tag === 'Leader'))
          {
          this.leaderDataWithHyphons = this.templateState.template.fields.find(a => a.tag === 'Leader').data.replace(/ /g, '-');
          this.templateState.template.fields.find(a => a.tag === 'Leader').data =
          this.templateState.template.fields.find(a => a.tag === 'Leader').data.replace(/#/g, ' ');
          }
          // this.isLoaded = true;
      });
    }
    this.initializeCodeMirrorMode();
  }

  // Life Cycle Events
  ngAfterViewInit(): void {
    this.subs.add(this.matAutocompleteTrigger.changes.subscribe((trigger) => {
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
    }));
    this.Set_Element_Focus();
  }
  Set_Element_Focus() {
    if (this.hasWritePermission && this.templateName) {
      const element = this.templateName.nativeElement;
      if (element != null) {
        setTimeout(() => element.focus(), 0);
      }
    }
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  ngAfterViewChecked() {

    // set the page hight based on the expand and collapse search icon.
    this.customHeightFunction();

    $(window).resize(e => {
      this.customHeightFunction();
    });

  }

  //#region getmethods


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
  // get the template information based on template id.
  getTemplateById(id: any) {
    this.spinnerService.spinnerStart();
    this.subs.sink = this.templateDataAdapter.getTemplateById(id).subscribe(result => {
      if (result && result.template) {
        let leaderField = result.template.fields.find(a => a.tag === 'Leader');
        if (leaderField) {
          this.leaderDataWithHyphons = leaderField.data.replace(/ /g, '-');
          leaderField.data = leaderField.data.replace(/#/g, ' ');
          leaderField.subFieldDescription = leaderField.subFieldDescription.replace(/#/g, ' ');
        }
      }
      this.templateState = this.clonerService.deepClone<TemplateState>(result);

      // check permission for edit/clone
      if (!this.hasWritePermission) {
        this.router.navigate(['/unauthorized']);
      }

      // Validate the User whether have access to page or not, if not redirect to 'Page not found' page.
      // TODO: Not the right place to handle Authorization
      let validUser = true;
      if (localStorage.getItem(Constants.LocalStorage.ACTOR) !== null &&
        localStorage.getItem(Constants.LocalStorage.ACTOR) !== '') {

        const actor = localStorage.getItem(Constants.LocalStorage.ACTOR);

        if (this.templateState.template &&
          (this.templateState.template.id === this.templateId &&
            ((this.templateState.template.level.toLowerCase() === 'local' &&
              (this.templateState.template.createdBy.toLowerCase() === actor.toLowerCase() ||
                this.templateState.template.lastModifiedBy.toLowerCase() === actor.toLowerCase())) ||
              this.templateState.template.level.toLowerCase() !== 'local'))) {
          validUser = true;
        } else {
          validUser = false;
        }
      } else {
        validUser = false;
      }

      if (!validUser) {
        this.router.navigate([
          '/**/'
        ]);
      }

      // if mode is clone set the Id and Name values
      if (this.isClone) {
        this.subs.sink = this.templateDataAdapter.updateTemplateStateForClone(this.templateState).subscribe(state => {
          this.templateState = state;
        });
      }
      this.Set_Element_Focus();
      this.spinnerService.spinnerStop();
    });
  }

  // get the leader tag information and set the leader tag description.
  get leaderData(): string {
    if (this.templateState.template && this.templateState.template.fields) {
      const leader = this.templateState.template.fields.find(f => f.tag === 'Leader');
      if (leader) {
        this.leaderDescription = this.getSubFieldData(leader.data);
        return leader.data;
      } else {
        return '';
      }
    }
    return '';
  }

  // get the leader tag sub fields information and we need to display only 5-10 and 17-20 charcter postions in the view.
  getSubFieldData(data: string): string {
    if (data) {
      return data.substring(0, 10) + data.substring(17, 20);
    }
    return '';
  }

  // get the marc master data and template types from the SystemSettings api.
  loadMarcSettings() {
    this.existingMARCData = this.marcSettingsService.getMarcBibData();
    this.marcSettings = this.marcSettingsService.getMarcSettingsData();
    this.templateTypes = this.marcSettingsService.getTemplateTypes();
  }

  // get the tag value.
  getTagValue(field: any) {
    if (field.tag === 'Leader') {
      // for display purpose retun the 000 value for leader tag.
      return '000';
    } else {
      return field.tag;
    }
  }

  // valueUpdate emitter calls when we have any changes in subelements section.
  getUpdatedvalue(item: any) {
    if (item != null && item.updatedvalue != null) {
      if (this.templateState.template.fields[item.fieldIndex]) {
        this.templateState.template.fields[item.fieldIndex].subFieldDescription =
          item.updatedvalue;
        this.templateState.template.fields[item.fieldIndex].data = item.updatedvalue;
        this.templateState.template.fields[item.fieldIndex].isValidData = item.isValidRow;
        if (
          this.templateState.template.fields.find(x => x.data === item.updatedvalue).tag ===
          '000' ||
          this.templateState.template.fields.find(x => x.data === item.updatedvalue).tag ===
          'Leader'
        ) {
          this.leaderDescription = this.getSubFieldData(item.updatedvalue);
          this.templateState.template.fields[item.fieldIndex].subFieldDescription = this.leaderDescription;
          const tagDataIndex = this.templateState.template.fields.findIndex(a => a.tag == '008');

          if (
            tagDataIndex &&
            item.oldValue != null &&
            item.updatedvalue != null &&
            item.oldValue != item.updatedvalue &&
            item.oldValue.charAt(6) != item.updatedvalue.charAt(6)
          ) {
            if (
              this.templateState.template.fields[tagDataIndex].data != null &&
              this.templateState.template.fields[tagDataIndex].data != '' &&
              this.templateState.template.fields[tagDataIndex].subFieldDescription != null &&
              this.templateState.template.fields[tagDataIndex].subFieldDescription != null
            ) {
              const existingData = this.templateState.template.fields[tagDataIndex].data;
              const updatedData =
                existingData.substring(0, 18) +
                new Array(18).join(' ') +
                existingData.substring(35);
              this.templateState.template.fields[tagDataIndex].data = updatedData;
              this.templateState.template.fields[
                tagDataIndex
              ].subFieldDescription = updatedData;
            }
          }
        }
        // this.getTotalRecordLength();
      }
    }
  }

  onBlurMarcField(eventargs: MarcFieldUpdateEventParams) {
    const field = eventargs.field ? eventargs.field : new MarcFieldDTO();
    const index = eventargs.position > -1 ? eventargs.position : -1;
    this.subs.sink = this.templateDataAdapter.updateMarcField(field, index).subscribe(state => {
      this.templateState = this.clonerService.deepClone<TemplateState>(state);
    });
  }

  // verify current field is system generated.
  isSystemGenerated(field, dataItem) {
    if (field == '001' || field == '005' || field == '010' || field == '919' || field == '997') {
      dataItem.isValid = false;
      dataItem.errMsg = field + ' is system generated';
    }
  }

  // get the sub field data which are shows in the autotemplate.
  getSubFieldDataForAutoComplete(field: any) {
    if (field.tag && field.tag.trim() !== '') {
      let subfieldData = [];
      const fieldData = this.existingMARCData.find(c => c.tag === field.tag);
      if (fieldData) {
        subfieldData = fieldData.subfields;
      }
      return subfieldData;
    }
  }

  // #endregion getmethods

  //#region SetMethods

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
  // set the focus on current tags.
  setFocusOnTag(index) {
    const subscriber = new EventEmitter<boolean>();

    this.subs.add(subscriber.subscribe((val) => {
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
    }));
    setTimeout(() => {
      if (index > 1) {
        this.pageScrollService.scroll({
          document: this.document,
          scrollTarget: `#marcRow${index - 1}`,
          scrollViews: [document.getElementById('marceditgrid')],
          advancedInlineOffsetCalculation: true,
          scrollFinishListener: subscriber,
        });
      } else {
        this.pageScrollService.scroll({
          document: this.document,
          scrollTarget: `#marcField0`,
          scrollViews: [document.getElementById('marceditgrid')],
          advancedInlineOffsetCalculation: true,
          scrollFinishListener: subscriber,
        });
      }


    }, 0);
  }

  // set the focus for selected tag and update the template fields object based on selected values.
  setSelectedTag(dataItem: any, selectedItem: any, index: any, event: any) {
    if (dataItem && selectedItem) {
      dataItem.isValid = true;
      // TODO: Uncomment. Removed to move state to service layer
      // this.isTagChange = true;
      this.canMoveNextByMaxLength = true;
      this.templateState.template.fields[index].tag = selectedItem.tag;
      this.cdr.markForCheck();
      dataItem.type = selectedItem.type;
      if (!selectedItem.repeatable) {
        const isTagexists = this.templateState.template.fields.find(
          a => a.tag === selectedItem.tag
        );
        if (isTagexists) {
          dataItem.isValid = false;
        }
      }
      setTimeout(() => {
        const elem: Element = document.getElementById('editIndicator1' + index);
        if (elem != null) {
          this.renderer2.selectRootElement('#editIndicator1' + index).focus();
        }
        if (selectedItem.tag === '003') {
          const subfieldElem: Element = document.getElementById(
            'editMarcDesc' + index
          );
          if (subfieldElem != null) {
            this.renderer2.selectRootElement('#editMarcDesc' + index).focus();
          }
        }
      }, 0);
    }
  }

  // set the selected sub fields and verify the validation rules is it repeatable or not.
  setSelectedSubField(field: any, selectedItem: any, index: any) {
    field.isValidData = true;
    let errorMsg = '';
    const subFieldData = selectedItem.value
      .trim()
      .split(this.marcSettings.delimiter);
    subFieldData.shift();
    if (subFieldData) {
      const codeData = subFieldData.map(a => a.charAt(0));
      const isFieldExists = this.existingMARCData.find(
        a => a.tag === field.tag
      );
      if (isFieldExists) {
        subFieldData.forEach(ele => {
          const subFieldCode = ele.charAt(0);
          const subFieldExists = isFieldExists.subfields.find(
            c => c.code === subFieldCode
          );
          if (subFieldExists) {
            if (!subFieldExists.repeatable) {
              const findDuplicates = codeData.filter(h =>
                h.includes(subFieldCode)
              );
              if (findDuplicates && findDuplicates.length > 1) {
                field.isValidData = false;
                setTimeout(() => {
                  const elem: Element = document.getElementById(
                    'editMarcDesc' + index
                  );
                  if (elem && elem != null) {
                    elem.classList.add('border-danger');
                  }
                }, 0);
                if (errorMsg !== '') {
                  if (errorMsg.indexOf(subFieldCode) === -1) {
                    errorMsg = errorMsg + ',' + subFieldCode;
                  }
                } else {
                  errorMsg = subFieldCode;
                }
              }
            }
          }
        });
      }
    }
    field.errMsg = errorMsg !== '' ? errorMsg + ' are not repeatable' : '';
  }

  // set the focus on indicator 1.
  setSelectedInd1(dataItem: any, index: any, event: any) {
    this.canMoveNextByMaxLength = true;
    setTimeout(() => {
      const elem: Element = document.getElementById('editIndicator2' + index);
      if (elem != null) {
        this.renderer2.selectRootElement('#editIndicator2' + index).focus();
      }
    }, 0);
  }

  // set the focus on indicator 2.
  setSelectedInd2(index: any) {
    this.canMoveNextByMaxLength = true;
    // Focus subfield editor
    const id = 'editMarcDesc' + index;
    const descCtrl = this.editorComponents.find(x => x.parentElement.id === id);
    const cmInstance = descCtrl === undefined ? descCtrl : descCtrl.editor;
    setTimeout(() => {
      if (descCtrl !== undefined && descCtrl !== null) {
        descCtrl.focusHandler();
      }
    }, 0);
  }

  // update the control field description and data.
  updateControlFieldValue(event: any, field: any) {
    field.isValidData = true;
    if (event.target.value && field.tag === '003') {
      field.subFieldDescription = event.target.value;
      field.data = event.target.value;
      this.onTextEditorFocusOut();
    }
  }

  //#endregion SetMethods

  //#region PrivateMethods

  // clear the warning and required flag validations.
  clearErrors() {
    this.displayWarnMessage = false;
    this.displayDuplicateWarnMessage = false;
    this.isNameRequired = true;
    this.isTypeRequired = true;
    this.isLevelRequired = true;
    this.isInstitutionRequired = true;
  }

  // reset the dataitem.
  resetFields(dataItem: any) {
    dataItem.subFieldDescription = '';
    dataItem.data = '';
    dataItem.ind1 = '';
    dataItem.ind2 = '';
    dataItem.ind1ErrMsg = '';
    dataItem.ind2ErrMsg = '';
    dataItem.isTagChanged = true;
    dataItem.isInd1Changed = true;
    dataItem.isInd2Changed = true;
    dataItem.isIndi1valid = true;
    dataItem.isIndi2valid = true;
    dataItem.isSubFieldChanged = true;
    dataItem.subfields = [];
  }

  /* search split fix function - var values */
  trackByFn(index: number, item: MarcFieldDTO) {
    return item.id;
  }

  // parse object in to the json.
  convertToJson(jsonObj: TemplateDTO) {
    const templateString = JSON.stringify(jsonObj);
    return JSON.parse(templateString);
  }

  ValidateForm(id: string) {
    if (this.templateState.template.name) {
      this.templateState.template.name = this.templateState.template.name.trim();

    }
    if (this.templateState.template.institution) {
      this.templateState.template.institution = this.templateState.template.institution.trim();
    }

    if (id === 'template-name') {
      if (this.templateState.template.name === '' || this.templateState.template.name === undefined) {
        this.isNameRequired = false;
      } else {
        this.displayDuplicateWarnMessage = false;
        this.isNameRequired = true;
      }
    } else if (id === 'template-type') {
      if (this.templateState.template.type === 'Select' || this.templateState.template.type === undefined) {
        this.isTypeRequired = false;
      } else {
        this.isTypeRequired = true;
      }
    } else if (id === 'template-level' || id === 'template-institution') {
      if (this.templateState.template.level === 'Select' || this.templateState.template.level === undefined) {
        this.isLevelRequired = false;
      } else {
        this.isLevelRequired = true;

        if (this.templateState.template.level === 'Institutional') {
          if (this.templateState.template.institution === '' || this.templateState.template.institution === undefined) {
            this.isInstitutionRequired = false;
          } else {
            this.isInstitutionRequired = true;
          }
        }

      }
    }

  }

  // verify the required field validations
  requiredFieldsValidation(myForm: any): boolean {

    if (this.templateState.template.name) {
      this.templateState.template.name = this.templateState.template.name.trim();
    }
    if (this.templateState.template.institution) {
      this.templateState.template.institution = this.templateState.template.institution.trim();
    }

    if (this.templateState.template.name != '' && this.templateState.template.name != undefined) {
      this.isNameRequired = true;
    } else {
      this.isNameRequired = false;
    }

    if (this.templateState.template.type != 'Select' && this.templateState.template.type != undefined) {
      this.isTypeRequired = true;
    } else {
      this.isTypeRequired = false;
    }

    if (this.templateState.template.level != 'Select' && this.templateState.template.level != undefined) {
      this.isLevelRequired = true;
      if (
        this.templateState.template.level == 'Institutional' &&
        (this.templateState.template.institution == '' ||
          this.templateState.template.institution == undefined)
      ) {
        this.isInstitutionRequired = false;
      } else {
        this.isInstitutionRequired = true;
      }
    } else {
      this.isLevelRequired = false;
    }

    let isTagValid = true;
    this.templateState.template.fields.forEach(field => {
      if (field.tag == '001' || field.tag == '005' || field.tag == '010' || field.tag == '919' || field.tag == '997') {

        isTagValid = false;
      }
    });

    if (
      this.isNameRequired &&
      this.isTypeRequired &&
      this.isLevelRequired &&
      this.isInstitutionRequired && isTagValid
    ) {
      this.displayWarnMessage = false;
      return true;
    } else {
      this.displayWarnMessage = true;
      this.displayDuplicateWarnMessage = false;
      myForm.form.markAsDirty();
      return false;
    }
  }

  // verify the tag validations
  checkTagValidation(field: any) {
    if ((field.tag && field.tag === null) || field.tag.trim() === '') {
      field.isValid = false;
      field.errMsg = 'Required';
      return field;
    } else if (field.tag.trim().length < 3) {
      field.isValid = false;
      field.errMsg = 'Length should be 3';
      return field;
    } else if (field && field.isValid && field.tag.trim().length === 3) {
      const selectedItem = this.existingMARCData.find(a => a.tag === field.tag);
      if (selectedItem) {
        if (!selectedItem.repeatable) {
          const findDuplicates = this.templateState.template.fields.filter(h =>
            h.tag.includes(field.tag)
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
    }
  }

  // clear the autocompelete
  clearAutocomplete() {
    // this.filteredIndicators1 = [];
    // this.filteredIndicators2 = [];
    // this.filteredMarcTags.forEach((item, index) => (item[index] = of([])));
  }

  // set the page height dynamically based on resizing the screen
  customHeightFunction() {
    this.cWidowHeight = $(window).height();
    this.cHeaderHeight = $('app-header nav').height();
    this.cSearchHeight = $('app-search-box .search_filter').height();
    this.cNavHeight = $('.mainNavSection').height();
    this.nRFHeight = $('.newRecordFields').height();
    this.headerHeight =
      this.cHeaderHeight +
      this.cSearchHeight +
      this.cNavHeight +
      this.nRFHeight;
    this.newHeight = this.cWidowHeight - this.headerHeight;
    this.newHeight = this.newHeight - 135;
    this.cdr.markForCheck();
  }
  //#endregion PrivateMethods

  //#region events

  // tag field focus event fired.verify the tag validation rules and show the autocomplete.
  tagFocus(event: any, field: any, index: number) {
    if (
      !field.isValid &&
      field.isFieldEditable &&
      (field.tag == 'Leader' || field.tag == '008')
    ) {
      field.isFieldExpanded = false;
    }
    if (field) {
      field.isValid = true;
      field.errMsg = '';
    }
    event.preventDefault();
  }
  // indicator1 fires focus event.verify the tag validation rules and show the autocomplete.
  onIndicator1Focus(event: any, field: any, index: number) {
    event.target.classList.remove('border-danger');
    if (field.ind1) {
      field.ind1ErrMsg = '';
      field.isIndi1valid = true;
    }
    this.checkTagValidation(field);
    if (event.target.value === null || event.target.value === '') {
      field.ind1 = '';
      const fieldData = this.existingMARCData.find(c => c.tag === field.tag);
    }
  }
  // indicator2 focus event fired.verify the tag validation rules and show the autocomplete.
  onIndicator2Focus(event: any, field: any, index: number) {
    event.target.classList.remove('border-danger');
    if (field.ind2) {
      field.ind2ErrMsg = '';
      field.isIndi2valid = true;
    }
    this.checkTagValidation(field);
    if (event.target.value == null || event.target.value === '') {
      field.ind2 = '';
      const fieldData = this.existingMARCData.find(c => c.tag === field.tag);
    }
  }

  // tag field focus out event.verify the Required,Indicator is invalid and Indicator is obsolete validation rules.
  onTagFocusOut(event: any, field: any, trigger) {
    if (
      event.relatedTarget &&
      event.relatedTarget.nodeName !== 'MAT-OPTION' &&
      trigger !== null &&
      trigger !== undefined
    ) {
      trigger.closePanel();
    }

    if (field && field.tag.trim().length < 3) {
      this.checkTagValidation(field);
    } else {
      const selectedItem = this.existingMARCData.find(a => a.tag === field.tag);
      if (selectedItem) {
        field.type = selectedItem.type;
        if (!selectedItem.repeatable) {
          const findDuplicates = this.templateState.template.fields.filter(h =>
            h.tag.includes(field.tag)
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
      if (field.tag == '001' || field.tag == '005' || field.tag == '010' || field.tag == '919' || field.tag == '997') {
        field.isValid = false;
        field.errMsg = field.tag + ' is system generated';
      }
    }
    // TODO: TotalRecord Length should be calculated on update Template State
    // if (field && field.tag.trim().length === 3) {
    //   this.getTotalRecordLength();
    // }
    event.preventDefault();
  }

  // indicator1 focus out event.verify the Required,Indicator is invalid and Indicator is obsolete validation rules.
  onIndicator1FocusOut(event: any, field: any, trigger) {
    if (
      event.relatedTarget &&
      event.relatedTarget.nodeName !== 'MAT-OPTION' &&
      trigger !== null &&
      trigger !== undefined
    ) {
      trigger.closePanel();
    }
    if (field.ind1 !== '') {
      const ind1Data = field.ind1;
      this.checkTagValidation(field);
      if (
        field &&
        (field.tag == null || field.tag.trim() === '') &&
        ind1Data &&
        ind1Data != null &&
        ind1Data.trim() !== ''
      ) {
        field.isValid = false;
        field.errMsg = 'Required';
      } else {
        if (
          field &&
          field.tag.trim() != null &&
          ind1Data &&
          ind1Data != null &&
          ind1Data.trim() !== ''
        ) {
          const isFieldExists = this.existingMARCData.find(
            a => a.tag === field.tag
          );
          if (
            isFieldExists &&
            isFieldExists.ind1 &&
            isFieldExists.ind1.length > 0 &&
            !isFieldExists.ind1.find(a => a.code === ind1Data)
          ) {
            field.isIndi1valid = false;
            field.ind1ErrMsg = 'Indicator is invalid';
          } else if (
            field.isInd1Changed &&
            isFieldExists &&
            isFieldExists.ind1 &&
            isFieldExists.ind1.find(
              a => a.code === ind1Data && a.isObsolete === true
            )
          ) {
            field.isIndi1valid = false;
            field.ind1ErrMsg = 'Indicator is obsolete';
          } else {
            field.isIndi1valid = true;
            field.ind1ErrMsg = '';
          }
        }
      }
    }
    event.preventDefault();
  }

  // indicator2 focus out event.verify the Required,Indicator is invalid and Indicator is obsolete validation rules.
  onIndicator2FocusOut(event: any, field: any, index, trigger) {
    if (
      event.relatedTarget &&
      event.relatedTarget.nodeName !== 'MAT-OPTION' &&
      trigger !== null &&
      trigger !== undefined
    ) {
      trigger.closePanel();
    }
    if (field.ind2 !== '') {
      const ind2Data = field.ind2;
      this.checkTagValidation(field);
      if (
        field &&
        (field.tag === null || field.tag.trim() === '') &&
        ind2Data &&
        ind2Data != null &&
        ind2Data.trim() !== ''
      ) {
        field.isValid = false;
        field.errMsg = 'Required';
      } else {
        if (
          field &&
          field.tag.trim() != null &&
          ind2Data &&
          ind2Data != null &&
          ind2Data.trim() !== ''
        ) {
          const isFieldExists = this.existingMARCData.find(
            a => a.tag === field.tag
          );
          if (
            isFieldExists &&
            isFieldExists.ind2 &&
            isFieldExists.ind2.length > 0 &&
            !isFieldExists.ind2.find(a => a.code === ind2Data)
          ) {
            field.isIndi2valid = false;
            field.ind2ErrMsg = 'Indicator is invalid';
          } else if (
            field.isInd2Changed &&
            isFieldExists &&
            isFieldExists.ind2 &&
            isFieldExists.ind2.find(
              a => a.code === ind2Data && a.isObsolete === true
            )
          ) {
            field.isIndi2valid = false;
            field.ind2ErrMsg = 'Indicator is obsolete';
          } else {
            field.isIndi2valid = true;
            field.ind2ErrMsg = '';
          }
        }
      }
    }
  }

  onTextEditorFocusOut() {
    // this.getTotalRecordLength();
  }

  // indicator1 on change event.verify the Required,Indicator is invalid and Indicator is obsolete validation rules.
  onInd1Change(event: any, field: any, index: number) {
    field.isInd1Changed = true;
    event.target.classList.remove('border-danger');
    const ind1Data = event.target.value;
    this.checkTagValidation(field);
    if (field && (field.tag === null || field.tag.trim() === '') && ind1Data && ind1Data != null && ind1Data.trim() != '') {
      field.isValid = false;
      field.errMsg = 'Required';
    } else {
      if (field && field.tag.trim() != null && ind1Data && ind1Data != null && ind1Data.trim() != '') {
        const isFieldExists = this.existingMARCData.find(a => a.tag === field.tag);
        if (
          isFieldExists &&
          isFieldExists.ind1 &&
          isFieldExists.ind1.length > 0 &&
          !isFieldExists.ind1.find(a => a.code === ind1Data)
        ) {
          field.isIndi1valid = false;
          field.ind1ErrMsg = 'Indicator is invalid';
        } else if (field.isInd1Changed && isFieldExists && isFieldExists.ind1 && isFieldExists.ind1.find(a => a.code === ind1Data && a.isObsolete === true)) {
          field.isIndi1valid = false;
          field.ind1ErrMsg = 'Indicator is obsolete';
        } else {
          field.isIndi1valid = true;
          field.ind1ErrMsg = '';
        }
      }
    }
    if (field.ind1 === '' && event) {
      this.onIndicator1Focus(event, field, index);
    }
    event.preventDefault();
  }
  update008Data(item: any) {
    const tagDataIndex = this.templateState.template.fields.findIndex(a => a.tag == '008');
    if (tagDataIndex && item.oldValue != null && item.updatedvalue != null && item.oldValue != item.updatedvalue && item.oldValue.charAt(6) != item.updatedvalue.charAt(6)) {
      const existingData = this.templateState.template.fields[tagDataIndex].data;
      const updatedData = existingData.substring(0, 18) + (new Array(18)).join(' ') + existingData.substring(35);
      this.templateState.template.fields[tagDataIndex].data = updatedData;
      this.templateState.template.fields[tagDataIndex].subFieldDescription = updatedData;
    }
  }
  checkState(e) {
    console.log(e);
    if (e) {
      // this.getTotalRecordLength();
    }
  }
  // TODO: MISC. Need to check while refactoring
  deleteMarcField(eventargs: EventParams, form: NgForm, field: MarcFieldDTO) {

    form.form.markAsDirty();
    // this.templateState.template.fields.splice(eventargs.position, 1);
    this.subs.sink = this.templateDataAdapter.deleteMarcField(eventargs.position).subscribe(state => {
      this.templateState = state;
    });
    // TODO: Changing Validation logic shouldn't happen in this method. Against SRP.
    if (field.tag.trim() !== '') {
      const duplicateIndex = this.templateState.template.fields.findIndex(h =>
        h.tag === field.tag);
      if (duplicateIndex !== -1 && !this.templateState.template.fields[duplicateIndex].isValid) {
        this.templateState.template.fields[duplicateIndex].isValid = true;
      }
    }
    this.lastFocused = -1;
    this.setFocusOnTagNoScroll(eventargs.position);
  }
  // indicator2 on change event.verify the Required,Indicator is invalid and Indicator is obsolete validation rules.
  onInd2Change(event: any, field: any, index: any) {
    field.isInd2Changed = true;
    const ind2Data = event.target.value;
    event.target.classList.remove('border-danger');
    this.checkTagValidation(field);
    if (field && (field.tag === null || field.tag.trim() === '') && ind2Data && ind2Data != null && ind2Data.trim() != '') {
      field.isValid = false;
      field.errMsg = 'Required';
    } else {
      if (field && field.tag.trim() != null && ind2Data && ind2Data != null && ind2Data.trim() != '') {
        const isFieldExists = this.existingMARCData.find(a => a.tag === field.tag);
        if (
          isFieldExists &&
          isFieldExists.ind2 &&
          isFieldExists.ind2.length > 0 &&
          !isFieldExists.ind2.find(a => a.code === ind2Data)
        ) {
          field.isIndi2valid = false;
          field.ind2ErrMsg = 'Indicator is invalid';
        } else if (field.isInd2Changed && isFieldExists && isFieldExists.ind2 && isFieldExists.ind2.length > 0 && isFieldExists.ind2.find(a => a.code === ind2Data && a.isObsolete == true)) {
          field.isIndi2valid = false;
          field.ind2ErrMsg = 'Indicator is obsolete';
        } else {
          field.isIndi2valid = true;
          field.ind2ErrMsg = '';
        }
      }
    }
    if (field.ind2 === '' && event) {
      this.onIndicator2Focus(event, field, index);
    }
    event.preventDefault();
  }

  // keydown event for fields
  onKeydown(event: any, field: any, index: any) {
    if (field.type !== 'controlfield' && field.tag && field.tag !== 'Leader') {
      if (event.ctrlKey && event.keyCode === 68) {
        event.preventDefault();
        event.stopPropagation();

        if (!event.target.value.endsWith(this.marcSettings.delimiter)) {
          event.target.value = event.target.value + this.marcSettings.delimiter;
        }
      }
    }
  }

  // mouse down event calls and  clear the all tag and indicator while doing column-drag-handle
  mouseDown() {
    this.clearAutocomplete();
  }

  // apply the drag for moving the rows from one positon to another position
  applyDrag = (arr, dragResult) => {
    const { removedIndex, addedIndex, payload } = dragResult;
    if (removedIndex === null && addedIndex === null) { return arr; }

    const result = [...arr];
    let itemToAdd = payload;

    if (removedIndex !== null) {
      itemToAdd = result.splice(removedIndex, 1)[0];
    }

    if (addedIndex !== null) {
      result.splice(addedIndex, 0, itemToAdd);
    }

    return result;
  }

  // call the drag Handler while click on the shift tab Pressed
  dragHandlerShiftTabPressed(e: any, index: number, field: any) {
    if (field && field.tag != '997') {
      e.preventDefault();
      const id = 'editMarcDesc' + index;
      const descCtrl = this.editorComponents.find(
        x => x.parentElement.id === id
      );
      const leaderCtrlField = this.leaderCtrlFields.find(
        x => x.nativeElement.id === id
      );
      const textareaCtrl =
        leaderCtrlField === undefined
          ? leaderCtrlField
          : leaderCtrlField.nativeElement;
      setTimeout(() => {
        if (descCtrl !== undefined && descCtrl != null) {
          descCtrl.focusLastSubfield();
        }
        if (textareaCtrl !== undefined && textareaCtrl !== null) {
          textareaCtrl.focus();
        }
      }, 0);
    }
  }

  // call the drop event after release the drag position.
  onDrop(dropResult: DropResult) {
    const nonFixedFieldIndex: number = this.templateState.template.fields.findIndex(
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
    this.templateState.template.fields = this.applyDrag(this.templateState.template.fields, dropResult);
  }

  // it is used for template type changes action. if we are in edit-template not load the default master data.
  templateTypeChange(type: string) {
    this.templateDataAdapter.state = this.templateState ;
    this.templateDataAdapter.changeTemplateType(type).subscribe(state => {
      this.templateState = this.clonerService.deepClone<TemplateState>(state);
      this.leaderDataWithHyphons = this.templateState.template.fields.find(a => a.tag === 'Leader').data.replace(/ /g, '-');
    });
  }
  templateInstitutionChange(institution: string) {
    this.templateDataAdapter.state = this.templateState ;
    this.templateDataAdapter.changeTemplateInstitution(institution).subscribe(state => {
      this.templateState = this.clonerService.deepClone<TemplateState>(state);
    });
  }
  templateLevelChange(level: string) {
    this.templateDataAdapter.state = this.templateState ;
    this.templateDataAdapter.changeTemplateLevel(level).subscribe(state => {
      this.templateState = this.clonerService.deepClone<TemplateState>(state);
    });
  }
  //#endregion events

  //#region action methods

  // add new marc row in to the current template
  addNewMarcField(myForm: NgForm) {
    if (this.templateState.template && this.templateState.template.fields && this.templateState.template.fields.length > 0) {
      // this.getTotalRecordLength();
      myForm.form.markAsDirty();
      const index = this.lastFocused > -1 ? this.getNewFieldPosition(this.lastFocused) : this.templateState.template.fields.length - 1;
      const markField = this.templateDataAdapter.createNewField(
        `newrow-${index}`
      );
      this.templateState.template.fields.splice(index + 1, 0, markField);
      // TODO: Uncomment. Removed to move state to service layer
      // this.isAddNewBtnClicked = true;
      // TODO: Uncomment. Removed to move state to service layer
      // this.isNewCursor = true;
      this.setFocusOnTag(index + 1);
    }
  }

  // Create a new template by using new template object
  saveTemplate(myForm) {
    // check permission before save
    if (this.hasWritePermission) {
      // this.getTotalRecordLength();
      const items = document.getElementsByClassName('border-danger');
      if (!this.requiredFieldsValidation(myForm) || items.length !== 0) {
        this.displayWarnMessage = true;
        this.displayDuplicateWarnMessage = false;
      } else if (this.maxRecordLength < this.totalRecordLength) {

        this.displayWarnMessage = false;
        this.confirmationMessageLengthValidation(myForm);
      } else {
        this.saveTemplateDetails(myForm);
      }
    }
  }

  // If cancel the template reset the form elements to default.
  cancel(form) {
    this.displayDuplicateWarnMessage = false;
    this.clearErrors();
    if (form.dirty) {
      form.form.markAsPristine();
      if (this.isClone || this.isEdit) {
        this.subs.sink = this.templateDataAdapter.getTemplateById(this.templateId).subscribe(state => {
          this.templateState = this.clonerService.deepClone<TemplateState>(state);
          if (this.isClone) {
            this.subs.sink = this.templateDataAdapter.updateTemplateStateForClone(this.templateState).subscribe(tempState => {
              this.templateState = tempState;
            });
           }
        });
      } else {
        this.subs.sink = this.templateDataAdapter.getNewTemplate().subscribe(state => {
          this.templateState = this.clonerService.deepClone<TemplateState>(state);
        });
      }
      this.pageScrollService.scroll({
        document: this.document,
        scrollTarget: `#marcRow0`,
        scrollViews: [document.getElementById('marceditgrid')]
      });
    }
    $('.macroActive').removeClass('macroActive');
    this.lastFocused = -1;
    this.Set_Element_Focus();
  }

  // verify the form changes and navigate to template view.
  back(form: NgForm) {
    if (form && form.form.dirty) {
      this.confirmationMessage(form);
    } else {
      this.location.back();
    }
  }

  // delte the tag from the ui
  deleteTag(index: number, form: NgForm, field: any) {
    form.form.markAsDirty();
    this.templateState.template.fields.splice(index, 1);
    if (field.tag.trim() !== '') {
      const duplicateIndex = this.templateState.template.fields.findIndex(
        h => h.tag === field.tag
      );
      if (
        duplicateIndex !== -1 &&
        !this.templateState.template.fields[duplicateIndex].isValid
      ) {
        this.templateState.template.fields[duplicateIndex].isValid = true;
      }
    }
  }

  // Marc Edit Component EventHandlers

  // down arrow clicked when we have sub element data then only navigation happend.
  onUpClicked(
    event: any,
    controlName: string,
    index: number,
    trigger: MatAutocompleteTrigger
  ) {
    event.preventDefault();
    if (
      controlName === 'marcDesc' ||
      (trigger !== null && trigger !== undefined && !trigger.panelOpen)
    ) {
      this.canMoveNextByMaxLength = false;
      this.cdr.markForCheck();
      const element = event.target ? event.target : event.srcElement;
      const position = { line: 0, ch: element.selectionStart };
      const keyboardEmitterParams: EventParams = {
        controlName,
        position,
        action: 'focus-top-element'
      };
      this.handleUpDownPressed(keyboardEmitterParams);
      if (trigger) {
        trigger.closePanel();
      }
    }
    this.cdr.markForCheck();
  }

  getMarcFieldAtPosition(index: number): MarcFieldDTO {
    if (this.templateState.template.fields.length <= index || index < 0) {
      console.log('Index overflow ' + index + ' only ' + this.templateState.template.fields.length + ' are there.');
      return null;
    }
    return this.templateState.template.fields[index];
  }

  onNameChange(event: any) {
    this.subs.sink = this.templateDataAdapter.updateTemplateName(event.target.value).subscribe(state => {
      this.templateState = state;
    });
  }
  onTypeChange(event: any) {
    // this.subs.sink = this.templateDataAdapter.updateTemplateType(event.target.value).subscribe(state => {
    //   this.templateState = state;
    // });
  }
  onDescriptionChange(event: any) {
    this.subs.sink = this.templateDataAdapter.updateTemplateDescription(event.target.value).subscribe(state => {
      this.templateState = state;
    });
  }
  onInstitutionChange(event: any) {
    this.subs.sink = this.templateDataAdapter.updateTemplateInstitution(event.target.value).subscribe(state => {
      this.templateState = state;
    });
  }
  onLevelChange(event: any) {
    this.subs.sink = this.templateDataAdapter.updateTemplateLevel(event.target.value).subscribe(state => {
      this.templateState = state;
    });
  }

  handleCopyActivity(eventargs: CopyPasteEventParams, component: any) {
    if (eventargs.copyPositions && eventargs.copyPositions.length > 0) {
     this.service.CopiedFields = [];
     eventargs.copyPositions.forEach(d => {
        const copyField = _.cloneDeep(this.getMarcFieldAtPosition(d));
        if (copyField.isFieldEditable) {
          // Fixed field cannot be copied
          this.service.CopiedFields.push(copyField);
        }
      });
    }
    this.saveCopiedMARCFieldsToLocalStorage(this.service.CopiedFields);
    console.log('Copied fields : ' + this.service.CopiedFields.length);
  }

  handleCutActivity(eventargs: CopyPasteEventParams, component: any) {
    if (eventargs.copyPositions && eventargs.copyPositions.length > 0) {
      const cutpositions = [];
      let minposition = 9999;
      this.service.CopiedFields = [];
      eventargs.copyPositions.forEach(d => {
        const copyField = _.cloneDeep(this.getMarcFieldAtPosition(d));
        if (copyField.isFieldEditable) {
          // Fixed field cannot be copied
          this.service.CopiedFields.push(copyField);
          cutpositions.push(d);
          if ( d < minposition ) {
            minposition = d;
          }
        }
      });
      if ( cutpositions.length > 0) {
        this.form.form.markAsDirty();
        this.subs.sink = this.templateDataAdapter.deleteMarcFields(eventargs.copyPositions).subscribe(state => {
          this.templateState = state;
          minposition = (this.templateState.template.fields.length === minposition) ? minposition - 1 : minposition;
          this.setFocusOnTag(minposition);
        });
      }
    }
    this.saveCopiedMARCFieldsToLocalStorage(this.service.CopiedFields);
    console.log('Cut fields : ' + this.service.CopiedFields.length);
  }

  // tslint:disable-next-line: max-line-length
  handlePasteActivity(eventargs: CopyPasteEventParams, component: any) {

    this.grabCopiedMARCFieldsFromLocalStorage();
    if (this.service.CopiedFields && this.service.CopiedFields.length > 0) {
      this.form.form.markAsDirty();
      if (eventargs.replacePositions) {
        // Delete selected items and paste new copied contents
        if (eventargs.pastePositions && eventargs.pastePositions.length > 0) {
          const controlPosition = eventargs.pastePositions.sort()[0];
          // tslint:disable-next-line: max-line-length
          this.subs.sink = this.templateDataAdapter.replaceMarcFields(eventargs.pastePositions, this.service.CopiedFields, component).subscribe(state => {
            this.templateState = state;
            this.setFocusOnTag(controlPosition);
          });
        }
      } else {
        const controlPosition = this.getNewFieldPosition(eventargs.pastePositions[0] );
        // tslint:disable-next-line: max-line-length
        this.subs.sink = this.templateDataAdapter.addMarcFieldsOnEnterWithData(controlPosition, this.service.CopiedFields, component).subscribe(state => {
          this.templateState = state;
          this.setFocusOnTag(controlPosition + 1);
        });
      }
    }
  }

  handleEnterKeyPressed(eventargs: EventParams) {
    // TODO: Uncomment. Removed to move state to service layer
    // this.isAddNewBtnClicked = false;
    const controlPosition = this.getNewFieldPosition(eventargs.controlPosition);
    this.form.form.markAsDirty();
    this.subs.sink = this.templateDataAdapter.addMarcField(controlPosition).subscribe(state => {
      this.templateState = state;
      // this.showEditSubEle(controlPosition + 1, markField);
      this.setFocusOnTag(controlPosition + 1);
    });
  }
  getUpdatedTag(eventargs: MarcFieldUpdateEventParams) {
    const field = eventargs.field ? eventargs.field : new MarcFieldDTO();
    const index = eventargs.position ? eventargs.position : -1;
    this.subs.sink = this.templateDataAdapter.updateMarcField(field, index).subscribe(state => {
      this.validateMarcField(field);
      this.templateState = state;
      if (field.type === 'controlfield' || field.tag === '000') {
        if (field && field.isValid && (field.tag === '006' || field.tag === '000' || field.tag === '007' || field.tag === '008')) {
          field.isFieldExpandable = true;
          field.isFieldExpanded = false;
          this.marcFields.toArray()[index].showEditSubEle();
        }
      }
    });
  }
  onFieldBlur(eventargs: MarcFieldUpdateEventParams) {
    const field = eventargs.field ? eventargs.field : new MarcFieldDTO();
    const index = eventargs.position ? eventargs.position : -1;
    this.subs.sink = this.templateDataAdapter.updateMarcField(field, index).subscribe(state => {
      this.validateMarcField(field);
      this.templateState = state;
    });

  }
  validateMarcField(field: MarcFieldDTO) {
    if (field && field.tag && field.tag.length === 3) {
      const selectedItem = this.existingMARCData.find(marcbib => marcbib.tag === (field.tag === '000' ? 'Leader' : field.tag));
      if (selectedItem) {
        field.type = selectedItem.type;
        if (!selectedItem.repeatable) {

          let findDuplicates = this.templateState.template.fields.filter(h =>
            h.tag.includes(field.tag)
          );

          if (field.tag === '000') {
            findDuplicates = this.templateState.template.fields.filter(h =>
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
  handleUpDownPressed(eventargs: EventParams) {
    let nextIndex = -1;
    // get next index by skiping disabled controls
    if (eventargs.action === 'focus-bottom-element') {
      for (let i = eventargs.controlPosition + 1; i < this.templateState.template.fields.length; i++) {
        const field = this.templateState.template.fields[i];
        if (field && (!(field.tag) || field.tag === '003' ||
          (Constants.ControlFields.findIndex(t => t === field.tag) === -1 && field.tag !== '997' && field.tag !== 'Leader'))) {
          nextIndex = i;
          break;
        }
      }
    } else {
      for (let i = eventargs.controlPosition - 1; i > 0; i--) {
        const field = this.templateState.template.fields[i];
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
          this.renderer2.selectRootElement('#editIndicator2' + index).focus();
          $('#editIndicator2' + index).select();
        }
      }, 0);
    }
  }

  // apply the validation styles
  hasClass(event: any) {
    if (event && event.value === '') {
      event.classList.remove('border-danger');
    }
    if (event && event.classList && event.classList.contains('border-danger')) {
      return 'Invalid data';
    } else {
      return null;
    }
  }
  // If Level is Global/Local, the text field should be blanked out and disabled.
  disableControl() {
    if (this.templateState.template.level.toLowerCase() != 'institutional') {
      this.templateState.template.institution = '';
      return true;
    }
    return false;
  }

  onLevelChanged(event: Event) {
    this.isInstitutionRequired = true;
    this.templateState.template.institution = '';
  }

  // disable the Drag for Leader tag
  disableDrag(field: MarcField): boolean {
    return (
      Constants.ControlFields.findIndex(t => t === field.tag) !== -1 ||
      field.tag === 'Leader'
    );
  }
  // disable delete button for leader tag and control field
  disableDeleteBtn(field: any) {
    let isDisable = false;
    if (field.type === 'controlfield' || field.tag === 'Leader') {
      isDisable = true;
      if (field.isFieldEditable === true) {
        isDisable = false;
      }
    }
    return isDisable;
  }

  // disable the delete for required fields
  disabledDelete(field: any): boolean {
    if (
      !field.isFieldEditable &&
      (field.tag === 'Leader' ||
        field.tag === '006' ||
        field.tag === '007' ||
        field.tag === '008' ||
        field.tag === '001' ||
        field.tag === '005' ||
        field.tag === '003' ||
        field.tag === '997' ||
        field.tag === '010' ||
        field.tag === '919')
    ) {
      return true;
    }
  }

  // Helper Methods is expandable for leader and control fields
  isExpandable(tag: any) {
    if (tag === '000' || tag === '006' || tag === '007' || tag === '008') {
      return true;
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

    dialogRef.afterClosed().subscribe(
      result => {
        if (result) {
          form.form.markAsPristine();
          this.router.navigate(['/templates']);
        } else { form.form.markAsDirty(); }
      },
      error => { }
    );
  }

  // Show confirmation message if form dirty
  confirmationMessageLengthValidation(form: NgForm) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      height: 'auto',
      disableClose: true,
      data: {
        isCopyErrorMsg: false,
        isCancelConfirm: true,
        message:
          'The length of the template has exceeded the maximum limit of 5000 bytes. Do you still want to proceed?'
      }
    });

    dialogRef.afterClosed().subscribe(
      result => {
        if (result) {
          form.form.markAsPristine();
          this.saveTemplateDetails(form);
          // this.router.navigate(["/templates"]);
        } else { form.form.markAsDirty(); }
      },
      error => { }
    );
  }

  saveTemplateDetails(myForm: NgForm) {

    this.displayDuplicateWarnMessage = false;
    this.displayWarnMessage = false;

    myForm.form.markAsPristine();
    this.templateState.template.createdBy = localStorage.getItem('actor');
    this.templateState.template.isActive = true;
    this.templateState.template.name = this.templateState.template.name.trim();
    this.templateState.template.institution = this.templateState.template.institution.trim();
    this.spinnerService.spinnerStart();
    let isValid = true;

    let finalDataArray = [];
    const fixedFieldArray = [];
    let leaderField: any;
    if (
      this.templateState.template &&
      this.templateState.template.fields &&
      this.templateState.template.fields.length > 0
    ) {
      // Fixed Fields
      this.templateState.template.fields.forEach(field => {
        if (
          field.tag &&
          field.tag != null &&
          field.tag.toString().trim() !== ''
        ) {
          field.tag = field.tag.toString();
          if (
            Constants.ControlFields.findIndex(t => t === field.tag) !== -1
          ) {
            if (field.data != null) {
              field.data = field.data.replace(/#/g, ' ');
            }
            if (field.subFieldDescription != null) {
              field.subFieldDescription = field.subFieldDescription.replace(
                /#/g,
                ' '
              );
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

      if (leaderField.data) {
        const tempLeaderField = JSON.parse(JSON.stringify(leaderField));
        if (this.leaderDataWithHyphons) {
          let leaderDataWithoutHyphons = this.leaderDataWithHyphons.replace(/-/g, ' ');
          tempLeaderField.data = tempLeaderField.data.substring(0,17) + leaderDataWithoutHyphons.substring(17,19) + tempLeaderField.data.substring(19);
        }
        finalDataArray.unshift(tempLeaderField);
      }
      // Sub fields
      this.templateState.template.fields.forEach(field => {
        if (
          field.tag &&
          field.tag != null &&
          field.tag.toString().trim() !== ''
        ) {
          field.tag = field.tag.toString();
          if (
            !(
              Constants.ControlFields.findIndex(t => t === field.tag) !==
              -1 || field.tag === 'Leader'
            )
          ) {
            if (
              field.subFieldDescription &&
              field.subFieldDescription != null &&
              field.subFieldDescription.trim() !== ''
            ) {
              const subFieldData = this.commonService.lTrim(field.subFieldDescription).split(this.marcSettings.delimiter);
              // const subFieldData = field.subFieldDescription
              //   .trim()
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
                        if (
                          exitsubfileds[i] &&
                          exitsubfileds[i].authorityId != null
                        ) {
                          subField.authorityId =
                            exitsubfileds[i].authorityId;
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
    let finalTemplate =  this.clonerService.deepClone<TemplateDTO>(this.templateState.template);
    if (finalDataArray.length > 0) {
      finalTemplate.fields = finalDataArray;
      if (
        localStorage.getItem(Constants.LocalStorage.ACTOR) !== null &&
        localStorage.getItem(Constants.LocalStorage.ACTOR) !== ''
      ) {
        finalTemplate.lastModifiedBy = localStorage.getItem(
          Constants.LocalStorage.ACTOR
        );
      }
    }



    this.templateService.saveTemplate(finalTemplate).subscribe(result => {
      this.spinnerService.spinnerStop();

      if (result.Value == '') {
        this.displayDuplicateWarnMessage = true;
        this.displayWarnMessage = true;
        $('#template-name').focus();
        myForm.form.markAsDirty();
      } else {
        this.displayWarnMessage = false;
        this.displayDuplicateWarnMessage = false;
        myForm.form.markAsPristine();
        localStorage.removeItem(Constants.LocalStorage.FILTERPARAMS);
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
          width: '500px',
          height: 'auto',
          disableClose: true,
          data: {
            isCopyErrorMsg: false,
            isCancelConfirm: false,
            message: 'The template has been saved successfully.'
          }
        });
        dialogRef.afterClosed().subscribe(() => {
          myForm.form.markAsPristine();
          this.back(myForm);
        });
      }
    },
    (error) => {
      if (error.status == 403) {
        this.spinnerService.spinnerStop();
        alert(error.statusText);
        this.router.navigate(['/unauthorized']);
      } else {
        this.spinnerService.spinnerStop();
        throw(error);
      }
    });

  }

  // fix for enter key on profile description.
  getTemplateDesc() {
    const content = this.templateState.template.description;
    const caret = $('#template-description').prop('selectionStart');
    this.templateState.template.description = content.substring(0, caret) + '\n' + content.substring(caret, content.length);
  }

  // On scroll close autocomplete
  onScroll(e) {
    this.marcFields.forEach(x => {
      x.closeAutoComplete();
    });
  }

  getNewFieldPosition(index): number {
    const nonFixedFieldIndex: number = this.templateState.template.fields.findIndex(
      f =>
        (Constants.ControlFields.findIndex(t => t === f.tag) !== -1 ||
          f.tag === 'Leader') === false && f.isFieldEditable === true
    );
    // new field can not added above fixed fields.
    if (nonFixedFieldIndex === -1) {
      index = this.templateState.template.fields.length - 1;
    } else if (index < nonFixedFieldIndex) {
      index = nonFixedFieldIndex - 1;
    }
    return index;
  }
  updateLastFocusedIndex(index) {
    this.lastFocused = index;
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
      var eid = event.srcElement.id;
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
        console.log("Following rows to be copied:");
        positions.forEach(id => {
          console.log(id);
        });

        if ( positions.length > 0 ) {
          this.onCopyActivated(positions);
        }
        return false;
      }, ['INPUT', 'SELECT', 'TEXTAREA'], 'Copy Ctrl+Shift+C'));

    // Cut of Marc Fields in Marc Editor
    this.hotkeysService.add(
      new Hotkey('ctrl+shift+x', (event: KeyboardEvent): boolean => {
        const positions = this.getSelectionPositions();
        console.log("Following rows to be copied:");
        positions.forEach(id => {
          console.log(id);
        });
        if ( positions.length > 0 ) {
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
    this.handleCopyActivity(eventParams, this );
  }

  onCutActivated(positions: number[]) {
    const eventParams: CopyPasteEventParams = {
      action: 'row-cut-key-pressed',
      copyPositions: positions
    };
    this.handleCutActivity(eventParams, this);
  }


  onPasteActivated(positions: number[], replace: boolean) {
    const eventParams: CopyPasteEventParams = {
      action: 'row-paste-key-pressed',
      pastePositions: positions,
      replacePositions: replace
    };
    this.handlePasteActivity(eventParams, this);
  }
  saveCopiedMARCFieldsToLocalStorage(dataObj: any) {
    const clipObj = { type: 'MARC21TEMPLATE', data: dataObj };
    const val = JSON.stringify(clipObj);
    localStorage.setItem(Constants.LocalStorage.COPIEDTEMPLATEFIELDS, val);
  }

  grabCopiedMARCFieldsFromLocalStorage(): boolean {
    const copiedFields = localStorage.getItem(Constants.LocalStorage.COPIEDTEMPLATEFIELDS);
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
}
