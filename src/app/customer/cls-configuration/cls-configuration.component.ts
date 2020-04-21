import { Component, OnInit, ViewChild, ViewChildren, QueryList, Input } from '@angular/core';
import { NgForm, FormControl } from '@angular/forms';
import { CustomerService } from '../shared/services/customer.service';
import { Customer, CustomerAccount, CustomerMasterAccount, CLSCustomerConfiguration, Customers, CLSCustomerContactDetails, CLSCustomerInternalContactDetails, CLSCustomerOthers, AlphaToNumericSubfield, RenumberTag, CustomerConfigurationDTO, SaveCustomerConfigurationDTO, SuffixConfiguration, OCLCCustomerConfiguration, ScheduledInfo, ATSReviewFields } from '../shared/customer';
import { error, isObject } from 'util';
import { SubSink } from 'subsink';
import { _countGroupLabelsBeforeOption, _getOptionScrollPosition, MatDialog, AUTOCOMPLETE_PANEL_HEIGHT, MatAutocompleteTrigger } from '@angular/material';
import { ConfirmationDialogComponent } from 'src/app/components/shared/confirmation-dialog/confirmation-dialog.component';
import { SpinnerService } from 'src/app/shared/interceptor/spinner.service';
import { Location } from "@angular/common";
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { Z3950Service } from '../../Z39.50Profile/service/z3950.service';
import { MacroService } from '../../macro/shared/service/macro.service';
import { Z3950Profile } from '../../Z39.50Profile/model/z3950';
import { FormCanDeactivate } from "src/app/can-deactivate/form-can-deactivate";
import { Macro } from '../../macro/shared/macro';
import { empty } from 'rxjs';
import { forEach } from '@angular/router/src/utils/collection';
import { ClsConfigurationService } from '../../services/cls-configuration.service';
import { CLSCustomerConfigurationDTO } from '../_dtos/btcat.customer.vm.dtos';
import { Constants } from '../../constants/constants';
import { Columns } from '../../search-results/search-results-columns/Columns';
declare var $: any;
import { DropResult } from 'ngx-smooth-dnd';
import { AuthenticationService } from '../../security/authentication.service';
import { stringify } from 'querystring';
import * as _ from "lodash";
import { UserConfigurationService } from 'src/app/users/user-configuration.service';
import { User } from 'src/app/users/user';
import { CommonService } from 'src/app/shared/service/common.service';

@Component({
  selector: 'app-cls-configuration',
  templateUrl: './cls-configuration.component.html'
})
export class ClsConfigurationComponent extends FormCanDeactivate implements OnInit {
  @ViewChild("form") form: NgForm;
  institutionType: string;
  // Search Split Issue fix
  CWidowHeight: number;
  CHeaderHeight: number;
  CNavHeight: number;
  HeaderHeight: number;
  NewHeight: number;
  CSearchHeight: number;
  CompareBtn: number;
  isSuffixLinkClicked: boolean = false;
  customers: Customers[];
  searchCustomer: any;
  searchAccountGrid: string = "";
  customerNameRouted: string = "";
  private subs = new SubSink();
  selectedCustomer = new Customers();
  previousCustomer = new Customers();
  customerAccounts: CustomerAccount[];
  searchedCustomerAccounts: CustomerAccount[];
  z3950Profiles: Z3950Profile[];
  tempZ3950Profiles: Z3950Profile[];
  selectedZ3950Profiles: Z3950Profile[] = [];
  selectedUsers:User[]=[];
  z3950selected: Z3950Profile;
  userSelected:User;
  z3950SelectedLeft: Z3950Profile;
  userSelectedLeft:User;
  macros: string[];
  tempMacros: string[];
  selectedCatalogLeftId: string = '';
  selectedUserLeftId:string='';
  selectedCatalogId: string = '';
  selectedUserId:string=''
  searchExistingCatalogs: string;
  searchExistingUsers:string;
  searchExistingMacros: string;
  selectedMarc: string;
  selectedMarcLeft: string;
  macroSelected: string;
  macroSelectedLeft: string;
  selectedMacros: string[] = [];
  tableFields: Columns[];
  myControl = new FormControl();
  loadControlScreen: boolean = false;
  alphaToNumbericSubfieldObj: any;
  renumberTagObj: any;
  retain9XXTagsOthers: any;
  charactersPerLine: number = 3;
  cursorOffsetAfterOutput: number = 0;
  maxLines: number = 100;
  textOutput: string = "";
  onPaste: boolean = false;
  maxAtsNumberErrorDisplay: boolean = false;
  errorDisplayOnTop: boolean = false;
  duplicateTagExists: boolean = false;
  duplicateTagExistsTooltip: string = '';
  emailError: boolean = false;
  contactNameError: boolean = false;
  subfield949Error: string = '';
  renumberTagFromToolTip: string = '';
  renumberTagToToolTip: string = '';
  validateAlphaToNumericTagToolTip: string = '';
  validateAlphaSubFieldToolTip: string = '';
  validateNumericSubFieldToolTip: string = '';
  errorPhoneNumberTooltip: string = '';
  saveCustomerConfigurationDTO = new SaveCustomerConfigurationDTO();
  private isIEBrowser = /msie\s|trident\//i.test(window.navigator.userAgent);
  isTableCheckbox: boolean = false;
  isDisableCombineAts: boolean = false;
  holdingCodeToolTip: string = '';
  holdingCodeError: boolean = false;
  projectIdToolTip: string = '';
  projectIdError: boolean = false;
  defaultWeeklySelected: string = 'Weekly';
  contactDetailsAccordianError: boolean = false;
  contactDetailsAccordianToolTip: string = '';
  internalContactDetailsAccordianError: boolean = false;
  internalContactDetailsAccordianToolTip: string = '';
  otherContactDetailsAccordianError: boolean = false;
  otherContactDetailsAccordianToolTip: string = '';
  oclcContactDetailsAccordianError: boolean = false;
  oclcContactDetailsAccordianToolTip: string = '';
  atsReviewFieldsAccordianError: boolean = false;
  atsReviewFieldsAccordianToolTip: string = '';
  accordianErrorToolTip: string = 'Please correct errors here.';
  customerContactDetailsRowsCount: number;
  internalContactDetailsRowsCount: number;
  maxContactDetails: number = 15;
  isMarcValidations: boolean = false;
  itemTagRequired: boolean = false;
  invalidItemTag: boolean = false;
  invalidItemTagToolTip: string = '';
  users:User[]=[];
  customerNameFromMapping: string = '';
  institutes: any[] = [];
  institutionId: string ='';
  jbInstitutionId: string = '';
  //userCustomer:any;

  fileFormat: any[] = [
    { key: "Marc-8", name: "Marc-8" },
    { key: "Unicode", name: "Unicode" }
  ];

  duration: any[] = [
    { key: 'Weekly', name: 'Weekly' },
    { key: 'Monthly', name: 'Monthly' }
  ];

  daysOfWeek: any[] = [
    { key: 'Monday', name: 'Monday' },
    { key: 'Tuesday', name: 'Tuesday' },
    { key: 'Wednesday', name: 'Wednesday' },
    { key: 'Thursday', name: 'Thursday' },
    { key: 'Friday', name: 'Friday' },
    { key: 'Saturday', name: 'Saturday' },
    { key: 'Sunday', name: 'Sunday' }
  ];

  private defaultCatalogs: any = [];
  private cLSCustomerConfiguration: CLSCustomerConfiguration;
  private clsCustomerConfigurationDTO: CLSCustomerConfigurationDTO;
  customerId: any;
  suffixValue: string;
  constructor(
    private cutomerService: CustomerService,
    private spinnerService: SpinnerService,
    private dialog: MatDialog,
    private _titleService: Title,
    private router: Router,
    private location: Location,
    private z3950Service: Z3950Service,
    private clsConfigurationService: ClsConfigurationService,
    private authenticationService: AuthenticationService,
    private macroService: MacroService,
    private route: ActivatedRoute,
    private userConf:UserConfigurationService,
    private commonService: CommonService
  ) {
    super(router, authenticationService);
    this.cLSCustomerConfiguration = new CLSCustomerConfiguration();

  }
  @ViewChildren(MatAutocompleteTrigger, { read: MatAutocompleteTrigger }) matAutocompleteTrigger: QueryList<MatAutocompleteTrigger>;
  @Input() showModal: boolean;
  ngOnInit() {
    // Set the title
    this.showModal = true;
    this._titleService.setTitle("BTCAT | Customer Configuration");
    

    this.commonService.getActiveInstitutions().subscribe(result =>{
      if(result){
        this.institutes = result;
        this.route.params.subscribe(params => {
          if (params['id']) {
            this.customerId = params.id; // customerId from Suffix config screen or name mapping screen
          }
          if(params['instituteId']){
            this.institutionId = params['instituteId'];
          }
          this.location.replaceState('/cls-configuration');
        });
        if(!this.institutionId)
        this.institutionId = this.institutes.find(x=>x.displayName == 'B&T').id;
        this.jbInstitutionId = this.institutes.find(x=>x.displayName == 'JB').id;
        this.getCustomersByInstituttion(this.institutionId);
      }
    },
      (error) => {
        console.log(error);
      });


    this.getAllUsers();
    this.defaultCatalogs = JSON.parse(localStorage.getItem(Constants.LocalStorage.DEFAULTCATALOGS));
    this.z3950Service.getAllZ3950Profiles().subscribe((data) => {
      // to-do
      if(!this.defaultCatalogs){
        this.defaultCatalogs=[];
      }
      let allCatalogs = [...this.defaultCatalogs, ...data];
      this.z3950Profiles = allCatalogs;
      this.tempZ3950Profiles = JSON.parse(JSON.stringify(allCatalogs));
    });
    this.macroService.getallMacros().subscribe((data) => {
      this.macros = [];
      this.tempMacros = [];
      data.forEach(macro => {
        this.macros.push(macro.macroName);
        this.tempMacros.push(macro.macroName);
      });
    });
  }

