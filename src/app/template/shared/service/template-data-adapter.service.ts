import { Injectable } from '@angular/core';
import { Marc, MarcBibData, MarcEditorSettings, MarcField } from '../../../marc/shared/marc';
import { MarcDTO, MarcSubFieldDTO, MarcFieldDTO, EditTagDTO, TemplateDTO } from 'src/app/_dtos/btcat.vm.dtos';
import { MarcSettingsService } from '../../../services/marc-settings.service';
import { Observable, of, EMPTY } from 'rxjs';
import { Constants } from '../../../constants/constants';
import { TemplateState } from '../store/template-state';
import { TemplateService } from './template.service';
import { map } from 'rxjs/operators';
import { Template } from '../template';
import { DropResult } from 'smooth-dnd';
import { ICopyPasteHandler } from 'src/app/marc/shared/service/marc-base-adapter';
const moment = require('moment-timezone');

@Injectable({
  providedIn: 'root'
})
export class TemplateDataAdapter  {
  public state: TemplateState;
  private tags: EditTagDTO[] = [];
  protected dataLength = 0;
  protected endOfField = 1;
  protected endOfDirectory = 1;
  protected endOfRecord = 1;
  protected directoryLength = 12;
  protected indicatorsLength = 2;
  private repeatableNonfixedMarcRecords: string[];
  constructor(private service: TemplateService, private marcSettingsService: MarcSettingsService) {
    this.CreateEditTags();
  }

  // State Management

  protected calculateFieldlengthState() {
    // const state = this.getState();
    if (this.state.template) {
      // state.toBeRemovedTags = this.getToBeRemovedTags();
      this.state.totalRecordLength += this.endOfDirectory + this.endOfRecord;

      this.state.template.fields.forEach(x => {
        if (x.tag === 'Leader') {
          this.dataLength = 24;
          this.state.totalRecordLength += this.dataLength;
        } else if (x.tag !== 'Leader' && x.type === 'controlfield') {
          if (x.tag === '001') {
            this.dataLength = 12;
          } else if (x.tag === '003') {
            this.dataLength = x.subFieldDescription.length;
          } else if (x.tag === '005') {
            this.dataLength = 16;
          } else if (x.tag === '006') {
            this.dataLength = 18;
          } else if (x.tag === '007') {
            this.dataLength = x.subFieldDescription.length;
          } else if (x.tag === '008') {
            this.dataLength = 40;
          }
          const count = this.dataLength + this.directoryLength + this.endOfField;
          this.state.totalRecordLength += count;
        } else {

          this.dataLength = 0;
          if (!(x.subFieldDescription.length > 0 && x.subfields.length > 0)) {
            if (x.subFieldDescription.length > 0) {
              const subTags = x.subFieldDescription.split('ǂ');
              let removeSpaces = subTags.length - 1;
              if (subTags.length === 2) {
                if (subTags[0] === '' && subTags[1] === '') {
                  removeSpaces = 0;
                }
              }
              this.dataLength = x.subFieldDescription.length - removeSpaces;
            }
          } else {
            this.dataLength = x.subFieldDescription.length - x.subfields.length;
          }
          const count = this.indicatorsLength + this.dataLength + this.directoryLength + this.endOfField;
          this.state.totalRecordLength += count;
        }
      });
      // this.setState({ totalRecordLength: state.totalRecordLength }, 'calculate_marc_field_length');
    }
  }
  protected setLeaderDataState() {
    // this.state.template.fields.map(x => {
    //   let datenow = new Date();
    //   let myMoment: moment.Moment = moment(datenow);
    //   if (x.tag === "008") {
    //     x.originalData = myMoment.format("YYMMDD") + x.subFieldDescription.substring(6);
    //     x.data = myMoment.format("YYMMDD") + x.subFieldDescription.substring(6);
    //     x.subFieldDescription = myMoment.format("YYMMDD") + x.subFieldDescription.substring(6);
    //   }
    //   if (x.tag === "Leader") {
    //     x.originalData = this.pad(this.totalRecordLength, 5) + x.data.substring(5);
    //     x.data = this.pad(this.totalRecordLength, 5) + x.data.substring(5);
    //   }
    // });
  }
  protected setToBeRemovedTagsState() {
    // const state = this.getState();
    const obsoleteAndDiscardedTags = this.marcSettingsService.getObsoleteAndDiscardedTags();
    const nonRepeatableMarcRecords = this.marcSettingsService.getNonRepetableFixedMarcRecords();
    const repeatedCtrlFieldTags = (this.state.template.fields && nonRepeatableMarcRecords)
      ? nonRepeatableMarcRecords.filter(x => this.state.template.fields.map(item => item.tag).includes(x.tag))
      : nonRepeatableMarcRecords;
    // tslint:disable-next-line: max-line-length
    const toBeRemovedTags = [...obsoleteAndDiscardedTags, ...repeatedCtrlFieldTags];
    // this.setState({ toBeRemovedTags }, 'set_toberemoved_tags');
    this.state.toBeRemovedTags = toBeRemovedTags;
  }
  getNewTemplate() {
    this.state = {
      template: {
        fields: [],
        createdBy: '',
        createdDate: new Date(),
        description: '',
        id: '',
        institution: '',
        isActive: true,
        lastModifiedBy: '',
        lastModifiedDate: new Date(),
        level: 'Select',
        name: '',
        type: 'Select'
      },
      leaderDataValue: '',
      leaderDescription: '',
      toBeRemovedTags: [],
      totalRecordLength: 0,
      currentMarcFieldPosition: - 1,
      isAddNewEnabled: true
    };
    return of(this.state);
}

