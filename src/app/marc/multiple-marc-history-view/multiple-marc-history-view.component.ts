import { Component, ViewChild, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Marc, MarcEditorSettings, MarcRecordHistory } from '../shared/marc';
import { MarcService } from '../shared/service/marc-service';
import { MarcRecord } from 'src/app/services/search';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/shared/service/common.service';
import { UtilService } from 'src/app/shared/util.service';
import { Title } from '@angular/platform-browser';
import { SpinnerService } from 'src/app/shared/interceptor/spinner.service';
import { Constants } from 'src/app/constants/constants';
import { BaseComponent } from 'src/app/base.component';
import { AuthenticationService } from 'src/app/security/authentication.service';
declare var $: any;
@Component({
    selector: 'multiple-marc-history-view',
    templateUrl: './multiple-marc-history-view.component.html'
})
export class MultipleMarcHistoryViewComponent extends BaseComponent implements OnInit {
    @Input()
    marcItems : MarcRecordHistory[];

    marcs: MarcRecordHistory[];
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
    marcSettings:any;
    @Output()
    AuthRecordLinkClicked: EventEmitter<string> = new EventEmitter<string>();
    orginalMarcId: any;
    versionNumber: number = 0;
    recordHistoryResponse: any;
    isBTCATMain: boolean;
    constructor( private service: MarcService,
        private spinnerService: SpinnerService,
        private _titleService: Title,
        private router: Router,
        private utilService: UtilService,
        private marcService: MarcService,
        private commonService: CommonService,
        private authenticationService: AuthenticationService) {
            super(router, authenticationService);

            if (localStorage.getItem(Constants.LocalStorage.MARCSETTINGS) != null && localStorage.getItem(Constants.LocalStorage.MARCBIBDATA) != null) {
                this.marcSettings = JSON.parse(localStorage.getItem(Constants.LocalStorage.MARCSETTINGS));
            }
            else {
                this.loadMarcSettings();
            }
    }
    get marcCount(): number {
        return this.marcs.length;
    }

    get showSecondRow(): boolean {
        return (this.marcs.length > 3);
    }

    // load marc setting
    loadMarcSettings() {
        this.service.getMarcSettings().subscribe((item) => {
            if (item && item) {
                this.marcSettings = item.MarcEditorSettings;
                localStorage.setItem(Constants.LocalStorage.MARCSETTINGS, JSON.stringify(this.marcSettings));
                localStorage.setItem(Constants.LocalStorage.DEFAULTENVSETTINGS, JSON.stringify(this.marcSettings));
                if (item.BibMarcData && item.BibMarcData.length > 0) {
                    let marcBibData = item.BibMarcData.sort((a: any, b: any) => a.tag - b.tag);
                    localStorage.setItem(Constants.LocalStorage.MARCBIBDATA, JSON.stringify(marcBibData));
                }
            }
        });
    }

    ngOnChanges(): void {
        this.loadDefaultData();
    }

    ngOnInit(): void { 
        this._titleService.setTitle('BTCAT | Record History Compare');
        this.loadDefaultData();
        this.commonService.currentMessage.subscribe(message => this.isExpandSearchItem = message);
        // this.orginalMarcId = this.marcs[0].id;
        // this.versionNumber = this.marcs[0].versionNumber;
    }

    loadDefaultData() { 
        if(this.marcItems && this.marcItems.length > 0) { 
            this.spinnerService.spinnerStart();
            this.marcService.getMarcRecordHistory(this.marcItems[0].recordNumber).subscribe(item => {
                this.spinnerService.spinnerStop();                
                if (item && item.length > 0) { 
                  var vNumber = item.length;
                this.recordHistoryResponse = item;
                this.orginalMarcId = item[0].orginalMarcId;
                this.versionNumber =  item[0].versionNumber;
                this.isBTCATMain = item[0].isBTCATMain;
                this.marcs = this.recordHistoryResponse;
                this.marcs = this.marcs.filter( x => {
                  return this.marcItems.find(y => y.id == x.id);
                }); 
                this.marcs.forEach(x=> {
                    x.editedDate = this.utilService.getDateinSystemFormat(x.editedDate);
                });
              }
            });
       }

        if (this.marcItems && this.marcItems.length > 0) {
            if (this.marcItems.length == 1) {
                this.colWidthClass = "col-sm-12 multipleBoxes threeCompareViews pr-small";
                this.secondRowColWidthClass = "col-sm-12 multipleBoxes threeCompareViews";
            }
            else if (this.marcItems.length == 3) {
                this.colWidthClass = "col-sm-4 multipleBoxes threeCompareViews pr-small";
                this.secondRowColWidthClass = "col-sm-4 multipleBoxes threeCompareViews";
            }
            else if (this.marcItems.length == 4) {
                this.colWidthClass = "col-6 multipleBoxes fourCompareViews pr-small";
                this.secondRowColWidthClass = "col-6 multipleBoxes fourCompareViews pr-small";
                this.secondRowStartIndex = 2;
            }
            else if (this.marcItems.length > 4 && this.marcItems.length < 6) {
                this.colWidthClass = "col-4 multipleBoxes fiveCompareViews pr-small";
                this.secondRowColWidthClass = "col-6 multipleBoxes fiveCompareViews pr-small";
                this.secondRowStartIndex = 3;
            }
            else if (this.marcItems.length == 6) {
                this.colWidthClass = "col-4 multipleBoxes sixCompareViews pr-small";
                this.secondRowColWidthClass = "col-4 multipleBoxes sixCompareViews pr-small";
                this.secondRowStartIndex = 3;
            }
            else if (this.marcItems.length > 6 && this.marcItems.length < 8) {
                this.colWidthClass = "col-3 multipleBoxes sevenCompareViews pr-small";
                this.secondRowColWidthClass = "col-4 multipleBoxes sevenCompareViews pr-small";
                this.secondRowStartIndex = 4;
            } else if (this.marcItems.length == 8) {
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

    // close marc window
    close(marcId: string) {
        //Navigate back to results on last record close
        if(this.marcs.length==1){
            let marc=this.marcs.find(x=>x.id==marcId);
            this.router.navigate(['/record-history', marc.recordNumber]);
        }
        if (this.marcs && this.marcs.length > 1) {
            //Removes closed record
            let marcIndex = this.marcs.findIndex(x=>x.id==marcId);
            if(marcIndex != -1){
                this.marcs.splice(marcIndex, 1);
            }

            //Reloads remaining records to view
            let param: string = "";
            this.marcs.forEach(remainingMarc => {
              if (param.length > 0) {
                param = param + ",";
              }
              param = param + remainingMarc.id + ":" + remainingMarc.recordNumber;
            });
            this.router.navigate(["/compare-history-view/" + param]);
        }
    }

    isClosedMarcWindow(marcId: string): boolean {
        return this.closedMarcIds.findIndex(m => m == marcId) != -1;
    }
    EditMarcRecord() { 
        if (this.orginalMarcId) {
            this.router.navigate(['/bibliographic-edit/', this.orginalMarcId, 0]);
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

        $('.flex-compare-container').css('height', this.NewHeight - 40);
    }
    // multiple marc view methods -- End



    /* multiple compare screens  */
    ngAfterViewChecked() {

        this.MultipleCompareHeightFunction();

        $(window).resize(function (e) {
            this.MultipleCompareHeightFunction();
        });
    }
    /* multiple compare screens ends here... */

}