  ngAfterViewInit(): void {
    this.subs.sink = this.matAutocompleteTrigger.changes.subscribe(trigger => {
      trigger.toArray().map(item => {
        // set default scroll position to 0
        item.autocomplete._setScrollTop(0);
        item._scrollToOption = () => {
          const index: number =
            item.autocomplete._keyManager.activeItemIndex || 0;
          const labelCount = _countGroupLabelsBeforeOption(
            index,
            item.autocomplete.options,
            item.autocomplete.optionGroups
          );
          // tslint:disable-next-line: max-line-length
          const newScrollPosition = _getOptionScrollPosition(
            index,
            25,
            item.autocomplete._getScrollTop(),
            AUTOCOMPLETE_PANEL_HEIGHT
          );
          item.autocomplete._setScrollTop(newScrollPosition);
        };
      });
    });
  }

  goToClsLableConfiguration() {
    let customerId = ''
    if (this.selectedCustomer && this.selectedCustomer.id)
      customerId = this.selectedCustomer.id;
    this.router.navigate(["/cls-label-configuration", customerId, this.institutionId]);
  }

  markAsDirty() {
    if (this.isIEBrowser) {
      if (this.form.touched)
        this.form.form.markAsDirty();
      else
        this.form.form.markAsPristine();
    }
    else {
      this.form.form.markAsDirty();
    }
  }
  /* search split fix function - var values */
  customHeightFunction() {
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
  }

  // multiple marc view methods -- End
  ngAfterViewChecked() {
    /* search split fix function  */
    this.customHeightFunction();
    $(window).resize(e => {
      this.customHeightFunction();
    });
  }
  get filterCatatlogs() {
    // Exclude selected catalogs and "all customer" catalog
    let unSelectedCatalogs = this.z3950Profiles.filter(p => p.id != "11" && this.selectedZ3950Profiles.findIndex(sp => sp.id == p.id) === -1);
    return this.searchExistingCatalogs ? unSelectedCatalogs.filter(p => p.profileName.toLowerCase().indexOf(this.searchExistingCatalogs.toLowerCase()) != -1) :
      unSelectedCatalogs;
  }

  get filterMacros() {
    // Exclude selected macros
    if (this.macros) {
      let unSelectedMacros = this.macros.filter(m => this.selectedMacros.indexOf(m) === -1);
      return this.searchExistingMacros ? unSelectedMacros.filter(p => p.toLowerCase().indexOf(this.searchExistingMacros.toLowerCase()) != -1) :
        unSelectedMacros;
    }
  }
  get filterUsers() {
    // Exclude selected macros
    if (this.users) {
      let unSelectedUsers = this.users.filter(u => this.selectedUsers.findIndex(us=>us.id==u.id) === -1);
      return unSelectedUsers;
    }
  }
  customerNameEntered(enteredText: string) {
    if (!enteredText) {
      this.loadControlScreen = false;
      this.errorDisplayOnTop = false;
      this.selectedCustomer = new Customers();
    }
  }

  findCustomer() {
    if (this.searchCustomer != undefined && this.searchCustomer != '' && this.searchCustomer != "Customer not found") {
      if (!isObject(this.searchCustomer)) {
        let findCustomer = this.customers.find(x => {
          let customerName = x.customerName;
          return (
            customerName && customerName.toLowerCase() === this.searchCustomer.toLowerCase()
          );
        });
        if (findCustomer != undefined) {
          return true;
        } else {
          //this.form.form.markAsPristine();
          this.loadControlScreen = false;
          return false;
        }
      }
    } else {
      //this.form.form.markAsPristine();
      this.loadControlScreen = false;
      return false;
    }
  }

  getCustomersByInstituttion(institutionType: string) {
    this.spinnerService.spinnerStart();
    this.subs.sink = this.cutomerService.getCustomersByInstitution(institutionType).subscribe((item) => {
      this.customers = item;
      //Load selected customer from suffix config screen
      if (this.customerId) {
        let customerData = this.customers.find(x => x.id === this.customerId);
       if (customerData) {
          this.searchCustomer = customerData;
          this.selectCustomer(customerData, this.form);
        }
      }
      this.spinnerService.spinnerStop();
    },
      (error) => {
        console.log(error);
        this.spinnerService.spinnerStop();
      }
    );
  }

  displayFn(customer: CustomerAccount): string {
    let customerDisplayName = '';
    if (customer && customer.customerName) {
      customerDisplayName = customer ? customer.customerName : '';
    }
    return customerDisplayName;
  }

  loadInstitution(){
    this.institutionId = this.institutes.find(x=>x.displayName == 'B&T').id;
    this.getCustomersByInstituttion(this.institutionId);
  }

  selectCustomer(selectedCustomerData: any, form: NgForm) {
    this.previousCustomer = this.selectedCustomer;
    this.selectedCustomer = selectedCustomerData;
    this.searchAccountGrid = '';
    this.duplicateTagExists = false;
    this.duplicateTagExistsTooltip = '';
    this.errorPhoneNumberTooltip = '';

    if (form && form.form.dirty) {
    // if (form.touched && JSON.stringify(this.previousCustomer) != JSON.stringify(this.selectedCustomer)) {
      this.confirmationMessage(form, 'selectCustomer', "");
    }
    else if (JSON.stringify(this.previousCustomer) == JSON.stringify(this.selectedCustomer)) {
      this.loadControlScreen = true;
    }
    else {
      this.changeCustomer(selectedCustomerData);
    }
  }

  clearFields() {
    this.errorDisplayOnTop = false;
    this.contactDetailsAccordianError = false;
    this.contactDetailsAccordianToolTip = '';
    this.internalContactDetailsAccordianError = false;
    this.internalContactDetailsAccordianToolTip = '';
    this.otherContactDetailsAccordianError = false;
    this.otherContactDetailsAccordianToolTip = '';
    this.oclcContactDetailsAccordianError = false;
    this.oclcContactDetailsAccordianToolTip = '';
    this.oclcContactDetailsAccordianError = false;
    this.oclcContactDetailsAccordianToolTip = '';
    this.contactNameError = false;
    this.emailError = false;
    this.holdingCodeError = false;
    this.holdingCodeToolTip = '';
    this.projectIdError = false;
    this.projectIdToolTip = '';
    this.form.form.markAsPristine();
    this.form.form.markAsUntouched();
    this.clsCustomerConfigurationDTO = new CLSCustomerConfigurationDTO;
    this.clsCustomerConfigurationDTO.customerContacts = [];
    this.clsCustomerConfigurationDTO.internalContacts = [];
    this.clsCustomerConfigurationDTO.atsReviewFields = [];
    this.clsCustomerConfigurationDTO.customerOthersDetails = new CLSCustomerOthers;
    this.clsCustomerConfigurationDTO.oclcDetails = new OCLCCustomerConfiguration;
    this.clsCustomerConfigurationDTO.oclcDetails.scheduledInfo = new ScheduledInfo;
    // Reset profiles and macros
    this.searchExistingCatalogs = "";
    this.searchExistingUsers="";
    this.searchExistingMacros = "";

    this.itemTagRequired = false;
    this.invalidItemTag = false;
    this.invalidItemTagToolTip = '';
  }

  onInstitutionTypeChange(form: NgForm) {
    this.selectedCustomer = new Customers();
      this.previousCustomer = new Customers();
      this.searchAccountGrid = '';
      this.duplicateTagExists = false;
      this.duplicateTagExistsTooltip = '';
      this.errorPhoneNumberTooltip = '';
      this.searchCustomer = "";
      this.searchExistingCatalogs = "";
      this.searchExistingUsers="";
      this.searchExistingMacros = "";
      this.retain9XXTagsOthers = '';
      this.loadControlScreen = false;
      this.clearFields();
      this.getCustomersByInstituttion(this.institutionId);
  }

