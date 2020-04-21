import { Component, OnInit, ViewChild, QueryList, ViewChildren } from '@angular/core';
import { NgForm, FormControl } from '@angular/forms';
import { CustomerService } from '../shared/services/customer.service';
import { Customer, CustomerAccount, CustomerMasterAccount, Customers, MainAccount, CustomerModel, SearchCustomerAccount } from '../shared/customer';
import { error, isObject } from 'util';
import { SubSink } from 'subsink';
import { _countGroupLabelsBeforeOption, _getOptionScrollPosition, MatDialog, MatDialogRef, MatAutocompleteTrigger, AUTOCOMPLETE_PANEL_HEIGHT } from '@angular/material';
import { ConfirmationDialogComponent } from 'src/app/components/shared/confirmation-dialog/confirmation-dialog.component';
import { SpinnerService } from 'src/app/shared/interceptor/spinner.service';
import { Location } from "@angular/common";
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { UtilService } from 'src/app/shared/util.service';
import { CustomerMasterAccountDTO, MainAccountDTO } from '../_dtos/btcat.customer.vm.dtos';
import * as _ from 'lodash';
import { stringify } from 'querystring';
import { FormCanDeactivate } from 'src/app/can-deactivate/form-can-deactivate';
import { AuthenticationService } from 'src/app/security/authentication.service';
import { Constants } from 'src/app/constants/constants';
import { CommonService } from 'src/app/shared/service/common.service';
declare var $: any;


@Component({
  selector: 'app-customer-name-map',
  templateUrl: './customer-name-map.component.html',
  styleUrls: ["./customer-name-map.component.css"]
})
export class CustomerNameMapComponent extends FormCanDeactivate implements OnInit {
  @ViewChild("form") form: NgForm;
  // Search Split Issue fix
  CWidowHeight: number;
  CHeaderHeight: number;
  CNavHeight: number;
  HeaderHeight: number;
  NewHeight: number;
  CSearchHeight: number;
  CompareBtn: number;
  iscustomerNameRequired: boolean = false;
  isForExistingCustomer: boolean = false;
  lAllCustomers: CustomerAccount[] = [];
  lAllCustomerWithOutDuplicates: CustomerAccount[] = [];
  customers: CustomerAccount[] = [];
  customerAccountsList: SearchCustomerAccount[] = [];
  searchCustomerAccounts: SearchCustomerAccount[] = [];
  lAllNewCustomers: CustomerModel[] = [];
  newCustomers: CustomerModel[] = [];
  selectedIds: string[] = [];
  isTableCheckbox: boolean = false;
  isShowisTableCheckbox: boolean = false;
  uniqueMainAccount: MainAccountDTO[] = [];
  modifiedCutomerAccounts = new Customers();
  private subs = new SubSink();
  selectedCustomer = new CustomerAccount();
  disableToSelect: boolean = false;
  updatedcustomerName: string = '';
  displayGrid: boolean = false;
  isNew: boolean = true;
  searchAccountNumber: any;
  selCustomerIds: string;
  modifiedCustomerIds: string[];
  selectedCustomerIds: string[] = [];
  customerNameExists: CustomerModel = null;

  //Search, multi selector
  searchCustomer: any;
  searchCustomerByName: any = null;
  searchCustomerId: string = '';
  userSearchedValues: CustomerAccount[] = [];
  uniqueUserSearchedValues: CustomerAccount[] = [];

  searchTermControl = new FormControl();
  customerStateControl = new FormControl();
  UsersAllowed: number = 20;
  isvalidCustomer: boolean = false;
  validUpdateCustomerName: boolean = true;
  disableCustomerId: boolean = true;
  disableAccountNumber: boolean = false;
  disabledCustomerId: string = '';
  institutionId: string = '';
  private customerMasterAccountsDTO: CustomerMasterAccountDTO[] = [];
  masterSelected: boolean;
  expandedElement: any;
  rowSelected: number;
  customerAccounts: CustomerMasterAccount[] = [];
  displayDuplicateWarnMessage: boolean = false;
  customerDisplayName: string = "";
  uniqueCustomerMasterAccountsDTO: CustomerMasterAccount[];
  warningDialogRef: MatDialogRef<ConfirmationDialogComponent, any>;
  existingCustomers: Customers[] = [];
  existingCustomerIds: any;
  isExistingCustomer: CustomerModel;
  table: any;
  existingCustomerId: string;
  existingCustomerName: string;
  selectedNewCustomer: any = null;
  selectedExistingCustomer: Customer = null;
  formIsModified: boolean = false;
  searchByType: string = '';
  NewTableHeight: number;
  flagArray = [];
  isExpandedAll: boolean = false;
  isCheckBoxSelectedOrUnselected: boolean = false;

  updateCustomerNameInExisting: string = '';
  duplicateCustomerNameError: boolean = false;
  duplicateCustomerNameToolTip: string = '';
  modifiedCustomerIdsToDisplay: string[] = [];
  previousCustomerName: string = '';
  institutes: any[] = [];
  defaultInstituteId: string = '';
  existingCustomersRepo: Customers[] = [];
  jbInstitutionId: string = '';

  constructor(
    private cutomerService: CustomerService,
    private spinnerService: SpinnerService,
    private dialog: MatDialog,
    private _titleService: Title,
    private router: Router,
    private location: Location,
    private authenticationService: AuthenticationService,
    private utilService: UtilService,
    private commonService: CommonService
  ) {
    super(router, authenticationService);
    this.rowSelected = -1;
    this.modifiedCustomerIds = [];
  }

  @ViewChildren(MatAutocompleteTrigger, { read: MatAutocompleteTrigger }) matAutocompleteTrigger: QueryList<MatAutocompleteTrigger>;

