import { Component, OnChanges, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Constants } from "src/app/constants/constants";
import { BaseComponent } from '../../base.component';
import { AuthenticationService } from '../../security/authentication.service';

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.css"]
})
export class HeaderComponent extends BaseComponent implements OnInit, OnChanges {
  actor: string;
  get customerName(): string{
    return localStorage.getItem(Constants.LocalStorage.CUSTOMERNAME);
  };
  constructor(private router: Router,private authenticationService: AuthenticationService,) {super(router, authenticationService);}
  ngOnInit() {
    if (
      localStorage.getItem(Constants.LocalStorage.ACTOR) == null ||
      localStorage.getItem(Constants.LocalStorage.ACTOR) === ""
    ) {
      this.router.navigate(["/login"]);
    }
    this.actor = localStorage.getItem(Constants.LocalStorage.USERDISPLAYNAME)
  }
  ngOnChanges() {
    this.actor = localStorage.getItem(Constants.LocalStorage.USERDISPLAYNAME);
  }
  logOut() {
    // issue-3083
    localStorage.setItem(Constants.LocalStorage.TEMPACTOR,localStorage.getItem(Constants.LocalStorage.ACTOR));
    localStorage.removeItem(Constants.LocalStorage.ACTOR);

    this.router.navigate(["/login/1"]);
  }

  logoClick() {
    if (window.location.href.search("bibliographic-edit") > 0 ||
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
    window.location.href.search("users") > 0 ||
    window.location.href.search("z3950-edit") > 0 ||
    window.location.href.search("z3950-clone") > 0 ||
    window.location.href.search("upload-record") > 0 ||
    window.location.href.search("marc-extract") > 0 ||
    window.location.href.search("myPreferences") > 0 ||
    window.location.href.search("save_batch_macro_execution") > 0 ||
    window.location.href.search("cls-configuration") > 0 ||
    window.location.href.search("account-suffix-configuration") > 0 ||
    window.location.href.search("cls-label-configuration") > 0 ||
    window.location.href.search("customer-name-map") > 0||
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
  }
  else {
    localStorage.removeItem(Constants.LocalStorage.BIBSEARCHREQUEST);
    localStorage.removeItem(Constants.LocalStorage.SEARCHZ3950REQUEST);
    localStorage.removeItem(Constants.LocalStorage.AUTHSEARCHREQUEST);
    window.location.reload();
  }
  }
}
