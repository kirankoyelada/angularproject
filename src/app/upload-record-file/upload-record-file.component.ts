import { Component, OnInit, Input, HostListener, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UploadRecordFileService } from './upload-record-file.service';
import { SpinnerService } from '../shared/interceptor/spinner.service';
import { GAPCustomerMarc } from '../template/GAPCustomerMarc';
import { MatDialog } from '@angular/material';
import { FormCanDeactivate } from "src/app/can-deactivate/form-can-deactivate";
import { ConfirmationDialogComponent } from '../components/shared/confirmation-dialog/confirmation-dialog.component';
import { Location } from '@angular/common';
import { AuthenticationService } from '../security/authentication.service';
import { CustomerService } from '../customer/shared/services/customer.service';
import { Customers, Customer } from '../customer/shared/customer';
import { isObject } from 'util';
import { SubSink } from 'subsink';
import { Constants } from '../constants/constants';
declare var $: any;

@Component({
  selector: 'app-upload-record-file',
  templateUrl: './upload-record-file.component.html',
  styleUrls: ['./upload-record-file.component.css']
})
export class UploadRecordFileComponent extends FormCanDeactivate implements OnInit {
  @ViewChild("form") form: NgForm;
  selectedCustomer = new Customers();
  // Search Split Issue fix
  CWidowHeight: number;
  CHeaderHeight: number;
  CNavHeight: number;
  HeaderHeight: number;
  NewHeight: number;
  CSearchHeight: number;
  CompareBtn: number;
  isChecked:boolean=false;
  isCustomerSelected:boolean=false;
  showCancelButton:boolean=true;
  counter:number=0;
  errMsg:string='';
  displayWarnMessage:boolean=false;
  indeterminate:boolean=false;
  executionId: string = '';
  searchCustomer: string = "";
  private subs = new SubSink();
  isError:boolean=false;
  constructor(private _titleService:Title,private route:ActivatedRoute,
    private http:HttpClient,private uploadService:UploadRecordFileService,
    private spinnerService:SpinnerService,
    private dialog: MatDialog,private location: Location,
    private router: Router,
    private authenticationService: AuthenticationService,
    private cutomerService: CustomerService
    ) {
      super(router,authenticationService);
     }

  @Input() accept = 'text/*';
  private files: File;
  showCheckbox:boolean=true;
  previousCustomer = new Customers();
  partialCheck:boolean=true;
  fileData: File = null;
  marcData:GAPCustomerMarc[]=[];
  gapData:GAPCustomerMarc[]=null;
  isTemplatesPage: boolean = false;
  table: any;
  showData:boolean=false;
  marcIDs:number[]=[];
  unsavedChanges: string = "";
  checkedAll:boolean=false;
  checkAllCounter:number=0;
  customers: Customers[];
  customerId:string;
  ngOnInit() {
    //set the title of page
    if (this.route.snapshot && this.route.snapshot.data['title'] && this.route.snapshot.data['title'].length > 0) {
      let title=this.route.snapshot.data['title'];
      this._titleService.setTitle(title);
      $('.custom-file-label').html('Choose a File');
      window.addEventListener("dragover",function(e){
        e.preventDefault();
      },false);
      window.addEventListener("drop",function(e){
        e.preventDefault();
      },false);
    }
    if(this.isExternalPermission)
      this.customers = JSON.parse(localStorage.getItem(Constants.LocalStorage.ASSOCIATEDCUSTOMERS));
    if(this.isAllCustomerEnable && !this.isExternalPermission)
      this.customers = JSON.parse(localStorage.getItem(Constants.LocalStorage.CUSTOMERSALL));
      if(!this.isAllCustomerEnable && !this.isExternalPermission)
      this.getAllCustomers();
    this.populateCustomer(this.customers);

  }

