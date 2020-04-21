import { Component, OnInit } from '@angular/core';
import { MarcSettingsService } from '../services/marc-settings.service';
import { MarcEditorSettings, BatchMacro, Marc } from '../marc/shared/marc';
import { UploadRecordFileService } from '../upload-record-file/upload-record-file.service';
import { SpinnerService } from '../shared/interceptor/spinner.service';
import { ClonerService } from '../services/cloner.service';
import { MarcDTO } from '../_dtos/btcat.vm.dtos';
import { MarcAdapter } from '../marc/shared/service/marc-adapter.service';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { BaseComponent } from '../base.component';
import { AuthenticationService } from '../security/authentication.service';
import { Permissions } from '../security/permissions';
import { Title } from '@angular/platform-browser';
import { Constants } from '../constants/constants';
import { SubSink } from 'subsink';
declare var $: any;

@Component({
  selector: 'app-batch-marco-execution',
  templateUrl: './batch-marco-execution.component.html',
  styleUrls: ['./batch-marco-execution.component.css']
})
export class BatchMarcoExecutionComponent extends BaseComponent implements OnInit {
  // Search Split Issue fix
  CWidowHeight: number;
  CHeaderHeight: number;
  CSearchHeight: number;
  CNavHeight: number;
  HeaderHeight: number;
  NewHeight: number;
  marcData:BatchMacro[]=[];
  table: any;
  checkedAll:boolean=false;
  private subs = new SubSink();
  checkAllCounter:number=0;
  showCheckbox:boolean=true;
  partialCheck:boolean=true;
  marcSettings: MarcEditorSettings;
  counter:number=0;
  disableButton:boolean=true;
  marcIDs:BatchMacro[]=[];
  indeterminate:boolean=false;
  showData:boolean=false;
  fromMarc:Number;
  toMarc:Number;
  selectedMarc:BatchMacro=null;
  leaderDataWithHyphons: string;
  validationMsg:boolean=false;
  errorMsg:string='';
  showButtons:boolean=false;
  constructor(private marcSettingsService: MarcSettingsService,
              private uploadService:UploadRecordFileService,
              private spinnerService:SpinnerService,
              private router: Router,
              private clonerService:ClonerService,private location:Location,
              private marcAdapter: MarcAdapter,private route:ActivatedRoute,
              private authenticationService: AuthenticationService,
              private _titleService:Title) {
                super(router, authenticationService);
               }

  ngOnInit() {
    if (this.route.snapshot && this.route.snapshot.data['title'] && this.route.snapshot.data['title'].length > 0) {
      let title=this.route.snapshot.data['title'];
      this._titleService.setTitle(title);
    }

    this.subs.sink= this.route.params.subscribe(params => {
      this.fromMarc = params.fromRecordNumber; // (+) converts string 'id' to a number
      this.toMarc = params.toRecordNumber;
      if(params.fromRecordNumber && params.toRecordNumber)
      this.showButtons=true;
    });
  }

  // Needed, but use adapter service
  loadMarcSettings() {
    this.marcSettings = this.marcSettingsService.getMarcSettingsData();
  }

  CustomHeightFunction() {
    this.CWidowHeight = $(window).height();
    this.CHeaderHeight = $('app-header nav').height();
    this.CSearchHeight = $('app-search-box .search_filter').height();
    this.CNavHeight = $('.mainNavSection').height();
    this.HeaderHeight = this.CHeaderHeight + this.CSearchHeight + this.CNavHeight;
    this.NewHeight = this.CWidowHeight - this.HeaderHeight;
    // TODO: Need to check why this line is added
    this.NewHeight = this.NewHeight - 130;
    let h= (this.NewHeight - 108)+"px";
    $("#uploadRecordFile_wrapper > div > div.dataTables_scrollBody").css({"max-height":h});
  }

  ngAfterViewChecked() {
    this.CustomHeightFunction();
    $(window).resize(e => {
      this.CustomHeightFunction();
    });
  }
  getMarcRecordsByRange(){
    if(this.fromMarc>0 && this.toMarc>0 ){
      this.marcIDs=[];
      this.showData = true;
      this.checkAllCounter=0;
    this.spinnerService.spinnerStart();
    this.subs.sink==this.uploadService.GetMarcRecordsRange(this.fromMarc,this.toMarc).subscribe(x=>{
      this.marcData=x;
      $.fn.dataTable.ext.errMode = 'none';
      this.reInitializeTemplatesGrid(this.marcData);
      this.closeNav();
     $(".macroActive").removeClass("macroActive");
      this.spinnerService.spinnerStop();
    },(error)=>{
      console.log("error",error);
    });
    }else{
      this.validationMsg=true;
      this.errorMsg="Please enter from or to range";
    }

  }
  onKeydown(event) {
    if (event.key === Constants.ENTERKEY) {
      this.getMarcRecordsByRange();
    }
  }

