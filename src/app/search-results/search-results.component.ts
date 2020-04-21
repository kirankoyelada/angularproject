import {
  Component,
  OnInit,
  Input,
  OnChanges,
  ViewChild,
  AfterViewChecked,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  Renderer,
  HostListener
} from "@angular/core";
import {
  MarcRecord,
  SearchResponse,
  Facets,
  FacetsResults,
  FacetAttributes,
  Z3950SearchRequest,
  FilterZ3950Params
} from "../services/search";
import * as $ from "jquery";
import { Sort, MatSort, MatDialog } from "@angular/material";
import { Constants } from "src/app/constants/constants";
import { areIterablesEqual } from "@angular/core/src/change_detection/change_detection_util";
import { CommonService } from "../shared/service/common.service";
import { PrintService } from "../shared/service/print.service";
import { Router, ActivatedRoute } from "@angular/router";
import { Columns } from "./search-results-columns/Columns";
import { AddMoreColumnsService } from "./search-results-columns/search-results-columns.service";
import { moveItemInArray } from "@angular/cdk/drag-drop";
import { PreviousRouteService } from "../services/previousRouteService";
import { ConfirmationDialogComponent } from '../components/shared/confirmation-dialog/confirmation-dialog.component';
import { NgForm } from '@angular/forms';
import { MarcService } from '../marc/shared/service/marc-service';
import { UserDetail } from '../login/login';
import { BaseComponent } from '../base.component';
import { AuthenticationService } from '../security/authentication.service';
import { Permissions } from 'src/app/security/permissions';
import { SpinnerService } from 'src/app/shared/interceptor/spinner.service';
import { MarcField, MarcSubField, MarcEditorSettings } from '../marc/shared/marc';
import { SearchService } from '../services/search.service';
import { ConfigurationService } from '../services/configuration.service';
import { formGroupNameProvider } from '@angular/forms/src/directives/reactive_directives/form_group_name';
import { finalize, map } from 'rxjs/operators';

declare var $: any;

