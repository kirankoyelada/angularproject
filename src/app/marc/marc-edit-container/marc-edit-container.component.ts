import { Component, OnInit, ViewChild, ComponentFactoryResolver } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MarcRecord } from 'src/app/services/search';
import { MarcState } from '../shared/store/marc-state';
import { MarcAdapter } from '../shared/service/marc-adapter.service';
import { MatDialog } from '@angular/material';
import { ConfirmationDialogComponent } from 'src/app/components/shared/confirmation-dialog/confirmation-dialog.component';
import { Constants } from 'src/app/constants/constants';
import { AuthenticationService } from 'src/app/security/authentication.service';
import { PreviousRouteService } from 'src/app/services/previousRouteService';
import { NgForm } from '@angular/forms';
import { FormCanDeactivate } from 'src/app/can-deactivate/form-can-deactivate';
import { CommonService } from 'src/app/shared/service/common.service';
import { MarcContainerState, MarcEditContainerAdapterService } from './marc-edit-container-adapter.service';
import { SpinnerService } from 'src/app/shared/interceptor/spinner.service';

@Component({
  selector: 'app-marc-edit-container',
  templateUrl: './marc-edit-container.component.html'
})
export class MarcEditContainerComponent extends FormCanDeactivate implements OnInit {
  constructor(private router: Router,
              authenticationService: AuthenticationService,
              private route: ActivatedRoute,
              private marcAdapter: MarcAdapter,
              private dialog: MatDialog,
              private containerAdapter: MarcEditContainerAdapterService,
              private spinnerService: SpinnerService,
              private commonService: CommonService) {
    super(router, authenticationService);
    this.marcStates =  this.route.snapshot.data.selectedMarcs;
              }
  editorOffsetHeight: number;
  @ViewChild('marcContainerform') form: NgForm;
  selectedMarcs: MarcContainerState[] = [];
  marcStates: MarcState[] = [];
  currentIndex = 0;
  isZ3950Marc: boolean;
  redirectUri: string;
  // Life-cycle hooks
  ngOnInit(): void {
    this.initialize();
    const marcRecordSourceList: [string, string, string][] = [];
    this.route.params.subscribe(params => {
      if (params.marcParams) {
        const marcParmList: string[] = params.marcParams.split(',');

        if (marcParmList) {
          if (this.isZ3950Marc) {
            const marcRecordList: MarcRecord[] = JSON.parse(localStorage.getItem(Constants.LocalStorage.SELECTEDMARCRECORDS));
            this.editorOffsetHeight = 180;
            sessionStorage.setItem('z3950recordcount', marcRecordList.length.toString());
            marcRecordList.forEach((marc, index) => {
              const marcState = this.marcAdapter.getZ3950Marc(marc.Mrecord);
              this.containerAdapter.initializeState(marc.RecordControlNumber, marc.RecordSource, index, marcState).subscribe(state => {
                this.selectedMarcs = state;
                if (this.selectedMarcs.length === marcRecordList.length) {
                  this.marcAdapter.setState(this.selectedMarcs[0].marcState);
                }
              });
            });
          } else {
            this.editorOffsetHeight = 165;
            marcParmList.forEach((marcParam, indx) => {
              const marcParamSplit = marcParam.split(':');
              const id = marcParamSplit[0] ? marcParamSplit[0] : '';
              const recordControlNumber = marcParamSplit[3] ? marcParamSplit[3] : '';
              const recordSource = marcParamSplit[2] ? marcParamSplit[2] : '';
              marcRecordSourceList.push([id, recordSource, recordControlNumber]);
            });
            this.marcStates.forEach((marcState, index) => {
              const item = marcRecordSourceList.find(x => x[0] === marcState.marc.id);
              this.containerAdapter.initializeState(item[2], item[1], index, marcState).subscribe(state => {
                this.selectedMarcs = state;
                if (this.selectedMarcs.length === this.marcStates.length) {
                  this.marcAdapter.setState(this.selectedMarcs[0].marcState);
                }
              });
            });
          }
        }
      }
    });
    this.spinnerService.onRequestFinished();
  }
  initialize() {
    this.isZ3950Marc = this.commonService.isZ3950ProfileSearch();
    this.containerAdapter.resetState();
  }
  // Container Events
  public onTabClick(marc: MarcContainerState): void {
      const activeMarc = this.selectedMarcs.find(x => x.isActive);
      this.containerAdapter.onTabState(activeMarc, marc).subscribe(state => {
        this.currentIndex = state.findIndex(x => x.isActive);
        this.selectedMarcs = state;

        if (this.selectedMarcs.findIndex(x => x.isDirty) === -1) {
          this.form.form.markAsPristine();
        } else {
          this.form.form.markAsDirty();
        }
      });
  }
  public onClose(marc: MarcContainerState): void {
    if (marc.isDirty) {
      this.closeConfirmation(marc);
    } else {
      this.containerAdapter.onCloseState(marc).subscribe(state => {
        if (state.length === 0) {
          this.router.navigate([this.redirectUri]);
          // this.router.navigate(['/search']);
        } else {
          this.currentIndex = state.findIndex(x => x.isActive);
          this.selectedMarcs = state;
        }
      });
    }
  }
  onMarcEdit(marcState: MarcState) {
    this.containerAdapter.onMarcEditState(marcState).subscribe(state => {
      this.form.form.markAsDirty();
      this.selectedMarcs = state;
    });
  }
  onMarcSave(isSavedtoBTCATMain: boolean) {
    this.spinnerService.spinnerStart();
    const currentMarc = this.selectedMarcs.find(x => x.isActive);
    this.containerAdapter.onMarcSaveState(currentMarc, isSavedtoBTCATMain).subscribe(state => {
      this.selectedMarcs = state;
      this.onClose(currentMarc);
      this.spinnerService.spinnerStop();
    });
  }
  onMarcDelete() {
    this.spinnerService.spinnerStart();
    const currentMarc = this.selectedMarcs.find(x => x.isActive);
    this.containerAdapter.onMarcDeleteState(currentMarc).subscribe(state => {
      this.selectedMarcs = state;
      this.onClose(currentMarc);
      this.spinnerService.spinnerStop();
    });
  }
  onMarcBack(isConfirmed: boolean) {
    if (isConfirmed) {
      this.form.form.markAsPristine();
      this.router.navigate(['/search']);
    }
  }

  private setBibComponentData(state: MarcState, index: number) {
    this.selectedMarcs[index].isActive = true;
    this.selectedMarcs[index].marcState = state;
  }
  closeConfirmation(marc: MarcContainerState) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      height: 'auto',
      disableClose: true,
      data: {
        isCopyErrorMsg: false,
        isCancelConfirm: true,
        message: 'There are unsaved changes. Are you sure you want to close this tab? '
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        marc.isDirty = false;
        this.onClose(marc);
      }
    }, () => {
    });
  }
}