  ngOnInit() {
    // Set the title
    this._titleService.setTitle("BTCAT | Customer Name Mapping");
    this.commonService.getActiveInstitutions().subscribe(result => {
      if (result) {
        this.institutes = result;
        this.institutionId = this.institutes.find(x => x.displayName == 'B&T').id;
        this.defaultInstituteId = this.institutionId;
        this.jbInstitutionId = this.institutes.find(x=>x.displayName == 'JB').id;
        this.loadDataInDropdowns();
      }
    },
      (error) => {
        console.log(error);
      });
  }

  private loadDataInDropdowns() {
    this.getNewCustomers(this.institutionId);
    this.getCustomersAccounts(this.institutionId);
    this.getCustomers();
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
    this.NewTableHeight = this.NewHeight - 190;
  }


  iconChange(i: number) {
    this.customerMasterAccountsDTO[i].isExpanded = !this.customerMasterAccountsDTO[i].isExpanded;
    this.changeExpandCollapseAll();

  }

  changeExpandCollapseAll() {
    let isAnyExpanded = this.customerMasterAccountsDTO.find(x => x.isExpanded == true);
    if (isAnyExpanded)
      this.isExpandedAll = true;
    else
      this.isExpandedAll = false;
  }

  expandCollapseAll() {
    this.isExpandedAll = !this.isExpandedAll;

    if (this.isExpandedAll) {
      for (let i = 0; i < this.customerMasterAccountsDTO.length; i++) {
        this.customerMasterAccountsDTO[i].isExpanded = true;
      }
    }
    else {
      for (let i = 0; i < this.customerMasterAccountsDTO.length; i++) {
        this.customerMasterAccountsDTO[i].isExpanded = false;
      }
    }
  }

  // multiple marc view methods -- End
  ngAfterViewChecked() {
    /* search split fix function  */
    this.CustomHeightFunction();
    $(window).resize(e => {
      this.CustomHeightFunction();
    });
  }

  goToClsLableConfiguration() {
    let customerId = ''
    if (!this.isNew && this.selectedNewCustomer)
      customerId = this.selectedNewCustomer.id;
    this.router.navigate(["/cls-label-configuration", customerId, this.institutionId]);
  }

  goToCustomerConfiguration() {
    let customerId = ''
    if (!this.isNew && this.selectedNewCustomer)
      customerId = this.selectedCustomer.id;
    this.router.navigate(["/cls-configuration", customerId, this.institutionId]);
  }

  ValidateForm(id: string) {
    if (id === 'updateCustomerName') {
      if (this.updatedcustomerName) {
        this.iscustomerNameRequired = false;
        var data = this.existingCustomersRepo.filter(x => {
          if (x.customerName) {
            return x.customerName.toLowerCase().includes(this.updatedcustomerName.toLowerCase());
          }
        });

        if (data.length > 0) {
          this.displayDuplicateWarnMessage = true;
          this.iscustomerNameRequired = false;
        } else {
          this.displayDuplicateWarnMessage = false;
          this.iscustomerNameRequired = false;
        }
      } else {
        this.iscustomerNameRequired = true;
        this.displayDuplicateWarnMessage = false;
      }
    }
  }

  changeSearchSelection(form: NgForm, isNewOrExisting: boolean, isSwitch = false, isChangefromInstituteChange = false) {
    if (isSwitch) {
      this.searchCustomer = null;
      this.searchCustomerByName = null;
      $('#searchCustomer').val('');
      $('#searchCustomerByName').val('');
    }
    else {
      $('#searchCustomer').val('');
      $('#searchCustomerByName').val('');
    }

    this.isNew = isNewOrExisting;
    if (!this.isNew)
      this.disableAccountNumber = true;
    else
      this.disableAccountNumber = false;

    form.form.markAsPristine();
    this.clearFields();
    if (!isChangefromInstituteChange && this.institutionId != this.defaultInstituteId) {
      this.institutionId = this.defaultInstituteId;
      this.loadDataInDropdowns();
    }
  }

  clearFields() {
    this.duplicateCustomerNameError = false;
    this.duplicateCustomerNameToolTip = '';
    this.updateCustomerNameInExisting = '';
    this.searchAccountNumber = '';
    this.userSearchedValues = [];
    this.customerMasterAccountsDTO = [];
    this.customerAccounts = [];
    this.selectedCustomer = new CustomerAccount();
    this.updatedcustomerName = '';
    this.displayGrid = false;
    this.iscustomerNameRequired = false;
    this.displayDuplicateWarnMessage = false;
    this.disableCustomerId = true;
    this.disabledCustomerId = '#e9ecef';
    this.validUpdateCustomerName = true;
    this.isvalidCustomer = false;
    this.newCustomers = [];
    this.newCustomers = Array.from(this.lAllNewCustomers);
    this.searchCustomerAccounts = Array.from(this.customerAccountsList);
    this.selectedNewCustomer = null;
    this.selectedExistingCustomer = null;
    this.isCheckBoxSelectedOrUnselected = false;
    this.formIsModified = false;
    this.isExpandedAll = false;
    this.modifiedCustomerIdsToDisplay = [];
  }