  updateTemplateStateForClone(templateState: TemplateState): Observable<TemplateState> {
    this.state = templateState;
    this.state.template.id = '';
    this.state.template.description = '';
    this.state.template.name = 'Clone of ' + templateState.template.name;
    if(this.state.template.fields){
      this.state.template.fields.forEach(field => {
        // Update 00-05 position
        if (field.tag === '008' && field.data && field.data.length > 6) {
          const dateFormat = 'YYMMDD';
          const today = moment.tz(Date.now(), 'America/New_York').format(dateFormat);
          field.data = today + field.data.substring(6);
          field.subFieldDescription = field.data;
        }
      });
    }
    return of(this.state);
  }
  // ----------------------------------------------
  getTemplateById(id: string) {
    return this.fetchMarcTemplate(id);
  }
  fetchMarcTemplate(id: string) {
    return this.service.getTemplateById(id).pipe(
            map((item: Template) => this.transform(item)),
            map(item => {
                // this.setState({ marc: item }, 'initialize_marc');
                this.state = {
                  template: item,
                  leaderDataValue: '',
                  leaderDescription: '',
                  toBeRemovedTags: [],
                  totalRecordLength: 0,
                  currentMarcFieldPosition: - 1,
                  isAddNewEnabled: true
                };
                this.calculateFieldlengthState();
                this.setLeaderDataState();
                this.setToBeRemovedTagsState();
                return this.state;
            })
        );
  }
  public transform(item: Template): TemplateDTO {
    const delimiter = this.marcSettingsService.getDelimiter();
    return TemplateDTO.fromSource(item, delimiter);
  }

  public transformField(item: MarcField): MarcFieldDTO {
    const dateFormat = 'YYMMDD';
    const today = moment.tz(Date.now(), 'America/New_York').format(dateFormat);
    const dateValue = item.data.substring(0, 5);
    item.data = item.data.replace('001031', today);
    const delimiter = this.marcSettingsService.getDelimiter();
    return MarcFieldDTO.fromSource(item, 0, delimiter);
  }

