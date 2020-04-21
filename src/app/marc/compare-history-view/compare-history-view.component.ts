import { Component, ViewChild, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Marc, MarcEditorSettings, MarcRecordHistory } from '../shared/marc';
import { ActivatedRoute, Router } from '@angular/router';
import { PreviousRouteService } from 'src/app/services/previousRouteService';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { Constants } from 'src/app/constants/constants';
import { BaseComponent } from 'src/app/base.component';
import { AuthenticationService } from 'src/app/security/authentication.service';

@Component({
    selector: 'compare-history-view',
    templateUrl: './compare-history-view.component.html'
})
export class CompareHistoryViewComponent extends BaseComponent implements OnInit {

    marcParams: string;
    recordNumber : any;
    // Multiple marc view
    selectedMarcs: MarcRecordHistory[] = [];
    showMultipleMarcView: boolean = false;
    // Emitted values
    emittedDestinationMarcVersionNumber: number = 0;
    emittedOtherMarcVersionNumber: number = 0;
    showMerge : boolean = false;

    constructor(
        private _titleService: Title,
        private router: Router,
        private route: ActivatedRoute,
        private previousRouteService: PreviousRouteService,
        private _location: Location,
        private authenticationService: AuthenticationService
    ) {
        super(router, authenticationService);
    }
    ngOnInit() {
        this._titleService.setTitle('BTCAT | Record History Compare');
        this.showMultipleMarcView = false;
        this.selectedMarcs = [];
        this.route.params.subscribe(params => {
            // get marcParams from param
            if (params['marcParams']) {
                this.marcParams = params['marcParams'];
                let marcRecords: MarcRecordHistory[] =[];
                if(this.marcParams){
                    let marcParmList: string[] = this.marcParams.split(',');
                    if(marcParmList && marcParmList.length>0){
                        marcParmList.forEach(marcParam=>{
                            let marcRecord: MarcRecordHistory = new MarcRecordHistory();
                            let marcParamSpit =  marcParam.split(':');
                            marcRecord.recordNumber = parseFloat(marcParamSpit[1]);
                            this.recordNumber = parseFloat(marcParamSpit[1]);
                            marcRecord.id = marcParamSpit[0];
                            marcRecord.recordSource = marcParamSpit[2];
                            marcRecords.push(marcRecord);
                        });
                    }
                }
                this.showMultipleMarcView = true;
                this.selectedMarcs = marcRecords;
            }
        });
    }

    mergeRecordHistoryMarc() {
        if (this.emittedDestinationMarcVersionNumber > this.emittedOtherMarcVersionNumber){
            this.marcParams = this.selectedMarcs[0].id + ':' + this.selectedMarcs[0].recordSource + ":" + this.selectedMarcs[1].id+ ':' + this.selectedMarcs[1].recordSource;
            this.router.navigate(["/merge-record-history-marc/", this.marcParams]);
        } else {
          this.marcParams = this.selectedMarcs[1].id + ':' + this.selectedMarcs[1].recordSource + ":" + this.selectedMarcs[0].id+ ':' + this.selectedMarcs[0].recordSource;
            this.router.navigate(["/merge-record-history-marc/", this.marcParams]);
        }
    }

    showMergeButton(event: any) {
        if (event && event != '') {
            let data: any[] = event.split(':');
            if (data && data.length > 0) {
                this.emittedDestinationMarcVersionNumber = Number(data[0]);
                this.emittedOtherMarcVersionNumber = Number(data[1]);
                this.showMerge = true;
            }
            else
                this.showMerge = false;
        }
        else
            this.showMerge = false;
    }

    backToSearchResult(){
        this.router.navigate(['/record-history', this.recordNumber]);
      //this._location.back();
    }
}