  customerSelectionOperation(customer: any, operation: string, form: NgForm, searchBy: string, screenType: any) {
    this.isCheckBoxSelectedOrUnselected = false;
    this.duplicateCustomerNameError = false;
    this.duplicateCustomerNameToolTip = '';
    this.searchByType = searchBy;

    if (!this.isNew && searchBy == "customerIds") {
      this.existingCustomerId = customer.id;
      this.existingCustomerName = customer.customerName;
      this.isExpandedAll = false;
      if (!this.formIsModified) {
        //Clear grid on change of customer name in existing
        this.userSearchedValues = [];
        this.customerMasterAccountsDTO = [];
        this.customerAccounts = [];
        this.displayGrid = false;
      }
    }
    if (this.userSearchedValues == undefined) this.userSearchedValues = [];
    let idx: number = this.userSearchedValues.findIndex(uv => uv.customerId == customer.customerId);
    if (operation == 'remove') {
      if (idx > -1) {
        //remove from selected values
        this.userSearchedValues.splice(idx, 1)
        if (this.userSearchedValues.length == 0) {
          this.isExpandedAll = false;
          this.updateCustomerNameInExisting = '';
          if (screenType == 'existing')
            this.changeSearchSelection(form, false);
          else
            this.changeSearchSelection(form, true);
        }

        this.newCustomers = [];
        this.searchCustomerAccounts = [];
        if (this.userSearchedValues.length == 0) {
          this.newCustomers = Array.from(this.lAllNewCustomers);
          this.searchCustomerAccounts = Array.from(this.customerAccountsList)
        }
        else {
          this.lAllNewCustomers.forEach(x => {
            let notExists = this.userSearchedValues.find(y => y.customerId == x.customerId);
            if (!notExists) {
              this.newCustomers.push(x);
            }
          });
          //Remove accounts for already selected customerIds            
          this.customerAccountsList.forEach(x => {
            let notExists = this.userSearchedValues.find(y => y.customerId == x.customerId);
            if (!notExists) {
              this.searchCustomerAccounts.push(x);
            }
          });
        }

        this.customerMasterAccountsDTO = this.customerMasterAccountsDTO.filter(x => x.customerId != customer.customerId);
        this.checkUncheckTableCheckBox();
        if (this.userSearchedValues.length == 0) this.customerDisplayName = '';
        this.changeExpandCollapseAll();
      }

    }
    if (operation == 'add') {
      this.isvalidCustomer = true;
      this.validUpdateCustomerName = false;
      if (idx < 0) {
        if (screenType != 'existing' || searchBy == 'customerId') {
          this.userSearchedValues.push(customer);
        }

        if (searchBy == 'customerIds') {
          if (this.selectedNewCustomer == null) {
            this.selectedNewCustomer = customer;
          }
          else if (this.selectedNewCustomer != null) {
            this.selectedExistingCustomer = this.selectedNewCustomer;
            this.selectedNewCustomer = customer;
          }

          if (this.selectedNewCustomer && this.selectedExistingCustomer == null) {
            //Load Accounts in grid from DB
            this.getAccountsForSearchedValue(customer, searchBy);
          }
          else {
            // Show unsaved data changes
            if (form && form.form.dirty && this.formIsModified) {
              this.confirmationMessage(form, 'anotherNameSelected', customer);
            }
            else {
              this.getAccountsForSearchedValue(customer, searchBy);
            }
          }
        }
        else {
          this.getAccountsForSearchedValue(customer, searchBy);
        }
      }
    }
    if (this.customerMasterAccountsDTO != null && this.customerMasterAccountsDTO.length > 0) {
      this.displayGrid = true;
    }
    else {
      this.displayGrid = false;
    }
  }

  enteredText(value: any, operation: any) {
    if (operation == 'existing') {
      this.searchCustomerByName = value;
      this.checkCustomerName(value);
    }
    else {
      this.searchCustomer = value;
    }

    if (!value) {
      this.formIsModified = false;
      this.selectedNewCustomer = null;
      this.selectedExistingCustomer = null;
      this.searchAccountNumber = null;
      this.updateCustomerNameInExisting = '';
      this.duplicateCustomerNameError = false;
      this.duplicateCustomerNameToolTip = '';
      this.isCheckBoxSelectedOrUnselected = false;
      this.isExpandedAll = false;
    }
  }

  checkCustomerName(value: any) {
    this.customerDisplayName = value;
    if (!value) {
      this.userSearchedValues = [];
      this.customerMasterAccountsDTO = [];
      this.displayGrid = false;
      this.disableCustomerId = true;
      this.disabledCustomerId = '#e9ecef';
      if (!this.isNew)
        this.disableAccountNumber = true;
      this.iscustomerNameRequired = false;
      this.newCustomers = [];
      this.newCustomers = Array.from(this.lAllNewCustomers);
      this.validUpdateCustomerName = true;
    }
  }

  findCustomer(form: NgForm) {

    if (this.searchCustomer != undefined && this.searchCustomer != '' && this.searchCustomer != "Customer not found") {

      if (form.dirty) {
        form.form.markAsPristine();
      }

      if (!isObject(this.searchCustomer)) {
        let findCustomer = this.existingCustomersRepo.find(x => {
          let customerName = x.customerName;
          if (x.customerName)
            return customerName.toLowerCase() === this.searchCustomer.toLowerCase();
          else
            return false;
        });
        if (findCustomer != undefined) {
          return true;
        } else {
          return false;
        }
      }
    }
  }

  getNewCustomers(institutionType: string) {
    this.spinnerService.spinnerStart();
    this.subs.sink = this.cutomerService.getNewCustomers(institutionType).subscribe((customerList: CustomerModel[]) => {
      this.lAllNewCustomers = customerList;
      this.newCustomers = Array.from(this.lAllNewCustomers);
      this.spinnerService.spinnerStop();
    },
      (error) => {
        console.log(error);
        this.spinnerService.spinnerStop();
      }
    );
  }

  //This method is used to get the saved customer collection
  getCustomers() {
    // this.spinnerService.spinnerStart();
    this.subs.sink = this.cutomerService.getCustomers().subscribe((item: Customers[]) => {
      this.existingCustomersRepo = item;
      this.filterExistingCustomers();
      // this.spinnerService.spinnerStop();
    },
      (error) => {
        console.log(error);
        // this.spinnerService.spinnerStop();
      }
    );
  }

  private filterExistingCustomers() {
    this.existingCustomers = [];
    this.existingCustomersRepo.filter(x => {
      if (this.institutionId == this.defaultInstituteId) {
        if (x.institutionId == null || x.institutionId == this.institutionId) {
          this.existingCustomers.push(x);
        }
      }
      else {
        if (x.institutionId == this.institutionId) {
          this.existingCustomers.push(x);
        }
      }
    });
  }

