import { Component, OnInit } from "@angular/core";
import { Location } from "@angular/common";
import { Marc, MarcRecordHistory, MarcEditorSettings } from "../shared/marc";
import { Router, ActivatedRoute } from "@angular/router";
import { MarcService } from "../shared/service/marc-service";
import { SpinnerService } from "src/app/shared/interceptor/spinner.service";
import { UtilService } from "src/app/shared/util.service";
import { Title } from "@angular/platform-browser";
import { ConfigurationService } from 'src/app/services/configuration.service';
import { Constants } from 'src/app/constants/constants';

declare var $: any;

@Component({
  selector: "app-marc-record-history",
  templateUrl: "./marc-record-history.component.html",
  styleUrls: ["./marc-record-history.component.css"]
})
export class MarcRecordHistoryComponent implements OnInit {
  recordNumber: any;
  table: any;
  marcItem: any;
  recordHistoryResponse: MarcRecordHistory[];
  selectAnyChkBox: boolean;
  selectedAll: any;
  selectedMarcs: any = [];
  lastSelectedCheckboxIndex: any;
  marcHistoryId: any;
  indexNumber:number=0;
  browseMaxRecords:number=0;
  recordCount:number=0;
  pageCounter:number=0;
  prevCounter=0;
  nextCounter=1;
  latestVersionNumber:number=0;
  minVersionNumber=0;
  maxVersionNumber=0;
  disablePrev:boolean=true;
  disableNext:boolean=true;
  CWidowHeight: number;
  CHeaderHeight: number;
  CNavHeight: number;
  HeaderHeight: number;
  NewHeight: number;
  CSearchHeight: number;
  CompareBtn: number;
  marcHeader: number;
  tooltip:string='Checkbox to view Marc Record';
  marcSettings: MarcEditorSettings;

  constructor(
    private _titleService: Title,
    private router: Router,
    private location: Location,
    private marcService: MarcService,
    private route: ActivatedRoute,
    private spinnerService: SpinnerService,
    private utilService: UtilService, 
    private configurationService: ConfigurationService
  ) {
    this.browseMaxRecords = configurationService.currentConfiguration().browseMaxRecords;
  }

  ngOnInit() {
    this._titleService.setTitle("BTCAT | Record History");

    this.route.params.subscribe(params => {
      this.recordNumber = params.recordNumber; // (+) converts string 'id' to a number
    });
    if (localStorage.getItem(Constants.LocalStorage.MARCSETTINGS) != null && localStorage.getItem(Constants.LocalStorage.MARCBIBDATA) != null) {
      this.marcSettings = JSON.parse(localStorage.getItem(Constants.LocalStorage.MARCSETTINGS));
  }
    if (this.recordNumber > 0) {
      this.spinnerService.spinnerStart();
      this.marcService
        .getMarcRecordHistory(this.recordNumber)
        .subscribe(item => {
          this.spinnerService.spinnerStop();
          if (item && item.length > 0) {
            this.recordHistoryResponse = item;
            this.recordHistoryResponse.map(x => {
              if (this.recordHistoryResponse[0].id === x.id)
                x.isFirstRecord = true;
              else x.isFirstRecord = false;
              //pagination block code
              this.pageCounter=this.recordHistoryResponse[0].versionNumber;
              this.latestVersionNumber=this.recordHistoryResponse[0].versionNumber; //set as max number of records
              this.maxVersionNumber=this.latestVersionNumber; //max version number
              this.latestVersionNumber=this.latestVersionNumber-this.browseMaxRecords; // for page load iteration.
              this.minVersionNumber=this.latestVersionNumber;
              if(this.minVersionNumber<0 || this.latestVersionNumber === 0){
                this.disablePrev=true;
              }else{
                this.disablePrev=false;
              }
              //end of pagination code

              if (x && x.fields && x.fields.find(x => x.tag === "245").subfields.length > 0) {
                let fields = x.fields.find(x => x.tag === "245").subfields;
                x.title = "";
                fields.forEach(element => {
                  x.title += element.data;
                });
              } else x.title = "";
              if (x.editedDate != "") {
                x.editedDate = this.utilService.getDateinSystemFormat(
                  x.editedDate
                );
              }
            });
            if (
              this.recordHistoryResponse &&
              this.recordHistoryResponse.length > 0
            )
              this.marcHistoryId = this.recordHistoryResponse[0].id;
          }
        });
    }

    // //getting previous state as row selected
    // this.route.params.subscribe(params => {
    //   if (params.marcId) {
    //     this.marcHistoryId = params.marcId;
    //   } else {
    //     if (
    //       this.recordHistoryResponse &&
    //       this.recordHistoryResponse.length > 0
    //     )
    //       this.marcHistoryId = this.recordHistoryResponse[0].Id;
    //   }
    // });
  }
  MovePrevNext(action : string){
    if(this.selectedAll || this.selectedMarcs.length>0){
      this.selectedAll=false;
      this.selectAnyChkBox=false;
      this.selectedMarcs.length=0;
    }
    this.disablePrev = false;
    this.disableNext = false;
  //  if(this.recordCount > 0 ){
      //previous button clicked
      if(action === 'prev'){
        this.maxVersionNumber=this.minVersionNumber; //set as max version number
        this.latestVersionNumber=this.minVersionNumber-this.browseMaxRecords;
        this.minVersionNumber=this.latestVersionNumber; //set as min version number
        if(this.minVersionNumber<0){
          this.disablePrev=true;
        }else{
          this.disablePrev=false;
        }
      }
      //next button clicked
      if(action === 'next'){
        this.minVersionNumber=this.maxVersionNumber;
        this.latestVersionNumber=this.maxVersionNumber+this.browseMaxRecords;
        this.maxVersionNumber=this.latestVersionNumber; //set as max version number
        if(this.latestVersionNumber >= this.pageCounter){
          this.disableNext=true;
        }else{
          this.disableNext=false;
        }
      }
    this.getRecordHistory(this.recordNumber);
  }
  getRecordHistory(recordNumber:number){
    this.spinnerService.spinnerStart();
    this.marcService
        .getMarcRecordHistoryPagination(recordNumber,this.minVersionNumber,this.maxVersionNumber)
        .subscribe(x=>{
          this.spinnerService.spinnerStop();
          this.recordHistoryResponse = x;
          this.recordHistoryResponse.map(x => {
            if (this.recordHistoryResponse[0].id === x.id)
              x.isFirstRecord = true;
            else x.isFirstRecord = false;
            if (x.fields.find(x => x.tag === "245").subfields.length > 0) {
              let fields = x.fields.find(x => x.tag === "245").subfields;
              x.title = "";
              fields.forEach(element => {
                x.title += element.data;
              });
            } else x.title = "";
            if (x.editedDate != "") {
              x.editedDate = this.utilService.getDateinSystemFormat(
                x.editedDate
              );
            }
          });
          if (
            this.recordHistoryResponse &&
            this.recordHistoryResponse.length > 0
          )
            this.marcHistoryId = this.recordHistoryResponse[0].id;
        });
        this.InitRecordHistoryDetailsGrid();
  }
  ngOnChanges() {
    this.marcHistoryId = null;
  }