  changeCustomer(selectedCustomerData: any) {
    this.clearFields();
    if (this.tempZ3950Profiles)
      this.z3950Profiles = JSON.parse(JSON.stringify(this.tempZ3950Profiles));
    if (this.tempMacros)
      this.macros = JSON.parse(JSON.stringify(this.tempMacros));
    //Fetch Accounts for selected customer
    this.spinnerService.spinnerStart();
    // this.subs.sink = this.cutomerService.searchCustomers(selectedCustomerData.customerId).subscribe((item: CustomerAccount[]) => {
    //   this.loadControlScreen=true;
    //   if(item!=null){
    //     this.customerAccounts=item;
    //   }
    //   this.spinnerService.spinnerStop();
    // },
    //   (error) => {
    //     console.log(error);
    //     this.spinnerService.spinnerStop();
    //   }
    // );
    this.clsConfigurationService.getCustomerConfiguartionDetail(selectedCustomerData.id).subscribe((mainitem: CustomerConfigurationDTO) => {
      this.loadControlScreen = true;
      if (mainitem.customerAccounts && mainitem.customerAccounts.length > 0) {
        this.customerAccounts = _.sortBy(mainitem.customerAccounts, ['accountNumber']);
        // If accounts are related to JB then show only master account        
        if(this.jbInstitutionId === this.institutionId){
          this.searchedCustomerAccounts = this.customerAccounts.filter(x=>x.isMasterAccount == true);
        }
        else{
          this.searchedCustomerAccounts = this.customerAccounts;
        }
      }
      else {
        this.customerAccounts = mainitem.customerAccounts;
        this.searchedCustomerAccounts = mainitem.customerAccounts;
      }

      let item = mainitem.customerConfiguration;
      if (item != null && item.id != null) {
        let isGlobalSentEmailToCustomerConfiguration = mainitem.customerConfiguration.customerOthersDetails.sendEmailNotificationToCustomer;

        this.combineAtsAndSendEmailToCustomerChanges(this.searchedCustomerAccounts, isGlobalSentEmailToCustomerConfiguration);
        this.cLSCustomerConfiguration = item;

        this.clsCustomerConfigurationDTO = this.transform(item);
        if (this.clsCustomerConfigurationDTO.customerContacts.length < this.maxContactDetails) {
          this.clsCustomerConfigurationDTO.customerContacts.push(this.createCustomerObject());
        }
        this.customerContactDetailsRowsCount = this.clsCustomerConfigurationDTO.customerContacts.length;
        if (this.clsCustomerConfigurationDTO.internalContacts.length < this.maxContactDetails) {
          this.clsCustomerConfigurationDTO.internalContacts.push(this.createInternalObject());
        }
        this.internalContactDetailsRowsCount = this.clsCustomerConfigurationDTO.internalContacts.length;
        this.clsCustomerConfigurationDTO.customerOthersDetails.alphaToNumericSubfield.push(this.createAlphaNumericObject());
        this.clsCustomerConfigurationDTO.customerOthersDetails.renumberTag.push(this.createRenumberTagObject());
        this.isMarcValidations = this.clsCustomerConfigurationDTO.customerOthersDetails.isMarcValidations != null ? this.clsCustomerConfigurationDTO.customerOthersDetails.isMarcValidations : false;

        this.retain9XXTagsOthers = this.clsCustomerConfigurationDTO.customerOthersDetails.retain9XXTags;
        // Validate 9xx tags
        if (this.retain9XXTagsOthers){
          this.validate9xxTags(this.retain9XXTagsOthers);
        }
        if (!this.clsCustomerConfigurationDTO.customerOthersDetails.itemTag) {
          this.clsCustomerConfigurationDTO.customerOthersDetails.itemTag = '949';
        }
        if (!this.clsCustomerConfigurationDTO.oclcDetails.isScheduled) {
          this.clsCustomerConfigurationDTO.oclcDetails.isScheduled = false;
        }
        if (!this.clsCustomerConfigurationDTO.customerOthersDetails.combineATSsAcrossLAccounts) {
          this.clsCustomerConfigurationDTO.customerOthersDetails.combineATSsAcrossLAccounts = false;
        }
        if (!this.clsCustomerConfigurationDTO.customerOthersDetails.fileFormat) {
          this.clsCustomerConfigurationDTO.customerOthersDetails.fileFormat = 'Marc-8';
        }
        this.clsCustomerConfigurationDTO.oclcDetails.scheduledInfo = new ScheduledInfo;
        if (!this.clsCustomerConfigurationDTO.oclcDetails.scheduledInfo.type) {
          this.clsCustomerConfigurationDTO.oclcDetails.scheduledInfo.type = 'Weekly';
        }
        if (!this.clsCustomerConfigurationDTO.oclcDetails.scheduledInfo.dateOfWeek) {
          this.clsCustomerConfigurationDTO.oclcDetails.scheduledInfo.dateOfWeek = 'Monday';
        }
        if (mainitem.customerConfiguration.atsReviewFields == null)
          this.clsCustomerConfigurationDTO.atsReviewFields = localStorage.getItem(Constants.LocalStorage.ATSREVIEWFIELDS) ? JSON.parse(localStorage.getItem(Constants.LocalStorage.ATSREVIEWFIELDS)) : [];

        // If page is redirected from suffix config then call Z39Profile & Macros service
        if (this.customerId) {
          this.macroService.getallMacros().subscribe((data) => {
            this.macros = [];
            this.tempMacros = [];
            if(data){
              data.forEach(macro => {
                this.macros.push(macro.fileName);
                this.tempMacros.push(macro.fileName);
              });
            }
            let sm = [];
            if (item.macros) {
              item.macros.forEach(element => {
                if (this.macros) {
                  let found = this.macros.find(s => s == element)
                  if (found != null) {
                    sm.push(this.macros.find(s => s == element));
                  }
                }
              });
            }
            this.selectedMacros = sm;
          });

          this.defaultCatalogs = JSON.parse(localStorage.getItem(Constants.LocalStorage.DEFAULTCATALOGS));
          this.z3950Service.getAllZ3950Profiles().subscribe((data) => {
            //to-do
            let allCatalogs = [...this.defaultCatalogs, ...data];
            this.z3950Profiles = allCatalogs;
            this.tempZ3950Profiles = JSON.parse(JSON.stringify(allCatalogs));

            let sz = [];
            if (item.catalogs) {
              item.catalogs.forEach(element => {
                if (this.z3950Profiles) {
                  let found = this.z3950Profiles.find(s => s.id == element.id)
                  if (found != null) {
                    sz.push(this.z3950Profiles.find(s => s.id == element.id));
                  }
                }
              });
            }
            this.selectedZ3950Profiles = sz;
          });
          this.customerId = '';
        }
        else {
          let sm = [];
          if (item.macros) {
            item.macros.forEach(element => {
              if (this.macros) {
                let found = this.macros.find(s => s == element)
                if (found != null) {
                  sm.push(this.macros.find(s => s == element));
                }
              }
            });
          }
          this.selectedMacros = sm;

          let sz = [];
          if (item.catalogs) {
            item.catalogs.forEach(element => {
              if (this.z3950Profiles) {
                let found = this.z3950Profiles.find(s => s.id == element.id)
                if (found != null) {
                  sz.push(this.z3950Profiles.find(s => s.id == element.id));
                }
              }
            });
          }
          this.selectedZ3950Profiles = sz;
        }
       this.getSelectedUsers(this.cLSCustomerConfiguration.customerId);
      }
      else {
        if (mainitem.customerAccounts.length == 0) {
          this.isTableCheckbox = false;
        }
        else {

          var data = this.searchedCustomerAccounts.filter(x => {
            x.sentEmailToCustomer = true
            let suffixInfo = this.getSuffixConfig(x.suffixConfiguration);
            if (suffixInfo != 'None') {
              x.isDisableCombineAts = true;
              x.combineATS = false;
            }
            else {
              x.isDisableCombineAts = false;
            }
          });
          this.isTableCheckbox = true;
        }
        this.clsCustomerConfigurationDTO = new CLSCustomerConfigurationDTO;
        this.clsCustomerConfigurationDTO.customerContacts = [];
        this.clsCustomerConfigurationDTO.customerContacts.push(this.createCustomerObject());
        this.customerContactDetailsRowsCount = this.clsCustomerConfigurationDTO.customerContacts.length;
        this.clsCustomerConfigurationDTO.internalContacts = [];
        this.clsCustomerConfigurationDTO.internalContacts.push(this.createInternalObject());
        this.internalContactDetailsRowsCount = this.clsCustomerConfigurationDTO.internalContacts.length;
        this.clsCustomerConfigurationDTO.customerOthersDetails = new CLSCustomerOthers;
        this.clsCustomerConfigurationDTO.customerOthersDetails.alphaToNumericSubfield.push(this.createAlphaNumericObject());
        this.clsCustomerConfigurationDTO.customerOthersDetails.renumberTag.push(this.createRenumberTagObject());
        this.clsCustomerConfigurationDTO.customerId = this.selectedCustomer.id;
        this.clsCustomerConfigurationDTO.customerOthersDetails.itemTag = '949';
        this.clsCustomerConfigurationDTO.customerOthersDetails.combineATSsAcrossLAccounts = false;
        this.clsCustomerConfigurationDTO.customerOthersDetails.fileFormat = 'Marc-8';
        this.clsCustomerConfigurationDTO.oclcDetails = new OCLCCustomerConfiguration;
        this.clsCustomerConfigurationDTO.oclcDetails.isScheduled = false;
        this.clsCustomerConfigurationDTO.oclcDetails.scheduledInfo = new ScheduledInfo;
        this.clsCustomerConfigurationDTO.oclcDetails.scheduledInfo.type = 'Weekly';
        this.clsCustomerConfigurationDTO.oclcDetails.scheduledInfo.dateOfWeek = 'Monday';
        this.selectedMacros = [];
        this.selectedZ3950Profiles = [];
        this.selectedUsers=[];
        this.clsCustomerConfigurationDTO.atsReviewFields = JSON.parse(localStorage.getItem(Constants.LocalStorage.ATSREVIEWFIELDS));
      }
      this.spinnerService.spinnerStop();
    },
      (error) => {
        console.log(error);
        this.spinnerService.spinnerStop();
      }
    );
  }

  getSelectedUsers(customerId : string)
  {
    if(this.users){
      this.selectedUsers =  this.users.filter(u=> u.associatedCustomerGuids && u.associatedCustomerGuids.indexOf(customerId) !=-1);
    }
    else
      this.selectedUsers = [];
  }

  getAccountsBySearchTerm(value: string) {
    if (value) {
      let lowerCaseValue = value.toLowerCase();
      let filteredResult = this.customerAccounts.filter(x => (x.accountNumber).toLowerCase().includes(lowerCaseValue));
      filteredResult = _.sortBy(filteredResult, ['accountNumber']);
      this.searchedCustomerAccounts = filteredResult;
    }
    else {
      this.customerAccounts = _.sortBy(this.customerAccounts, ['accountNumber']);
      this.searchedCustomerAccounts = Array.from(this.customerAccounts);
    }
  }

  // display the suffix information in the cell
  getSuffixConfig(suffixConfiguration: SuffixConfiguration[]) {
    let suffixInfo = "";
    if (suffixConfiguration && suffixConfiguration.length > 0) {
      suffixInfo = suffixConfiguration.map(function (elem) {
        return elem.suffix;
      }).join(", ");
      this.suffixValue = suffixInfo;
    } else {
      suffixInfo = "None";
      this.suffixValue = suffixInfo;

    }
    return suffixInfo;
  }

  goToSuffixConfiguration(form: NgForm, accountId: any) {
    if (form && form.form.dirty) {
      this.confirmationMessage(form, "id", accountId);
    } else
      this.router.navigate(["/account-suffix-configuration", accountId, this.selectedCustomer.id, this.institutionId]);
  }

  public transform(item: CLSCustomerConfiguration): CLSCustomerConfigurationDTO {
    return CLSCustomerConfigurationDTO.fromSource(item);
  }

