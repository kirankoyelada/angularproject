import { MarcFieldDTO, MarcDTO, EditTagDTO, CopyPasteEventParams } from 'src/app/_dtos/btcat.vm.dtos';
import { MarcSettingsService } from 'src/app/services/marc-settings.service';
import { Marc, MarcBibData, MarcField } from '../marc';
import { MarcService } from './marc-service';
import { Observable, of, EMPTY, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Constants } from 'src/app/constants/constants';
import { MarcState } from '../store/marc-state';
import { DropResult } from 'smooth-dnd';
import * as _ from 'lodash';
import { SubSink } from 'subsink';
import { FormGroup, NgForm } from '@angular/forms';
import { ElementRef } from '@angular/core';
import { MarcFieldComponent } from '../marc-field/marc-field.component';

const moment = require('moment-timezone');

export abstract class MarcBaseAdapter {
  protected tags: EditTagDTO[] = [];
  protected abstract state: MarcState;
  protected dataLength = 0;
  protected endOfField = 1;
  protected endOfDirectory = 1;
  protected endOfRecord = 1;
  protected directoryLength = 12;
  protected indicatorsLength = 2;


  private textEditorDataChanged = new BehaviorSubject(false);
  textEditorDataChanged$ = this.textEditorDataChanged.asObservable();

  constructor(protected marcSettingsService: MarcSettingsService, protected service: MarcService) { }
  createNewField(id: string): MarcFieldDTO {
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
      isNew: true,
    };