  getCustomersAccounts(institutionType: string) {
    // this.spinnerService.spinnerStart();
    this.subs.sink = this.cutomerService.getCustomersAccounts(institutionType)
      .subscribe((accountList: any) => {

        let response: SearchCustomerAccount[] = [];
        accountList.forEach(element => {
          let item = new SearchCustomerAccount();
          item.customerId = element.split("-")[0];
          item.accountNumber = element.split("-")[1];
          response.push(item);
        });
        this.customerAccountsList = response;
        this.searchCustomerAccounts = [];
        this.searchCustomerAccounts = Array.from(this.customerAccountsList);
        // this.spinnerService.spinnerStop();
      },
        (error) => {
          console.log(error);
          // this.spinnerService.spinnerStop();
        }
      );
  }

  displayNoneFn(customer: CustomerAccount): string {
    //Displaying selected customer in multi select so dispaly empty here
    return "";
  }

  displayFnForName(customer: CustomerAccount): string {
    if (customer) {
      if (customer && customer.customerName) {
        this.customerDisplayName = customer.customerName;
      }
      return this.customerDisplayName;
    }
    else {
      return this.customerDisplayName;
    }
  }

  displayFnForAccountNumber(customer: CustomerAccount): string {
    let accoutNumber = '';
    // if (customer && customer.accountNumber) {
    //   return accoutNumber = customer.accountNumber;
    // }
    // else {
    //   return accoutNumber;
    // }
    return '';
  }

  public openCloseRow(idReserva: number): void {

    if (this.rowSelected === -1) {
      this.rowSelected = idReserva
    }
    else {
      if (this.rowSelected == idReserva) {
        this.rowSelected = -1
      }
      else {
        this.rowSelected = idReserva
      }

    }
  }

  validateUpdateCustomerNameInExisting(myForm: NgForm, value: any) {
    if (value) {
      this.duplicateCustomerNameError = false;
      this.duplicateCustomerNameToolTip = '';
    }
    else {
      this.duplicateCustomerNameError = true;
      this.duplicateCustomerNameToolTip = 'Required';
    }

  }

  getAccountsForSearchedValue(selectedCustomerData: any, searchBy: string) {
    this.customerDisplayName = selectedCustomerData.customerName;
    if (this.isNew)
      this.selectedCustomer = selectedCustomerData;
    else if (!this.isNew && searchBy === 'customerIds')
      this.selectedCustomer = selectedCustomerData;
    let searchValue: string;

    if (searchBy === 'customerName') {
      searchValue = selectedCustomerData.customerName;
    }
    else if (searchBy === 'accountNumber') {
      searchValue = selectedCustomerData.accountNumber;
    }

    if (searchBy === 'customerIds') {
      searchValue = '';
      if (selectedCustomerData.selectedCustomerIds != null) {
        if (selectedCustomerData.selectedCustomerIds.length > 1)
          searchValue = selectedCustomerData.selectedCustomerIds != null ? selectedCustomerData.selectedCustomerIds.join("','") : '';
        else
          searchValue = selectedCustomerData.selectedCustomerIds
      }
    }
    else
      searchValue = selectedCustomerData.customerId;

    if (searchValue) {
      this.spinnerService.spinnerStart();
      this.subs.sink = this.cutomerService.getCustomerAccounts(searchValue, searchBy, this.institutionId).subscribe((accountsListResult: CustomerMasterAccount[]) => {
        if (accountsListResult != null) {
          //Loading selected distinct customerIds
          if (searchBy === 'customerName' || searchBy === 'customerIds') {
            this.updateCustomerNameInExisting = this.selectedCustomer.customerName;
            this.uniqueUserSearchedValues = [];
            if (this.userSearchedValues == undefined) this.userSearchedValues = [];
            let customerIds = _.uniqBy(accountsListResult, 'customerId');
            this.uniqueUserSearchedValues.push.apply(this.uniqueUserSearchedValues, customerIds);
            this.uniqueUserSearchedValues
              .forEach(element => {
                if (!this.userSearchedValues.find(x => x.customerId == element.customerId)) {
                  this.userSearchedValues.push(element);
                }
              });
          }

          //console.log(this.userSearchedValues);
          this.customerAccounts = accountsListResult;
          if (this.customerAccounts) {
            this.customerAccounts.forEach(x => {
              let customerMasterAccountDTO: CustomerMasterAccountDTO;
              customerMasterAccountDTO = this.transform(x, this.isNew, this.existingCustomerName);
              if (!this.customerMasterAccountsDTO.find(y => y.customerId == x.customerId && y.masterAccount == x.masterAccount)) {
                customerMasterAccountDTO.mainAccounts = this.getMainAccounts(customerMasterAccountDTO.mainAccounts);;
                this.customerMasterAccountsDTO.push(customerMasterAccountDTO);
              }
            });
            // if(this.jbInstitutionId === this.institutionId){
            //   this.customerMasterAccountsDTO.forEach((item, index) => {
            //     item.customerName = this.customerAccounts[index].mainAccounts[index].customerName;
            //   });
            // }
          }

          // Remove the customer Id which are alreay selected
          this.newCustomers = [];
          this.lAllNewCustomers.forEach(x => {
            let notExists = this.userSearchedValues.find(y => y.customerId == x.customerId);
            if (!notExists) {
              this.newCustomers.push(x);
            }
          });
          //Remove accounts for already selected customerIds
          if (this.userSearchedValues && this.userSearchedValues.length > 0) {
            this.searchCustomerAccounts = [];
            this.customerAccountsList.forEach(x => {
              let notExists = this.userSearchedValues.find(y => y.customerId == x.customerId);
              if (!notExists) {
                this.searchCustomerAccounts.push(x);
              }
            });
          }

          this.checkUncheckTableCheckBox();
          this.displayGrid = true;
        }
        this.spinnerService.spinnerStop();
      },
        (error) => {
          console.log(error);
          this.spinnerService.spinnerStop();
          this.displayGrid = false;
        }
      );
      if (searchBy === 'customerIds') {
        this.disableCustomerId = false;
        if (!this.isNew)
          this.disableAccountNumber = false;
        this.disabledCustomerId = 'white';
        this.isvalidCustomer = true;
        this.validUpdateCustomerName = false;
      }
    }
  }

