import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { TemplateService } from '../shared/service/template.service';
import { Router } from '@angular/router';
import { SpinnerService } from 'src/app/shared/interceptor/spinner.service';
import { Title } from '@angular/platform-browser';
import { Constants } from 'src/app/constants/constants';
import { Template, ViewTemplate, FilterParams } from '../shared/template';
import { MatDialog } from "@angular/material";
import { ConfirmationDialogComponent } from "src/app/components/shared/confirmation-dialog/confirmation-dialog.component";
import { Marc, TemplateType, MarcEditorSettings } from 'src/app/marc/shared/marc';
import { MarcService } from 'src/app/marc/shared/service/marc-service';
import { UtilService } from 'src/app/shared/util.service';
import { CommonService } from 'src/app/shared/service/common.service';
import { BaseComponent } from 'src/app/base.component';
import { AuthenticationService } from 'src/app/security/authentication.service';
import { Permissions } from 'src/app/security/permissions';
import { MarcSettingsService } from 'src/app/services/marc-settings.service';
declare var $: any;
@Component({
  selector: 'app-view-template',
  templateUrl: './view-template.component.html',
  styleUrls: ['./view-template.component.css']
})
export class ViewTemplateComponent extends BaseComponent implements OnInit {

  CWidowHeight: number;
  CHeaderHeight: number;
  CNavHeight: number;
  HeaderHeight: number;
  NewHeight: number;
  CSearchHeight: number;
  CompareBtn: number;

  templateResponse: ViewTemplate[];
  divTemplateGridResult: boolean = false;
  selectedId: string;
  gridTemplateCount: number = 30;
  table: any;
  isNewTemplate: boolean;
  displayWarnMessage: boolean;
  typingTimer: any;
  doneTypingInterval: number = 1000;
  templates: Template[];
  marcItem: Marc;
  filterParams: FilterParams;
  isTemplatesPage: boolean = false;
  templateTypes: TemplateType[];
  disableInstitution: boolean = false;
  clear: boolean = true;
  marcSettings:MarcEditorSettings;
  constructor(
    private templateService: TemplateService,
    private router: Router,
    private spinnerService: SpinnerService,
    private _titleService: Title,
    private dialog: MatDialog,
    private service: MarcService,
    private cdr: ChangeDetectorRef,
    private utilService: UtilService,  
    private authenticationService: AuthenticationService
  ) {
    super(router, authenticationService);
  }

  ngOnInit() {
    this._titleService.setTitle('BTCAT | Templates');
    // check current route is templates page
    this.isTemplatesPage = this.router.url === "/templates";

    // if (this.isTemplatesPage) {
    //   $("#mainNav li.home").removeClass("active");
    //   $("#mainNav li.admin").addClass("active");
    // }
    // else {
    //   $("#mainNav li.home").addClass("active");
    //   $("#mainNav li.admin").removeClass("active");
    // }

    let templateTypes = JSON.parse(
      localStorage.getItem(Constants.LocalStorage.TEMPLATETYPES)
    );
    this.marcSettings = JSON.parse(localStorage.getItem(Constants.LocalStorage.MARCSETTINGS));
    if (!templateTypes) {

      this.service.getMarcSettings().subscribe(item => {
        if (item) {
          //set the template types into local storage.
          localStorage.setItem(Constants.LocalStorage.TEMPLATETYPES, JSON.stringify(item.TemplateTypes));
          this.templateTypes = item.TemplateTypes;
        }
      });
    }
    else {
      this.templateTypes = templateTypes;
    }

    //Get all the templates data on load
    this.getAllTemplates();
  }

  //Filters on Institutional textbox and returns search results.
  InstitutionalSearchResults(finalResponse: any) {
    var searchResults = [];
    var searchText = $("#refineFilterInstitutions").val();
    if (searchText != "" && searchText != undefined) {
      let searchArray = searchText.toLowerCase().split(" ");
      searchResults = finalResponse.filter(
        x =>
          (
            x.level.toLowerCase().includes("global") ||
            x.level.toLowerCase().includes("local")
          )
      );
      searchArray.forEach(word => {
        var results = [];
        if (word != "") {
          results = finalResponse.filter(x => (x.institution.toLowerCase().includes(word)));
        }
        results.forEach(element => {
          searchResults.push(element);
        });
      });
      return searchResults;
    }
    else {
      return finalResponse;
    }
  }

