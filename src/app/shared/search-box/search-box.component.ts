import {
  Component,
  OnInit,
  Output,
  Input,
  EventEmitter,
  OnChanges,
  Renderer,
  ViewChild,
  ElementRef,
  ViewChildren, QueryList,
  HostListener
  //ChangeDetectionStrategy
} from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { SearchService } from "src/app/services/search.service";
import {
  BasicSearchRequest,
  BasicSearch,
  MarcRecord,
  FacetDetails,
  FacetsResults,
  SearchCriteriaData,
  AuthRecord,
  Z3950SearchRequest
} from "src/app/services/search";
import { error, isObject } from 'util';
import { Title } from "@angular/platform-browser";
import { CommonService } from "../service/common.service";
import { Constants } from "src/app/constants/constants";
import { AddMoreService } from "./addmore/addmore-search.service";
import { SearchItem } from "./addmore/SearchItem";
import { SearchCatalogService } from "./search-catalogs/search-catalog.service";
import * as $ from "jquery";
import { Z3950Service } from "src/app/Z39.50Profile/service/z3950.service";
import { Z3950Profile } from "src/app/Z39.50Profile/model/z3950";
import { SpinnerService } from "../interceptor/spinner.service";
import { UserConfigurationService } from 'src/app/users/user-configuration.service';
import { BaseComponent } from 'src/app/base.component';
import { AuthenticationService } from 'src/app/security/authentication.service';
import { Permissions } from 'src/app/security/permissions';
import { Customers, CustomerConfigurationDTO, Customer } from '../../customer/shared/customer';
import { NgForm } from '@angular/forms';
import { CustomerService } from '../../customer/shared/services/customer.service';
import { _countGroupLabelsBeforeOption, _getOptionScrollPosition, MatDialog, AUTOCOMPLETE_PANEL_HEIGHT, MatAutocompleteTrigger } from '@angular/material';
import { ClsConfigurationService } from '../../services/cls-configuration.service';
import { ConfirmationDialogComponent } from '../../components/shared/confirmation-dialog/confirmation-dialog.component';
import { ClslabelconfigurationService } from 'src/app/customer/cls-label-configuration/clslabelconfiguration.service';
import { EnvSettingsService } from 'src/app/env-settings/env-settings.service';
import { MarcEditorSettings } from 'src/app/marc/shared/marc';
import { constants } from 'os';

declare var $: any;

@Component({
  selector: "app-search-box",
  templateUrl: "./search-box.component.html"
})
export class SearchBoxComponent extends BaseComponent implements OnInit, OnChanges {
  @ViewChild("form") form: NgForm;
  @ViewChildren(MatAutocompleteTrigger, { read: MatAutocompleteTrigger }) matAutocompleteTrigger: QueryList<MatAutocompleteTrigger>;
  @Input() isSearchView: boolean = false;

  @Input() facetValue: any;

  @Output()
  sendSearchResult = new EventEmitter<any>();

  @Output()
  sendAuthoritySearchResult = new EventEmitter<any>();

  @Output()
  sendZ3950SearchResult = new EventEmitter<any>();

  @Output()
  showSpinner = new EventEmitter<boolean>();

  KeywordPlaceholder: string = 'Keyword/ISBN/UPC';
  IsBrowseSelected: boolean = false;
  SearchType: string = "all";
  hideSearchItem: boolean = true;
  IsShowToggleIcon: boolean = false;
  isbnSearchItem: BasicSearch;
  upcSearchItem: BasicSearch;
  titleSearchItem: BasicSearch;
  keywordSearchItem: BasicSearch;
  authorSearchItem: BasicSearch;
  titleorauthorSearchItem: BasicSearch;
  seriesSearchItem: BasicSearch;
  recordControlNumberSearchItem: BasicSearch;
  lccnSearchItem: BasicSearch;
  lcClassificationSearchItem: BasicSearch;
  publisherSearchItem: BasicSearch;
  pubdateSearchItem: BasicSearch;
  databaseRecordNumberSearchItem: BasicSearch;
  deweyAbridgedSearchItem: BasicSearch;
  deweyUnabridgedSearchItem: BasicSearch;
  anscrSearchItem: BasicSearch;
  issnSearchItem: BasicSearch;
  subjectSearchItem: BasicSearch;
  basicSearchRequest: BasicSearchRequest;
  facetResponse: FacetsResults;
  basicSearchResponse: MarcRecord[];
  authoritySearchResponse: AuthRecord[];
  sortedData: MarcRecord[];
  showSearchResult: Boolean = false;
  start: string;
  end: string;
  addmoreItems: SearchItem[];
  ShowSearchHistory: boolean = false;
  @ViewChild("btnSearch") input: ElementRef;
  facetsResults: FacetsResults;
  isPubDateStartValid: Boolean = true;
  isPubDateEndValid: Boolean = true;
  isPubDateBothValid: Boolean = true;
  defaultAddedItems: SearchItem[];
  ShowAddorRemoveDialog: boolean = false;
  ShowCatalogDialog: boolean = false;
  searchItems: SearchItem[];
  defaultCatalogItems: any;
  searchCatalogItems: any;
  z3950CatalogItems: Z3950Profile[];
  catalogRequest: any;
  basicZ3950SearchRequest: any;
  z3950SearchRequest: Z3950SearchRequest;
  isZ3950Search: boolean = false;
  dbRecNumSearchReq: BasicSearch[];
  isSpinnerRequired: boolean = false;
  actor: string;
  defaultCatalogs: any;
  customers: Customers[];
 customerId: string;
  previousCustomer = new Customers();
  selectedCustomer = new Customers();
  switchCustomerName: string = "";
  showSelectCustomer: boolean = false;
  allRoles: any = [];
  localUserRole: any;
  role: any;
  isMarkValidations: boolean = false;
  isDeletedDbEnable: boolean = false;
  userCustomer: any;
  //Permissions
  get hasSearchMainPermission(): boolean {
    return this.hasAccess(Permissions.SRC_BIB_MN);
  };
  get hasSearchWorkspacePermission(): boolean {
    return this.hasAccess(Permissions.SRC_BIB_WS);
  }
  hasSearchAuthorityPermission: boolean = false;

  get hasSearchDeleteMainRecordsPermission(): boolean {
    return this.hasAccess(Permissions.SRCH_DEL_MAIN);
  }
  get hasSearchDeleteWSRecordsPermission():boolean {
    return this.hasAccess(Permissions.SRCH_DEL_WS);
  }
  get hasSearchCustomerDelWSPermission():boolean {
    return this.hasAccess(Permissions.SRCH_CUST_WSPACE_DEL_RECS);
  }
  get hasSearchDelRecordsPermission():boolean {
    return this.hasAccess(Permissions.ACC_REC);
  }

  constructor(
    private clslabelconfigurationService: ClslabelconfigurationService,
    private service: SearchService,
    public commonService: CommonService,
    private router: Router,
    private _titleService: Title,
    private renderer: Renderer,
    private addmoreService: AddMoreService,
    private z3950Service: Z3950Service,
    private spinnerService: SpinnerService,
    private userConfigurationService: UserConfigurationService,
    private authenticationService: AuthenticationService,
    private clsConfigurationService: ClsConfigurationService,
    private cutomerService: CustomerService,
    private dialog: MatDialog,
    private envSetttingService:EnvSettingsService
  ) {
    super(router, authenticationService);
    this.resetForm("all");
  }