  checkUncheckTableCheckBox() {
    this.isTableCheckbox = false;
    this.isShowisTableCheckbox = false;
    //Check/Uncheck all from column header
    let breakLoop = false;
    for (var i = 0; i < this.customerMasterAccountsDTO.length; i++) {
      if (breakLoop)
        break;
      if (this.customerMasterAccountsDTO[i].mainAccounts && this.customerMasterAccountsDTO[i].mainAccounts.length > 0) {
        for (var j = 0; j < this.customerMasterAccountsDTO[i].mainAccounts.length; j++) {
          if (breakLoop)
            j = this.customerMasterAccountsDTO[i].mainAccounts.length;
          if (this.customerMasterAccountsDTO[i].mainAccounts[j].isShowCheckBox) {
            // Check here for JB to disable check boxes for accounts except master account
            if(this.jbInstitutionId === this.institutionId){
              this.customerMasterAccountsDTO[i].mainAccounts[j].isShowCheckBox = false;
              this.isShowisTableCheckbox = true;
              if (!this.customerMasterAccountsDTO[i].mainAccounts[j].isChecked) 
                this.isTableCheckbox = false;
            }
            else{
              this.isShowisTableCheckbox = true;
              if (!this.customerMasterAccountsDTO[i].mainAccounts[j].isChecked) {
                this.isTableCheckbox = false;
                breakLoop = true;
                break;
              }
            }
          }
        }
      }
    }

    //Check/Uncheck header all check box
    let isAnyCheckBoxUnSelected = this.customerMasterAccountsDTO.find(x => x.isCheckMasterCheckbox == false && x.isShowMasterCheckbox == true);
    if (isAnyCheckBoxUnSelected)
      this.isTableCheckbox = false;
    else
      this.isTableCheckbox = true;
  }

  public transform(item: CustomerMasterAccount, isNew: boolean, customerName: string): CustomerMasterAccountDTO {
    return CustomerMasterAccountDTO.fromSource(item, isNew, customerName);
  }

  validateUpdateCustomerName(form: NgForm, enteredText: any) {
    if (enteredText) {
      this.formIsModified = true;
      form.form.markAsDirty();
    }
    if (enteredText && this.userSearchedValues.length > 0) {
      // this.validUpdateCustomerName = false;
      // this.isvalidCustomer = true;
      this.iscustomerNameRequired = false;
    }
    else {
      // this.validUpdateCustomerName = true;
      // this.isvalidCustomer = false;
      this.iscustomerNameRequired = true;
    }
  }

  updateCustomer(form: NgForm) {
    if (this.isNew) {
      this.modifiedCutomerAccounts.id = null;
      this.selectedCustomer.customerName = this.updatedcustomerName.trim();
      this.modifiedCutomerAccounts.institutionId = this.institutionId;
      this.modifiedCutomerAccounts.customerName = this.updatedcustomerName.trim();
      this.modifiedCutomerAccounts.selectedIds = this.getModifiedAccounts(this.customerMasterAccountsDTO);
      this.modifiedCutomerAccounts.selectedCustomerIds = this.selectedCustomerIds;
    }
    else {
      this.modifiedCutomerAccounts.id = this.existingCustomerId;
      this.modifiedCutomerAccounts.institutionId = this.institutionId;
      this.modifiedCutomerAccounts.customerName = this.updateCustomerNameInExisting.trim();
      this.modifiedCutomerAccounts.selectedIds = this.getModifiedAccounts(this.customerMasterAccountsDTO);
      this.modifiedCutomerAccounts.selectedCustomerIds = this.selectedCustomerIds;
    }
    // Check weather already customer name is exists or not
    if (this.isNew) {
      if (!this.updatedcustomerName) {
        // If customer name is empty
        this.iscustomerNameRequired = true;
      }
      else {
        this.iscustomerNameRequired = false;
        let isCustomerNameAlreadyExist = this.existingCustomersRepo.find(x => (x.customerName != '' && x.customerName != null && x.customerName != undefined && x.customerName.toLowerCase()) == (this.updatedcustomerName && this.updatedcustomerName.toLowerCase()));
        if (this.modifiedCutomerAccounts && this.modifiedCutomerAccounts.selectedIds && this.modifiedCutomerAccounts.selectedIds.length > 0) {
          if (isCustomerNameAlreadyExist != null) {
            this.displayDuplicateWarnMessage = true;
          }
          else {
            this.displayDuplicateWarnMessage = false;
            this.updateCustomerData(form);
          }
        }
        else {
          this.isCheckBoxSelectedOrUnselected = true;
        }
      }
    }
    else {
      if (this.modifiedCutomerAccounts &&
        this.modifiedCutomerAccounts.selectedIds && this.modifiedCutomerAccounts.selectedIds.length > 0) {
        // Check weather already customer name is exists or not
        // If exists show error, else proceed to update with confirmation dialog
        let isCustomerNameAlreadyExist = this.existingCustomersRepo.find(x => (x.customerName && x.customerName.toLowerCase()) == (this.updateCustomerNameInExisting && this.updateCustomerNameInExisting.toLowerCase()));
        if (!this.updateCustomerNameInExisting) {
          this.duplicateCustomerNameError = true;
          this.duplicateCustomerNameToolTip = 'Required';
        }
        else if (this.selectedCustomer.customerName != this.updateCustomerNameInExisting && isCustomerNameAlreadyExist) {
          // Customer name is already exists
          this.duplicateCustomerNameError = true;
          this.duplicateCustomerNameToolTip = 'Customer name is already exists';
        }
        else {
          // Proceed updated customer name with confirmation
          this.duplicateCustomerNameError = false;
          this.duplicateCustomerNameToolTip = '';
          this.updateCustomerData(form);
        }
      }
      else {
        this.isCheckBoxSelectedOrUnselected = true;
      }
    }
  }

