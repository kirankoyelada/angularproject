import { Component, ViewChild, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Marc, MarcEditorSettings } from '../shared/marc';
import { MarcService } from '../shared/service/marc-service';
import { MarcRecord } from 'src/app/services/search';
import { ActivatedRoute, Router } from '@angular/router';
import { PreviousRouteService } from 'src/app/services/previousRouteService';
import { Title } from '@angular/platform-browser';
import { Constants } from 'src/app/constants/constants';
import { BaseComponent } from 'src/app/base.component';
import { AuthenticationService } from 'src/app/security/authentication.service';

@Component({
    selector: 'compare-view',
    templateUrl: './compare-view.component.html'
})
export class CompareViewComponent extends BaseComponent implements OnInit {

    marcParams: string;
    // Multiple marc view
    selectedMarcs: MarcRecord[] = [];
    showMultipleMarcView: boolean = false;
    leftValue: boolean = true;
    rightValue: boolean = false;
    leftRecNum: string;
    rightRecNum: string;
    sourceRecNum: string;
    destinationRecNum: string;
    isAllCustomerSelected:boolean=false;


    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private previousRouteService: PreviousRouteService,
        private _titleService: Title,
        private authenticationService: AuthenticationService
    ) {
        super(router, authenticationService);
    }
    ngOnInit() {

        this._titleService.setTitle("BTCAT | Compare Records");
        this.showMultipleMarcView = false;
        this.selectedMarcs = [];
        var items = JSON.parse(
            localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS)
        );
        if (items != null && items.length > 0) {
            this.isAllCustomerSelected =  items.findIndex(i=> i.isActive && i.profileName==="All Customers") != -1;
        }

        this.route.params.subscribe(params => {

            if (params['marcParams']) {
                this.marcParams = params['marcParams'];
                let marcRecords: MarcRecord[] = [];
                if (this.marcParams) {
                    if (this.isZ3950ProfileSearch()) {
                        marcRecords = JSON.parse(
                            localStorage.getItem(Constants.LocalStorage.SELECTEDMARCRECORDS)
                        );
                        sessionStorage.setItem("z3950recordcount", marcRecords.length.toString());
                    } else {
                        let marcParmList: string[] = this.marcParams.split(',');
                        if (marcParmList && marcParmList.length > 0) {
                            marcParmList.forEach(marcParam => {
                                let marcRecord: MarcRecord = new MarcRecord();
                                let marcParamSplit = marcParam.split(':');
                                marcRecord.Id = marcParamSplit[0];
                                marcRecord.RecordNumber = marcParamSplit[1];
                                marcRecord.RecordSource = marcParamSplit[2];
                                marcRecord.Reason = marcParamSplit[3];
                                marcRecords.push(marcRecord);
                            });
                        }
                    }
                }
                this.showMultipleMarcView = true;
                this.selectedMarcs = marcRecords;
            }
        });

    }

    backToSearchResult() {
        this.router.navigate(['/search']);
    }

    setDefaultDestination() {
        this.leftValue = true;
    }

    isZ3950ProfileSearch() {
        var items = JSON.parse(
            localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS)
        );

        if (items != null && items.length > 0) {
            var filterItems = items.filter(
                x =>
                    x.isActive &&
                    this.defaultCatalogIds.indexOf(x.id) === -1
            );
            if (filterItems.length == 0) {
                return false;
            } else {
                return true;
            }
        }
        else {
            return false;
        }
    }

    setDesinationAndRoute() {
        if (this.leftValue)
            this.marcParams = this.selectedMarcs[1].Id + ":" + this.selectedMarcs[0].Id + ":"+ this.selectedMarcs[1].RecordSource +":"+this.selectedMarcs[0].RecordSource;
        else
            this.marcParams = this.selectedMarcs[0].Id + ":" + this.selectedMarcs[1].Id + ":"+ this.selectedMarcs[0].RecordSource +":"+this.selectedMarcs[1].RecordSource;
        this.router.navigate(["/merge-marc/", this.marcParams]);
    }
}
