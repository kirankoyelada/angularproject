import { Component, OnInit, Input } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { Constants } from "../constants/constants";
import * as $ from "jquery";
import { PreviousRouteService } from "../services/previousRouteService";
import { CommonService } from "../shared/service/common.service";
import { BaseComponent } from '../base.component';
import { AuthenticationService } from '../security/authentication.service';
import { Event, NavigationStart, NavigationEnd, NavigationError } from '@angular/router'
declare var $: any;
@Component({
  selector: "app-menu",
  templateUrl: "./menu.component.html",
  styleUrls: ["./menu.component.css"]
})
export class MenuComponent extends BaseComponent implements OnInit {
  @Input() showBackBtn: boolean = false;
  prevUrl: string;
  routeUrl: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private previousRouteService: PreviousRouteService,
    private authenticationService: AuthenticationService
  ) {
    super(router, authenticationService);
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.routeUrl = event.url;
      }
    });
  }


  ngOnInit(): void {

  }

  ngOnChanges() { }

  homeMenuClick() {
    localStorage.setItem(
      Constants.LocalStorage.TEMPSEARCHZ3950REQUEST,
      localStorage.getItem(Constants.LocalStorage.SEARCHZ3950REQUEST)
    );
    localStorage.setItem(
      Constants.LocalStorage.TEMPSEARCHREQUEST,
      localStorage.getItem(Constants.LocalStorage.BIBSEARCHREQUEST)
    );

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
      window.location.href.search("compare-history-view") > 0 ||
      window.location.href.search("merge-marc") > 0 ||
      window.location.href.search("batch-macro-execution") > 0 ||
      window.location.href.search("users") > 0 ||
      window.location.href.search("z3950-edit") > 0 ||
      window.location.href.search("z3950-clone") > 0 ||
      window.location.href.search("myPreferences") > 0 ||
      window.location.href.search("marc-extract") > 0 ||
      window.location.href.search("cls-label-configuration") > 0 ||
      window.location.href.search("upload-record") > 0 ||
      window.location.href.search("save_batch_macro_execution") > 0 ||
      window.location.href.search("cls-configuration") > 0 ||
      window.location.href.search("account-suffix-configuration") > 0 ||
      window.location.href.search("customer-name-map") > 0 ||
      window.location.href.search("extract") > 0 ||
      window.location.href.search("ats-review") > 0 ||
      window.location.href.search("env-settings") >0 ||
      window.location.href.search("env-settings-crud") > 0 ||
      window.location.href.search("multiple-edit") > 0 ||
      window.location.href.search("macro-admin") > 0
    ) {
      localStorage.removeItem(Constants.LocalStorage.BIBSEARCHREQUEST);
      localStorage.removeItem(Constants.LocalStorage.SEARCHZ3950REQUEST);
      localStorage.removeItem(Constants.LocalStorage.AUTHSEARCHREQUEST);
      this.router.navigate(["/search"]);
    } else {
      localStorage.removeItem(Constants.LocalStorage.BIBSEARCHREQUEST);
      localStorage.removeItem(Constants.LocalStorage.SEARCHZ3950REQUEST);
      localStorage.removeItem(Constants.LocalStorage.AUTHSEARCHREQUEST);
      window.location.reload();
    }
  }

  marcExportClick() {
    if (
      window.location.href.search("marc-extract") > 0
    ) {
      window.location.reload();
    } else {
      this.toggleMenu("none");
      this.router.navigate(["/marc-extract"]);
    }
  }



  uploadFileClick() {
    if (
      window.location.href.search("bibliographic-edit") > 0 ||
      window.location.href.search("compare-view") > 0 ||
      window.location.href.search("authority-view") > 0 ||
      window.location.href.search("z3950") > 0 ||
      window.location.href.search("search") > 0 ||
      window.location.href.search("templates") > 0 ||
      window.location.href.search("create-template") > 0 ||
      window.location.href.search("clone-template") > 0 ||
      window.location.href.search("edit-template") > 0 ||
      window.location.href.search("new-record") > 0 ||
      window.location.href.search("bibliographic-clone") > 0 ||
      window.location.href.search("bibliographic-create") > 0 ||
      window.location.href.search("record-history") > 0 ||
      window.location.href.search("compare-history-view") > 0 ||
      window.location.href.search("merge-marc") > 0 ||
      window.location.href.search("batch-macro-execution") > 0 ||
      window.location.href.search("users") > 0 ||
      window.location.href.search("z3950-edit") > 0 ||
      window.location.href.search("z3950-clone") > 0 ||
      window.location.href.search("myPreferences") > 0 ||
      window.location.href.search("cls-label-configuration") > 0 ||
      window.location.href.search("cls-configuration") > 0 ||
      window.location.href.search("marc-extract") > 0 ||
      window.location.href.search("account-suffix-configuration") > 0 ||
      window.location.href.search("customer-name-map") > 0 ||
      window.location.href.search("extract") > 0 ||
      window.location.href.search("ats-review") > 0 ||
      window.location.href.search("env-settings") > 0 ||
      window.location.href.search("env-settings-crud") > 0 ||
      window.location.href.search("multiple-edit") > 0 ||
      window.location.href.search("macro-admin") > 0
    ) {
      this.toggleMenu("none");
      this.router.navigate(["/upload-record"]);
    } else {
      window.location.reload();
    }
  }

  z3950Click() {
    if (
      window.location.href.search("bibliographic-edit") > 0 ||
      window.location.href.search("compare-view") > 0 ||
      window.location.href.search("authority-view") > 0 ||
      window.location.href.search("search") > 0 ||
      window.location.href.search("templates") > 0 ||
      window.location.href.search("create-template") > 0 ||
      window.location.href.search("clone-template") > 0 ||
      window.location.href.search("edit-template") > 0 ||
      window.location.href.search("new-record") > 0 ||
      window.location.href.search("bibliographic-clone") > 0 ||
      window.location.href.search("bibliographic-create") > 0 ||
      window.location.href.search("record-history") > 0 ||
      window.location.href.search("compare-history-view") > 0 ||
      window.location.href.search("merge-marc") > 0 ||
      window.location.href.search("batch-macro-execution") > 0 ||
      window.location.href.search("users") > 0 ||
      window.location.href.search("z3950-edit") > 0 ||
      window.location.href.search("z3950-clone") > 0 ||
      window.location.href.search("myPreferences") > 0 ||
      window.location.href.search("marc-extract") > 0 ||
      window.location.href.search("cls-label-configuration") > 0 ||
      window.location.href.search("upload-record") > 0 ||
      window.location.href.search("save_batch_macro_execution") > 0 ||
      window.location.href.search("cls-configuration") > 0 ||
      window.location.href.search("account-suffix-configuration") > 0 ||
      window.location.href.search("customer-name-map") > 0 ||
      window.location.href.search("extract") > 0 ||
      window.location.href.search("ats-review") > 0 ||
      window.location.href.search("env-settings") >0 ||
      window.location.href.search("env-settings-crud") > 0 ||
      window.location.href.search("multiple-edit") > 0 ||
      window.location.href.search("macro-admin") > 0

    ) {
      this.toggleMenu("none");
      this.router.navigate(["/z3950"]);
    } else {
      window.location.reload();
    }
  }

  templatesClick() {
    localStorage.removeItem(Constants.LocalStorage.FILTERPARAMS);
    if (
      window.location.href.search("bibliographic-edit") > 0 ||
      window.location.href.search("compare-view") > 0 ||
      window.location.href.search("authority-view") > 0 ||
      window.location.href.search("search") > 0 ||
      window.location.href.search("z3950") > 0 ||
      window.location.href.search("create-template") > 0 ||
      window.location.href.search("clone-template") > 0 ||
      window.location.href.search("edit-template") > 0 ||
      window.location.href.search("bibliographic-clone") > 0 ||
      window.location.href.search("bibliographic-create") > 0 ||
      window.location.href.search("new-record") > 0 ||
      window.location.href.search("record-history") > 0 ||
      window.location.href.search("compare-history-view") > 0 ||
      window.location.href.search("merge-marc") > 0 ||
      window.location.href.search("batch-macro-execution") > 0 ||
      window.location.href.search("users") > 0 ||
      window.location.href.search("z3950-edit") > 0 ||
      window.location.href.search("z3950-clone") > 0 ||
      window.location.href.search("myPreferences") > 0 ||
      window.location.href.search("marc-extract") > 0 ||
      window.location.href.search("cls-label-configuration") > 0 ||
      window.location.href.search("upload-record") > 0 ||
      window.location.href.search("save_batch_macro_execution") > 0 ||
      window.location.href.search("cls-configuration") > 0 ||
      window.location.href.search("account-suffix-configuration") > 0 ||
      window.location.href.search("customer-name-map") > 0 ||
      window.location.href.search("extract") > 0 ||
      window.location.href.search("ats-review") > 0 ||
      window.location.href.search("env-settings") >0 ||
      window.location.href.search("env-settings-crud") > 0 ||
      window.location.href.search("multiple-edit") > 0 ||
      window.location.href.search("macro-admin") > 0
         ) {
      this.toggleMenu("none");
      this.router.navigate(["/templates"]);
    } else {
      window.location.reload();
    }
  }

  userConfigurationClick() {
    if (
      window.location.href.search("bibliographic-edit") > 0 ||
      window.location.href.search("compare-view") > 0 ||
      window.location.href.search("authority-view") > 0 ||
      window.location.href.search("z3950") > 0 ||
      window.location.href.search("authority-search") > 0 ||
      window.location.href.search("search") > 0 ||
      window.location.href.search("templates") > 0 ||
      window.location.href.search("create-template") > 0 ||
      window.location.href.search("clone-template") > 0 ||
      window.location.href.search("edit-template") > 0 ||
      window.location.href.search("bibliographic-clone") > 0 ||
      window.location.href.search("bibliographic-create") > 0 ||
      window.location.href.search("new-record") > 0 ||
      window.location.href.search("record-history") > 0 ||
      window.location.href.search("compare-history-view") > 0 ||
      window.location.href.search("merge-marc") > 0 ||
      window.location.href.search("batch-macro-execution") > 0 ||
      window.location.href.search("z3950-edit") > 0 ||
      window.location.href.search("z3950-clone") > 0 ||
      window.location.href.search("myPreferences") > 0 ||
      window.location.href.search("marc-extract") > 0 ||
      window.location.href.search("cls-label-configuration") > 0 ||
      window.location.href.search("upload-record") > 0 ||
      window.location.href.search("save_batch_macro_execution") > 0 ||
      window.location.href.search("cls-configuration") > 0 ||
      window.location.href.search("customer-name-map") > 0 ||
      window.location.href.search("account-suffix-configuration") > 0 ||
      window.location.href.search("extract") > 0 ||
      window.location.href.search("ats-review") > 0 ||
      window.location.href.search("env-settings") >0 ||
      window.location.href.search("env-settings-crud") > 0 ||
      window.location.href.search("multiple-edit") > 0 ||
      window.location.href.search("macro-admin") > 0
    ) {
      this.toggleMenu("none");
      this.router.navigate(["/users"]);
    } else {
      window.location.reload();
    }
  }

  myPreferencesClick() {
    if (
      window.location.href.search("bibliographic-edit") > 0 ||
      window.location.href.search("compare-view") > 0 ||
      window.location.href.search("authority-view") > 0 ||
      window.location.href.search("z3950") > 0 ||
      window.location.href.search("authority-search") > 0 ||
      window.location.href.search("search") > 0 ||
      window.location.href.search("templates") > 0 ||
      window.location.href.search("create-template") > 0 ||
      window.location.href.search("clone-template") > 0 ||
      window.location.href.search("edit-template") > 0 ||
      window.location.href.search("bibliographic-clone") > 0 ||
      window.location.href.search("bibliographic-create") > 0 ||
      window.location.href.search("new-record") > 0 ||
      window.location.href.search("record-history") > 0 ||
      window.location.href.search("compare-history-view") > 0 ||
      window.location.href.search("merge-marc") > 0 ||
      window.location.href.search("batch-macro-execution") > 0 ||
      window.location.href.search("users") > 0 ||
      window.location.href.search("marc-extract") > 0 ||
      window.location.href.search("cls-label-configuration") > 0 ||
      window.location.href.search("upload-record") > 0 ||
      window.location.href.search("save_batch_macro_execution") > 0 ||
      window.location.href.search("cls-configuration") > 0 ||
      window.location.href.search("account-suffix-configuration") > 0 ||
      window.location.href.search("customer-name-map") > 0 ||
      window.location.href.search("extract") > 0 ||
      window.location.href.search("ats-review") > 0 ||
      window.location.href.search("env-settings") >0 ||
      window.location.href.search("env-settings-crud") > 0 ||
      window.location.href.search("multiple-edit") > 0 ||
      window.location.href.search("macro-admin") > 0
    ) {
      this.toggleSettingsMenu("none");
      this.router.navigate(["/myPreferences"]);
    } else {
      window.location.reload();
    }
  }

  clsConfigurationClick() {
    if (
      window.location.href.search("bibliographic-edit") > 0 ||
      window.location.href.search("compare-view") > 0 ||
      window.location.href.search("authority-view") > 0 ||
      window.location.href.search("z3950") > 0 ||
      window.location.href.search("authority-search") > 0 ||
      window.location.href.search("search") > 0 ||
      window.location.href.search("templates") > 0 ||
      window.location.href.search("create-template") > 0 ||
      window.location.href.search("clone-template") > 0 ||
      window.location.href.search("edit-template") > 0 ||
      window.location.href.search("bibliographic-clone") > 0 ||
      window.location.href.search("bibliographic-create") > 0 ||
      window.location.href.search("new-record") > 0 ||
      window.location.href.search("record-history") > 0 ||
      window.location.href.search("compare-history-view") > 0 ||
      window.location.href.search("merge-marc") > 0 ||
      window.location.href.search("batch-macro-execution") > 0 ||
      window.location.href.search("users") > 0 ||
      window.location.href.search("marc-extract") > 0 ||
      window.location.href.search("myPreferences") > 0 ||
      window.location.href.search("upload-record") > 0 ||
      window.location.href.search("save_batch_macro_execution") > 0 ||
      window.location.href.search("cls-label-configuration") > 0 ||
      window.location.href.search("account-suffix-configuration") > 0 ||
      window.location.href.search("customer-name-map") > 0 ||
      window.location.href.search("extract") > 0 ||
      window.location.href.search("ats-review") > 0 ||
      window.location.href.search("env-settings") >0 ||
      window.location.href.search("env-settings-crud") > 0 ||
      window.location.href.search("multiple-edit") > 0 ||
      window.location.href.search("macro-admin") > 0

    ) {
      this.toggleCustomerSettingsMenu("none");
      this.router.navigate(["/cls-configuration"]);
    } else {
      //this.router.navigate(["/cls-configuration"]);
      window.location.reload();
    }
  }

  clsLabelConfigurationClick() {
    if (
      window.location.href.search("bibliographic-edit") > 0 ||
      window.location.href.search("compare-view") > 0 ||
      window.location.href.search("authority-view") > 0 ||
      window.location.href.search("z3950") > 0 ||
      window.location.href.search("authority-search") > 0 ||
      window.location.href.search("search") > 0 ||
      window.location.href.search("templates") > 0 ||
      window.location.href.search("create-template") > 0 ||
      window.location.href.search("clone-template") > 0 ||
      window.location.href.search("edit-template") > 0 ||
      window.location.href.search("bibliographic-clone") > 0 ||
      window.location.href.search("bibliographic-create") > 0 ||
      window.location.href.search("new-record") > 0 ||
      window.location.href.search("record-history") > 0 ||
      window.location.href.search("compare-history-view") > 0 ||
      window.location.href.search("merge-marc") > 0 ||
      window.location.href.search("batch-macro-execution") > 0 ||
      window.location.href.search("users") > 0 ||
      window.location.href.search("marc-extract") > 0 ||
      window.location.href.search("myPreferences") > 0 ||
      window.location.href.search("upload-record") > 0 ||
      window.location.href.search("save_batch_macro_execution") > 0 ||
      window.location.href.search("cls-configuration") > 0 ||
      window.location.href.search("account-suffix-configuration") > 0 ||
      window.location.href.search("customer-name-map") > 0 ||
      window.location.href.search("extract") > 0 ||
      window.location.href.search("ats-review") > 0 ||
      window.location.href.search("env-settings") >0 ||
      window.location.href.search("env-settings-crud") > 0 ||
      window.location.href.search("multiple-edit") > 0 ||
      window.location.href.search("macro-admin") > 0

    ) {
      this.toggleCustomerSettingsMenu("none");
      this.router.navigate(["/cls-label-configuration"]);
    } else {
     // this.router.navigate(["/cls-label-configuration"]);
      window.location.reload();
    }
  }

  customerNameMappingClick() {
    if (
      window.location.href.search("bibliographic-edit") > 0 ||
      window.location.href.search("compare-view") > 0 ||
      window.location.href.search("authority-view") > 0 ||
      window.location.href.search("z3950") > 0 ||
      window.location.href.search("authority-search") > 0 ||
      window.location.href.search("search") > 0 ||
      window.location.href.search("templates") > 0 ||
      window.location.href.search("create-template") > 0 ||
      window.location.href.search("clone-template") > 0 ||
      window.location.href.search("edit-template") > 0 ||
      window.location.href.search("bibliographic-clone") > 0 ||
      window.location.href.search("bibliographic-create") > 0 ||
      window.location.href.search("new-record") > 0 ||
      window.location.href.search("record-history") > 0 ||
      window.location.href.search("compare-history-view") > 0 ||
      window.location.href.search("merge-marc") > 0 ||
      window.location.href.search("batch-macro-execution") > 0 ||
      window.location.href.search("users") > 0 ||
      window.location.href.search("marc-extract") > 0 ||
      window.location.href.search("myPreferences") > 0 ||
      window.location.href.search("cls-configuration") > 0 ||
      window.location.href.search("account-suffix-configuration") > 0 ||
      window.location.href.search("cls-label-configuration") > 0 ||
      window.location.href.search("upload-record") > 0 ||
      window.location.href.search("save_batch_macro_execution") > 0 ||
      window.location.href.search("extract") > 0 ||
      window.location.href.search("ats-review") > 0 ||
      window.location.href.search("env-settings") >0 ||
      window.location.href.search("env-settings-crud") > 0 ||
      window.location.href.search("multiple-edit") > 0 ||
      window.location.href.search("macro-admin") > 0

    ) {
      this.toggleCustomerSettingsMenu("none");
      this.router.navigate(["/customer-name-map"]);
    } else {
      window.location.reload();
    }
  }

  clslabelExtractClick() {
    if (
      window.location.href.search("bibliographic-edit") > 0 ||
      window.location.href.search("compare-view") > 0 ||
      window.location.href.search("authority-view") > 0 ||
      window.location.href.search("z3950") > 0 ||
      window.location.href.search("authority-search") > 0 ||
      window.location.href.search("search") > 0 ||
      window.location.href.search("templates") > 0 ||
      window.location.href.search("create-template") > 0 ||
      window.location.href.search("clone-template") > 0 ||
      window.location.href.search("edit-template") > 0 ||
      window.location.href.search("bibliographic-clone") > 0 ||
      window.location.href.search("bibliographic-create") > 0 ||
      window.location.href.search("new-record") > 0 ||
      window.location.href.search("record-history") > 0 ||
      window.location.href.search("compare-history-view") > 0 ||
      window.location.href.search("merge-marc") > 0 ||
      window.location.href.search("batch-macro-execution") > 0 ||
      window.location.href.search("users") > 0 ||
      window.location.href.search("marc-extract") > 0 ||
      window.location.href.search("myPreferences") > 0 ||
      window.location.href.search("cls-configuration") > 0 ||
      window.location.href.search("cls-label-configuration") > 0 ||
      window.location.href.search("upload-record") > 0 ||
      window.location.href.search("account-suffix-configuration") > 0 ||
      window.location.href.search("save_batch_macro_execution") > 0 ||
      window.location.href.search("customer-name-map") > 0 ||
      window.location.href.search("env-settings") >0 ||
      window.location.href.search("env-settings-crud") > 0 ||
      window.location.href.search("multiple-edit") > 0 ||
      window.location.href.search("macro-admin") > 0

    ) {
      this.toggleCustomerSettingsMenu("none");
      this.router.navigate(["/extract"]);
    } else {
      window.location.reload();
    }
  }

  toggleCustomerSettingsMenu(_display) {
    let divelement = <HTMLLIElement>(
      document.getElementById("DropdownMenuCustomerSettings")
    );
    if (divelement != null) divelement.style.display = _display;
  }
  toggleSettingsMenu(_display) {
    let divelement = <HTMLLIElement>(
      document.getElementById("DropdownMenuSettings")
    );
    if (divelement != null) divelement.style.display = _display;
  }

  toggleMenu(_display) {
    let divelement = <HTMLLIElement>(
      document.getElementById("DropdownMenuAdmin")
    );
    if (divelement != null) divelement.style.display = _display;
    this.toggleSettingsMenu("none");
  }

  isAdminMenuActive() {
    return this.routeUrl == '/users' || this.routeUrl == '/templates'
      || this.routeUrl == '/z3950' || this.routeUrl == '/marc-extract' || this.routeUrl == '/extract' || this.routeUrl== '/env-settings-crud'
      || this.routeUrl=='/env-settings/0' || this.routeUrl == '/macro-admin';
  }

  isHomeMenuActive() {
    return this.routeUrl == '/search' || this.routeUrl == '/' || this.routeUrl == '/new-record';
  }

  isSettingsMenuActive() {
    return this.routeUrl == '/myPreferences' || this.routeUrl == '/upload-record' || this.routeUrl == '/batch-macro-execution';
  }

  isCustomerSettingsMenuActive() {
    return this.routeUrl == '/cls-configuration' || this.routeUrl == 'account-suffix-configuration' || this.routeUrl == '/cls-label-configuration' || this.routeUrl == '/oclcConfiguration'
      || this.routeUrl == '/unflip' || this.routeUrl == '/customer-name-map';

  }

  back() {
    //read and set the  authsearch data from the search request for the Search request
    this.setLocalStorageForSearch(Constants.LocalStorage.BIBSEARCHREQUEST);

    //read and set the  authsearch data from the search request for the Authority Search request
    this.setLocalStorageForSearch(Constants.LocalStorage.AUTHSEARCHREQUEST);

    localStorage.removeItem("SearchClicked");

    //Navigate to previous url
    this.router.navigate([this.previousRouteService.getPreviousUrl()]);
  }

  setLocalStorageForSearch(locStorageText: string) {
    var locStorage = localStorage.getItem(locStorageText);
    if (locStorage && locStorage != null && locStorage != "null") {
      var searchRequest = JSON.parse(locStorage);
      if (
        searchRequest &&
        searchRequest.SearchRequest &&
        searchRequest.SearchRequest.length > 0
      ) {
        searchRequest.SearchRequest.forEach(a => (a.authSearch = false));
        localStorage.setItem(locStorageText, JSON.stringify(searchRequest));
      }
    }
  }
  envSettingsClick() {
    if (
      window.location.href.search("env-settings-crud") > 0
    ) {
      window.location.reload();
    } else {
      this.toggleMenu("none");
      this.router.navigate(["/env-settings-crud"]);
    }
  }

  macroClick() {
    if (
      window.location.href.search("macro-admin") > 0
    ) {
      window.location.reload();
    } else {
      this.toggleMenu("none");
      this.router.navigate(["/macro-admin"]);
    }
  }
}