  validateHoldingCode(holdingCode: any, projectId: any) {
    this.markAsDirty();
    if (holdingCode) {

        if (!projectId && holdingCode.length >= 3) {
          this.projectIdToolTip = 'Required';
          this.projectIdError = true;
        }
        else {
          this.projectIdToolTip = '';
          this.projectIdError = false;
          this.removeAriaDescribedByAttribute('OCLCProjectID');
        }
        if (holdingCode.length < 3) {
          this.holdingCodeToolTip = 'Minimum 3 characters should be there';
          this.holdingCodeError = true;
        }
        else if (holdingCode.length > 5) {
          this.holdingCodeToolTip = 'Maximum 5 characters only allowed';
          this.holdingCodeError = true;
        }
        else {
          this.holdingCodeToolTip = '';
          this.holdingCodeError = false;
          this.removeAriaDescribedByAttribute('OCLCholdingCode');
        }

    }
    else {
      this.holdingCodeToolTip = '';
      this.holdingCodeError = false;
      this.removeAriaDescribedByAttribute('OCLCholdingCode');
      this.projectIdToolTip = '';
      this.projectIdError = false;
      this.removeAriaDescribedByAttribute('OCLCProjectID');
    }
  }

  validateProjectId(projectId: any, holdingCode: any) {
    this.markAsDirty();
    if (projectId) {
      let regex = new RegExp('[0-9]', 'g');
      let validData = projectId.match(regex);
      let fieldValueLength = projectId.toString().length;
      if (validData && validData.length !== fieldValueLength) {
        this.projectIdToolTip = 'Only numeric characters are allowed';
        this.projectIdError = true;
      }
      else if (validData == null) {
        this.projectIdToolTip = 'Only numeric characters are allowed';
        this.projectIdError = true;
      }
      else {
        if (projectId.length > 12) {
          this.projectIdToolTip = 'Maximum 12 characters only allowed';
          this.projectIdError = true;
        }
        else {
          this.projectIdToolTip = '';
          this.projectIdError = false;
          this.removeAriaDescribedByAttribute('OCLCProjectID');
        }
      }
    }
    else if (holdingCode) {
      this.projectIdToolTip = 'Required';
      this.projectIdError = true;
    }
    else {
      this.projectIdToolTip = '';
      this.projectIdError = false;
      this.removeAriaDescribedByAttribute('OCLCProjectID');
      this.holdingCodeToolTip = '';
      this.holdingCodeError = false;
      this.removeAriaDescribedByAttribute('OCLCholdingCode');
    }
  }

  removeAriaDescribedByAttribute(elementId:string){
    document.getElementById(elementId).removeAttribute('aria-describedby');
  }

  autoProcessRangeChanged(value: any) {
    this.markAsDirty();
    this.defaultWeeklySelected = value;
    if (value == 'Weekly')
      this.clsCustomerConfigurationDTO.oclcDetails.scheduledInfo.dateOfWeek = 'Monday';
    else
      this.clsCustomerConfigurationDTO.oclcDetails.scheduledInfo.dateOfWeek = null;
  }

  formatText(event) {
    if (event.target.value) {
      if (event.inputType == 'insertLineBreak') {
        let tags = event.target.value.split('\n');
        let lastTagIndex = tags.length - 2;
        let lastVaue = tags[lastTagIndex];
        if (lastVaue.length != 3) {
          this.validateRetainTags(event);
        }
      }
      else {
        this.validateRetainTags(event);
      }
    }
    else {
      this.duplicateTagExists = false;
      this.duplicateTagExistsTooltip = '';
    }
  }

  validateRetainTags(event) {
    const pattern = /^[0-9]*$/;
    if (!pattern.test(event.target.value)) {
      event.target.value = event.target.value.replace(/[^0-9\s]/g, "");
    }

    let textarea = event.target as HTMLTextAreaElement;

    let lines = textarea.value.split('\n');
    for (let i = 0; i < lines.length; i++) {
      lines[i] = lines[i].trim();
      if (lines[i].length <= this.charactersPerLine)
        continue;

      let j = 0, space = this.charactersPerLine;
      while (j++ <= this.charactersPerLine) {
        if (lines[i].charAt(j) === ' ') space = j;
      }
      lines[i + 1] = lines[i].substring(space + 1) + (lines[i + 1] || "");

      lines[i] = lines[i].substring(0, space);

    }

    let validateTags: string[] = [];
    if (lines) {
      lines.forEach(element => {
        if (element) {
          if (element != undefined) {
            element = element.replace(/\s/g, "");
            if (!pattern.test(element) || element.length != 3) {
            }
            else {
              validateTags.push(element);
            }
          }
        }
      });
    }
    if (validateTags.length > this.maxLines) {
      textarea.value = validateTags.slice(0, this.maxLines).join('\n');
      event.target.value = textarea.value.replace(/^\s*[\r\n]/gm, '');
    }
    else {
      textarea.value = lines.slice(0, this.maxLines).join('\n');
      event.target.value = textarea.value.replace(/^\s*[\r\n]/gm, '');

    }

    // Validate 9xx tags
    if (event.target.value){
      this.validate9xxTags(event.target.value);
    }
  }

  validate9xxTags(enteredtags: any){
    // Validate if any same duplicate tag is entered
    let enteredTags = enteredtags.split('\n');
      let tagsWith9XX = false;
      let invalidTags = false;
      // Validating tags starts with
      if (enteredTags) {
        enteredTags.forEach(x => {
          if (x && !x.startsWith('9')) {
            this.duplicateTagExists = true;
            this.duplicateTagExistsTooltip = 'Only 9XX tags are allowed';
            tagsWith9XX = true;
          }
        });
      }

      if (!tagsWith9XX) {
        // Validating minimum 3 digits tags should be there
        if (enteredTags) {
          enteredTags.forEach(x => {
            if (x && x.length > 0 && x.length < 3) {
              this.duplicateTagExists = true;
              this.duplicateTagExistsTooltip = 'Invalid tag';
              invalidTags = true;
            }
          });
        }

        if (!invalidTags) {
          let enteredTagsWithDuplicate = new Set(enteredTags);
          if (enteredTags.length > enteredTagsWithDuplicate.size) {
            this.duplicateTagExists = true;
            this.duplicateTagExistsTooltip = 'Duplicate tag exists';
          }
          else {
            this.duplicateTagExists = false;
            this.duplicateTagExistsTooltip = '';
          }
        }
      }
  }

  onBlur(event) {
    if (!event) {
      this.duplicateTagExists = false;
      this.duplicateTagExistsTooltip = '';
    }
  }

  onBlurItemTag(tag: any) {
    if (tag) {
      this.itemTagRequired = false;
    }
    else
      this.itemTagRequired = true;
  }

  createAlphaNumericObject() {
    this.alphaToNumbericSubfieldObj = {};
    this.alphaToNumbericSubfieldObj.alphaSubfield = "";
    this.alphaToNumbericSubfieldObj.numericSubfield = "";
    this.alphaToNumbericSubfieldObj.tag = "";
    return this.alphaToNumbericSubfieldObj;
  }

  createRenumberTagObject() {
    this.renumberTagObj = {};
    this.renumberTagObj.tagFrom = "";
    this.renumberTagObj.tagTo = "";
    return this.renumberTagObj;
  }

  addAlphaToNumericSubfield() {
    if (this.isIEBrowser) {
      this.form.form.markAsTouched();
    }
    else
      this.form.form.markAsDirty();
    this.clsCustomerConfigurationDTO.customerOthersDetails.alphaToNumericSubfield.push(this.createAlphaNumericObject());
    setTimeout(() => {
      let index = this.clsCustomerConfigurationDTO.customerOthersDetails.alphaToNumericSubfield.length - 1;
      $('#convertTag' + index).focus();
    }, 10);
  }

  removeAlphaToNumericSubfield(index: any) {
    if (this.isIEBrowser) {
      this.form.form.markAsTouched();
    }
    else
      this.form.form.markAsDirty();
    this.clsCustomerConfigurationDTO.customerOthersDetails.alphaToNumericSubfield.splice(index, 1);
  }

  addRenumberTag() {
    if (this.isIEBrowser) {
      this.form.form.markAsTouched();
    }
    else
      this.form.form.markAsDirty();
    this.clsCustomerConfigurationDTO.customerOthersDetails.renumberTag.push(this.createRenumberTagObject());
    setTimeout(() => {
      let index = this.clsCustomerConfigurationDTO.customerOthersDetails.renumberTag.length - 1;
      $('#currentTag' + index).focus();
    }, 10);
  }

  removeRenumberTag(index: any) {
    if (this.isIEBrowser) {
      this.form.form.markAsTouched();
    }
    else
      this.form.form.markAsDirty();
    this.clsCustomerConfigurationDTO.customerOthersDetails.renumberTag.splice(index, 1);
  }

  createCustomerObject() {
    let cust = new CLSCustomerContactDetails;
    cust.contactName = '';
    cust.email = '';
    cust.phoneNumber = '';
    return cust;
  }
  addCustomerContact() {
    if (this.clsCustomerConfigurationDTO.customerContacts.length < this.maxContactDetails) {
      this.clsCustomerConfigurationDTO.customerContacts.push(this.createCustomerObject());
      this.customerContactDetailsRowsCount = this.clsCustomerConfigurationDTO.customerContacts.length;

      setTimeout(() => {
        let index = this.clsCustomerConfigurationDTO.customerContacts.length - 1;
        $('#customerContactName' + index).focus();
      }, 10);
    }
  }

  removeCustomerContact(index: any) {
    this.clsCustomerConfigurationDTO.customerContacts.splice(index, 1);
    this.customerContactDetailsRowsCount = this.clsCustomerConfigurationDTO.customerContacts.length;
  }

  createInternalObject() {
    let cust = new CLSCustomerInternalContactDetails;
    cust.contactName = '';
    cust.email = '';
    return cust;
  }
  addInternalContact() {
    if (this.clsCustomerConfigurationDTO.internalContacts.length < this.maxContactDetails) {
      this.clsCustomerConfigurationDTO.internalContacts.push(this.createInternalObject());
    }
    this.internalContactDetailsRowsCount = this.clsCustomerConfigurationDTO.internalContacts.length;
    setTimeout(() => {
      let index = this.clsCustomerConfigurationDTO.internalContacts.length - 1;
      $('#internalContactName' + index).focus();
    }, 10);
  }

