import { Component, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { CustomerService } from '../customer/shared/services/customer.service';
import { SpinnerService } from '../shared/interceptor/spinner.service';
import { SubSink } from 'subsink';
import { Customers} from '../customer/shared/customer';
import { NgForm, FormControl } from '@angular/forms';
import { EnvSettingsService } from './env-settings.service';
import { Constants } from '../constants/constants';
import { Router, ActivatedRoute } from '@angular/router';
import { MarcEditorSettings } from '../marc/shared/marc';
import { Institution, InstitutionVM, AddCustomerEnvironmentSettingsVM, CustomerVM, EditCustomerEnvironmentSettingsVM,CustomerInstitution } from './institution';
import { ConfirmationDialogComponent } from '../components/shared/confirmation-dialog/confirmation-dialog.component';
import { MatDialog, MatAutocompleteTrigger } from '@angular/material';
import { FormCanDeactivate } from '../can-deactivate/form-can-deactivate';
import { AuthenticationService } from '../security/authentication.service';
declare var $: any;

@Component({
  selector: 'app-env-settings',
  templateUrl: './env-settings.component.html',
  styleUrls: ['./env-settings.component.css']
})
export class EnvSettingsComponent extends FormCanDeactivate implements OnInit {
  strTagDefaultColor:string='';
  strIndicatorDefaultColor:string='';
  strDelimiterDefaultColor:string='';
  strBackgroundDefaultColor:string='';
  @ViewChild("form") form: NgForm;
  id:string='';
  instID:string='';
  custID:string='';
  private subs = new SubSink();
  font_Size:string='';
  fontFamily:string='';
  delimiterSymbol:string='';
  lineSpaceSelection:boolean;
  ftpLocation:string='';
  userName:string='';
  password:string='';
  searchCustomer:string='';
  filteredInstitutions:Institution[];
  selectedCustomers:CustomerInstitution[];
  newCustomerHeight: number;
  checkedCustomers:string[];
  searchText:string = "";
  searchInstitution:string="";
  filterCustomer:string="";
  previousUser: string = "";
  customerDisplayName: string = "";
  searchCustomerByName: any = null;
  searchCustomerId: string = '';
  institutions:InstitutionVM[];
  fontInfo:any;
  fontFamilies:string[]=[];
  isValidInstitution:boolean = false;
  fontSize:string[]=[];
  fontWeight:string[]=[];
  fontAlignment:string[]=[];
  delimiters:string[]=[];
  instObject:Institution=new Institution();
  institution :Institution = new Institution();
  institutionVm:InstitutionVM =new InstitutionVM();
  environmentSettings: MarcEditorSettings= new MarcEditorSettings();
  saveCustomersSettings : AddCustomerEnvironmentSettingsVM;
  saveCustomerSettings :EditCustomerEnvironmentSettingsVM;
  envSettings:any;
  // Search Split Issue fix
  CWidowHeight: number;
  CHeaderHeight: number;
  CNavHeight: number;
  HeaderHeight: number;
  NewHeight: number;
  CSearchHeight: number;
  CompareBtn: number;
  disableInst:boolean=false;
  disableCustomer:boolean=false;
  selectedInst:any;
  selectedCust:any;
  customers:CustomerInstitution=new CustomerInstitution();
  autocompleteInstitutions:Institution[]=[];
  newCustomers:CustomerInstitution[];
  filteredCustomers:CustomerInstitution[];
  institutionTermControl= new  FormControl();
  customerTermControl =new FormControl();
  displayUnAuthMessage:string;
  @ViewChild('triggertag') autoTrigger: MatAutocompleteTrigger;
  customerIds:any=[];
  customerError:boolean=false;
  lastFilter: string;
showCustomer:boolean=true;
  //For validations
  fontError :boolean=false;
  userNameError :boolean=false;
  passwordError :boolean=false;
  sizeError :boolean=false;
  locationError :boolean=false;
  delimiterError :boolean=false;
  displayWarnMessage:boolean=false;


  constructor(private _titleService:Title,
              private envSetttingService:EnvSettingsService,
              private spinnerService:SpinnerService,
              private route:ActivatedRoute,
              private dialog:MatDialog,
              private authenticationService: AuthenticationService,
              private router:Router) {
                super(router, authenticationService);
               }

  ngOnInit() {
    this._titleService.setTitle("BTCAT | Environmental Settings");
    this.route.params.subscribe(params => {
      if(params.id)
      this.instID = params.id;
      if(params.custID)
      this.custID = params.custID;
    });

    //if user select customer edit only for present
    if(this.instID != '0' && this.custID != '0'){
      this.disableInst=true;
      this.disableCustomer=true;
      this.populateCustomersInfo(this.custID);
    }
    this.spinnerService.spinnerStart();
    // if user select both
    if(this.instID === '0' && this.custID === '0'){
      this.getAllInstitutions();
    }

    this.getEnvSettingFromStorage();
    this.spinnerService.spinnerStop();
    //if user select Org ID only
    if(this.instID!= '' && this.instID!= '0' && this.custID=='0'){
      this.disableInst=true;
      this.populateInstInfo(this.instID);
      this.showCustomer = false;
    }
  }
  getEnvSettingFromStorage(){
     this.fontInfo= JSON.parse(localStorage.getItem(Constants.LocalStorage.FONTFAMILIES));
     if(this.fontInfo!=null){
      this.fontFamilies=this.fontInfo[0].font.split(',');
    this.fontSize=this.fontInfo[0].fontSize.split(',');
    this.delimiters=this.fontInfo[0].delimiter.split(',');
     }
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
getAllInstitutions(){
  this.spinnerService.spinnerStart();
  this.envSetttingService.getAllInstitutions().subscribe((result:any)=>{
      this.autocompleteInstitutions=result.sort((a, b) => (a.name> b.name) ? 1 : -1);
      this.filteredInstitutions=result.sort((a, b) => (a.name> b.name) ? 1 : -1);
      this.spinnerService.spinnerStop();
  },
  (error)=>console.log(error));
  this.spinnerService.spinnerStop();
}
institutionChange(name)
{
  this.isValidInstitution = false;
  if(name!='' && name.trim() !='')
  {
 const data = this.autocompleteInstitutions.filter((str)=>{
      return str.name.toLowerCase().indexOf(name.toLowerCase()) >= 0;
    });
if(data && data.length >0)
{
  this.filteredInstitutions = data;
}
else{
  this.filteredInstitutions=[];
  let institution:Institution = new Institution();
  institution.name='Institution not found'
      this.filteredInstitutions.push(institution);
    }
  }
  else{
    this.filteredInstitutions = this.autocompleteInstitutions;
  }
}
getInstitutionWithCustomersById(id)
{
  this.spinnerService.spinnerStart();
  this.envSetttingService.getInstitutionWithCustomersById(id).subscribe((result:any)=>{
    if(result){
      this.newCustomers=result.customers;
      this.filteredCustomers=result.customers;
      if(this.filteredCustomers.length ==0)
      {
        this.disableCustomer=true;
      }
      else
      {
        this.disableCustomer=false;
      }
      this.instObject=result.Institution;
      this.searchInstitution=result.Institution.name;
      this.instObject.name=this.searchInstitution;
        this.isValidInstitution = true;
      this.spinnerService.spinnerStop();
      if(result.Institution.environmentSettings != null){
        this.envSettings=result.Institution.environmentSettings;
        this.reset(this.envSettings);
      }else{
        //if inst has no env settings then update to envSetting  from Local Storage system level
        this.envSettings=JSON.parse(localStorage.getItem(Constants.LocalStorage.MARCSETTINGS));
        this.reset(this.envSettings);
      
      }
    }
  
  },
  (error)=>console.log(error));
  this.spinnerService.spinnerStop();
}
openPanel()
{
  const self = this;
    setTimeout(function () {
        self.autoTrigger.openPanel();
    }, 1);
}
toggleSelection(customer :CustomerVM)
{
  if(!customer.HasSettings)
  {
  customer.isSelected =!customer.isSelected;
  if(customer.isSelected)
  {
    this.customerIds.push(customer.id);
  }
  else
  {
    this.customerIds.pop(customer.id);
  }
  if(this.customerIds.length >0)
  {
    this.customerError = false;
  }
  else
  {
    this.customerError = true;
  }
  }
}

optionClicked(event: Event, customer: CustomerVM) {
  event.stopPropagation();
  this.toggleSelection(customer);
}
getAllInstitutionsWithCustomers(){
    this.spinnerService.spinnerStart();
    this.envSetttingService.getAllInstitutionsWithCustomers().subscribe((result:any)=>{
        this.institutions=result;
        this.spinnerService.spinnerStop();
    },
    (error)=>console.log(error));
    this.spinnerService.spinnerStop();
  }
  enteredCustText(value: any, operation: any) {
    if (operation == 'existing') {
      this.searchCustomerByName = value;
      this.checkCustomerName(value);
    }
    else {
      this.searchCustomer = value;
    }
  }
  checkCustomerName(value: any) {
    this.customerDisplayName = value;
    if (!value) {

    }
  }
  displayFnForName(institution: Institution): string {
    let name = '';
    if (institution && institution.name) {
      name = institution ? institution.name : '';
      return name;
    }
    else if(institution != undefined && institution !=null){
    return institution.toString();
    }

  }
  setCustomer(customer:any,$event,myForm:NgForm){
        if($event.currentTarget.checked)
        {
          if(this.checkedCustomers === null){
            this.checkedCustomers=[];
          }
          this.checkedCustomers.push(customer.id);
        }else{
          const index: number = this.checkedCustomers.indexOf(customer.id);
        if (index !== -1) {
          this.checkedCustomers.splice(index, 1);
        }
  }
}
getCheckedCustomers(customer:Customers):boolean{
  var val: boolean = false;
  if(!this.checkedCustomers){
    return val;
  }
  else{
 var getCustomerInfo = this.checkedCustomers.find(x => x === customer.id);
 if (getCustomerInfo) val = true;
  return val;
  }

}
displayFn(institution: Institution): string {
  return institution? institution.name: '';
}
display2(customer: CustomerVM): string {
  return '';
}
customerSelectionOperation(customer: CustomerInstitution, operation: string, form: NgForm, searchBy: string, screenType: any) {
  form.form.markAsDirty();
  if(customer.customerName!='Customer not found'){
    this.customers= JSON.parse(JSON.stringify(customer));
  }
}

selectInstitution(selectedInst:Institution,form:NgForm){
  form.form.markAsDirty();
  if(selectedInst.name!='Institution not found'){
      this.getInstitutionWithCustomersById(selectedInst.id);
      this.form.form.markAsPristine();
    
  }
}
saveInstitution(form:NgForm){
  this.institution.name=this.instObject.name;
  this.institution.id=this.instObject.id;
  this.environmentSettings.font= this.fontFamily;
  this.environmentSettings.fontsize=this.font_Size;
  this.environmentSettings.tagcolor=this.strTagDefaultColor;
  this.environmentSettings.backgroundcolor=this.strBackgroundDefaultColor;
  this.environmentSettings.indcolor=this.strIndicatorDefaultColor;
  this.environmentSettings.delimiter=this.delimiterSymbol;
  this.environmentSettings.revealSpaces=this.lineSpaceSelection;
  this.environmentSettings.subfieldcolor=this.strDelimiterDefaultColor;
  this.environmentSettings.ftpLocation =this.ftpLocation;
  if(localStorage.getItem(Constants.LocalStorage.DEFAULTENVSETTINGS))
  {
  var defaultMarcSettings = JSON.parse(localStorage.getItem(Constants.LocalStorage.DEFAULTENVSETTINGS));
  this.environmentSettings.highlightedcolor =defaultMarcSettings.highlightedcolor
  }
  this.environmentSettings.userName=this.userName;
  this.environmentSettings.password=this.password;
  this.institution.environmentSettings=this.environmentSettings;
  this.institutionVm.institution=this.institution;

  //validations check
  this.requiredFieldValidation(this.fontFamily,'family');
  this.requiredFieldValidation(this.font_Size,'size');
  this.requiredFieldValidation(this.userName,'username');
  this.requiredFieldValidation(this.password,'password');
  this.requiredFieldValidation(this.ftpLocation,'location');
  this.requiredFieldValidation(this.delimiterSymbol,'delimiter');

  if(this.fontError || this.userNameError || this.passwordError || this.sizeError || this.locationError ||this.delimiterError){
    this.displayWarnMessage=true;
  }else{
    this.displayWarnMessage=false;
  }
  if(this.instID === '0' && this.custID === '0' && this.customerIds.length <= 0){
    this.displayWarnMessage=true;
    this.customerError = true;
  }
  if(this.displayWarnMessage === true){
    return;
  }

  if( this.custID != null && this.custID !='0'){
    this.spinnerService.spinnerStart();
     this.saveCustomerSettings=new EditCustomerEnvironmentSettingsVM();
     if(this.selectedCust!=null){
     this.saveCustomerSettings.customerId=this.selectedCust.customerId;
     this.saveCustomerSettings.customerName=this.selectedCust.customerName;
     this.saveCustomerSettings.environmentSettings=this.environmentSettings;
     this.saveCustomerSettings.id=this.selectedCust.id;
     this.saveCustomerSettings.name=this.selectedCust.name;


    this.envSetttingService.editCustomerEnvironmentSettings(this.saveCustomerSettings).subscribe((result) =>{
      this.spinnerService.spinnerStop();
      if(result){
        if(this.saveCustomerSettings.customerId == localStorage.getItem(Constants.LocalStorage.CUSTOMERID))
        {
          localStorage.setItem(Constants.LocalStorage.MARCSETTINGS, JSON.stringify(this.saveCustomerSettings.environmentSettings));
        }
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
          width: "500px",
          height: "auto",
          disableClose: true,
          data: {
            isCopyErrorMsg: false,
            isCancelConfirm: false,
            message:
              "Customer updated successfully <b>"
          }
        });
        dialogRef.afterClosed().subscribe(() => {
          this.form.form.markAsPristine();
          this.router.navigate(['/env-settings-crud']);
        });
      }
  },
(error) => {
 if (error.status == 403) {
   //this.displayUnAuthMessage = true;
   this.spinnerService.spinnerStop();
   if (form.dirty) {
     form.form.markAsPristine();
   }
   alert(error.statusText);
   this.router.navigate(["/unauthorized"]);
 } else {
   this.spinnerService.spinnerStop();
   throw error;
 }
});
     }
  }
  else if(this.filteredCustomers && this.filteredCustomers.length>0 ){
    this.saveCustomersSettings=new  AddCustomerEnvironmentSettingsVM();
   this.saveCustomersSettings.environmentSettings=this.environmentSettings;
   this.saveCustomersSettings.customerIds=this.filteredCustomers.filter(a => a.isSelected == true).map(x =>x.id);
   this.saveCustomersSettings.institutionId=this.instObject.id;
   this.spinnerService.spinnerStart();
  this.envSetttingService.addCustomerEnvironmentSettings(this.saveCustomersSettings).subscribe((result) => {
     this.spinnerService.spinnerStop();
      if (result) {
        var customerid= localStorage.getItem(Constants.LocalStorage.CUSTOMERID);
          if (this.saveCustomersSettings.customerIds.indexOf(customerid) > -1) {
              localStorage.setItem(Constants.LocalStorage.MARCSETTINGS, JSON.stringify(this.saveCustomersSettings.environmentSettings));
          }
             const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
               width: "500px",
               height: "auto",
               disableClose: true,
               data: {
                 isCopyErrorMsg: false,
                 isCancelConfirm: false,
                 message:
                   "Customers added successfully <b>"
               }
             });
             dialogRef.afterClosed().subscribe(() => {
              this.form.form.markAsPristine();
              this.router.navigate(['/env-settings-crud']);
             });
           }
       },
     (error) => {
      if (error.status == 403) {
        //this.displayUnAuthMessage = true;
        this.spinnerService.spinnerStop();
        if (form.dirty) {
          form.form.markAsPristine();
        }
        alert(error.statusText);
        this.router.navigate(["/unauthorized"]);
      } else {
        this.spinnerService.spinnerStop();
        throw error;
      }
     });
  }
  else if(this.disableInst){
  this.spinnerService.spinnerStart();
 this.envSetttingService.saveInstitution(this.institution).subscribe((result) => {
    this.spinnerService.spinnerStop();
          if(result){
            if(this.institution.id == (localStorage.getItem(Constants.LocalStorage.INSTITUTIONID)))
            {
            var custID = localStorage.getItem(Constants.LocalStorage.CUSTOMERID);
            this.envSetttingService.getInstitutionByCustomerId(custID).subscribe((Customerresult: EditCustomerEnvironmentSettingsVM)=>{
              if(Customerresult && Customerresult.environmentSettings == null )
              {
                localStorage.setItem(Constants.LocalStorage.MARCSETTINGS, JSON.stringify(this.institution.environmentSettings));
              }
            });
          }
            const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
              width: "500px",
              height: "auto",
              disableClose: true,
              data: {
                isCopyErrorMsg: false,
                isCancelConfirm: false,
                message:
                  "Institution saved successfully <b>"
              }
            });
            dialogRef.afterClosed().subscribe(() => {
              this.form.form.markAsPristine();
               this.router.navigate(['/env-settings-crud']);
            });
          }
      },
    (error) => {
      if (error.status == 403) {
        //this.displayUnAuthMessage = true;
        this.spinnerService.spinnerStop();
        if (form.dirty) {
          form.form.markAsPristine();
        }
        alert(error.statusText);
        this.router.navigate(["/unauthorized"]);
      } else {
        this.spinnerService.spinnerStop();
        throw error;
      }
    });
  }

 }