  public createNewField(id: string): MarcFieldDTO {
    const markField: MarcFieldDTO = {
      id,
      ind1: '',
      ind2: '',
      subfields: [],
      subFieldDescription: '',
      type: null,
      tag: '',
      data: null,
      authorityId: '',
      color: '',
      isValid: true,
      isIndi1valid: true,
      isIndi2valid: true,
      isValidData: true,
      isFieldEditable: true,
      originalData: '',
      isFieldExpanded: false,
      isFieldExpandable: false,
      isLeaderCtrlField: false,
      isSystemGenerated: false,
      // isCreateAllowed: true,
      isDeleteDisabled: false,
      errMsg: '',
      ind1ErrMsg: '',
      ind2ErrMsg: '',
      isTagChanged: true,
      isInd1Changed: true,
      isInd2Changed: true,
      isSubFieldChanged: true,
      isSubfieldValid: true,
      isNew:true
    };

    return markField;
  }
  changeTemplateLevel(level: string): Observable<TemplateState> {
    if (level) {
      this.state.template.level = level;
    }
    return of(this.state);
  }
  changeTemplateInstitution(institution: string): Observable<TemplateState> {
    if (institution) {
      this.state.template.institution = institution;
    }
    return of(this.state);
  }
  changeTemplateType(type: string): Observable<TemplateState> {
    if (this.state.template &&
      this.state.template.fields &&
      this.state.template.fields.length > 0
    ) {
      this.state.isAddNewEnabled = true;
      // return false;
    }
    if (type === 'Select') {
      this.state.template.type = 'Select';
      this.state.template.fields = [];
      this.state.isAddNewEnabled = false;
    }
    if (type !== 'Select') {
      this.state.template.fields = this.marcSettingsService.getTemplateTypes()
        .find(x => x.name === type)
        .defaultBibMarcData
        .map(item => this.transformField(item)
        );
      this.state.template.type = type;
      this.state.isAddNewEnabled = true;      // this.getTotalRecordLength();
    }
    this.setLeaderDataState();
    this.setToBeRemovedTagsState();
    return of(this.state);
  }
  addMarcField(controlPosition: number): Observable<TemplateState> {
    const markField: MarcFieldDTO = this.createNewField(`newrow-${controlPosition + 1}`);
    this.state.template.fields.splice(controlPosition + 1, 0, markField);
    // this.calculateFieldlengthState();
    this.setLeaderDataState();
    this.setToBeRemovedTagsState();
    return of(this.state);
  }
  addMarcFieldsOnEnterWithData(controlPosition: number, fieldsData: MarcFieldDTO[], component: any): Observable<any> {
    let newPosition: number = +controlPosition + 1.0;
    fieldsData.forEach(d => {
      d.id = `newrow-${newPosition}`;
      d.isNew = true;
      newPosition = newPosition + 1;
    });

    if (fieldsData.length > 0) {
      this.state.template.fields.splice((+controlPosition + 1.0), 0, ...fieldsData);
    }
    component.setFocusOnTag((+controlPosition + 1.0));
    this.setLeaderDataState();
    this.setToBeRemovedTagsState();
    return of(this.state);
  }
  replaceMarcFields(index: number[], fieldsData: MarcFieldDTO[], component: any): Observable<any> {
    if (index.length <= 0) {
      return;
    }
    let startposition = -1;
    index.sort( ( a , b ) => b - a ).forEach( d => {
      if ( d >= 0 && this.state.template.fields[d].isFieldEditable ) {
         // only delete if the field is editable
        startposition = d;
        this.state.template.fields.splice(d, 1);
      }
    });
    if (startposition <= -1) {
      // all fields were non-editable then ignore this paste
      return of(this.state);
    } else {
      this.calculateFieldlengthState();
      this.setLeaderDataState();
      this.setToBeRemovedTagsState();
      this.updatecurrentMarcFieldPosition(startposition);
      return this.addMarcFieldsOnEnterWithData( startposition - 1 , fieldsData, component );
    }
  }
  deleteMarcFields(index: number[]): Observable<any> {
    if (index.length <= 0) {
      return;
    }
    index.sort( ( a , b ) => b - a ).forEach( d => {
      if ( d >= 0 ) {
        this.state.template.fields.splice(d, 1);
      }
    });
    this.calculateFieldlengthState();
    this.setLeaderDataState();
    this.setToBeRemovedTagsState();
    this.updatecurrentMarcFieldPosition(-1);
    return of(this.state);
  }

  deleteMarcField(index: number): Observable<TemplateState> {
    if (index < 0) {
      return;
    }
    // const state = this.getState();
    this.state.template.fields.splice(index, 1);
    // this.setState({ marc: state.marc }, 'delete_marc_field');
    this.calculateFieldlengthState();
    this.setLeaderDataState();
    this.setToBeRemovedTagsState();
    this.updatecurrentMarcFieldPosition(-1);
    return of(this.state);
  }

  updateMarcField(field: MarcFieldDTO, index: number): Observable<TemplateState> {
    if (!field || index < 0) {
      return;
    }
    // const state = this.getState();
    this.state.template.fields[index] = field;
    // this.setState({ marc: state.marc }, 'update_marc_field');
    this.calculateFieldlengthState();
    this.setLeaderDataState();
    this.setToBeRemovedTagsState();
    return of(this.state);
  }
  updateTemplateName(templateName: string) {
    if (templateName === null) {
      return;
    }
    this.state.template.name = templateName;
    return of(this.state);
  }
  updateTemplateType(type: string) {
    if (type === null) {
      return;
    }
    this.state.template.type = type;
    return of(this.state);
  }
  updateTemplateDescription(description: string) {
    if (description === null) {
      return;
    }
    this.state.template.description = description;
    return of(this.state);
  }
  updateTemplateLevel(level: string) {
    if (level === null) {
      return;
    }
    this.state.template.level = level;
    return of(this.state);
  }
  updateTemplateInstitution(institution: string) {
    if (institution === null) {
      return;
    }
    this.state.template.institution = institution;
    return of(this.state);
  }
  dragMarcField(arr: MarcFieldDTO[], dragResult: DropResult): Observable<TemplateState> {
    // const state = this.getState();
    const { removedIndex, addedIndex, payload } = dragResult;
    if (removedIndex === null && addedIndex === null) { return EMPTY; }

    const result = [...arr];
    let itemToAdd = payload;

    if (removedIndex !== null) {
      itemToAdd = result.splice(removedIndex, 1)[0];
    }

    if (addedIndex !== null) {
      result.splice(addedIndex, 0, itemToAdd);
      this.state.template.fields = result;
      // this.setState({ marc: state.marc }, 'drag_marc_field');
    }
    //this.calculateFieldlengthState();
    this.setLeaderDataState();
    this.setToBeRemovedTagsState();
    return of(this.state);
  }
  updateMarcField008(item: any): Observable<TemplateState> {
    // const state = this.getState();
    const tagDataIndex = this.state.template.fields.findIndex(a => a.tag === '008');
    // tslint:disable-next-line: max-line-length
    if (tagDataIndex && item.oldValue !== null && item.updatedvalue !== null && item.oldValue !== item.updatedvalue && item.oldValue.charAt(6) !== item.updatedvalue.charAt(6)) {
      const existingData = this.state.template.fields[tagDataIndex].data;
      const updatedData = existingData.substring(0, 18) + (new Array(18)).join(' ') + existingData.substring(35);
      this.state.template.fields[tagDataIndex].data = updatedData;
      this.state.template.fields[tagDataIndex].subFieldDescription = updatedData;
      // this.setState({ marc: state.marc }, 'update_marc_field_008');
      // this.calculateFieldlengthState();
      this.setLeaderDataState();
      this.setToBeRemovedTagsState();
    }
    return of(this.state);
  }
  updatecurrentMarcFieldPosition(index: number) {
    if (this.state) {
      this.state.currentMarcFieldPosition = index;
    }
  }
  public getMarcSettings(): MarcEditorSettings {
    return this.marcSettingsService.getMarcSettingsData();
  }
  public getMarcBib(): MarcBibData[] {
    return this.marcSettingsService.getMarcBibData();
  }
  public getObsoleteMarcBibData(): MarcBibData[] {
    return this.getMarcBib() ? this.getMarcBib().filter(x => x.isObsolete === true) : [];
  }