  updateCustomerData(form: NgForm) {
    this.spinnerService.spinnerStart();

    let actor = null;
    if (localStorage.getItem(Constants.LocalStorage.ACTOR) !== null &&
      localStorage.getItem(Constants.LocalStorage.ACTOR) !== '') {
      actor = localStorage.getItem(Constants.LocalStorage.ACTOR);
      if (this.modifiedCutomerAccounts.id == null || this.modifiedCutomerAccounts.id == '00000000-0000-0000-0000-000000000000') {
        this.modifiedCutomerAccounts.createdBy = actor.toLowerCase();
        this.modifiedCutomerAccounts.lastModifiedBy = actor.toLowerCase();
      }
      else {
        this.modifiedCutomerAccounts.lastModifiedBy = actor.toLowerCase();
      }
    }

    if (this.isNew)
      this.modifiedCutomerAccounts.customerName = this.updatedcustomerName.trim();
    else
      this.modifiedCutomerAccounts.customerName = this.updateCustomerNameInExisting.trim();
    this.subs.sink = this.cutomerService.updateAccountsCustomerName(this.modifiedCutomerAccounts).subscribe(
      result => {
        this.spinnerService.spinnerStop();
        if (result) {
          if (this.isNew) {
            this.selectedCustomer.customerName = this.updatedcustomerName;
            this.searchCustomer = null;
            this.searchCustomer = this.selectedCustomer;
          }
          else {
            this.previousCustomerName = this.selectedCustomer.customerName;
            this.selectedCustomer.customerName = this.updateCustomerNameInExisting;
            this.existingCustomerName = this.updateCustomerNameInExisting;
            this.searchCustomerByName = null;
            this.searchCustomerByName = this.selectedCustomer;
            $('#searchCustomerByName').val('');
            $('#searchCustomerByName').val(this.selectedCustomer.customerName);
          }

          this.showUpdatedMessagePopup(form);
        }
      },
      error => {
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
      }
    );
  }

  reloadAccountsGridOnSave(form: NgForm) {
    //Reload the account grid after successful save          
    this.modifiedCutomerAccounts.selectedCustomerIds = this.userSearchedValues.map(x => x.customerId);
    let customerData = this.modifiedCutomerAccounts;
    this.isCheckBoxSelectedOrUnselected = false;
    this.userSearchedValues = [];
    this.customerMasterAccountsDTO = [];
    this.customerAccounts = [];
    this.displayGrid = false;
    this.isShowisTableCheckbox = false;
    this.isTableCheckbox = false;
    this.isExpandedAll = false;
    this.getAccountsForSearchedValue(customerData, 'customerIds');
    if (form.dirty) {
      form.form.markAsPristine();
    }
    this.formIsModified = false;
  }

  showUpdatedMessagePopup(form: NgForm) {
    if (this.modifiedCutomerAccounts.selectedCustomerIds) {
      let lIds = ''
      let lastValue = this.modifiedCutomerAccounts.selectedCustomerIds[this.modifiedCutomerAccounts.selectedCustomerIds.length - 1];
      this.modifiedCutomerAccounts.selectedCustomerIds.forEach((value) => {
        if (!lIds) {
          lIds = value;
        } else {
          if (lastValue != value)
            lIds += ',' + value;
          else
            lIds += ' & ' + value;
        }
      });
      this.isCheckBoxSelectedOrUnselected = false;
      let message = '';

      if (this.isNew) {
        message = "Customer Id(s) <b>" + lIds + " updated to  " + this.selectedCustomer.customerName + "</b>.";
      }
      else {
        // If nothing has modified and just updated
        if (this.modifiedCustomerIdsToDisplay.length == 0 && this.previousCustomerName.toLowerCase() == this.updateCustomerNameInExisting.toLowerCase()) {
          message = "Customer updated successfully";
        }

        // If customer Id's & name both are modified
        if (this.modifiedCustomerIdsToDisplay.length > 0 && this.previousCustomerName.toLowerCase() !== this.updateCustomerNameInExisting.toLowerCase()) {
          message = "Customer Name is updated to <b>" + this.updateCustomerNameInExisting + "</b> and ";
          // Eliminate duplicates customer Id's
          this.modifiedCustomerIdsToDisplay = this.modifiedCustomerIdsToDisplay.filter((el, i, a) => i === a.indexOf(el));
          let lastVal = this.modifiedCustomerIdsToDisplay[this.modifiedCustomerIdsToDisplay.length - 1];
          let modifieds = '';
          this.modifiedCustomerIdsToDisplay.forEach((val) => {
            if (!modifieds) {
              modifieds = val;
            } else {
              if (lastVal != val)
                modifieds += ',' + val;
              else
                modifieds += ' & ' + val;
            }
          });
          message += "Customer Id(s) <b>" + modifieds + "</b> are modified.";
          this.modifiedCustomerIdsToDisplay = [];
        }
        else {
          // If only customer Id's are modified         
          if (this.modifiedCustomerIdsToDisplay.length > 0) {
            // Eliminate duplicates customer Id's
            this.modifiedCustomerIdsToDisplay = this.modifiedCustomerIdsToDisplay.filter((el, i, a) => i === a.indexOf(el));
            let lastVal = this.modifiedCustomerIdsToDisplay[this.modifiedCustomerIdsToDisplay.length - 1];
            let modifieds = '';
            this.modifiedCustomerIdsToDisplay.forEach((val) => {
              if (!modifieds) {
                modifieds = val;
              } else {
                if (lastVal != val)
                  modifieds += ',' + val;
                else
                  modifieds += ' & ' + val;
              }
            });
            message = "Customer Id(s) <b>" + modifieds + "</b> are modified.";
            this.modifiedCustomerIdsToDisplay = [];
          }

          // If customer name only updated
          if (this.previousCustomerName.toLowerCase() !== this.updateCustomerNameInExisting.toLowerCase()) {
            message = "Customer Name is updated to <b>" + this.updateCustomerNameInExisting + "</b>.";
          }
        }
      }
      this.showDialogPopup(form, message, 'updatedSuccessful');
    }
  }