  //Filters on Type and returns search results.
  TypeSearchResults() {
    var finalResponse = JSON.parse(localStorage.getItem(
      Constants.LocalStorage.TEMPLATES
    ));
    var searchResults = [];
    var type = $("#refineFilterType option:selected").text();
    if (type != "Select Type" && type != "" && type != undefined) {
      searchResults = finalResponse.filter(
        x =>
          (x.type.toLowerCase().includes(type.toLowerCase())));
      return searchResults;
    }
    else {
      return finalResponse;
    }
  }

  //Filters on whole templates based on keyword search returns search results.
  GlobalSearchTemplates(finalResponse: any) {
    var searchText = $("#templatesSearchFilter").val();
    if (searchText != "" && searchText != undefined) {
      let searchArray = searchText.toLowerCase().split(" ");
      var results = [];
      if (searchArray.length > 0) {
        let searchWord = searchArray[0];
        results = this.getFilterData(finalResponse, searchWord);
        if (searchArray.length > 1) {
          let filterWords = searchArray.slice(1, searchArray.length);
          filterWords.forEach(x => {
            results = this.getFilterData(results, x);
          });
        }
      }
      return results;
    }
    else {
      return finalResponse;
    }
  }
  private getFilterData(result: any, word: string) {
    return result.filter(
      x =>
        (x.name.toLowerCase().includes(word) ||
          x.description.toLowerCase().includes(word) ||
          x.level.toLowerCase().includes(word) ||
          x.institution.toLowerCase().includes(word) ||
          x.type.toLowerCase().includes(word) ||
          x.lastUsedDateString.toLowerCase().includes(word)
        )
    );
  }

  //Filters on Level and returns search results.
  LevelSearchResults(finalResponse: any) {
    var searchResults = [];
    var isDisableInstitution = false;
    var numberOfChecked = $('input.refineLevel:checkbox:checked').length;
    if (numberOfChecked > 0) {
      $("input.refineLevel:checkbox").each(function (event) {
        var results = [];
        var id = $(this)[0].id
        var searchTerm = "";
        if ($(this)[0].checked) {
          if (id == "refineFilterLevelGlobal") {
            searchTerm = "global";
          }
          else if (id == "refineFilterLevelInstitutional") {
            searchTerm = "institutional";
            isDisableInstitution = false;
          }
          else if (id == "refineFilterLevelLocal") {
            searchTerm = "local";
          }
          results = finalResponse.filter(
            x =>
              (x.level.toLowerCase().includes(searchTerm)));
          results.forEach(element => {
            searchResults.push(element);
          });
        }
        else {
          if (id == "refineFilterLevelInstitutional") {
            isDisableInstitution = true;
            $("#refineFilterInstitutions").val("");
          }
        }
      });
      this.disableInstitution = isDisableInstitution;
      return searchResults;
    }
    else {
      finalResponse = [];
      $("#refineFilterInstitutions").val("");
      this.disableInstitution = true;
      return finalResponse;
    }
  }


  StoreFilterParams() {
    this.filterParams = new FilterParams();
    this.filterParams.type = $("#refineFilterType option:selected").text();
    this.filterParams.local = $('#refineFilterLevelLocal:checkbox').prop("checked");
    this.filterParams.global = $('#refineFilterLevelGlobal:checkbox').prop("checked");
    this.filterParams.institutional = $('#refineFilterLevelInstitutional:checkbox').prop("checked");
    this.filterParams.search = $("#templatesSearchFilter").val();
    this.filterParams.institution = $("#refineFilterInstitutions").val();

    localStorage.setItem(
      Constants.LocalStorage.FILTERPARAMS,
      JSON.stringify(this.filterParams)
    );
  }
  clearSearch() {
    $('#refineFilterLevelLocal:checkbox').prop("checked", true);
    $('#refineFilterLevelGlobal:checkbox').prop("checked", true);
    $('#refineFilterLevelInstitutional:checkbox').prop("checked", true);
    $("#refineFilterType").val('Select Type');
    $("#templatesSearchFilter").val('');
    $("#refineFilterInstitutions").val('');
    this.clear = true;
    this.FacetSearchTemplates();
  }