  public getdiscardedMarcBibData(): MarcBibData[] {
    return this.getMarcBib() ? this.getMarcBib().filter(x => x.tag.includes(Constants.SystemGeneratedTags)) : [];
  }

  public getleaderMarcBibData(): MarcBibData[] {
    return this.getMarcBib() ? this.getMarcBib().filter(x => x.tag.toLowerCase() === 'leader') : [];
  }

  public getObsoleteAndDiscardedTags(): EditTagDTO[] {
    const leaderEditTags = this.getleaderMarcBibData().map(x => this.CreateEditTagDTO(x));
    const obsoleteEditTags = this.getObsoleteMarcBibData().map(x => this.CreateEditTagDTO(x));
    const discardedEditTags = this.getdiscardedMarcBibData().map(x => this.CreateEditTagDTO(x));
    return [...leaderEditTags, ...obsoleteEditTags, ...discardedEditTags];
  }

  public getMarcBibDataByTag(tag: string): MarcBibData {
    return this.marcSettingsService.getMarcBibDataByTag(tag);
  }

  public getNonRepetableFixedMarcRecords(): EditTagDTO[] {
    const nonRepeatablefixedMarcRecords = this.getMarcBib().filter(r => !r.repeatable &&
      ((r.type && r.type === 'controlfield'))).map(item => this.CreateEditTagDTO(item));
    return nonRepeatablefixedMarcRecords;
  }

  public getFilteredTags(): EditTagDTO[] {
    return this.tags ? this.tags : [];
  }


  public getFilteredTagsById(tag: string, fields: MarcFieldDTO[]): EditTagDTO[] {
    return this.tags.filter(h => h.tag !== '919' && h.tag !== '010' && h.tag.startsWith(tag) && (h.isObsolete === false || h.tag === '997')
      && (h.isRepeatable === true || !fields.map(x => x.tag).includes(h.tag)));
  }

  private CreateEditTags() {
    // this.fixedFieldTags = this.getCurrentFixedTags();
    const marcBibRecords = this.getMarcBib();

    if (marcBibRecords && marcBibRecords.length > 0) {
      marcBibRecords.map(x => this.tags.push(this.CreateEditTagDTO(x)));
    }
  }

  private CreateEditTagDTO(x: MarcBibData): EditTagDTO {
    const editTag = new EditTagDTO();
    editTag.tag = x.tag;
    editTag.type = x.type;
    editTag.description = x.description;
    editTag.isObsolete = x.isObsolete;
    editTag.isRepeatable = x.repeatable;
    return editTag;
  }

  private getCurrentFixedTags(): string[] {
    const tags: string[] = [];
    const marcBibRecords = this.getMarcBib();
    if (marcBibRecords && marcBibRecords.length > 0) {
      marcBibRecords.forEach(marcBib => {
        if (marcBib.tag && (marcBib.type === 'controlfield' || marcBib.tag === 'Leader')) {
          tags.push(marcBib.tag.toString());
        }
      });
      return tags;
    }
  }
  pad(num: number, size: number): string {
    let s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
  }

}
