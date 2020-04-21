import { Component, OnInit, ViewChild, QueryList, ViewChildren } from "@angular/core";
import { ClslabelconfigurationService } from "./clslabelconfiguration.service";
import { CLSCustomerLabelConfigurationDTO } from "../_dtos/btcat.customer.vm.dtos";
import {
  CLSCustomerLabelConfiguration,
  LabelFontFamily,
  LabelFontWeight,
  LabelFontAlignment,
  LabelFontSize,
  BarCodeSymbology,
  CustomerAccount,
  OrderDisplay,
  LabelConfiguration,
  Customers
} from "../shared/customer";
import { Title } from "@angular/platform-browser";
import { SpinnerService } from "src/app/shared/interceptor/spinner.service";
import { Customer } from "../shared/customer";
import { isObject } from "util";
import { NgForm, FormControl } from "@angular/forms";
import { CustomerFilterPipe } from "src/app/customer-filter-pipe.pipe";
import { MatDialog, MatAutocompleteTrigger, AUTOCOMPLETE_PANEL_HEIGHT, _countGroupLabelsBeforeOption, _getOptionScrollPosition } from "@angular/material";
import { ConfirmationDialogComponent } from "src/app/components/shared/confirmation-dialog/confirmation-dialog.component";
import { Location } from "@angular/common";
import { Router, ActivatedRoute } from "@angular/router";
import { SubSink } from "subsink";
import { FormCanDeactivate } from "src/app/can-deactivate/form-can-deactivate";
import { AuthenticationService } from "src/app/security/authentication.service";
import { DropResult } from "smooth-dnd";
import * as _ from "lodash";
import { CustomerService } from '../shared/services/customer.service';
import { Constants } from 'src/app/constants/constants';
import { CommonService } from 'src/app/shared/service/common.service';
declare var $: any;