  getAllCustomers() {
    if(localStorage.getItem(Constants.LocalStorage.CUSTOMERSALL) == null ||
    localStorage.getItem(Constants.LocalStorage.CUSTOMERSALL) === ""){
      this.spinnerService.spinnerStart();
      this.cutomerService.getCustomers().subscribe((item) => {
        this.customers = item;
        localStorage.setItem(Constants.LocalStorage.CUSTOMERSALL,JSON.stringify(this.customers));
        this.spinnerService.spinnerStop();
      },
        (error) => {
          console.log(error);
          this.spinnerService.spinnerStop();
        }
      );
    }
    else{
      this.customers = JSON.parse(localStorage.getItem(Constants.LocalStorage.CUSTOMERSALL));
    }
  }
  // getAllCustomers() {
  //   this.spinnerService.spinnerStart();
  //   this.subs.sink= this.cutomerService.getCustomers().subscribe((item) => {
  //     this.customers = item;
  //     this.populateCustomer(item);
  //     this.spinnerService.spinnerStop();
  //   },
  //     (error) => {
  //       console.log(error);
  //       this.spinnerService.spinnerStop();
  //     }
  //   );
  // }
  populateCustomer(item:Customers[]){
    if(localStorage.getItem("CustomerID")!=''){
      let defaultCustID=localStorage.getItem("CustomerID");
      let findCust=item.find(x=>x.id == defaultCustID);
      if(findCust){
        this.selectedCustomer=findCust;
        this.searchCustomer=findCust.customerName;
        this.isCustomerSelected=true;
        this.showCancelButton=false;
        console.log('this.searchCustomer',this.searchCustomer);
      }
    }else{
      this.isCustomerSelected=false;
        this.showCancelButton=true;
        this.selectedCustomer = new Customers();
        this.searchCustomer = '';
    }
  }

  public onChange(fileInput: any, form: NgForm) {
    this.displayWarnMessage = false;
    this.fileData = <File>fileInput[0];
    let fileSize = ((fileInput[0].size) / 1024) / 1024;
    $('.custom-file-label').html(this.fileData.name);
    if (fileInput[0].type === 'text/plain') {
      if (fileSize <= 20) {
        this.marcIDs = [];
        form.form.markAsDirty();
        //get the uploaded file
        this.showData = true;
        //this.showCancelButton=false;
        const formData = new FormData();
        formData.append('file', this.fileData, this.fileData.name);
        this.spinnerService.spinnerStart();
        //send uploaded form data into uploaded service post call
        this.subs.sink= this.uploadService.UploadRecordFile(formData).subscribe(x => {
          this.marcData = x;
          this.isError=false;
          $.fn.dataTable.ext.errMode = 'none';
          this.reInitializeTemplatesGrid(this.marcData);
          this.spinnerService.spinnerStop();
          $('input[type="file"]').attr('title', this.fileData.name);
        },
        (error)=>{
          this.spinnerService.spinnerStop();
          if(error){
            console.log(error.error.Message);
              this.errMsg = 'Invalid data in file. Please upload a correct .txt file.';
                this.isError=true;
                this.clearData(form);
                this.displayWarnMessage = true;
                this.showCancelButton=false;
          }
          //console.log(error.error.Message);
          //this.unsavedChanges="Invalid data in file. Please upload a correct .txt file.";
          //this.showDialogPopup(this.unsavedChanges);
          $('.custom-file-label').html(this.fileData.name);
          $('input[type="file"]').attr('title',this.fileData.name);
        }
        );
      } else {
        this.errMsg = 'File size exceeds 20MB';
        this.isError=true;
        this.clearData(form);
        this.displayWarnMessage = true;
        this.showCancelButton = false;
        $('.custom-file-label').html(this.fileData.name);
        $('input[type="file"]').attr('title', this.fileData.name);
      }
    } else {
      this.errMsg = 'Invalid file format. Please upload only .txt file.';
      this.isError=true;
      this.clearData(form);
      this.displayWarnMessage = true;
      //this.showCancelButton=false;
      $('.custom-file-label').html(this.fileData.name);
      $('input[type="file"]').attr('title', this.fileData.name);
    }
  }