@Component({
  selector: "app-search-results",
  templateUrl: "./search-results.component.html",
  styleUrls: ["./search-results.component.css"]
})
export class SearchResultsComponent extends BaseComponent
  implements OnInit, OnChanges, AfterViewChecked {
  @Input() basicSearchResponse: MarcRecord[];
  @Input() facetResponse: FacetsResults;
  @Output()
  showSpinner = new EventEmitter<boolean>();
  selectedMarcId: string;
  selectedRecordNumber: any;
  selectedRecordReason: any;
  selectedMarcRecordSource: any;
  marcItem: any;
  selectedIndex: number;
  table: any;
  authorityId: string;
  sortedData: MarcRecord[] = [];
  onClickStatus: string;
  hideFacets: boolean = false;
  z3950SearchRequest: Z3950SearchRequest;
  pageIndex: number = 0;
  z3950Profiles: FilterZ3950Params[] = [];
  allSearchResults: MarcRecord[];

  marcHeader: any;
  lastChecked: any;
  lastSelectedCheckboxIndex: number;
  hideSearchItem: boolean;

  isExpandSearchItem: any;
  boldPubDate: any = [];
  boldFormat: any = [];
  boldSubject: any = [];
  boldAuthor: any = [];
  boldSeries: any = [];
  boldEncodingLevel: any = [];
  boldRecordSource: any = [];
  boldLanguage: any = [];
  boldAudience: any = [];
  boldPublisher: any = [];
  seriesHeight: any;
  subjectHeight: any;
  publisherHeight: any;
  FHeight: any;
  columnReOrderCount: number = 0;
  isZ3950Profile: boolean = false;
  disableViewMore: boolean = false;
  isAllCustomerSelected: boolean = false;
  isCLSCustomerSelected: boolean = false;
  isDeletedDbSelected: boolean = false;
  // @Output() emitFacetValue = new EventEmitter<{ value: string, facetType: string }>();
  @Output() emitFacetValue = new EventEmitter<any>();

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
  selectedFacetValue = [];
  showSearchResult: boolean = true;

  endPubDate: number = 3;
  endFormat: number = 3;
  endSubject: number = 3;
  endAuthor: number = 3;
  endSeries: number = 3;
  endEncodingLevel: number = 3;
  endRecordSource: number = 3;
  endLanguage: number = 3;
  endAudience: number = 3;
  endPublisher: number = 3;
  tableColumns: Columns[];
  finalColumns: Columns[];
  showLessSubject: boolean = true;
  showMoreSubject: boolean = false;
  showLessAuthor: boolean = true;
  showMoreAuthor: boolean = false;
  hideColumns: Array<number> = [];
  reOrderColumns: Array<number> = [];
  showColumns: Array<number> = [];
  isCustomEvent: boolean = false;
  selecedProfiles: number = 0;
  showAddColumnsModal: boolean;
  inBoundHostAddress: string;
  feedSources: string;

  AddColumnRecordSourceObject = {
    id: "AddColumnRecordSource",
    index: 5,
    displayName: "Record Source",
    isChecked: true,
    isReadOnly: false,
    width: 140
  };

  AddColumnDeletedReasonObject =
    {
      id: "AddColumnDeletedReason",
      index: 5,
      displayName: "Deleted Reason",
      isChecked: true,
      isReadOnly: false,
      width: 140
    };

  columnData: Columns[] = [
    {
      id: "AddColumnTitle",
      index: 1,
      displayName: "Title",
      isChecked: true,
      isReadOnly: true,
      width: 400
    },
    {
      id: "AddColumnAuthor",
      index: 2,
      displayName: "Author",
      isChecked: true,
      isReadOnly: false,
      width: 300
    },
    {
      id: "AddColumnPubDate",
      index: 3,
      displayName: "Pub Date",
      isChecked: true,
      isReadOnly: false,
      width: 70
    },
    {
      id: "AddColumnRecordNumber",
      index: 4,
      displayName: "Record Number",
      isChecked: true,
      isReadOnly: false,
      width: 120
    },
    {
      id: "AddColumnRecordControlNumber",
      index: 6,
      displayName: "Control Number",
      isChecked: false,
      isReadOnly: false,
      width: 130
    },
    {
      id: "AddColumnISBN",
      index: 7,
      displayName: "ISBN/UPC",
      isChecked: false,
      isReadOnly: false,
      width: 185
    },
    {
      id: "AddColumnCallNumber",
      index: 8,
      displayName: "LC Classification",
      isChecked: false,
      isReadOnly: false,
      width: 150
    },
    {
      id: "AddColumnDeweyAbridged",
      index: 9,
      displayName: "Dewey Abridged",
      isChecked: false,
      isReadOnly: false,
      width: 130
    },
    {
      id: "AddColumnDeweyUnabridged",
      index: 10,
      displayName: "Dewey Unabridged",
      isChecked: false,
      isReadOnly: false,
      width: 140
    },
    {
      id: "AddColumnANSCR",
      index: 11,
      displayName: "ANSCR",
      isChecked: false,
      isReadOnly: false,
      width: 110
    },
    {
      id: "AddColumnISSN",
      index: 12,
      displayName: "ISSN",
      isChecked: false,
      isReadOnly: false,
      width: 75
    },
    {
      id: "AddColumnFormat",
      index: 13,
      displayName: "Format",
      isChecked: false,
      isReadOnly: false,
      width: 60
    },
    {
      id: "AddColumnEncodingLevel",
      index: 14,
      displayName: "Encoding Level",
      isChecked: false,
      isReadOnly: false,
      width: 110
    }
  ];

  private defaultSort: Sort = { active: "", direction: "" };
  @ViewChild(MatSort) sort: MatSort;
  columnResizeWidth: number;
  authorHeight: any;
  start: any;
  pressed: boolean;
  startX: any;
  startWidth: any;
  checkboxesChecked: any;

  http: any;

  //Print MARC
  lineSpaceSelection: string = "2";
  marcSettings: MarcEditorSettings;

  /*onClick(event) {
    // Function.prototype.call = function() {
    // return event;
    // }
    setTimeout(function(){
    //if (!this._eref.nativeElement.contains(event.target)) // or some similar check
    //this.showAddColumnsModal = false;
    if (event.srcElement.id != "columnsReOrderModal") // or some similar check
    this.showAddColumnsModal = true;
    },3000);
    }
*/
  OnAuthorityClicked(id: string): void {
    this.authorityId = id;
    this.showAuthorityView = true;
  }
  GoToMarcDetails() {
    this.authorityId = "";
    this.showAuthorityView = false;
  }
  constructor(
    private searchService: SearchService,
    private cdr: ChangeDetectorRef,
    private service: MarcService,
    private commonService: CommonService,
    private printService: PrintService,
    private dialog: MatDialog,
    private router: Router,
    private addColumnsService: AddMoreColumnsService,
    private route: ActivatedRoute,
    private previousRouteService: PreviousRouteService,
    private renderer: Renderer,
    private authenticationService: AuthenticationService,
    private spinnerService: SpinnerService,
    private configurationService: ConfigurationService
  ) {
    super(router, authenticationService);
    this.inBoundHostAddress = configurationService.currentConfiguration().inBoundHostAddress;
    this.feedSources = configurationService.currentConfiguration().feedSources;
  }

  @HostListener('window:keyup', ['$event'])

  keyEvent(event: KeyboardEvent) {
    var isSafari = /Apple Computer/.test(window.navigator.vendor);
    if (isSafari) {
      //Print selected MARC record on Key 'Control+P' press
      if (event.ctrlKey && event.keyCode === 80 && !this.spinnerService._loading && !$('#printInfoView').is(':visible')) { //'P' key value is 80
        this.lineSpaceSelection = "2";
        document.getElementById("btnPrintView").click();
      }
    }
    else {
      //Print selected MARC record on Key 'Alt+P' press
      if (event.altKey && event.keyCode === 80 && !this.spinnerService._loading && !$('#printInfoView').is(':visible')) { //'P' key value is 80
        this.lineSpaceSelection = "2";
        document.getElementById("btnPrintView").click();
      }
    }
  }

  openPrintPopup() {
    this.lineSpaceSelection = "2";
  }

  startSpinner(showflag: boolean) {
    this.showSpinner.emit(showflag);
  }

  AddOrRemoveColumns() {
    this.showAddColumnsModal = true;
    var $chkboxes = $(".chkbox");
    this.checkboxesChecked = this.getCheckedData($chkboxes);
    // var data = localStorage.getItem(Constants.LocalStorage.ADDMORECOLUMNS);
    // this.tableColumns = JSON.parse(data);
  }

  AddDeletedDBOrRecordSource() {
    var saveCatalogs = JSON.parse(localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS));

    for (var i = this.columnData.length - 1; i >= 0; i--) {
      if (this.columnData[i].id === this.AddColumnRecordSourceObject.id || this.columnData[i].id === this.AddColumnDeletedReasonObject.id) {
        this.columnData.splice(i, 1);
      }
    }

    if (saveCatalogs.filter(element => element.profileName == Constants.DELETEDDBPROFILENAME && element.isActive).length === 1) {
      this.columnData.splice(4, 0, this.AddColumnDeletedReasonObject);
    } else {
      this.columnData.splice(4, 0, this.AddColumnRecordSourceObject);
    }

    const localStorageIsChecked = JSON.parse(localStorage.getItem(Constants.LocalStorage.ADDMORECOLUMNS));
    if (localStorageIsChecked && localStorageIsChecked.length > 0) {
      this.columnData.forEach(column => {
        localStorageIsChecked.forEach(localItem => {
          if (localItem.id == column.id) {
            column.isChecked = localItem.isChecked;
          }
        });
      });
    }

    this.tableColumns = this.columnData;
    localStorage.setItem(Constants.LocalStorage.ADDMORECOLUMNS, JSON.stringify(this.tableColumns));
  }


  GridColumnsAdded(columns: Columns[]) {
    this.isCustomEvent = true;
    this.tableColumns = columns;
    this.hideColumns = [];
    this.reOrderColumns = [];
    this.showColumns = [];
    this.hideColumns.push();
    this.reOrderColumns.push(0);
    this.showColumns.push(0);
    for (var i = 0; i < columns.length; i++) {
      if (columns[i].isChecked) {
        this.showColumns.push(columns[i].index);
      } else {
        this.hideColumns.push(columns[i].index);
      }
      this.reOrderColumns.push(columns[i].index);
    }
    this.hideColumns.push(15);
    this.reOrderColumns.push(15);

    let colsHide = this.hideColumns;
    let orderCols = this.reOrderColumns;
    let colsShow = this.showColumns;

    $.fn.dataTable.ColReorder(this.table).fnReset();
    this.table.columns(colsShow).visible(true);
    this.table.columns(colsHide).visible(false, false);
    //Issue-2538
    var data = localStorage.getItem(
      Constants.LocalStorage.DATATABLESSEARCHGRID
    );
    let datatableInfo = JSON.parse(data);
    datatableInfo.ColReorder = orderCols;
    localStorage.setItem(
      Constants.LocalStorage.DATATABLESSEARCHGRID,
      JSON.stringify(datatableInfo)
    );

    $.fn.dataTable.ColReorder(this.table).fnOrder(orderCols);
    this.table.columns.adjust().draw(false);

    this.afterResizeorShowHideColumns();
    var tWidthValue =
      $(".dataTables_scrollBody")
        .find("table")
        .find("thead")
        .find("tr")
        .find(".titleTD")
        .width() > this.getColumnWidth("Title")
        ? $(".dataTables_scrollBody")
          .find("table")
          .find("thead")
          .find("tr")
          .find(".titleTD")
          .width()
        : this.getColumnWidth("Title");

    $(".dataTables_scrollHead")
      .find("table")
      .find("thead")
      .find("tr")
      .find(".titleTD")
      .css("width", tWidthValue);
    $(".dataTables_scrollHead")
      .find("table")
      .find("thead")
      .find("tr")
      .find(".titleTD")
      .css("max-width", tWidthValue);
    $(".dataTables_scrollBody")
      .find("table")
      .find("thead")
      .find("tr")
      .find(".titleTD")
      .css("width", tWidthValue);
    $(".dataTables_scrollBody")
      .find("table")
      .find("thead")
      .find("tr")
      .find(".titleTD")
      .css("max-width", tWidthValue);

    this.table.columns.adjust().draw(false);

    this.isCustomEvent = false;
    this.setCheckboxSelection();
    $('.ui-column-resizer').on('mousedown', (event) => {
      this.onMouseDown(event);
    });
  }

  ViewMoreZ3950Results() {
    this.spinnerService.spinnerStart();
    this.z3950SearchRequest = JSON.parse(
      localStorage.getItem(Constants.LocalStorage.SEARCHZ3950REQUEST)
    );
    this.z3950SearchRequest.PageSize = 5;
    this.pageIndex = this.pageIndex + 1;
    this.z3950SearchRequest.PageIndex = this.pageIndex;
    this.searchService.getAllZ3950SearchResultWithIndex(this.z3950SearchRequest, this.z3950SearchRequest.PageIndex).subscribe(validResults => {
      this.facetResponse = null;
      if (
        validResults && validResults.length > 0) {
        (validResults).forEach(validResult => {
          if (validResult && validResult.MarcRecords && validResult.MarcRecords.length > 0) {
            Array.prototype.push.apply(this.allSearchResults, validResult.MarcRecords);
          }
        });
      }
      this.z3950Profiles.forEach(profile => {
        if (this.allSearchResults != null && this.allSearchResults.length > 0) {
          const prof = this.allSearchResults.find(x => x.RecordSource === profile.profileName);
          const matchedRecords = this.allSearchResults.filter(x => x.RecordSource === profile.profileName).length;
          profile.totalRecords = prof != null && prof != undefined ? prof.TotalRecords : 0;
          profile.matchedRecords = matchedRecords != null && matchedRecords != undefined ? matchedRecords : 0;
        }
        else {
          profile.totalRecords = 0;
          profile.matchedRecords = 0;
        }
      });
      let i = 1;
      this.allSearchResults.forEach(x => {
        x.Id = i.toString();
        x.Mrecord.Id = i.toString();
        i = i + 1;
      });
      this.filterResultsBasedOnProfile();
    });
  }

  afterResizeorShowHideColumns() {
    if (this.showColumns.length <= 6) {
      //after resize save the updated width value in to the array and update the local storage
      var data = localStorage.getItem(Constants.LocalStorage.ADDMORECOLUMNS);
      this.tableColumns = JSON.parse(data);
      for (let i = this.showColumns.length - 1; i >= 0; i--) {
        let widthValue;

        if (this.showColumns[i] == 1) {
          widthValue = this.getColumnWidth("Title");
          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".titleTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".titleTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });
        } else if (this.showColumns[i] == 2) {
          widthValue = this.getColumnWidth("Author");

          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".authorTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".authorTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });
        } else if (this.showColumns[i] == 3) {
          widthValue = this.getColumnWidth("Pub Date");

          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".pubdateTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".pubdateTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });
        } else if (this.showColumns[i] == 4) {
          widthValue = this.getColumnWidth("Record Number");
          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".recordnumberTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".recordnumberTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });
        } else if (this.showColumns[i] == 5) {
          widthValue = this.getColumnWidth("Record Source");

          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".recordsourceTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".recordsourceTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });
        } else if (this.showColumns[i] == 6) {
          widthValue = this.getColumnWidth("Control Number");

          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".controlnumberTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".controlnumberTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });
        } else if (this.showColumns[i] == 7) {
          widthValue = this.getColumnWidth("ISBN/UPC");

          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".isbnupcTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".isbnupcTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });
        } else if (this.showColumns[i] == 8) {
          widthValue = this.getColumnWidth("LC Classification");

          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".lclassificationTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".lclassificationTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });
        } else if (this.showColumns[i] == 9) {
          widthValue = this.getColumnWidth("Dewey Abridged");

          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".deweyabridgedTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".deweyabridgedTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });
        } else if (this.showColumns[i] == 10) {

          widthValue = this.getColumnWidth("Dewey Unabridged");

          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".deweyunbridgedTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".deweyunbridgedTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });
        } else if (this.showColumns[i] == 11) {
          widthValue = this.getColumnWidth("ANSCR");

          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".anscrTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".anscrTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });
        } else if (this.showColumns[i] == 12) {
          widthValue = this.getColumnWidth("ISSN");

          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".issnTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".issnTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });
        } else if (this.showColumns[i] == 13) {
          widthValue = this.getColumnWidth("Format");

          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".formatTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".formatTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });
        } else if (this.showColumns[i] == 14) {
          widthValue = this.getColumnWidth("Encoding Level");
          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".encodinglevelTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".encodinglevelTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });
        }

        this.tableColumns.forEach(x => {
          if (parseInt(x.id) == this.showColumns[i]) {
            x.width = widthValue;
          }
        });
      }

      localStorage.setItem(
        Constants.LocalStorage.ADDMORECOLUMNS,
        JSON.stringify(this.tableColumns)
      );

      this.table.columns.adjust().draw(false);
    }
  }
  // Column resize event
  onMouseDown(event) {
    this.table.colReorder.disable();
    this.table.columns.adjust().draw(false);
    this.start = event.target;
    this.pressed = true;
    this.startX = event.clientX;
    this.startWidth = $(this.start)
      .parent()
      .width();
    this.initResizableColumns();
  }

  initResizableColumns() {
    this.renderer.listenGlobal("body", "mousemove", event => {
      if (this.pressed) {


        let width = this.startWidth + (event.x - this.startX);
        width = width > 100 ? width : width < 100 && width >= 75 ? width : 100;
        $(this.start)
          .parent()
          .css({ "min-width": width, "max-width": width, width: width });
        let index =
          $(this.start)
            .parent()
            .index() + 1;

        $(".dataTables_scrollHead tr th:nth-child(" + index + ")").css({
          "min-width": width,
          "max-width": width,
          width: width
        });
        $(".dataTables_scrollBody tr th:nth-child(" + index + ")").css({
          "min-width": width,
          "max-width": width,
          width: width
        });
        $(".dataTables_scrollBody tr td:nth-child(" + index + ")").css({
          "min-width": width,
          "max-width": width,
          width: width
        });

        var displayName = $(this.start).parent()[0].innerText;
        //after resize save the updated width value in to the array and update the local storage
        var data = localStorage.getItem(Constants.LocalStorage.ADDMORECOLUMNS);
        this.tableColumns = JSON.parse(data);
        this.tableColumns.forEach(x => {
          if (x.displayName.trim() == displayName.trim()) {
            x.width = width;
          }
        });

        //Fix for only 6 columns resize adjuestments
        if ($(".dataTables_scrollHead tr th").length < 7 && $(".dataTables_scrollHead tr").width() <= 1200) {
          for (var i = index; i < $(".dataTables_scrollHead tr th").length; i++) {

            var rWidth = $(".dataTables_scrollHead tr th:nth-child(" + i + ")").css('width');

            $(".dataTables_scrollHead tr th:nth-child(" + i + ")").css({
              "min-width": rWidth,
              "max-width": rWidth,
              width: rWidth
            });
            $(".dataTables_scrollBody tr th:nth-child(" + i + ")").css({
              "min-width": rWidth,
              "max-width": rWidth,
              width: rWidth
            });
            $(".dataTables_scrollBody tr td:nth-child(" + i + ")").css({
              "min-width": rWidth,
              "max-width": rWidth,
              width: rWidth
            });
            var cdisplayName = $(".dataTables_scrollHead tr th:nth-child(" + i + ")").children()[1].innerText;
            this.tableColumns.forEach(x => {
              if (x.displayName == cdisplayName) {
                x.width = rWidth;
              }
            });

          }

        }

        localStorage.setItem(
          Constants.LocalStorage.ADDMORECOLUMNS,
          JSON.stringify(this.tableColumns)
        );
      }
    });
    this.renderer.listenGlobal("body", "mouseup", event => {
      if (this.pressed) {
        this.pressed = false;
        this.table.colReorder.enable();

        //Set title to the columns
        //this.setTitle();

        this.table.columns.adjust().draw(false);
      }
    });
  }

  //End column resize event

  ngOnInit() {
    this.AddDeletedDBOrRecordSource();
    var defaultCatalogs = JSON.parse(localStorage.getItem(Constants.LocalStorage.DEFAULTCATALOGS))
    var items = JSON.parse(
      localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS)
    );
    this.marcSettings = JSON.parse(localStorage.getItem(Constants.LocalStorage.MARCSETTINGS));
    this.z3950SearchRequest = JSON.parse(
      localStorage.getItem(Constants.LocalStorage.SEARCHZ3950REQUEST)
    );

    if (items != null && items.length > 0) {
      var filterItems = items.filter(
        x =>
          x.isActive && defaultCatalogs.findIndex(c => c.id == x.id) === -1
      );
      if (filterItems.length == 0) {
        this.isZ3950Profile = false;
      } else {
        this.isZ3950Profile = true;
      }
    }
    if (items != null && items.length > 0) {
      this.isAllCustomerSelected = items.findIndex(i => i.isActive && i.profileName === "All Customers") != -1;
      this.isCLSCustomerSelected = items.findIndex(i => i.isActive && i.profileName === "CLS Customer") != -1;
      this.isDeletedDbSelected = items.findIndex(i => i.isActive && i.profileName === Constants.DELETEDDBPROFILENAME) != -1;
    }
    this.sortData(this.defaultSort);
    if (this.basicSearchResponse != null) {
      this.allSearchResults = [...this.basicSearchResponse];
    }
    if (this.z3950SearchRequest != null && this.z3950SearchRequest.Profiles.length > 0) {
      this.z3950SearchRequest.Profiles.forEach(profile => {
        let filterParam = new FilterZ3950Params;

        if (this.allSearchResults != null && this.allSearchResults.length > 0) {
          var prof;
          if (profile.hostAddress === this.inBoundHostAddress) {
            var sources: string[] = this.feedSources.split(',');
            sources.forEach(element => {
              let filterParam = new FilterZ3950Params;
              filterParam.profileName = element;
              filterParam.displayProfileName = profile.profileName + " : " + element;
              filterParam.hostAddress = profile.hostAddress;
              filterParam.isChecked = true;
              const matchedRecords = this.allSearchResults.filter(x => x.RecordSource === element).length;
              filterParam.matchedRecords = matchedRecords != null && matchedRecords != undefined ? matchedRecords : 0;
              prof = this.allSearchResults.find(x => x.RecordSource === element);
              filterParam.totalRecords = prof != null && prof != undefined ? prof.TotalRecords : 0;
              if (this.z3950Profiles && this.z3950Profiles.length > 0) {
                if (this.z3950Profiles.filter(x => x.profileName === element).length === 0) {
                  this.z3950Profiles.push(filterParam);
                }
              }
              else {
                this.z3950Profiles.push(filterParam);
              }
            });
          }
          else {
            filterParam.profileName = profile.profileName;
            filterParam.displayProfileName = profile.profileName;
            filterParam.hostAddress = profile.hostAddress;
            filterParam.isChecked = true;
            prof = this.allSearchResults.find(x => x.RecordSource === profile.profileName);
            const matchedRecords = this.allSearchResults.filter(x => x.RecordSource === profile.profileName).length;
            filterParam.matchedRecords = matchedRecords != null && matchedRecords != undefined ? matchedRecords : 0;
            filterParam.totalRecords = prof != null && prof != undefined ? prof.TotalRecords : 0;

            if (this.z3950Profiles && this.z3950Profiles.length > 0) {
              if (this.z3950Profiles.filter(x => x.profileName === profile.profileName).length === 0) {
                this.z3950Profiles.push(filterParam);
              }
            }
            else {
              this.z3950Profiles.push(filterParam);
            }
          }
        }
        else {
          filterParam.totalRecords = 0;
          filterParam.matchedRecords = 0;
        }
      });

      let checkedProfiles = this.z3950Profiles.filter(x => x.isChecked === true);
      this.selecedProfiles = checkedProfiles.length;
      var profileCount: number = 0;
      checkedProfiles.forEach(profile => {
        if (this.allSearchResults != null && this.allSearchResults.length > 0) {
          const results = this.allSearchResults.filter(x => x.RecordSource === profile.profileName);
          if (results.length === profile.totalRecords) {
            profileCount++;
          }
        }
      });
      if (profileCount === checkedProfiles.length) {
        this.disableViewMore = true;
      }
      else {
        this.disableViewMore = false;
      }
    }
    this.selectedFacetValue = this.commonService.getSelectedFacetValues();
    this.commonService.currentMessage.subscribe(
      message => (this.isExpandSearchItem = message)
    );

    if (
      localStorage.getItem(Constants.LocalStorage.ADDMORECOLUMNS) == null ||
      localStorage.getItem(Constants.LocalStorage.ADDMORECOLUMNS) === ""
    ) {
      this.tableColumns = this.columnData;
      localStorage.setItem(
        Constants.LocalStorage.ADDMORECOLUMNS,
        JSON.stringify(this.tableColumns)
      );
      // });
    } else {
      var data = localStorage.getItem(Constants.LocalStorage.ADDMORECOLUMNS);
      this.tableColumns = JSON.parse(data);
    }
    this.hideColumns = [];
    this.reOrderColumns = [];
    this.showColumns = [];
    this.hideColumns.push();
    this.reOrderColumns.push(0);
    this.showColumns.push(0);
    for (var i = 0; i < this.tableColumns.length; i++) {
      if (this.tableColumns[i].isChecked) {
        this.showColumns.push(this.tableColumns[i].index);
      } else {
        this.hideColumns.push(this.tableColumns[i].index);
      }
      this.reOrderColumns.push(this.tableColumns[i].index);
    }
    this.hideColumns.push(15);
    this.reOrderColumns.push(15);

    this.makeSelectedFacetToBoldText();
    if (this.facetResponse) {
      this.showTenRecordsOnSubject(this.facetResponse.Subject);
      this.showTenRecordsOnSeries(this.facetResponse.Series);
      this.showTenRecordsOnPublisher(this.facetResponse.Publisher);
      this.showTenRecordsOnAuthorHeight(this.facetResponse.Author);
    }

    //getting previous state as row selected
    this.route.params.subscribe(params => {

      if (params.marcId) {
        this.selectedMarcId = params.marcId;

      } else {

        if (this.sortedData && this.sortedData.length > 0) {
          this.selectedMarcId = this.sortedData[0].Id;
          this.selectedRecordNumber = this.sortedData[0].RecordNumber;
          this.selectedRecordReason = this.sortedData[0].Reason;
          this.selectedMarcRecordSource = this.sortedData[0].RecordSource;
        }
      }
    });

    if (this.isZ3950Profile) {
      let z3950SearchRequest = JSON.parse(
        localStorage.getItem(Constants.LocalStorage.SEARCHZ3950REQUEST)
      );
      if (z3950SearchRequest &&
        z3950SearchRequest.SearchRequest[0].facetValue == null &&
        !z3950SearchRequest.SearchRequest[0].authSearch &&
        this.sortedData &&
        this.sortedData.length == 1 &&
        this.sortedData[0].Id &&
        this.sortedData[0].Id != null) {
        sessionStorage.setItem("z3950recordcount", this.sortedData.length.toString());
        this.commonService.setRecordSource(this.sortedData[0].RecordSource);
        this.commonService.setZ3950MarcItem(this.sortedData[0].Mrecord);
        this.router.navigate([
          "/z3950-edit"
        ]);
      }
    }
  }

  ngOnChanges() {
    this.selectedIndex = null;
    this.selectedMarcId = null;
    this.selectedRecordNumber = null;
    this.selectedMarcRecordSource = null;
    this.selectedRecordReason = null;
    this.marcItem = null;
  }

  getColumnWidth(columnName: any) {
    this.AddDeletedDBOrRecordSource();
    if (this.tableColumns != null && this.tableColumns != undefined) {

      var saveCatalogs = JSON.parse(localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS));
      if ((saveCatalogs.filter(element => element.profileName == Constants.DELETEDDBPROFILENAME && element.isActive).length === 1
        && columnName != "Record Source") || (saveCatalogs.filter(element => element.profileName == Constants.DELETEDDBPROFILENAME && element.isActive).length === 0
          && columnName != "Deleted Reason")) {
        return this.tableColumns.find(x => x.displayName === columnName).width;
      } else {
        return 0;
      }
    }
  }

  viewMarcRecordOnEnter(event: any, id: string, recordNumber: any, recordSource: string, recordreason: string, item: any) {
    let e = <KeyboardEvent>event;
    if (e.keyCode == 13) {
      this.selectedMarcId = id;
      this.selectedRecordNumber = recordNumber;
      this.selectedMarcRecordSource = recordSource;
      this.selectedRecordReason = recordreason;
      this.marcItem = item;
    }
  }

  viewFacetsOnEnter(event: any, value: string, facetType: string) {
    let e = <KeyboardEvent>event;
    if (e.keyCode == 13) {
      this.getFacetValue(value, facetType);
    }
  }

  sortData(sort: Sort) {
    if (this.basicSearchResponse != null) {
      const data = this.basicSearchResponse.slice();
      if (!sort.active || sort.direction === "") {
        if (this.isZ3950Profile) {
          this.sortedData = data.sort((a, b) => {
            return comparestring(a.Title, b.Title, true);
          });
        }
        else {
          this.sortedData = data;
        }
        if (this.sortedData && this.sortedData.length > 0) {
          this.selectedMarcId = this.sortedData[0].Id;
          this.selectedRecordNumber = this.sortedData[0].RecordNumber;
          this.selectedMarcRecordSource = this.sortedData[0].RecordSource;
          this.selectedRecordReason = this.sortedData[0].Reason;
          if (this.sortedData[0].Mrecord != null) {
            this.marcItem = this.sortedData[0].Mrecord;
            this.hideFacets = true;
          } else {
            this.hideFacets = false;
          }
        }
        else {
          this.selectedMarcId = null;
          this.selectedRecordNumber = null;
          this.selectedMarcRecordSource = null;
          this.selectedRecordReason = null;
          this.hideFacets = true;
        }
        return;
      }

      this.sortedData = data.sort((a, b) => {
        const isAsc = sort.direction === Constants.Sort.ASC;
        switch (sort.active) {
          case Constants.Search.RECORDNUMBER:
            return compare(a.RecordNumber, b.RecordNumber, isAsc);
          case Constants.Search.CONTROLNUMBER:
            return comparestring(a.LCCN, b.LCCN, isAsc);
          case Constants.Search.ISBN:
            return compare(
              this.getISBNUPC(a.ISBN, a.UPC),
              this.getISBNUPC(b.ISBN, b.UPC),
              isAsc
            );
          case Constants.Search.TITLE:
            return comparestring(a.Title, b.Title, isAsc);
          case Constants.Search.AUTHOR:
            return comparestring(a.Author, b.Author, isAsc);
          case Constants.Search.CALLNUMBER:
            return comparestring(a.CallNumber, b.CallNumber, isAsc);
          case Constants.Search.PUBDATE:
            return compare(a.PublishingYear, b.PublishingYear, isAsc);
          case Constants.Search.FORMAT:
            return comparestring(a.Format, b.Format, isAsc);
          case Constants.Search.ENCODINGLEVEL:
            return compare(a.EncodingLevel, b.EncodingLevel, isAsc);
          case Constants.Search.RECORDSOURCE:
            return comparestring(a.RecordSource, b.RecordSource, isAsc);
          default:
            return 0;
        }
      });
      if (this.sortedData && this.sortedData.length > 0) {
        this.selectedMarcId = this.sortedData[0].Id;
        this.selectedRecordNumber = this.sortedData[0].RecordNumber;
        this.selectedMarcRecordSource = this.sortedData[0].RecordSource;
        this.selectedRecordReason = this.sortedData[0].Reason;
      }
    }
  }

  viewMarcRecord(e: any, id: string, recordNumberForMarc: string, recordSource: string, recordReason: string, item: any) {
    if (
      e.target.className == "custom-control-label" ||
      e.target.className == "custom-control-input" ||
      e.target.type == "checkbox"
    ) {
      // stop the bubbling to prevent firing the row's click event
      e.stopPropagation();
    } else {
      this.selectedMarcId = id;
      this.selectedRecordNumber = recordNumberForMarc;
      this.selectedMarcRecordSource = recordSource;
      this.selectedRecordReason = recordReason;
      this.marcItem = item;
    }
  }

  // get the ISBN or UPC value based on availability
  getISBNUPC(isbn: string, upc: string): string {
    if (isbn && upc && isbn.length > 0 && upc.length > 0) {
      return isbn + "/" + upc;
    } else if (isbn && isbn.length > 0) {
      return isbn;
    } else if (upc && upc.length > 0) {
      return upc;
    } else {
      return "";
    }
  }

  filterResultsBasedOnProfile() {
    var profileCount: number = 0;
    this.clearCheckboxSelection();
    this.basicSearchResponse = [];
    this.selectedMarcId = null;
    this.selectedRecordNumber = null;
    this.selectedMarcRecordSource = null;
    this.selectedRecordReason = null;
    this.marcItem = null;
    let checkedProfiles = this.z3950Profiles.filter(x => x.isChecked === true);
    this.selecedProfiles = checkedProfiles.length;
    this.allSearchResults.forEach(item => {
      item.IsSelect = false;
    });
    checkedProfiles.forEach(profile => {
      const results = this.allSearchResults.filter(x => x.RecordSource === profile.profileName);
      Array.prototype.push.apply(this.basicSearchResponse, results);
      if (results.length === profile.totalRecords) {
        profileCount++;
      }
    });
    if (profileCount === checkedProfiles.length) {
      this.disableViewMore = true;
    }
    else {
      this.disableViewMore = false;
    }
    this.sortData(this.defaultSort);
    this.table.destroy();
    this.TableStyles();
    this.spinnerService.spinnerStop();
  }
  // check box select all or un select all functionalities
  selectAll(e: any) {
    if (this.selectAnyChkBox && !this.selectedAll) {
      this.selectedAll = this.selectedAll; // unselect all
      this.selectAnyChkBox = false;
      if (e.currentTarget.checked) {
        e.currentTarget.checked = false; // unselect select all
      }
    } else {
      this.selectedAll = !this.selectedAll; //select all
      this.selectAnyChkBox = false;
    }

    var recordCount = this.sortedData.length;
    recordCount = recordCount >= 8 ? 8 : recordCount;
    var start = 0;
    var end = recordCount;
    var $chkboxes = $(".chkbox");
    $chkboxes
      .slice(Math.min(start, end), Math.max(start, end))
      .prop("checked", this.selectedAll);

    $chkboxes
      .slice(
        Math.min(8, this.sortedData.length),
        Math.max(start, this.sortedData.length) + 1
      )
      .prop("checked", false);

    var checkboxesChecked = this.getCheckedData($chkboxes);
    if (checkboxesChecked && checkboxesChecked.length > 0) {
      for (var i = 0; i < checkboxesChecked.length; i++) {
        var marcRecord = this.sortedData.filter(
          x => x.Id == checkboxesChecked[i].id
        );
        marcRecord[0].IsSelect = true;
        this.selectedMarcs.push(marcRecord[0]);
      }
    }

    this.lastSelectedCheckboxIndex = -1;
    if (!this.selectedAll) {
      this.selectedMarcs = [];
    }
  }

  // fetch the list of checkboxes checked
  getCheckedData(chkBoxes: any): any {
    var checkboxesChecked = [];
    for (var i = 0; i < chkBoxes.length; i++) {
      if (chkBoxes[i].checked) {
        checkboxesChecked.push(chkBoxes[i]);
      }
    }
    return checkboxesChecked;
  }

  ondblSelectChange(e) {
    e.stopImmediatePropagation();
  }
  //check box change event + shift key + check functionality
  onSelectChange(event, id) {
    window.getSelection().removeAllRanges();
    var $chkboxes = $(".chkbox");
    const index = this.findCurrentCheckboxIndex($chkboxes, id);
    let checked = $chkboxes[index].checked;
    if (checked && this.selectedMarcs && this.selectedMarcs.length == 8) {
      event.preventDefault();
      event.currentTarget.checked = false;
      this.lastSelectedCheckboxIndex = index;
      return;
    }

    let showTooltip = false;
    var recordCount = this.sortedData.length;
    recordCount = recordCount >= 8 ? 8 : recordCount;
    if (
      this.lastSelectedCheckboxIndex > -1 &&
      event.shiftKey &&
      index != this.lastSelectedCheckboxIndex
    ) {
      const start = Math.min(this.lastSelectedCheckboxIndex, index);
      const end = Math.max(this.lastSelectedCheckboxIndex, index);
      if (this.lastSelectedCheckboxIndex < index) {
        for (let i = start; i <= end; i++) {
          showTooltip =
            this.selectedMarcs && this.selectedMarcs.length == recordCount;
          this.checkCheckbox(checked, $chkboxes, i, index);
        }
      } else {
        for (let i = end; i >= start; i--) {
          showTooltip =
            this.selectedMarcs && this.selectedMarcs.length == recordCount;
          this.checkCheckbox(checked, $chkboxes, i, index);
        }
      }
    } else {
      this.checkCheckbox(checked, $chkboxes, index, index);
    }
    this.lastSelectedCheckboxIndex = index;
    this.selectedAll =
      this.selectedMarcs && this.selectedMarcs.length == recordCount;
    $('#checkAll').prop("checked", this.selectedAll);
    this.selectAnyChkBox =
      this.selectedMarcs &&
      this.selectedMarcs.length > 0 &&
      this.selectedMarcs.length < recordCount;
    // if (showTooltip && tooltip) {
    //   tooltip.disabled = false;
    //   tooltip.show();
    // }
  }

  findCurrentCheckboxIndex(checkBoxes, id) {
    for (let i = 0; i < checkBoxes.length; i++) {
      if (checkBoxes[i].id == id) {
        return i;
      }
    }
  }
  checkCheckbox(checked, checkBoxes, index, triggerIndex) {
    const id =
      checkBoxes && checkBoxes.length > 0 ? checkBoxes[index].id : null;
    const marc = this.sortedData.find(m => m.Id === id);
    if (checked) {
      if (this.selectedMarcs && this.selectedMarcs.length < 8) {
        checkBoxes[index].checked = true;
        marc.IsSelect = true;
        if (this.selectedMarcs.indexOf(marc) == -1)
          this.selectedMarcs.push(marc);
      } else {
        if (triggerIndex === index) {
          checkBoxes[triggerIndex].checked = false;
        } else {
          checkBoxes[index].checked = false;
        }
        marc.IsSelect = false;
      }
    } else {
      checkBoxes[index].checked = false;
      marc.IsSelect = false;
      this.selectedMarcs = this.selectedMarcs.filter(
        m => m != marc
      );
    }
  }

  viewATSReview() {
    if (this.sortedData && this.sortedData.length > 0) {
      if (this.selectedMarcs && this.selectedMarcs.length > 0) {
        let marcids = this.selectedMarcs.map(function (elem) {
          return { "id": elem.Id, "recordSource": elem.RecordSource };
        });
        localStorage.setItem(
          Constants.LocalStorage.ATSREVIEWRECORDS,
          JSON.stringify(marcids)
        );
      }
      else {
        let marcids = this.sortedData.map(function (elem) {
          return { "id": elem.Id, "recordSource": elem.RecordSource };
        });
        localStorage.setItem(
          Constants.LocalStorage.ATSREVIEWRECORDS,
          JSON.stringify(marcids)
        );
      }
    }
    this.router.navigate(["/ats-review/"]);
  }

  compareMarcRecords() {
    if (this.selectedMarcs && this.selectedMarcs.length > 1) {
      if (this.isZ3950Profile) {
        localStorage.setItem(
          Constants.LocalStorage.SELECTEDMARCRECORDS,
          JSON.stringify(this.selectedMarcs)
        );
        localStorage.setItem(Constants.LocalStorage.COMPAREMARCRECORDS,
          localStorage.getItem(Constants.LocalStorage.SELECTEDMARCRECORDS,
          )
        );
      }
      let param: string = "";
      this.selectedMarcs.forEach(selectedMarc => {
        if (param.length > 0) {
          param = param + ",";
        }
        param = param + selectedMarc.Id + ":" + selectedMarc.RecordNumber + ":" + selectedMarc.RecordSource + ":" + selectedMarc.Reason;
      });
      this.router.navigate(["/compare-view/" + param]);
    }
  }
  editMarcRecords() {
    this.spinnerService.onRequestStarted();
    if (this.selectedMarcs && this.selectedMarcs.length > 1) {
      if (this.isZ3950Profile) {
        localStorage.setItem(Constants.LocalStorage.SELECTEDMARCRECORDS, JSON.stringify(this.selectedMarcs));
      }
      let param: string = '';
      this.selectedMarcs.forEach(selectedMarc => {
        if (param.length > 0) {
          param = param + ',';
        }
        // tslint:disable-next-line: max-line-length
        param = param + selectedMarc.Id + ":" + selectedMarc.RecordNumber + ":" + selectedMarc.RecordSource + ":" + selectedMarc.RecordControlNumber;
      });

      // this.router.navigate(["/multiple-edit/" + param]);
      this.router.navigate(["/multiple-edit/", param, this.basicSearchResponse.length
      ]);
    }
  }

  showMore(facetType: any, length: number) {
    switch (facetType) {
      case Constants.Search.PUBLICATION: {
        this.endPubDate = length;
        break;
      }

      case Constants.Search.FORMAT: {
        this.endFormat = length;
        break;
      }

      case Constants.Search.SUBJECT: {
        this.endSubject = length;
        this.showMoreSubject = true;
        this.showLessSubject = false;
        break;
      }

      case Constants.Search.AUTHOR: {
        this.endAuthor = length;
        this.showMoreAuthor = true;
        this.showLessAuthor = false;
        break;
      }

      case Constants.Search.SERIES: {
        this.endSeries = length;
        break;
      }

      case Constants.Search.ENCODINGFACET: {
        this.endEncodingLevel = length;
        break;
      }

      case Constants.Search.RECORDSOURCE: {
        this.endRecordSource = length;
        break;
      }

      case Constants.Search.LANGUAGE: {
        this.endLanguage = length;
        break;
      }

      case Constants.Search.AUDIENCE: {
        this.endAudience = length;
        break;
      }

      case Constants.Search.PUBLISHER: {
        this.endPublisher = length;
        break;
      }
      default: {
        break;
      }
    }
  }

  showLess(facetType: any) {
    switch (facetType) {
      case Constants.Search.PUBLICATION: {
        this.endPubDate = 3;
        break;
      }

      case Constants.Search.FORMAT: {
        this.endFormat = 3;
        break;
      }

      case Constants.Search.SUBJECT: {
        this.endSubject = 3;
        this.showMoreSubject = false;
        this.showLessSubject = true;
        break;
      }

      case Constants.Search.AUTHOR: {
        this.endAuthor = 3;
        this.showMoreAuthor = false;
        this.showLessAuthor = true;
        break;
      }

      case Constants.Search.SERIES: {
        this.endSeries = 3;
        break;
      }

      case Constants.Search.ENCODINGFACET: {
        this.endEncodingLevel = 3;
        break;
      }

      case Constants.Search.RECORDSOURCE: {
        this.endRecordSource = 3;
        break;
      }

      case Constants.Search.LANGUAGE: {
        this.endLanguage = 3;
        break;
      }

      case Constants.Search.AUDIENCE: {
        this.endAudience = 3;
        break;
      }

      case Constants.Search.PUBLISHER: {
        this.endPublisher = 3;
        break;
      }
      default: {
        break;
      }
    }
  }

  EditMarcRecord(id: any, marcItem: any) {
    this.commonService.setRecordSource(this.selectedMarcRecordSource);
    if (this.isZ3950Profile) {
      this.commonService.setZ3950MarcItem(marcItem);
      this.router.navigate([
        "/z3950-edit"
      ]);
    }
    else {
      var saveCatalogs = JSON.parse(localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS));
      if (saveCatalogs.filter(element => element.profileName == Constants.DELETEDDBPROFILENAME && element.isActive).length === 1 && marcItem.Reason != null) {
        this.selectedMarcId = id;
        if (this.selectedMarcId) {
          this.router.navigate(["/bibliographic-edit/", this.selectedMarcId, this.basicSearchResponse.length, marcItem.Reason
          ]);
        }
      } else {
        this.selectedMarcId = id;
        if (this.selectedMarcId) {
          this.router.navigate(["/bibliographic-edit/", this.selectedMarcId, this.basicSearchResponse.length
          ]);
        }
      }
    }
  }
  CloneMarcRecord(id: any, marcItem: any) {
    if (this.isZ3950Profile) {
      this.cloneRules(marcItem);
      this.commonService.setZ3950MarcItem(marcItem);
      this.router.navigate([
        "/z3950-clone"
      ]);
    } else {
      this.selectedMarcId = id;
      if (this.selectedMarcId) {
        this.router.navigate([
          "/bibliographic-clone/",
          this.selectedMarcId,
          this.basicSearchResponse.length
        ]);
      }
    }
  }

  printMarcRecord(id: any, marcItem: any) {
    this.marcSettings = JSON.parse(localStorage.getItem(Constants.LocalStorage.MARCSETTINGS));

    if (this.isZ3950Profile) {
      //******Client Side Print Preview in new tab ******
      //this.printService.marcRecordHtmlPrintPreview(marcItem, this.lineSpaceSelection);

      //******Server Side Print PDF Preview *******
      this.printService.generatePDFPrintPreview(marcItem, this.lineSpaceSelection);
      document.getElementById("closePrintViewBtn").click();
      this.lineSpaceSelection = "2";
    }
    else {
      if (this.selectedRecordReason) {
        this.service.getDeletedMarcRecordById(id).subscribe((item: any) => {
          var marc = item;
          //******Client Side Print Preview in new tab ******
          //this.printService.marcRecordHtmlPrintPreview(marc, this.lineSpaceSelection);

          //******Server Side Print PDF Preview *******
          this.printService.generatePDFPrintPreview(marc, this.lineSpaceSelection);
          document.getElementById("closePrintViewBtn").click();
          this.lineSpaceSelection = "2";

          this.spinnerService.spinnerStop();
        },
          (error) => {
            console.log(error);
            this.spinnerService.spinnerStop();
          });
      }
      else {
        this.service.getMarcRecordById(id).subscribe((item: any) => {
          var marc = item;
          //******Client Side Print Preview in new tab ******
          //this.printService.marcRecordHtmlPrintPreview(marc, this.lineSpaceSelection);

          //******Server Side Print PDF Preview *******
          this.printService.generatePDFPrintPreview(marc, this.lineSpaceSelection);
          document.getElementById("closePrintViewBtn").click();
          this.lineSpaceSelection = "2";

          this.spinnerService.spinnerStop();
        },
          (error) => {
            console.log(error);
            this.spinnerService.spinnerStop();
          });
      }
    }
  }

  ClosePrintPopup() {
    document.getElementById("closePrintViewBtn").click();
    this.lineSpaceSelection = "2";
  }

  cloneRules(marcItem: any) {
    //get user preference from user object
    let userInfo: UserDetail = JSON.parse(localStorage.getItem('User'));
    if (userInfo || userInfo !== undefined) {
      // console.log('location', userInfo.Location);
      if (marcItem.fields || marcItem) {
        //get 040 tag
        var field = marcItem.fields.find(x => x.tag === "040"); //find 040 tag is present or not
        if (field === undefined) { // if not present generate it and add a and c subfields
          field = this.generate040Tag(false, undefined);
          marcItem.fields.push(field);
        } else {
          let result = field.subfields.find(x => x.code === 'a' || x.code === 'c'); // if 040 tag is there but a and c sub fields are not there
          if (result === undefined) {
            this.generate040Tag(true, field); //generate a and c subfields
          } else {
            this.generate040Tag(true, field); // if a or c sub fields missing
          }

        }
        if (field && field.subfields) {
          var tag = field.subfields.forEach(x => {
            if (x.code === 'a' || x.code === 'c') {
              if (userInfo.Location != null) {
                x.data = userInfo.Location;
              } else {
                x.data = 'ngWTWG';
              }

            }
          });
        }
      }
    }
  }
  generate040Tag(tagExists: boolean, field: any): MarcField {
    //let tag040= this.marcAdapter.createNewField('040');
    let tag040 = new MarcField();
    let subfieldA = new MarcSubField();
    let subfieldC = new MarcSubField();
    if (!tagExists && field === undefined) {
      tag040.tag = '040';
      tag040.subfields = [];
      //subfields a and c
      subfieldA.code = 'a';
      subfieldA.data = '';
      tag040.subfields.push(subfieldA)
      subfieldC.code = 'c';
      subfieldC.data = '';
      tag040.subfields.push(subfieldC);
    } else {
      tag040 = field; //identify which sub field is missing and if missing subfiled add it else ignore it.
      if (!field.subfields.find(x => x.code === 'a')) {
        //subfields a and c
        subfieldA.code = 'a';
        subfieldA.data = '';
        tag040.subfields.push(subfieldA)
      }
      if (!field.subfields.find(x => x.code === 'c')) {
        subfieldC.code = 'c';
        subfieldC.data = '';
        tag040.subfields.push(subfieldC);
      }
    }
    return tag040;
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
  // multiple marc view methods -- End

  /* search split fix function - var values */
  CustomHeightFunction() {
    this.CWidowHeight = $(window).height();
    this.CHeaderHeight = $("app-header nav").height();
    this.CSearchHeight = $("app-search .search_filter").height();
    this.CNavHeight = $(".mainNavSection").height();
    this.CompareBtn = $("header.tableHeaderCounts").height();
    this.marcHeader = $("header.MARCrecordHeader").height();
    this.HeaderHeight =
      this.CHeaderHeight +
      this.CSearchHeight +
      this.CNavHeight +
      this.CompareBtn +
      this.marcHeader;
    this.NewHeight = this.CWidowHeight - this.HeaderHeight;
    this.NewHeight = this.NewHeight - 13;
    this.FHeight = this.NewHeight + this.CompareBtn + 3;
    this.cdr.detectChanges();
    // $('.flex-container').css('height', this.NewHeight-46.4);
  }

  GetSearchResultsGridColumns() {
    var columns = [
      {
        "title": '<input type="checkbox" tabindex="0" id="checkAll" name="checkAll" /><label class="sr-only" for="checkAll" aria-hidden="true">Checkbox to check all</label>', "data": null,
        type: 'checkbox',
        orderable: false,
        className: 'td-1-small no-sort',
        render: function (data, type, full, meta) {
          return '<input type="checkbox" class="chkbox" id=' + full.Id + ' name=' + full.Id + ' /><label class="sr-only" id="chkLabel' + full.Id + '" for=' + full.Id + '></label>';
        },
      },
      {
        "title": '<span class="ui-column-resizer"></span><span for="Title">Title</span>', "data": "Title", className: 'titleTD',
        render: function (data, type, full, meta) {
          return '<a title="' + full.Title + '" class="TestCalls">' + full.Title + '</a>';
        }
      },
      {
        "title": '<span class="ui-column-resizer" ></span><span for="Author">Author</span>', "data": "Author", className: 'authorTD', render: function (data, type, full, meta) {
          return '<a title="' + full.Author + '"  class="TestCalls">' + full.Author + '</a>';
        }
      },
      {
        "title": '<span class="ui-column-resizer" ></span><span for="PubDate">Pub Date</span>', "data": "PublishingYear", className: 'pubdateTD',
        render: function (data, type, full, meta) {
          return '<a title="' + full.PublishingYear + '" class="TestCalls">' + full.PublishingYear + '</a>';
        }
      },
      {
        "title": '<span class="ui-column-resizer" ></span><span for="RecordNumber">Record Number</span>', "data": "RecordNumber", className: 'recordnumberTD',
        render: function (data, type, full, meta) {
          return '<a title="' + full.RecordNumber + '" class="TestCalls">' + full.RecordNumber + '</a>';
        }
      },
      {
        "title": '<span class="ui-column-resizer"></span><span for="ControlNumber">Control Number</span>', "data": "RecordControlNumber", className: 'controlnumberTD',
        render: function (data, type, full, meta) {
          return '<a title="' + full.RecordControlNumber + '" class="TestCalls">' + full.RecordControlNumber + '</a>';
        }
      },
      {
        "title": '<span class="ui-column-resizer" ></span><span for="ISBN">ISBN/UPC</span>', className: 'isbnupcTD',
        render: function (data, type, full, meta) {
          var value = "";
          if (full.ISBN && full.UPC && full.ISBN.length > 0 && full.ISBN.length > 0) {
            value = full.ISBN + "/" + full.UPC;
          } else if (full.ISBN && full.ISBN.length > 0) {
            value = full.ISBN;
          } else if (full.UPC && full.UPC.length > 0) {
            value = full.UPC;
          } else {
            value = "";
          }
          return '<a title="' + value + '" class="TestCalls">' + value + '</a>';
        }
      },
      {
        "sType": "LCC",
        "title": '<span class="ui-column-resizer" ></span><span for="CallNumber">LC Classification</span>', "data": "CallNumber", className: 'lclassificationTD',
        render: function (data, type, full, meta) {
          return '<a title="' + full.CallNumber + '" class="TestCalls">' + full.CallNumber + '</a>';
        }
      },
      {
        "title": '<span class="ui-column-resizer"></span><span for="DeweyAbridged">Dewey Abridged</span>', "data": "DeweyAbridged", className: 'deweyabridgedTD',
        render: function (data, type, full, meta) {
          return '<a title="' + full.DeweyAbridged + '" class="TestCalls">' + full.DeweyAbridged + '</a>';
        }
      },
      {
        "title": '<span class="ui-column-resizer"></span><span for="DeweyUnabridged">Dewey Unabridged </span>', "data": "DeweyUnabridged", className: 'deweyunbridgedTD',
        render: function (data, type, full, meta) {
          return '<a title="' + full.DeweyUnabridged + '" class="TestCalls"><span>Dewey Unabridged&nbsp;</span>' + full.DeweyUnabridged + '</a>';
        }
      },
      {
        "title": '<span class="ui-column-resizer"></span><span for="ANSCR">ANSCR</span>', "data": "ANSCR", className: 'anscrTD',
        render: function (data, type, full, meta) {
          return '<a title="' + full.ANSCR + '" class="TestCalls">' + full.ANSCR + '</a>';
        }
      },
      {
        "title": '<span class="ui-column-resizer"></span><span for="ISSN">ISSN</span>', "data": "ISSN", className: 'issnTD',
        render: function (data, type, full, meta) {
          return '<a title="' + full.ISSN + '" class="TestCalls">' + full.ISSN + '</a>';
        }
      },
      {
        "title": '<span class="ui-column-resizer" ></span><span for="Format">Format</span>', "data": "Format", className: 'formatTD',
        render: function (data, type, full, meta) {
          return '<a title="' + full.Format + '" class="TestCalls">' + full.Format + '</a>';
        }
      },
      {
        "title": '<span class="ui-column-resizer"></span><span for="EncodingLevel">Encoding Level</span>', "data": "EncodingLevel", className: 'encodinglevelTD',
        render: function (data, type, full, meta) {
          return '<a title="' + full.EncodingLevel + '" class="TestCalls">' + full.EncodingLevel + '</a>';
        }
      },
      {
        "title": "Pub Date Sort", className: 'pubdateSortTD',
        render: (data, type, full, meta) => {
          var value = this.facetResponse ? full.PublishingYearSort : full.PublishingYear;
          return '<a title="' + value + '" class="TestCalls">' + value + '</a>';
        }
      }
    ];

    var saveCatalogs = JSON.parse(localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS));

    for (var i = columns.length - 1; i >= 0; i--) {
      if (columns[i].data === this.AddColumnRecordSourceObject.id || columns[i].data === this.AddColumnDeletedReasonObject.id) {
        columns.splice(i, 1);
      }
    }

    if (saveCatalogs.filter(element => element.profileName == Constants.DELETEDDBPROFILENAME && element.isActive).length === 1) {
      columns.splice(5, 0, {
        "title": '<span class="ui-column-resizer"></span><span for="Reason">Deleted Reason</span>',
        "data": "Reason", className: 'deletedReasonTD',
        render: function (data, type, full, meta) {
          if (full.Reason)
            return '<a title="' + full.Reason + '" class="TestCalls">' + full.Reason + '</a>';
          else
            return '<a title="' + "" + '" class="TestCalls">' + '' + '</a>';
        }
      });
    } else {
      columns.splice(5, 0, {
        "title": '<span class="ui-column-resizer"></span><span for="RecordSource">Record Source</span>',
        "data": "RecordSource", className: 'recordsourceTD',
        render: function (data, type, full, meta) {
          return '<a title="' + full.RecordSource + '" class="TestCalls">' + full.RecordSource + '</a>';
        }
      });
    }
    return columns;
  }


  TableStyles() {
    let colsHide = this.hideColumns;
    let orderCols = this.reOrderColumns;
    let showCols = this.showColumns;
    var columns = this.GetSearchResultsGridColumns();
    if ($.fn.dataTable.isDataTable("#searchGrid")) {
      this.table = $("#searchGrid").DataTable();
    } else if (this.sortedData != null) {
      //Issue 3877
      var data = localStorage.getItem(
        Constants.LocalStorage.DATATABLESSEARCHGRID
      );
      if (data) {
        let datatableInfo = JSON.parse(data);
        datatableInfo.order = [];
        localStorage.setItem(
          Constants.LocalStorage.DATATABLESSEARCHGRID,
          JSON.stringify(datatableInfo)
        );
      }
      this.table = $("#searchGrid").DataTable({
        dom: "Rlfrtip",
        paging: false,
        data: this.sortedData,
        columns: columns,
        searching: false,
        info: false,
        sort: {
          default: ""
        },
        "aaSorting": [],
        autoWidth: false,
        scrollY: 128,
        scrollX: true,
        scrollCollapse: true,
        stateSave: true,
        columnDefs: [
          { orderable: false, targets: "no-sort" },
          { 'orderData': [15], 'targets': [3] },
          { visible: false, targets: colsHide }
        ],
        colReorder: {
          order: orderCols,
          realtime: false,
          fixedColumnsLeft: 1
        },
        "fnInitComplete": function (oSettings, json) {
          $('#searchGrid tbody tr:eq(0)').click();
          $('#searchGrid tbody tr:eq(0)').addClass('active');
          $('#searchGrid tbody').attr("id", "search_results");
        }
      });

      $("[data-toggle='tooltip']").tooltip();

      $('.ui-column-resizer').on('mousedown', (event) => {
        this.onMouseDown(event);
      });

      $('#searchGrid tbody').on('click', 'tr', (event) => {
        var $target = $(event.target);
        if (!$target.is('input:checkbox')) {
          var table = $("#searchGrid").DataTable();

          table.$('tr.active').removeClass('active');
          $(event.currentTarget).addClass('active');
          var data = table.row(event.currentTarget).data();
          this.selectedRecordReason = data.Reason;
          this.viewMarcRecord(event, data.Id, data.RecordNumber, data.RecordSource, data.Reason, data.Mrecord);
        }
      });

      $('#searchGrid tbody').on('dblclick', 'tr', (event) => {
        var $target = $(event.target);
        if (!$target.is('input:checkbox')) {
          var table = $("#searchGrid").DataTable();
          var data = table.row(event.currentTarget).data();
          var saveCatalogs = JSON.parse(localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS));
          if (saveCatalogs.filter(element => element.profileName == Constants.DELETEDDBPROFILENAME && element.isActive).length === 1)
            this.EditMarcRecord(data.Id, data);
          else
            this.EditMarcRecord(data.Id, data.Mrecord);
        }
      });

      $('#searchGrid tbody').on('keydown', 'tr', (event) => {
        var table = $("#searchGrid").DataTable();
        var data = table.row(event.currentTarget).data();
        this.viewMarcRecordOnEnter(event, data.Id, data.RecordNumber, data.RecordSource, data.Reason, data.Mrecord);
      });

      $('#checkAll').on('click', (event) => {
        this.selectAll(event);
      });

      $('#searchGrid tbody').on('click', 'input[type="checkbox"]', (event) => {
        var table = $("#searchGrid").DataTable();
        var $row = $(event.currentTarget).closest('tr');
        var data = table.row($row).data();
        this.onSelectChange(event, data.Id);
        var indeterminateState = !this.selectedAll && this.selectAnyChkBox;
        $('#checkAll').prop("indeterminate", indeterminateState);
      });

      $('#searchGrid tbody').on('dblclick', 'input[type="checkbox"]', (event) => {
        this.ondblSelectChange(event);
        var val = !this.selectedAll && this.selectAnyChkBox;
        $('#checkAll').prop("indeterminate", val);
      });

      var totalWidth = 25; //default check box width
      showCols.forEach(element => {
        let setWidth = "";
        let widthValue;
        if (element == 1) {
          widthValue = this.getColumnWidth("Title");
          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".titleTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".titleTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });

          totalWidth += widthValue;
        }
        if (element == 2) {
          widthValue = this.getColumnWidth("Author");

          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".authorTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".authorTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });

          totalWidth += widthValue;
        }
        if (element == 3) {
          widthValue = this.getColumnWidth("Pub Date");

          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".pubdateTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".pubdateTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });
          totalWidth += widthValue;
        }
        if (element == 4) {
          widthValue = this.getColumnWidth("Record Number");
          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".recordnumberTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".recordnumberTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });

          totalWidth += widthValue;
        }
        if (element == 5) {
          var saveCatalogs = JSON.parse(localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS));
          if (saveCatalogs.filter(element => element.profileName == Constants.DELETEDDBPROFILENAME && element.isActive).length === 1) {

            if (!this.columnData.findIndex(x => x.displayName == "Deleted Reason")) {
              this.columnData.splice(4, 0, this.AddColumnDeletedReasonObject);
            }

            widthValue = this.getColumnWidth("Deleted Reason");

            $(".dataTables_scrollHead")
              .find("table")
              .find("thead")
              .find("tr")
              .find(".recordsourceTD")
              .css({
                "min-width": widthValue,
                "max-width": widthValue,
                width: widthValue
              });

            $(".recordsourceTD").css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });
          } else {
            if (!this.columnData.findIndex(x => x.displayName == "Record Source")) {
              this.columnData.splice(4, 0, this.AddColumnRecordSourceObject);
            }

            widthValue = this.getColumnWidth("Record Source");

            $(".dataTables_scrollHead")
              .find("table")
              .find("thead")
              .find("tr")
              .find(".deletedReasonTD")
              .css({
                "min-width": widthValue,
                "max-width": widthValue,
                width: widthValue
              });

            $(".deletedReasonTD").css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });
          }

          totalWidth += widthValue;
        }
        if (element == 6) {
          widthValue = this.getColumnWidth("Control Number");

          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".controlnumberTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".controlnumberTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });

          totalWidth += widthValue;
        }
        if (element == 7) {
          widthValue = this.getColumnWidth("ISBN/UPC");

          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".isbnupcTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".isbnupcTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });
          totalWidth += widthValue;
        }
        if (element == 8) {
          widthValue = this.getColumnWidth("LC Classification");

          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".lclassificationTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".lclassificationTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });

          totalWidth += widthValue;
        }
        if (element == 9) {
          widthValue = this.getColumnWidth("Dewey Abridged");

          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".deweyabridgedTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".deweyabridgedTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });

          totalWidth += widthValue;
        }
        if (element == 10) {
          widthValue = this.getColumnWidth("Dewey Unabridged");

          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".deweyunbridgedTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".deweyunbridgedTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });
          totalWidth += widthValue;
        }
        if (element == 11) {
          widthValue = this.getColumnWidth("ANSCR");

          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".anscrTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".anscrTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });
          totalWidth += widthValue;
        }
        if (element == 12) {
          widthValue = this.getColumnWidth("ISSN");

          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".issnTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".issnTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });
          totalWidth += widthValue;
        }
        if (element == 13) {
          widthValue = this.getColumnWidth("Format");

          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".formatTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".formatTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });
          totalWidth += widthValue;
        }
        if (element == 14) {
          widthValue = this.getColumnWidth("Encoding Level");
          $(".dataTables_scrollHead")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".encodinglevelTD")
            .css({
              "min-width": widthValue,
              "max-width": widthValue,
              width: widthValue
            });

          $(".encodinglevelTD").css({
            "min-width": widthValue,
            "max-width": widthValue,
            width: widthValue
          });
          totalWidth += widthValue;
        }
      });

      // $(".table").width(totalWidth-2);
      // $('#searchGrid').dataTable().fnAdjustColumnSizing();
      //fixed chkbox space issue.
      var tWidthValue =
        $(".dataTables_scrollBody")
          .find("table")
          .find("thead")
          .find("tr")
          .find(".titleTD")
          .width() > this.getColumnWidth("Title")
          ? $(".dataTables_scrollBody")
            .find("table")
            .find("thead")
            .find("tr")
            .find(".titleTD")
            .width()
          : this.getColumnWidth("Title");
      $(".dataTables_scrollHead")
        .find("table")
        .find("thead")
        .find("tr")
        .find(".titleTD")
        .css("width", tWidthValue);
      $(".dataTables_scrollHead")
        .find("table")
        .find("thead")
        .find("tr")
        .find(".titleTD")
        .css("max-width", tWidthValue);
      $(".dataTables_scrollBody")
        .find("table")
        .find("thead")
        .find("tr")
        .find(".titleTD")
        .css("width", tWidthValue);
      $(".dataTables_scrollBody")
        .find("table")
        .find("thead")
        .find("tr")
        .find(".titleTD")
        .css("max-width", tWidthValue);

      this.table.columns.adjust().draw(false);



      //Set title to the columns
      //this.setTitle();

      this.table.columns.adjust().draw(false);

      $(".dataTables_scrollBody")
        .find("table")
        .find("thead")
        .find("tr")
        .find("th:first")
        .find("div:last")
        .html("")
        .append("<span class='sr-only'>Check All</span>");
    }
  }

  // set title for all td values in a table
  setTitle() {
    $(".dataTables_scrollBody")
      .find("table")
      .find("tbody")
      .find("tr")
      .find("td")
      .each(function (i, e) {
        //if ($(e).find('a').width() > $(e).width() && $(e).length > 0) {
        if ($(e).length > 0) {
          if (
            $(e).find("a").length > 0 &&
            $(e)
              .find("a")[0]
              .innerText.split("\n").length > 0
          ) {
            if (
              $(e)
                .find("a")[0]
                .innerText.split("\n")[1]
            )
              $(e)[0].title = $(e)
                .find("a")[0]
                .innerText.split("\n")[1];
            else $(e)[0].title = "";
          } else {
            $(e)[0].title = "";
          }
        }
      });
  }


  // multiple marc view methods -- End
  ngAfterViewChecked() {
    /* search split fix function  */
    this.CustomHeightFunction();
    $(window).resize(e => {
      this.CustomHeightFunction();
    });
    this.TableStyles();
    var table = $("#searchGrid").DataTable();
    var tableData = table.rows().data();
    for (var i = 0; i < tableData.length; i++) {
      var showToolTip = this.selectedMarcs && this.selectedMarcs.length == 8 && !tableData[i].IsSelect;
      var disableMatToolTip = !(this.selectedMarcs && this.selectedMarcs.length == 8 && !tableData[i].IsSelect);
      if (showToolTip) {
        $("#chkLabel" + tableData[i].Id).text("Maximum records limit reached");
      } else {
        $("#chkLabel" + tableData[i].Id).text("Checkbox to view Marc Record");
      }
      if (disableMatToolTip) {
        $("#" + tableData[i].Id).removeAttr("title");
      }
      else {
        $("#" + tableData[i].Id).attr("title", "Maximum records limit reached");
      }
    }

    $(".dataTables_length").addClass("bs-select");
    if (this.table) {

      $.fn.dataTableExt.oSort["LCC-desc"] = function (x, y) {
        return compareLCC(y, x);
      };

      $.fn.dataTableExt.oSort["LCC-asc"] = function (x, y) {
        return compareLCC(x, y);
      }
      var saveCatalogs = JSON.parse(localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS));

      this.table.on("column-reorder", (e, settings, details) => {
        let aoColumns = settings.aoColumns;
        let customEvent = this.isCustomEvent;
        if (!customEvent && this.columnReOrderCount == 0) {
          this.columnReOrderCount++;
          let eachColumns = [];
          let eachColumnsWidth = [];
          for (let i = 1; i <= aoColumns.length - 1; i++) {
            if (aoColumns[i].sTitle.indexOf("Title") > 0) {
              eachColumns.push("AddColumnTitle");
            } else if (aoColumns[i].sTitle.indexOf("Author") > 0) {
              eachColumns.push("AddColumnAuthor");
            } else if (aoColumns[i].sTitle.indexOf("Pub Date") > 0) {
              eachColumns.push("AddColumnPubDate");
            } else if (aoColumns[i].sTitle.indexOf("Record Number") > 0) {
              eachColumns.push("AddColumnRecordNumber");
            } else if (saveCatalogs.filter(element => element.profileName == Constants.DELETEDDBPROFILENAME && element.isActive).length === 1 &&
              (aoColumns[i].sTitle.indexOf("Deleted Reason") > 0)) {
              eachColumns.push("AddColumnDeletedReason");
            } else if (aoColumns[i].sTitle.indexOf("Record Source") > 0
              && saveCatalogs.filter(element => element.profileName == Constants.DELETEDDBPROFILENAME && element.isActive).length === 0) {
              eachColumns.push("AddColumnRecordSource");
            } else if (aoColumns[i].sTitle.indexOf("Control Number") > 0) {
              eachColumns.push("AddColumnRecordControlNumber");
            } else if (aoColumns[i].sTitle.indexOf("ISBN/UPC") > 0) {
              eachColumns.push("AddColumnISBN");
            } else if (aoColumns[i].sTitle.indexOf("LC Classification") > 0) {
              eachColumns.push("AddColumnCallNumber");
            } else if (aoColumns[i].sTitle.indexOf("Dewey Abridged") > 0) {
              eachColumns.push("AddColumnDeweyAbridged");
            } else if (aoColumns[i].sTitle.indexOf("Dewey Unabridged") > 0) {
              eachColumns.push("AddColumnDeweyUnabridged");
            } else if (aoColumns[i].sTitle.indexOf("ANSCR") > 0) {
              eachColumns.push("AddColumnANSCR");
            } else if (aoColumns[i].sTitle.indexOf("ISSN") > 0) {
              eachColumns.push("AddColumnISSN");
            } else if (aoColumns[i].sTitle.indexOf("Format") > 0) {
              eachColumns.push("AddColumnFormat");
            } else if (aoColumns[i].sTitle.indexOf("Encoding Level") > 0) {
              eachColumns.push("AddColumnEncodingLevel");
            }
          }
          this.finalColumns = [];
          for (let x = 0; x < eachColumns.length; x++) {
            for (let j = 0; j < this.tableColumns.length; j++) {
              if (eachColumns[x] == this.tableColumns[j].id) {
                this.finalColumns.push(this.tableColumns[j]);
              }
            }
          }
          localStorage.setItem(
            Constants.LocalStorage.ADDMORECOLUMNS,
            JSON.stringify(this.finalColumns)
          );
          this.tableColumns = this.finalColumns;
          this.columnReOrderCount = 0;
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      });

      this.table.on("order.dt", () => {
        this.clearCheckboxSelection();
      });
    }
  }

  clearCheckboxSelection() {
    this.selectedMarcs = [];
    this.selectedAll = false;
    $('#checkAll').prop("checked", false);
    this.selectAnyChkBox = false;
    var $chkboxes = $(".chkbox");
    for (let i = 0; i < $chkboxes.length; i++) {
      $chkboxes[i].checked = false;
    }
  }

  setCheckboxSelection() {
    var $chkboxes = this.checkboxesChecked;
    for (let i = 0; i < $chkboxes.length; i++) {
      $chkboxes[i].checked = true;
      var marcRecord = this.sortedData.filter(
        x => x.Id == this.checkboxesChecked[i].id
      );
      marcRecord[0].IsSelect = true;
      this.selectedMarcs.push(marcRecord[0]);
    }
    if ($chkboxes.length == 8) {
      this.selectedAll = true;
      this.selectAnyChkBox = true;
    } else if ($chkboxes.length > 0) {
      this.selectedAll = false;
      this.selectAnyChkBox = true;
    }
    $('#checkAll').prop("checked", this.selectedAll);
  }

  /* ..... search split fix ends here.....  */

  getFacetValue(value, facetType: string) {
    if (
      this.commonService.selectedFacetValues.findIndex(
        x => x.FacetValue === value && x.FacetType === facetType
      ) === -1
    ) {
      this.commonService.selectedFacetValues.push({
        FacetValue: value,
        FacetType: facetType
      });

      this.emitFacetValue.emit(this.commonService.selectedFacetValues);
    }
  }

  selectedFacetValueClick(clickedValue, clickedType) {
    let index: any;

    if (this.commonService.selectedFacetValues.length > 0) {
      index = this.commonService.selectedFacetValues.findIndex(
        x => x.FacetValue === clickedValue && x.FacetType === clickedType
      );
      this.commonService.selectedFacetValues.splice(index, 1);
    }

    // Take the last inserted item in the array
    let item = this.commonService.selectedFacetValues.slice(-1)[0];

    if (item) {
      this.emitFacetValue.emit(this.commonService.selectedFacetValues);
    } else {
      this.emitFacetValue.emit("");
    }
  }

  hideMe(value, facetType): boolean {
    return (
      this.commonService.selectedFacetValues.findIndex(
        x => x.FacetValue === value && x.FacetType === facetType
      ) != -1
    );
  }

  btnClearFilters() {
    this.commonService.selectedFacetValues = [];
    this.emitFacetValue.emit("");
  }

  GetEncodingText(value) {
    if (
      value == Constants.EncodingText.LEVELTWO ||
      value == Constants.EncodingText.LEVELTHREE ||
      value == Constants.EncodingText.LEVELFIVE ||
      value == Constants.EncodingText.LEVELSEVEN ||
      value == Constants.EncodingText.LEVELM ||
      value == Constants.EncodingText.LEVELJ ||
      value == Constants.EncodingText.LEVELK ||
      value == Constants.EncodingText.LEVELUNASSIGNED ||
      value == Constants.EncodingText.LEVELNOTAPPLICABLE
    ) {
      return Constants.EncodingText.OTHER;
    } else if (value == Constants.EncodingText.LEVELEIGHT) {
      return Constants.EncodingText.PREPUB;
    } else if (value == Constants.EncodingText.LEVELFOUR) {
      return Constants.EncodingText.CORE;
    } else if (
      value == Constants.EncodingText.LEVELBLANK ||
      value == Constants.EncodingText.LEVELONE ||
      value == Constants.EncodingText.LEVELI
    ) {
      return Constants.EncodingText.FULL;
    } else {
    }
  }

  makeSelectedFacetToBoldText() {
    if (this.commonService.selectedFacetValues.length > 0) {
      this.commonService.selectedFacetValues.forEach(x => {
        if (x.FacetValue) {
          if (x.FacetType == Constants.Facets.PUBDATE) {
            this.boldPubDate.push(x.FacetValue);
          } else if (x.FacetType == Constants.Facets.FORMAT) {
            this.boldFormat.push(x.FacetValue);
          } else if (x.FacetType == Constants.Facets.SUBJECT) {
            this.boldSubject.push(this.getFormatted(x.FacetValue));
          } else if (x.FacetType == Constants.Facets.AUTHOR) {
            this.boldAuthor.push(this.getFormatted(x.FacetValue));
          } else if (x.FacetType == Constants.Facets.SERIES) {
            this.boldSeries.push(this.getFormatted(x.FacetValue));
          } else if (x.FacetType == Constants.Facets.ENCODINGLEVEL) {
            this.boldEncodingLevel.push(x.FacetValue);
          } else if (x.FacetType == Constants.Facets.RECORDSOURCE) {
            this.boldRecordSource.push(x.FacetValue);
          } else if (x.FacetType == Constants.Facets.LANGUAGE) {
            this.boldLanguage.push(x.FacetValue);
          } else if (x.FacetType == Constants.Facets.AUDIENCE) {
            this.boldAudience.push(x.FacetValue);
          } else if (x.FacetType == Constants.Facets.PUBLISHER) {
            this.boldPublisher.push(this.getFormatted(x.FacetValue));
          }
        }
      });
    }
  }

  getFormatted(value: any) {
    return value;
  }

  showTenRecordsOnSubject(response: any) {
    let subjectHeight = this.showTenRecordsOnShowMore(response);
    this.subjectHeight = subjectHeight - 10 + "px";
  }

  showTenRecordsOnSeries(response: any) {
    let seriesHeight = this.showTenRecordsOnShowMore(response);
    this.seriesHeight = seriesHeight + "px";
  }

  showTenRecordsOnPublisher(response: any) {
    let publisherHeight = this.showTenRecordsOnShowMore(response);
    this.publisherHeight = publisherHeight + 28 + "px";
  }

  showTenRecordsOnAuthorHeight(response: any) {
    let authorHeight = this.showTenRecordsOnShowMore(response);
    this.authorHeight = authorHeight + "px";
  }

  showTenRecordsOnShowMore(response: any): any {
    let finalSplittedString: any;
    let finalCalculatedHeight: any;
    let calcHeight: number = 0;
    let addComma = ",";

    let requiredLength = response.slice(0, 10).length; // Taking the first required 10 records
    for (let i = 0; i < requiredLength; i++) {
      let formattedString = this.getFormatted(response[i].Value);
      let responseCount: any = response[i].Count;
      let finalString = formattedString + responseCount.toString();
      let removeCommaFromString = finalString.replace(",", "");

      //let finalFormattedString = removeCommaFromString.replace(new RegExp(`^(.{25})`), "$1" + addComma);
      if (removeCommaFromString != "") {
        finalSplittedString = removeCommaFromString.length / 24;

        if (finalSplittedString <= 1) {
          finalSplittedString = 1;
        } else if (finalSplittedString > 1 && finalSplittedString <= 2) {
          finalSplittedString = 2;
        } else if (finalSplittedString > 2 && finalSplittedString <= 3) {
          finalSplittedString = 3;
        } else if (finalSplittedString > 3 && finalSplittedString <= 4) {
          finalSplittedString = 4;
        } else if (finalSplittedString > 4 && finalSplittedString <= 5) {
          finalSplittedString = 5;
        }

        if (finalSplittedString == 1) {
          calcHeight += 23.375;
        } else if (finalSplittedString == 2) {
          calcHeight += 40.375;
        } else if (finalSplittedString == 3) {
          calcHeight += 57.375;
        } else if (finalSplittedString == 4) {
          calcHeight += 74.375;
        } else if (finalSplittedString == 5) {
          calcHeight += 91.375;
        }
      }
    }
    finalCalculatedHeight = calcHeight;
    return finalCalculatedHeight;
  }

  showModalPopup(event: any) {
    if (event.relatedTarget == null) {
      this.showAddColumnsModal = false;
      if (
        localStorage.getItem(Constants.LocalStorage.ADDMORECOLUMNS) != null ||
        localStorage.getItem(Constants.LocalStorage.ADDMORECOLUMNS) != ""
      ) {
        var data = localStorage.getItem(Constants.LocalStorage.ADDMORECOLUMNS);
        this.tableColumns = JSON.parse(data);
      }
    } else {
      if (
        this.tableColumns.find(f => f.id == event.relatedTarget.id) != null ||
        event.relatedTarget.id == "dragColumns"
      ) {
        this.showAddColumnsModal = true;
      } else {
        this.showAddColumnsModal = false;
      }
    }
  }

  canEdit(): boolean {
    return (this.isExternalUser && this.currentCustomerId && this.currentCustomerId.length > 0) || this.hasAccess(Permissions.EDT_BIB_MN) || this.hasAccess(Permissions.EDT_BIB_WS);
  }


  canClone(): boolean {
    return this.hasAccess(Permissions.CLN_BIB_MN) || this.hasAccess(Permissions.CLN_BIB_WS);
  }
  canDelete(): boolean {
    if (this.hasAccess(Permissions.DEL_BIB_WS) && this.selectedMarcRecordSource === "BTCAT Workspace") {
      return true;
    }
    else if (this.hasAccess(Permissions.DEL_BIB_MN) && this.selectedMarcRecordSource === "B & T") {
      return true;
    }
    else
      return false;

  }
  //pop-up soft delete in search results
  deleteConfirmationMessage(form: NgForm) {

    let dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: "500px",
      height: "auto",
      disableClose: true,
      data: {
        isCopyErrorMsg: false,
        isCancelConfirm: true,
        message:
          "Are you sure you want to DELETE this record? "
      }
    });

    dialogRef.afterClosed().subscribe(
      result => {
        if (result) {
          this.service.deleteMarcRecordById(this.selectedMarcId).subscribe(result => {
            window.location.reload();
          });

        }
      },
      error => { }
    );
  }

}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
function comparestring(a: string, b: string, isAsc: boolean) {
  return (a.toLowerCase() < b.toLowerCase() ? -1 : 1) * (isAsc ? 1 : -1);
}

