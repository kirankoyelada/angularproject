import {
    Component,
    OnInit,
    Input,
    OnChanges,
    ViewChild,
    AfterViewChecked,
    Output,
    EventEmitter,
    ChangeDetectorRef
  } from "@angular/core";
import {
    MarcRecord,
    SearchResponse,
    AuthRecord,
    BasicSearchRequest,
    BasicSearch
  } from "../services/search";
import * as $ from "jquery";
import { Sort, MatSort } from "@angular/material";
import { Constants } from "src/app/constants/constants";
import { areIterablesEqual } from "@angular/core/src/change_detection/change_detection_util";
import { CommonService } from "../shared/service/common.service";
import { Router } from "@angular/router";
import { moveItemInArray } from "@angular/cdk/drag-drop";
import { SearchService } from '../services/search.service';
import { SpinnerService } from '../shared/interceptor/spinner.service';
import { ConfigurationService } from '../services/configuration.service';

declare var $: any;

@Component({
    selector: "app-authority-results",
    templateUrl: "./authority-results.component.html"
  })
  export class AuthorityResultsComponent
    implements OnInit, OnChanges, AfterViewChecked {
    authoritySearchResponse: AuthRecord[];
    isNoRecords : boolean = false;
    orgAuthSearchResponse: AuthRecord[];
    selectedMarcId: string;
    marcItem: any;
    selectedIndex: number;
    table: any;
    authorityId: string;
    sortedData: MarcRecord[] = [];
    onClickStatus: string;
    marcHeader: any;
    lastChecked: any;
    hideSearchItem: boolean;
    isExpandSearchItem: any;
    seriesHeight: any;
    subjectHeight: any;
    publisherHeight: any;
    columnReOrderCount: number = 0;

    @Output()
    AuthorityLinkClicked: EventEmitter<string> = new EventEmitter<string>();
    // Multiple marc view
    selectedMarcs: MarcRecord[] = [];

    // Search Split Issue fix
    CWidowHeight: number;
    CHeaderHeight: number;
    CNavHeight: number;
    HeaderHeight: number;
    NewHeight: number;
    CSearchHeight: number;
    CompareBtn: number;

    selectedAll: boolean = false;
    selectAnyChkBox: boolean = false;
    showTooltip: boolean = false;
    showAuthorityView: boolean = false;
    showSearchResult: boolean = true;
    basicSearchRequest : any;
    hideColumns: Array<number> = [];
    reOrderColumns: Array<number> = [];
    showColumns: Array<number> = [];
    isCustomEvent: boolean = false;
    databaseRecordNumberSearchItem: BasicSearch;
    routerobj : any;
    disablePrev : boolean = false;
    disableNext : boolean = false;

    private defaultSort: Sort = { active: "", direction: "" };
    @ViewChild(MatSort) sort: MatSort;
    columnResizeWidth: number;

    OnAuthorityClicked(id: string): void {
      this.authorityId = id;
      this.showAuthorityView = true;
    }
    GoToMarcDetails() {
      this.authorityId = "";
      this.showAuthorityView = false;
    }
    constructor(
      private cdr: ChangeDetectorRef,
      private commonService: CommonService,
      private router: Router,
      private service: SearchService,
      private spinnerService: SpinnerService,
      private configurationService:ConfigurationService
    ){
      this.routerobj = router;
     }

    ngOnInit() {

      //Read and set the auth search request and load the results
      this.basicSearchRequest = new BasicSearchRequest();
      this.basicSearchRequest = JSON.parse(
        localStorage.getItem(Constants.LocalStorage.AUTHSEARCHREQUEST)
      );

      this.loadSearchResults();
    }

    ngOnChanges() {
      this.selectedIndex = null;
      this.selectedMarcId = null;
      this.marcItem = null;
      if (this.table != null) {
        this.ReInitializeSearchGrid(this.authoritySearchResponse);
      }
    }

    //get selected catalogs
    selectedCatalogs(){
      var selectedProfiles:string[]=[];
      //get availabel profiles
      var items = JSON.parse(
      localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS)
      );
      //get selected profiles
      var filterItems = items.filter(
        x =>
          x.isActive && (x.profileName === "BTCAT Authority Main")
          );
      for (let i = 0; i < filterItems.length; i++) {
        selectedProfiles.push(filterItems[i].profileName);
      }
        return selectedProfiles;
    }

    loadSearchResults() {
      //this.spinnerService.onRequestStarted();
      this.spinnerService.spinnerStart();

      var browseMaxRecords: number;
      browseMaxRecords = this.configurationService.currentConfiguration().browseMaxRecords;
      if(this.selectedCatalogs()){
        this.basicSearchRequest.SearchRequest[0].profiles= this.selectedCatalogs();
      }
      this.service
        .basicAuthSearch(this.basicSearchRequest.SearchRequest)
        .subscribe(validResult => {
          if (
            validResult &&
            validResult.AuthorityRecords &&
            validResult.AuthorityRecords.length > 0
          ) {
            this.orgAuthSearchResponse = validResult.AuthorityRecords;
            var index = validResult.BaseIndex;
            this.authoritySearchResponse = validResult.AuthorityRecords.filter(a => a.SortOrder >= index && a.SortOrder < (index + browseMaxRecords));

            //Disable the prev button based on length
            if (this.authoritySearchResponse && this.authoritySearchResponse.length > 0) {
              if (this.orgAuthSearchResponse[0].SortOrder === this.authoritySearchResponse[0].SortOrder) {
                this.disablePrev = true;
              }
              else {
                this.disablePrev = false;
              }
            }

            //Disable the next button based on the length
            if (this.authoritySearchResponse && this.authoritySearchResponse.length > 0) {
              if (this.orgAuthSearchResponse[this.orgAuthSearchResponse.length - 1].SortOrder === this.authoritySearchResponse[this.authoritySearchResponse.length - 1].SortOrder) {
                this.disableNext = true;
              }
              else {
                this.disableNext = false;
              }
            }
          } else {
            this.authoritySearchResponse = null;
            this.isNoRecords = true;
          }

          //this.spinnerService.onRequestFinished();
          this.spinnerService.spinnerStop();
        });

      this.commonService.currentMessage.subscribe(message => this.isExpandSearchItem = message);
    }

    viewMarcRecordOnEnter(event: any, id: string, item: any) {
      let e = <KeyboardEvent>event;
      if (e.keyCode == 13) {
        this.selectedMarcId = id;
        this.marcItem = item;
      }
    }

    compareMarcRecords() {
      if (this.selectedMarcs && this.selectedMarcs.length > 1) {
        let param: string = "";
        this.selectedMarcs.forEach(selectedMarc => {
          if (param.length > 0) {
            param = param + ",";
          }
          param = param + selectedMarc.Id + ":" + selectedMarc.RecordNumber;
        });
        this.router.navigate(["/compare-view/" + param]);
      }
    }


    EditMarcRecord(id: any) {
      this.selectedMarcId = id;
      if (this.selectedMarcId) {
        this.router.navigate([
          "/bibliographic-edit/",
          this.selectedMarcId,
          this.authoritySearchResponse.length
        ]);
      }
    }

    getToolTip(marcId: string): string {
      if (
        this.selectedMarcs &&
        this.selectedMarcs.length == 8 &&
        this.selectedMarcs.findIndex(m => m.Id == marcId) != -1
      ) {
        return Constants.ToolTip.CHKBOX_MAX_SELECT_WARN;
      } else {
        return Constants.ToolTip.CHKBOX_DEFAULT;
      }
    }

    CustomHeightFunction() {
      this.CWidowHeight = $(window).height();
      this.CHeaderHeight = $("app-header nav").height();
      this.CSearchHeight = $(".search_filter").height();
      this.CNavHeight = $(".mainNavSection").height();
      this.marcHeader = $("header.MARCrecordHeader").height();
      this.HeaderHeight =
        this.CHeaderHeight +
        this.CSearchHeight +
        this.CNavHeight +
        this.marcHeader;
      this.NewHeight = this.CWidowHeight - this.HeaderHeight;
      this.NewHeight = this.NewHeight - 35;
      this.cdr.detectChanges();
      // $('.flex-container').css('height', this.NewHeight-46.4);
    }



    ngAfterViewChecked() {
      /* search split fix function  */
      this.CustomHeightFunction();
      $(window).resize(e => {
        this.CustomHeightFunction();
      });
      if ($.fn.dataTable.isDataTable("#AuthoritySearchResults")) {
        this.table = $("#AuthoritySearchResults").DataTable();
        if (!this.authorityId) {
          this.table.row(':eq(0)').select();
        }
      } else if (this.authoritySearchResponse != null) {
        this.ReInitializeSearchGrid(this.authoritySearchResponse);
      }

      if (this.table) {
        this.table.on('select', (e, dt, type, indexes) => {
          if (type === 'row') {
            var data = this.table.rows(indexes).data();
            this.authorityId = data[0].AuthorityId;
          }
        });

        //On click of the auth rec link
        this.table.on('click', '.bibRecLink', (event) => {

          //Get the rec number and set the DATABASE_RECORD_NUMBER data if it exits in search request othereise add to it
          var recNum =event.currentTarget.attributes["recnum"].nodeValue;

          //this.basicSearchRequest = new BasicSearchRequest();
          var dbRecNum = this.basicSearchRequest.SearchRequest.find(a => a.searchBy == Constants.Search.DATABASE_RECORD_NUMBER);
          if(dbRecNum)
          {
            dbRecNum.type = Constants.SearchType.WORD;
            dbRecNum.term = recNum;
            dbRecNum.facetValue = null;
            dbRecNum.authSearch = true;
          }
          else {
            this.databaseRecordNumberSearchItem = new BasicSearch();
            this.databaseRecordNumberSearchItem.searchBy = Constants.Search.DATABASE_RECORD_NUMBER;
            this.databaseRecordNumberSearchItem.type = Constants.SearchType.WORD;
            this.databaseRecordNumberSearchItem.term = recNum;
            this.databaseRecordNumberSearchItem.facetValue = null;
            this.databaseRecordNumberSearchItem.authSearch = true;
            //this.basicSearchRequest.SearchRequest = [];
            this.basicSearchRequest.SearchRequest.push(this.databaseRecordNumberSearchItem);
          }

          //Set the authSearch to true to identify whether the page redirect from the auth search or not
          this.basicSearchRequest.SearchRequest.forEach(a => {
            a.authSearch = true;
            a.facetValue = null
          });

          //Set the search request to bib search and redirect to search page
          localStorage.setItem(Constants.LocalStorage.CURRENTSEARCH, Constants.LocalStorage.FORMAUTH);
          localStorage.setItem(Constants.LocalStorage.BIBSEARCHREQUEST,JSON.stringify(this.basicSearchRequest));

          this.router.navigate(["/search"]);

          event.stopPropagation();
          event.preventDefault();
          event.stopImmediatePropagation();
        });

      }
    }

    //Intialize datatable with search results
    ReInitializeSearchGrid(result: any) {
      var columns = this.GetAuthorityGridColumns();
      if (this.table != null) {
        $("#AuthoritySearchResults").DataTable().destroy();
      }
      this.table = $("#AuthoritySearchResults").DataTable({
        paging: false,
        searching: false,
        select: {
          className: 'active'
        },
        info: false,
        data: result,
        columns: columns,
        order: [],
        autoWidth: false,
        scrollY: 116,
        scrollX: true,
        //scroller: true,
        scrollCollapse: true,
        deferRender: true,
        "fnRowCallback": function (nRow, aData) {
          var $nRow = $(nRow);
          $nRow.attr("tabindex", 0);
          var tbl = $(this);
          $nRow.on("keydown", function search(e) {
            if (e.keyCode == 13) {
              var rowIndex = this._DT_RowIndex;
              var tab = $("#AuthoritySearchResults").DataTable();
              tab.rows().deselect();
              tab.rows(rowIndex).select();
            }
          });
          return nRow;
        },
      });
    }

    GetAuthorityGridColumns() {
      var columns = [
        {
          "title": "Heading",
          "data": "Display",
          "createdCell": function (td, cellData, rowData, row, col) {
            if(cellData.length > 100){
             $(td).attr('title', cellData);
            }
          },
          "className": "headingTD"
        },
        {
          "title": "Type of Heading",
          "data": "HeadingType"
        },
        {
          "title": "Record Source",
          render: function (data, type, full, meta) {
            return "BTCAT Authority Main";
          }
        },
        {
          "title": "Bib Records",
          render: function (data, type, full, meta) {
            //full.BibRecordCount = 2;
            return full.BibRecordCount > 0 ? '<div><span class="mr-3 bibRecLink" recnum="'+ full.BibRecordNumbers +'">'+ full.BibRecordCount + '</span></div>' : full.BibRecordCount;
          }
        }];
      return columns;
    }

    MovePrevNext(action : string) {
      if (this.authoritySearchResponse) {
        var res: any;
        var browseMaxRecords: number;
        browseMaxRecords = this.configurationService.currentConfiguration().browseMaxRecords;

        this.disablePrev = false;
        this.disableNext = false;
        if (action === "prev") {
          res = this.authoritySearchResponse.sort((a, b) => a.SortOrder - b.SortOrder);
          if (res && res.length > 0 && this.orgAuthSearchResponse && this.orgAuthSearchResponse.length > 0) {
            var index = res[0].SortOrder;
            this.authoritySearchResponse = this.orgAuthSearchResponse.filter(a => a.SortOrder >= (index - browseMaxRecords) && a.SortOrder < index);

            //Disable the prev button based on length
            if (this.authoritySearchResponse && this.authoritySearchResponse.length > 0) {
              if (this.orgAuthSearchResponse[0].SortOrder === this.authoritySearchResponse[0].SortOrder) {
                this.disablePrev = true;
              }
              else {
                this.disablePrev = false;
              }
            }
          }
        }
        else {
          res = this.authoritySearchResponse.sort((a, b) => b.SortOrder - a.SortOrder);
          if (res && res.length > 0 && this.orgAuthSearchResponse && this.orgAuthSearchResponse.length > 0) {
            var index = res[0].SortOrder;
            this.authoritySearchResponse = this.orgAuthSearchResponse.filter(a => a.SortOrder > index && a.SortOrder <= (index + browseMaxRecords));

            //Disable the next button based on the length
            if (this.authoritySearchResponse && this.authoritySearchResponse.length > 0) {
              if (this.orgAuthSearchResponse[this.orgAuthSearchResponse.length - 1].SortOrder === this.authoritySearchResponse[this.authoritySearchResponse.length - 1].SortOrder) {
                this.disableNext = true;
              }
              else {
                this.disableNext = false;
              }
            }
          }
        }

        if (this.authoritySearchResponse != null) {
          this.ReInitializeSearchGrid(this.authoritySearchResponse);
          if (this.table)
            this.table.row(':eq(0)').select();
        }
      }
    }

  }

function compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }
function comparestring(a: string, b: string, isAsc: boolean) {
    return (a.toLowerCase() < b.toLowerCase() ? -1 : 1) * (isAsc ? 1 : -1);
  }
