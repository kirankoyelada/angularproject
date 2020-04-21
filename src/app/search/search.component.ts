import {
  Component,
  OnInit,
  Renderer,
  ViewChild,
  ElementRef,
  Input
  //ChangeDetectionStrategy
} from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { SearchService } from "src/app/services/search.service";
import { Options, LabelType } from "ng5-slider";
import {
  BasicSearchRequest,
  BasicSearch,
  MarcRecord,
  Facets
} from "src/app/services/search";
import { Title } from "@angular/platform-browser";
import { CommonService } from "../shared/service/common.service";
import { Constants } from "src/app/constants/constants";
import { UserIdleService } from "angular-user-idle";
import { SpinnerService } from '../shared/interceptor/spinner.service';
import { PreviousRouteService } from '../services/previousRouteService';
import { UserIdleSettingsService } from '../shared/sessionSettings/userIdleSettings.service';

@Component({
  selector: "app-search",
  templateUrl: "./search.component.html",
  styleUrls: ["./search.component.css"]
})
export class SearchComponent implements OnInit {
  facetValue: any;

  basicSearchRequest: BasicSearchRequest;

  facetResponse: Facets[];
  basicSearchResponse: MarcRecord[];
  authoritySearchResponse: MarcRecord[];
  showSearchResult: Boolean = false;
  showAuthoritySearchResult: Boolean = false;
  //searchFlag: number = 0;
  hideSearchItem: any;
  //startSpinner: Boolean = false;
  showBackBtn: boolean = false;
  prevUrl: string;
  isSearchClicked: boolean = false;

  constructor(
    public commonService: CommonService,
    private router: Router,
    private _titleService: Title,
    //private userIdle: UserIdleService,
    private spinnerService: SpinnerService,
    private previousRouteService: PreviousRouteService,
    private userIdleSettingsService: UserIdleSettingsService
  ) {}

  ngOnInit() {
    //Set page Title when this view is initialized
    this._titleService.setTitle("BTCAT | Search");
    if (
      localStorage.getItem(Constants.LocalStorage.ACTOR) == null &&
      localStorage.getItem(Constants.LocalStorage.ACTOR) === ""
    )
     {
      this.router.navigate(["/login"]);
    }
    this.userIdleSettingsService.initiateUserIdleModuleSettings();

  }

    ngAfterViewInit() {}

  getFacetValue(facetVal) {
    // this.facetValue = { value: facetVal.value, facetType: facetVal.facetType };
    this.facetValue = { facetVal };
  }

  hideShowBackButton() {
    //Set the showBackBtn value based on the authSearch value to hide/show the back button in the menu
    //The showBackBtn value will get emit to the menu component and based on that button will get hide/show
    if (localStorage.getItem(Constants.LocalStorage.BIBSEARCHREQUEST) !== 'null' &&
      localStorage.getItem(Constants.LocalStorage.BIBSEARCHREQUEST) !== "") {
      var searchRequest = JSON.parse(localStorage.getItem(Constants.LocalStorage.BIBSEARCHREQUEST));
      if (searchRequest) {
        let dbRecNumSeach = searchRequest.SearchRequest.find(
          s => s.searchBy == Constants.Search.DATABASE_RECORD_NUMBER
        );
        this.prevUrl = this.previousRouteService.getPreviousUrl();

        if (localStorage.getItem("SearchClicked") && localStorage.getItem("SearchClicked") !== 'null' &&
          localStorage.getItem("SearchClicked") !== "") {
          this.isSearchClicked = <boolean>JSON.parse((localStorage.getItem("SearchClicked")));
        }
        else {
          this.isSearchClicked = false;
        }

        if (this.prevUrl && this.prevUrl.includes("authority-search") && ((dbRecNumSeach && dbRecNumSeach.authSearch) || !this.isSearchClicked)) {
          this.showBackBtn = true;
        }
        else {
          this.showBackBtn = false;
        }
      }
      else {
        this.showBackBtn = false;
      }
    }
    else {
      this.showBackBtn = false;
    }
    if(!this.showBackBtn)
    {
      localStorage.removeItem("SearchClicked");
    }
  }