reset(envSetting:any){
    if(envSetting!=null){
      this.envSettings=envSetting;
    }
    this.strTagDefaultColor=this.envSettings.tagcolor;
    this.fontFamily=this.envSettings.font;
    this.font_Size=this.envSettings.fontsize;
    this.strIndicatorDefaultColor=this.envSettings.indcolor;
    this.delimiterSymbol=this.envSettings.delimiter;
    this.strBackgroundDefaultColor=this.envSettings.backgroundcolor;
    this.strDelimiterDefaultColor=this.envSettings.subfieldcolor;
    this.ftpLocation=this.envSettings.ftpLocation;
    this.userName=this.envSettings.userName;
    this.password=this.envSettings.password;
    this.lineSpaceSelection=this.envSettings.revealSpaces;
}
cancel(form:NgForm){
  if (form && form.form.dirty) {
    this.confirmationMessage(form, "back");
  } else {
    this.router.navigate(["/env-settings-crud"]);
  }
 }
populateInstInfo(instID:string){
  this.spinnerService.spinnerStart();
this.envSetttingService.getInstitutionById(instID).subscribe((result:any)=>{
this.instObject=result.Institution;
    this.searchInstitution=result.Institution.name;
    this.instObject.name=this.searchInstitution;
      this.isValidInstitution = true;
//if Inst has env settings then update thosei
if(result.Institution.environmentSettings != null){
  this.envSettings=result.Institution.environmentSettings;
  this.reset(this.envSettings);
}else{
  //if inst has no env settings then update to envSetting  from Local Storage system level
  this.envSettings=JSON.parse(localStorage.getItem(Constants.LocalStorage.MARCSETTINGS));
  this.reset(this.envSettings);

}
this.spinnerService.spinnerStop();
}

);

}
  populateCustomersInfo(custID:string){
    this.spinnerService.spinnerStart();
    this.envSetttingService.getInstitutionByCustomerId(custID).subscribe((result: any)=>{
      this.selectedCust=result;
    var institution:Institution ={ name : result.name,id:result.id , environmentSettings:result.environmentSettings,createdBy:null,lastModifiedBy:null,createdDate:null,lastModifiedDate:null};
     this.instObject = institution;
    this.searchInstitution=result.name;
    this.searchCustomer = result.customerName;
    this.isValidInstitution = true;
      //if Inst has env settings then update those
      if(this.selectedCust.environmentSettings != null){
        this.envSettings=this.selectedCust.environmentSettings;
        this.reset(this.envSettings);
      }
      else{
        //if inst has no env settings then update to envSetting  from Local Storage system level
        this.envSettings=JSON.parse(localStorage.getItem(Constants.LocalStorage.MARCSETTINGS));
        this.reset(this.envSettings);
      }
      this.spinnerService.spinnerStop();
    });

  }
  filter(filter: string): CustomerInstitution[] {
    this.lastFilter = filter;
    if (filter) {
      return this.newCustomers.filter(option => {
        return option.customerName.toLowerCase().indexOf(filter.toLowerCase()) >= 0;      })
    } else {
      return this.newCustomers.slice();
    }
  }
  // For Customer Validation
  requiredCustomerValidation(){

  }
  requiredFieldValidation(value: any, type: any) {
    if (type == 'family') {
      if (!value) {
        this.fontError = true;      }
      else {
        this.fontError = false;
      }
    }
    else if (type == 'username') {
      if (!value) {
        this.userNameError = true;      }
      else {
        this.userNameError = false;
      }
    }
    else if (type == 'password') {
      if (!value) {
        this.passwordError = true;      }
      else {
        this.passwordError = false;
      }
    }
    else if (type == 'size') {
      if (!value) {
        this.sizeError = true;      }
      else {
        this.sizeError = false;
      }
    }
    else if (type == 'location') {
      if (!value) {
        this.locationError = true;      }
      else {
        this.locationError = false;
      }
    }
    else if (type == 'delimiter') {
      if (!value) {
        this.delimiterError = true;      }
      else {
        this.delimiterError = false;
      }
    }
}
confirmationMessage(form: NgForm, actionType: string) {
  let dialogRef = this.dialog.open(ConfirmationDialogComponent, {
    width: "500px",
    height: "auto",
    disableClose: true,
    data: {
      isCopyErrorMsg: false,
      isCancelConfirm: true,
      message:
      "There are unsaved changes. Are you sure you want to leave this page?"
    }
  });
  dialogRef.afterClosed().subscribe(
    result => {
      if (result) {
        form.form.markAsPristine();
        if (actionType === "back") {
          this.router.navigate(["/env-settings-crud"]);
        }
      } else {
        form.form.markAsDirty();
      }
    },
    error => { console.log(error); }
  );
}
}