  //Filters on all the combination of search items and bind the results to grid.
  FacetSearchTemplates() {
    this.StoreFilterParams();
    var results = [];
    var finalResult = [];
    results = this.TypeSearchResults();
    results = this.LevelSearchResults(results);
    results = this.InstitutionalSearchResults(results);
    results = this.GlobalSearchTemplates(results);

    const map = new Map();
    for (const item of results) {
      if (!map.has(item.id)) {
        map.set(item.id, true);
        finalResult.push(item);
      }
    }
    //finalResult = finalResult.sort((a, b) => a.Name - b.Name);
    // var finalRes = this.isTemplatesPage ? finalResult.sort((a ,b ): string => (a.name - b.name))
    //  : finalResult.sort((a, b) => (a.lastUsedDateString - b.lastUsedDateString) ? -1 : 1);

    var finalRes = [];

    if (this.isTemplatesPage)
      finalRes = finalResult.sort(function (a, b) {
        // var nameA = a.name.toLowerCase(), nameB = b.name.toLowerCase();
        // if (nameA < nameB) { return -1; }
        // if (nameA > nameB) { return 1; }
        // return 0;
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });
    // finalRes = finalResult.sort((a, b)  =>
    // a.name.toLowerCase() > b.name.toLowerCase() ? 1 : b.name.toLowerCase() > a.name.toLowerCase() ? -1 : 0);
    else
      finalRes = finalResult.sort(function (a, b) {
        return b.lastUsedDateString.toLowerCase().localeCompare(a.lastUsedDateString.toLowerCase());
      });
    //finalRes = finalResult.sort((a, b) => (new Date(a.lastUsedDateTime) > new Date(b.lastUsedDateTime)) ? -1 : 1);

    var searchResultsArray = finalRes.slice(0, this.gridTemplateCount);
    // if (searchResultsArray.length > 0) {
    //   this.selectedId = searchResultsArray[0].id;
    // }
    if (this.table != null) {
      this.reInitializeTemplatesGrid(searchResultsArray);
    }

    this.divTemplateGridResult = true;
    if (searchResultsArray.length > 0) {
      this.marcItem = new Marc();
      this.marcItem.fields = searchResultsArray[0].fields;
    }
    else {
      this.marcItem = new Marc();
      this.marcItem.fields = [];
    }
  }

  OnTypeChanged(event: Event) {
    if ($("#refineFilterType option:selected").text() != 'Select Type') {
      this.clear = false;
    } else {
      this.clear = true;
    }
    this.FacetSearchTemplates();
  }

  OnLevelChanged(event: Event) {
    if (!$('#refineFilterLevelLocal:checkbox').prop("checked") || !$('#refineFilterLevelGlobal:checkbox').prop("checked") || !$('#refineFilterLevelInstitutional:checkbox').prop("checked")) {
      this.clear = false;
    } else {
      this.clear = true;
    }
    this.FacetSearchTemplates();
  }

  // This method is used to search the templates based on keyword search.
  getTemplatesBySearchTerm(event: any) {
    // if($("#refineFilterInstitutions").val()!='' || $("#templatesSearchFilter").val()!=''){
    //   this.clear=false;
    // }else{
    //   this.clear=true;
    // }
    clearTimeout(this.typingTimer);
    //Timer will wait until user stops typing and then search will e performed.
    this.typingTimer = setTimeout(() => {
      this.FacetSearchTemplates();
    }, this.doneTypingInterval);
  }

  /* search split fix function - var values */
  customHeightFunction() {
    this.CWidowHeight = $(window).height();
    this.CHeaderHeight = $("app-header nav").height();
    this.CSearchHeight = $(".search_filter").height();
    this.CNavHeight = $(".mainNavSection").height();
    this.CompareBtn = $(".tableHeaderCounts").height();
    this.HeaderHeight =
      this.CHeaderHeight +
      this.CSearchHeight +
      this.CNavHeight +
      this.CompareBtn;
    this.NewHeight = this.CWidowHeight - this.HeaderHeight;
    this.NewHeight = this.NewHeight - 50;
    this.cdr.detectChanges();
  }

