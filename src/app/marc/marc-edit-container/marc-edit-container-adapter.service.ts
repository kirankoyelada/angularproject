import { Injectable } from '@angular/core';
import { MarcState } from '../shared/store/marc-state';
import { MarcAdapter } from '../shared/service/marc-adapter.service';
import { Marc } from '../shared/marc';
import { Observable, of, Subject, BehaviorSubject } from 'rxjs';
import { CommonService } from 'src/app/shared/service/common.service';
import { PreviousRouteService } from 'src/app/services/previousRouteService';

export interface MarcContainerState {
  // id: string;
  // recordNumber: number;
  recordControlNumber: string;
  recordSource: string;
  isActive: boolean;
  isDirty: boolean;
  marcState: MarcState;
}

@Injectable({
  providedIn: 'root'
})
export class MarcEditContainerAdapterService {

  constructor(private marcAdapter: MarcAdapter,
              private commonService: CommonService,
              private previousRouteService: PreviousRouteService) {
               }
  state: MarcContainerState[] = [];
  resetState() {
    this.state = [];
  }

  initializeState(recordControlNumber: string, recordSource: string, index: number, marc: MarcState): Observable<MarcContainerState[]> {
    const marcContainerState: MarcContainerState = {
      recordControlNumber,
      recordSource,
      isDirty: false,
      isActive: index === 0 ? true : false,
      marcState: marc
    };
    this.state.push(marcContainerState);
    return of(this.state);
  }

  onTabState(previousMarc: MarcContainerState, currentMarc: MarcContainerState): Observable<MarcContainerState[]>  {
    const previousMarcIndex =  this.state.indexOf(previousMarc);
    const currentMarcIndex =  this.state.indexOf(currentMarc);
    const previousMarcOriginalstate = previousMarc.marcState.originalMarc ? JSON.stringify(previousMarc.marcState.originalMarc) : null;
    const previousMarcCurrentState = previousMarc.marcState.marc ? JSON.stringify(previousMarc.marcState.marc) : null;
    if (previousMarcOriginalstate && previousMarcCurrentState && previousMarcOriginalstate !== previousMarcCurrentState) {
      this.state[previousMarcIndex].isDirty = true;
    } else {
      this.state[previousMarcIndex].isDirty = false;
    }
    if (previousMarcIndex !== currentMarcIndex) {
      if (previousMarc) {
        this.state[previousMarcIndex].isActive = false;
      }
      this.state[currentMarcIndex].isActive = true;
    }
    this.marcAdapter.setState(this.state[currentMarcIndex].marcState);
    return of(this.state);
  }

  onMarcEditState(state: MarcState): Observable<MarcContainerState[]> {
    const index = this.state.findIndex(x => x.isActive);
    this.state[index].marcState = state;
    return of(this.state);
  }

  onMarcSaveState(marc: MarcContainerState, isSavedtoBTCATMain: boolean): Observable<MarcContainerState[]> {
    const index = this.state.indexOf(marc);
    this.state[index].isDirty  = false;
    if (isSavedtoBTCATMain && !this.commonService.isZ3950ProfileSearch()) {
      const duplicateRecord = this.state.find(x => x.marcState.marc.recordNumber === marc.marcState.marc.recordNumber && !x.isActive);
      if (duplicateRecord) {
        const dupIndex = this.state.indexOf(duplicateRecord);
        this.marcAdapter.getMarc(duplicateRecord.marcState.marc.id).subscribe(state => {
          this.state[dupIndex].isActive = true;
          this.state[dupIndex].marcState = state;
        });
      }
    }
    return of(this.state);
  }

  onMarcDeleteState(marc: MarcContainerState): Observable<MarcContainerState[]> {
    const index = this.state.indexOf(marc);
    this.state[index].isDirty  = false;
    return of(this.state);
  }

  onCloseState(marcContainerState: MarcContainerState): Observable<MarcContainerState[]> {
    let index = this.state.indexOf(marcContainerState);
    this.state.splice(index, 1);
    if (index > 0) {
      index = index - 1;
      if (marcContainerState.isActive) {
        this.state[index].isActive = true;
      }
      this.marcAdapter.setState(this.state[index].marcState);
    } else if (this.state[index]) {
      this.state[index].isActive = true;
      this.marcAdapter.setState(this.state[index].marcState);
    }
    return of(this.state);
  }
}