  operationsPostUpdateCustomer() {
    //Reload the customers list
    localStorage.removeItem(Constants.LocalStorage.CUSTOMERDATAREFRESH);
    this.getNewCustomers(this.institutionId);
    this.getCustomersAccounts(this.institutionId);
    this.getCustomers();
    //Make null after successful update
    this.modifiedCutomerAccounts = new Customers();
    this.selCustomerIds = '';
    this.selectedCustomerIds = [];
    // this.validUpdateCustomerName = true;
    // this.isvalidCustomer = false;
    this.selectedIds = [];
    this.updatedcustomerName = '';
  }

  onInstitutionTypeChange(form: NgForm) {
    if (this.isNew)
      this.changeSearchSelection(form, true, false, true);
    else
      this.changeSearchSelection(form, false, false, true);

    this.searchCustomerAccounts = [];
    this.getNewCustomers(this.institutionId);
    this.getCustomersAccounts(this.institutionId);
    this.filterExistingCustomers();
  }

  showDialogPopup(form: NgForm, message: any, type: any) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: "500px",
      height: "auto",
      disableClose: true,
      data: {
        isCopyErrorMsg: false,
        isCancelConfirm: false,
        message: message
      }
    });

    if (type == 'updatedSuccessful') {
      dialogRef.afterClosed().subscribe(() => {
        this.displayGrid = true;
        if (form.dirty) {
          form.form.markAsPristine();
        }
        this.reloadAccountsGridOnSave(form);
        this.operationsPostUpdateCustomer();
      });
    }
    else {
      dialogRef.afterClosed().subscribe(() => {
        this.reloadAccountsGridOnSave(form);
        this.operationsPostUpdateCustomer();
      });
    }
  }

  showWarningDialogPopup(msg: string) {
    this.warningDialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      height: 'auto',
      disableClose: true,
      data: {
        isCopyErrorMsg: false,
        isCancelConfirm: true,
        message: msg
      }
    });
    return this.warningDialogRef;
  }

  clear(form: NgForm) {
    this.isCheckBoxSelectedOrUnselected = false;
    if (form.dirty) {
      form.form.markAsPristine();
    }
    if (this.isNew)
      this.changeSearchSelection(form, true);
    else
      this.changeSearchSelection(form, false);
  }

  back(form: NgForm) {
    if (form && form.form.dirty && this.formIsModified) {
      this.confirmationMessage(form, "back");
    } else {
      this.backButtonRedirect();
    }
  }

  backButtonRedirect() {
    if (this.displayGrid) {
      this.displayGrid = false;
      this.form.form.markAsPristine();
    }
    else {
      // redirect to home page
      this.router.navigate(["/search"]);
    }
    this.location.replaceState('/customer-name-map');
    this.clearFields();
    this.validUpdateCustomerName = true;
    this.isvalidCustomer = false;
    this.disableCustomerId = true;
    this.disabledCustomerId = '#e9ecef';
    if (!this.isNew) {
      this.disableAccountNumber = true;
      $('#searchCustomer').val('');
      $('#searchCustomerByName').val('');
    }
    else {
      this.searchCustomer = null;
      this.searchCustomerByName = null;
      $('#searchCustomer').val('');
      $('#searchCustomerByName').val('');
    }
  }

  // Show confirmation message if form dirty
  confirmationMessage(form: NgForm, actionType: string, cutomer: any = null) {
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
          this.validUpdateCustomerName = true;
          this.isvalidCustomer = false;
          this.disableCustomerId = true;
          this.disabledCustomerId = '#e9ecef';
          if (!this.isNew)
            this.disableAccountNumber = true;
          form.form.markAsPristine();
          if (actionType === "back") {
            this.backButtonRedirect();
          }
          if (actionType === 'selectCustomer') {
            this.selectedCustomer = new CustomerAccount();
          }
          if (actionType === 'anotherNameSelected') {
            this.userSearchedValues = [];
            this.customerMasterAccountsDTO = [];
            this.customerAccounts = [];
            this.displayGrid = false;
            this.formIsModified = false;
            this.getAccountsForSearchedValue(cutomer, this.searchByType);
          }
        } else {
          if (this.isNew)
            this.searchCustomer = this.selectedCustomer;
          else
            this.searchCustomerByName = this.selectedCustomer;
          form.form.markAsDirty();
        }
      },
      error => { }
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  checkUncheckAll(masterAccount: string, isCheckMasterCheckbox: boolean, form: NgForm, customerId: any) {
    form.form.markAsDirty();
    this.modifiedCustomerIdsToDisplay.push(customerId);
    this.formIsModified = true;
    this.isCheckBoxSelectedOrUnselected = false;
    for (var i = 0; i < this.customerMasterAccountsDTO.length; i++) {
      if (this.customerMasterAccountsDTO[i].masterAccount == masterAccount) {
        let currentMasterMainAccountsDto;
        currentMasterMainAccountsDto = this.customerMasterAccountsDTO[i].mainAccounts;
        if (isCheckMasterCheckbox) {
          this.customerMasterAccountsDTO[i].isCheckMasterCheckbox = true;
          currentMasterMainAccountsDto.forEach(x => x.isChecked = true);

        }
        else {
          this.isTableCheckbox = false;
          if (this.customerMasterAccountsDTO[i].masterAccount == masterAccount) {
            this.customerMasterAccountsDTO[i].isCheckMasterCheckbox = false;

            currentMasterMainAccountsDto.forEach(x => x.isChecked = false);

          }
          this.customerMasterAccountsDTO[i].mainAccounts = currentMasterMainAccountsDto;
        }

      }
    }
    //Check/Uncheck header all check box
    let isAnyCheckBoxUnSelected = this.customerMasterAccountsDTO.find(x => x.isCheckMasterCheckbox == false && x.isShowMasterCheckbox == true);
    if (isCheckMasterCheckbox && !isAnyCheckBoxUnSelected)
      this.isTableCheckbox = true;
  }

  isCheckMasterAccount(form: NgForm, masterAccount: string, customerId: string, childAccountId: string, isChildAccountCheckbox: boolean) {
    form.form.markAsDirty();
    this.modifiedCustomerIdsToDisplay.push(customerId);
    this.isCheckBoxSelectedOrUnselected = false;
    this.formIsModified = true;
    for (var i = 0; i < this.customerMasterAccountsDTO.length; i++) {
      if (isChildAccountCheckbox) {
        if (this.customerMasterAccountsDTO[i].masterAccount == masterAccount) {
          this.customerMasterAccountsDTO[i].isCheckMasterCheckbox = false;
          let checkedIds = [];
          var data = this.customerMasterAccountsDTO[i].mainAccounts.filter(x => {
            if (x.isChecked || !x.isShowCheckBox)
              checkedIds.push(x.accountNumber);
          });

          if (this.customerMasterAccountsDTO[i].mainAccounts.length == checkedIds.length)
            this.customerMasterAccountsDTO[i].isCheckMasterCheckbox = true;
          else
            this.customerMasterAccountsDTO[i].isCheckMasterCheckbox = false;
        }
      }
      else {
        this.isTableCheckbox = false;
        this.selectedCustomerIds = this.selectedCustomerIds.filter(item => item !== customerId);
        this.selectedIds = this.selectedIds.filter(item => item !== childAccountId);
        if (this.customerMasterAccountsDTO[i].masterAccount == masterAccount) {
          this.customerMasterAccountsDTO[i].isCheckMasterCheckbox = false;
        }
      }
    }

    //Check/Uncheck header all check box
    let isAnyCheckBoxUnSelected = this.customerMasterAccountsDTO.find(x => x.isCheckMasterCheckbox == false && x.isShowMasterCheckbox == true);
    if (isChildAccountCheckbox && !isAnyCheckBoxUnSelected)
      this.isTableCheckbox = true;
  }

  getMainAccounts(mainAccounts: any) {
    this.uniqueMainAccount = [];
    mainAccounts
      .forEach(element => {
        if (!this.uniqueMainAccount.find(x => x.accountName == element.accountName
          && x.accountNumber == element.accountNumber
          && x.customerName == element.customerName)) {
          this.uniqueMainAccount.push(element);
        }
      });
    return _.sortBy(this.uniqueMainAccount);
  }

  getModifiedAccounts(customerMasterAccountsDTO: CustomerMasterAccountDTO[]) {
    // this.modifiedCustomerIds = [];
    this.selectedIds = [];
    this.selectedCustomerIds = [];
    this.customerMasterAccountsDTO.forEach(element => {
      if (element.mainAccounts != null) {
        //Add Selected customer Ids
        if (!this.selectedCustomerIds.find(y => y == element.customerId)
          && element.mainAccounts.find(z => z.isChecked == true)) {
          this.selectedCustomerIds.push(element.customerId);
        }
        //Add selected Account's IDs
        if(this.institutionId == this.jbInstitutionId){
          if(this.selectedCustomerIds.find(y => y == element.customerId))
            this.selectedIds.push(element.id);
        }
          else{
            element.mainAccounts.forEach(x => {
              if (x.isChecked) {
                if (!this.selectedIds.find(y => y == x.id))
                  this.selectedIds.push(x.id);
              }
            })
          }
      }
    });
    //console.log("existing Customer Ids", this.selectedIds);
    return this.selectedIds;
  }

  checkUnCheckAllCheckboxes(form: NgForm, isTableCheckbox: boolean) {
    form.form.markAsDirty();
    this.formIsModified = true;
    this.isCheckBoxSelectedOrUnselected = false;
    for (var i = 0; i < this.customerMasterAccountsDTO.length; i++) {
      let currentMasterMainAccountsDto;
      currentMasterMainAccountsDto = this.customerMasterAccountsDTO[i].mainAccounts;
      if (isTableCheckbox) {
        this.customerMasterAccountsDTO[i].isCheckMasterCheckbox = true;
        currentMasterMainAccountsDto.forEach(x => x.isChecked = true);

      }
      else {
        this.customerMasterAccountsDTO[i].isCheckMasterCheckbox = false;
        currentMasterMainAccountsDto.forEach(x => x.isChecked = false);
      }
      this.customerMasterAccountsDTO[i].mainAccounts = currentMasterMainAccountsDto;
    }
    if (isTableCheckbox) {
      this.modifiedCustomerIdsToDisplay = [];
      if (this.customerMasterAccountsDTO.length > 0) {
        this.customerMasterAccountsDTO.forEach(x => {
          this.modifiedCustomerIdsToDisplay.push(x.customerId);
        });
      }
    }
    else {
      this.modifiedCustomerIdsToDisplay = [];
    }
  }
}