  ngAfterViewChecked() {
    this.CustomHeightFunction();
    this.InitRecordHistoryDetailsGrid();
    $(window).resize(e => {
      this.CustomHeightFunction();
    });
    var table = $("#recordHistoryDetailsGrid").DataTable();
    var tableData = table.rows().data();
    for(var i=0;i<tableData.length;i++){
      var showToolTip=this.selectedMarcs && this.selectedMarcs.length == 8 && !tableData[i].IsSelect;
      var disableMatToolTip=!(this.selectedMarcs && this.selectedMarcs.length == 8 && !tableData[i].IsSelect);
      if(showToolTip){
        this.tooltip="Maximum records limit reached";
      }else{
        this.tooltip="Checkbox to view Marc Record";
      }
      if(disableMatToolTip){
        this.tooltip='';
      }
      else{
        this.tooltip= "Maximum records limit reached";
      }
    }
  }

  /* search split fix function - var values */
  CustomHeightFunction() {
    this.CWidowHeight = $(window).height();
    this.CHeaderHeight = $("app-header nav").height();
    this.CSearchHeight = $(".search_filter").height();
    this.CNavHeight = $(".mainNavSection").height();
    this.CompareBtn = $("header.tableHeaderCounts").height();
    this.marcHeader = $("header.MARCrecordHeader").height();
    this.CHeaderHeight =
      this.CHeaderHeight +
      this.CSearchHeight +
      this.CNavHeight +
      this.CompareBtn +
      this.marcHeader;
    this.NewHeight = this.CWidowHeight - this.CHeaderHeight;
    this.NewHeight = this.NewHeight - 13;
  }