    return markField;
  }
  transform(item: Marc): MarcDTO {
    const delimiter = this.marcSettingsService.getDelimiter();
    return MarcDTO.fromSource(item, delimiter);
  }
  transformField(item: MarcField, index: number): MarcFieldDTO {
    const delimiter = this.marcSettingsService.getDelimiter();
    return MarcFieldDTO.fromSource(item, index, delimiter);
  }
  addMarcField(id: string, index: number): Observable<MarcState> {
    if (!id) {
      return;
    }
    // const state = this.getState();
    const marcfield = this.createNewField(id);
    this.state.marc.fields.push(marcfield);
    // this.setState({ marc: state.marc }, 'add_marc_field_on_button_click');
    // this.calculateFieldlengthState();
    this.setLeaderDataState();
    this.setToBeRemovedTagsState();
    return of(this.state);
  }
  addMarcFieldOnEnter(controlPosition: number): Observable<MarcState> {
    const markField: MarcFieldDTO = this.createNewField(`newrow-${controlPosition + 1}`);
    this.state.marc.fields.splice(controlPosition + 1, 0, markField);
    this.updatecurrentMarcFieldPosition(controlPosition + 1);
    // this.calculateFieldlengthState();
    this.setLeaderDataState();
    this.setToBeRemovedTagsState();
    return of(this.state);
  }
  add949TagFields(controlPosition: number, markField: MarcField[]): Observable<MarcState> {
    let index = controlPosition + 1;
    markField.forEach(element => {
      const markFieldDTO: MarcFieldDTO = this.transformField(element, controlPosition + 1);
      this.state.marc.fields.splice(index++, 0, markFieldDTO);
    });
    this.setLeaderDataState();
    this.setToBeRemovedTagsState();
    return of(this.state);
  }
  addORSMarcFieldOnEnter(controlPosition: number, markField: MarcField): Observable<MarcState> {
    const markFieldDTO: MarcFieldDTO = this.transformField(markField, controlPosition + 1);
    this.state.marc.fields.splice(controlPosition + 1, 0, markFieldDTO);
    this.setLeaderDataState();
    this.setToBeRemovedTagsState();
    return of(this.state);
  }
  addMarcFieldsOnEnterWithData(controlPosition: number, fieldsData: MarcFieldDTO[], component: ICopyPasteHandler): Observable<MarcState> {
    let newPosition: number = +controlPosition + 1.0;
    fieldsData.forEach(d => {
      d.id = `newrow-${newPosition}`;
      d.isNew = true;
      newPosition = newPosition + 1;
    });

    if (fieldsData.length > 0) {
      this.state.marc.fields.splice((+controlPosition + 1.0), 0, ...fieldsData);
    }
    component.setFocusOnTag((+controlPosition + 1.0));
    this.updatecurrentMarcFieldPosition(newPosition);
    this.setLeaderDataState();
    this.setToBeRemovedTagsState();
    return of(this.state);
  }
  deleteMarcField(index: number): Observable<MarcState> {
    if (index < 0) {
      return;
    }
    const field = this.state.marc.fields[index];
    this.state.marc.fields.splice(index, 1);
    const totalfields = this.state.marc.fields.length;
    const newIndex = totalfields === index ? index - 1 : index;
    // this.setState({ marc: state.marc }, 'delete_marc_field');
    this.validateRepeatableTags(field);
    this.calculateFieldlengthState();
    this.setLeaderDataState();
    this.setToBeRemovedTagsState();
    this.updatecurrentMarcFieldPosition(newIndex);
    return of(this.state);
  }
  validateRepeatableTags(field: MarcFieldDTO) {
    if (field && field.tag && field.tag.trim() !== '') {
      if (this.state.marc) {
        const duplicateFields = this.state.marc.fields.filter(h =>(h.tag =='Leader' ?'000':h.tag) === (field.tag === 'Leader' ? '000' : field.tag));
        if (duplicateFields && duplicateFields.length === 1) {
          duplicateFields[0].isValid = true;
        }
      }
    }
  }
  replaceMarcFields(index: number[], fieldsData: MarcFieldDTO[], component: ICopyPasteHandler): Observable<MarcState> {
    if (index.length <= 0) {
      return;
    }
    let startposition = -1;
    index.sort((a, b) => b - a).forEach(d => {
      if (d >= 0) {
        if (this.state.marc.fields[d].isFieldEditable) {
          // only delete if the field is editable
          startposition = d;
          this.state.marc.fields.splice(d, 1);
        }
      }
    });
    if (startposition <= -1) {
      // all fields were non-editable then ignore this paste
      return of(this.state);
    } else {
      // at least one replacement done so insert the data else ignore this activity
      this.calculateFieldlengthState();
      this.setLeaderDataState();
      this.setToBeRemovedTagsState();
      this.updatecurrentMarcFieldPosition(startposition);
      return this.addMarcFieldsOnEnterWithData(startposition - 1, fieldsData, component);
    }
  }
  deleteMarcFields(index: number[]): Observable<MarcState> {
    if (index.length <= 0) {
      return;
    }
    index.sort((a, b) => b - a).forEach(d => {
      if (d >= 0) {
        this.state.marc.fields.splice(d, 1);
      }
    });
    this.calculateFieldlengthState();
    this.setLeaderDataState();
    this.setToBeRemovedTagsState();
    return of(this.state);
  }
  updateMarcField(field: MarcFieldDTO, index: number): Observable<MarcState> {
    this.changeMarcField(field, index);
    return of(this.state);
  }
  blurMarcField(field: MarcFieldDTO, index: number): Observable<MarcState> {
    return of(this.state);
  }
  protected changeMarcField(field: MarcFieldDTO, index: number) {
    if (!field || index < 0) {
      return;
    }
    this.state.currentMarcFieldPosition = index;
    // const state = this.getState();
    if (field.tag === '008' && field.data == '') {
      const marcBibRecords = this.marcSettingsService.getMarcBibData();
      // let sum = 0;
      const sum = marcBibRecords.find(x => x.tag === '008').subElements.map(ele => +ele.length).reduce((val1, val2) => val1 + val2, 0);
      const dateOnFile = moment().tz('America/New_York').format('YYMMDD');
      field.data = dateOnFile + ' '.repeat(sum);
      field.subFieldDescription = dateOnFile + ' '.repeat(sum);
    }
    this.state.marc.fields[index] = field;
    // this.setState({ marc: state.marc }, 'update_marc_field');
    this.calculateFieldlengthState();
    this.setLeaderDataState();
    this.setToBeRemovedTagsState();
  }

  protected overrideMarc(overrideMarc21: boolean) {
    this.state.overrideMarc21 = overrideMarc21;
    // if (this.state && this.state.marc && this.state.marc.fields) {
    //   // expanding/collapsing based on override flag to validate fixed fields
    //   this.state.marc.fields.forEach(field => {
    //     if (field.isFieldExpandable) {
    //       field.isFieldExpanded = !overrideMarc21;
    //     }
    //   });
    // }
  }

  handleCopyActivity(eventargs: CopyPasteEventParams, component: ICopyPasteHandler) {
    if (eventargs.copyPositions && eventargs.copyPositions.length > 0) {
      this.service.CopiedFields = [];
      eventargs.copyPositions.forEach(d => {
        const copyField = _.cloneDeep(this.getMarcFieldAtPosition(d, this.state));
        if (copyField.isFieldEditable || ( (copyField.tag === '001' || copyField.tag === '003' ) && this.state.overrideMarc21 )) {
          // Fixed field cannot be copied
          this.service.CopiedFields.push(copyField);
        }
      });
    }
    this.saveCopiedMARCFieldsToLocalStorage(this.service.CopiedFields);
    console.log('Copied fields : ' + this.service.CopiedFields.length);
  }

  handleCutActivity(eventargs: CopyPasteEventParams, component: ICopyPasteHandler) {
    if (eventargs.copyPositions && eventargs.copyPositions.length > 0) {

      const cutpositions = [];
      let minposition = 9999;
      this.service.CopiedFields = [];
      eventargs.copyPositions.forEach(d => {
        const copyField = _.cloneDeep(this.getMarcFieldAtPosition(d, this.state));
        if (copyField.isFieldEditable   || ( (copyField.tag === '001' || copyField.tag === '003' ) && this.state.overrideMarc21 )) {
          // Fixed field cannot be copied
          this.service.CopiedFields.push(copyField);
          cutpositions.push(d);
          if (d < minposition) {
            minposition = d;
          }
        }
      });

      component.form.form.markAsDirty();
      if (cutpositions.length > 0) {
        const selObj = window.getSelection();
        let replace = false;
        if (selObj.type !== 'Caret') {
          replace = true;
        }
        if (!replace) {
          component.subsink.sink = this.deleteMarcField(cutpositions[0]).subscribe(state => {
            this.state = state;
            minposition = (this.state.marc.fields.length === minposition) ? minposition - 1 : minposition;
            component.setFocusOnTag(minposition + 1);
            setTimeout(() => {
              component.setFocusOnTag(minposition);
            }, 200);
          });
        } else {
          component.subsink.sink = this.deleteMarcFields(cutpositions).subscribe(state => {
            this.state = state;
            minposition = (this.state.marc.fields.length === minposition) ? minposition - 1 : minposition;
            component.setFocusOnTag(minposition);
            setTimeout(() => {
              component.setFocusOnTag(minposition);
            }, 200);
          });
        }
      }
    }

    this.saveCopiedMARCFieldsToLocalStorage(this.service.CopiedFields);

    console.log('Cut fields : ' + this.service.CopiedFields.length);
  }

  // tslint:disable-next-line: max-line-length
  handlePasteActivity(eventargs: CopyPasteEventParams, component: ICopyPasteHandler) {

    this.grabCopiedMARCFieldsFromLocalStorage();
    if (this.service.CopiedFields && this.service.CopiedFields.length > 0) {
      component.form.form.markAsDirty();
      if (eventargs.replacePositions) {
        // Delete selected items and paste new copied contents
        if (eventargs.pastePositions && eventargs.pastePositions.length > 0) {
          const controlPosition = eventargs.pastePositions.sort()[0];
          component.subsink.sink = this.replaceMarcFields(eventargs.pastePositions, this.service.CopiedFields, component).subscribe(state => {
            this.state = state;
          });
        }
      } else {
        const controlPosition = this.getNewFieldPosition(eventargs.pastePositions[0], this.state);
        component.subsink.sink = this.addMarcFieldsOnEnterWithData(controlPosition, this.service.CopiedFields, component).subscribe(state => {
          this.state = state;
          component.setFocusOnTag(controlPosition + 1);
        });
      }
    }
  }

  getNewFieldPosition(index: number, uiMarcState: MarcState): number {
    const nonFixedFieldIndex: number = uiMarcState.marc.fields.findIndex(
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

  getMarcFieldAtPosition(index: number, state: any): MarcFieldDTO {
    if (state.marc.fields.length <= index || index < 0) {
      console.log('Index overflow ' + index + ' only ' + state.marc.fields.length + ' are there.');
      return null;
    }
    return state.marc.fields[index];
  }
  dragMarcField(arr: MarcFieldDTO[], dragResult: DropResult): Observable<MarcState> {
    // const state = this.getState();
    this.state.currentMarcFieldPosition = -1;
    const { removedIndex, addedIndex, payload } = dragResult;
    if (removedIndex === null && addedIndex === null) { return EMPTY; }

    const result = [...arr];
    let itemToAdd = payload;

    if (removedIndex !== null) {
      itemToAdd = result.splice(removedIndex, 1)[0];
    }

    if (addedIndex !== null) {
      result.splice(addedIndex, 0, itemToAdd);
      this.state.marc.fields = result;
      // this.setState({ marc: state.marc }, 'drag_marc_field');
    }
    // this.calculateFieldlengthState();
    this.setLeaderDataState();
    this.setToBeRemovedTagsState();
    return of(this.state);
  }
  updateMarcField008(item: any): Observable<MarcState> {
    this.changeMarcField008(item);
    return of(this.state);
  }
  protected changeMarcField008(item: any) {
    const tagDataIndex = this.state.marc.fields.findIndex(a => a.tag === '008');
    // tslint:disable-next-line: max-line-length
    if (tagDataIndex && item.oldValue !== null && item.updatedvalue !== null && item.oldValue !== item.updatedvalue && item.oldValue.charAt(6) !== item.updatedvalue.charAt(6)) {
      const existingData = this.state.marc.fields[tagDataIndex].data;
      const updatedData = existingData.substring(0, 18) + (new Array(18)).join(' ') + existingData.substring(35);
      this.state.marc.fields[tagDataIndex].data = updatedData;
      this.state.marc.fields[tagDataIndex].subFieldDescription = updatedData;
      // this.setState({ marc: state.marc }, 'update_marc_field_008');
      // this.calculateFieldlengthState();
      this.setLeaderDataState();
      this.setToBeRemovedTagsState();
    }
  }

  updatecurrentMarcFieldPosition(index: number) {
    if (this.state) {
      this.state.currentMarcFieldPosition = index;
    }
  }
  getEditTags(tag: string, tagsTotemove: EditTagDTO[]): EditTagDTO[] {
    // Reload tags
    if (!(this.tags && this.tags.length > 0)) {
      this.CreateEditTags();
    }
    // tslint:disable-next-line: max-line-length
    const tagsData = this.tags.filter(h => h.tag.startsWith(tag) && (h.isObsolete === false && Constants.SystemGeneratedTags.indexOf(h.tag) === -1));
    return tagsData.filter(h => (!tagsTotemove.map(x => x.tag).includes(h.tag)) || h.isRepeatable === true);
  }
  getOverrideEditTags(tag: string, tagsTotemove: EditTagDTO[]): EditTagDTO[] {
    // Reload tags
    if (!(this.tags && this.tags.length > 0)) {
      this.CreateEditTags();
    }
    // tslint:disable-next-line: max-line-length
    const tagsData = this.tags.filter(h => h.tag.startsWith(tag) && Constants.SystemGeneratedTagsInOverride.indexOf(h.tag) === -1);
    return tagsData.filter(h => (!tagsTotemove.map(x => x.tag).includes(h.tag)) || h.isRepeatable === true);
  }
  CreateEditTags() {
    // this.fixedFieldTags = this.getCurrentFixedTags();
    const marcBibRecords = this.marcSettingsService.getMarcBibData();

    if (marcBibRecords && marcBibRecords.length > 0) {
      marcBibRecords.map(x => this.tags.push(this.CreateEditTagDTO(x)));
    }
  }
  CreateEditTagDTO(x: MarcBibData): EditTagDTO {
    const editTag = new EditTagDTO();
    editTag.tag = x.tag;
    editTag.type = x.type;
    editTag.description = x.description;
    editTag.isObsolete = x.isObsolete;
    editTag.isRepeatable = x.repeatable;
    return editTag;
  }
  pad(num: number, size: number): string {
    let s = num + '';
    while (s.length < size) { s = '0' + s; }
    return s;
  }
  getleaderDescription(data: string): string {
    if (data) {
      return data.substring(5, 10) + data.substring(17, 20);
    }
    return '';
  }
  getLeaderData(field: MarcField): string {
    if (field && field.tag === 'Leader' && field.data) {
      return field.data.substring(5, 10) + field.data.substring(17, 20);
    }
    return '';
  }
  resetState() {
    this.setMarcState(null);
  }
  protected isEmptyField(field: MarcField) {
    return !(field && (field.data || field.ind1 || field.ind2 || field.subfields || field.subFieldDescription));
  }
  protected compareData(marcfield: MarcField, marcfieldDTO: MarcFieldDTO): boolean {
    const newMarcfieldDTO = this.transformField(marcfield, 0);
    return newMarcfieldDTO.tag === marcfieldDTO.tag &&
    newMarcfieldDTO.ind1 === marcfieldDTO.ind1 &&
    newMarcfieldDTO.ind2 === marcfieldDTO.ind2 &&
    newMarcfieldDTO.data === marcfieldDTO.data &&
    newMarcfieldDTO.subFieldDescription === marcfieldDTO.subFieldDescription;
  }
  protected calculateFieldlengthState() {
    const fields = this.state.marc.fields.filter(f => f.tag && (f.tag === '005' || f.data || f.ind1 || f.ind2 || f.subFieldDescription));

    if (this.state.marc) {
      this.state.totalRecordLength = this.endOfDirectory + this.endOfRecord;
      fields.forEach(x => {
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
          if (!((x.subFieldDescription && x.subFieldDescription.length > 0) && (x.subfields && x.subfields.length > 0))) {
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
    this.state.marc.fields.map(x => {
      if (x.tag === 'Leader') {
        x.originalData = this.pad(this.state.totalRecordLength, 5) + x.data.substring(5);
        x.data = this.pad(this.state.totalRecordLength, 5) + x.data.substring(5);
        this.state.leaderDescription = this.getleaderDescription(x.data);
        this.state.leaderDataValue = x.data;
        // this.setState({ leaderDescription: state.leaderDescription, leaderDataValue: state.leaderDataValue }, 'set_leader_data');
      }
    });
  }
  protected setOriginalLeaderDataState() {
    this.state.originalMarc.fields.map(x => {
      if (x.tag === 'Leader') {
        x.originalData = this.pad(this.state.totalRecordLength, 5) + x.data.substring(5);
        x.data = this.pad(this.state.totalRecordLength, 5) + x.data.substring(5);
      }
    });
  }
  setToBeRemovedTagsState() {
    let toBeRemovedTags = [];
    const obsoleteAndDiscardedTags = this.marcSettingsService.getObsoleteAndDiscardedTags();
    const nonRepeatableMarcRecords = this.marcSettingsService.getNonRepetableFixedMarcRecords();
    const repeatedCtrlFieldTags = (this.state.marc.fields && nonRepeatableMarcRecords)
        ? nonRepeatableMarcRecords.filter(x => this.state.marc.fields.map(item => item.tag).includes(x.tag))
        : nonRepeatableMarcRecords;
    toBeRemovedTags = [...obsoleteAndDiscardedTags, ...repeatedCtrlFieldTags];
    this.state.toBeRemovedTags = toBeRemovedTags;
  }
  protected setMarcState(item: Marc) {
    const state = {
      marc: this.transform(item),
      originalMarc: this.transform(item),
      leaderDataValue: '',
      leaderDescription: '',
      toBeRemovedTags: [],
      totalRecordLength: 0,
      currentMarcFieldPosition: -1,
      overrideMarc21: false,
      displayWarnMessage: false
    };
    this.state = state;
  }
  cloneMarcState(state: MarcState): Observable<MarcState> {
    this.state = state;
    return of(this.state);
  }
  ontextEditorDataChanged(isChanged: boolean) {
    this.textEditorDataChanged.next(isChanged);
  }
}

export interface ICopyPasteHandler {
  subsink: SubSink;
  marcState: MarcState;
  form: NgForm;
  setFocusOnTag(index: number): void;
}