  RetainFilter() {
    this.filterParams = JSON.parse(localStorage.getItem(
      Constants.LocalStorage.FILTERPARAMS
    ));
    if (this.filterParams && this.filterParams != null) {
      $("#templatesSearchFilter").val(this.filterParams.search);
      $("#refineFilterInstitutions").val(this.filterParams.institution);
      $('#refineFilterType').val(this.filterParams.type);
      $('#refineFilterLevelLocal').attr('checked', this.filterParams.local);
      $('#refineFilterLevelGlobal').attr('checked', this.filterParams.global);
      $('#refineFilterLevelInstitutional').attr('checked', this.filterParams.institutional);
      this.FacetSearchTemplates();
    }
  }

  // multiple marc view methods -- End
  ngAfterViewChecked() {
    /* search split fix function  */
    // if($("#refineFilterInstitutions").val()!='' || $("#templatesSearchFilter").val()!='' || !$('#refineFilterLevelLocal:checkbox').prop("checked") || !$('#refineFilterLevelGlobal:checkbox').prop("checked") || !$('#refineFilterLevelInstitutional:checkbox').prop("checked")){
    //   this.clear=false;
    // }else{
    //   this.clear=true;
    // }
    this.customHeightFunction();
    $(window).resize(e => {
      this.customHeightFunction();
    });

    if ($.fn.dataTable.isDataTable("#templates")) {
      this.table = $("#templates").DataTable();
    } else if (this.templateResponse != null) {
      var finalResult = this.templateResponse.slice(0, this.gridTemplateCount);
      this.reInitializeTemplatesGrid(finalResult);
      this.RetainFilter();
      this.table.on('select', (e, dt, type, indexes) => {
        var data = this.table.rows(indexes).data();
        if (type === 'row' && data) {
          this.marcItem = new Marc();
          this.marcItem.fields = data[0].fields;
        }
      });

      this.table.on('dblclick', 'tr', (e) => {
        const data = this.table.row(e.currentTarget).data();
        if (data) {
          if (this.isTemplatesPage) {
            if ((data.level === "Global" && this.hasAccess(Permissions.CED_GTEMP)) ||
              (data.level === "Institutional" && this.hasAccess(Permissions.CED_ITEMP) ||
                (data.level === "Local" && this.hasAccess(Permissions.CED_LTEMP)))) {
              this.editTemplate(data.id);
            }
          }
          else {
            this.newRecord(data.id);
          }
        }
      });
    }
    $.fn.dataTable.ext.errMode = 'none';
  }

  //Initialize the grid with the data
  reInitializeTemplatesGrid(result: ViewTemplate[]) {
    var columns = this.getTemplateGridColumns();
    if ($.fn.dataTable.isDataTable('#templates')) {
      $("#templates").DataTable().destroy();
    }
    this.table = $("#templates").DataTable({
      paging: false,
      searching: false,
      select: {
        className: 'active'
      },
      info: false,
      data: result,
      columns: columns,
      order: [[this.isTemplatesPage ? 0 : 5, this.isTemplatesPage ? "asc" : "desc"]],
      autoWidth: true,
      scrollY: 117,
      scrollX: true,
      scroller: true,
      scrollCollapse: true,
      deferRender: true,
      columnDefs: [
        { orderable: false, targets: -1 }//,
        //{ type: 'date', 'targets': [5]}
      ],
      //"iDisplayLength": 2,
      language: {
        emptyTable: "<html><span tabindex='0'>No results found.</span></html>"
      },
      //ordering: true,
      "fnRowCallback": function (nRow, aData) {
        var $nRow = $(nRow);
        $nRow.attr("tabindex", 0);
        var tbl = $(this);
        $nRow.on("keydown", function search(e) {
          if (e.keyCode == 13) {
            var rowIndex = this._DT_RowIndex;
            var tab = $("#templates").DataTable();
            tab.rows().deselect();
            tab.rows(rowIndex).select();
          }
        });
        return nRow;
      },
    });

    $('.sorting_disabled').append('<span class="sr-only">Template action buttons</span>');
    var index = 0;
    var tableData = this.table.rows().data();
    if (tableData.length > 0) {
      // for (var i = 0; i < tableData.length; i++) {
      //   if (tableData[i].id == this.selectedId) {
      //     index = i;
      //     break;
      //   }
      // }
      this.table.row(':eq(0)').select();
      //this.table.row(index).scrollTo(false);
    }

    //This event will be called on keydown enter of Clone anf Delete.
    $("[type=clone],[type=delete],[type=edit]").keydown((event) => {
      if (event.keyCode == 13) {
        this.invokeActions(event);
      }
    });

    // This event will be called when Clone, Delete and Edit buttons are clicked.
    $('#templates').on('click', 'a', (event) => {
      if (event.currentTarget.attributes.length > 0) {
        this.invokeActions(event);
      }
    });

    //Set the titles
    //this.setTitle();
  }