  removeInternalContact(index: any) {
    this.clsCustomerConfigurationDTO.internalContacts.splice(index, 1);
    this.internalContactDetailsRowsCount = this.clsCustomerConfigurationDTO.internalContacts.length;
  }

  requiredFieldValidation(value: any, type: any, index: any) {
    if (index == 0) {
      if (type == 'email') {
        if (!value) {
          this.emailError = true;
        }
        else {
          this.emailError = false;
        }
      }
      else if (type == 'name') {
        if (!value) {
          this.contactNameError = true;
        }
        else {
          this.contactNameError = false;
        }
      }
    }
  }

  validateEmail(email: any, index: any, accounts: any) {
    if (email) {
      if (email.includes('@')) {
        let validate0 = email.split('@')[0];
        let validate1 = email.split('@')[1];
        // Check for any spaces exists
        if (validate0.includes(' ') || validate1.includes(' ')) {
          return true;
        }
        else {
          if (validate0 && validate1 && validate1.includes('.')) {
            let validate2 = validate1.split('.')[0];
            let validate3 = validate1.split('.')[1];
            // Check for any black spaces exists
            if (validate2.includes(' ') || validate3.includes(' ')) {
              return true;
            }
            else {
              if (validate2 && validate3) {
                if (accounts.indexOf(index)) {
                  return false;
                }
                else {
                  return false;
                }
              }
              else {
                if (accounts.indexOf(index)) {
                  return true;
                }
                else {
                  return true;
                }
              }
            }
          }
          else {
            if (accounts.indexOf(index)) {
              return true;
            }
            else {
              return true;
            }
          }
        }
      }
      else {
        if (accounts.indexOf(index)) {
          return true;
        }
        else {
          return true;
        }
      }
    }
    else {
      if (accounts.indexOf(index)) {
        return false;
      }
      else {
        return false;
      }
    }
  }

  validatePhoneNumber(enteredData: any) {
    if (enteredData) {
      let regex = new RegExp('[0-9+ ()-]', 'g');
      let validData = enteredData.match(regex);
      let fieldValueLength = enteredData.toString().length;
      if (validData && validData.length !== fieldValueLength) {
        this.errorPhoneNumberTooltip = 'Invalid phone number';
        return true;
      }
      else if (validData == null) {
        this.errorPhoneNumberTooltip = 'Invalid phone number';
        return true;
      }
      else {
        if (enteredData.length < 10 || enteredData.length > 20) {
          this.errorPhoneNumberTooltip = 'Min 10 & Max 20 digits should be entered';
          return true;
        }
        else {
          this.errorPhoneNumberTooltip = '';
          return false;
        }
      }
    }
    else {
      this.errorPhoneNumberTooltip = '';
      return false;
    }
  }

  validatePhoneNumberWithMinLength(enteredData: any) {
    if (enteredData && (enteredData.length < 10 || enteredData.length > 20)) {
      return true;
    }
    else {
      return false;
    }
  }

  validate949Subfields(value: any) {
    let breakLoop = false;
    let duplicateSubfieldsExists = false;
    if (value && value.startsWith(',')) {
      this.subfield949Error = 'Should not start with any special character.';
      return true;
    }
    else if (value) {
      let regex = new RegExp('[a-z0-9,]', 'g');
      let validData = value.match(regex);
      let fieldValueLength = value.toString().length;
      if (validData && validData.length !== fieldValueLength) {
        this.subfield949Error = 'Special characters are not allowed.';
        return true;
      }
      else if (validData == null) {
        this.subfield949Error = 'Special characters are not allowed.';
        return true;
      }
      else if (value.includes(',')) {
        let splitedFields = value.split(',');
        if (splitedFields) {
          if (splitedFields.length <= 10) {
            splitedFields.forEach(x => {
              if (!breakLoop) {
                if (x.length > 1 || x.length == 0) {
                  this.subfield949Error = 'One character should be there before or after comma(,).';
                  breakLoop = true;
                }
                else {
                  this.subfield949Error = '';
                  breakLoop = false;
                }
              }
            });
            if (breakLoop) {
              return true;
            }
            else {
              // Check for duplicate characters
              let duplicateSubfields = new Set(splitedFields);
              if (duplicateSubfields.size !== splitedFields.length) {
                this.subfield949Error = 'Duplicate subfields are not allowed.';
                return true;
              }
              else {
                this.subfield949Error = '';
                breakLoop = false;
                return false;
              }
            }
          }
          else {
            this.subfield949Error = 'More than 10 characters are not allowed.';
            return true;
          }
        }
      }
      else if (value.length > 1) {
        this.subfield949Error = 'Each character should be comma (,) separated';
        return true;
      }
    }
    else {
      this.subfield949Error = '';
      breakLoop = false;
      return false;
    }
  }

  validateTag(tag: any) {
    this.invalidItemTagToolTip ='';
    this.markAsDirty();
    if (!tag) {
      tag = '949';
    }
    if (!tag) {
      this.itemTagRequired = true;
    }
    else {
      this.itemTagRequired = false;
    }

    if (tag) {
      if (tag.length < 3) {
        this.itemTagRequired = false;
        this.invalidItemTag = true;
        this.invalidItemTagToolTip = 'Invalid tag';
      }
      else {
        this.itemTagRequired = false;
        this.invalidItemTag = false;
        this.invalidItemTagToolTip = '';

      }
    }
  }

  validateDuplicateTagAndAlphaField(items: any, tag: any, index: any) {
    if (tag.tag.length == 3) {
      let tags = [];
      if (items) {
        items.forEach(x => {
          if (x.tag == tag.tag && x.alphaSubfield == tag.alphaSubfield) {
            tags.push(tag.tag);
          }
        });
      }
      if (tags.length > 1 && items.indexOf(index)) {
        return true;
      }
      else if (tags.length == 1 && items.indexOf(index)) {
        return false;
      }
    }
  }

  validateDuplicateTag(items: any, tag: any, index: any) {
    if (tag.tagFrom.length == 3) {
      let tags = [];
      if (items) {
        items.forEach(x => {
          if (x.tagFrom == tag.tagFrom) {
            tags.push(tag.tagFrom);
          }
        });
      }
      if (tags.length > 1 && items.indexOf(index)) {
        return true;
      }
      else if (tags.length == 1 && items.indexOf(index)) {
        return false;
      }
    }
  }

  validateAlphaToNumericTag(items: any, alphaToNumeric: any, index: any) {
    if (alphaToNumeric.tag) {
      let regex = new RegExp('[0-9]', 'g');
      let validData = alphaToNumeric.tag.match(regex);
      let fieldValueLength = alphaToNumeric.tag.toString().length;
      if (validData && validData.length !== fieldValueLength && items.indexOf(index)) {
        this.validateAlphaToNumericTagToolTip = 'Invalid tag';
        return true
      }
      else if (validData == null && items.indexOf(index)) {
        this.validateAlphaToNumericTagToolTip = 'Invalid tag';
        return true;
      }
      else {
        if (alphaToNumeric.tag.length > 0 && alphaToNumeric.tag.length < 3 && items.indexOf(index)) {
          this.validateAlphaToNumericTagToolTip = 'Invalid tag';
          return true;
        }
        else {
          // Check for duplicates
          if (alphaToNumeric.tag.length == 3) {
            let tags = [];
            if (items) {
              items.forEach(x => {
                if (x.tag == alphaToNumeric.tag && x.alphaSubfield == alphaToNumeric.alphaSubfield) {
                  tags.push(alphaToNumeric.tag);
                }
              });
            }
            if (tags.length > 1 && items.indexOf(index)) {
              this.validateAlphaToNumericTagToolTip = 'Duplicate tag and alpha field';
              return true;
            }
            else if (tags.length == 1 && items.indexOf(index)) {
              this.validateAlphaToNumericTagToolTip = '';
              return false;
            }
          }
          else {
            this.validateAlphaToNumericTagToolTip = '';
            return false;
          }
        }
      }
    }
    else {
      if ((alphaToNumeric.alphaSubfield != "" || alphaToNumeric.numericSubfield != "") && items.indexOf(index)) {
        this.validateAlphaToNumericTagToolTip = 'Required';
        return true;
      }
      else if (items.indexOf(index)) {
        this.validateAlphaToNumericTagToolTip = '';
        return false;
      }
    }
  }

  validateAlphaSubField(items: any, alphaToNumeric: any, index: any) {
    if (alphaToNumeric.alphaSubfield) {
      let regex = new RegExp('[a-z]', 'g');
      let validData = alphaToNumeric.alphaSubfield.match(regex);
      let fieldValueLength = alphaToNumeric.alphaSubfield.toString().length;
      if (validData && validData.length !== fieldValueLength && items.indexOf(index)) {
        this.validateAlphaSubFieldToolTip = 'Invalid alpha field';
        return true;
      }
      else if (validData == null && items.indexOf(index)) {
        this.validateAlphaSubFieldToolTip = 'Invalid alpha field';
        return true;
      }
      else {
        // Check for duplicate
        if (alphaToNumeric) {
          let tags = [];
          if (items) {
            items.forEach(x => {
              if (x.tag == alphaToNumeric.tag && x.alphaSubfield == alphaToNumeric.alphaSubfield) {
                tags.push(alphaToNumeric.tag);
              }
            });
          }
          if (tags.length > 1 && items.indexOf(index)) {
            this.validateAlphaSubFieldToolTip = 'Duplicate tag and alpha field';
            return true;
          }
          else if (tags.length == 1 && items.indexOf(index)) {
            this.validateAlphaSubFieldToolTip = '';
            return false;
          }
        }
        else {
          this.validateAlphaSubFieldToolTip = '';
          return false;
        }
      }
    }
    else {
      if (alphaToNumeric.tag && alphaToNumeric.tag.length == 3 && items.indexOf(index)) {
        this.validateAlphaSubFieldToolTip = 'Required';
        return true;
      }
      else if (items.indexOf(index)) {
        this.validateAlphaSubFieldToolTip = '';
        return false;
      }
    }
  }