function isCharNumber(c) {
  return c >= '0' && c <= '9';
}

function LCCValArray(l) {
  const xarr = [];
  let currVal = "";
  let mode = 0;
  let cutterLine = false;



  // tslint:disable-next-line: prefer-for-of
  for (let i = 0; i < l.length; i++) {
    // For every char in array
    const s = l[i];
    if(s == " ") {
      // break line
      if (currVal !== " ") {
        xarr.push(currVal); // push last string value on array
        currVal = "";
        cutterLine = false;
      }
      cutterLine = false
    } else if ( s == ".") {
      if( mode == 1 ) {
        // current mode numeric break line
        if (currVal !== " ") {
          xarr.push(currVal); // push last string value on array
          currVal = "";
          cutterLine = false;
        }
      }
      currVal += s;
      cutterLine = true;
      mode = 2;
    } else if ( isCharNumber(s) && cutterLine) {
      // Found number in CutterLine
      currVal += s;
      mode = 2;
    } else if ( isCharNumber(s) && !cutterLine) {
      // Found number in NON-CutterLine
      if( mode == 1) { // already numeric mode?
        currVal += s;
      } else {
        if (currVal !== " ") {
          xarr.push(currVal); // push last string value on array
          currVal = "";
          cutterLine = false;
        }
        currVal += s;
        cutterLine = false;
        mode = 1;
      }
    } else if ( !isCharNumber(s) ) {
      if( mode == 1) {
        if (currVal !== " ") {
          xarr.push(currVal); // push last numeric value on array
          currVal = "";
          cutterLine = false;
        }
      }
      currVal += s;
      mode = 2;
    }
  }
  if (currVal !== " ") {
    xarr.push(currVal); // push last numeric value on array
    currVal = "";
  }

  console.log(xarr);
  return   xarr;
}


