import { Component, OnInit, Renderer } from '@angular/core';
import { AtsReviewService } from './ats-review.service';
import { Marc } from '../marc/shared/marc';
import { SpinnerService } from '../shared/interceptor/spinner.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Constants } from "src/app/constants/constants";
import { BaseComponent } from '../base.component';
import { AuthenticationService } from '../security/authentication.service';
import { CommonService } from '../shared/service/common.service';
import { Title } from '@angular/platform-browser';
import { MatDialog } from '@angular/material';
import { ATSReviewConfigureColumnsComponent } from './configure-columns/configure-columns.component';
declare var $: any;
@Component({
  selector: "ats-review-search",
  templateUrl: "./ats-review.component.html"
})
export class ATSReviewComponent extends BaseComponent implements OnInit {
  // Search Split Issue fix
  CWidowHeight: number;
  CHeaderHeight: number;
  CNavHeight: number;
  HeaderHeight: number;
  NewHeight: number;
  CSearchHeight: number;
  CompareBtn: number;
  table: any;
  columns: any = [];
  atsReviewData: any = [];
  selectedMarcRecords:any;
  atsTag:any;
  atsSubfiledCode:any;
  totalItems:number;
  uniquesRecords:number;
  showData:boolean = false;
  
  reOrderColumns: Array<number> = [];
  columnResizeWidth: number;
  authorHeight: any;
  start: any;
  pressed: boolean;
  startX: any;
  startWidth: any;
  constructor(private dialog: MatDialog,
    private service: AtsReviewService,
    private spinnerService: SpinnerService,
    private router: Router,
    private authenticationService: AuthenticationService,
    private _titleService: Title,
    private route:ActivatedRoute,
    private commonService: CommonService,    
    private renderer: Renderer
  ) {
    super(router, authenticationService);
  }
  ngOnInit() {
    if (this.route.snapshot && this.route.snapshot.data['title'] && this.route.snapshot.data['title'].length > 0) {
      let title=this.route.snapshot.data['title'];
      this._titleService.setTitle(title);
    }
    if (this.isExternalUser && this.currentCustomerId) {
      // customer configured columns
      if (localStorage.getItem(
        Constants.LocalStorage.ATSREVIEWCOLUMNS
      )) {
        this.columns = JSON.parse(localStorage.getItem(
          Constants.LocalStorage.ATSREVIEWCOLUMNS
        ));
      }
      // default columns
      else if (localStorage.getItem(
        Constants.LocalStorage.ATSREVIEWFIELDS
      )) {
        this.columns = JSON.parse(localStorage.getItem(
          Constants.LocalStorage.ATSREVIEWFIELDS
        ));
      } else {
        this.columns = [];
      }
      let atsColumn = this.columns.find(c=> c.label == 'ATS');
      if(atsColumn && atsColumn.tag && atsColumn.subFieldCode){
        this.atsTag = atsColumn.tag;
        this.atsSubfiledCode = atsColumn.subFieldCode;
        this.loadAtsReviewData(atsColumn.tag, atsColumn.subFieldCode);
      }
      else{
        this.reInitializeGrid([]);
      }
    }
  }

  loadAtsReviewData(tag, subFieldCode) {
    this.atsReviewData = [];
    this.spinnerService.spinnerStart();
    // Get selected marcids from session filled in search result component
    if(localStorage.getItem(Constants.LocalStorage.ATSREVIEWRECORDS)){
      this.selectedMarcRecords = JSON.parse(localStorage.getItem(Constants.LocalStorage.ATSREVIEWRECORDS));
    }
    else{
      this.selectedMarcRecords = [];
    }
    if(this.selectedMarcRecords && this.selectedMarcRecords.length>0){
      let selectedMarcIds = this.selectedMarcRecords.map(function (elem) {
        return elem.id;
      });
      this.service.getAtsMarcRecordByIds(selectedMarcIds, tag, subFieldCode).subscribe(result => {
        if (result) {
          this.atsReviewData = result;
          this.reInitializeGrid(result);
          this.spinnerService.spinnerStop();
        }
        else{
          this.reInitializeGrid([]);
        }
      }
      );
    }
    else{
      this.reInitializeGrid([]);
    }
  }