  InitRecordHistoryDetailsGrid() {
    if ($.fn.dataTable.isDataTable("#recordHistoryDetailsGrid")) {
      this.table = $("#recordHistoryDetailsGrid").DataTable();
    } else if (this.recordHistoryResponse != null) {
      this.table = $("#recordHistoryDetailsGrid").DataTable({
        dom: "Rlfrtip",
        paging: false,
        searching: false,
        info: false,
        sort: {
          default: ""
        },
        autoWidth: false,
        scrollY: 121,
        scrollX: false,
        scrollCollapse: true,
        stateSave: false,
        columnDefs: [{ orderable: false, targets: "no-sort" }],
        colReorder: {
          fixedColumnsLeft: 1
        }
      });

      this.adjustColumnsSize();

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

  adjustColumnsSize() {
    //after resize save the updated width value in to the array and update the local storage

    var tWidth = $(".dataTables_scrollHead")
      .find("table")
      .find("thead")
      .find("tr")
      .find(".titleTH")
      .width();

      $(".titleTH")
      .css({
        "min-width": tWidth,
        "max-width": tWidth,
        width: tWidth
      });

    $(".titleTD").css({
      "min-width": tWidth,
      "max-width": tWidth,
      width: tWidth
    });

    tWidth = $(".dataTables_scrollHead")
      .find("table")
      .find("thead")
      .find("tr")
      .find(".editedByTH")
      .width();

      $(".editedByTH")
      .css({
        "min-width": tWidth,
        "max-width": tWidth,
        width: tWidth
      });

    $(".editedByTD").css({
      "min-width": tWidth,
      "max-width": tWidth,
      width: tWidth
    });

    tWidth = $(".dataTables_scrollHead")
      .find("table")
      .find("thead")
      .find("tr")
      .find(".editedDateTH")
      .width();

      $(".editedDateTH").css({
        "min-width": tWidth,
        "max-width": tWidth,
        width: tWidth
      });

    $(".editedDateTD").css({
      "min-width": tWidth,
      "max-width": tWidth,
      width: tWidth
    });

    tWidth = $(".dataTables_scrollHead")
      .find("table")
      .find("thead")
      .find("tr")
      .find(".recordsourceTH")
      .width();

      $(".recordsourceTH").css({
        "min-width": tWidth,
        "max-width": tWidth,
        width: tWidth
      });

    $(".recordsourceTD").css({
      "min-width": tWidth,
      "max-width": tWidth,
      width: tWidth
    });

    this.table.columns.adjust().draw(false);
  }

  viewMarcRecordOnEnter(event: any, id: string) {
    let e = <KeyboardEvent>event;
    if (e.keyCode == 13) {
      this.marcHistoryId = id;
    }
  }

  viewMarcRecord(e: any, id: string) {
    if (
      e.target.className == "custom-control-label" ||
      e.target.className == "custom-control-input" ||
      e.target.type == "checkbox"
    ) {
      // stop the bubbling to prevent firing the row's click event
      e.stopPropagation();
    } else {
      this.marcHistoryId = id;
    }
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

    var recordCount = this.recordHistoryResponse.length;
    recordCount = recordCount >= 8 ? 8 : recordCount;
    var start = 0;
    var end = recordCount;
    var $chkboxes = $(".chkbox");
    $chkboxes
      .slice(Math.min(start, end), Math.max(start, end))
      .prop("checked", this.selectedAll);

    $chkboxes
      .slice(
        Math.min(8, this.recordHistoryResponse.length),
        Math.max(start, this.recordHistoryResponse.length) + 1
      )
      .prop("checked", false);

    var checkboxesChecked = this.getCheckedData($chkboxes);
    if (checkboxesChecked && checkboxesChecked.length > 0) {
      for (var i = 0; i < checkboxesChecked.length; i++) {
        var marcRecord = this.recordHistoryResponse.filter(
          x => x.id == checkboxesChecked[i].id
        );
        marcRecord[0].isSelect = true;
        this.selectedMarcs.push(marcRecord[0]);
      }
    }

    this.lastSelectedCheckboxIndex = end;
    if (!this.selectedAll) {
      this.selectedMarcs = [];
      this.lastSelectedCheckboxIndex = -1;
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

  //check box change event + shift key + check functionality
  onSelectChange(event, id, tooltip) {
    window.getSelection().removeAllRanges();
    var $chkboxes = $(".chkbox");
    const index = this.findCurrentCheckboxIndex($chkboxes, id);
    let checked = $chkboxes[index].checked;
    if (checked && this.selectedMarcs && this.selectedMarcs.length == 8) {
      event.preventDefault;
      event.currentTarget.checked = false;
      this.lastSelectedCheckboxIndex = index;
      return;
    }

    let showTooltip = false;
    var recordCount = this.recordHistoryResponse.length;
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
    this.selectAnyChkBox =
      this.selectedMarcs &&
      this.selectedMarcs.length > 0 &&
      this.selectedMarcs.length < recordCount;
    if (showTooltip && tooltip) {
      tooltip.disabled = false;
      tooltip.show();
    }
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
    const marc = this.recordHistoryResponse.find(m => m.id === id);
    if (checked) {
      if (this.selectedMarcs && this.selectedMarcs.length < 8) {
        checkBoxes[index].checked = true;
        marc.isSelect = true;
        if (
          this.selectedMarcs.indexOf(this.recordHistoryResponse[index]) == -1
        ) {
          this.selectedMarcs.push(this.recordHistoryResponse[index]);
        }
      } else {
        if (triggerIndex === index) {
          checkBoxes[triggerIndex].checked = false;
        } else {
          checkBoxes[index].checked = false;
        }
        marc.isSelect = false;
      }
    } else {
      checkBoxes[index].checked = false;
      marc.isSelect = false;
      this.selectedMarcs = this.selectedMarcs.filter(
        m => m != this.recordHistoryResponse[index]
      );
    }
  }

  // redirect to compare history view with marc ids and record numbers.
  compareMarcRecords() {
    if (this.selectedMarcs && this.selectedMarcs.length > 1) {
      let param: string = "";
      this.selectedMarcs.forEach(selectedMarc => {
        if (param.length > 0) {
          param = param + ",";
        }
        param = param + selectedMarc.id + ":" + selectedMarc.recordNumber + ":" + selectedMarc.recordSource;
      });
      this.router.navigate(["/compare-history-view/" + param]);
    }
  }

  // redirect to previous page
  back() {
    this.router.navigate(["/search/"]);
  }
}
