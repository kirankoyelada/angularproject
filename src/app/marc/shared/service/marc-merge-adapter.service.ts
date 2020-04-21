import { Injectable } from '@angular/core';
import { MarcService } from './marc-service';
import { MarcSettingsService } from 'src/app/services/marc-settings.service';
import { MergeMarc, MarcField, MarcBibData } from '../marc';
import { MarcFieldDTO, EditTagDTO, MarcSubFieldDTO } from 'src/app/_dtos/btcat.vm.dtos';
import { Constants } from 'src/app/constants/constants';
import { MarcBaseAdapter } from './marc-base-adapter';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { DropResult } from 'ngx-smooth-dnd';
import { MergeMarcState } from '../store/marc-merge-state';

@Injectable({
  providedIn: 'root'
})
export class MarcMergeAdapterService extends MarcBaseAdapter {
  state: MergeMarcState;
  constructor(protected service: MarcService, protected marcSettingsService: MarcSettingsService) {
    super(marcSettingsService, service);
  }
  getDefaultMarcRecordsForMerge(overrideMarc21: boolean) {
    this.state.source = null;
    this.state.destination = null;
    this.state.overrideMarc21 = overrideMarc21;
    this.setMarcState(null);
    return of(this.state);
  }
  getMarcRecordsForMerge(sourceMarcId: string, destinationMarcId: string, overrideMarc: boolean): Observable<MergeMarcState> {
    return this.service.getMarcRecordsForMerge(sourceMarcId, destinationMarcId).pipe(
      map((item: MergeMarc) => {
        item = this.buildFinalMarc(item);
        this.state = {
          source: this.transform(item.source),
          destination: this.transform(item.destination),
          originalMarc: this.transform(item.final),
          marc: this.transform(item.final),
          leaderDataValue: '',
          leaderDescription: '',
          toBeRemovedTags: [],
          totalRecordLength: 0,
          currentMarcFieldPosition: -1,
          overrideMarc21: overrideMarc,
          displayWarnMessage: false
        };
        this.calculateFieldlengthState();
        this.setToBeRemovedTagsState();
        return this.state;
      }));
  }
  // tslint:disable-next-line: max-line-length
  getMarcRecordHistoryForMerge(destMarcRecHistoryId: string, otherMarcRecHistoryId: string, overrideMarc: boolean): Observable<MergeMarcState> {
    return this.service.getMarcRecordHistoryForMerge(destMarcRecHistoryId, otherMarcRecHistoryId).pipe(
      map((item: MergeMarc) => {
        item = this.buildFinalMarc(item);
        this.state = {
          source: this.transform(item.source),
          destination: this.transform(item.destination),
          originalMarc: this.transform(item.final),
          marc: this.transform(item.final),
          leaderDataValue: '',
          leaderDescription: '',
          toBeRemovedTags: [],
          totalRecordLength: 0,
          currentMarcFieldPosition: -1,
          overrideMarc21: overrideMarc,
          displayWarnMessage: false
        };
        this.calculateFieldlengthState();
        this.setToBeRemovedTagsState();
        return this.state;
      })
    );
  }
  onMoveField(field: MarcField, index: number): Observable<MergeMarcState> {
    this.state.marc.fields[index] = this.transformField(field, index);
    this.calculateFieldlengthState();
    return of(this.state);
  }
  onMoveAllFields(isDestinationPane: boolean, nonRepeatableTags: string[]): Observable<MergeMarcState> {
    if (this.state && ((isDestinationPane && this.state.destination && this.state.destination.fields) ||
      (!isDestinationPane && this.state.source && this.state.source.fields))) {

      let length = isDestinationPane ? this.state.destination.fields.length : this.state.source.fields.length;
      for (let index = 0; index < length; index++) {
        const field = isDestinationPane ? this.state.destination.fields[index] : this.state.source.fields[index];
        if (field.tag && !(field.tag === '001' || field.tag === '005' || field.tag === '997') && !this.isEmptyField(field)) {
          const finalField = this.state.marc.fields[index];
          if (Constants.ControlFields.findIndex(t => t === field.tag) > -1 || field.tag === 'Leader' || this.isEmptyField(finalField)) {
            this.state.marc.fields[index] = this.transformField(field, index);
          } else if (this.compareData(field, finalField)) {
            this.state.marc.fields[index] = this.transformField(field, index);
          } else {
            const markField = this.transformField(field, index);
            // this.finalMarcDTO.fields.push(markField);
            this.state.marc.fields.splice(index + 1, 0, markField);
            const newField = new MarcFieldDTO();
            newField.tag = field.tag;
            this.state.destination.fields.splice(index + 1, 0, newField);
            this.state.source.fields.splice(index + 1, 0, newField);
            length++;
          }
        }
        this.validateRepeatableTag(this.state.marc.fields[index], nonRepeatableTags);
      }

      this.calculateFieldlengthState();
    }
    return of(this.state);
  }
  onAddNewField(index: number): Observable<MergeMarcState> {
    const markField = this.createNewField(`newrow-${index + 1}`);
    this.state.marc.fields.splice(index + 1, 0, markField);
    const newField = new MarcFieldDTO();
    this.state.destination.fields.splice(index + 1, 0, newField);
    this.state.source.fields.splice(index + 1, 0, newField);
    return of(this.state);
  }
  onDeleteMarcField(position: number, field: MarcFieldDTO): Observable<MergeMarcState> {
    const index = this.state.marc.fields.findIndex(f => f === field);
    if (field.isNew ||
      (this.isEmptyField(this.state.destination.fields[position])
      && this.isEmptyField(this.state.source.fields[position]))) {
      this.state.marc.fields.splice(index, 1);
      if (this.state.destination.fields[index]) {
        this.state.destination.fields.splice(index, 1);
      }
      if (this.state.source.fields[index]) {
      this.state.source.fields.splice(index, 1);
      }
    } else {
      const newField = new MarcField();
      newField.tag = this.state.originalMarc.fields[position].tag;
      newField.type = this.state.originalMarc.fields[position].type;
      const fieldData = this.transformField(newField, position);
      this.state.marc.fields[position] = fieldData;
    }
    this.calculateFieldlengthState();
    return of(this.state);
  }
  onTagUpdate(field: MarcFieldDTO, nonRepeatableTags: string[]): Observable<MergeMarcState> {
    const index = this.state.marc.fields.findIndex(f => f === field);
    if (field.isNew) {
      if (this.state.destination.fields[index]) {
        this.state.destination.fields[index].tag = field.tag;
        this.state.destination.fields[index].type = field.type;
      }
      if (this.state.source.fields[index]) {
        this.state.source.fields[index].tag = field.tag;
        this.state.source.fields[index].type = field.type;
      }
    }

    if (this.state.marc.fields[index]) {
      this.state.marc.fields[index].tag = field.tag;
      this.state.marc.fields[index].type = field.type;
    }

    return of(this.state);
  }
  onUpdateMarcField(item: any, index: number): Observable<MergeMarcState> {
    this.changeMarcField(item, index);
    return of(this.state);
  }
  onUpdateMarcField008(item: any): Observable<MergeMarcState> {
    this.changeMarcField008(item);
    return of(this.state);
  }
  onCompleteMerge(): Observable<MergeMarcState> {
    this.calculateFieldlengthState();
    this.state.marc.isSaveToBTCATMain = this.state.marc.isBTCATMain;
    return of(this.state);
  }
  onDrop(dropResult: DropResult): Observable<MergeMarcState> {
    this.state.marc.fields = this.applyDrag(this.state.marc.fields, dropResult);
    this.state.originalMarc.fields = this.applyDrag(this.state.originalMarc.fields, dropResult);
    this.state.destination.fields = this.applyDrag(this.state.destination.fields, dropResult);
    this.state.source.fields = this.applyDrag(this.state.source.fields, dropResult);
    return of(this.state);
  }
  overrideMarc21(overrideMarc21: boolean): Observable<MergeMarcState> {
    this.overrideMarc(overrideMarc21);
    return of(this.state);
  }
  onSave(delimiter: string): Observable<MergeMarcState> {
    let finalDataArray: MarcFieldDTO[] = [];
    const fixedFieldArray: MarcFieldDTO[] = [];
    let leaderField: MarcFieldDTO;
    if (this.state.marc && this.state.marc.fields && this.state.marc.fields.length > 0) {
      // Fixed Fields

      this.state.marc.fields.forEach(field => {
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
      this.state.marc.fields.forEach(field => {
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
              const subFieldData = field.subFieldDescription.trim()
                .split(delimiter);
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
                      if (code && code != null && code !== '') {
                        let data = f.slice(1);
                        if (data && data != null && data.trim() !== '') {
                          if (data.slice(-1).trim() === '') {
                            data = data.slice(0, -1);
                          }
                          if (data.slice(0, 1).trim() === '') {
                            data = data.substr(1);
                          }
                          subField.code = code;
                          subField.data = data;
                          if (exitsubfileds && exitsubfileds.length > i && exitsubfileds[i] && exitsubfileds[i].authorityId != null) {
                            subField.authorityId = exitsubfileds[i].authorityId;
                          }

                          field.subfields.push(subField);
                        } else {
                          // isValid = false;
                        }
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
    this.state.marc.fields = finalDataArray.length > 0 ? finalDataArray : this.state.marc.fields;
    return of(this.state);
  }
  private applyDrag = (arr, dragResult) => {
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
  // Temporary solution as part of optimization. This shouldn't be in adapter class. Validation should be handled by Form controls
  validateRepeatableTag(field: MarcFieldDTO, nonRepeatableTags: string[]) {
      if (field && field.tag && field.tag.length === 3 &&
        nonRepeatableTags && (nonRepeatableTags.indexOf(field.tag) !== -1 || field.tag === '000')  &&
        !this.isEmptyField(field) && !this.overrideMarc21) {
        let findDuplicates = this.state.marc.fields.filter(f =>
          f.tag.includes(field.tag) && (f.data || f.ind1 || f.ind2 || f.subFieldDescription)
        );


        if (field.tag === '000') {
          findDuplicates = this.state.marc.fields.filter(h =>
            (h.tag.includes(field.tag) || h.tag.includes('Leader'))
          );
        }

        if (findDuplicates.length > 1) {
          field.isValid = false;
          field.errMsg = 'Not repeatable';
        // tslint:disable-next-line: max-line-length
        } else if (field.isValid && field.isTagChanged && Constants.SystemGeneratedTags && Constants.SystemGeneratedTags.find(a => a === field.tag)) {
          field.isValid = false;
          field.errMsg = field.tag + ' is system generated';
        }
      }
  }
  // Merge
  buildFinalMarc(mergeMarc: MergeMarc): MergeMarc {
    const srcColor = '#dffaa3';
    const destColor = '#b6e2e9';
    const maxLength = mergeMarc.source.fields.length;
    const srcFields = mergeMarc.source.fields;
    const destFields = mergeMarc.destination.fields;
    const finalFields = mergeMarc.final.fields;
    for (let i = 0; i < maxLength; i++) {
      if (!(srcFields[i].tag === 'Leader' && this.getLeaderData(srcFields[i]) === this.getLeaderData(destFields[i]))) {
        if (!this.compareFields(srcFields[i],destFields[i])) {
          if (this.compareFields(finalFields[i],destFields[i]) &&
            (finalFields[i].data != null || finalFields[i].subfields != null)) {
            finalFields[i].color = destColor;
          }
          srcFields[i].color = srcColor;
          destFields[i].color = destColor;
        }
      }
    }
    return mergeMarc;
  }

  compareFields(field1:MarcField, field2: MarcField): boolean
  {
      let transformedField1 = this.transformField(field1, 0);
      let transformedField2 = this.transformField(field2, 0);
      return transformedField1.tag == transformedField2.tag &&
      transformedField1.ind1 == transformedField2.ind1 &&
      transformedField1.ind2 == transformedField2.ind2 &&
      transformedField1.subFieldDescription == transformedField2.subFieldDescription;

  }
  transformField(item: MarcField, index: number): MarcFieldDTO {
    const delimiter = this.marcSettingsService.getDelimiter();
    return MarcFieldDTO.fromSource(item, index, delimiter);
  }
  // TODO: Remove.
  getObsoleteMarcBibData(): MarcBibData[] {
    return this.marcSettingsService.getMarcBibData() ? this.marcSettingsService.getMarcBibData().filter(x => x.isObsolete === true) : [];
  }
  // TODO: Remove.
  getdiscardedMarcBibData(): MarcBibData[] {
    // tslint:disable-next-line: max-line-length
    return this.marcSettingsService.getMarcBibData() ? this.marcSettingsService.getMarcBibData().filter(x => x.tag.includes(Constants.SystemGeneratedTags)) : [];
  }
  // TODO: Remove.
  getleaderMarcBibData(): MarcBibData[] {
    // tslint:disable-next-line: max-line-length
    return this.marcSettingsService.getMarcBibData() ? this.marcSettingsService.getMarcBibData().filter(x => x.tag.toLowerCase() === 'leader') : [];
  }
  // TODO: Remove. Need to cheeck this in merge and create
  getObsoleteAndDiscardedTags(): EditTagDTO[] {
    const leaderEditTags = this.getleaderMarcBibData().map(x => this.CreateEditTagDTO(x));
    const obsoleteEditTags = this.getObsoleteMarcBibData().map(x => this.CreateEditTagDTO(x));
    const discardedEditTags = this.getdiscardedMarcBibData().map(x => this.CreateEditTagDTO(x));
    return [...leaderEditTags, ...obsoleteEditTags, ...discardedEditTags];
  }

  // TODO: Remove. Need to cheeck this in merge and create
  getNonRepetableFixedMarcRecords(): EditTagDTO[] {
    const nonRepeatablefixedMarcRecords = this.marcSettingsService.getMarcBibData().filter(r => !r.repeatable &&
      ((r.type && r.type === 'controlfield'))).map(item => this.CreateEditTagDTO(item));
    return nonRepeatablefixedMarcRecords;
  }
  // TODO: Remove. Need to cheeck this in merge
  getTotalRecordLength(fields: MarcFieldDTO[]): number {
  let totalRecordLength = 0;
  let dataLength = 0;
  const directoryLength = 12;
  const endOfField = 1;
  const indicatorsLength = 2;
  const endOfDirectory = 1;
  const endOfRecord = 1;
  fields.forEach(x => {
    if (x.tag === 'Leader') {
      dataLength = 24;
      totalRecordLength += dataLength;
    } else if (x.tag !== 'Leader' && x.type === 'controlfield') {
      if (x.tag === '001') {
        dataLength = 12;
      } else if (x.tag === '003') {
        dataLength = x.subFieldDescription.length;
      } else if (x.tag === '005') {
        dataLength = 16;
      } else if (x.tag === '006') {
        dataLength = 18;
      } else if (x.tag === '007') {
        dataLength = x.subFieldDescription.length;
      } else if (x.tag === '008') {
        dataLength = 40;
      }
      const count = dataLength + directoryLength + endOfField;
      totalRecordLength += count;
    } else {

      dataLength = 0;
      if (!(x.subFieldDescription.length > 0 && x.subfields && x.subfields.length > 0)) {
        if (x.subFieldDescription.length > 0) {
          const subTags = x.subFieldDescription.split('ǂ');
          let removeSpaces = subTags.length - 1;
          if (subTags.length === 2) {
            if (subTags[0] === '' && subTags[1] === '') {
              removeSpaces = 0;
            }
          }
          dataLength = x.subFieldDescription.length - removeSpaces;
        }
      } else {
        dataLength = x.subFieldDescription.length - (x.subfields ? x.subfields.length: 0);
      }
      const count = indicatorsLength + dataLength + directoryLength + endOfField;
      totalRecordLength += count;
    }
  });

  totalRecordLength += endOfDirectory + endOfRecord;
  // TODO: Not Needed. Setting of value cannot happen in a set method
  fields.map(x => {
    if (x.tag === 'Leader') {
      x.originalData = this.pad(totalRecordLength, 5) + x.data.substring(5);
      x.data = this.pad(totalRecordLength, 5) + x.data.substring(5);
    }
  });
  return totalRecordLength;
  }
}