  saveUploadRecordFile(form: NgForm){
    this.spinnerService.spinnerStart();
    let gapMarcRecords=[];
    if(this.checkedAll && !this.indeterminate){
      gapMarcRecords=this.marcData;
    }else{
      gapMarcRecords = this.marcData.filter(x => {
          if (this.marcIDs.includes(x.GAPCustId)) {
            return x;
          }
      });
    }
    //gapMarcRecords = gapMarcRecords.filter( x => x.GAPCustId <= 20000);
    if(gapMarcRecords.length>0){
        //get username from local storage
    let userInfo = localStorage.getItem('actor');
    let customerID=this.selectedCustomer.id;
    this.subs.sink= this.uploadService.SaveUploadRecordFile(gapMarcRecords,customerID,userInfo).subscribe((result)=>{

      this.executionId = result.Message;
      setTimeout(() => {
        this.getGapLoadStatus();
      }, 5000);
    },(error)=>{
      this.spinnerService.spinnerStop();
      this.unsavedChanges="Error occured while saving the records";
      this.alertMessage(form,this.unsavedChanges,0,0);
    });
    }else{
      this.spinnerService.spinnerStop();
      this.unsavedChanges="Please select Records";
      this.alertMessage(form,this.unsavedChanges,0,0);
    }
  }

  getGapLoadStatus(){
    this.subs.sink= this.uploadService.GetGapLoadStatus(this.executionId).subscribe((res) => {
      if (res.Status === 'Completed') {
        this.spinnerService.spinnerStop();
        this.unsavedChanges = "All the selected records have been saved to the Gap Customer File. <br><br> First DB #: <b>"+ res.FirstRecordNumber +"</b><br>Last DB #: <b>"+ res.LastRecordNumber +"</b>";
        this.alertMessage(this.form,this.unsavedChanges,res.FirstRecordNumber,res.LastRecordNumber);
      }
      else if(res.Status === 'Failed')
      {
        this.spinnerService.spinnerStop();
        this.unsavedChanges="Error occured while saving the records";
        this.alertMessage(this.form,this.unsavedChanges,0,0);
      }
      else
      {
        setTimeout(() => {
          this.getGapLoadStatus();
        }, 5000);
      }
    }, (error) => {
      this.spinnerService.spinnerStop();
      this.unsavedChanges = "Error occured while saving the records";
      this.alertMessage(this.form, this.unsavedChanges,0,0);
    });
  }

