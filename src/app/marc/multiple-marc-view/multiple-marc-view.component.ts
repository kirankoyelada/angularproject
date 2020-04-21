import { Component, ViewChild, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Marc, MarcEditorSettings } from '../shared/marc';
import { MarcService } from '../shared/service/marc-service';
import { MarcRecord } from 'src/app/services/search';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonService } from 'src/app/shared/service/common.service';
import { Constants } from 'src/app/constants/constants';
import { BaseComponent } from 'src/app/base.component';
import { AuthenticationService } from 'src/app/security/authentication.service';
import { PlatformLocation } from '@angular/common';
import { constants } from 'os';
declare var $: any;
@Component({
    selector: 'multiple-marc-view',
    templateUrl: './multiple-marc-view.component.html'
})
export class MultipleMarcViewComponent extends BaseComponent implements OnInit {
    @Input()
    marcs: MarcRecord[];
    //Permissions
    @Input() hasEditMainRecordPermission: boolean = false;
    @Input() hasEditWorkspaceRecordPermission: boolean = false;

    closedMarcIds: string[] = [];
    colWidthClass: string = "col-6";
    secondRowColWidthClass: string = "col-12";
    secondRowStartIndex: number = -1;
    fullMarcRecordClass: string = "full compareBody";
    fullMarcRecordCollapsedClass: string = "full compareBodyCollapsed";
    halfMarcRecordClass: string = "half compareBody";
    halfMarcRecordCollapsedClass: string = "half halfcompareBodyCollapsed";
    authorityId: string;
    isExpandSearchItem: any;
    missingParameters: string[] = [];
    isAllCustomerSelected:boolean=false;
    @Output()
    AuthRecordLinkClicked: EventEmitter<string> = new EventEmitter<string>();
    marcSettings: MarcEditorSettings;

    constructor(private router: Router,
        private activatedRoute: ActivatedRoute,
        private commonService: CommonService,
        private authenticationService: AuthenticationService, location: PlatformLocation) {

        super(router, authenticationService);
        location.onPopState(() => {

            var z3950SearchOnly = this.isZ3950ProfileSearch();
            if (z3950SearchOnly)
                this.reloadDefaultData();
        });
    }
    get marcCount(): number {
        return this.marcs.length;
    }

    get showSecondRow(): boolean {
        return (this.marcs.length > 3);
    }

    ngOnChanges(): void {

        this.loadDefaultData();
    }