  getSearchResult(result: any) {
    this.showAuthoritySearchResult = false;
    //Hide or show back button in the menu for the authority search
    this.hideShowBackButton();
    if (result) {
      this.hideSearchItem = result.hideSearchItem;
      this.showSearchResult = true;
      let basicSearchRequest = JSON.parse(
        localStorage.getItem(Constants.LocalStorage.BIBSEARCHREQUEST)
      );

      if (basicSearchRequest &&
        basicSearchRequest.SearchRequest[0].facetValue == null &&
        !basicSearchRequest.SearchRequest[0].authSearch &&
        result.basicSearchResponse &&
        result.basicSearchResponse.length == 1 &&
        result.basicSearchResponse[0].Id &&
        result.basicSearchResponse[0].Id != null
      ) {      
        this.commonService.setRecordSource(result.basicSearchResponse[0].RecordSource);
        if(result.basicSearchResponse[0].Reason != null){
          this.router.navigate([
            "/bibliographic-edit/",
            result.basicSearchResponse[0].Id,
            1,
            result.basicSearchResponse[0].Reason
          ]);
        }else{
          this.router.navigate([
            "/bibliographic-edit/",
            result.basicSearchResponse[0].Id,
            1
          ]);
        }
      }
      if (result.basicSearchResponse) {
        this.basicSearchResponse = result.basicSearchResponse;
        this.facetResponse = result.facetResponse;
      } else {
        this.basicSearchResponse = null;
        this.facetResponse = null;
      }
    } else {
      this.showSearchResult = false;
    }
  }

  getAuthoritySearchResult(result: any) {
    this.showSearchResult = false;

    if (result) {
      this.hideSearchItem = result.hideSearchItem;
      this.showSearchResult = false;
      this.showAuthoritySearchResult = true;
      this.basicSearchResponse = null;
      this.facetResponse = null;
      let basicSearchRequest = JSON.parse(
        localStorage.getItem(Constants.LocalStorage.BIBSEARCHREQUEST)
      );

      if ( basicSearchRequest &&
        basicSearchRequest.SearchRequest[0].facetValue == null &&
        result.authoritySearchResponse &&
        result.authoritySearchResponse.length == 1 &&
        result.authoritySearchResponse[0].Id &&
        result.authoritySearchResponse[0].Id != null
      ) {
        if(result.basicSearchResponse[0].Reason != null){
          this.router.navigate([
            "/bibliographic-edit/",
            result.basicSearchResponse[0].Id,
            1,
            result.basicSearchResponse[0].Reason
          ]);
        }else{
          this.router.navigate([
            "/bibliographic-edit/",
            result.basicSearchResponse[0].Id,
            1
          ]);
        }
      }
      if (result.authoritySearchResponse) {
        this.authoritySearchResponse = result.authoritySearchResponse;
      } else {
        this.authoritySearchResponse = null;
      }
    } else {
      this.showAuthoritySearchResult = false;
    }
  }


  getZ3950SearchResult(result: any) {
    this.showAuthoritySearchResult = false;
    //Hide or show back button in the menu for the authority search
    this.hideShowBackButton();
    if (result) {
      this.hideSearchItem = result.hideSearchItem;
      this.showSearchResult = true;
      if (result.basicSearchResponse) {

        //Fix 3008 issue for ADA issue.
        let i =1;
        result.basicSearchResponse.forEach(x => {
          x.Id = i.toString();
          x.Mrecord.Id=i.toString();
          i= i+1;
        });

        this.basicSearchResponse = result.basicSearchResponse;
        this.facetResponse = null;
      } else {
        this.basicSearchResponse = null;
        this.facetResponse = null;
      }
    } else {
      this.showSearchResult = false;
    }
  }

  showSpinner(showflag: boolean) {
    //this.startSpinner = showflag;
    if(showflag){
      //this.spinnerService.onRequestStarted();
      this.spinnerService.spinnerStart();
    }else{
      //this.spinnerService.onRequestFinished();
      this.spinnerService.spinnerStop();
    }
    this.showSearchResult = !showflag;
    this.showAuthoritySearchResult = !showflag;
  }
}