@Component({
  selector: "app-cls-label-configuration",
  templateUrl: "./cls-label-configuration.component.html"
})
export class ClsLabelConfigurationComponent extends FormCanDeactivate
  implements OnInit {
  // Search Split Issue fix
  CWidowHeight: number;
  CHeaderHeight: number;
  CNavHeight: number;
  HeaderHeight: number;
  NewHeight: number;
  CSearchHeight: number;
  CompareBtn: number;

  @ViewChild("form") form: NgForm;

  lCustomers: CustomerAccount[] = [];
  lCustomerWithOutDuplicates: CustomerAccount[] = [];
  fontSizes: Array<LabelFontSize> = [];
  searchCustomer: any;
  loadControlsScreen: boolean = false;
  myControl = new FormControl();
  private subs = new SubSink();
  disableTag: boolean = true;
  lBiblograpicOrderedDisplay: OrderDisplay[] = [];
  lAlpha1OrderedDisplay: OrderDisplay[] = [];
  lAlpha2OrderedDisplay: OrderDisplay[] = [];
  lGenreOrderedDisplay: OrderDisplay[] = [];
  lMiscOrderedDisplay: OrderDisplay[] = [];
  lLibraryNameOrderedDisplay: OrderDisplay[] = [];
  selectedIndexForOrderDisplay: number = undefined;
  labelFontChanged: boolean = false;
  bibolographicLabel: string = "Bibliographic";
  alpha1Label: string = "Alpha 1";
  alpha2Label: string = "Alpha 2";
  genreLabel: string = "Genre";
  miscLabel: string = "Misc.";
  libraryNameLabel: string = "Library Name";
  space: string = " (space)";
  insert: string = "insert";
  delete: string = "delete";
  barCode949TagError: boolean = false;
  barCode949TagToolTip: string = "";
  displayWarnMessage: boolean = false;
  isIEOrEdgeBrowser: boolean = false;
  customerNameFromMapping: string = '';
  barCodeCommentToolTip: string = "";
  barcodeCommentRequired: boolean = false;
  previousCustomer: any;
  selectedCustomer: any;
  selectedCustomerForRedirect: any;
  institutes: any[] = [];
  institutionId: string ='';
  defaultInstituteId: string = '';

  fontFamilys: LabelFontFamily[] = [
    { key: "Arial", name: "Arial" },
    { key: "Arial CE", name: "Arial CE" },
    { key: "Arial Narrow", name: "Arial Narrow" },
    { key: "Courier New", name: "Courier New" },
    { key: "Lucida Console", name: "Lucida Console" },
    { key: "Tahoma", name: "Tahoma" },
    { key: "Times New Roman", name: "Times New Roman" }
  ];

  fontWeights: LabelFontWeight[] = [
    { key: "Normal", name: "Normal" },
    { key: "Normal Bold", name: "Normal Bold" },
    { key: "Italicized", name: "Italicized" },
    { key: "Italicized Bold", name: "Italicized Bold" }
  ];
  fontAlignments: LabelFontAlignment[] = [
    { key: "Centered", name: "Centered" },
    { key: "Left Justified", name: "Left Justified" }
  ];
  barCodeSymbologies: BarCodeSymbology[] = [
    { key: "Code39", name: "Code39" },
    { key: "Codabar", name: "Codabar" },
    { key: "I2of5", name: "I 2 of 5" },
    { key: "128", name: "128" }
  ];

  private clsCustomerLabelConfigurationDto: CLSCustomerLabelConfigurationDTO;
  existingCustomers: Customers[];
  clsCustomerMasterData: CLSCustomerLabelConfigurationDTO;


  constructor(
    private clslabelconfigurationService: ClslabelconfigurationService,
    private _titleService: Title,
    private spinnerService: SpinnerService,
    private dialog: MatDialog,
    private router: Router,
    private authenticationService: AuthenticationService,
    private location: Location,
    private route: ActivatedRoute,
    private cutomerService: CustomerService,
    private commonService: CommonService
  ) {
    super(router, authenticationService);

    Array(39)
      .fill(0)
      .map((x, i) => {
        if (i >= 7) {
          this.fontSizes.push({ key: i + 1, name: i + 1 });
        }
      });
  }

  @ViewChildren(MatAutocompleteTrigger, { read: MatAutocompleteTrigger }) matAutocompleteTrigger: QueryList<MatAutocompleteTrigger>;

  ngOnInit() {
    // Set the title
    this._titleService.setTitle("BTCAT | CLS Label Configuration");
    this.barcodeCommentRequired = false;
    this.barCode949TagError = false;
    // Start spninner here
    this.spinnerService.spinnerStart();    

    this.commonService.getActiveInstitutions().subscribe(result =>{
      if(result){
        this.institutes = result;
        this.route.params.subscribe(params => {
          if (params['id']){
            this.customerNameFromMapping = params.id; // name from Customer mapping screen
          }
          if(params['instituteId']){
            this.institutionId = params['instituteId'];
          }     
        });
        if(!this.institutionId){
          this.institutionId = this.institutes.find(x=>x.displayName == 'B&T').id;
          this.defaultInstituteId = this.institutionId;
        }        
        this.getCustomersByInstitute(this.institutionId);
      }
    },
      (error) => {
        console.log(error);
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

  goToCustomerConfiguration() {
    let customerId = ''
    if (this.selectedCustomerForRedirect && this.selectedCustomerForRedirect.id)
      customerId = this.selectedCustomerForRedirect.id;     
    this.router.navigate(["/cls-configuration", customerId, this.institutionId]);
  }

  onInstitutionTypeChange(form: NgForm) {
    this.selectedCustomerForRedirect = null;
    this.loadControlsScreen = false;
    this.selectedIndexForOrderDisplay = undefined;
    this.lBiblograpicOrderedDisplay = [];
    this.lAlpha1OrderedDisplay = [];
    this.lAlpha2OrderedDisplay = [];
    this.lGenreOrderedDisplay = [];
    this.lMiscOrderedDisplay = [];
    this.lLibraryNameOrderedDisplay = [];
    this.displayWarnMessage = false;
    this.searchCustomer = "";
    this.form.form.markAsPristine();
    this.location.replaceState('/cls-label-configuration');
    this.getCustomersByInstitute(this.institutionId);
  }

  //This method is used to get the saved customer collection
  getCustomersByInstitute(institutionType: string) {
    this.spinnerService.spinnerStart();
    this.subs.sink = this.cutomerService.getCustomersByInstitution(institutionType).subscribe((item: Customers[]) => {
      this.existingCustomers = item;
      this.spinnerService.spinnerStop();

      //Load selected customer from Name mapping screen   
      if (this.customerNameFromMapping) {
        // this.searchCustomer = this.customerNameFromMapping;
        let customerData = this.existingCustomers.find(x => x.id == this.customerNameFromMapping);
        if (customerData) {
          this.searchCustomer = customerData.customerName;
          this.getLabelConfigForSelectedCustomer(customerData, this.form);
          this.searchCustomer = customerData;
        }
      }
    },
      (error) => {
        console.log(error);
        this.spinnerService.spinnerStop();
      }
    );
  }

  customerNameEntered(enteredText: string, myForm: NgForm) {

    if (!enteredText) {
      if (myForm.dirty) {
        myForm.form.markAsPristine();
      }
      this.loadControlsScreen = false;
      this.selectedIndexForOrderDisplay = undefined;
      this.lBiblograpicOrderedDisplay = [];
      this.lAlpha1OrderedDisplay = [];
      this.lAlpha2OrderedDisplay = [];
      this.lGenreOrderedDisplay = [];
      this.lMiscOrderedDisplay = [];
      this.lLibraryNameOrderedDisplay = [];
      this.displayWarnMessage = false;
      this.selectedCustomerForRedirect = null;
    }
  }

  displayFn(customer: any): string {
    let customerDisplayName = "";
    if (customer && customer.customerName) {
      customerDisplayName = customer.customerName;
    } else {
      customerDisplayName = customer ? customer.customerId : "";
    }
    return customerDisplayName;
  }

  findCustomer() {
    if (
      this.searchCustomer != undefined &&
      this.searchCustomer != "" &&
      this.searchCustomer != "Customer not found"
    ) {

      if (!isObject(this.searchCustomer)) {
        let findCustomer = this.existingCustomers.find(x => {
          if (x.customerName) {
            let customerName = x.customerName;
            return (
              customerName.toLowerCase() === this.searchCustomer.toLowerCase()
            );
          }
        });
        if (findCustomer != undefined) {
          this.loadControlsScreen = true;
          return true;
        } else {
          this.loadControlsScreen = false;
          this.displayWarnMessage = false;
          return false;
        }
      }

    }
  }

  getLabelConfigForSelectedCustomer(selectedUser: any, myForm: NgForm) {
    this.selectedCustomerForRedirect = selectedUser;
    if (myForm && myForm.form.dirty) {
      this.selectedCustomer = selectedUser;
      this.confirmationMessage(myForm, 'selectcustomer');
    }
    else {
      this.spinnerService.spinnerStart();
      this.previousCustomer = selectedUser;
      this.displayWarnMessage = false;
      this.barCode949TagToolTip = "";
      this.barCode949TagError = false;
      this.barcodeCommentRequired = false;
      this.clslabelconfigurationService
        .getCLSustomerLabelConfiguartionDetailById(selectedUser.id)
        .subscribe(
          item => {
            if (myForm.dirty) {
              myForm.form.markAsPristine();
            }
            this.lBiblograpicOrderedDisplay = [];
            this.lAlpha1OrderedDisplay = [];
            this.lAlpha2OrderedDisplay = [];
            this.lGenreOrderedDisplay = [];
            this.lMiscOrderedDisplay = [];
            this.lLibraryNameOrderedDisplay = [];
            this.selectedIndexForOrderDisplay = undefined;
            this.loadControlsScreen = true;
            let actor = '';
            if (localStorage.getItem(Constants.LocalStorage.ACTOR) !== null &&
              localStorage.getItem(Constants.LocalStorage.ACTOR) !== "") {
              actor = localStorage.getItem(Constants.LocalStorage.ACTOR);
            }
            if (item.customerId == null )  {
              let clsCustomerLabelDefaultConfiguration = JSON.parse(
                localStorage.getItem("CLSCustomerLabelDefaultConfiguration")
              );
              clsCustomerLabelDefaultConfiguration.Id = null;
              clsCustomerLabelDefaultConfiguration.customerId =
                selectedUser.id;
              clsCustomerLabelDefaultConfiguration.customerName =
                selectedUser.customerName;
              clsCustomerLabelDefaultConfiguration.createdBy = actor.toLowerCase();
              clsCustomerLabelDefaultConfiguration.lastModifiedBy = actor.toLowerCase();
              this.clsCustomerLabelConfigurationDto = this.transform(
                clsCustomerLabelDefaultConfiguration
              );
              this.clsCustomerLabelConfigurationDto.barcodeSymbology = "Code39";
              this.clsCustomerLabelConfigurationDto.displayHumanReadableCheckDigit = true;

              this.clsCustomerMasterData =  this.clsCustomerLabelConfigurationDto;
              this.spinnerService.spinnerStop();
            } else {
              item.createdBy = actor.toLowerCase();
              item.lastModifiedBy = actor.toLowerCase();
              this.clsCustomerLabelConfigurationDto = this.transform(item);

              if(this.clsCustomerLabelConfigurationDto.labelConfigurations[0].fontConfiguration == null){
                  
                  let clsCustomerLabelDefaultConfiguration = JSON.parse(
                    localStorage.getItem("CLSCustomerLabelDefaultConfiguration")
                  );

                  this.clsCustomerMasterData = this.transform(
                                  clsCustomerLabelDefaultConfiguration
                                );

                  for(let i = 0; i< this.clsCustomerMasterData.labelConfigurations.length;i++){
                    this.clsCustomerLabelConfigurationDto
                    .labelConfigurations[i].fontConfiguration = this.clsCustomerMasterData
                    .labelConfigurations[i].fontConfiguration;
                  }

              }
                            
                let biblograpic = this.clsCustomerLabelConfigurationDto
                .labelConfigurations[0];

              if (biblograpic && biblograpic.orderDisplayFields) {
                this.lBiblograpicOrderedDisplay = biblograpic.orderDisplayFields;
              }

              let alpha1 = this.clsCustomerLabelConfigurationDto
                .labelConfigurations[1];
              if (alpha1 && alpha1.orderDisplayFields) {
                this.lAlpha1OrderedDisplay = alpha1.orderDisplayFields;
              }

              let alpha2 = this.clsCustomerLabelConfigurationDto
                .labelConfigurations[2];
              if (alpha2 && alpha2.orderDisplayFields) {
                this.lAlpha2OrderedDisplay = alpha2.orderDisplayFields;
              }

              let genre = this.clsCustomerLabelConfigurationDto
                .labelConfigurations[3];
              if (genre && genre.orderDisplayFields) {
                this.lGenreOrderedDisplay = genre.orderDisplayFields;
              }

              let misc = this.clsCustomerLabelConfigurationDto
                .labelConfigurations[4];
              if (misc && misc.orderDisplayFields) {
                this.lMiscOrderedDisplay = misc.orderDisplayFields;
              }

              let libraryName = this.clsCustomerLabelConfigurationDto
                .labelConfigurations[5];
              if (libraryName && libraryName.orderDisplayFields) {
                this.lLibraryNameOrderedDisplay = libraryName.orderDisplayFields;
              }

              this.spinnerService.spinnerStop();
            }
          },
          err => {
            this.spinnerService.spinnerStop();
          }
        );
    }
  }

  public transform(
    item: CLSCustomerLabelConfiguration
  ): CLSCustomerLabelConfigurationDTO {
    return CLSCustomerLabelConfigurationDTO.fromSource(item);
  }

  labelAttributeFontSizeIsChanged(
    myForm: NgForm,
  ) {
    myForm.form.markAsDirty();
    this.labelFontChanged = true;
  }

  validateOrderDisplayListWithMaxLength(item: any) {
    let maxLength = this.getMaxLines(item);
    if (
      item.labelType == this.bibolographicLabel &&
      this.lBiblograpicOrderedDisplay.length > maxLength
    ) {
      return true;
    } else if (
      item.labelType == this.alpha1Label &&
      this.lAlpha1OrderedDisplay.length > maxLength
    ) {
      return true;
    } else if (
      item.labelType == this.alpha2Label &&
      this.lAlpha2OrderedDisplay.length > maxLength
    ) {
      return true;
    } else if (
      item.labelType == this.genreLabel &&
      this.lGenreOrderedDisplay.length > maxLength
    ) {
      return true;
    } else if (
      item.labelType == this.miscLabel &&
      this.lMiscOrderedDisplay.length > maxLength
    ) {
      return true;
    }
    else {
      return false;
    }
  }

  validateTag(fieldItem: any, item: any, index: any) {
    let findIndex = item.findIndex(x => x.displayName == fieldItem.displayName);
    if ((fieldItem.isChecked || !fieldItem.isChecked) && fieldItem.tag != "") {
      // Check for spl characters
      let regex = new RegExp('[0-9]', 'g');
      let validData = fieldItem.tag.match(regex);
      let fieldValueLength = fieldItem.tag.toString().length;
      if (validData && validData.length !== fieldValueLength && findIndex === index) {
        return true
      }
      else if (validData == null && findIndex === index) {
        return true;
      }
      else {
        let lengthOnTag = fieldItem.tag.toString().length;
        if (lengthOnTag > 0 && lengthOnTag < 3 && findIndex === index) {
          return true;
        }
        else {
          return false;
        }
      }
    }
    else if (fieldItem.isChecked && fieldItem.tag == "") {
      return true;
    }
  }

  validateBarCodeComment(myForm: NgForm) {
    this.barCodeCommentToolTip = "";
    if (this.clsCustomerLabelConfigurationDto.barcodeComment.length == 0) {
      this.barcodeCommentRequired = true;
    }
    else {
      this.barcodeCommentRequired = false;
    }
  }

  enableDisableSave() {
    var barcodeCommentLength = this.clsCustomerLabelConfigurationDto ? this.clsCustomerLabelConfigurationDto.barcodeComment.length : 0;
    var tag949subfieldLength = this.clsCustomerLabelConfigurationDto ? this.clsCustomerLabelConfigurationDto.barcodeSubFieldIn949.length : 0;
    return !this.loadControlsScreen || barcodeCommentLength == 0 || tag949subfieldLength == 0;
  }

  validateBarCodeSubField949Tag(myForm: NgForm, enteredValue: any) {
    myForm.form.markAsDirty();
    let regex = new RegExp('[a-z0-9]', 'g');
    let onlyLowerAlphaNumeric = enteredValue.match(regex);
    if (onlyLowerAlphaNumeric && onlyLowerAlphaNumeric.length > 0) {
      this.barCode949TagError = false;
      this.barCode949TagToolTip = "";
    }
    else {
      if (enteredValue.length == 0) {
        this.barCode949TagError = true;
        this.barCode949TagToolTip = "Required";
      }
      else if (enteredValue != "") {
        this.barCode949TagError = true;
        this.barCode949TagToolTip = "Invalid field";
      }
      else {
        this.barCode949TagError = false;
        this.barCode949TagToolTip = "";
      }
    }
  }

  validateField(fieldItem: any, labelFields: any, index: any) {
    let regex = new RegExp('[a-z0-9]', 'g');
    let fieldIndex = labelFields.findIndex(x => x.displayName == fieldItem.displayName);
    if(fieldItem.subField == null){
      fieldItem.subField = "";
    }
    let eliminateDuplicates = fieldItem.subField.replace(/(.)(?=.*\1)/g, "");
    let validData = eliminateDuplicates.match(regex);
    let fieldValueLength = fieldItem.subField.toString().length;
    if ((fieldItem.isChecked || !fieldItem.isChecked) && fieldItem.subField != "") {
      if (validData && validData.length !== fieldValueLength && fieldIndex === index) {
        return true;
      }
      else if (validData == null && fieldIndex === index) {
        return true;
      }
      else {
        false;
      }
    }
    else if (fieldItem.isChecked && fieldItem.subField == "") {
      return true;
    }
  }

  chcekBoxSelected(myForm: NgForm, field: any, item: any) {
    myForm.form.markAsDirty();
    this.selectedIndexForOrderDisplay = undefined;
    const isIEOrEdgeBrowser = /msie\s|trident\/|edge\//i.test(window.navigator.userAgent);

    if (item.labelType == this.bibolographicLabel) {
      this.lBiblograpicOrderedDisplay = this.addOrRemoveInOrderDisplayList(isIEOrEdgeBrowser, field, this.lBiblograpicOrderedDisplay);
      this.lBiblograpicOrderedDisplay = this.reOrderDisplayOrders(
        this.lBiblograpicOrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[0].orderDisplayFields = this.lBiblograpicOrderedDisplay;
    } else if (item.labelType == this.alpha1Label) {
      this.lAlpha1OrderedDisplay = this.addOrRemoveInOrderDisplayList(isIEOrEdgeBrowser, field, this.lAlpha1OrderedDisplay);
      this.lAlpha1OrderedDisplay = this.reOrderDisplayOrders(
        this.lAlpha1OrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[1].orderDisplayFields = this.lAlpha1OrderedDisplay;
    } else if (item.labelType == this.alpha2Label) {
      this.lAlpha2OrderedDisplay = this.addOrRemoveInOrderDisplayList(isIEOrEdgeBrowser, field, this.lAlpha2OrderedDisplay);
      this.lAlpha2OrderedDisplay = this.reOrderDisplayOrders(
        this.lAlpha2OrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[2].orderDisplayFields = this.lAlpha2OrderedDisplay;
    } else if (item.labelType == this.genreLabel) {
      this.lGenreOrderedDisplay = this.addOrRemoveInOrderDisplayList(isIEOrEdgeBrowser, field, this.lGenreOrderedDisplay);
      this.lGenreOrderedDisplay = this.reOrderDisplayOrders(
        this.lGenreOrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[3].orderDisplayFields = this.lGenreOrderedDisplay;
    } else if (item.labelType == this.miscLabel) {
      this.lMiscOrderedDisplay = this.addOrRemoveInOrderDisplayList(isIEOrEdgeBrowser, field, this.lMiscOrderedDisplay);
      this.lMiscOrderedDisplay = this.reOrderDisplayOrders(
        this.lMiscOrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[4].orderDisplayFields = this.lMiscOrderedDisplay;
    } else if (item.labelType == this.libraryNameLabel) {
      this.lLibraryNameOrderedDisplay = this.addOrRemoveInOrderDisplayList(isIEOrEdgeBrowser, field, this.lLibraryNameOrderedDisplay);
      this.lLibraryNameOrderedDisplay = this.reOrderDisplayOrders(
        this.lLibraryNameOrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[5].orderDisplayFields = this.lLibraryNameOrderedDisplay;
    }
  }

  addOrRemoveInOrderDisplayList(iEOrEdge: boolean, field: any, orderDisplayList: OrderDisplay[]) {
    let fieldItems = field;
    if (iEOrEdge) {
      // IE or Edge browser
      if (fieldItems.isChecked) {
        // Add item in to ordered list
        let orderedDisplay = new OrderDisplay();
        orderedDisplay.displayName = fieldItems.displayName;
        orderDisplayList.push(orderedDisplay);
      } else {
        // Remove item from ordered list
        let index = orderDisplayList.findIndex(
          x => x.displayName == fieldItems.displayName
        );
        orderDisplayList.splice(index, 1);
      }
    }
    else {
      // Chrome or Firefox browser
      if (!fieldItems.isChecked) {
        // Add item in to ordered list
        let orderedDisplay = new OrderDisplay();
        orderedDisplay.displayName = fieldItems.displayName;
        orderDisplayList.push(orderedDisplay);
      } else {
        // Remove item from ordered list
        let index = orderDisplayList.findIndex(
          x => x.displayName == fieldItems.displayName
        );
        orderDisplayList.splice(index, 1);
      }
    }

    return orderDisplayList;
  }

  reOrderDisplayOrders(displayOrderList: OrderDisplay[]) {
    let length = true;
    let lTempOrderDisplay = [];
    // Reorder the display order number
    displayOrderList.forEach(x => {
      if (length) {
        x.displayOrder = 0;
        length = false;
        lTempOrderDisplay.push(x);
      } else {
        if (lTempOrderDisplay.length !== displayOrderList.length) {
          let nextLength = lTempOrderDisplay.length;
          x.displayOrder = nextLength;
          lTempOrderDisplay.push(x);
        }
      }
    });
    return lTempOrderDisplay;
  }

  disableCheckBox(field: any, item: any) {
    let maxLength = this.getMaxLines(item);
    if (item.labelType == this.bibolographicLabel &&
      this.lBiblograpicOrderedDisplay &&
      this.lBiblograpicOrderedDisplay.length >= maxLength
    ) {
      // if (!(this.lBiblograpicOrderedDisplay.find(
      //   x => x.displayName.toLowerCase() == field.displayName.toLowerCase()
      // ))) {
      //   return true;
      // }
    } else if (item.labelType == this.alpha1Label &&
      this.lAlpha1OrderedDisplay &&
      this.lAlpha1OrderedDisplay.length >= maxLength
    ) {
      if (!(this.lAlpha1OrderedDisplay.find(
        x => x.displayName.toLowerCase() == field.displayName.toLowerCase()
      ))) {
        return true;
      }
    } else if (item.labelType == this.alpha2Label &&
      this.lAlpha2OrderedDisplay &&
      this.lAlpha2OrderedDisplay.length >= maxLength
    ) {
      if (!(this.lAlpha2OrderedDisplay.find(
        x => x.displayName.toLowerCase() == field.displayName.toLowerCase()
      ))) {
        return true;
      }
    } else if (item.labelType == this.genreLabel &&
      this.lGenreOrderedDisplay &&
      this.lGenreOrderedDisplay.length >= maxLength
    ) {
      if (!(this.lGenreOrderedDisplay.find(
        x => x.displayName.toLowerCase() == field.displayName.toLowerCase()
      ))) {
        return true;
      }
    } else if (item.labelType == this.miscLabel &&
      this.lMiscOrderedDisplay &&
      this.lMiscOrderedDisplay.length >= maxLength
    ) {
      if (!(this.lMiscOrderedDisplay.find(
        x => x.displayName.toLowerCase() == field.displayName.toLowerCase()
      ))) {
        return true;
      }
    }
  }

  disableInsertDeleteButton(item: any, typeOfButton) {
    let maxLength = this.getMaxLines(item);
    if (item.labelType == this.bibolographicLabel) {
      return this.disablingSpaceButtons(typeOfButton, this.lBiblograpicOrderedDisplay, maxLength);
    } else if (item.labelType == this.alpha1Label) {
      return this.disablingSpaceButtons(typeOfButton, this.lAlpha1OrderedDisplay, maxLength);
    } else if (item.labelType == this.alpha2Label) {
      return this.disablingSpaceButtons(typeOfButton, this.lAlpha2OrderedDisplay, maxLength);
    } else if (item.labelType == this.genreLabel) {
      return this.disablingSpaceButtons(typeOfButton, this.lGenreOrderedDisplay, maxLength);
    } else if (item.labelType == this.miscLabel) {
      return this.disablingSpaceButtons(typeOfButton, this.lMiscOrderedDisplay, maxLength);
    }
  }

  disablingSpaceButtons(typeOfButton: any, orderDisplayList: OrderDisplay[], maxLength: any) {
    if (typeOfButton == this.insert) {
      if (
        orderDisplayList 
      ) {
        return true;
      } else {
        return false;
      }
    } else if (typeOfButton == this.delete) {
      if (orderDisplayList.length == 0) {
        return true;
      } else if (
        orderDisplayList 
      ) {
        let spaceExists = orderDisplayList.find(
          x => x.displayName == this.space
        );
        if (!spaceExists) {
          return true;
        } else {
          return false;
        }
      } else if (this.labelFontChanged) {
          let spaceExists = orderDisplayList.find(
            x => x.displayName == this.space
          );
          if (!spaceExists) {
            return true;
          } else {
            false;
          }
      }
    }
  }

  insertArrayAt(array, index, arrayToInsert) {
    Array.prototype.splice.apply(array, [index, 0].concat(arrayToInsert));
    return array;
  }

  insertSpaceButtonSelected(myForm: NgForm, item: any) {
    myForm.form.markAsDirty();
    let spaceObject = new OrderDisplay();
    spaceObject.displayName = this.space;

    if (item.labelType == this.bibolographicLabel) {
      this.lBiblograpicOrderedDisplay = this.insertSpace(
        this.lBiblograpicOrderedDisplay,
        spaceObject
      );
      this.lBiblograpicOrderedDisplay = this.reOrderDisplayOrders(
        this.lBiblograpicOrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[0].orderDisplayFields = this.lBiblograpicOrderedDisplay;
    } else if (item.labelType == this.alpha1Label) {
      this.lAlpha1OrderedDisplay = this.insertSpace(
        this.lAlpha1OrderedDisplay,
        spaceObject
      );
      this.lAlpha1OrderedDisplay = this.reOrderDisplayOrders(
        this.lAlpha1OrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[1].orderDisplayFields = this.lAlpha1OrderedDisplay;
    } else if (item.labelType == this.alpha2Label) {
      this.lAlpha2OrderedDisplay = this.insertSpace(
        this.lAlpha2OrderedDisplay,
        spaceObject
      );
      this.lAlpha2OrderedDisplay = this.reOrderDisplayOrders(
        this.lAlpha2OrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[2].orderDisplayFields = this.lAlpha2OrderedDisplay;
    } else if (item.labelType == this.genreLabel) {
      this.lGenreOrderedDisplay = this.insertSpace(
        this.lGenreOrderedDisplay,
        spaceObject
      );
      this.lGenreOrderedDisplay = this.reOrderDisplayOrders(
        this.lGenreOrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[3].orderDisplayFields = this.lGenreOrderedDisplay;
    } else if (item.labelType == this.miscLabel) {
      this.lMiscOrderedDisplay = this.insertSpace(
        this.lMiscOrderedDisplay,
        spaceObject
      );
      this.lMiscOrderedDisplay = this.reOrderDisplayOrders(
        this.lMiscOrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[4].orderDisplayFields = this.lMiscOrderedDisplay;
    } else if (item.labelType == this.libraryNameLabel) {
      this.lLibraryNameOrderedDisplay = this.insertSpace(
        this.lLibraryNameOrderedDisplay,
        spaceObject
      );
      this.lLibraryNameOrderedDisplay = this.reOrderDisplayOrders(
        this.lLibraryNameOrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[5].orderDisplayFields = this.lLibraryNameOrderedDisplay;
    }
  }

  insertSpace(orderDisplayList: OrderDisplay[], spaceObject: any) {
    if (this.selectedIndexForOrderDisplay != undefined) {
      orderDisplayList = this.insertArrayAt(
        orderDisplayList,
        this.selectedIndexForOrderDisplay,
        spaceObject
      );
      this.selectedIndexForOrderDisplay = undefined;
    } else {
      orderDisplayList.push(spaceObject);
    }
    return orderDisplayList;
  }

  deleteSpaceButtonSelected(myForm: NgForm, item: any) {
    myForm.form.markAsDirty();

    if (item.labelType == this.bibolographicLabel) {
      this.lBiblograpicOrderedDisplay = this.deleteSpace(
        this.lBiblograpicOrderedDisplay
      );
      this.lBiblograpicOrderedDisplay = this.reOrderDisplayOrders(
        this.lBiblograpicOrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[0].orderDisplayFields = this.lBiblograpicOrderedDisplay;
    } else if (item.labelType == this.alpha1Label) {
      this.lAlpha1OrderedDisplay = this.deleteSpace(this.lAlpha1OrderedDisplay);
      this.lAlpha1OrderedDisplay = this.reOrderDisplayOrders(
        this.lAlpha1OrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[1].orderDisplayFields = this.lAlpha1OrderedDisplay;
    } else if (item.labelType == this.alpha2Label) {
      this.lAlpha2OrderedDisplay = this.deleteSpace(this.lAlpha2OrderedDisplay);
      this.lAlpha2OrderedDisplay = this.reOrderDisplayOrders(
        this.lAlpha2OrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[2].orderDisplayFields = this.lAlpha2OrderedDisplay;
    } else if (item.labelType == this.genreLabel) {
      this.lGenreOrderedDisplay = this.deleteSpace(this.lGenreOrderedDisplay);
      this.lGenreOrderedDisplay = this.reOrderDisplayOrders(
        this.lGenreOrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[3].orderDisplayFields = this.lGenreOrderedDisplay;
    } else if (item.labelType == this.miscLabel) {
      this.lMiscOrderedDisplay = this.deleteSpace(this.lMiscOrderedDisplay);
      this.lMiscOrderedDisplay = this.reOrderDisplayOrders(
        this.lMiscOrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[4].orderDisplayFields = this.lMiscOrderedDisplay;
    } else if (item.labelType == this.libraryNameLabel) {
      this.lLibraryNameOrderedDisplay = this.deleteSpace(
        this.lLibraryNameOrderedDisplay
      );
      this.lLibraryNameOrderedDisplay = this.reOrderDisplayOrders(
        this.lLibraryNameOrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[5].orderDisplayFields = this.lLibraryNameOrderedDisplay;
    }
  }

  deleteSpace(orderDisplayList: OrderDisplay[]) {
    let index = orderDisplayList.findIndex(x => x.displayName == this.space);
    if (index !== -1) {
      orderDisplayList.splice(index, 1);
    }
    return orderDisplayList;
  }

  onDropColumn(myForm: NgForm, dropResult: DropResult, item: any) {

    myForm.form.markAsDirty();
    if (item.labelType == this.bibolographicLabel) {
      this.lBiblograpicOrderedDisplay = this.applyDrag(
        this.lBiblograpicOrderedDisplay,
        dropResult
      );
      this.lBiblograpicOrderedDisplay = this.reOrderDisplayOrders(
        this.lBiblograpicOrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[0].orderDisplayFields = this.lBiblograpicOrderedDisplay;
    } else if (item.labelType == this.alpha1Label) {
      this.lAlpha1OrderedDisplay = this.applyDrag(
        this.lAlpha1OrderedDisplay,
        dropResult
      );
      this.lAlpha1OrderedDisplay = this.reOrderDisplayOrders(
        this.lAlpha1OrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[1].orderDisplayFields = this.lAlpha1OrderedDisplay;
    } else if (item.labelType == this.alpha2Label) {
      this.lAlpha2OrderedDisplay = this.applyDrag(
        this.lAlpha2OrderedDisplay,
        dropResult
      );
      this.lAlpha2OrderedDisplay = this.reOrderDisplayOrders(
        this.lAlpha2OrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[2].orderDisplayFields = this.lAlpha2OrderedDisplay;
    } else if (item.labelType == this.genreLabel) {
      this.lGenreOrderedDisplay = this.applyDrag(
        this.lGenreOrderedDisplay,
        dropResult
      );
      this.lGenreOrderedDisplay = this.reOrderDisplayOrders(
        this.lGenreOrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[3].orderDisplayFields = this.lGenreOrderedDisplay;
    } else if (item.labelType == this.miscLabel) {
      this.lMiscOrderedDisplay = this.applyDrag(
        this.lMiscOrderedDisplay,
        dropResult
      );
      this.lMiscOrderedDisplay = this.reOrderDisplayOrders(
        this.lMiscOrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[4].orderDisplayFields = this.lMiscOrderedDisplay;
    } else if (item.labelType == this.libraryNameLabel) {
      this.lLibraryNameOrderedDisplay = this.applyDrag(
        this.lLibraryNameOrderedDisplay,
        dropResult
      );
      this.lLibraryNameOrderedDisplay = this.reOrderDisplayOrders(
        this.lLibraryNameOrderedDisplay
      );
      this.clsCustomerLabelConfigurationDto.labelConfigurations[5].orderDisplayFields = this.lLibraryNameOrderedDisplay;
    }
  }

  applyDrag = (arr, dragResult) => {
    const { removedIndex, addedIndex, payload } = dragResult;
    if (removedIndex === null && addedIndex === null) {
      return arr;
    }

    const result = [...arr];
    let itemToAdd = payload;

    if (removedIndex !== null) {
      itemToAdd = result.splice(removedIndex, 1)[0];
    }

    if (addedIndex !== null) {
      result.splice(addedIndex, 0, itemToAdd);
    }

    return result;
  };

  orderedDisplayItemSelected(myForm: NgForm, index: any) {
    this.selectedIndexForOrderDisplay = index;
  }

  getOrderDisplaySelectedBackGroundColor(index: any) {
    // if (
    //   this.selectedIndexForOrderDisplay != undefined &&
    //   this.selectedIndexForOrderDisplay == index
    // ) {
    //   return "#b6e2e9";
    // } else {
    //   return "#ffffff";
    // }
  }

  save(myForm: NgForm) {
    this.displayWarnMessage = false;

    const items = document.getElementsByClassName('border-danger');
    if (items.length > 0) {
      this.displayWarnMessage = true;
      this.clsCustomerLabelConfigurationDto = this.clsCustomerLabelConfigurationDto;
    }
    if (!this.displayWarnMessage) {
      this.barCode949TagToolTip = "";
      this.spinnerService.spinnerStart();

      //fontConfiguration is not required for each customer save
      for(let i = 0; i< this.clsCustomerLabelConfigurationDto
        .labelConfigurations.length;i++){
          let lFontSize = this.getfontSize(this.clsCustomerLabelConfigurationDto.labelConfigurations[i]);
          if(this.clsCustomerLabelConfigurationDto
          .labelConfigurations[i].labelPrintConfiguration.fontSize){            
            let isFontSizeExists = lFontSize.find(x=>x == this.clsCustomerLabelConfigurationDto
              .labelConfigurations[i].labelPrintConfiguration.fontSize)
            if(!isFontSizeExists){
              this.clsCustomerLabelConfigurationDto
              .labelConfigurations[i].labelPrintConfiguration.fontSize = lFontSize[0];
            }            
          }
          else{
            this.clsCustomerLabelConfigurationDto
              .labelConfigurations[i].labelPrintConfiguration.fontSize = lFontSize[0];
          }
          this.clsCustomerLabelConfigurationDto
          .labelConfigurations[i].fontConfiguration = null;
        }

      this.clslabelconfigurationService
        .saveClsCustomerLabelConfiguartion(
          this.clsCustomerLabelConfigurationDto
        )
        .subscribe(
          result => {
            myForm.form.markAsPristine();
            this.spinnerService.spinnerStop();
            if(this.clsCustomerLabelConfigurationDto.labelConfigurations[0].fontConfiguration == null){
                  
              let clsCustomerLabelDefaultConfiguration = JSON.parse(
                localStorage.getItem("CLSCustomerLabelDefaultConfiguration")
              );

              this.clsCustomerMasterData = this.transform(clsCustomerLabelDefaultConfiguration);

              for(let i = 0; i< this.clsCustomerMasterData.labelConfigurations.length;i++){
                this.clsCustomerLabelConfigurationDto
                .labelConfigurations[i].fontConfiguration = this.clsCustomerMasterData
                .labelConfigurations[i].fontConfiguration;
              }
          }
            const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
              width: "500px",
              height: "auto",
              disableClose: true,
              data: {
                isCopyErrorMsg: false,
                isCancelConfirm: false,
                message:
                  "The CLS label Configuration details for the Customer <b>" +
                  this.searchCustomer.customerName +
                  "</b> has been updated successfully."
              }
            });
            dialogRef.afterClosed().subscribe(() => {
              //this.searchCustomer = "";
              this.loadControlsScreen = true;
              if(this.currentCustomerId === this.clsCustomerLabelConfigurationDto.customerId){
                if(this.clsCustomerLabelConfigurationDto!= null && this.clsCustomerLabelConfigurationDto.barcodeSubFieldIn949!=null && this.clsCustomerLabelConfigurationDto.barcodeSubFieldIn949 != undefined && this.clsCustomerLabelConfigurationDto.barcodeSubFieldIn949 != "")
                    localStorage.setItem(Constants.LocalStorage.BARCODESUBFIELDIN949, this.clsCustomerLabelConfigurationDto.barcodeSubFieldIn949);
              }
            });
          },
          error => {
            if (error.status == 403) {
              this.spinnerService.spinnerStop();
              if (myForm.dirty) {
                myForm.form.markAsPristine();
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
  }

  // multiple marc view methods -- End
  ngAfterViewChecked() {
    /* search split fix function  */
    this.CustomHeightFunction();
    $(window).resize(e => {
      this.CustomHeightFunction();
    });
  }

  cancel(myForm: NgForm) {
    // Reset the form to initiatial stage
    // Before resetting the form, show the confirmation dialog for unsaved changes
    if (myForm.dirty) {
      myForm.form.markAsPristine();
    }
    this.barcodeCommentRequired = false;
    this.barCode949TagError = false;
    // this.searchCustomer = "";
    this.loadControlsScreen = false;
    this.displayWarnMessage = false;

    this.getLabelConfigForSelectedCustomer(this.searchCustomer, this.form);

    //Load when user navigated from Name mapping screen with selected customer
    // if (this.customerNameFromMapping && this.searchCustomer != this.customerNameFromMapping) {
    //   this.searchCustomer = this.customerNameFromMapping;
    //   let customerData = this.existingCustomers.find(x => x.customerName && x.customerName.toLowerCase() == this.customerNameFromMapping.toLowerCase());
    //   if (customerData) {
    //     this.getLabelConfigForSelectedCustomer(customerData, this.form);
    //     this.searchCustomer = customerData;
    //   }
    // }
  }

  back(myForm: NgForm) {

    if (myForm && myForm.form.dirty) {
      this.confirmationMessage(myForm, 'back');
    } else {
      this.backButtonRedirect();
    }
  }

  backButtonRedirect(){
    if(this.loadControlsScreen){
      this.selectedCustomerForRedirect = null;
      this.loadControlsScreen = false;
      this.selectedIndexForOrderDisplay = undefined;
      this.lBiblograpicOrderedDisplay = [];
      this.lAlpha1OrderedDisplay = [];
      this.lAlpha2OrderedDisplay = [];
      this.lGenreOrderedDisplay = [];
      this.lMiscOrderedDisplay = [];
      this.lLibraryNameOrderedDisplay = [];
      this.displayWarnMessage = false;
      this.searchCustomer = "";
      this.form.form.markAsPristine();
      this.institutionId = this.defaultInstituteId;
      this.institutionId = this.institutes.find(x=>x.displayName == 'B&T').id;
      this.getCustomersByInstitute(this.institutionId);
      this.location.replaceState('/cls-label-configuration');
    }
    else{
      // redirect to home page
      this.router.navigate(["/search"]);
    }
  }

  markAsDirtyField(myForm: NgForm) {
    myForm.form.markAsDirty();
  }

  // Show confirmation message if form dirty
  confirmationMessage(form: NgForm, actionType: string) {
    let dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: "500px",
      height: "auto",
      disableClose: true,
      data: {
        isCopyErrorMsg: false,
        isCancelConfirm: true,
        message:
          "There are unsaved changes. Are you sure you want to leave this page? "
      }
    });

    dialogRef.afterClosed().subscribe(
      result => {
        if (result) {
          form.form.markAsPristine();
          if (actionType == 'selectcustomer') {
            this.getLabelConfigForSelectedCustomer(this.selectedCustomer, this.form);
            this.searchCustomer = this.selectedCustomer;
          }
          else if (actionType == 'back') {
            this.backButtonRedirect();
          }
        }
        else {
          if (actionType == 'selectcustomer') {
            this.searchCustomer = this.previousCustomer;
          }
          else {
            form.form.markAsDirty();
          }
        }
      },
      error => { }
    );
  }

  //apply the dynamic Ids to the html input controls to make it work the according panels
  getlableTypeId(labelType) {
    if (labelType === this.bibolographicLabel) {
      return this.bibolographicLabel;
    } else if (labelType === this.alpha1Label) {
      return "Alpha1";
    } else if (labelType === this.alpha2Label) {
      return "Alpha2";
    } else if (labelType === this.genreLabel) {
      return "Genre";
    } else if (labelType === this.miscLabel) {
      return "Misc";
    } else if (labelType === this.libraryNameLabel) {
      return "LibraryName";
    }
  }

  getdisplayName(labelType, displayName) {
    labelType = this.getlableTypeId(labelType);

    if (displayName === "Call number") {
      return labelType + "callnumber";
    } else if (displayName === "Author") {
      return labelType + "Author";
    } else if (displayName === "Title:") {
      return labelType + "Title";
    } else if (displayName === "Branch code") {
      return labelType + "BranchCode";
    } else if (displayName === "Barcode") {
      return labelType + "Barcode";
    } else if (displayName === "Pub Year") {
      return labelType + "PubYear";
    } else if (displayName === "Price") {
      return labelType + "Price";
    } else if (displayName === "Misc1") {
      return labelType + "Misc1";
    } else if (displayName === "Misc2") {
      return labelType + "Misc2";
    } else if (displayName === "Misc3") {
      return labelType + "Misc3";
    } else if (displayName === "Misc4") {
      return labelType + "Misc4";
    } else if (displayName === "Misc. 1") {
      return labelType + "Misc.1";
    } else if (displayName === "Misc. 2") {
      return labelType + "Misc.2";
    }
  }

  getdisplayNameTag(labelType, displayName, tag) {
    labelType = this.getlableTypeId(labelType);
    if (displayName === "Call number") {
      return labelType + "callnumber" + tag;
    } else if (displayName === "Author") {
      return labelType + "Author" + tag;
    } else if (displayName === "Title") {
      return labelType + "Title" + tag;
    } else if (displayName === "Branch code") {
      return labelType + "BranchCode" + tag;
    } else if (displayName === "Barcode") {
      return labelType + "Barcode" + tag;
    } else if (displayName === "Pub Year") {
      return labelType + "PubYear" + tag;
    } else if (displayName === "Price") {
      return labelType + "Price" + tag;
    } else if (displayName === "Misc1") {
      return labelType + "Misc1" + tag;
    } else if (displayName === "Misc2") {
      return labelType + "Misc2" + tag;
    } else if (displayName === "Misc3") {
      return labelType + "Misc3" + tag;
    } else if (displayName === "Misc4") {
      return labelType + "Misc4" + tag;
    }
  }

  getdisplayNameSubField(labelType, displayName, tag, subField) {  
    
    labelType = this.getlableTypeId(labelType);
    if (displayName === "Call number") {
      return labelType + "callnumber" + tag + subField;
    } else if (displayName === "Author") {
      return labelType + "Author" + tag + subField;
    } else if (displayName === "Title") {
      return labelType + "Title" + tag + subField;
    } else if (displayName === "Branch code") {
      return labelType + "BranchCode" + tag + subField;
    } else if (displayName === "Barcode") {
      return labelType + "Barcode" + tag + subField;
    } else if (displayName === "Pub Year") {
      return labelType + "PubYear" + tag + subField;
    } else if (displayName === "Price") {
      return labelType + "Price" + tag + subField;
    } else if (displayName === "Misc1") {
      return labelType + "Misc1" + tag + subField;
    } else if (displayName === "Misc2") {
      return labelType + "Misc2" + tag + subField;
    } else if (displayName === "Misc3") {
      return labelType + "Misc3" + tag + subField;
    } else if (displayName === "Misc4") {
      return labelType + "Misc4" + tag + subField;
    }
  }

  getMaxLines(item) {
    if(item.fontConfiguration){
      let findItem1 = item.fontConfiguration.find(x => x.font === item.labelPrintConfiguration.font &&
        x.fontSize == item.labelPrintConfiguration.fontSize);
      if (findItem1) {
        return findItem1.maxLines;
      }
      else {
        let filterData = item.fontConfiguration.filter(x => x.font === item.labelPrintConfiguration.font);
        let orderData = _.orderBy(filterData, 'fontSize');
        let findItem2 = orderData.find(x => x.font === item.labelPrintConfiguration.font);
        if (findItem2) {
          return findItem2.maxLines;
        }
      }
    }    
  }

  getMaxChars(item) {
    if(item.fontConfiguration){
      var findItem1 = item.fontConfiguration.find(x => x.font === item.labelPrintConfiguration.font &&
        x.fontSize == item.labelPrintConfiguration.fontSize);
      if (findItem1) {
        return findItem1.maxChars;
      }
      else {
        let filterData = item.fontConfiguration.filter(x => x.font === item.labelPrintConfiguration.font);
        let orderData = _.orderBy(filterData, 'fontSize');
        let findItem2 = orderData.find(x => x.font === item.labelPrintConfiguration.font);
        if (findItem2) {
          return findItem2.maxChars;
        }
      }
    }    
  }

  getfontFamily(fontConfiguration) {
    let fonts = [];
    if(fontConfiguration){
      fontConfiguration.forEach(element => {
        if (!fonts.find(x => x === element.font)) {
          fonts.push(element.font);
        }
      });
    }
    return _.sortBy(fonts);
  }

  getfontSize(item: any) {
    let fonts = [];
    if(item.fontConfiguration){
    item.fontConfiguration
      .filter(x => x.font === item.labelPrintConfiguration.font)
      .forEach(element => {
        if (!fonts.find(x => x == element.fontSize)) {
          fonts.push(element.fontSize);
        }
      });
    }
    return _.sortBy(fonts);
  }
}