  ngOnInit() {
    //Set page Title when this view is initialized
    if(this.isExternalPermission)
      this.getAllUserCustomers();
    if(this.isAllCustomerEnable && !this.isExternalPermission)
      this.getAllCustomers();
    this._titleService.setTitle("BTCAT | Search");
    if (
      localStorage.getItem(Constants.LocalStorage.ACTOR) == null &&
      localStorage.getItem(Constants.LocalStorage.ACTOR) === ""
    ) {
      this.router.navigate(["/login"]);
    } else {
      // Expand or collapse based on local storage
      if (
       localStorage.getItem(Constants.LocalStorage.EXPANDSEARCH) == "false"
      ) {
        this.hideSearchItem = false;
        this.IsShowToggleIcon = true;
      } else {
        this.hideSearchItem = true;
        this.IsShowToggleIcon = false;
      }
      this.defaultCatalogs = JSON.parse(localStorage.getItem(Constants.LocalStorage.DEFAULTCATALOGS));
      //this.searchCatalogItems=JSON.parse(this.defaultCatalogs);
      if (
        localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS) == null ||
        localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS) === ""
      ) {

        //this.spinnerService.onRequestStarted();
        this.spinnerService.spinnerStart();

        this.z3950Service.getAllZ3950Profiles().subscribe(result => {

          //this.spinnerService.onRequestFinished();
          this.spinnerService.spinnerStop();

          result.forEach(x => {
            x.isActive = false;
            x.NonEncrypt = false;
          });

          this.z3950CatalogItems = [...this.defaultCatalogs, ...result];
          this.searchCatalogItems = this.z3950CatalogItems;
          if (this.isExternalUser) {
            this.loadDataBasedOnCustomer(this.currentCustomerId, false);
          }
         else {
            this.allRoles = JSON.parse(localStorage.getItem(Constants.LocalStorage.ROLES));
            this.localUserRole = localStorage.getItem(Constants.LocalStorage.USERROLE);
            if (this.allRoles != undefined) {
              this.allRoles.forEach(element => {
                if (element.code == this.localUserRole) {
                  this.role = element;
                  localStorage.setItem(Constants.LocalStorage.USERROLE, element.code);
                  return this.role;
               }
              });
            }
            
            this.defaultCatalogs = 
                this.role.catalogs ? ( this.defaultCatalogs.filter(p => this.role.catalogs.findIndex(c => c === p.id) != -1 
                || p.profileName == Constants.DELETEDDBPROFILENAME )): [];
            this.defaultCatalogs.forEach(element => {
              if(element.profileName == Constants.DELETEDDBPROFILENAME) {
                element.isActive = false;
              }
            });

            localStorage.setItem(Constants.LocalStorage.SAVECATALOGITEMS, JSON.stringify([...this.defaultCatalogs, ...result]));
          }

        });
      } else {
        this.resetSelectedCatalogsByPermissions();
        var data = localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS);
        this.searchCatalogItems = JSON.parse(data);
        if (this.searchCatalogItems != null && this.searchCatalogItems.length > 0) {
          var filterItems = this.searchCatalogItems.filter(
            x =>
              x.isActive && this.defaultCatalogs.findIndex(c => c.id == x.id) === -1
          );
          if (filterItems != null && filterItems.length > 0) {
            this.isZ3950Search = true;
          }
          else {
            this.isZ3950Search = false;
          }
        }
      }
      if (this.isZ3950Search === false &&
        localStorage.getItem(Constants.LocalStorage.ADDMORESETTINGS) == null ||
        localStorage.getItem(Constants.LocalStorage.ADDMORESETTINGS) === ""
      ) {
        this.addmoreService.loadAllSearchItems().subscribe(result => {
          this.addmoreItems = result;

          localStorage.setItem(
            Constants.LocalStorage.ADDMORESETTINGS,
            JSON.stringify(this.addmoreItems)
          );
          this.searchExpandorCollapse();
          this.searchItems = result;
        });
      } else {
        var data = localStorage.getItem(Constants.LocalStorage.ADDMORESETTINGS);
        this.searchItems = JSON.parse(data);
      }

      let locStorage: string;
      if (localStorage.getItem(Constants.LocalStorage.CURRENTSEARCH) == "authsearch") {
        locStorage = Constants.LocalStorage.AUTHSEARCHREQUEST;
      }
      else if (this.isZ3950Search) {
        locStorage = Constants.LocalStorage.SEARCHZ3950REQUEST;
      }
      else {
        locStorage = Constants.LocalStorage.BIBSEARCHREQUEST;
      }

      if (this.isZ3950Search === false && localStorage.getItem(locStorage) &&
        localStorage.getItem(locStorage) != null
        && localStorage.getItem(locStorage) != "null"
      ) {
        this.basicSearchRequest = new BasicSearchRequest();
        this.basicSearchRequest = JSON.parse(
          localStorage.getItem(locStorage)
        );

        if (
          this.basicSearchRequest &&
          this.basicSearchRequest.SearchRequest &&
          this.basicSearchRequest.SearchRequest.length > 0
        ) {
          this.loadSearchCriteria(this.basicSearchRequest.SearchRequest);
          if (
            this.basicSearchRequest.SearchRequest[0].type ===
            Constants.SearchType.HEADING ||
            this.basicSearchRequest.SearchRequest[0].type ===
            Constants.SearchType.BROWSE
          )
            this.setdisableFlag(
              this.basicSearchRequest.SearchRequest[0].searchBy
            );

          // Load data in search view
          if (this.isSearchView) {
            this.getBasicSearchResultFromService("", true);
          }
        } else if (this.z3950SearchRequest) {
          this.loadZ3950SearchCriteria(this.z3950SearchRequest);

          this.SearchType = this.z3950SearchRequest.SearchRequest[0].searchBy;

          // Load data in search view
          if (this.isSearchView) {
            this.getZ3950SearchResultFromService(this.z3950SearchRequest, true);
          }
        }
      } else {
        this.z3950SearchRequest = JSON.parse(
          localStorage.getItem(Constants.LocalStorage.SEARCHZ3950REQUEST)
        );
        if (this.z3950SearchRequest) {
          this.loadZ3950SearchCriteria(this.z3950SearchRequest);
          this.SearchType = this.z3950SearchRequest.SearchRequest[0].searchBy;
          // Load data in search view
          if (this.isSearchView)
            this.getZ3950SearchResultFromService(this.z3950SearchRequest, true);
        }
        // clear search criteria
        localStorage.setItem(Constants.LocalStorage.BIBSEARCHREQUEST, null);
      }
    }

    if (localStorage.getItem(Constants.LocalStorage.CLEARSEARCH) == "compare" || localStorage.getItem(Constants.LocalStorage.CLEARSEARCH) == "edit") {
     this.clearSearch();
      localStorage.removeItem(Constants.LocalStorage.CLEARSEARCH);
    }

    if (localStorage.getItem(Constants.LocalStorage.CLEARSEARCH) == "true") {
      if (!this.isSearchView) {
        if (localStorage.getItem(Constants.LocalStorage.CURRENTSEARCH)) {
          return;
        }
        this.clearSearch();
        localStorage.removeItem(Constants.LocalStorage.CLEARSEARCH);
      }
    }
    this.CheckDeletedDbSelection(true);
  }

  ngOnChanges() {
    if (!this.router.url.includes("authority-search")) {
      if (this.facetValue) {
        this.getFacetValue(this.facetValue);
      }
    }
    $(window).focus(function (e) {
      var items = JSON.parse(
        localStorage.getItem(Constants.LocalStorage.ADDMORESETTINGS));
      if (!items) {
        localStorage.setItem(Constants.LocalStorage.TEMPACTOR, localStorage.getItem(Constants.LocalStorage.ACTOR));
        localStorage.removeItem(Constants.LocalStorage.ACTOR);
        window.location.href = window.location.origin + '/#/login';
      }
    });
  }

  ngAfterViewInit() {
    $(".modal-backdrop").remove();
    if (!this.currentCustomerId && this.isExternalUser) {
      if(this.customers.length>0){
        $('#switchCustomerPopup').modal({
          show: true,
          keyboard: false,
          backdrop: 'static'
        });
      }
      else{
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
          width: "500px",
          height: "auto",
          disableClose: true,
          data: {
            title:"Logout",
            isCopyErrorMsg: false,
            isCancelConfirm: false,
            isORSMsg:false,
            isHideOkButton:true,
            message:
              "There are no customers assigned to your user account. Please contact your System Administrator to get customers assigned, then log on again."
          }
        });
      }
    }
  }

  ShowExpandorCollapse() {
    var items = JSON.parse(
      localStorage.getItem(Constants.LocalStorage.ADDMORESETTINGS)
    );
    if (items && items.filter(x => x.isChecked === true).length > 5) {
      return false;
    } else {
      return true;
    }
  }

  OnMoreItemsAdded(isMoreItemsAdded: boolean) {
    this.ShowAddorRemoveDialog = false;
    var items = JSON.parse(
      localStorage.getItem(Constants.LocalStorage.ADDMORESETTINGS)
    );
    this.searchItems = items;
    if (
      items &&
      items.filter(x => x.isChecked === true).length > 5 &&
      this.hideSearchItem === true
    ) {
      this.searchExpandorCollapse();
    }
    //issue-3848
    if (!this.isZ3950Search)
      this.setEnableAllElements();
    //Issue-3982
    if (items && items.filter(x => x.isChecked === false && x.id === "AddMorePubDate").length > 0) {
      this.isPubDateBothValid = true; // Hiding/Clearing the pub date validation warning here.
      this.isPubDateStartValid = true;
      this.isPubDateEndValid = true;
    }

    this.commonService.onSearchFieldsChanged(isMoreItemsAdded);
  }

  // add/remove the existing catalogs
  OnMoreCatalogItemsAdded(isMoreItemsAdded: boolean) {
    this.ShowCatalogDialog = false;
    var items = JSON.parse(
      localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS)
    );
    this.searchCatalogItems = items;
    if (items != null && items.length > 0) {
      var filterItems = items.filter(
        x =>
          x.isActive &&
          (this.defaultCatalogs.findIndex(c => c.id == x.id) === -1)
      );

      this.SearchType = Constants.ALL;

      if (filterItems != null && filterItems.length > 0) {
        this.isZ3950Search = true;
        this.clearSearch();
      }
      else {
        this.isZ3950Search = false;
      }
    }
    this.CheckDeletedDbSelection(false);
  }

  ngAfterViewChecked() {
    if (
      localStorage.getItem(Constants.LocalStorage.DELETEDDBCHECKED) !== null &&
      localStorage.getItem(Constants.LocalStorage.DELETEDDBCHECKED) !== ""
    ) {
      if (localStorage.getItem(Constants.LocalStorage.DELETEDDBCHECKED) == "true") {
        this.isDeletedDbEnable = true;
      } else {
        this.isDeletedDbEnable = false;
      }
    }
    else {
      this.isDeletedDbEnable = false;
    }
  }

  CheckDeletedDbSelection(isComponentReload) {
    var items = JSON.parse(
      localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS)
    );
    if (items.filter(x => x.isActive && x.profileName == Constants.DELETEDDBPROFILENAME).length > 0) {
      if(!isComponentReload){
        this.clearSearch();
      }
      this.KeywordPlaceholder = 'ISBN/UPC/LCCN/DB Record Number';
    } else {
        this.KeywordPlaceholder = 'Keyword/ISBN/UPC';
    }

    if (items.filter(x => x.isActive && x.profileName == Constants.DELETEDDBPROFILENAME).length > 0) {
      this.clearSearch();
      this.isDeletedDbEnable = true;
      this.KeywordPlaceholder = 'ISBN/UPC/LCCN/DB Record Number';
    } else {
        this.isDeletedDbEnable = false;
        this.KeywordPlaceholder = 'Keyword/ISBN/UPC';
    }
  }

  searchExpandorCollapse() {
    this.hideSearchItem = !this.hideSearchItem;

    if (this.hideSearchItem) {
      this.IsShowToggleIcon = false;
      localStorage.setItem(Constants.LocalStorage.EXPANDSEARCH, "true");
    } else {
      this.IsShowToggleIcon = true;
      localStorage.setItem(Constants.LocalStorage.EXPANDSEARCH, "false");
    }

    if (this.hideSearchItem) this.commonService.changeMessage("true");
    else this.commonService.changeMessage("false");
  }

  AddOrRemoveFields() {
    var data = localStorage.getItem(Constants.LocalStorage.ADDMORESETTINGS);
    this.defaultAddedItems = JSON.parse(data);
    this.ShowAddorRemoveDialog = true;
  }

  // get the search catalog details
  GetCatalogFields() {
    var data = localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS);
    this.defaultCatalogItems = JSON.parse(data);
    this.ShowCatalogDialog = true;
  }

  resetForm(type) {
    if (type != Constants.Search.ISBN) {
      this.isbnSearchItem = new BasicSearch();
      this.isbnSearchItem.searchBy = Constants.Search.ISBN;
      this.isbnSearchItem.type = Constants.SearchType.WORD;
    }

    if (type != Constants.Search.UPC) {
      this.upcSearchItem = new BasicSearch();
      this.upcSearchItem.searchBy = Constants.Search.UPC;
      this.upcSearchItem.type = Constants.SearchType.WORD;
    }

    if (type != Constants.Search.TITLE) {
      this.titleSearchItem = new BasicSearch();
      this.titleSearchItem.type = Constants.SearchType.BEGINS;
      this.titleSearchItem.searchBy = Constants.Search.TITLE;
    }

    if (type != Constants.Search.KEYWORD) {
      this.keywordSearchItem = new BasicSearch();
      this.keywordSearchItem.searchBy = Constants.Search.KEYWORD;
    }

    if (type != Constants.Search.AUTHOR) {
      this.authorSearchItem = new BasicSearch();
      this.authorSearchItem.type = Constants.SearchType.WORD;
      this.authorSearchItem.searchBy = Constants.Search.AUTHOR;
    }

    if (type != Constants.Search.SERIES) {
      this.seriesSearchItem = new BasicSearch();
      this.seriesSearchItem.type = Constants.SearchType.PHRASE;
      this.seriesSearchItem.searchBy = Constants.Search.SERIES;
    }

    if (type != Constants.Search.AUTHORORTITLE) {
      this.titleorauthorSearchItem = new BasicSearch();
      this.titleorauthorSearchItem.type = Constants.SearchType.WORD;
      this.titleorauthorSearchItem.searchBy = Constants.Search.AUTHORORTITLE;
    }

    if (type != Constants.Search.RECORDCONTROLNUMBER) {
      this.recordControlNumberSearchItem = new BasicSearch();
      this.recordControlNumberSearchItem.type = Constants.SearchType.EXACT;
      this.recordControlNumberSearchItem.searchBy =
        Constants.Search.RECORDCONTROLNUMBER;
    }

    if (type != Constants.Search.LCCN) {
      this.lccnSearchItem = new BasicSearch();
      this.lccnSearchItem.searchBy = Constants.Search.LCCN;
      this.lccnSearchItem.type = Constants.SearchType.WORD;
    }

    if (type != Constants.Search.LC_CLASSIFICATION) {
      this.lcClassificationSearchItem = new BasicSearch();
      this.lcClassificationSearchItem.searchBy =
        Constants.Search.LC_CLASSIFICATION;
      this.lcClassificationSearchItem.type = Constants.SearchType.WORD;
    }

    if (type != Constants.Search.PUBLISHER) {
      this.publisherSearchItem = new BasicSearch();
      this.publisherSearchItem.searchBy = Constants.Search.PUBLISHER;
      this.publisherSearchItem.type = Constants.SearchType.WORD;
    }

    if (type != Constants.Search.PUBDATE) {
      this.start = "";
      this.end = "";
      this.pubdateSearchItem = new BasicSearch();
      this.pubdateSearchItem.searchBy = Constants.Search.PUBDATE;
      this.pubdateSearchItem.type = Constants.SearchType.WORD;
    }

    if (type != Constants.Search.DATABASE_RECORD_NUMBER) {
      this.databaseRecordNumberSearchItem = new BasicSearch();
      this.databaseRecordNumberSearchItem.searchBy =
        Constants.Search.DATABASE_RECORD_NUMBER;
      this.databaseRecordNumberSearchItem.type = Constants.SearchType.WORD;
    }

    if (type != Constants.Search.DEWEYABRIDGED) {
      this.deweyAbridgedSearchItem = new BasicSearch();
      this.deweyAbridgedSearchItem.type = Constants.SearchType.WORD;
      this.deweyAbridgedSearchItem.searchBy = Constants.Search.DEWEYABRIDGED;
    }
    if (type != Constants.Search.DEWEYUNABRIDGED) {
      this.deweyUnabridgedSearchItem = new BasicSearch();
      this.deweyUnabridgedSearchItem.type = Constants.SearchType.WORD;
      this.deweyUnabridgedSearchItem.searchBy =
        Constants.Search.DEWEYUNABRIDGED;
    }
    if (type != Constants.Search.ANSCR) {
      this.anscrSearchItem = new BasicSearch();
      this.anscrSearchItem.type = Constants.SearchType.WORD;
      this.anscrSearchItem.searchBy = Constants.Search.ANSCR;
    }
    if (type != Constants.Search.ISSN) {
      this.issnSearchItem = new BasicSearch();
      this.issnSearchItem.type = Constants.SearchType.WORD;
      this.issnSearchItem.searchBy = Constants.Search.ISSN;
    }

    if (type != Constants.Search.SUBJECT) {
      this.subjectSearchItem = new BasicSearch();
      this.subjectSearchItem.type = Constants.SearchType.WORD;
      // this.subjectSearchItem.type = Constants.SearchType.HEADING;
      this.subjectSearchItem.searchBy = Constants.Search.SUBJECT;
    }
  }

  //Reset the from controls
  clearSearch() {
    this.isbnSearchItem.term = "";
    this.upcSearchItem.term = "";
    this.titleSearchItem.term = "";
    this.keywordSearchItem.term = "";
    this.authorSearchItem.term = "";
    this.titleorauthorSearchItem.term = "";
    this.seriesSearchItem.term = "";
    this.lccnSearchItem.term = "";
    this.lcClassificationSearchItem.term = "";
    this.publisherSearchItem.term = "";
    this.databaseRecordNumberSearchItem.term = "";
    this.start = "";
    this.end = "";
    this.recordControlNumberSearchItem.term = "";
    this.deweyUnabridgedSearchItem.term = "";
    this.deweyAbridgedSearchItem.term = "";
    this.issnSearchItem.term = "";
    this.anscrSearchItem.term = "";
    this.subjectSearchItem.term = "";
    this.isPubDateBothValid = true; // Hiding/Clearing the pub date validation warning here.
    this.isPubDateStartValid = true;
    this.isPubDateEndValid = true;
    this.setEnableAllElements();
    localStorage.setItem(Constants.LocalStorage.CLEARSEARCH, "true");

  }

  loadZ3950SearchCriteria(z3950SearchRequest: any) {
    if (z3950SearchRequest) {
      //TODO ISBN Only if we have more fields modify the below logic

      let isbnSeachCriteria = z3950SearchRequest.SearchRequest.find(
        s => s.searchBy == Constants.Search.ISBN
      );
      if (isbnSeachCriteria) {
        this.isbnSearchItem.term = isbnSeachCriteria.term;
        this.isbnSearchItem.type = isbnSeachCriteria.type;
      }

      let titleSeachCriteria = z3950SearchRequest.SearchRequest.find(
        s => s.searchBy == Constants.Search.TITLE
      );
      if (titleSeachCriteria) {
        this.titleSearchItem.term = titleSeachCriteria.term;
        this.titleSearchItem.type = titleSeachCriteria.type;
      }

      let keywordSeachCriteria = z3950SearchRequest.SearchRequest.find(
        s => s.searchBy == Constants.Search.KEYWORD
      );
      if (keywordSeachCriteria) {
        this.keywordSearchItem.term = keywordSeachCriteria.term;
      }

      let authorSeachCriteria = z3950SearchRequest.SearchRequest.find(
        s => s.searchBy == Constants.Search.AUTHOR
      );
      if (authorSeachCriteria) {
        this.authorSearchItem.type = authorSeachCriteria.type;
        this.authorSearchItem.term = authorSeachCriteria.term;
      }

      let subjectSeachCriteria = z3950SearchRequest.SearchRequest.find(
        s => s.searchBy == Constants.Search.SUBJECT
      );
      if (subjectSeachCriteria) {
        this.subjectSearchItem.type = subjectSeachCriteria.type;
        this.subjectSearchItem.term = subjectSeachCriteria.term;
      }

      let lccnSeachCriteria = z3950SearchRequest.SearchRequest.find(
        s => s.searchBy == Constants.Search.LCCN
      );
      if (lccnSeachCriteria) {
        this.lccnSearchItem.term = lccnSeachCriteria.term;
        this.lccnSearchItem.type = lccnSeachCriteria.type;
      }

      let lcClassificationSearchCriteria = z3950SearchRequest.SearchRequest.find(
        s => s.searchBy == Constants.Search.LC_CLASSIFICATION
      );
      if (lcClassificationSearchCriteria) {
        this.lcClassificationSearchItem.term = lcClassificationSearchCriteria.term;
        this.lcClassificationSearchItem.type = lcClassificationSearchCriteria.type;
      }

      let publisherSeachCriteria = z3950SearchRequest.SearchRequest.find(
        s => s.searchBy == Constants.Search.PUBLISHER
      );
     if (publisherSeachCriteria) {
        this.publisherSearchItem.term = publisherSeachCriteria.term;
        this.publisherSearchItem.type = publisherSeachCriteria.type;
      }

      let seriesSeachCriteria = z3950SearchRequest.SearchRequest.find(
        s => s.searchBy == Constants.Search.SERIES
      );
      if (seriesSeachCriteria) {
        this.seriesSearchItem.type = seriesSeachCriteria.type;
        this.seriesSearchItem.term = seriesSeachCriteria.term;
      }

      let titleorauthorSeachCriteria = z3950SearchRequest.SearchRequest.find(
        s => s.searchBy == Constants.Search.AUTHORORTITLE
      );
      if (titleorauthorSeachCriteria) {
        this.titleorauthorSearchItem.type = titleorauthorSeachCriteria.type;
        this.titleorauthorSearchItem.term = titleorauthorSeachCriteria.term;
      }

      let pubdateSeachCriteria = z3950SearchRequest.SearchRequest.find(
        s => s.searchBy == Constants.Search.PUBDATE
      );
      if (pubdateSeachCriteria) {
        this.pubdateSearchItem.term = pubdateSeachCriteria.term;
        this.start = pubdateSeachCriteria.term.split(",")[0];
        // this.end = pubdateSeachCriteria.term.split(",")[1];
        this.pubdateSearchItem.type = pubdateSeachCriteria.type;
      }

      let deweyAbridgedSearchCriteria = z3950SearchRequest.SearchRequest.find(
        s => s.searchBy == Constants.Search.DEWEYABRIDGED
      );
      if (deweyAbridgedSearchCriteria) {
        this.deweyAbridgedSearchItem.term = deweyAbridgedSearchCriteria.term;
        this.deweyAbridgedSearchItem.type = deweyAbridgedSearchCriteria.type;
      }

      let issnSearchCriteria = z3950SearchRequest.SearchRequest.find(
        s => s.searchBy == Constants.Search.ISSN
      );
      if (issnSearchCriteria) {
        this.issnSearchItem.term = issnSearchCriteria.term;
        this.issnSearchItem.type = issnSearchCriteria.type;
      }
    }
  }

  loadSearchCriteria(searchRequest: BasicSearch[]) {
    if (searchRequest && searchRequest.length > 0) {
      let isbnSeachCriteria = searchRequest.find(
        s => s.searchBy == Constants.Search.ISBN
      );
      if (isbnSeachCriteria) {
        this.isbnSearchItem.term = isbnSeachCriteria.term;
        this.isbnSearchItem.type = isbnSeachCriteria.type;
      }

     let upcSeachCriteria = searchRequest.find(
        s => s.searchBy == Constants.Search.UPC
      );
      if (upcSeachCriteria) {
        this.upcSearchItem.term = upcSeachCriteria.term;
        this.upcSearchItem.type = upcSeachCriteria.type;
      }

      let titleSeachCriteria = searchRequest.find(
        s => s.searchBy == Constants.Search.TITLE
      );
      if (titleSeachCriteria) {
        this.titleSearchItem.term = titleSeachCriteria.term;
        this.titleSearchItem.type = titleSeachCriteria.type;
      }

      let keywordSeachCriteria = searchRequest.find(
        s => s.searchBy == Constants.Search.KEYWORD
      );
      if (keywordSeachCriteria) {
        this.keywordSearchItem.term = keywordSeachCriteria.term;
      }

      let authorSeachCriteria = searchRequest.find(
        s => s.searchBy == Constants.Search.AUTHOR
      );
      if (authorSeachCriteria) {
        this.authorSearchItem.type = authorSeachCriteria.type;
        this.authorSearchItem.term = authorSeachCriteria.term;
      }

      let seriesSeachCriteria = searchRequest.find(
        s => s.searchBy == Constants.Search.SERIES
      );
      if (seriesSeachCriteria) {
        this.seriesSearchItem.type = seriesSeachCriteria.type;
        this.seriesSearchItem.term = seriesSeachCriteria.term;
      }

      let titleorauthorSeachCriteria = searchRequest.find(
        s => s.searchBy == Constants.Search.AUTHORORTITLE
      );
      if (titleorauthorSeachCriteria) {
        this.titleorauthorSearchItem.type = titleorauthorSeachCriteria.type;
        this.titleorauthorSearchItem.term = titleorauthorSeachCriteria.term;
      }

      let recordControlNumberSeachCriteria = searchRequest.find(
        s => s.searchBy == Constants.Search.RECORDCONTROLNUMBER
      );
      if (recordControlNumberSeachCriteria) {
        this.recordControlNumberSearchItem.type =
          recordControlNumberSeachCriteria.type;
        this.recordControlNumberSearchItem.term =
          recordControlNumberSeachCriteria.term;
      }

      let lccnSeachCriteria = searchRequest.find(
        s => s.searchBy == Constants.Search.LCCN
      );
      if (lccnSeachCriteria) {
        this.lccnSearchItem.term = lccnSeachCriteria.term;
        this.lccnSearchItem.type = lccnSeachCriteria.type;
      }
      let lcClassificationSearchCriteria = searchRequest.find(
        s => s.searchBy == Constants.Search.LC_CLASSIFICATION
      );
      if (lcClassificationSearchCriteria) {
        this.lcClassificationSearchItem.term =
          lcClassificationSearchCriteria.term;
        this.lcClassificationSearchItem.type =
          lcClassificationSearchCriteria.type;
      }

      let publisherSeachCriteria = searchRequest.find(
        s => s.searchBy == Constants.Search.PUBLISHER
      );
      if (publisherSeachCriteria) {
        this.publisherSearchItem.term = publisherSeachCriteria.term;
        this.publisherSearchItem.type = publisherSeachCriteria.type;
      }

      let pubdateSeachCriteria = searchRequest.find(
        s => s.searchBy == Constants.Search.PUBDATE
      );
      if (pubdateSeachCriteria) {
        this.pubdateSearchItem.term = pubdateSeachCriteria.term;
        this.start = pubdateSeachCriteria.term.split(",")[0];
        this.end = pubdateSeachCriteria.term.split(",")[1];
        this.pubdateSearchItem.type = pubdateSeachCriteria.type;
      }

      if (localStorage.getItem(Constants.LocalStorage.CURRENTSEARCH) !== "fromAuthToBasic") {
        let databaseRecordNumberSeachCriteria = searchRequest.find(
          s => s.searchBy == Constants.Search.DATABASE_RECORD_NUMBER
        );
        if (databaseRecordNumberSeachCriteria) {
          this.databaseRecordNumberSearchItem.term =
            databaseRecordNumberSeachCriteria.term;
          this.databaseRecordNumberSearchItem.type =
            databaseRecordNumberSeachCriteria.type;
        }
      }
      let deweyAbridgedSearchCriteria = searchRequest.find(
        s => s.searchBy == Constants.Search.DEWEYABRIDGED
      );
      if (deweyAbridgedSearchCriteria) {
        this.deweyAbridgedSearchItem.term = deweyAbridgedSearchCriteria.term;
        this.deweyAbridgedSearchItem.type = deweyAbridgedSearchCriteria.type;
      }

      let deweyUnabridgedSearchCriteria = searchRequest.find(
        s => s.searchBy == Constants.Search.DEWEYUNABRIDGED
      );
      if (deweyUnabridgedSearchCriteria) {
        this.deweyUnabridgedSearchItem.term =
          deweyUnabridgedSearchCriteria.term;
        this.deweyUnabridgedSearchItem.type =
          deweyUnabridgedSearchCriteria.type;
      }

      let anscrSearchItemCriteria = searchRequest.find(
        s => s.searchBy == Constants.Search.ANSCR
      );
      if (anscrSearchItemCriteria) {
        this.anscrSearchItem.term = anscrSearchItemCriteria.term;
        this.anscrSearchItem.type = anscrSearchItemCriteria.type;
      }

      let issnSearchCriteria = searchRequest.find(
        s => s.searchBy == Constants.Search.ISSN
      );
      if (issnSearchCriteria) {
        this.issnSearchItem.term = issnSearchCriteria.term;
        this.issnSearchItem.type = issnSearchCriteria.type;
      }

      let subjectSearchCriteria = searchRequest.find(
        s => s.searchBy == Constants.Search.SUBJECT
      );
      if (subjectSearchCriteria) {
        this.subjectSearchItem.term = subjectSearchCriteria.term;
        this.subjectSearchItem.type = subjectSearchCriteria.type;
      }
    }
  }

  onKeyup(event) {
  }

  onKeydown(event) {
    if (event.key === Constants.ENTERKEY && this.isValidSearch) {
      this.renderer.invokeElementMethod(
        this.input.nativeElement,
        Constants.FOCUS
      );
      event.preventDefault();

      this.getBasicSearchRecords("", true, false);
    }
  }

  // enable or disable controls based on dropdown and element selection
  onModelChange(term, type, drpdownValue) {
    if ((term !== null && term.trim() !== "") || (type === "PubDate" && ((this.start !== null && this.start.trim() !== "") || (this.end !== null && this.end.trim() !== "")))) {
      if (
        drpdownValue === Constants.SearchType.HEADING ||
        drpdownValue === Constants.SearchType.BROWSE
      ) {
        this.onTypeChange(drpdownValue, type, term);
      }
      else if (this.isZ3950Search) {
        this.SearchType = type;
      }
    } else {
      //enable all the search fields
      this.setEnableAllElements();
    }
  }
  onTypeChange(value, type, term) {
    if (
      (value === Constants.SearchType.HEADING ||
        value === Constants.SearchType.BROWSE || this.isZ3950Search) &&
      term
    ) {

      //disable the tags from the search screen
      this.setdisableFlag(type);
    } else {
      //enable all the search fields
      this.setEnableAllElements();
    }
  }

  disableControl(type) {
    if (this.isZ3950Search && this.SearchType != "all") {
      return this.SearchType &&
        this.SearchType.length > 0 &&
        this.SearchType != type
    }
    else {
      return (
        this.IsBrowseSelected &&
        this.SearchType &&
        this.SearchType.length > 0 &&
        this.SearchType != type
      );
    }
  }

  setdisableFlag(searchTerm) {
    this.SearchType = searchTerm;
    this.IsBrowseSelected = true;
    this.resetForm(searchTerm);
  }

  setEnableAllElements() {
    this.SearchType = Constants.ALL;
    this.IsBrowseSelected = false;
  }
  get isValidSearch(): Boolean {
    if (
      (this.isbnSearchItem.term != null &&
        this.isbnSearchItem.term.trim() !== "") ||
      (this.upcSearchItem.term != null &&
        this.upcSearchItem.term.trim() !== "") ||
      (this.titleSearchItem.term != null &&
        this.titleSearchItem.term.trim() !== "") ||
      (this.keywordSearchItem.term != null &&
        this.keywordSearchItem.term.trim() !== "") ||
      (this.authorSearchItem.term != null &&
        this.authorSearchItem.term.trim() !== "") ||
      (this.titleorauthorSearchItem.term != null &&
        this.titleorauthorSearchItem.term.trim() !== "") ||
      (this.seriesSearchItem.term != null &&
        this.seriesSearchItem.term.trim() !== "") ||
      (this.lccnSearchItem.term != null &&
        this.lccnSearchItem.term.trim() !== "") ||
      (this.lcClassificationSearchItem.term != null &&
        this.lcClassificationSearchItem.term.trim() !== "") ||
      (this.publisherSearchItem.term != null &&
        this.publisherSearchItem.term.trim() !== "") ||
      (this.databaseRecordNumberSearchItem.term != null &&
        this.databaseRecordNumberSearchItem.term.trim() !== "") ||
      ((this.start != null && this.start !== "" && this.start.length === 4) ||
        (this.start != null &&
          this.start !== "" &&
          this.end != null &&
          this.end !== "" &&
          this.end.length === 4 &&
          this.start.length === 4 &&
          this.end >= this.start)) ||
      (this.recordControlNumberSearchItem.term != null &&
        this.recordControlNumberSearchItem.term.trim() !== "") ||
      (this.deweyUnabridgedSearchItem.term != null &&
        this.deweyUnabridgedSearchItem.term.trim() !== "") ||
      (this.deweyAbridgedSearchItem.term != null &&
        this.deweyAbridgedSearchItem.term.trim() !== "") ||
      (this.issnSearchItem.term != null &&
        this.issnSearchItem.term.trim() !== "") ||
      (this.anscrSearchItem.term != null &&
        this.anscrSearchItem.term.trim() !== "") ||
      (this.subjectSearchItem.term != null &&
        this.subjectSearchItem.term.trim() !== "")
    ) {
      if (
        this.start != null &&
        this.start !== "" &&
        this.end != null &&
        this.end !== ""
      ) {
        return (
          this.end.length === 4 &&
          this.start.length === 4 &&
          this.end >= this.start
        );
      } else if (
        this.start != null &&
        this.start !== "" &&
        this.start.length === 4
      ) {
        return true;
      } else if (
        (this.start === undefined ||
          this.start === null ||
          this.start === "") &&
        (this.end === undefined || this.end === null || this.end === "")
      ) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  PubDateValidation() {
    if (this.start && this.end) {
      if (this.end.length > 0 && this.start.length > 0) {
        if (this.end.length === 4) {
          if (this.start.length === 4) {
            if (this.start > this.end) {
              this.isPubDateBothValid = false;
              this.isPubDateEndValid = true;
              this.isPubDateStartValid = true;
            } else {
              this.isPubDateEndValid = true;
              this.isPubDateStartValid = true;
              this.isPubDateBothValid = true;
            }
          } else {
            this.isPubDateEndValid = true;
            this.isPubDateStartValid = false;
            this.isPubDateBothValid = true;
          }
        } else {
          this.isPubDateEndValid = false;
          this.isPubDateBothValid = true;
          if (this.start.length === 4) {
            this.isPubDateStartValid = true;
          } else {
            this.isPubDateStartValid = false;
          }
        }
      } else {
        if (this.end.length > 0) {
          if (this.end.length === 4) {
            this.isPubDateEndValid = true;
            this.isPubDateStartValid = false;
          } else {
            this.isPubDateEndValid = false;
            this.isPubDateStartValid = false;
          }
        } else {
          if (this.start.length === 4) {
            this.isPubDateEndValid = true;
            this.isPubDateStartValid = true;
          } else {
            this.isPubDateEndValid = true;
            this.isPubDateStartValid = false;
          }
        }
      }
    } else {
      if (this.end) {
        if (this.end.length === 4) {
          this.isPubDateEndValid = true;
          this.isPubDateStartValid = false;
          this.isPubDateBothValid = true;
        } else {
          this.isPubDateEndValid = false;
          this.isPubDateStartValid = false;
        }
      } else {
        this.isPubDateEndValid = true;
        this.isPubDateBothValid = true;
        if (this.start) {
          if (this.start.length === 4 || this.start.length === 0) {
            this.isPubDateStartValid = true;
          } else {
            this.isPubDateStartValid = false;
          }
        } else {
          this.isPubDateStartValid = true;
        }
      }
    }
  }

  getz3950searchRecords(filterItems: any, event: any) {
    this.showSearchResult = false;
    this.basicSearchRequest = new BasicSearchRequest();
    this.basicSearchRequest.SearchRequest = [];
    this.basicSearchResponse = [];
    this.z3950SearchRequest = new Z3950SearchRequest();
    this.z3950SearchRequest.Profiles = [];
    this.z3950SearchRequest.SearchRequest = [];
    this.authoritySearchResponse = [];

    for (var i = 0; i < this.searchItems.length; i++) {
      switch (this.searchItems[i].fieldName) {
        case this.isbnSearchItem.searchBy:
          if (
            this.isbnSearchItem.term != null &&
            this.isbnSearchItem.term.trim() !== ""
          ) {
            this.isbnSearchItem.facetValue = null;
            if (event.facetVal) {
              this.isbnSearchItem.facetValue = event.facetVal;
            }
            this.z3950SearchRequest.SearchRequest.push(this.isbnSearchItem);
          }
          break;
        case this.titleSearchItem.searchBy:
          if (
            this.titleSearchItem.term != null &&
            this.titleSearchItem.term.trim() !== ""
          ) {
            this.titleSearchItem.facetValue = null;
            if (event.facetVal) {
              this.titleSearchItem.facetValue = event.facetVal;
            }
            this.z3950SearchRequest.SearchRequest.push(this.titleSearchItem);
          }
          break;
        case this.upcSearchItem.searchBy:
          if (
            this.upcSearchItem.term != null &&
            this.upcSearchItem.term.trim() !== ""
          ) {
            this.upcSearchItem.facetValue = null;
            if (event.facetVal) {
              this.upcSearchItem.facetValue = event.facetVal;
            }
            this.z3950SearchRequest.SearchRequest.push(this.upcSearchItem);
          }
          break;
        case this.anscrSearchItem.searchBy:
          if (
            this.anscrSearchItem.term != null &&
            this.anscrSearchItem.term.trim() !== ""
          ) {
            this.anscrSearchItem.facetValue = null;
            if (event.facetVal) {
              this.anscrSearchItem.facetValue = event.facetVal;
            }
            this.z3950SearchRequest.SearchRequest.push(this.anscrSearchItem);
          }
          break;
        case this.keywordSearchItem.searchBy:
          if (
            this.keywordSearchItem.term != null &&
            this.keywordSearchItem.term.trim() !== ""
          ) {
            this.keywordSearchItem.facetValue = null;
            if (event.facetVal) {
              this.keywordSearchItem.facetValue = event.facetVal;
            }
            this.z3950SearchRequest.SearchRequest.push(this.keywordSearchItem);
          }
          break;
        case this.authorSearchItem.searchBy:
          if (
            this.authorSearchItem.term != null &&
            this.authorSearchItem.term.trim() !== ""
          ) {
            this.authorSearchItem.facetValue = null;
            if (event.facetVal) {
              this.authorSearchItem.facetValue = event.facetVal;
            }
            this.z3950SearchRequest.SearchRequest.push(this.authorSearchItem);
          }
          break;
        case this.recordControlNumberSearchItem.searchBy:
          if (
            this.recordControlNumberSearchItem.term != null &&
            this.recordControlNumberSearchItem.term.trim() !== ""
          ) {
            this.recordControlNumberSearchItem.facetValue = null;
            if (event.facetVal) {
              this.recordControlNumberSearchItem.facetValue = event.facetVal;
            }
            this.z3950SearchRequest.SearchRequest.push(this.recordControlNumberSearchItem);
          }
          break;
        case this.deweyUnabridgedSearchItem.searchBy:
          if (
            this.deweyUnabridgedSearchItem.term != null &&
            this.deweyUnabridgedSearchItem.term.trim() !== ""
          ) {
            this.deweyUnabridgedSearchItem.facetValue = null;
            if (event.facetVal) {
              this.deweyUnabridgedSearchItem.facetValue = event.facetVal;
            }
            this.z3950SearchRequest.SearchRequest.push(this.deweyUnabridgedSearchItem);
          }
          break;
        case this.subjectSearchItem.searchBy:
          if (
            this.subjectSearchItem.term != null &&
            this.subjectSearchItem.term.trim() !== ""
          ) {
            this.subjectSearchItem.facetValue = null;
            if (event.facetVal) {
              this.subjectSearchItem.facetValue = event.facetVal;
            }
            this.z3950SearchRequest.SearchRequest.push(this.subjectSearchItem);
          }
          break;
        case this.databaseRecordNumberSearchItem.searchBy:
          if (
            this.databaseRecordNumberSearchItem.term != null &&
            this.databaseRecordNumberSearchItem.term.trim() !== ""
          ) {
            this.databaseRecordNumberSearchItem.facetValue = null;
            if (event.facetVal) {
              this.databaseRecordNumberSearchItem.facetValue = event.facetVal;
            }
            this.z3950SearchRequest.SearchRequest.push(this.databaseRecordNumberSearchItem);
          }
          break;
        case this.deweyAbridgedSearchItem.searchBy:
          if (
            this.deweyAbridgedSearchItem.term != null &&
            this.deweyAbridgedSearchItem.term.trim() !== ""
          ) {
            this.deweyAbridgedSearchItem.facetValue = null;
            if (event.facetVal) {
              this.deweyAbridgedSearchItem.facetValue = event.facetVal;
            }
            this.z3950SearchRequest.SearchRequest.push(
              this.deweyAbridgedSearchItem
            );
          }
          break;
        case this.lcClassificationSearchItem.searchBy:
          if (
            this.lcClassificationSearchItem.term != null &&
            this.lcClassificationSearchItem.term.trim() !== ""
          ) {
            this.lcClassificationSearchItem.facetValue = null;
            if (event.facetVal) {
              this.lcClassificationSearchItem.facetValue = event.facetVal;
            }
            this.z3950SearchRequest.SearchRequest.push(
              this.lcClassificationSearchItem
            );
          }
          break;
        case this.issnSearchItem.searchBy:
          if (
            this.issnSearchItem.term != null &&
            this.issnSearchItem.term.trim() !== ""
          ) {
            this.issnSearchItem.facetValue = null;
            if (event.facetVal) {
              this.issnSearchItem.facetValue = event.facetVal;
            }
            this.z3950SearchRequest.SearchRequest.push(this.issnSearchItem);
          }
          break;
        case this.lccnSearchItem.searchBy:
          if (
            this.lccnSearchItem.term != null &&
            this.lccnSearchItem.term.trim() !== ""
          ) {
            this.lccnSearchItem.facetValue = null;
            if (event.facetVal) {
              this.lccnSearchItem.facetValue = event.facetVal;
            }
            this.z3950SearchRequest.SearchRequest.push(this.lccnSearchItem);
          }
          break;
        case this.publisherSearchItem.searchBy:
          if (
            this.publisherSearchItem.term != null &&
            this.publisherSearchItem.term.trim() !== ""
          ) {
            this.publisherSearchItem.facetValue = null;
            if (event.facetVal) {
              this.publisherSearchItem.facetValue = event.facetVal;
            }
            this.z3950SearchRequest.SearchRequest.push(
              this.publisherSearchItem
            );
          }
          break;
        case this.seriesSearchItem.searchBy:
          if (
            this.seriesSearchItem.term != null &&
            this.seriesSearchItem.term.trim() !== ""
          ) {
            this.seriesSearchItem.facetValue = null;
            if (event.facetVal) {
              this.seriesSearchItem.facetValue = event.facetVal;
            }
            this.z3950SearchRequest.SearchRequest.push(this.seriesSearchItem);
          }
          break;
        case this.pubdateSearchItem.searchBy:
          if (this.start != null && this.start !== "") {
            if (this.end == undefined || this.end === null || this.end === "") {
              this.end = "";
            }
            this.pubdateSearchItem.term = this.start;
            this.pubdateSearchItem.facetValue = null;
            if (event.facetVal) {
              this.pubdateSearchItem.facetValue = event.facetVal;
            }
            this.z3950SearchRequest.SearchRequest.push(this.pubdateSearchItem);
          }
          break;
        case this.titleorauthorSearchItem.searchBy:
          if (this.titleorauthorSearchItem.term != null && this.titleorauthorSearchItem.term.trim() !== "") {

            this.titleorauthorSearchItem.facetValue = null;
            if (event.facetVal) {
              this.titleorauthorSearchItem.facetValue = event.facetVal;
            }
            this.z3950SearchRequest.SearchRequest.push(this.titleorauthorSearchItem);
          }
          break;
      }
    }

    if (this.z3950SearchRequest.SearchRequest.length > 0) {
      var data = localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS);
      this.catalogRequest = JSON.parse(data);

      for (let i = 0; i < filterItems.length; i++) {
        this.z3950SearchRequest.Profiles.push(
          this.catalogRequest.find(
            x => x.profileName === filterItems[i].profileName
          )
        );
      }
      this.SearchType = this.z3950SearchRequest.SearchRequest[0].searchBy;
      this.getZ3950SearchResultFromService(this.z3950SearchRequest, true);
    }
  }

  setSearchClicked() {
    localStorage.setItem("SearchClicked", "true");
  }

  getBasicSearchRecords(event, searchHistorySave = false, isFacetSearch = false) {
    const catalogIds = ["12","11", "4", "5", "6", "7", "8", "9", "10"];
    //Clearing the db record numbers if bib or auth search is performing instead of facet search
    if (!isFacetSearch) {
      this.dbRecNumSearchReq = [];
      localStorage.setItem(Constants.LocalStorage.DBRECSEARCHRQ, JSON.stringify(this.dbRecNumSearchReq));
    }
    localStorage.removeItem(Constants.LocalStorage.CLEARSEARCH);
    var items = JSON.parse(
      localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS)
    );
    if (items != null && items.length > 0) {
      var filterItems = items.filter(
        x =>
          x.isActive &&
          ((x.profileName == "B & T" && this.hasSearchMainPermission) ||
            (x.profileName == "BTCAT Workspace" && this.hasSearchWorkspacePermission) ||
            x.profileName == "BTCAT Authority Main" ||
            (x.profileName === Constants.DELETEDDBPROFILENAME && (this.hasSearchDeleteMainRecordsPermission || this.hasSearchDeleteWSRecordsPermission ||
              this.hasSearchCustomerDelWSPermission || this.hasSearchDelRecordsPermission)) ||
            (catalogIds.indexOf(x.id) > -1))
      );
      if (filterItems != null && filterItems.length > 0) {
        this.getBTCATSearchRecords(event, searchHistorySave);
      } else {
        var filterItems = items.filter(
          x =>
            x.isActive &&
            this.defaultCatalogIds.indexOf(x.id) === -1
        );

        this.getz3950searchRecords(filterItems, event);
      }
    }
  }

  getBTCATSearchRecords(event, searchHistorySave = false) {
    this.showSearchResult = false;
    this.basicSearchRequest = new BasicSearchRequest();
    this.basicSearchRequest.SearchRequest = [];
    this.basicSearchResponse = [];
    this.authoritySearchResponse = [];

    //looping through the searchItems list to push the search items to search request
    //as in the search history, items should be displayed in same order(bug no: 2490)
    for (var i = 0; i < this.searchItems.length; i++) {
      switch (this.searchItems[i].fieldName) {
        case this.isbnSearchItem.searchBy:
          if (
            this.isbnSearchItem.term != null &&
            this.isbnSearchItem.term.trim() !== ""
          ) {
            this.isbnSearchItem.facetValue = null;
            if (event.facetVal) {
              this.isbnSearchItem.facetValue = event.facetVal;
            }
            this.basicSearchRequest.SearchRequest.push(this.isbnSearchItem);
          }
          break;
        case this.upcSearchItem.searchBy:
          if (
            this.upcSearchItem.term != null &&
            this.upcSearchItem.term.trim() !== ""
          ) {
            this.upcSearchItem.facetValue = null;
            if (event.facetVal) {
              this.upcSearchItem.facetValue = event.facetVal;
            }
            this.basicSearchRequest.SearchRequest.push(this.upcSearchItem);
          }
          break;
        case this.titleSearchItem.searchBy:
          if (
            this.titleSearchItem.term != null &&
            this.titleSearchItem.term.trim() !== ""
          ) {
            this.titleSearchItem.facetValue = null;
            if (event.facetVal) {
              this.titleSearchItem.facetValue = event.facetVal;
            }
            this.basicSearchRequest.SearchRequest.push(this.titleSearchItem);
          }
          break;
        case this.keywordSearchItem.searchBy:
          if (
            this.keywordSearchItem.term != null &&
            this.keywordSearchItem.term.trim() !== ""
          ) {
            this.keywordSearchItem.facetValue = null;
            if (event.facetVal) {
              this.keywordSearchItem.facetValue = event.facetVal;
            }
            this.basicSearchRequest.SearchRequest.push(this.keywordSearchItem);
          }
          break;
        case this.authorSearchItem.searchBy:
          if (
            this.authorSearchItem.term != null &&
            this.authorSearchItem.term.trim() !== ""
          ) {
            this.authorSearchItem.facetValue = null;
            if (event.facetVal) {
              this.authorSearchItem.facetValue = event.facetVal;
            }
            this.basicSearchRequest.SearchRequest.push(this.authorSearchItem);
          }
          break;
        case this.titleorauthorSearchItem.searchBy:
          if (
            this.titleorauthorSearchItem.term != null &&
            this.titleorauthorSearchItem.term.trim() !== ""
          ) {
            this.titleorauthorSearchItem.facetValue = null;
            if (event.facetVal) {
              this.titleorauthorSearchItem.facetValue = event.facetVal;
            }
            this.basicSearchRequest.SearchRequest.push(
              this.titleorauthorSearchItem
            );
          }
          break;
        case this.seriesSearchItem.searchBy:
          if (
            this.seriesSearchItem.term != null &&
            this.seriesSearchItem.term.trim() !== ""
          ) {
            this.seriesSearchItem.facetValue = null;
            if (event.facetVal) {
              this.seriesSearchItem.facetValue = event.facetVal;
            }
            this.basicSearchRequest.SearchRequest.push(this.seriesSearchItem);
          }
          break;
        case this.recordControlNumberSearchItem.searchBy:
          if (
            this.recordControlNumberSearchItem.term != null &&
            this.recordControlNumberSearchItem.term.trim() !== ""
          ) {
            this.recordControlNumberSearchItem.facetValue = null;
            if (event.facetVal) {
              this.recordControlNumberSearchItem.facetValue = event.facetVal;
            }
            this.basicSearchRequest.SearchRequest.push(
              this.recordControlNumberSearchItem
            );
          }
          break;
        case this.lccnSearchItem.searchBy:
          if (
            this.lccnSearchItem.term != null &&
            this.lccnSearchItem.term.trim() !== ""
          ) {
            this.lccnSearchItem.facetValue = null;
            if (event.facetVal) {
              this.lccnSearchItem.facetValue = event.facetVal;
            }
            this.basicSearchRequest.SearchRequest.push(this.lccnSearchItem);
          }
          break;
        case this.lcClassificationSearchItem.searchBy:
         if (
            this.lcClassificationSearchItem.term != null &&
            this.lcClassificationSearchItem.term.trim() !== ""
          ) {
            this.lcClassificationSearchItem.facetValue = null;
            if (event.facetVal) {
              this.lcClassificationSearchItem.facetValue = event.facetVal;
            }
            this.basicSearchRequest.SearchRequest.push(
              this.lcClassificationSearchItem
            );
          }
          break;
        case this.publisherSearchItem.searchBy:
          if (
            this.publisherSearchItem.term != null &&
            this.publisherSearchItem.term.trim() !== ""
          ) {
            this.publisherSearchItem.facetValue = null;
            if (event.facetVal) {
              this.publisherSearchItem.facetValue = event.facetVal;
            }
            this.basicSearchRequest.SearchRequest.push(
              this.publisherSearchItem
            );
          }
          break;
        case this.pubdateSearchItem.searchBy:
          if (this.start != null && this.start !== "") {
            if (this.end == undefined || this.end === null || this.end === "") {
              this.end = "";
            }
            this.pubdateSearchItem.term = this.start + "," + this.end;
            this.pubdateSearchItem.facetValue = null;
            if (event.facetVal) {
              this.pubdateSearchItem.facetValue = event.facetVal;
            }
            this.basicSearchRequest.SearchRequest.push(this.pubdateSearchItem);
          }
          break;
        case this.databaseRecordNumberSearchItem.searchBy:
          if (
            this.databaseRecordNumberSearchItem.term != null &&
            this.databaseRecordNumberSearchItem.term.trim() !== ""
          ) {
            this.databaseRecordNumberSearchItem.facetValue = null;
            if (event.facetVal) {
              this.databaseRecordNumberSearchItem.facetValue = event.facetVal;
            }
            this.basicSearchRequest.SearchRequest.push(
              this.databaseRecordNumberSearchItem
            );
          }
          break;
        case this.deweyAbridgedSearchItem.searchBy:
          if (
            this.deweyAbridgedSearchItem.term != null &&
            this.deweyAbridgedSearchItem.term.trim() !== ""
          ) {
            this.deweyAbridgedSearchItem.facetValue = null;
            if (event.facetVal) {
              this.deweyAbridgedSearchItem.facetValue = event.facetVal;
            }
            this.basicSearchRequest.SearchRequest.push(
              this.deweyAbridgedSearchItem
            );
          }
          break;
        case this.deweyUnabridgedSearchItem.searchBy:
          if (
            this.deweyUnabridgedSearchItem.term != null &&
            this.deweyUnabridgedSearchItem.term.trim() !== ""
          ) {
            this.deweyUnabridgedSearchItem.facetValue = null;
            if (event.facetVal) {
              this.deweyUnabridgedSearchItem.facetValue = event.facetVal;
            }
            this.basicSearchRequest.SearchRequest.push(
             this.deweyUnabridgedSearchItem
            );
          }
          break;
        case this.anscrSearchItem.searchBy:
          if (
            this.anscrSearchItem.term != null &&
            this.anscrSearchItem.term.trim() !== ""
          ) {
            this.anscrSearchItem.facetValue = null;
            if (event.facetVal) {
              this.anscrSearchItem.facetValue = event.facetVal;
            }
            this.basicSearchRequest.SearchRequest.push(this.anscrSearchItem);
          }
          break;
        case this.issnSearchItem.searchBy:
          if (
            this.issnSearchItem.term != null &&
            this.issnSearchItem.term.trim() !== ""
          ) {
            this.issnSearchItem.facetValue = null;
            if (event.facetVal) {
              this.issnSearchItem.facetValue = event.facetVal;
            }
            this.basicSearchRequest.SearchRequest.push(this.issnSearchItem);
          }
          break;
        case this.subjectSearchItem.searchBy:
          if (
            this.subjectSearchItem.term != null &&
            this.subjectSearchItem.term.trim() !== ""
          ) {
            this.subjectSearchItem.facetValue = null;
            if (event.facetVal) {
              this.subjectSearchItem.facetValue = event.facetVal;
            }
            this.basicSearchRequest.SearchRequest.push(this.subjectSearchItem);
          }
          break;
      }
    }
    if (this.basicSearchRequest.SearchRequest.length > 0) {
      //resetting auth search to false which is becoming true when we click auth rec link in the auth search page
      this.basicSearchRequest.SearchRequest.forEach(a => a.authSearch = false);

      this.getBasicSearchResultFromService(event, searchHistorySave);
    }
  }

  newRecordClick() {
    if (this.hasAccessAny([Permissions.CRT_BIB_MN, Permissions.CRT_BIB_WS])) {
      localStorage.removeItem(Constants.LocalStorage.FILTERPARAMS);
      if (!(window.location.href.search("new-record") > 0)) {
        this.router.navigate(["/new-record"]);
      }
      else {
        window.location.reload();
      }
    }

  }

  // Basic search call
  getZ3950SearchResultFromService(request: Z3950SearchRequest, searchHistorySave = false) {
    // request.Profiles[0].NonEncrypt = false;
    request.Profiles.forEach(x => {
      x.NonEncrypt = false;
    });
    // store search criteria to local storage
    localStorage.setItem(Constants.LocalStorage.SEARCHZ3950REQUEST, JSON.stringify(request));

    localStorage.removeItem(Constants.LocalStorage.BIBSEARCHREQUEST);
    localStorage.removeItem(Constants.LocalStorage.AUTHSEARCHREQUEST);

    if (
      window.location.href.search("bibliographic-edit") > 0 ||
      window.location.href.search("compare-view") > 0 ||
      window.location.href.search("authority-view") > 0 ||
      window.location.href.search("z3950") > 0 ||
      window.location.href.search("authority-search") > 0 ||
      window.location.href.search("templates") > 0 ||
      window.location.href.search("create-template") > 0 ||
      window.location.href.search("clone-template") > 0 ||
      window.location.href.search("edit-template") > 0 ||
      window.location.href.search("bibliographic-clone") > 0 ||
      window.location.href.search("bibliographic-create") > 0 ||
      window.location.href.search("new-record") > 0 ||
      window.location.href.search("record-history") > 0 ||
      window.location.href.search("merge-marc") > 0 ||
      window.location.href.search("users") > 0 ||
      window.location.href.search("z3950-edit") > 0 ||
      window.location.href.search("z3950-clone") > 0 ||
      window.location.href.search("myPreferences") > 0 ||
      window.location.href.search("save_batch_macro_execution") > 0 ||
      window.location.href.search("marc-extract") > 0 ||
      window.location.href.search("customer-name-map") > 0 ||
      window.location.href.search("cls-configuration") > 0 ||
      window.location.href.search("account-suffix-configuration") > 0 ||
      window.location.href.search("cls-label-configuration") > 0 ||
      window.location.href.search("upload-record") > 0 ||
      window.location.href.search("batch-macro-execution") > 0 ||
      window.location.href.search("extract") > 0 ||
      window.location.href.search("ats-review") > 0 ||
      window.location.href.search("env-settings") >0 ||
      window.location.href.search("env-settings-crud") > 0 ||
      window.location.href.search("multiple-edit") > 0 ||
      window.location.href.search("macro-admin") > 0
    ) {
      this.router.navigate(["/search"]);
    } else {

      //this.spinnerService.onRequestStarted();
      if (searchHistorySave) {
        this.saveSearchHistory(request.SearchRequest);
      }
      this.startSpinner(true);
      request.PageSize = 5;
      request.PageIndex = 0;
      this.startSpinner(true);
      this.service.getAllZ3950SearchResult(request).subscribe(validResults => {
        this.startSpinner(false);
        this.basicSearchResponse = [];
        this.facetResponse = null;
        //this.spinnerService.onRequestFinished();
        if (
          validResults && validResults.length > 0) {
          (validResults).forEach(validResult => {
            if (validResult && validResult.MarcRecords && validResult.MarcRecords.length > 0) {
              Array.prototype.push.apply(this.basicSearchResponse, validResult.MarcRecords);
            }
          });
        }
        if (!(this.basicSearchResponse && this.basicSearchResponse.length > 0)) {
          this.basicSearchResponse = null;
        }
        this.emitZ3950SearchResult();
      });
    }
  }

  // Basic search call
  getBasicSearchResultFromService(facetEvent, searchHistorySave = false) {
    if (!this.basicSearchRequest.SearchRequest[0].facetValue) {
      this.commonService.selectedFacetValues = []; // shouldn't make it empty if the search request is having facet values.
    }

    // store search criteria to local storage based on Heading (auth or bib search)
    if (this.basicSearchRequest.SearchRequest[0].type != "Heading") {
      localStorage.setItem(Constants.LocalStorage.CURRENTSEARCH, "basicsearch");
      localStorage.setItem(
        Constants.LocalStorage.BIBSEARCHREQUEST,
        JSON.stringify(this.basicSearchRequest)
      );
    }
    else {
      if (localStorage.getItem(Constants.LocalStorage.CURRENTSEARCH) !== "fromAuthToBasic") {
        localStorage.setItem(Constants.LocalStorage.CURRENTSEARCH, "authsearch");
        localStorage.setItem(
          Constants.LocalStorage.AUTHSEARCHREQUEST,
          JSON.stringify(this.basicSearchRequest)
        );

      }
    }
    if (
      window.location.href.search("bibliographic-edit") > 0 ||
      window.location.href.search("compare-view") > 0 ||
      window.location.href.search("authority-view") > 0 ||
      window.location.href.search("z3950") > 0 ||
      window.location.href.search("authority-search") > 0 ||
      window.location.href.search("templates") > 0 ||
      window.location.href.search("create-template") > 0 ||
      window.location.href.search("clone-template") > 0 ||
      window.location.href.search("edit-template") > 0 ||
      window.location.href.search("bibliographic-clone") > 0 ||
      window.location.href.search("bibliographic-create") > 0 ||
      window.location.href.search("new-record") > 0 ||
      window.location.href.search("record-history") > 0 ||
      window.location.href.search("merge-marc") > 0 ||
      window.location.href.search("users") > 0 ||
      window.location.href.search("z3950-edit") > 0 ||
      window.location.href.search("z3950-clone") > 0 ||
      window.location.href.search("myPreferences") > 0 ||
      window.location.href.search("save_batch_macro_execution") > 0 ||
      window.location.href.search("marc-extract") > 0 ||
      window.location.href.search("customer-name-map") > 0 ||
      window.location.href.search("cls-configuration") > 0 ||
      window.location.href.search("account-suffix-configuration") > 0 ||
      window.location.href.search("cls-label-configuration") > 0 ||
      window.location.href.search("upload-record") > 0 ||
      window.location.href.search("batch-macro-execution") > 0 ||
      window.location.href.search("extract") > 0 ||
      window.location.href.search("ats-review") > 0 ||
      window.location.href.search("env-settings") > 0 ||
      window.location.href.search("env-settings-crud") > 0 ||
      window.location.href.search("multiple-edit") > 0 ||
      window.location.href.search("macro-admin") > 0
   ) {
      this.router.navigate(["/search"]);
    } else {

      if (searchHistorySave) {
        this.saveSearchHistory(this.basicSearchRequest.SearchRequest);
      }

      this.spinnerService.spinnerStart();
      this.dbRecNumSearchReq = JSON.parse(localStorage.getItem(Constants.LocalStorage.DBRECSEARCHRQ));
      //when redirected to search from auth search need to filter the data only based on the DATABASE_RECORD_NUMBER search req
      //and store this and use later to add the same to facet search req whenever facets links clicked
      if (localStorage.getItem(Constants.LocalStorage.CURRENTSEARCH) == "fromAuthToBasic") {
        this.basicSearchRequest.SearchRequest = this.basicSearchRequest.SearchRequest.filter(a => a.searchBy == Constants.Search.DATABASE_RECORD_NUMBER);
        this.dbRecNumSearchReq = this.basicSearchRequest.SearchRequest;
        localStorage.setItem(Constants.LocalStorage.CURRENTSEARCH, "basicsearch");
      }

      //if search not contains heading or having the dbrecordsearch request then do the Bib search otherwise do the auth search
      if ((this.basicSearchRequest && this.basicSearchRequest.SearchRequest.length > 0 && this.basicSearchRequest.SearchRequest[0].type != "Heading") || (this.dbRecNumSearchReq && this.dbRecNumSearchReq.length > 0)) {
        //Do the search only with dbrecordsearch reuest
        if (this.dbRecNumSearchReq && this.dbRecNumSearchReq.length > 0) {
          this.dbRecNumSearchReq[0].facetValue = this.basicSearchRequest.SearchRequest[0].facetValue;
          localStorage.setItem(Constants.LocalStorage.DBRECSEARCHRQ, JSON.stringify(this.dbRecNumSearchReq));
          this.startSpinner(true);

          this.service
            .basicSearch(this.dbRecNumSearchReq)
            .subscribe(validResult => {

              this.startSpinner(false);
              this.spinnerService.spinnerStop();

              if (
                validResult &&
                validResult.MarcRecords &&
                validResult.MarcRecords.length > 0
              ) {
                this.basicSearchResponse = validResult.MarcRecords;
                this.facetResponse = validResult.Facets;
              } else {
                this.basicSearchResponse = null;
                this.facetResponse = null;
              }
              this.authoritySearchResponse = null;
              this.emitSearchResult();
            },
              (error) => {
                if (error.status == 403) {
                  //this.displayUnAuthMessage = true;
                  this.spinnerService.spinnerStop();
                  alert(error.statusText);
                }
                else {
                  this.spinnerService.spinnerStop();
                  throw (error);
                }
              });

        }
        else { //Do the search with the search request aprt from the dbrecsearch
          this.startSpinner(true);

          var saveCatalogs = JSON.parse(localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS));
          if (saveCatalogs.filter(element => element.profileName == Constants.DELETEDDBPROFILENAME && element.isActive).length === 1) {
            const permissionsData = this.currentUser.Permissions.filter(x => x === Permissions.SRCH_DEL_MAIN || x === Permissions.SRCH_DEL_WS
              || x === Permissions.SRCH_CUST_WSPACE_DEL_RECS || x === Permissions.ACC_REC);
            this.basicSearchRequest.SearchRequest[0].UserPermissions = permissionsData;
          } else {
            this.basicSearchRequest.SearchRequest[0].UserPermissions = [];
          }

          if (this.selectedCatalogs()) {
            this.basicSearchRequest.SearchRequest[0].profiles = this.selectedCatalogs();
            this.basicSearchRequest.SearchRequest[0].customerId = this.currentCustomerId;
          }
          this.service
           .basicSearch(this.basicSearchRequest.SearchRequest)
            .subscribe(validResult => {
              this.startSpinner(false);
              //this.spinnerService.onRequestFinished();
              if (
                validResult &&
                validResult.MarcRecords &&
                validResult.MarcRecords.length > 0
              ) {

                this.basicSearchResponse = validResult.MarcRecords;
                this.facetResponse = validResult.Facets;
              } else {
               this.basicSearchResponse = null;
                this.facetResponse = null;
              }
             this.authoritySearchResponse = null;
              this.emitSearchResult();
            },
              (error) => {
                if (error.status == 403) {
                  //this.displayUnAuthMessage = true;
                  this.spinnerService.spinnerStop();
                  alert(error.statusText);
                }
                else {
                  this.spinnerService.spinnerStop();
                  throw (error);
                }
              });
        }
      }
      else {
        //// Redirect to auth search page to perform auth search and show the results
        this.router.navigate([
          "/authority-search/"
        ]);
        //}
      }
    }
  }
  //get selected catalogs
  selectedCatalogs() {
    const catalogIds = ["12","11", "4", "5", "6", "7", "8", "9", "10"];
    var selectedProfiles: string[] = [];
    //get availabel profiles
    var items = JSON.parse(
      localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS)
    );
    //get selected profiles
    var filterItems = items.filter(
      x =>
        x.isActive && ((x.profileName === "B & T" && this.hasSearchMainPermission) ||
          (x.profileName === "BTCAT Workspace" && this.hasSearchWorkspacePermission) ||
            (x.profileName === Constants.DELETEDDBPROFILENAME && (this.hasSearchDeleteMainRecordsPermission || this.hasSearchDeleteWSRecordsPermission ||
              this.hasSearchCustomerDelWSPermission || this.hasSearchDelRecordsPermission)) ||
          (catalogIds.indexOf(x.id) > -1))
    );
    for (let i = 0; i < filterItems.length; i++) {
      selectedProfiles.push(filterItems[i].profileName);
    }
    return selectedProfiles;
  }
  emitSearchResult() {
    this.sendSearchResult.emit({
      basicSearchResponse: this.basicSearchResponse,
      facetResponse: this.facetResponse,
      hideSearchItem: this.hideSearchItem
    });
  }

  emitAuthoritySearchResult() {
    this.sendAuthoritySearchResult.emit({
      authoritySearchResponse: this.authoritySearchResponse,
      hideSearchItem: this.hideSearchItem
    });
  }

  emitZ3950SearchResult() {
    this.sendZ3950SearchResult.emit({
      basicSearchResponse: this.basicSearchResponse,
      facetResponse: null,
      hideSearchItem: this.hideSearchItem
    });
  }

  saveSearchHistory(data: BasicSearch[]) {
    if (data.length > 0) {
      var filterItems: any;
      var items = JSON.parse(
        localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS)
      );
      if (items != null && items.length > 0) {
        filterItems = items.filter(
          x =>
            x.isActive
        );
      }
      let searchCriteriaList = [];
      let catalogsList = [];

      if (filterItems != null && filterItems.length > 0) {
        filterItems.forEach(item => {
          catalogsList.push(item.profileName);
        });
      } else {
        if (data[0].type == "Heading") {
          catalogsList.push("BTCAT Authority Main");
        }
        else {
          catalogsList.push("BTCAT Workspace");
          catalogsList.push("B & T");
        }
      }

      data.forEach(field => {
        let searchCriteria = new SearchCriteriaData();
        searchCriteria.searchField = field.searchBy;
        searchCriteria.searchTerm = field.term.trim();
        searchCriteria.searchType = field.type ? field.type : null;
        searchCriteriaList.push(searchCriteria);
      });
      let requestobj = {
        userId:
          localStorage.getItem(Constants.LocalStorage.USERNAME) != null &&
            localStorage.getItem(Constants.LocalStorage.USERNAME) != ""
            ? localStorage.getItem(Constants.LocalStorage.USERNAME)
            : null,
        searchOperations: [
          {
            searchCriteria: searchCriteriaList,
            catalogs: catalogsList,
            modifiers: ""
          }
        ]
      };
      this.service.saveSearchHistory(requestobj).subscribe(result => {
        //success
      });
    }
  }
  getFacetValue($event) {
    //If the search request have the heading then set isFacetSearch to true to not clear the dbrecsearch data for adding facets to search request
    //Else set to false to clear dbrecsearch request to perfomr bib/auth search
    if (JSON.parse(localStorage.getItem(Constants.LocalStorage.BIBSEARCHREQUEST)).SearchRequest.find(a => a.type == "Heading"))
      this.getBasicSearchRecords($event, false, true);
    else
      this.getBasicSearchRecords($event);
  }

  startSpinner(showflag: boolean) {
    this.showSpinner.emit(showflag);
  }

  showSearchField(searchItemId: string, term: string, filterItem: any) {
    if (searchItemId != term) {
      return false;
    }

    var items = JSON.parse(
      localStorage.getItem(Constants.LocalStorage.ADDMORESETTINGS)
    );
    if (items != null && items.length > 0) {
      var item = items.find(x => x.id === term);

      var filterItems = items.filter(x => x.isChecked);
      var itemIndex = filterItems.indexOf(item);
      var isShow = false;
      if (this.IsShowToggleIcon && item != null) {
        isShow = itemIndex > -1 ? true : false;

        if (filterItem && (item.isChecked && isShow) == false) {

          filterItem.term = "";
        } else if (
          term == "AddMorePubDate" &&
          (item.isChecked && isShow) == false
        ) {
          this.start = "";
          this.end = "";
        }
        return item.isChecked && isShow;
      } else if (item != null && !this.IsShowToggleIcon) {
        isShow = itemIndex > 4 ? true : false;

        if (filterItem && (item.isChecked && !isShow) == false) {
          // filterItem.term = ""; fix for 3184
        } else if (
          term == "AddMorePubDate" &&
          (item.isChecked && !isShow) == false
        ) {
          this.start = "";
          this.end = "";
        }

        return item.isChecked && !isShow;
      }
      //else if (item != null) return item.isChecked;
    }
    return false;
  }
  loadSearchData(data: any) {
    let searchReq = [];
    this.searchItems = JSON.parse(
      localStorage.getItem(Constants.LocalStorage.ADDMORESETTINGS)
    );
    if (data && data.searchCriteria) {
      this.clearSearch();
      data.searchCriteria.forEach(element => {
        let basicSearch = new BasicSearch();
        basicSearch.searchBy = element.searchField;
        basicSearch.term = element.searchTerm;
        basicSearch.type = element.searchType;
        searchReq.push(basicSearch);
        if (this.searchItems && this.searchItems != null) {
          let fieldItemIndex = this.searchItems.findIndex(
            a => a.fieldName == element.searchField
          );
          if (
            fieldItemIndex > -1 &&
            this.searchItems[fieldItemIndex] &&
            !this.searchItems[fieldItemIndex].isChecked
          ) {
            this.searchItems[fieldItemIndex].isChecked = true;
          }
        }
      });
      localStorage.setItem(
        Constants.LocalStorage.ADDMORESETTINGS,
        JSON.stringify(this.searchItems)
      );
      let items = this.searchItems;
      if (
        items &&
        items.filter(x => x.isChecked === true).length > 5 &&
        this.hideSearchItem === true
      ) {
        this.searchExpandorCollapse();
      }
      var catalogs = JSON.parse(
        localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS)
      );

      catalogs.forEach(catalog => {
        catalog.isActive = false;
        data.catalogs.forEach(data => {
          if (catalog.profileName === data && (!(data === "B & T" || data === "BTCAT Workspace" || data === "BTCAT Authority Main") || (
            (data === "B & T" && this.hasSearchMainPermission) ||
            (data === "BTCAT Workspace" && this.hasSearchWorkspacePermission) ||
            (data === "BTCAT Authority Main" && this.hasSearchAuthorityPermission))
          )) {
            catalog.isActive = true;
          }
        });
      });

      if (catalogs.findIndex(x => x.isActive === true) != -1) {
        var mainfilter = catalogs.find((x: { profileName: string; isActive: any; }) => (x.profileName === "B & T"));
        var wsfilter = catalogs.find((x: { profileName: string; isActive: any; }) => (x.profileName === "BTCAT Workspace"));
        var authFilter = catalogs.find((x: { profileName: string; isActive: any; }) => (x.profileName === "BTCAT Authority Main"));
        var basicCatalogs = catalogs.filter(c => c.isActive && this.defaultCatalogs.findIndex(d => d.id == c.id) > -1);
        if ((basicCatalogs && basicCatalogs.length > 0) || (mainfilter && mainfilter.isActive) || (authFilter && authFilter.isActive) || (wsfilter && wsfilter.isActive)) {
          // mainfilter.isActive = true;
          // wsfilter.isActive = true;
          // authFilter.isActive = true;
          this.isZ3950Search = false; //Bug 4078
        } else {
          this.isZ3950Search = true; //Bug 4078
        }

        localStorage.setItem(
          Constants.LocalStorage.SAVECATALOGITEMS,
          JSON.stringify(catalogs)
        );

        this.loadSearchCriteria(searchReq);
        this.onTypeChange(searchReq[0].type, searchReq[0].searchBy, searchReq[0].term);
        this.getBasicSearchRecords("");
      }
    }
  }
  onSearchHistoryClose(ShowSearchHistory: any) {
    this.ShowSearchHistory = ShowSearchHistory;
  }

  newRecord() {
    this.router.navigate(["/new-record"]);
  }


  resetSelectedCatalogsByPermissions() {
    const defaultCatalogIds = ["11", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    const catalogIds = ["11", "4", "5", "6", "7", "8", "9", "10"];
    var catalogs = JSON.parse(
      localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS)
    );

    if (catalogs != null && catalogs.findIndex(x =>
      x.isActive && defaultCatalogIds.indexOf(x.id) == -1) == -1) {
      catalogs.forEach(data => {
        if (data.profileName === "B & T" || data.profileName === "BTCAT Workspace" || data.profileName === "BTCAT Authority Main") {
          data.isActive = data.isActive && ((data.profileName === "B & T" && this.hasSearchMainPermission) ||
            (data.profileName === "BTCAT Workspace" && this.hasSearchWorkspacePermission) ||
            (data.profileName === "BTCAT Authority Main" && this.hasSearchAuthorityPermission) ||
            (catalogIds.indexOf(data.id) > -1));
        }
      });
    }

    localStorage.setItem(
      Constants.LocalStorage.SAVECATALOGITEMS,
      JSON.stringify(catalogs)
    );
  }


  selectCustomer(selectedCustomerData: any, form: NgForm) {
    this.previousCustomer = this.selectedCustomer;
    this.selectedCustomer = selectedCustomerData;
    this.switchCustomerName = this.selectedCustomer.customerName;
    this.showSelectCustomer = true;
  }
  switchCustomer() {
    document.getElementById("switchCustomer").click();
    if (this.selectedCustomer.id != undefined && this.selectedCustomer.id != null) {
      // load if different customer
      if (this.currentCustomerId !== this.selectedCustomer.id) {
        this.loadDataBasedOnCustomer(this.selectedCustomer.id);
        this.loadClsLabelConfigurationDataOnCustomer(this.selectedCustomer.id);
      }
    }

  }
  getAllUserCustomers() {
    this.customers = JSON.parse(localStorage.getItem(Constants.LocalStorage.ASSOCIATEDCUSTOMERS));
    if (this.customers != null && this.customers != undefined) {
      if (this.currentCustomerId) {
        let customer = this.customers.find(c => c.id == this.currentCustomerId);
        if (customer) {
          this.switchCustomerName = customer.customerName;
          this.showSelectCustomer = true;
        }
      }
    }
    else {
      this.customers = [];
    }
  }

  getAllCustomers() {
    if (localStorage.getItem(Constants.LocalStorage.CUSTOMERSALL) == null ||
      localStorage.getItem(Constants.LocalStorage.CUSTOMERSALL) === "") {
      this.spinnerService.spinnerStart();
      this.cutomerService.getCustomers().subscribe((item) => {
        this.customers = item;
        localStorage.setItem(Constants.LocalStorage.CUSTOMERSALL, JSON.stringify(this.customers));
        this.spinnerService.spinnerStop();
      },
        (error) => {
          console.log(error);
          this.spinnerService.spinnerStop();
        }
      );
    }
    else {
      this.customers = JSON.parse(localStorage.getItem(Constants.LocalStorage.CUSTOMERSALL));
      if (this.customers != null && this.customers != undefined) {
        if (this.currentCustomerId) {
          let customer = this.customers.find(c => c.id == this.currentCustomerId);
          if (customer) {
            this.switchCustomerName = customer.customerName;
            this.showSelectCustomer = true;
          }
        }
      }
    }
  }
 loadClsLabelConfigurationDataOnCustomer(custmerId) {
    this.clslabelconfigurationService
      .getCLSustomerLabelConfiguartionDetailById(custmerId)
      .subscribe(item => {
        if (item.barcodeSubFieldIn949 != null && item.barcodeSubFieldIn949 != undefined && item.barcodeSubFieldIn949 != "")
          localStorage.setItem(Constants.LocalStorage.BARCODESUBFIELDIN949, item.barcodeSubFieldIn949);
        else
        localStorage.removeItem(Constants.LocalStorage.BARCODESUBFIELDIN949);
      }, (error) => {
        let errorMessage = `Error Code: ${error.status}\nMessage: ${error.error.Message}`;
        this.alert(errorMessage);
      });
  }
  loadDataBasedOnCustomer(custmerId, checkFirstload: boolean = true) {
    this.spinnerService.spinnerStart();
    this.clsConfigurationService.getCustomerConfiguartionDetail(custmerId).subscribe((mainitem: CustomerConfigurationDTO) => {
      let allCatalogs = JSON.parse(localStorage.getItem(Constants.LocalStorage.ALLCATALOGS));
      let item = mainitem.customerConfiguration;
      let customerCatalogs = item.catalogs ? item.catalogs : [];
      let filterCustomerCatalogs = item.catalogs ?
        allCatalogs.filter(p => item.catalogs.findIndex(c => c.id === p.id) != -1) : [];
      let finalFilterCustomerCatalogs = [];
      let item_order = customerCatalogs.map(function (n, i) {
        return n.id;
      });
      finalFilterCustomerCatalogs = this.mapOrder(filterCustomerCatalogs, item_order, 'id');
      console.log(finalFilterCustomerCatalogs);
      this.searchCatalogItems = finalFilterCustomerCatalogs;
      finalFilterCustomerCatalogs.forEach(item => {
        if (item.profileName === Constants.DELETEDDBPROFILENAME) {
          item.isActive = false;
        }
      });
      localStorage.setItem(
        Constants.LocalStorage.SAVECATALOGITEMS,
        JSON.stringify(finalFilterCustomerCatalogs)
      );
      localStorage.setItem(
        Constants.LocalStorage.ATSREVIEWCOLUMNS,
        JSON.stringify(item.atsReviewFields)
      );
      this.isMarkValidations = mainitem.customerConfiguration.customerOthersDetails ? mainitem.customerConfiguration.customerOthersDetails.isMarcValidations : false;
      if (checkFirstload) {
        const firstload = !(this.currentCustomerId || (this.isAllCustomerEnable && !this.isExternalPermission));
        localStorage.removeItem(Constants.LocalStorage.DELETEDDBCHECKED);
        setTimeout(() => {
         localStorage.setItem(Constants.LocalStorage.CUSTOMERID, this.selectedCustomer.id);
          localStorage.setItem(Constants.LocalStorage.INSTITUTIONID, this.selectedCustomer.institutionId);
          if (this.isMarkValidations) {
            localStorage.setItem(Constants.LocalStorage.ISMARC21VALIDATIONS, "true");
          } else {
            localStorage.setItem(Constants.LocalStorage.ISMARC21VALIDATIONS, "false");
          }
          localStorage.setItem(Constants.LocalStorage.CUSTOMERNAME, this.selectedCustomer.customerName);
          // navigate to home page
          if (!firstload) {
            localStorage.removeItem(Constants.LocalStorage.BIBSEARCHREQUEST);
            localStorage.removeItem(Constants.LocalStorage.SEARCHZ3950REQUEST);
            localStorage.removeItem(Constants.LocalStorage.AUTHSEARCHREQUEST);
            if (window.location.href.search("search") > 0) {
              window.location.reload();
            }
            else {
              this.router.navigate(["/search"]);
            }
          }
          else {
            this.resetSelectedCatalogsByPermissions();
          }
        }, 0);

      }
      if(mainitem.customerConfiguration.customerOthersDetails && mainitem.customerConfiguration.customerOthersDetails.environmentSettings)
      {
        localStorage.setItem(Constants.LocalStorage.MARCSETTINGS, JSON.stringify(mainitem.customerConfiguration.customerOthersDetails.environmentSettings));
      }
      else{
        if(this.selectedCustomer.institutionId != null)
        {
          this.envSetttingService.getInstitutionById(this.selectedCustomer.institutionId).subscribe((result:any)=>{
            if(result && result.Institution != null && result.Institution.environmentSettings != null)
            {
              localStorage.setItem(Constants.LocalStorage.MARCSETTINGS, JSON.stringify(result.Institution.environmentSettings));
            }
            else{
              const environmentSettings = localStorage.getItem(Constants.LocalStorage.DEFAULTENVSETTINGS);
              localStorage.setItem(Constants.LocalStorage.MARCSETTINGS, environmentSettings);
              }
          });
        }
        else{
        const environmentSettings = localStorage.getItem(Constants.LocalStorage.DEFAULTENVSETTINGS);
        localStorage.setItem(Constants.LocalStorage.MARCSETTINGS, environmentSettings);
        }
        }
      this.spinnerService.spinnerStop();
    }, (error) => {
      this.switchCustomerName = localStorage.getItem(Constants.LocalStorage.CUSTOMERNAME);
      let errorMessage = `Error Code: ${error.status}\nMessage: ${error.error.Message}`;
      this.alert(errorMessage);
      this.spinnerService.spinnerStop();
    });
  }

  mapOrder(array, order, key) {

    array.sort(function (a, b) {
      var A = a[key], B = b[key];

      if (order.indexOf(A) > order.indexOf(B)) {
        return 1;
      } else {
        return -1;
      }

    });

    return array;
  }
  findCustomer() {
    if (this.switchCustomerName != undefined && this.switchCustomerName != '' && this.switchCustomerName != "Customer not found") {
      if (!isObject(this.switchCustomerName)) {
        let findCustomer = this.customers.find(x => {
          let customerName = x.customerName;
          return (
            customerName && customerName.toLowerCase() === this.switchCustomerName.toLowerCase()
          );
        });
        if (findCustomer != undefined) {
          return true;
        } else {
          //this.form.form.markAsPristine();
          this.showSelectCustomer = false;
          return false;
        }
      }
    } else {
      //this.form.form.markAsPristine();
      this.showSelectCustomer = false;
      return false;
    }
  }
  cancel() {
    if (this.currentCustomerId) {
      let customer = this.customers.find(c => c.id == this.currentCustomerId);
      if (customer) {
        this.switchCustomerName = customer.customerName;
      }
    }
  }
  displayFn(user: Customer): any {
    if (user === undefined || user === null) {
      return null;
    } else {
      if (user.customerName === undefined) {
        return user;
      } else {
        return user ? user.customerName : '';
      }

    }

  }
  alert(message: string) {
   const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: message && message.length > 200 ? '500px' : '300px',
      height: 'auto',
      disableClose: true,
      data: {
        isCancelConfirm: false,
        isCopyErrorMsg: false,
        message: message,
        title: 'Error'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }
}