  validateNumericSubField(items: any, alphaToNumeric: any, index: any) {
    if (alphaToNumeric.numericSubfield) {
      let regex = new RegExp('[0-9]', 'g');
      let validData = alphaToNumeric.numericSubfield.match(regex);
      let fieldValueLength = alphaToNumeric.numericSubfield.toString().length;
      if (validData && validData.length !== fieldValueLength && items.indexOf(index)) {
        this.validateNumericSubFieldToolTip = 'Invalid numeric field';
        return true;
      }
      else if (validData == null && items.indexOf(index)) {
        this.validateNumericSubFieldToolTip = 'Invalid numeric field';
        return true;
      }
      else {
        this.validateNumericSubFieldToolTip = '';
        return false;
      }
    }
    else {
      if (!alphaToNumeric.numericSubfield && alphaToNumeric.tag && alphaToNumeric.alphaSubfield && items.indexOf(index)) {
        this.validateNumericSubFieldToolTip = 'Required';
        return true;
      }
      else if (items.indexOf(index)) {
        this.validateNumericSubFieldToolTip = '';
        return false;
      }
    }
  }

  validateRenumberTagFrom(items: any, renumberTag: any, index: any) {
    if (renumberTag.tagFrom) {
      let regex = new RegExp('[0-9]', 'g');
      let validData = renumberTag.tagFrom.match(regex);
      let fieldValueLength = renumberTag.tagFrom.toString().length;
      if (validData && validData.length !== fieldValueLength && items.indexOf(index)) {
        this.renumberTagFromToolTip = 'Invalid tag';
        return true;
      }
      else if (validData == null && items.indexOf(index)) {
        this.renumberTagFromToolTip = 'Invalid tag';
        return true;
      }
      else {
        if (renumberTag.tagFrom.length > 0 && renumberTag.tagFrom.length < 3 && items.indexOf(index)) {
          this.renumberTagFromToolTip = 'Invalid tag';
          return true;
        }
        else if (renumberTag.tagFrom == renumberTag.tagTo && items.indexOf(index)) {
          this.renumberTagFromToolTip = 'Invalid tag';
          return true;
        }
        else {
          // Check for duplicate tag
          if (renumberTag.tagFrom.length == 3) {
            let tags = [];
            if (items) {
              items.forEach(x => {
                if (x.tagFrom == renumberTag.tagFrom) {
                  tags.push(renumberTag.tagFrom);
                }
              });
            }
            if (tags.length > 1 && items.indexOf(index)) {
              this.renumberTagFromToolTip = 'Duplicate tag';
              return true;
            }
            else if (tags.length == 1 && items.indexOf(index)) {
              this.renumberTagFromToolTip = '';
              return false;
            }
          }
          else {
            this.renumberTagFromToolTip = '';
            return false;
          }
        }
      }
    }
    else {
      if (renumberTag.tagTo && renumberTag.tagTo.length == 3) {
        this.renumberTagFromToolTip = 'Required';
        return true;
      }
      else {
        this.renumberTagFromToolTip = '';
        return false;
      }
    }
  }

  validateRenumberTagTo(items: any, renumberTag: any, index: any) {
    if (renumberTag.tagTo) {
      let regex = new RegExp('[0-9]', 'g');
      let validData = renumberTag.tagTo.match(regex);
      let fieldValueLength = renumberTag.tagTo.toString().length;
      if (validData && validData.length !== fieldValueLength && items.indexOf(index)) {
        return true;
      }
      else if (validData == null && items.indexOf(index)) {
        this.renumberTagToToolTip = 'Invalid tag';
        return true;
      }
      else {
        if (renumberTag.tagTo.length > 0 && renumberTag.tagTo.length < 3 && items.indexOf(index)) {
          this.renumberTagToToolTip = 'Invalid tag';
          return true;
        }
        else if (renumberTag.tagFrom == renumberTag.tagTo && items.indexOf(index)) {
          this.renumberTagToToolTip = 'Invalid tag';
          return true;
        }
        else {
          this.renumberTagToToolTip = '';
          return false;
        }
      }
    }
    else {
      if (renumberTag.tagFrom && renumberTag.tagFrom.length == 3) {
        this.renumberTagToToolTip = 'Required';
        return true;
      }
      else {
        this.renumberTagToToolTip = '';
        return false;
      }
    }
  }

  clear(form: NgForm) {
    if (form.dirty) {
      form.form.markAsPristine();
      form.form.markAsUntouched();
    }
    this.searchExistingCatalogs = "";
    this.searchExistingUsers="";
    this.searchExistingMacros = "";
    this.errorDisplayOnTop = false;
    this.errorPhoneNumberTooltip = '';
    this.duplicateTagExists = false;
    this.duplicateTagExistsTooltip = '';
    this.retain9XXTagsOthers = '';
    this.holdingCodeError = false;
    this.holdingCodeToolTip = '';
    this.projectIdError = false;
    this.projectIdToolTip = '';
    this.itemTagRequired = false;
    this.invalidItemTag = false;
    this.invalidItemTagToolTip = '';
    this.changeCustomer(this.selectedCustomer);
  }

  back(form: NgForm) {

    if (this.isIEBrowser) {
      if (form && form.form.touched) {
        this.confirmationMessage(form, "back", "");
      } else {
        this.location.back();
      }

    }
    else if (form && form.form.dirty) {
      this.confirmationMessage(form, "back", "");
    } else {
      this.backButtonRedirect();
    }
  }

  backButtonRedirect() {
    if (this.loadControlScreen) {
      this.selectedCustomer = new Customers();
      this.previousCustomer = new Customers();
      this.searchAccountGrid = '';
      this.duplicateTagExists = false;
      this.duplicateTagExistsTooltip = '';
      this.errorPhoneNumberTooltip = '';
      this.searchCustomer = "";
      this.searchExistingCatalogs = "";
      this.searchExistingUsers="";
      this.searchExistingMacros = "";
      this.retain9XXTagsOthers = '';
      this.loadControlScreen = false;
      this.clearFields();
      this.loadInstitution();
      this.location.replaceState('/cls-configuration');
    }
    else {
      // redirect to home page
      this.router.navigate(["/search"]);
    }
  }