  alertMessage(form:NgForm,text:string,fromRecordNumber:number,toRecordNumber:number){
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: "500px",
      height: "auto",
      disableClose: true,
      data: {
        isCopyErrorMsg: false,
        isCancelConfirm: false,
        message:text,
        title:'Notification'
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      this.clearData(form);
      if(fromRecordNumber >0 && toRecordNumber > 0)
      this.router.navigate(['save_batch-macro-execution/'+fromRecordNumber+"/"+toRecordNumber]);
    });
  }
  showDialogPopup(msg: string) {
    let data;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      height: 'auto',
      disableClose: true,
      data: {
        isCopyErrorMsg: false,
        isErrorMsg: true,
        message: msg
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
    return data;
  }
  clearData(form: NgForm){
    if (form.dirty) {
      form.form.markAsPristine();
    }
    if ($.fn.dataTable.isDataTable('#uploadRecordFile'))
    $("#uploadRecordFile").DataTable().destroy();
    this.showData=false;
    this.checkAllCounter=0;
    this.isChecked=false;
    //this.isCustomerSelected=false;
    this.checkedAll=false;
    this.displayWarnMessage=false;
    this.marcIDs=[];
    //this.showCancelButton=true;
    $('input[type="file"]').attr('title','No file choosen');
    $('.custom-file-label').html('Choose a File');
    // if(!this.isError){
    //   this.selectedCustomer = new Customers();
    //   this.searchCustomer = '';
    // }
    this.populateCustomer(this.customers);
    this.isError=false;

  }

  back(form: NgForm) {
    if (form && form.form.dirty) {
      this.confirmationMessage(form);
    } else {
      this.location.back();
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
    let h= (this.NewHeight - 102)+"px";
    $("#uploadRecordFile_wrapper > div > div.dataTables_scrollBody").css({"max-height":h});
  }

   // multiple marc view methods -- End
   ngAfterViewChecked() {
    /* search split fix function  */
    this.CustomHeightFunction();
    $(window).resize(e => {
      this.CustomHeightFunction();
    });
  }
  @HostListener('.child-check', ['$event']) checkboxChange(event) {
  }
  //Initialize the grid with the data
  reInitializeTemplatesGrid(result: GAPCustomerMarc[]) {
    if(result.length === 0){
      this.showCheckbox=false;
    }
    var columns = this.getTemplateGridColumns();
    if ($.fn.dataTable.isDataTable('#uploadRecordFile')) {
      $("#uploadRecordFile").DataTable().destroy();
    }
    let tableHeight = this.NewHeight - 102;
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
          this.marcIDs.push(parseInt(id));
        }else{
          this.checkAllCounter=this.checkAllCounter-1;
          let index= this.marcIDs.indexOf(parseInt(id));
          if(index > -1){
            this.marcIDs.splice(index,1);
          }
          this.counter=this.counter-1;
          if(this.marcIDs.length>0 && this.counter>0){
            this.isChecked=true;
          }else{
            this.isChecked=false;
          }
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
      if(checkBoxAll.indeterminate || this.counter>0){
        this.isChecked=true;
      }else{
        this.isChecked=false;
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
          this.isChecked=true;
          for(var i=0;i<this.marcData.length;i++){
            var checkBox = <HTMLInputElement> document.getElementById(this.marcData[i].GAPCustId.toString());
            if(checkBox){
              this.marcIDs.push(parseInt(checkBox.id));
              checkBox.checked=true;
            }
          }
        }else{
          this.isChecked=false;
          this.checkAllCounter=0;
          this.indeterminate=false;
          for(var i=0;i<this.marcData.length;i++){
            var checkBox = <HTMLInputElement> document.getElementById(this.marcData[i].GAPCustId.toString());
            if(checkBox){
              let index= this.marcIDs.indexOf(parseInt(checkBox.id));
              if(index > -1){
                this.marcIDs.splice(index,1);
              }
              checkBox.checked=false;
            }

          }
        }
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
          return '<div class="checkMarc"><label class="sr-only" for="'+ full.GAPCustId +'">Check all uploaded files</label><input type="checkbox" id="'+ full.GAPCustId +'" name="'+ full.GAPCustId +'"/></div>'
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

  // Show confirmation message if form dirty
  confirmationMessage(form: NgForm) {
    this.unsavedChanges =
        "There are unsaved changes. Are you sure you want to leave this page?";
    let dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: "500px",
      height: "auto",
      disableClose: true,
      data: {
        isCopyErrorMsg: false,
        isCancelConfirm: true,
        message: this.unsavedChanges
      }
    });

    dialogRef.afterClosed().subscribe(
      result => {
        if (result) {
          form.form.markAsPristine();
          this.location.back();
        } else {
          form.form.markAsDirty();
        }
      },
      error => {}
    );
  }
  openFileUpload(){
    $('#fileUpload').click();
  }

  executeMacro(){
    this.router.navigate(['batch-macro-execution']);
  }
  displayFn(customer: Customer): any {
    if(customer === undefined || customer === null){
      return "";
    }else{
      if(customer.customerName === undefined){
        return customer;
      }else{
        return customer ? customer.customerName : '';
      }
    }
  }

  selectCustomer(selectedCustomerData: any, form: NgForm) {
    this.selectedCustomer = selectedCustomerData;
    this.searchCustomer=this.selectedCustomer.customerName;
    if (form.dirty && JSON.stringify(this.selectedCustomer)) {
      //this.confirmationMessage(form);
      this.isCustomerSelected=true;
      this.showCancelButton=false;
    }
    else {
      this.isCustomerSelected=false;
      this.showCancelButton=true;
    }
  }

  findCustomer() {
    if (this.searchCustomer != undefined && this.searchCustomer != '' && this.searchCustomer != "Customer not found") {
      if (!isObject(this.searchCustomer) && this.customers) {
        let findCustomer = this.customers.find(x => {
          let customerName = x.customerName;
          return (
            customerName && customerName.toLowerCase() === this.searchCustomer.toLowerCase()
          );
        });
        if (findCustomer != undefined) {
          this.isCustomerSelected=true;
          return true;
        } else {
          this.isCustomerSelected=false;
          return false;
        }
      }
    } else {
      this.isCustomerSelected=false;
      return false;
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

}
