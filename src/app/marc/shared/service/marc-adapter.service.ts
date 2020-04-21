import { Injectable } from '@angular/core';
import { Marc } from '../../../marc/shared/marc';
import { Observable, of, Subject } from 'rxjs';
import { MarcState } from '../store/marc-state';
import { map } from 'rxjs/operators';
import { MarcService } from './marc-service';
import { MarcSettingsService } from 'src/app/services/marc-settings.service';
import { MarcBaseAdapter } from './marc-base-adapter';
const moment = require('moment-timezone');
import { CommonService } from 'src/app/shared/service/common.service';
import { Constants } from 'src/app/constants/constants';
import { state } from '@angular/animations';
import { MarcRecord } from 'src/app/services/search';


@Injectable({
  providedIn: 'root'
})  
export class MarcAdapter extends MarcBaseAdapter {
  state: MarcState;
  isMarcValidations: boolean=false;
  private scrollToTopSubject = new Subject<boolean>();
  scrollToTop$ = this.scrollToTopSubject.asObservable();
  constructor(
    protected service: MarcService,
    protected marcSettingsService: MarcSettingsService,
    private commonService: CommonService) {
    super(marcSettingsService, service);
    this.CreateEditTags();
  }
  // Edit
  resetMarc(id: string): Observable<MarcState> {
    this.setMarcState(null);
    return this.getMarc(id);
  }
  getMarc(id: string) {
    return this.fetchMarc(id);
  }
  getDeleteMarc(id: string) {
    return this.fetchDeleteMarc(id);
  }
  fetchDeleteMarc(id: string) {
    return this.service.getDeletedMarcRecordById(id).pipe(
      map(item => {
        this.setMarcState(item);
        this.calculateFieldlengthState();
        this.setLeaderDataState();
        this.setOriginalLeaderDataState();
        this.setToBeRemovedTagsState();
        if (this.commonService.isMarc21ValidationsEnable() === 'true') {
            this.isMarcValidations = true;
        } else {
            this.isMarcValidations = false;
        }
        this.state.overrideMarc21 = this.isMarcValidations;
        return this.state;
      })
    );
}
  getMarcs(ids: string[]): Observable<MarcState[]> {
    const stateArray: MarcState[] = [];
    return this.service.getMarcRecords(ids).pipe(
      map(marcArray => {
        marcArray.forEach(item => {
          this.setMarcState(item);
          this.calculateFieldlengthState();
          this.setLeaderDataState();
          this.setOriginalLeaderDataState();
          this.setToBeRemovedTagsState();
          if (this.commonService.isMarc21ValidationsEnable() === 'true') {
            this.isMarcValidations = true;
          } else {
            this.isMarcValidations = false;
          }
          this.state.overrideMarc21 = this.isMarcValidations;
          stateArray.push(this.state);
        });
        return stateArray;
      }));
  }
  fetchMarc(id: string) {
    return this.service.getMarcRecord(id).pipe(
      map(item => {
        this.setMarcState(item);
        this.calculateFieldlengthState();
        this.setLeaderDataState();
        this.setOriginalLeaderDataState();
        this.setToBeRemovedTagsState();
        if (this.commonService.isMarc21ValidationsEnable() === 'true') {
            this.isMarcValidations = true;
        } else {
            this.isMarcValidations = false;
        }
        this.state.overrideMarc21 = this.isMarcValidations;
        return this.state;
      })
    );
  }
  // TODO: No Need to pass isExternalUser
  fetchZ3950Marc(marc: Marc, isExternalUser: boolean): Observable<MarcState> {
    const item = this.transform(marc);
    // update 008 tag first 6 chars
    const field = item.fields.find(a => a.tag === '008');
    if (field) {
      const dateOnFile = moment()
        .tz('America/New_York')
        .format('YYMMDD');
      field.data = dateOnFile + field.data.substring(6);
      field.subFieldDescription =
        dateOnFile + field.subFieldDescription.substring(6);
    }

    this.setMarcState(item);
    // TODO: No need to have overrideMarc21 in state
    this.state.overrideMarc21 = (this.commonService.isMarc21ValidationsEnable()  === 'true' &&  isExternalUser) ? true : false;
    this.calculateFieldlengthState();
    this.setLeaderDataState();
    this.setOriginalLeaderDataState();
    this.setToBeRemovedTagsState();
    return of(this.state);
  }
  getZ3950Marc(marcRecord: Marc): MarcState {
          this.setMarcState(marcRecord);
          this.calculateFieldlengthState();
          this.setLeaderDataState();
          this.setOriginalLeaderDataState();
          this.setToBeRemovedTagsState();
          if (this.commonService.isMarc21ValidationsEnable() === 'true') {
            this.isMarcValidations = true;
          } else {
            this.isMarcValidations = false;
          }
          this.state.overrideMarc21 = this.isMarcValidations;
          return this.state;
  }
  // Clone
  getClonedMarc(id: string) {
    return this.fetchClonedMarc(id);
  }
  fetchClonedMarc(id: string): Observable<MarcState> {
    return this.service.cloneMarcRecordById(id).pipe(
      map(item => {
        this.setMarcState(item);
        this.calculateFieldlengthState();
        this.setLeaderDataState();
        this.setToBeRemovedTagsState();
        return this.state;
      })
    );
  }
  // Template
  getMarcTemplate(id: string) {
    return this.fetchMarcTemplate(id);
  }
  fetchMarcTemplate(id: string): Observable<MarcState> {
    return this.service.getMarcRecordByTemplateId(id).pipe(
      map(item => {
        this.setMarcState(item);
        this.calculateFieldlengthState();
        this.setLeaderDataState();
        this.setToBeRemovedTagsState();
        return this.state;
      })
    );
  }
  resetMarcTemplate(id: string): Observable<MarcState> {
    this.setMarcState(null);
    return this.getMarcTemplate(id);
  }
  overrideMarc21(overrideMarc21: boolean): Observable<MarcState> {
    this.overrideMarc(overrideMarc21);
    return of(this.state);
  }
  // set state from outside
  setState(marcState: MarcState) {
    this.state = marcState;
    this.scrollToTopSubject.next(true);
  }
}