  // Show confirmation message if form dirty
  confirmationMessage(form: NgForm, actionType: string, value: any) {
    let dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: "500px",
      height: "auto",
      disableClose: true,
      data: {
        isCopyErrorMsg: false,
        isCancelConfirm: true,
        message: "There are unsaved changes. Are you sure you want to leave this page?"
      }
    });

    dialogRef.afterClosed().subscribe(
      result => {
        if (result) {
          form.form.markAsUntouched();
          form.form.markAsPristine();
          if (actionType === "back") {
            this.backButtonRedirect();
          }
          else if (actionType === 'selectCustomer') {
            this.changeCustomer(this.selectedCustomer);
          }
          else if (actionType === 'id') {
            this.router.navigate(["/account-suffix-configuration", value, this.selectedCustomer.id, this.institutionId]);
          }
        } else {
          if (actionType === 'selectCustomer') {
            this.loadControlScreen = true;
            this.selectedCustomer = this.previousCustomer;
            (<HTMLInputElement>document.getElementById("searchCustomer")).value = this.previousCustomer.customerName;
          }

          form.form.markAsDirty();
        }
      },
      error => { }
    );
  }
  selectCatalog(name: Z3950Profile) {
    this.selectedCatalogId = name.profileName;
    this.z3950selected = name;
  }

  selectCatalogLeft(name: Z3950Profile) {
    this.selectedCatalogLeftId = name.profileName;
    this.z3950SelectedLeft = name;
  }
  selectUser(user: User) {
    this.selectedUserId = user.id;
    this.userSelected = user;
  }

  selectUserLeft(user: User) {
    this.selectedUserLeftId = user.id;
    this.userSelectedLeft = user;
  }
  moveRight() {
    if (this.selectedCatalogId != "") {
      if (this.isIEBrowser) {
        this.form.form.markAsTouched();
      }
      else
        this.form.form.markAsDirty();
      this.selectedZ3950Profiles.push(this.z3950selected);
      this.selectedCatalogId = "";
    }
  }
  moveLeft() {
    if (this.selectedCatalogLeftId != null) {
      if (this.isIEBrowser) {
        this.form.form.markAsTouched();
      }
      else
        this.form.form.markAsDirty();
      this.selectedZ3950Profiles.splice(this.selectedZ3950Profiles.indexOf(this.z3950SelectedLeft), 1);
      this.selectedCatalogLeftId = "";
    }
  }

  selectMacro(macro: string) {
    this.selectedMarc = macro;
    this.macroSelected = macro;
  }

  selectMacroLeft(macro: string) {
    this.selectedMarcLeft = macro;
    this.macroSelectedLeft = macro;
  }
  moveMacroRight() {
    if (this.selectedMarc != null) {
      if (this.isIEBrowser) {
        this.form.form.markAsTouched();
      }
      else
        this.form.form.markAsDirty();
      this.selectedMacros.push(this.macroSelected);
      this.selectedMarc = null;
    }
  }
  moveUserRight(){
    if(this.selectedUserId!=null){
      if(this.isIEBrowser){
        this.form.form.markAsTouched();
      }
      else
      this.form.form.markAsDirty();
      this.selectedUsers.push(this.userSelected);
      this.selectedUserId="";
    }
  }

  moveMacroLeft() {

    if (this.selectedMarcLeft != null) {
      if (this.isIEBrowser) {
        this.form.form.markAsTouched();
      }
      else
        this.form.form.markAsDirty();
      this.selectedMacros.splice(this.selectedMacros.indexOf(this.macroSelectedLeft), 1);
      this.selectedMarcLeft = null;
    }
  }
  moveUserLeft() {

    if (this.selectedUserLeftId != null) {
      if (this.isIEBrowser) {
        this.form.form.markAsTouched();
      }
      else
        this.form.form.markAsDirty();
      this.selectedUsers.splice(this.selectedUsers.indexOf(this.userSelectedLeft), 1);
      this.selectedUserLeftId = null;
    }
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onClickPopUp(event) {
    this.showModal = true;
  }

  onCrossClick(event) {
    if (event.target.classList.contains('closePopUp') && event.target.classList.contains('close')) {
      if (
        localStorage.getItem(Constants.LocalStorage.ADDMORECOLUMNS) != null ||
        localStorage.getItem(Constants.LocalStorage.ADDMORECOLUMNS) != ""
      ) {
        var data = localStorage.getItem(Constants.LocalStorage.ADDMORECOLUMNS);
        this.tableFields = JSON.parse(data);
      }
    }
    $('#addMoreColumnsBody').scrollTop(0);
    $("#addMoreColumns").modal("hide");
  }
  onDropZ3950Column(dropResult: DropResult) {

    this.selectedZ3950Profiles = this.applyDrag(this.selectedZ3950Profiles, dropResult);
  }

  onDropMacroColumn(dropResult: DropResult) {

    this.selectedMacros = this.applyDrag(this.selectedMacros, dropResult);
  }
  onDropUserColumn(dropResult:DropResult){
    this.selectedUsers=this.applyDrag(this.selectedUsers,dropResult);
  }
  applyDrag = (arr, dragResult) => {
    const { removedIndex, addedIndex, payload } = dragResult;
    if (removedIndex === null && addedIndex === null) { return arr; }

    const result = [...arr];
    let itemToAdd = payload;

    if (removedIndex !== null) {
      itemToAdd = result.splice(removedIndex, 1)[0];
    }

    if (addedIndex !== null) {
      result.splice(addedIndex, 0, itemToAdd);
    }

    return result;
  }


  mapOrder(array, order, key) {

    array.sort(function (a, b) {
      var A = a[key], B = b[key];

      if (order.indexOf(A) > order.indexOf(B)) {
        return 1;
      } else {
        return -1;
      }

    });

    return array;
  }

  saveClsCustomerConfig(myForm: NgForm) {
    if (this.clsCustomerConfigurationDTO.customerContacts.length > 0) {
      let tempCustomerContactDetails = [];
      this.clsCustomerConfigurationDTO.customerContacts.forEach(x => {
        if (x.contactName || x.email || x.phoneNumber) {
          tempCustomerContactDetails.push(x);
        }
      });
      this.clsCustomerConfigurationDTO.customerContacts = [];
      this.clsCustomerConfigurationDTO.customerContacts = tempCustomerContactDetails;
    }

    // If customerContactDetails length is equals to 0, then add an object for the same to validate required fields
    if (this.clsCustomerConfigurationDTO.customerContacts.length == 0) {
      this.clsCustomerConfigurationDTO.customerContacts.push(this.createCustomerObject());
    }
    // Check for validation error
    const items = document.getElementsByClassName('border-danger');

    if (items.length > 0 ||
      !this.clsCustomerConfigurationDTO.customerContacts[0].contactName ||
      !this.clsCustomerConfigurationDTO.customerContacts[0].email) {
      this.errorDisplayOnTop = true;
      if (!this.clsCustomerConfigurationDTO.customerContacts[0].contactName) {
        this.contactNameError = true;
      }
      if (!this.clsCustomerConfigurationDTO.customerContacts[0].email) {
        this.emailError = true;
      }
    }
    else if (items.length > 0 || this.clsCustomerConfigurationDTO.atsReviewFields.length > 0) {
      this.clsCustomerConfigurationDTO.atsReviewFields.forEach((x, index) => {
        if (!x.label || !x.tag) {
          this.errorDisplayOnTop = true;
          x.isTagValid = true;
        }
        else if (!x.tag || !x.subFieldCode) {
          this.validateTagReviewField(x.tag, index, true);
          this.validateSubFieldReviewField(x.subFieldCode, index, true);
        }
        else {
          this.errorDisplayOnTop = false;
        }
      });
    }
    else if (this.itemTagRequired || this.invalidItemTag) {
      this.errorDisplayOnTop = true;
    }
    else {
      this.errorDisplayOnTop = false;
      this.contactNameError = false;
      this.emailError = false;
    }
    // Highlight accordian if error exists
    if (items.length > 0) {
      // Contact details accordian
      let contactDetailsAccordian = document.getElementById('CLSCustConfigContactDetails');
      let contactDetailsError = contactDetailsAccordian.getElementsByClassName('border-danger');
      if (contactDetailsError.length > 0) {
        this.contactDetailsAccordianError = true;
        this.contactDetailsAccordianToolTip = this.accordianErrorToolTip;
      }
      else {
        this.contactDetailsAccordianError = false;
        this.contactDetailsAccordianToolTip = '';
      }
      // Internal contact details accordian
      let internalContactDetailsAccordian = document.getElementById('CLSCustConfigInternalDetails');
      let internalContactDetailsError = internalContactDetailsAccordian.getElementsByClassName('border-danger');
      if (internalContactDetailsError.length > 0) {
        this.internalContactDetailsAccordianError = true;
        this.internalContactDetailsAccordianToolTip = this.accordianErrorToolTip;
      }
      else {
        this.internalContactDetailsAccordianError = false;
        this.internalContactDetailsAccordianToolTip = '';
      }
      // Other contact details accordian
      let otherContactDetailsAccordian = document.getElementById('CLSCustConfigOthers');
      let otherContactDetailsError = otherContactDetailsAccordian.getElementsByClassName('border-danger');
      if (otherContactDetailsError.length > 0) {
        this.otherContactDetailsAccordianError = true;
        this.otherContactDetailsAccordianToolTip = this.accordianErrorToolTip;
      }
      else {
        this.otherContactDetailsAccordianError = false;
        this.otherContactDetailsAccordianToolTip = '';
      }
      // OCLC details accordian
      let oclcContactDetailsAccordian = document.getElementById('OCLC');
      let oclcContactDetailsError = oclcContactDetailsAccordian.getElementsByClassName('border-danger');
      if (oclcContactDetailsError.length > 0) {
        this.oclcContactDetailsAccordianError = true;
        this.oclcContactDetailsAccordianToolTip = this.accordianErrorToolTip;
      }
      else {
        this.oclcContactDetailsAccordianError = false;
        this.oclcContactDetailsAccordianToolTip = '';
      }
      // ATS Review Fields accordian
      let atsReviewFieldsAccordian = document.getElementById('ATSReviewFieldsCreate');
      let atsReviewFieldsError = atsReviewFieldsAccordian.getElementsByClassName('border-danger');
      if (atsReviewFieldsError.length > 0) {
        this.oclcContactDetailsAccordianError = true;
        this.oclcContactDetailsAccordianToolTip = this.accordianErrorToolTip;
      }
      else {
        this.oclcContactDetailsAccordianError = false;
        this.oclcContactDetailsAccordianToolTip = '';
      }
    }

    if (!this.errorDisplayOnTop) {

      if (this.clsCustomerConfigurationDTO.internalContacts.length > 0) {
        let tempInternalContactDetails = [];
        this.clsCustomerConfigurationDTO.internalContacts.forEach(x => {
          if (x.contactName || x.email) {
            tempInternalContactDetails.push(x);
          }
        });
        this.clsCustomerConfigurationDTO.internalContacts = [];
        this.clsCustomerConfigurationDTO.internalContacts = tempInternalContactDetails;
      }

      this.errorPhoneNumberTooltip = '';
      this.spinnerService.spinnerStart();
      this.clsCustomerConfigurationDTO.catalogs = this.selectedZ3950Profiles;
      this.clsCustomerConfigurationDTO.macros = this.selectedMacros;
      this.clsCustomerConfigurationDTO.customerId = this.selectedCustomer.id;

      let actor = null;
      if (localStorage.getItem(Constants.LocalStorage.ACTOR) !== null &&
        localStorage.getItem(Constants.LocalStorage.ACTOR) !== '') {
        actor = localStorage.getItem(Constants.LocalStorage.ACTOR);
        if (this.clsCustomerConfigurationDTO.id == null || this.clsCustomerConfigurationDTO.id == '00000000-0000-0000-0000-000000000000') {
          this.clsCustomerConfigurationDTO.createdBy = actor.toLowerCase();
          this.clsCustomerConfigurationDTO.lastModifiedBy = actor.toLowerCase();
        }
        else {
          this.clsCustomerConfigurationDTO.lastModifiedBy = actor.toLowerCase();
        }
      }

      this.clsCustomerConfigurationDTO.customerOthersDetails.retain9XXTags = this.retain9XXTagsOthers;
      this.clsCustomerConfigurationDTO.customerOthersDetails.isMarcValidations = this.isMarcValidations;
      if (this.clsCustomerConfigurationDTO.customerOthersDetails.alphaToNumericSubfield.length > 0) {
        let tempAlphaToNumericSubfieldObj = [];
        this.clsCustomerConfigurationDTO.customerOthersDetails.alphaToNumericSubfield.forEach(x => {
          if (x.tag) {
            tempAlphaToNumericSubfieldObj.push(x);
          }
        });
        this.clsCustomerConfigurationDTO.customerOthersDetails.alphaToNumericSubfield = [];
        this.clsCustomerConfigurationDTO.customerOthersDetails.alphaToNumericSubfield = tempAlphaToNumericSubfieldObj;
      }

      if (this.clsCustomerConfigurationDTO.customerOthersDetails.renumberTag.length > 0) {
        let tempRenumberObj = [];
        this.clsCustomerConfigurationDTO.customerOthersDetails.renumberTag.forEach(x => {
          if (x.tagFrom) {
            tempRenumberObj.push(x);
          }
        });
        this.clsCustomerConfigurationDTO.customerOthersDetails.renumberTag = [];
        this.clsCustomerConfigurationDTO.customerOthersDetails.renumberTag = tempRenumberObj;
      }
      this.clsCustomerConfigurationDTO.customerOthersDetails.sendEmailNotificationToCustomer = this.isTableCheckbox;
      this.saveCustomerConfigurationDTO.customerConfigurationDTO = this.clsCustomerConfigurationDTO;
      this.saveCustomerConfigurationDTO.customerAccounts = this.customerAccounts;
      this.saveCustomerConfigurationDTO.associatedUserIds = this.selectedUsers.map(u=> {return u.id});
      this.saveCustomerConfigurationDTO.customerId = this.selectedCustomer.id;
      this.clsConfigurationService.SaveCustomerConfiguration(this.saveCustomerConfigurationDTO)
        .subscribe(
          result => {
            myForm.form.markAsUntouched();
            myForm.form.markAsPristine();
            this.spinnerService.spinnerStop();
            this.searchAccountGrid = null;
            const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
              width: "500px",
              height: "auto",
              disableClose: true,
              data: {
                isCopyErrorMsg: false,
                isCancelConfirm: false,
                message:
                  "The configuration details for the Customer <b>" +
                  this.selectedCustomer.customerName +
                  "</b> is saved successfully."
              }
            });
            dialogRef.afterClosed().subscribe(() => {
              // this.searchCustomer = "";
              // this.searchExistingCatalogs = "";
              // this.searchExistingMacro s = "";
              // this.loadControlScreen = false;
              if (result.customerAccounts && result.customerAccounts.length > 0) {
                this.customerAccounts = _.sortBy(result.customerAccounts, ['accountNumber']);
                this.searchedCustomerAccounts = _.sortBy(result.customerAccounts, ['accountNumber']);
              }
              else {
                this.customerAccounts = result.customerAccounts;
                this.searchedCustomerAccounts = result.customerAccounts;
              }
              let isGlobalSentEmailToCustomerConfiguration = result.customerConfiguration.customerOthersDetails.sendEmailNotificationToCustomer;
              this.combineAtsAndSendEmailToCustomerChanges(this.searchedCustomerAccounts, isGlobalSentEmailToCustomerConfiguration);
              this.clsCustomerConfigurationDTO = this.transform(result.customerConfiguration);
              if (this.clsCustomerConfigurationDTO.customerContacts.length < this.maxContactDetails) {
                this.clsCustomerConfigurationDTO.customerContacts.push(this.createCustomerObject());
              }
              this.customerContactDetailsRowsCount = this.clsCustomerConfigurationDTO.customerContacts.length;
              if (this.clsCustomerConfigurationDTO.internalContacts.length < this.maxContactDetails) {
                this.clsCustomerConfigurationDTO.internalContacts.push(this.createInternalObject());
              }
              this.internalContactDetailsRowsCount = this.clsCustomerConfigurationDTO.internalContacts.length;
              this.clsCustomerConfigurationDTO.customerOthersDetails.alphaToNumericSubfield.push(this.createAlphaNumericObject());
              this.clsCustomerConfigurationDTO.customerOthersDetails.renumberTag.push(this.createRenumberTagObject());
              let customerLocalId = localStorage.getItem(Constants.LocalStorage.CUSTOMERID);
              if (customerLocalId == this.selectedCustomer.id) {
                let allCatalogs = JSON.parse(localStorage.getItem(Constants.LocalStorage.ALLCATALOGS));
                let customerCatalogs = this.selectedZ3950Profiles ? this.selectedZ3950Profiles : [];
                let filterCustomerCatalogs = this.selectedZ3950Profiles ?
                  allCatalogs.filter(p => this.selectedZ3950Profiles.findIndex(c => c.id === p.id) != -1) : [];
                let finalFilterCustomerCatalogs = [];
                let item_order = customerCatalogs.map(function (n, i) {
                  return n.id;
                });
                finalFilterCustomerCatalogs = this.mapOrder(filterCustomerCatalogs, item_order, 'id');
                finalFilterCustomerCatalogs.forEach(item => {
                  if (item.profileName === Constants.DELETEDDBPROFILENAME) {
                    item.isActive = false;
                  }
                });
                localStorage.setItem(
                  Constants.LocalStorage.SAVECATALOGITEMS,
                  JSON.stringify(finalFilterCustomerCatalogs)
                );
                if (this.clsCustomerConfigurationDTO.customerOthersDetails.isMarcValidations) {
                  localStorage.setItem(Constants.LocalStorage.ISMARC21VALIDATIONS, "true");
                } else {
                  localStorage.setItem(Constants.LocalStorage.ISMARC21VALIDATIONS, "false");
                }
              }
            });
          },
          error => {
            if (error.status == 403) {
              this.spinnerService.spinnerStop();
              if (myForm.dirty) {
                myForm.form.markAsPristine();
                myForm.form.markAsUntouched();
              }
              this.router.navigate(["/unauthorized"]);
            } else {
              this.spinnerService.spinnerStop();
              throw error;
            }
          });
    }
  }


  checkUnCheckAllCheckboxes(form: NgForm, isTableCheckbox: boolean) {
    this.form.form.markAsDirty();
    this.form.form.markAsTouched();
    if (isTableCheckbox) {
      this.searchedCustomerAccounts.forEach(x => x.sentEmailToCustomer = true);

    }
    else {
      this.searchedCustomerAccounts.forEach(x => x.sentEmailToCustomer = false);

    }
  }

  checkUncheckCombineATSCheckbox(form) {
    this.form.form.markAsDirty();
    this.form.form.markAsTouched();
  }
  checkUncheckTableCheckbox(form: NgForm, isTableItemCheckbox: boolean) {
    this.form.form.markAsDirty();
    this.form.form.markAsTouched();
    let isAnyCheckBoxUnSelected = this.searchedCustomerAccounts.find(x => x.sentEmailToCustomer == false);
    let checkedIds = [];
    var data = this.searchedCustomerAccounts.filter(x => {
      if (x.sentEmailToCustomer)
        checkedIds.push(x.accountNumber);
    });

    if (isTableItemCheckbox) {

      if (this.searchedCustomerAccounts.length == checkedIds.length)
        this.isTableCheckbox = true;
      else
        this.isTableCheckbox = false;
    }
    else
      this.isTableCheckbox = false;

  }
  addNewAtsReviewField() {
    this.clsCustomerConfigurationDTO.atsReviewFields.push(new ATSReviewFields);
    setTimeout(() => {
      let index = this.clsCustomerConfigurationDTO.atsReviewFields.length - 1;
      $('#ATSReviewFieldTitle' + index).focus();
    }, 10);
  }
  removeReviewField(index: any) {
    this.clsCustomerConfigurationDTO.atsReviewFields.splice(index, 1);
  }
  onDropReviewFields(dropResult: DropResult) {

    this.clsCustomerConfigurationDTO.atsReviewFields = this.applyDrag(this.clsCustomerConfigurationDTO.atsReviewFields, dropResult);
  }
  checkControlNumber(controlNumber: string) {
    if (controlNumber && controlNumber.length != 0) {
      if (controlNumber.length == 3) {
        if (controlNumber[0] == '0' && controlNumber[1] == '0') {
          return true;
        }
      }
    }
    else
      return false;
  }
  remove_special_char(event) {
    var k;
    k = event.charCode;
    return ((k > 64 && k < 91) || (k > 96 && k < 123) || k == 8 || k == 32 || (k >= 48 && k <= 57));
  }
  validateLabelReviewField(label: string, index: any, onSave: boolean = false) {
    if (!label || label == "") {
      this.clsCustomerConfigurationDTO.atsReviewFields[index].isLabelValid = true;
      if (onSave) {
        this.errorDisplayOnTop = true;
      }
    }
    else {
      this.clsCustomerConfigurationDTO.atsReviewFields[index].isLabelValid = false;
    }
  }
  validateTagReviewField(tag: string, index: any, onSave: boolean = false) {
    if (!tag || tag == "") {
      this.clsCustomerConfigurationDTO.atsReviewFields[index].isTagValid = true;
      if (onSave) {
        this.errorDisplayOnTop = true;
      }
    }
    else {
      this.clsCustomerConfigurationDTO.atsReviewFields[index].isTagValid = false;
    }
  }
  validateSubFieldReviewField(subField: string, index: any, onSave: boolean = false) {
    if (!subField || subField == "") {
      this.clsCustomerConfigurationDTO.atsReviewFields[index].isSubFieldValid = true;
      if (!this.checkControlNumber(this.clsCustomerConfigurationDTO.atsReviewFields[index].tag)) {
        if (onSave) {
          this.errorDisplayOnTop = true;
        }
      }
    }
    else {
      this.clsCustomerConfigurationDTO.atsReviewFields[index].isSubFieldValid = false;
    }

  }
  combineAtsAndSendEmailToCustomerChanges(searchedCustomerAccounts: CustomerAccount[], isGlobalSentEmailToCustomerConfiguration: boolean) {

    this.searchedCustomerAccounts = searchedCustomerAccounts;
    if (this.searchedCustomerAccounts != null) {
      if (this.searchedCustomerAccounts.length > 0) {
        let checkedIds = [];
        let unCheckedIds = [];
        var data = this.searchedCustomerAccounts.filter(x => {
          let suffixInfo = this.getSuffixConfig(x.suffixConfiguration);
          if (suffixInfo != 'None') {
            x.isDisableCombineAts = true;
            x.combineATS = false;
          }
          else {
            x.isDisableCombineAts = false;
          }

          if (x.sentEmailToCustomer)
            checkedIds.push(x.accountNumber);
          if (!x.sentEmailToCustomer)
            unCheckedIds.push(x.accountNumber);
        });

        if (isGlobalSentEmailToCustomerConfiguration) {
          this.isTableCheckbox = true;
          this.searchedCustomerAccounts.forEach(x => x.sentEmailToCustomer = true);
        }
        else
          this.isTableCheckbox = false;
      }
      else {
        this.isTableCheckbox = false;
      }
    }

  }
  getAllUsers() {
    this.spinnerService.spinnerStart();
    this.subs.sink = this.userConf.getUsers().subscribe((item) => {
      if(item!=null){
      this.users = item.filter(x=>x.firstName!=null || x.lastName!=null);
        if(this.customerId)
        this.getSelectedUsers(this.customerId);
      this.spinnerService.spinnerStop();
      }
    },
      (error) => {
        console.log(error);
        this.spinnerService.spinnerStop();
      }
    );
  }
}
