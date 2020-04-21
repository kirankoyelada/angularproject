import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EnvSettingsService } from '../env-settings.service';
import { MatDialog } from '@angular/material';
import { Location } from "@angular/common";
import { ConfirmationDialogComponent } from 'src/app/components/shared/confirmation-dialog/confirmation-dialog.component';
declare var $: any;
import { SpinnerService } from 'src/app/shared/interceptor/spinner.service';
import { InstitutionVM, Institution, EditCustomerEnvironmentSettingsVM } from '../institution';
import { MarcEditorSettings } from 'src/app/marc/shared/marc';
import { Constants } from 'src/app/constants/constants';

@Component({
  selector: 'app-env-settings-crud',
  templateUrl: './env-settings-crud.component.html'
})
export class EnvSettingsCrudComponent implements OnInit {
  isExpandedAll: boolean = false;
  institutions:any[]=[];
  // Search Split Issue fix
  CWidowHeight: number;
  CHeaderHeight: number;
  CNavHeight: number;
  HeaderHeight: number;
  NewHeight: number;
  CSearchHeight: number;
  CompareBtn: number;
  institution :Institution = new Institution();
  institutionVm:InstitutionVM =new InstitutionVM();
  custID:string='';
  instID:string='';
  editCustEnvSettings:EditCustomerEnvironmentSettingsVM=new EditCustomerEnvironmentSettingsVM();
  constructor(private router:Router,
              private dialog: MatDialog,
              private location:Location,
              private spinnerService: SpinnerService,
              private envSettingService:EnvSettingsService) { }

  ngOnInit() {
    this.getAllInstCustomerInfo();
  }

  getAllInstCustomerInfo(){
    this.spinnerService.spinnerStart();
    this.envSettingService.getAllInstitutionsWithCustomers().subscribe(result=>{
      this.institutions=result;
      this.institutions=this.institutions.sort((a, b) => (a.Institution.name> b.Institution.name) ? 1 : -1)
      this.spinnerService.spinnerStop();
    });
   
  }

  createEnvSettings(){
    this.router.navigate(["/env-settings/0/0"]);
  }
/* search split fix function - var values */
customHeightFunction() {
  this.CWidowHeight = $(window).height();
  this.CHeaderHeight = $('app-header nav').height();
  this.CSearchHeight = $('.search_filter').height();
  this.CNavHeight = $('.mainNavSection').height();
  this.CompareBtn = $('header.tableHeaderCounts').height();
  this.HeaderHeight =
      this.CHeaderHeight +
      this.CSearchHeight +
      this.CNavHeight +
      this.CompareBtn;
  this.NewHeight = this.CWidowHeight - this.HeaderHeight;
  this.NewHeight = this.NewHeight - 95;
}

// multiple marc view methods -- End
ngAfterViewChecked() {
  /* search split fix function  */
  this.customHeightFunction();
  $(window).resize(e => {
      this.customHeightFunction();
  });
}
  iconChange(i: number) {
    this.institutions[i].isExpanded = !this.institutions[i].isExpanded;
    this.changeExpandCollapseAll();

  }

  changeExpandCollapseAll() {
    let isAnyExpanded = this.institutions.find(x => x.isExpanded == true);
    if (isAnyExpanded)
      this.isExpandedAll = true;
    else
      this.isExpandedAll = false;
  }

  editInst(instID:string){
    this.router.navigate(["/env-settings/"+instID+"/0"]);
  }
  editCustomer(instID:string,custID:string){
    this.router.navigate(["/env-settings/"+instID+"/"+custID]);
  }
  deleteInst(instID:string,instName:string,customerID:string,customerName:string,environmentSettings :MarcEditorSettings){
    this.deleteConfirmationMessage(instID,instName,customerID,customerName,environmentSettings);
  }

  // Pop-up dialog for soft delete in marc-editor
  deleteConfirmationMessage(instID:string,instName:string,customerID:string,customerName:string,environmentSettings :MarcEditorSettings) {
    let dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: "500px",
      height: "auto",
      disableClose: true,
      data: {
        isCopyErrorMsg: false,
        isCancelConfirm: true,
        message:
          "Are you sure you want to DELETE this "+customerName+"?"
      }

    });

    dialogRef.afterClosed().subscribe(
      result => {
        if (result) {
          this.editCustEnvSettings.id=instID;
          this.editCustEnvSettings.customerId=customerID;
          this.editCustEnvSettings.customerName=customerName;
          this.editCustEnvSettings.environmentSettings=null;
          this.editCustEnvSettings.name=instName;
          this.spinnerService.spinnerStart();
          this.envSettingService.editCustomerEnvironmentSettings(this.editCustEnvSettings).subscribe((result:boolean)=>{
            if(result){
              if(customerID == (localStorage.getItem(Constants.LocalStorage.CUSTOMERID)))
              {
                localStorage.setItem(Constants.LocalStorage.MARCSETTINGS, JSON.stringify(environmentSettings));
              }
              this.successConfirmation('Deleted '+customerName+' successfully');
              this.spinnerService.spinnerStop();
            }
            else{
              this.spinnerService.spinnerStop();
              this.successConfirmation('Error occured while deleting the settings.');
            }
          });

        }
      },
      error => {
        console.log(error);
    this.spinnerService.spinnerStop();
       }
    );
  }

  successConfirmation(successMsg:string){
    let dialog = this.dialog.open(ConfirmationDialogComponent, {
      width: "500px",
      height: "auto",
      disableClose: true,
      data: {
        isCopyErrorMsg:false,
        isCancelConfirm: false,
        message: successMsg
      }
    });
    dialog.afterClosed().subscribe(result => {
      if(result)
      this.getAllInstCustomerInfo();
    });
  }

  back() {
    this.location.back();
  }

  doDoubleClickAction(i:any,j:any){
    this.editCustomer(this.institutions[i].Institution.id,this.institutions[i].customers[j].id);
  }

}