  //Initialize the grid with the data
  reInitializeTemplatesGrid(result: BatchMacro[]) {
    if(result.length === 0){
      this.showCheckbox=false;
    }
    var columns = this.getTemplateGridColumns();
    if ($.fn.dataTable.isDataTable('#uploadRecordFile')) {
      $("#uploadRecordFile").DataTable().destroy();
    }
    let tableHeight = this.NewHeight - 113;
    this.table = $("#uploadRecordFile").DataTable({
      paging: false,
      searching: false,
      select: {
        className: 'active'
      },
      info: false,
      data: result,
      columns: columns,
      // bSort: false,
      // targets: 'no-sort',
      order: [],
      autoWidth: true,
      scrollY: tableHeight,
      scrollX: true,
      scroller: true,
      scrollCollapse: true,
      deferRender: true,
      columnDefs: [
        { orderable: false, targets: 0 }//,
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
            var tab = $("#uploadRecordFile").DataTable();
            tab.rows().deselect();
            tab.rows(rowIndex).select();
          }
        });
        return nRow;
      },
    });

    //var index = 0;
    //var tableData = this.table.rows().data();


    $('.checkMarc').on('click', 'input', (event) => {
      if (event.currentTarget.attributes.length > 0) {
        //var title = event.currentTarget.attributes["Title"].nodeValue;
        var id = event.currentTarget.attributes["id"].nodeValue;
        //isSelected
        var checkBox = <HTMLInputElement> document.getElementById(id);
        var checkBoxAll = <HTMLInputElement> document.getElementById('checkAll');
        if (checkBox.checked == true){
          this.counter=this.counter+1;
          this.checkAllCounter=this.checkAllCounter+1;
          this.selectedMarc=this.marcData.find(x=>x.id === id);
          this.marcIDs.push(this.selectedMarc);
        }else{
          this.checkAllCounter=this.checkAllCounter-1;
          let index= this.marcIDs.indexOf(this.marcData.find(x=>x.id === checkBox.id));
          if(index > -1){
            this.marcIDs.splice(index,1);
          }
          this.counter=this.counter-1;
          if(this.marcIDs.length>0 && this.counter>0){
            this.disableButton=false;
          }else{
            this.disableButton=true;
          }
        }
        console.log('margs ids',this.marcIDs);
        if(this.marcIDs.length <= 0){
          $(".macroActive").removeClass("macroActive");
          this.closeNav();
        }
      }
      // if(checkBoxAll.checked && this.indeterminate){
      //   checkBoxAll.checked = false;
      //   this.indeterminate=false;
      // }
      if(this.checkAllCounter === 0){
        checkBoxAll.checked=false;
        this.indeterminate=false;
        checkBoxAll.indeterminate=false;
      }
      if(checkBoxAll.checked || (this.checkAllCounter>0 && !checkBoxAll.checked)){
        checkBoxAll.indeterminate=true;
        this.indeterminate=true;
      }else{
        checkBoxAll.indeterminate=false;
        this.indeterminate=false;
      }
      if(this.marcData.length === this.checkAllCounter){
        checkBoxAll.indeterminate=false;
        this.indeterminate=false;
      }
      if(this.marcIDs.length>0 && this.counter>0){
        this.disableButton=false;
      }else{
        this.disableButton=true;
      }
      if(this.checkAllCounter === this.marcData.length){
        checkBoxAll.checked=true;
      }
    });

    //checkAll
    $('.checkMarcHeader').on('click', 'input', (event) => {
      var checkBox = <HTMLInputElement> document.getElementById('checkAll');
      if(this.marcData.length>0){
        if(checkBox.checked && this.indeterminate){
          checkBox.checked = false;
          this.indeterminate=false;
        }
        this.marcIDs=[];
        this.checkAllCounter=this.marcData.length;
        this.checkedAll=true;
        if(checkBox.checked){
          this.disableButton=false;
          for(var i=0;i<this.marcData.length;i++){
            var checkBox = <HTMLInputElement> document.getElementById(this.marcData[i].id.toString());
            if(checkBox){
              this.marcIDs.push(this.marcData.find(x=>x.id === checkBox.id));
              checkBox.checked=true;
            }
          }
        }else{
          this.disableButton=true;
          this.checkAllCounter=0;
          this.indeterminate=false;
          for(var i=0;i<this.marcData.length;i++){
            var checkBox = <HTMLInputElement> document.getElementById(this.marcData[i].id.toString());
            if(checkBox){
              let index= this.marcIDs.indexOf(this.marcData.find(x=>x.id === checkBox.id));
              if(index > -1){
                this.marcIDs.splice(index,1);
              }
              checkBox.checked=false;
            }

          }
        }
      }

      if(this.marcIDs.length === 0){
        $(".macroActive").removeClass("macroActive");
        this.closeNav();
      }

    });

    $(".dataTables_scrollBody")
        .find("table")
        .find("thead")
        .find("tr")
        .find("th:first")
        .find("div:last")
        .html("")
        .append("<span class='sr-only'>Check All</span>");

  }

  //Get all the grid columns to bind them to the grid
  getTemplateGridColumns() {
    var i:number=0;
    let showHeader="<span class='checkMarcHeader'><label class='sr-only' for='checkAll'>Check All</label><input type='checkbox' id='checkAll' name='checkAll' (click)='selectAll($event)'/></span>";
    if(this.marcData.length === 0){
      showHeader="<span class='checkMarcHeader' ></span>";
    }
    var columns = [
      {
        "title": showHeader,"className": "col-checkbox",
        render:function (data, type, full, meta){
          let title=full.Title;
          return '<div class="checkMarc"><label class="sr-only" for="'+ full.id +'">Check all uploaded files</label><input type="checkbox" id="'+ full.id +'" name="'+ full.id +'"/></div>'
        }
      },
      {
        "title": "Title", "className": "col-title ",
        render: function (data, type, full, meta) {
          return '<a title="' + full.Title + '" class="TestCalls"><span>Title&nbsp;</span>' + full.Title + '</a>'
        }
      },
      {
        "title": "Author", "className": "col-author",
        render: function (data, type, full, meta) {
          return '<a  title="' + full.Author + '" class="TestCalls authorTD"><span>Author&nbsp;</span>' + full.Author + '</a>'
        }
      }
    ];
    return columns;
  }

  onMacroExecuted(marcRecord: any) {
    let test = this.clonerService.deepClone<MarcDTO>(this.marcAdapter.transform(marcRecord));
    this.leaderDataWithHyphons = this.selectedMarc.fields.find(a => a.tag === 'Leader').data.replace(/ /g, '-');
  }
  onMarcRecordShowErrorMsg(marcRecord: any) {
    console.log('error');
  }

  clear(){
    this.fromMarc=null;
    this.toMarc=null;
    this.marcIDs=[];
    this.indeterminate=false;
    this.validationMsg=false;
    this.showButtons=false;
    this.showData = false;
    this.closeNav();
    var table = $('#uploadRecordFile').DataTable();
    table.clear().draw();
    if ($.fn.dataTable.isDataTable('#uploadRecordFile'))
    $("#uploadRecordFile").DataTable().destroy();
  }
  valuechange(newValue:number,type:string) {
    if(type === "from"){
      this.fromMarc=newValue;
    }
    if(type === "to"){
      this.toMarc=newValue;
    }

    if(this.fromMarc ===null && this.toMarc ===null ){
      this.validationMsg=true;
      this.errorMsg="To or From Range cannot be zero";
    }else{
      this.errorMsg="";
      console.log('this.marc',this.fromMarc);
    }
    if(+this.toMarc < +this.fromMarc){
      this.validationMsg=true;
      this.errorMsg="To range must be greater than From range";
    }else{
      this.validationMsg=false;
      this.errorMsg="";
    }
    if(this.fromMarc != null && this.toMarc!=null){
      this.showButtons=true;
    }
  }

  validations(){
    if(this.fromMarc == 0){
    }
    if(this.toMarc == 0){
    }
  }
  back(){
    this.location.back();
  }
  onClearData($event:boolean){
    if($event){
      this.indeterminate=false;
      this.validationMsg=false;
      this.checkAllCounter=0;
      this.marcIDs=[];
      $(".macroActive").removeClass("macroActive");
      this.reInitializeTemplatesGrid(this.marcData);
    }
  }
  closeNav() {
    $(".MarcEditor").css("margin-right", "1rem");
    $(".macroSideNav").width(0);
    $(".macroSideNavHeaderCollapsed").show();
    this.onresetTableGrid();
  }

  onresetTableGrid()
  {
    this.table.columns.adjust().draw(false);
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}