  //Invoke the actions like Clone, Edit and Delete methods
  invokeActions(event: any) {
    if (event.currentTarget.attributes["templateId"]) {
      var id = event.currentTarget.attributes["templateId"].nodeValue;
      let templateName = event.currentTarget.attributes["templateName"].nodeValue;
      if (event.currentTarget.attributes["type"].nodeValue == "clone") {
        this.cloneTemplate(id);
      }
      else if (event.currentTarget.attributes["type"].nodeValue == "delete") {
        this.deleteTemplate(event, id, templateName);
      }
      else if (event.currentTarget.attributes["type"].nodeValue == "edit") {
        this.editTemplate(id);
      }
    }
  }

  //Route to the template page for the clone
  cloneTemplate(id: any) {
    if (id) {
      this.router.navigate([
        "/clone-template/",
        id
      ]);
    }
  }

  //Delete the template
  deleteTemplate(event: any, id: any, profileName: any) {
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
      this.table.rows(':eq(' + index + ')').select();
      this.selectedId = id;
    }
    event.stopImmediatePropagation();
    let dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: "500px",
      height: "auto",
      disableClose: true,
      data: {
        isCopyErrorMsg: false,
        isCancelConfirm: true,
        message:
          "Are you sure you want to delete the template " + profileName.trim() + "?"
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        var finalResponse = JSON.parse(localStorage.getItem(
          Constants.LocalStorage.TEMPLATES
        ));

        var templateData = finalResponse.filter(
          x => (x.id == id)
        );
        if (templateData.length > 0) {
          templateData[0].isActive = false;
          templateData[0].lastModifiedBy = localStorage.getItem(Constants.LocalStorage.ACTOR);
          this.spinnerService.spinnerStart();
          this.templateService.deleteTemplate(templateData[0]).subscribe(result => {
            this.spinnerService.spinnerStop();
            var templates = localStorage.getItem(
              Constants.LocalStorage.TEMPLATES
            );
            this.templates = JSON.parse(templates);
            for (var i = 0; i < this.templates.length; i++) {
              if (this.templates[i].id === id) {
                this.templates.splice(i, 1);
                break;
              }
            }
            localStorage.setItem(
              Constants.LocalStorage.TEMPLATES,
              JSON.stringify(this.templates)
            );
            let dialog = this.dialog.open(ConfirmationDialogComponent, {
              width: "500px",
              height: "auto",
              disableClose: true,
              data: {
                isCopyErrorMsg: false,
                isCancelConfirm: false,
                message: result.Message
              }
            });
            dialog.afterClosed().subscribe(result => {
              this.getAllTemplates();
            });
          },
            (error) => {
              if (error.status == 403) {
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
    });
  }

  //Route to the template page for edit
  editTemplate(id: any) {
    if (id) {
      this.router.navigate([
        "/edit-template/",
        id
      ]);
    }
  }


  newRecord(id: any) {
    if (id) {
      this.router.navigate([
        "/bibliographic-create/",
        id, 0
      ]);
    }
  }

  //Get all the grid columns to bind them to the grid
  getTemplateGridColumns() {
    var service = this.utilService;
    var hasGlobalWritePermission = this.hasAccess(Permissions.CED_GTEMP);
    var hasLocalWritePermission = this.hasAccess(Permissions.CED_LTEMP);
    var hasInstitutionalWritePermission = this.hasAccess(Permissions.CED_ITEMP);
    var columns = [
      {
        "title": "Name", "className": "col-name", "tooltip": "name",
        render: function (data, type, full, meta) {
          return '<a  title="' + full.name + '" class="TestCalls"><span>Name&nbsp;</span>' + full.name + '</a>'
        }
      },
      {
        "title": "Description", "className": "col-desc",
        render: function (data, type, full, meta) {
          return '<a title="' + full.description + '" class="TestCalls"><span>Description&nbsp;</span>' + full.description + '</a>'
        }
      },
      {
        "title": "Type", "className": "col-type",
        render: function (data, type, full, meta) {
          return '<a  title="' + full.type + '" class="TestCalls"><span>Type&nbsp;</span>' + full.type + '</a>'
        }
      },
      {
        "title": "Level", "className": "col-level",
        render: function (data, type, full, meta) {
          return '<a  title="' + full.level + '" class="TestCalls"><span>Level&nbsp;</span>' + full.level + '</a>'
        }
      },
      {
        "title": "Institution", "className": "col-inst",
        render: function (data, type, full, meta) {
          return '<a title="' + full.institution + '"  class="TestCalls"><span>Institution&nbsp;</span>' + full.institution + '</a>'
        }
      },
      {
        "title": "Last Used", "className": "col-lastused",
        render: function (data, type, full, meta) {
          if (full.lastUsedDateString != '') {
            let localDateTime = service.getDateinSystemFormat(full.lastUsedDateString);
            return '<a title="' + localDateTime + '" class="TestCalls"><span>Last Used&nbsp;</span>' + localDateTime + '</a>'
          } else {
            return '<a title="' + full.lastUsedDateString + '" class="TestCalls"><span>Last Used&nbsp;</span>' + full.lastUsedDateString + '</a>'
          }
        }
      },
      {
        "width": '8%', "className": "text-center", "visible": this.isTemplatesPage,
        render: function (data, type, full, meta) {
          var divClassName = ((full.level === "Global" && !hasGlobalWritePermission) ||
            (full.level === "Institutional" && !hasInstitutionalWritePermission) ||
            (full.level === "Local" && !hasLocalWritePermission)) ? "templateActionBtns disableForm" : "templateActionBtns";

          return '<div class="' + divClassName + '">'
            + '<a type="edit" tabindex="0" alt="Edit Template" templateName="' + full.name + '" templateId="' + full.id + '" class="mr-3 editLink" title="Edit"><em class="fas fa-edit" title="Edit" aria-hidden="true" aria-label="Press enter to edit"></em></a>'
            + '<a type="clone" tabindex="0" templateName="' + full.name + '" templateId="' + full.id + '" class="mr-3 cloneLink" title="Clone"><img src="./assets/images/cloneImg.png" alt="Clone Template"/></a>'
            + '<a type="delete" tabindex="0" alt="Delete Template" templateName="' + full.name + '" templateId="' + full.id + '" class="deleteLink" title="Delete"><em class="fas fa-trash-alt" aria-hidden="true"></em></a>'
            + '</div>';
        }
      }
    ];
    return columns;
  }

  setTitle() {
    $(".dataTables_scrollBody")
      .find("table")
      .find("tbody")
      .find("tr")
      .find("td").each(function (i, e) {
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

  //Get all the active templates based on the user
  getAllTemplates() {
    //this.spinnerService.onRequestStarted();
    this.spinnerService.spinnerStart();
    this.templateService.getAllTemplates(this.isTemplatesPage).subscribe(result => {
      //$("#templatesSearchFilter").val("");
      this.templateResponse = result;
      var finalResult = [];
      if (this.templateResponse.length > 0) {
        finalResult = this.templateResponse.slice(0, this.gridTemplateCount);
      }

      if (this.table != null) {
        this.reInitializeTemplatesGrid(finalResult);
      }
      localStorage.setItem(
        Constants.LocalStorage.TEMPLATES,
        JSON.stringify(this.templateResponse)
      );
      if (result.length > 0) {
        this.marcItem = new Marc();
        this.marcItem.fields = finalResult[0].fields;
      }
      //retain the search if delete is performed on searched results.
      if ($.fn.dataTable.isDataTable("#templates")) {
        this.FacetSearchTemplates();
      }
      //this.spinnerService.onRequestFinished();
      this.spinnerService.spinnerStop();
      this.divTemplateGridResult = true;
    });
  }

  ngAfterViewInit() {


  }

  //Route to the template page to create the template
  clickNewTemplate() {
    this.isNewTemplate = true;
    this.displayWarnMessage = false;
    this.router.navigate(["/create-template", this.isNewTemplate]);
  }
}

