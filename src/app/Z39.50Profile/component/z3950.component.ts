import { Component, OnInit, ViewChild, ElementRef, Renderer2, } from "@angular/core";
import { Z3950Service } from "../service/z3950.service";
import {
  Z3950Profile,
  LoginOption,
  AttributeOption,
  Attributes
} from "../model/z3950";
import { ConfirmationDialogComponent } from "src/app/components/shared/confirmation-dialog/confirmation-dialog.component";
import { MatDialog } from "@angular/material";
import { NgForm } from "@angular/forms";
import { Location } from "@angular/common";
import { Router } from "@angular/router";
import { FormCanDeactivate } from "src/app/can-deactivate/form-can-deactivate";
import { SpinnerService } from "src/app/shared/interceptor/spinner.service";
import { Constants } from "src/app/constants/constants";
import { Title } from '@angular/platform-browser';
import { Z3950AttributeOptions, AttributeValues } from '../../marc/shared/marc';
import { MarcService } from '../../marc/shared/service/marc-service';
import { AuthenticationService } from 'src/app/security/authentication.service';

declare var $: any;
@Component({
  selector: "app-z3950",
  templateUrl: "./z3950.component.html",
  host: {
    '(document:keydown)': 'keydown($event)'
  }
})
export class Z3950Component extends FormCanDeactivate implements OnInit {
  @ViewChild("form")
  form: NgForm;
  // Search Split Issue fix
  CWidowHeight: number;
  CHeaderHeight: number;
  CNavHeight: number;
  HeaderHeight: number;
  NewHeight: number;
  CSearchHeight: number;
  CompareBtn: number;

  finalResponse: Z3950Profile[];
  z3950ResultData = new Z3950Profile();
  loginType = new LoginOption();
  attribute = new Attributes();
  tempAttribute = new Attributes();
  attributeOption = new AttributeOption();
  ddlAttrUse: any;
  selectedText: any;
  selLoginTypeRdbButton: string = "Anonymous";
  z39Spinner: boolean = false;
  modelLoginType: string;
  modelPassword: string;
  modelUserId: string;
  modelUse: any;
  modelUseDesc: any;
  modelStructure: any;
  modelStructureDesc: any;
  modelRelation: any;
  modelRelationDesc: any;
  modelPosition: any;
  modelPositionDesc: any;
  modelTruncation: any;
  modelTruncationDesc: any;
  modelCompleteness: any;
  modelCompletenessDesc: any;
  editable: boolean = false;
  divShow: boolean = false;
  divGridResult: boolean = false;
  isCustomerRequired: boolean = true;
  isProfileRequired: boolean = true;
  ishostRequired: boolean = true;
  isPortRequired: boolean = true;
  isSearchDBRequired: boolean = true;
  isAttrOptionsReadOnly: boolean = false;
  selectedId: string;

  selectedUseText: string;
  selectedStructureText: string;
  selectedRelationText: string;
  selectedPositionText: string;
  selectedTruncationText: string;
  selectedCompletenessText: string;
  displayWarnMessage: boolean = false;
  isProfileDuplicate: boolean = false;
  typingTimer: any;
  doneTypingInterval: number = 1000;

  z3950AttributeOptions: Z3950AttributeOptions;
  z3950SearchType: AttributeValues[];
  selSearchTypeVal: number;
  selSearchTypeText: string;
  isUseAttributeRequired: boolean = true;
  useValidation: boolean = true;
  isUserIdRequired: boolean = true;
  isPasswordRequired: boolean = true;
  objPrevSelSearchType: any = [];
  prevSearchTypeVal: number;
  prevSearchTypeText: string;
  isRowBtnClicked: boolean = false;
  isCloneRecord: boolean = false;
  gridProfileCount: number = 100;
  isNewProfile: boolean = false;

  @ViewChild("inputUserId") private uId: ElementRef;
  @ViewChild("inputPassword") private pwd: ElementRef;
  table: any;
  searchCatalogItems: any;
  clear: boolean = true;

  displayUnAuthMessage: boolean = false;

  constructor(
    private z3950Service: Z3950Service,
    private dialog: MatDialog,
    private _location: Location,
    private router: Router,
    private spinnerService: SpinnerService,
    private _titleService: Title,
    private service: MarcService,
    private renderer2: Renderer2,
    private authenticationService: AuthenticationService
  ) {
    super(router, authenticationService);
    this.z3950ResultData.profileName = "";
    this.z3950ResultData.customerName = "";
    this.z3950ResultData.profileDescription = "";
    this.z3950ResultData.databaseName = "";
    this.z3950ResultData.hostAddress = "";
    this.z3950ResultData.isActive = true;
    this.z3950ResultData.isSearchTypeBib = true;
    this.z3950ResultData.portNumber = "";
    this.z3950ResultData.searchDatabase = "";
    this.z3950ResultData.loginOptions = [];
    this.z3950ResultData.attributeOptions = [];
    this.attributeOption.attributes = [];
    this.modelLoginType = "Anonymous";
    this.modelPassword = "";
    this.modelUserId = "";
    this.modelUse = 1;
    this.modelStructure = 1;
    this.modelRelation = 1;
    this.modelPosition = 1;
    this.modelTruncation = 1;
    this.modelCompleteness = 1;
    this.modelUseDesc = "Personal name";
    this.modelStructureDesc = "Phrase";
    this.modelRelationDesc = "Less than";
    this.modelPositionDesc = "First in field";
    this.modelTruncationDesc = "Right truncation";
    this.modelCompletenessDesc = "Incomplete subfield";
  }