    ngOnInit(): void {
        //this.loadDefaultData();
        this.commonService.currentMessage.subscribe(message => this.isExpandSearchItem = message);
        var items = JSON.parse(
            localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS)
        );
          if (items != null && items.length > 0) {
            this.isAllCustomerSelected =  items.findIndex(i=> i.isActive && i.profileName==="All Customers") != -1;
        }
        this.marcSettings = JSON.parse(localStorage.getItem(Constants.LocalStorage.MARCSETTINGS));
    }

    loadDefaultData() {

        if (this.marcs && this.marcs.length > 0) {
            sessionStorage.setItem("z3950recordcount", this.marcs.length.toString());
            if (this.marcs.length == 3) {
                this.colWidthClass = "col-sm-4 multipleBoxes threeCompareViews pr-small";
                this.secondRowColWidthClass = "col-sm-4 multipleBoxes threeCompareViews";
            }
            else if (this.marcs.length == 4) {
                this.colWidthClass = "col-6 multipleBoxes fourCompareViews pr-small";
                this.secondRowColWidthClass = "col-6 multipleBoxes fourCompareViews pr-small";
                this.secondRowStartIndex = 2;
            }
            else if (this.marcs.length > 4 && this.marcs.length < 6) {
                this.colWidthClass = "col-4 multipleBoxes fiveCompareViews pr-small";
                this.secondRowColWidthClass = "col-6 multipleBoxes fiveCompareViews pr-small";
                this.secondRowStartIndex = 3;
            }
            else if (this.marcs.length == 6) {
                this.colWidthClass = "col-4 multipleBoxes sixCompareViews pr-small";
                this.secondRowColWidthClass = "col-4 multipleBoxes sixCompareViews pr-small";
                this.secondRowStartIndex = 3;
            }
            else if (this.marcs.length > 6 && this.marcs.length < 8) {
                this.colWidthClass = "col-3 multipleBoxes sevenCompareViews pr-small";
                this.secondRowColWidthClass = "col-4 multipleBoxes sevenCompareViews pr-small";
                this.secondRowStartIndex = 4;
            } else if (this.marcs.length == 8) {
                this.colWidthClass = "col-3 multipleBoxes eightCompareViews pr-small";
                this.secondRowColWidthClass = "col-3 multipleBoxes eightCompareViews pr-small";
                this.secondRowStartIndex = 4;
            }
            else {
                this.colWidthClass = "col-6";
                this.secondRowColWidthClass = "col-6";
                this.secondRowStartIndex = 0;
            }
        }
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

    // close marc window
    close(marcId: string) {
        if (this.marcs && this.marcs.length > 1) {
            //Removes closed record
            let marcIndex = this.marcs.findIndex(x => x.Id == marcId);
            if (marcIndex != -1) {
                this.marcs.splice(marcIndex, 1);
            }

            if (this.isZ3950ProfileSearch()) {
                localStorage.setItem(Constants.LocalStorage.SELECTEDMARCRECORDS,
                    JSON.stringify(this.marcs));
            }

            //Reloads remaining records to view
            let param: string = "";
            this.marcs.forEach(remainingMarc => {
                if (param.length > 0) {
                    param = param + ",";
                }
                param = param + remainingMarc.Id + ":" + remainingMarc.RecordNumber + ":" + remainingMarc.RecordSource;
            });
            this.router.navigate(["/compare-view/" + param]);
        }
    }

    isClosedMarcWindow(marcId: string): boolean {
        return this.closedMarcIds.findIndex(m => m == marcId) != -1;
    }
  EditMarcRecord(id: any, marcItem: any) {
    //set record source based on selected marc item
    if (this.marcs) {
      let marc_id = this.marcs.find(x => x.Id === id);
      if (marc_id) {
        this.commonService.setRecordSource(marc_id.RecordSource);
      }
    }
    //end of code
    if (this.isZ3950ProfileSearch()) {
      this.commonService.setZ3950MarcItem(marcItem);
      this.router.navigate([
        "/z3950-edit"
      ]);
    }
    else {
      if (id) {
        this.router.navigate(['/bibliographic-edit/', id, 0]);
      }
    }
  }
    OnAuthorityClicked(id: string): void {
        this.authorityId = id;
        this.AuthRecordLinkClicked.emit(this.authorityId);
    }

    // multiple compare screen
    CWidowHeight: number;
    CHeaderHeight: number;
    CNavHeight: number;
    HeaderHeight: number;
    NewHeight: number;
    CSearchHeight: number;
    CompareBtn: number;
    // multiple compare screen ends here...
    /* search split fix function - var values */
    MultipleCompareHeightFunction() {
        this.CWidowHeight = $(window).height();
        this.CHeaderHeight = $('app-header nav').height();
        this.CSearchHeight = $('app-search-box .search_filter').height();
        this.CNavHeight = $('.mainNavSection').height();
        this.CompareBtn = $('header.tableHeaderCounts').height();
        this.HeaderHeight = this.CHeaderHeight + this.CSearchHeight + this.CNavHeight + this.CompareBtn;
        this.NewHeight = this.CWidowHeight - this.HeaderHeight;

        $('.flex-compare-container').css('height', this.NewHeight - 43);
    }
    // multiple marc view methods -- End

    /* multiple compare screens  */
    ngAfterViewChecked() {

        this.MultipleCompareHeightFunction();

        $(window).resize((e)=> {
            this.MultipleCompareHeightFunction();
        });
    }
    /*z3950Search multiple compare screens... */

    //z3950 displaying data on browser back and forward
    reloadDefaultData() {

        if (window.location.href.split("/").length == 6) {
            let urlParametersPath = window.location.href.split("/")[5];
            let urlParameters = urlParametersPath.split(",");
            this.missingParameters = [];
            let sortMarcs;
            for (var i = 0; i < urlParameters.length; i++) {
                this.missingParameters.push(urlParameters[i].substring(0, 1));

            }


            if (this.marcs.length != this.missingParameters.length) {

                let items = JSON.parse(
                    localStorage.getItem(Constants.LocalStorage.COMPAREMARCRECORDS));
                    this.marcs=[];
                for (var i = 0; i < this.missingParameters.length; i++) {

                        let marcItem = items.filter(
                            x =>
                                x.Id == this.missingParameters[i]

                        );
                        if (marcItem) {

                            this.marcs.push(marcItem[0]);
                           sortMarcs = this.marcs.sort((a: any, b: any) =>
                           (a.Id > b.Id) ? 1 : ((b.Id > a.Id) ? -1 : 0));
                            localStorage.setItem(Constants.LocalStorage.SELECTEDMARCRECORDS, JSON.stringify(sortMarcs));
                       }


                }


            }
        }
    }
    /* multiple compare screens ends here... */
}