  reInitializeGrid(result: any) {
    this.showData = true;
    if(result && result.length>0){
      this.totalItems = result.length;
      this.uniquesRecords = Array.from(new Set(result.map(item => item.id))).length;
    }
    else{
      this.totalItems = 0;
      this.uniquesRecords = 0;
    }
    let tableHeight = this.NewHeight - 72;
    var columns = this.getColumns();
    for (let index = 0; index < columns.length; index++) {
      this.reOrderColumns.push(index);

    }
    if (this.table != null) {
      $("#atsReviewGrid").DataTable().destroy();
      $("#atsReviewGrid").empty();
    }
    this.table = $("#atsReviewGrid").DataTable({
      paging: result && result.length > 10 ? true : false,
      searching: false,
      select: {
        className: 'active'
      },
      info: false,
      data: result,
      columns: columns,
      order: [],
      autoWidth: false,
      scrollY: tableHeight,
      scrollX: true,
      scroller: result && result.length > 10 ? true : false,
      scrollCollapse: true,
      deferRender: true,
      columnDefs: [{
        "searchable": false,
        "orderable": true,
        "targets": 0
      }],    
      colReorder: {
        fixedColumnsLeft: 1
      },
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
            var tab = $("#atsReviewGrid").DataTable();
            tab.rows().deselect();
            tab.rows(rowIndex).select();
          }
        });
        return nRow;
      },
    });

    $('#atsReviewGrid tbody').on('dblclick', 'tr', (event) => {
      var table = $("#atsReviewGrid").DataTable();
      var data = table.row(event.currentTarget).data();
      this.editMarcRecord(data.id, '');
    });

    this.table.on('column-reorder', (e, settings, details) => {
      let itemToAdd = this.columns.splice(details.from - 1, 1)[0];
      this.columns.splice(details.to - 1, 0, itemToAdd);
      localStorage.setItem(
        Constants.LocalStorage.ATSREVIEWCOLUMNS,
        JSON.stringify(this.columns)
      );
    });
    $('.ui-column-resizer').on('mousedown', (event) => {
      this.onMouseDown(event);
    });   

    this.afterResizeorShowHideColumns();
    this.table.columns.adjust().draw(false);
  }

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
        var data = localStorage.getItem(Constants.LocalStorage.ATSREVIEWCOLUMNS);
        this.columns = JSON.parse(data);
        this.columns.forEach(x => {
          if (x.label.trim() == displayName.trim()) {
            x.width = width;
          }
        });

        //Fix for only 6 columns resize adjuestments
        if ($(".dataTables_scrollHead tr th").length < 7) {
          for (var i = 0; i < $(".dataTables_scrollHead tr th").length; i++) {

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
            this.columns.forEach(x => {
              if (x.displayName == cdisplayName) {
                x.width = rWidth;
              }
            });

          }

        }

        localStorage.setItem(
          Constants.LocalStorage.ATSREVIEWCOLUMNS,
          JSON.stringify(this.columns)
        );
      }
    });
    this.renderer.listenGlobal("body", "mouseup", event => {
      if (this.pressed) {
        this.pressed = false;
        this.table.colReorder.enable();
        this.table.columns.adjust().draw(false);
      }
    });
  }

  afterResizeorShowHideColumns() {
    //after resize save the updated width value in to the array and update the local storage      
    for (let i = this.columns.length - 1; i >= 1; i--) {
      let widthValue;
      widthValue = this.columns[i].width;
      $(".dataTables_scrollHead")
        .find("table")
        .find("thead")
        .find("tr th:nth-child(" + (i + 2) + ")")
        .css({
          "min-width": widthValue,
          "max-width": widthValue,
          width: widthValue
        });
    }
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
    this.NewHeight = this.NewHeight - 95;
    let h= (this.NewHeight - 40)+"px";
    $("#atsReviewGrid_wrapper > div.dataTables_scroll > div.dataTables_scrollBody").css({"max-height":h});
  }

  // multiple marc view methods -- End
  ngAfterViewChecked() {
    /* search split fix function  */
    this.CustomHeightFunction();
    $(window).resize(e => {
      this.CustomHeightFunction();
    });
  }

  getColumns() {
    var columns = [];
    columns.push({
      "title": "S/N", width:'5%',
      render: function (data, type, full, meta) {
        return meta.row + 1;
      }
    });
    this.columns.forEach(column => {
      columns.push({
        "title": '<span class="ui-column-resizer"></span><span>' + column.label +'</span>', width: '200px',
        render: function (data, type, full, meta) {
          let retVal = '';
          let field = full.fields.find(f => f.tag == (column.tag === '000' ? 'Leader' : column.tag));
          if (field) {
            if (column.subFieldCode) {
              if (field.subfields) {
                let subfield = field.subfields.find(s => s.code === column.subFieldCode);
                if (subfield) {
                  retVal = subfield.data;
                }
              }
            }
            else {
              retVal = field.data;
            }
          }
          return '<a title="' + retVal + '" class="TestCalls"><span>Customer&nbsp;</span>' + retVal + '</a>'
        }
      });
    });
    return columns;
  }

  back(){
    this.router.navigate(['/search']);
  }

  editMarcRecord(id: any, selectedMarcRecordSource: string) {
    selectedMarcRecordSource = this.selectedMarcRecords.find(r=> r.id === id).recordSource;
    this.commonService.setRecordSource(selectedMarcRecordSource);
      if (id) {
        this.router.navigate([
          "/bibliographic-edit/",
          id,
          0
        ]);
      }
    }

    openConfigureColumns(){
      let dialogRef = this.dialog.open(ATSReviewConfigureColumnsComponent, {
        width: '500px',
        height: '500px',
        disableClose: true,
        data: {
          atsReviewFields: JSON.parse(JSON.stringify(this.columns))
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          localStorage.setItem(
            Constants.LocalStorage.ATSREVIEWCOLUMNS,
            JSON.stringify(result)
          );
          this.columns = JSON.parse(JSON.stringify(result));
          let atsColumn = this.columns.find(c => c.label == 'ATS');
          if (atsColumn && atsColumn.tag && atsColumn.subFieldCode) {
            if (this.atsTag != atsColumn.tag || this.atsSubfiledCode != atsColumn.subFieldCode) {
              this.atsTag = atsColumn.tag;
              this.atsSubfiledCode = atsColumn.subFieldCode;
              this.loadAtsReviewData(atsColumn.tag, atsColumn.subFieldCode);
            }
            else {
              this.reInitializeGrid(this.atsReviewData);
            }
          }
          else{
            this.reInitializeGrid([]);
          }
          
          if(this.table){
            this.table.on('column-reorder', (e, settings, details) => {
              let itemToAdd = this.columns.splice(details.from - 1, 1)[0];
              this.columns.splice(details.to - 1, 0, itemToAdd);
              localStorage.setItem(
                Constants.LocalStorage.ATSREVIEWCOLUMNS,
                JSON.stringify(this.columns)
              );
            });
          }
      
        }
    });
  }
}