  ngOnInit() {

    // this.keydown();
    this._titleService.setTitle('BTCAT | Z39.50 Profiles');
    this.z3950AttributeOptions = new Z3950AttributeOptions();
    this.z3950SearchType = [];

    if (localStorage.getItem(Constants.LocalStorage.Z3950ATTRIBUTEOPTIONS) != null && localStorage.getItem(Constants.LocalStorage.Z3950SEARCHTYPE) != null) {
      this.z3950AttributeOptions = JSON.parse(localStorage.getItem(Constants.LocalStorage.Z3950ATTRIBUTEOPTIONS));
      this.z3950SearchType = JSON.parse(localStorage.getItem(Constants.LocalStorage.Z3950SEARCHTYPE));
    }
    else {
      this.loadSearchAttributesSettings();
    }

    this.getAllZ3950Profiles("", this.form, "", false);
  }
  ngDoCheck() {
    // this.keydown();
  }
  loadSearchAttributesSettings() {
    this.z3950AttributeOptions = new Z3950AttributeOptions();
    this.z3950SearchType = [];
    this.service.getMarcSettings().subscribe(item => {
      if (item) {
        this.z3950AttributeOptions = item.Z3950AttributeOptions;
        localStorage.setItem(Constants.LocalStorage.Z3950ATTRIBUTEOPTIONS, JSON.stringify(this.z3950AttributeOptions));

        let sortedSearchType = item.Z3950SearchType.sort((a: any, b: any) => a.order - b.order);
        this.z3950SearchType = sortedSearchType;
        localStorage.setItem(Constants.LocalStorage.Z3950SEARCHTYPE, JSON.stringify(this.z3950SearchType));
      }
    });
  }


  goBack(form: NgForm) {
    if (form.dirty) {
      form.form.markAsPristine();
      this.confirmationMessage(form, "", null);
    }
    else {
      this._location.back();
    }
  }

  BindSearchResultsToGrid(searchText: string) {
    var bibliographic = Constants.BIBLIOGRAPHIC;
    var authority = Constants.AUTHORITY;

    var finalResponse = JSON.parse(localStorage.getItem(
      Constants.LocalStorage.SAVECATALOGITEMS
    ));

    if (finalResponse != null && finalResponse.length > 0) {
      finalResponse = finalResponse.filter(
        x => this.defaultCatalogIds.indexOf(x.id) === -1
      );
    }
    if (finalResponse.length > 0) {
      this.spinnerService.spinnerStart();
      var finalResult = [];
      if (searchText === "") {
        finalResult = finalResponse.slice(0, this.gridProfileCount);
      }
      else {
        var searchResults = [];
        let searchArray = searchText.split(" ");
        let word = searchArray[0];
        var results = [];
        if (searchArray.length > 0) {
          let searchWord = searchArray[0];
          results = this.getFilterData(finalResponse, searchWord, bibliographic, authority);
          if (searchArray.length > 1) {
            let filterWords = searchArray.slice(1, searchArray.length);
            filterWords.forEach(x => {
              results = this.getFilterData(results, x, bibliographic, authority);
            });
          }
          searchResults = results;
        }
        const map = new Map();
        for (const item of searchResults) {
          if (!map.has(item.id)) {
            map.set(item.id, true);
            finalResult.push(item);
          }
        }
      }
      var searchResultsArray = finalResult.slice(0, this.gridProfileCount);
      if (searchResultsArray.length > 0) {
        this.selectedId = searchResultsArray[0].id;
      }
      if (this.table != null) {
        this.ReInitializeProfileGrid(searchResultsArray);
      }
      // this.spinnerService.onRequestFinished();
      this.divGridResult = true;

      if (searchResultsArray.length > 0) {
        this.showProfileRecord(searchResultsArray[0].id, this.form, false);
      }
      else {
        this.clickNew(this.form);
        this.spinnerService.spinnerStop();
      }
    }

  }

  private getFilterData(result: any, word: string, bibliographic: any, authority: any) {
    return result.filter(
      x =>
        (x.profileName.toLowerCase().includes(word) ||
          x.customerName.toLowerCase().includes(word) ||
          x.databaseName.toLowerCase().includes(word) ||
          (x.isSearchTypeBib === true ? bibliographic.includes(word) : authority.includes(word)))
    );
  }
  // This method is used to search the Z3950 profile based on word search.
  GetProfilesBySearchTerm(event: any) {
    // if($("#z3950SearchFilter").val()!=''){
    //   this.clear=false;
    // }else{
    //   this.clear=true;
    // }
    this.isCloneRecord = false;
    clearTimeout(this.typingTimer);

    //Timer will wait until user stops typing and then search will e performed.
    this.typingTimer = setTimeout(() => {

      var searchTerm = $("#z3950SearchFilter").val();
      if (!($(event.target).data('previousValue') && $(event.target).data('previousValue').length == 0 && event.keyCode === 8)) {
        // this.spinnerService.onRequestStarted();
        $(event.target).data('previousValue', $("#z3950SearchFilter").val());
        var searchText = searchTerm.trim().toLowerCase();

        if (this.form && this.form.dirty) {
          this.confirmationMessage(this.form, "searchProfile", "");
        }
        else {
          this.BindSearchResultsToGrid(searchText);
        }
      }
    }, this.doneTypingInterval);
  }
  clearSearch() {
    $("#z3950SearchFilter").val("");
    this.clear = true;
    this.BindSearchResultsToGrid('');
  }

  /* search split fix function - var values */
  CustomHeightFunction() {
    this.CWidowHeight = $(window).height();
    this.CHeaderHeight = $("app-header nav").height();
    this.CSearchHeight = $(".search_filter").height();
    this.CNavHeight = $(".mainNavSection").height();
    this.CompareBtn = $("header.tableHeaderCounts").height();
    this.HeaderHeight =
      this.CHeaderHeight +
      this.CSearchHeight +
      this.CNavHeight +
      this.CompareBtn;
    this.NewHeight = this.CWidowHeight - this.HeaderHeight;
    this.NewHeight = this.NewHeight - 55;
  }


  // multiple marc view methods -- End
  ngAfterViewChecked() {
    /* search split fix function  */
    this.CustomHeightFunction();
    $(window).resize(e => {
      this.CustomHeightFunction();
    });

    if ($.fn.dataTable.isDataTable("#Z3950Profiles")) {
      this.table = $("#Z3950Profiles").DataTable();
    } else if (this.finalResponse != null) {
      var finalResult = this.finalResponse.slice(0, this.gridProfileCount);
      this.ReInitializeProfileGrid(finalResult);

      this.table.on('select', (e, dt, type, indexes) => {
        var data = this.table.rows(indexes).data();
        if (this.isCloneRecord && !this.isRowBtnClicked) {
          this.confirmationMessage(this.form, "showProfile", data[0].id);
        }
        else {
          if (type === 'row' && !this.isRowBtnClicked) {
            this.selectedId = data[0].id;
            this.showProfileRecord(data[0].id, this.form, false);
          }
        }
        this.isRowBtnClicked = false;
      });
    }
  }