function compareLCC(xv, yv) {
  var xev = xv.substring(xv.indexOf(">") + 1, xv.indexOf("</"));
  var yev = yv.substring(yv.indexOf(">") + 1, yv.indexOf("</"));

  if (xev.trim() == "") {
    return -1;
  }
  if (yev.trim() == "") {
    return 1;
  }

  if (xev == yev) { return 0; }

  xev = xev.startsWith("Undergrad") ? xev.substring(9) : (xev.startsWith("UrbLib") ? xev.substring(6) : xev);
  yev = yev.startsWith("Undergrad") ? yev.substring(9) : (yev.startsWith("UrbLib") ? yev.substring(6) : yev);

  let xval = Array.from(xev);
  let yval = Array.from(yev);

  let xValArr = LCCValArray(xval);
  let yValArr = LCCValArray(yval);

  // console.log("x->" + xValArr);
  // console.log("y->" + yValArr);

  for (var i = 0; i < xValArr.length; i++) {
    var xt = xValArr[i];
    if(yValArr.length <= i) {return 1; } // X greater

    var yt = (yValArr.length > i) ? yValArr[i] :"";
    var x;
    var y;
    if (!isNaN(xt)) {
      //numeric value
      x = +xt;
    } else { x = xt; }
    if (!isNaN(yt)) {
      //numeric value
      y = +yt;
    } else { y = yt; }

    if (isNaN(x) != isNaN(y)) {
      //Types mismatch = prefer the string as smaller
      if (isNaN(x)) {
        // console.log ('x<y true' + i + ' ' + x + ' ' + y );
        return -1;
      }
      else {
        // console.log ('x<y false ' + i + ' ' + x + ' ' + y );
        return 1;
      }
    }
    if (x != y) {
      if (x < y) {
        // console.log('x<y true'+ i + ' ' + x + ' ' + y);
        return -1;
        break;
      } else {
        // console.log('x<y false'+ i + ' ' + x + ' ' + y);
        return 1;
        break;
      }
    }
  }
  var xsmaller = false;
  if (xValArr.length < yValArr.length) {
    // console.log('x<y true '+ i + " length");
    return -1;
  }
  else {
    // console.log('x<y (false) or equal '+ i + " length") ;
    return 1;
  }
}