  CloneZ3950Profile(event, id) {
    this.isCloneRecord = true;
    this.selectedId = id;
    event.stopPropagation();
    event.preventDefault();
    event.stopImmediatePropagation();
    this.isRowBtnClicked = false;
    this.table.$('tr.active').removeClass('active');
    this.showProfileRecord(id, this.form, false);
  }

  DeleteZ3950Profile(event, id, profileName) {
    this.isCloneRecord = false;
    var index = 0;
    var tableData = this.table.rows().data();
    if (tableData.length > 0) {
      for (var i = 0; i <= tableData.length; i++) {
        if (tableData[i].id == id) {
          index = i;
          break;
        }
      }
      this.table.rows().deselect();
      this.table.rows(index).select();
      this.selectedId = id;
      this.showProfileRecord(id, this.form, false);
    }


    this.isNewProfile = false;
    event.stopPropagation();
    event.preventDefault();
    event.stopImmediatePropagation();
    let dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: "500px",
      height: "auto",
      disableClose: true,
      data: {
        isCopyErrorMsg:false,
        isCancelConfirm: true,
        message:
          "Deleting the profile " + profileName + " would not allow the users to re-execute any search operation done using this profile. Are you sure you want to proceed?"
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        var finalResponse = JSON.parse(localStorage.getItem(
          Constants.LocalStorage.SAVECATALOGITEMS
        ));

        var profileData = finalResponse.filter(
          x => (x.id == id)
        );
        if (profileData.length > 0) {
          profileData[0].isDeleted = true;
          //this.spinnerService.onRequestStarted();
          this.spinnerService.spinnerStart();
          this.z3950Service.deleteZ3950Profile(profileData[0]).subscribe(result => {
            //this.spinnerService.onRequestFinished();
            this.spinnerService.spinnerStop();
            var catlogitems = localStorage.getItem(
              Constants.LocalStorage.SAVECATALOGITEMS
            );
            this.searchCatalogItems = JSON.parse(catlogitems);
            for (var i = 0; i < this.searchCatalogItems.length; i++) {
              if (this.searchCatalogItems[i].id === id) {
                this.searchCatalogItems.splice(i, 1);
                break;
              }
            }
            localStorage.setItem(
              Constants.LocalStorage.SAVECATALOGITEMS,
              JSON.stringify(this.searchCatalogItems)
            );
            let dialog = this.dialog.open(ConfirmationDialogComponent, {
              width: "500px",
              height: "auto",
              disableClose: true,
              data: {
                isCopyErrorMsg:false,
                isCancelConfirm: false,
                message: result.Message
              }
            });
            dialog.afterClosed().subscribe(result => {
              this.z3950ResultData.isActive = false;
              this.getAllZ3950Profiles("", this.form, "", false);
            });
          });
        }
      }
      else {
        this.isRowBtnClicked = false;
      }
    });
  }

  ReInitializeProfileGrid(result: Z3950Profile[]) {
    var columns = this.GetProfileGridColumns();
    if (this.table != null) {
      $("#Z3950Profiles").DataTable().destroy();
    }
    this.table = $("#Z3950Profiles").DataTable({
      paging: true,
      searching: false,
      select: {
        className: 'active'
      },
      info: false,
      data: result,
      columns: columns,
      order: [],
      autoWidth: false,
      scrollY: 117,
      scrollX: true,
      scroller: true,
      scrollCollapse: true,
      deferRender: true,
      columnDefs: [
        { orderable: false, targets: -1 }
      ],
      language: {
        emptyTable: "<html><span tabindex='0'>No results found.</span></html>"
      },
      "fnRowCallback": function (nRow, aData) {
        var $nRow = $(nRow);
        $nRow.attr("tabindex", 0);
        var tbl = $(this);
        $nRow.on("keydown", function search(e) {
          if (e.keyCode == 13) {
            var rowIndex = this._DT_RowIndex;
            var tab = $("#Z3950Profiles").DataTable();
            tab.rows().deselect();
            tab.rows(rowIndex).select();
          }
        });
        return nRow;
      },
    });
    // this.table.columns.adjust();

    //$('.sorting_disabled').append('<span class="sr-only">Z3950 profiles action buttons</span>');
    var index = 0;
    var tableData = this.table.rows().data();
    if (tableData.length > 0) {
      for (var i = 0; i < tableData.length; i++) {
        if (tableData[i].id == this.selectedId) {
          index = i;
          break;
        }
      }

      this.table.row(index).select();
      this.table.row(index).scrollTo(false);
    }

    //This event will be called on keydown enter of Clone anf Delete.
    $("[type=clone],[type=delete]").keydown((event) => {
      if (event.keyCode == 13) {
        var id = event.currentTarget.attributes["profileId"].nodeValue;
        var profileName = event.currentTarget.attributes["profileName"].nodeValue;
        if (event.currentTarget.attributes["type"].nodeValue == "clone") {
          this.CloneZ3950Profile(event, id);
        }
        else if (event.currentTarget.attributes["type"].nodeValue == "delete") {
          this.DeleteZ3950Profile(event, id, profileName);
        }
      }

      if (tableData.length > 4) {
        $("#Z3950Profiles_wrapper > div.dataTables_scroll > div.dataTables_scrollBody > div:nth-child(2)").css({
          "height": "117px !important;"
        });
      }
    });

    // This event will be called when Clone and Delete buttons are clicked.
    $('#Z3950Profiles').on('click', '.z3950ActionBtns a', (event) => {
      this.isRowBtnClicked = true;
      if (event.currentTarget.attributes.length > 0) {
        var id = event.currentTarget.attributes["profileId"].nodeValue;
        var profileName = event.currentTarget.attributes["profileName"].nodeValue;
        if (event.currentTarget.attributes["type"].nodeValue == "clone") {
          this.CloneZ3950Profile(event, id);
        }
        else if (event.currentTarget.attributes["type"].nodeValue == "delete") {
          this.DeleteZ3950Profile(event, id, profileName);
        }
      }
    });
    // this.setTitle();
  }

  GetProfileGridColumns() {
    let ActionWidth: string = "6%";
    var Use_Browser = window.navigator.userAgent;
    if (Use_Browser.indexOf("Trident") > -1 || Use_Browser.indexOf("Edge") > -1 || Use_Browser.indexOf("Firefox") > -1) {
      ActionWidth = "3%";
    }
    var columns = [
      {
        "title": "Customer", "className": "col-customer",
        render: function (data, type, full, meta) {
          return '<a title="' + full.customerName + '" class="TestCalls"><span>Customer&nbsp;</span>' + full.customerName + '</a>'
        }
      },
      {
        "title": "Profile Name", "className": "col-profname",
        render: function (data, type, full, meta) {
          return '<a title="' + full.profileName + '" class="TestCalls"><span>Profile Name&nbsp;</span>' + full.profileName + '</a>'
        }
      },
      {
        "title": "Search Type", "className": "col-searchtype",
        render: function (data, type, full, meta) {
          let searchType = full.isSearchTypeBib ? "Bibliographic" : "Authority";
          return '<a title="' + searchType + '" class="TestCalls"><span>Search Type&nbsp;</span>' + searchType + '</a>'
        }
      },
      {
        "title": "Search Database", "className": "col-searchdb",
        render: function (data, type, full, meta) {
          return '<a title="' + full.databaseName + '" class="TestCalls"><span>Search Database&nbsp;</span>' + full.databaseName + '</a>'
        }
      },
      {
        "title":'<span class="sr-only">Z3950 Action Buttons</span>' , "width": ActionWidth, "className": "text-center",
        render: function (data, type, full, meta) {
          return '<div class="z3950ActionBtns"><a type="clone" tabindex="0" profileName="' + full.profileName + '" profileId="' + full.id + '" class="mr-3 cloneLink" title="Clone"><img src="./assets/images/cloneImg.png" alt="Clone Profile"/></a><a type="delete" tabindex="0" alt="Delete Profile" profileName="' + full.profileName + '" profileId="' + full.id + '" class="editLink" title="Delete"><em class="fas fa-trash-alt" aria-hidden="true"></em></a></div>';
        }
      }
    ];
    return columns;
  }

  getAllZ3950Profiles(id: string, form: any, profileName: string, isNew: boolean) {
    this.spinnerService.spinnerStart();
    this.z3950Service.getAllZ3950Profiles().subscribe(result => {
      $("#z3950SearchFilter").val("");
      var searchCatalogItems = JSON.parse(localStorage.getItem(
        Constants.LocalStorage.SAVECATALOGITEMS
      ));

      //Select the first id and get the details
      if (result.length > 0) {
        var req: any;
        if (isNew) {
          req = result.find(x => x.profileName === profileName);
        }
        else {
          req = result.find(x => x.id === id);
        }
        if (req != null) {
          for (let i = 0; i <= searchCatalogItems.length; i++) {
            if(searchCatalogItems[i]!=undefined){
              if (isNew) {
                if (req.profileName === searchCatalogItems[i].profileName) {
                  searchCatalogItems[i].id = req.id;
                  searchCatalogItems[i].databaseName = req.databaseName;
                  searchCatalogItems[i].profileName = req.profileName;
                  searchCatalogItems[i].customerName = req.customerName;
                  searchCatalogItems[i].isSearchTypeBib = req.isSearchTypeBib;
                  searchCatalogItems[i].NonEncrypt=req.NonEncrypt;
                  break;
                }
              }
              else {
                if (req.id === searchCatalogItems[i].id) {
                  searchCatalogItems[i].databaseName = req.databaseName;
                  searchCatalogItems[i].profileName = req.profileName;
                  searchCatalogItems[i].customerName = req.customerName;
                  searchCatalogItems[i].isSearchTypeBib = req.isSearchTypeBib;
                  searchCatalogItems[i].NonEncrypt=req.NonEncrypt;
                  break;
                }
              }
            }
          }
        }

        localStorage.setItem(
          Constants.LocalStorage.SAVECATALOGITEMS,
          JSON.stringify(searchCatalogItems)
        );

        this.finalResponse = searchCatalogItems.filter((elem) => result.find(({ id }) => elem.id === id));
        var finalResult = [];
        if (this.finalResponse.length > 0) {
          finalResult = this.finalResponse.slice(0, this.gridProfileCount);
        }
        if (finalResult.length > 0) {
          if (id === "") {
            this.selectedId = finalResult[0].id;
          }
          else {
            this.selectedId = id;
          }
        }
        if (this.table != null) {
          this.ReInitializeProfileGrid(finalResult);
        }
       
        if (id === "" && finalResult.length>0)
          this.showProfileRecord(finalResult[0].id, form, false);
        else {
          if(finalResult.length > 0){
            this.divShow=true;
            this.showProfileRecord(id, form, false);
          } else {
            this.divShow = false;
          }
        }
        this.spinnerService.spinnerStop();
        this.divGridResult = true;
      }
      this.isNewProfile = false;
    });
  }

  saveZ3950Profile(myForm: NgForm) {
    this.z3950ResultData.loginOptions = [];
    this.loginType.loginType = this.selLoginTypeRdbButton;
    this.loginType.userId = this.uId.nativeElement.value;
    this.loginType.password = this.pwd.nativeElement.value;
    this.z3950ResultData.loginOptions.push(this.loginType);
    if (this.RequiredFieldsValidation()) {
      this.isProfileDuplicate = false;
      //this.spinnerService.onRequestStarted();
      this.spinnerService.spinnerStart();
      this.z3950ResultData.customerName = this.z3950ResultData.customerName.trim();
      this.z3950ResultData.profileName = this.z3950ResultData.profileName.trim();

      if (this.isCloneRecord || this.z3950ResultData.id == "") {
        this.z3950ResultData.id = "";
        this.z3950ResultData.createdBy = localStorage.getItem(Constants.LocalStorage.ACTOR);
        this.z3950ResultData.createdDate = new Date();
        this.z3950ResultData.lastModifiedBy = localStorage.getItem(Constants.LocalStorage.ACTOR);
        this.z3950ResultData.lastModifiedDate = new Date();
      } else {
        this.z3950ResultData.lastModifiedBy = localStorage.getItem(Constants.LocalStorage.ACTOR);
        this.z3950ResultData.lastModifiedDate = new Date();
      }

      //Get all Search Type attribute values to save if nothing is selected
      this.getAllSearchTypeAttributesToSave();

      //Preserve previous selection of search type
      var prevData = this.objPrevSelSearchType.find(a => a.profileName == this.z3950ResultData.profileName)
      if (prevData) {
        prevData.searchTypeVal = this.selSearchTypeVal,
          prevData.searchTypeText = this.selSearchTypeText
      }
      else {
        this.objPrevSelSearchType.push({
          profileName: this.z3950ResultData.profileName,
          searchTypeVal: this.selSearchTypeVal,
          searchTypeText: this.selSearchTypeText
        });
      }

      this.z3950Service
        .saveZ3950Profile(this.z3950ResultData)
        .subscribe(result => {
          this.isCloneRecord = false;
          this.isNewProfile = false;
          //this.spinnerService.onRequestFinished();
          this.spinnerService.spinnerStop();
          if (result.Message != "") {
            myForm.form.markAsPristine();
            let dialogRef = this.dialog.open(ConfirmationDialogComponent, {
              width: "500px",
              height: "auto",
              disableClose: true,
              data: {
                isCopyErrorMsg: false,
                isCancelConfirm: false,
                message: result.Message
              }
            });
            var isNew = false;
            if (this.z3950ResultData.id == "") {
              isNew = true;
              var item = new Z3950Profile();
              item.isActive = false;
              item.isDeleted = false;
              //item.id = this.z3950ResultData.profileName;
              item.profileDescription = this.z3950ResultData.profileDescription;
              item.profileName = this.z3950ResultData.profileName;
              item.databaseName = this.z3950ResultData.databaseName;
              item.customerName = this.z3950ResultData.customerName;
            }

            dialogRef.afterClosed().subscribe(result => {
              this.z3950ResultData.isActive = false;
              this.getAllZ3950Profiles(this.z3950ResultData.id, myForm, this.z3950ResultData.profileName, isNew); // After save loading the grid

              if (isNew) {
                var catlogitems = localStorage.getItem(
                  Constants.LocalStorage.SAVECATALOGITEMS
                );
                this.searchCatalogItems = JSON.parse(catlogitems);
                if(!this.isExternalUser){
                  if (item) this.searchCatalogItems.push(item);
                }
                localStorage.setItem(
                  Constants.LocalStorage.SAVECATALOGITEMS,
                  JSON.stringify(this.searchCatalogItems)
                );
              }
            });
          }
          else {
            this.isProfileDuplicate = true;
            this.displayWarnMessage = true;
            $("#profileName").focus();
          }
        },
          (error) => {
            if (error.status == 403) {
              //this.displayUnAuthMessage = true;
              this.spinnerService.spinnerStop();
              if (this.form.dirty) {
                this.form.form.markAsPristine();
              }
              alert(error.statusText);
              this.router.navigate(['/unauthorized']);
            }
            else{
              this.spinnerService.spinnerStop();
              throw(error);
            }
          });
      $("#saveZ3950Profile").focusout();
    }
  }

  clearErrors() {
    this.displayWarnMessage = false;
    this.displayUnAuthMessage = false;
    this.isCustomerRequired = true;
    this.isProfileRequired = true;
    this.ishostRequired = true;
    this.isPortRequired = true;
    this.isSearchDBRequired = true;
    this.isUserIdRequired = true;
    this.isPasswordRequired = true;
  }

  back(form: NgForm) {
    this.displayWarnMessage = false;
    this.displayUnAuthMessage = false;
    this.isCustomerRequired = true;
    this.isProfileRequired = true;
    this.ishostRequired = true;
    this.isPortRequired = true;
    this.isSearchDBRequired = true;
    this.isUserIdRequired = true;
    this.isPasswordRequired = true;
    this.isProfileDuplicate = false;
    if (form.dirty) {
      form.form.markAsPristine();
      if (this.isNewProfile) {
        this.isNewProfile = false;
        this.clickNew(this.form);
      }
      else if (this.isCloneRecord) {
        this.showProfileRecord(this.selectedId, this.form, true);
      }
      else {
        // cancel
        // this.getAllZ3950Profiles(this.selectedId, this.form, "", false);
        var finalResponse = JSON.parse(localStorage.getItem(
          Constants.LocalStorage.SAVECATALOGITEMS
        ));

        if (finalResponse != null && finalResponse.length > 0) {
          finalResponse = finalResponse.filter(
            x => this.defaultCatalogIds.indexOf(x.id) ===-1
          );
        }
        var finalResult = [];
        finalResult = finalResponse.slice(0, this.gridProfileCount);

        if (this.table != null) {
          this.ReInitializeProfileGrid(finalResult);
        }

        this.divGridResult = true;
        //Select the first id and get the details
        this.isNewProfile = false;
        this.isCloneRecord = false;
      }
    }
  }

  // Show confirmation message if form dirty
  confirmationMessage(form: NgForm, section: any, id: any) {
    let dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: "500px",
      height: "auto",
      disableClose: true,
      data: {
        isCopyErrorMsg:false,
        isCancelConfirm: true,
        message:
          "There are unsaved changes. Are you sure you want to leave this page? "
      }
    });

    dialogRef.afterClosed().subscribe(
      result => {
        if (result) {
          this.isCloneRecord = false;
          form.form.markAsPristine();
          if (section == "new") this.clickNew(form);
          else if (section == "showProfile") {
            this.showProfile(id, false);
          }
          else if (section == "searchProfile") {
            var searchTerm = $("#z3950SearchFilter").val();
            var searchText = searchTerm.trim().toLowerCase();
            this.BindSearchResultsToGrid(searchText);
          }
          else this._location.back();
        }
        else
          form.form.markAsDirty();
      },
      error => { }
    );
  }
  ngAfterViewInit() {
    $(document).ready(function () {
      $("#mainNav li.home").removeClass("active");
      $("#mainNav li.admin").addClass("active");
    });
  }

  getLogTypeRadioValue(logType: string): void {
    this.selLoginTypeRdbButton = logType;
    if (logType === "UserIdAndPassword") {
      this.editable = true;
    } else {
      this.editable = false;
      this.modelUserId = "";
      this.modelPassword = "";
      this.isUserIdRequired = true;
      this.isPasswordRequired = true;
    }

    //Push the login data to the result data object
    this.z3950ResultData.loginOptions = [];
    this.loginType.loginType = this.selLoginTypeRdbButton;
    this.loginType.userId = this.modelUserId;
    this.loginType.password = this.modelPassword;
    this.z3950ResultData.loginOptions.push(this.loginType);
  }

  getFormatValue(searchType: boolean): string {
    return searchType ? "Bibliographic" : "Authority";
  }

  showProfileRecord(id: string, form: NgForm, isClone: boolean) {
    this.isNewProfile = false;
    if (form && form.form.dirty) {
      this.confirmationMessage(form, "showProfile", id);
    } else if (form) {
      form.form.markAsPristine();
      this.showProfile(id, isClone);
    } else {
      this.showProfile(id, isClone);
    }
  }

  showProfile(id: any, isClone: boolean) {
    this.clearErrors();
    this.selectedId = id; // Highlighting the selected row in the grid.

    this.spinnerService.spinnerStart();
    this.z3950Service.getZ3950ProfilesByUserId(id).subscribe( profileResult => {
      this.z3950ResultData = profileResult;
      this.spinnerService.spinnerStop();
      if (this.z3950ResultData.loginOptions.length > 0) {
        this.modelLoginType = this.z3950ResultData.loginOptions[0].loginType;

        this.modelUserId =
          this.z3950ResultData.loginOptions[0].userId != ""
            ? this.z3950ResultData.loginOptions[0].userId
            : "";
        this.modelPassword =
          this.z3950ResultData.loginOptions[0].password != ""
            ? this.z3950ResultData.loginOptions[0].password
            : "";

        this.getLogTypeRadioValue(this.modelLoginType);
      }

      //Select the first item in the SearchType
      if (this.z3950SearchType.length > 0) {
        if (this.objPrevSelSearchType && this.objPrevSelSearchType.length > 0) {
          var prevData = this.objPrevSelSearchType.find(a => a.profileName == this.z3950ResultData.profileName)
          if (prevData) {
            this.selSearchTypeVal = prevData.searchTypeVal;
            this.selSearchTypeText = prevData.searchTypeText;
          }
          else {
            this.selSearchTypeText = this.z3950SearchType[0].name;
            this.selSearchTypeVal = this.z3950SearchType[0].value;
          }
        }
        else {
          this.selSearchTypeText = this.z3950SearchType[0].name;
          this.selSearchTypeVal = this.z3950SearchType[0].value;
        }
        this.setAttributeValues(this.selSearchTypeText, this.selSearchTypeVal);
      }

      $("#profileDescription").scrollTop(0);

      this.divShow = true;
      this.isAttrOptionsReadOnly = true;
      if (this.isCloneRecord) {
        //this.z3950ResultData.id="";
        this.z3950ResultData.profileDescription = "";
        this.z3950ResultData.profileName = "";
        this.z3950ResultData.customerName = "";

        if (!isClone) {
          let dialogRef = this.dialog.open(ConfirmationDialogComponent, {
            width: "500px",
            height: "auto",
            disableClose: true,
            data: {
              isCopyErrorMsg:false,
              isCancelConfirm: false,
              message: "The Z39.50 Profile has been cloned successfully. Please enter the required attributes and save the profile."
            }
          });
        }
      }
    });
  }

  clickNew(form: NgForm) {
    this.isNewProfile = true;
    this.isCloneRecord = false;
    this.displayWarnMessage = false;
    this.displayUnAuthMessage = false;
    if (form.form.dirty) {
      this.confirmationMessage(form, "new", null);
    } else {
      form.form.markAsPristine();

      this.divShow = true;
      //Clear all the fields
      this.z3950ResultData.id = '';
      this.z3950ResultData.profileName = '';
      this.z3950ResultData.customerName = '';
      this.z3950ResultData.profileDescription = '';
      this.z3950ResultData.databaseName = '';
      this.z3950ResultData.hostAddress = '';
      this.z3950ResultData.isActive = true;
      this.z3950ResultData.isSearchTypeBib = true;
      this.z3950ResultData.portNumber = '';
      this.z3950ResultData.searchDatabase = '';
      this.z3950ResultData.loginOptions = [];
      this.z3950ResultData.attributeOptions = [];
      this.attributeOption.attributes = [];
      this.modelLoginType = "Anonymous";
      this.selLoginTypeRdbButton = 'Anonymous';
      this.modelPassword = '';
      this.modelUserId = '';
      this.loginType.loginType = this.selLoginTypeRdbButton;
      this.loginType.userId = '';
      this.loginType.password = '';
      this.z3950ResultData.loginOptions.push(this.loginType);

      this.getLogTypeRadioValue(this.modelLoginType);

      this.isCustomerRequired = true;
      this.isProfileRequired = true;
      this.ishostRequired = true;
      this.isPortRequired = true;
      this.isSearchDBRequired = true;
      this.isAttrOptionsReadOnly = false;
      this.selectedId = '';
      this.table.$('tr.active').removeClass('active');
      this.isProfileDuplicate = false;

      //Select the first item in the SearchType
      if (this.z3950SearchType.length > 0) {
        $("#lstSearchType li:first-child").click();
      }

      this.Set_Element_Focus();
    }
  }

  Set_Element_Focus() {
    const element = this.renderer2.selectRootElement(`#profileName`);
    if (element != null) {
      setTimeout(() => element.focus(), 0);
    }
  }


  RequiredFieldsValidation(): boolean {
    if (this.z3950ResultData.customerName != "") {
      this.isCustomerRequired = true;
    } else {
      this.isCustomerRequired = false;
    }
    if (this.z3950ResultData.profileName != "") {
      this.isProfileRequired = true;
    } else {
      this.isProfileRequired = false;
    }
    if (this.z3950ResultData.hostAddress != "") {
      this.ishostRequired = true;
    } else {
      this.ishostRequired = false;
    }
    if (this.z3950ResultData.portNumber != "") {
      this.isPortRequired = true;
    } else {
      this.isPortRequired = false;
    }
    if (this.z3950ResultData.databaseName != "") {
      this.isSearchDBRequired = true;
    } else {
      this.isSearchDBRequired = false;
    }

    if (this.z3950ResultData.loginOptions[0].loginType == "UserIdAndPassword") {
      if (this.z3950ResultData.loginOptions[0].userId === "" && this.z3950ResultData.loginOptions[0].password === "") {
        this.isUserIdRequired = false;
        this.isPasswordRequired = false;
      }
      else if (this.z3950ResultData.loginOptions[0].userId === "") {
        this.isUserIdRequired = false;
        this.isPasswordRequired = true;
      }
      else if (this.z3950ResultData.loginOptions[0].password === "") {
        this.isPasswordRequired = false;
        this.isUserIdRequired = true;
      }
      else {
        this.isUserIdRequired = true;
        this.isPasswordRequired = true;
      }
    }

    if (
      this.isCustomerRequired &&
      this.isProfileRequired &&
      this.ishostRequired &&
      this.isPortRequired &&
      this.isSearchDBRequired &&
      this.isUserIdRequired &&
      this.isPasswordRequired
    ) {
      this.displayWarnMessage = false;
      return true;
    } else {
      this.displayWarnMessage = true;
      return false;
    }
  }

  ValidateForm(id: string) {

    if (id == "profile-name") {
      if (this.z3950ResultData.profileName != "") {
        this.isProfileRequired = true;
      } else {
        this.isProfileRequired = false;
      }
    }

    if (id == "customer-name") {
      if (this.z3950ResultData.customerName != "") {
        this.isCustomerRequired = true;
      } else {
        this.isCustomerRequired = false;
      }
    }

    if (id == "host-address") {
      if (this.z3950ResultData.hostAddress != "") {
        this.ishostRequired = true;
      } else {
        this.ishostRequired = false;
      }
    }

    if (id == "port-number") {
      if (this.z3950ResultData.portNumber != "") {
        this.isPortRequired = true;
      } else {
        this.isPortRequired = false;
      }
    }

    if (id == "database-name") {
      if (this.z3950ResultData.databaseName != "") {
        this.isSearchDBRequired = true;
      } else {
        this.isSearchDBRequired = false;
      }
    }

    if (id == "user-pwd" && this.z3950ResultData.loginOptions[0].loginType == "UserIdAndPassword") {
      if (this.modelUserId === "" && this.modelPassword === "") {
        this.isUserIdRequired = false;
        this.isPasswordRequired = false;
      }
      else if (this.modelUserId === "") {
        this.isUserIdRequired = false;
        this.isPasswordRequired = true;
      }
      else if (this.modelPassword === "") {
        this.isPasswordRequired = false;
        this.isUserIdRequired = true;
      }
      else {
        this.isUserIdRequired = true;
        this.isPasswordRequired = true;
      }
    }
  }

  cancel() {
    this.router.navigate(["/search"]);
  }

  getSelectedOptionTextForUse(event: Event) {
    let selectedOptions = event.target["options"];
    let selectedIndex = selectedOptions.selectedIndex;
    this.selectedUseText = selectedOptions[selectedIndex].text;

    let selectedValue = event.target["value"];
    this.selectAttributesOnChange(selectedValue, "Use", this.selSearchTypeText, "");
    if (selectedValue === "0") {
      this.isUseAttributeRequired = false;
    }
    else {
      this.isUseAttributeRequired = true;
    }
  }

  getSelectedOptionTextForStructure(event: Event) {
    let selectedOptions = event.target["options"];
    let selectedIndex = selectedOptions.selectedIndex;
    this.selectedStructureText = selectedOptions[selectedIndex].text;

    let selectedValue = event.target["value"];
    this.selectAttributesOnChange(selectedValue, "Structure", this.selSearchTypeText, "");
  }

  getSelectedOptionTextForRelation(event: Event) {
    let selectedOptions = event.target["options"];
    let selectedIndex = selectedOptions.selectedIndex;
    this.selectedRelationText = selectedOptions[selectedIndex].text;

    let selectedValue = event.target["value"];
    this.selectAttributesOnChange(selectedValue, "Relation", this.selSearchTypeText, "");
  }

  getSelectedOptionTextForPosition(event: Event) {
    let selectedOptions = event.target["options"];
    let selectedIndex = selectedOptions.selectedIndex;
    this.selectedPositionText = selectedOptions[selectedIndex].text;

    let selectedValue = event.target["value"];
    this.selectAttributesOnChange(selectedValue, "Position", this.selSearchTypeText, "");
  }

  getSelectedOptionTextForTruncation(event: Event) {
    let selectedOptions = event.target["options"];
    let selectedIndex = selectedOptions.selectedIndex;
    this.selectedTruncationText = selectedOptions[selectedIndex].text;

    let selectedValue = event.target["value"];
    this.selectAttributesOnChange(selectedValue, "Truncation", this.selSearchTypeText, "");
  }

  getSelectedOptionTextForCompleteness(event: Event) {
    let selectedOptions = event.target["options"];
    let selectedIndex = selectedOptions.selectedIndex;
    this.selectedCompletenessText = selectedOptions[selectedIndex].text;

    let selectedValue = event.target["value"];
    this.selectAttributesOnChange(selectedValue, "Completeness", this.selSearchTypeText, "");
  }

  //fix for enter key on profile description.
  getprofileDesc() {
    var content = this.z3950ResultData.profileDescription;
    var caret = $('#profileDescription').prop("selectionStart");
    this.z3950ResultData.profileDescription = content.substring(0, caret) + "\n" + content.substring(caret, content.length);
  }

  getCaret(el) {
    if (el.selectionStart) {
      return el.selectionStart;
    }
    return 0;
  }

  searchTypeChange(event: Event, name) {
    this.selSearchTypeText = name;
    this.selSearchTypeVal = event.target["value"];

    var attrOpt = this.z3950ResultData.attributeOptions.find(x => x.searchType == this.selSearchTypeText);
    if (!attrOpt) {
      //Set default values for the attributes dropdowns
      this.modelUse = this.selSearchTypeVal;
      this.modelRelation = 0;
      this.modelPosition = 0;
      this.modelStructure = 0;
      this.modelTruncation = 0;
      this.modelCompleteness = 0;
    }
    this.setAttributeValues(this.selSearchTypeText, this.selSearchTypeVal);
  }

  setAttributeValues(selectedSearchTypeText: string, selectedSearchTypeValue: number) {
    //Set back the attribute dropdown values based on the search type selection
    if (this.z3950ResultData.attributeOptions.length > 0) {
      var attrOpt = this.z3950ResultData.attributeOptions.find(x => x.searchType == selectedSearchTypeText);
      if (attrOpt) {
        var attrUse = attrOpt.attributes.find(a => a.attributename == "Use");
        if (attrUse) {
          this.modelUse = attrUse.value;
          if (attrUse.value === "0") {
            this.isUseAttributeRequired = false;
          }
          else {
            this.isUseAttributeRequired = true;
          }
        } else {
          this.modelUse = selectedSearchTypeValue;
        }

        var attrStruct = attrOpt.attributes.find(a => a.attributename == "Structure");
        if (attrStruct) {
          this.modelStructure = attrStruct.value;
        }
        else {
          this.modelStructure = "0";
        }
        var attrRel = attrOpt.attributes.find(a => a.attributename == "Relation");
        if (attrRel) {
          this.modelRelation = attrRel.value;
        }
        else {
          this.modelRelation = "0";
        }
        var attrPos = attrOpt.attributes.find(a => a.attributename == "Position");
        if (attrPos) {
          this.modelPosition = attrPos.value;
        }
        else {
          this.modelPosition = "0";
        }

        var attrTrun = attrOpt.attributes.find(a => a.attributename == "Truncation");
        if (attrTrun) {
          this.modelTruncation = attrTrun.value;
        }
        else {
          this.modelTruncation = "0";
        }

        var attrComp = attrOpt.attributes.find(a => a.attributename == "Completeness");
        if (attrComp) {
          this.modelCompleteness = attrComp.value;
        }
        else {
          this.modelCompleteness = "0";
        }
      }
    }
  }

  selectAttributesOnChange(selectedAttrValue: string, selectedAttrText: string, selSearchTypeText: string, selectedSearchType: string) {
    if (this.z3950ResultData.attributeOptions.length > 0) {
      var attrOpt = this.z3950ResultData.attributeOptions.find(x => x.searchType == selSearchTypeText);
      if (attrOpt) {
        var attr = attrOpt.attributes.find(a => a.attributename == selectedAttrText);
        if (attr) {
          attr.attributename = selectedAttrText;
          attr.value = selectedAttrValue;
        }
        else {
          this.tempAttribute = new Attributes();
          this.tempAttribute.attributename = selectedAttrText;
          this.tempAttribute.value = selectedAttrValue;
          attrOpt.attributes.push(this.tempAttribute);
        }
      }
      else {
        this.attributeOption = new AttributeOption();
        this.attributeOption.attributes = [];
        this.attributeOption.searchType = selSearchTypeText;
        this.attributeOption.type = selectedSearchType;
        this.tempAttribute = new Attributes();
        this.tempAttribute.attributename = selectedAttrText;
        this.tempAttribute.value = selectedAttrValue;
        this.attributeOption.attributes.push(this.tempAttribute);
        this.z3950ResultData.attributeOptions.push(this.attributeOption);
      }
    }
    else {
      this.attributeOption = new AttributeOption();
      this.attributeOption.attributes = [];
      this.attributeOption.searchType = selSearchTypeText;
      this.attributeOption.type = selectedSearchType;
      this.tempAttribute = new Attributes();
      this.tempAttribute.attributename = selectedAttrText;
      this.tempAttribute.value = selectedAttrValue;
      this.attributeOption.attributes.push(this.tempAttribute);
      this.z3950ResultData.attributeOptions.push(this.attributeOption);
    }

  }

  getAllSearchTypeAttributesToSave() {
    var obj = [];
    if (this.z3950ResultData && this.z3950ResultData.attributeOptions) {
      var attrOptions = this.z3950ResultData.attributeOptions;
      $("#lstSearchType li").each(function (i, s) {
        var searchTypeText = s.innerText;
        var attrValue = s.value;
        var type = s.type;
        obj.push({ text: searchTypeText, value: attrValue, type: type });
      });
    }
    obj.forEach(o => {
      var attrOpt = attrOptions.find(x => x.searchType == o.text);
      var val = "";

      if (attrOpt && attrOpt.attributes.find(a => a.attributename == "Use"))
        val = attrOpt.attributes.find(a => a.attributename == "Use").value;
      else
        val = o.value;
      this.selectAttributesOnChange(val, "Use", o.text, o.type);

      if (attrOpt && attrOpt.attributes.find(a => a.attributename == "Structure"))
        val = attrOpt.attributes.find(a => a.attributename == "Structure").value;
      else
        val = "0";
      this.selectAttributesOnChange(val, "Structure", o.text, o.type);


      if (attrOpt && attrOpt.attributes.find(a => a.attributename == "Relation"))
        val = attrOpt.attributes.find(a => a.attributename == "Relation").value;
      else
        val = "0";
      this.selectAttributesOnChange(val, "Relation", o.text, o.type);

      if (attrOpt && attrOpt.attributes.find(a => a.attributename == "Position"))
        val = attrOpt.attributes.find(a => a.attributename == "Position").value;
      else
        val = "0";
      this.selectAttributesOnChange(val, "Position", o.text, o.type);

      if (attrOpt && attrOpt.attributes.find(a => a.attributename == "Truncation"))
        val = attrOpt.attributes.find(a => a.attributename == "Truncation").value;
      else
        val = "0";
      this.selectAttributesOnChange(val, "Truncation", o.text, o.type);

      if (attrOpt && attrOpt.attributes.find(a => a.attributename == "Completeness"))
        val = attrOpt.attributes.find(a => a.attributename == "Completeness").value;
      else
        val = "0";
      this.selectAttributesOnChange(val, "Completeness", o.text, o.type);
    });
  }

  // set title for all td values in a table
  setTitle() {
    $(".dataTables_scrollBody")
      .find("table")
      .find("tbody")
      .find("tr")
      .find("td").each(function (i, e) {
        //if ($(e).find('a').width() > $(e).width() && $(e).length > 0) {
        if ($(e).length > 0) {
          if ($(e).find('a').length > 0 && $(e).find('a')[0].innerText.split('\n').length > 0) {
            if ($(e).find('a')[0].innerText.split('\n')[1])
              $(e)[0].title = $(e).find('a')[0].innerText.split('\n')[1];
            else
              $(e)[0].title = "";
          } else {
            $(e)[0].title = "";
          }
        }
      });
  }


  keydown(event: KeyboardEvent) {
    if (!event.ctrlKey&&event.keyCode == 123)//F12
    {
      //alert("F12")
      return false;

    }
    else if ( event.which == 46 )//DELETE
    {
      //alert("DELETE")
      return false;

    }
    else if ( event.which == 13)//ENTER
    {
      //alert("ENTER")
      return false;

    }
    else if ((event.ctrlKey && event.which == 123))//CTRL+F12
    {

      //alert("CTRL+F12")

      return false;
    }
    else if ((event.ctrlKey && event.which == 68))//CTRL+D
    {

      // alert("CTRL+D")

      return false;
    }
    else if ((event.ctrlKey && event.which == 70))//CTRL+F
    {
      // alert("CTRL+F")
      return false;
    }
    else {

    }
  }

}



