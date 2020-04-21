import { Component, OnInit, ViewChild, ViewChildren, ElementRef } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SubSink } from 'subsink';
import { ActivatedRoute, Router } from '@angular/router';
import { ClsConfigurationService } from 'src/app/services/cls-configuration.service';
import { SpinnerService } from 'src/app/shared/interceptor/spinner.service';
import { CustomerAccount, SuffixConfiguration } from '../../shared/customer';
import { ConfirmationDialogComponent } from 'src/app/components/shared/confirmation-dialog/confirmation-dialog.component';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Guid } from "guid-typescript";
import { NgForm } from '@angular/forms';

declare var $: any;
@Component({
  selector: 'app-account-suffix-configuration',
  templateUrl: './account-suffix-configuration.component.html'
})
export class AccountSuffixConfigurationComponent implements OnInit {
  @ViewChild("form") myForm: NgForm;
  // @ViewChild('input') vc: ElementRef;
  // Search Split Issue fix
  CWidowHeight: number;
  CHeaderHeight: number;
  CNavHeight: number;
  HeaderHeight: number;
  NewHeight: number;
  CSearchHeight: number;
  CompareBtn: number;
  NewTableHeight: number;
  loadControlScreen: boolean;
  accountNumber: any;
  customerAccount: CustomerAccount;
  suffixConfiguration: SuffixConfiguration[];
  rowsCount: number;
  warningDialogRef: MatDialogRef<ConfirmationDialogComponent, any>;
  customerName: string;
  customerId: any;
  errorDisplayOnTop: boolean = false;
  institutionId: string ='';

  constructor(private route: ActivatedRoute,
    private _titleService: Title,
    private clsConfigurationService: ClsConfigurationService,
    private spinnerService: SpinnerService,
    private router: Router,
    private dialog: MatDialog) {

  }

  private subsink = new SubSink();

  ngOnInit() {

    this._titleService.setTitle('BTCAT | Suffix Configuration');
    this.subsink.sink = this.route.params.subscribe(params => {
      if (params['account']) {
        this.accountNumber = params['account'];
      }
      if (params['id']) {
        this.customerId = params['id'];
      }
      if(params['instituteId']){
        this.institutionId = params['instituteId'];
      }
    });

    this.getAccountNumberSuffixConfiguration();

  }

  getAccountNumberSuffixConfiguration() {
    if (this.myForm.form.dirty)
      this.myForm.form.markAsPristine();

    this.clsConfigurationService.getAccountNumberSuffixConfiguration(this.accountNumber).subscribe((item: CustomerAccount) => {
      this.loadControlScreen = true;

      if (item != null && item.id != null) {
        if (!item.suffixConfiguration || item.suffixConfiguration.length == 0) {
          item.suffixConfiguration = [];
          item.suffixConfiguration.push(new SuffixConfiguration());
          setTimeout(() => {
            let index = this.suffixConfiguration.length - 1;
            $('#newSuffix-' + index).focus();
          }, 10);
        }
        this.rowsCount = item.suffixConfiguration.length;
        this.suffixConfiguration = item.suffixConfiguration;
        this.customerAccount = item;
      }
     
      this.spinnerService.spinnerStop();
    },
      (error) => {
        console.log(error);
        this.spinnerService.spinnerStop();
      }
    );
  }

  onAddRow(form: NgForm) {
    if (this.suffixConfiguration.length < 10) {
      this.suffixConfiguration.push(new SuffixConfiguration());
      this.rowsCount = this.suffixConfiguration.length;
      setTimeout(() => {
        let index = this.suffixConfiguration.length - 1;
        $('#newSuffix-' + index).focus();
      }, 10);
      form.form.markAsDirty();
    }    
  }

  onRemoveRow(form: NgForm, index: number) {
    this.suffixConfiguration.splice(index, 1);
    this.rowsCount = this.suffixConfiguration.length;
    form.form.markAsDirty();
  }

  checkComnbineAts(index, target) {
    let test = target;
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
    this.NewTableHeight = this.NewHeight - 88;
  }

  // multiple marc view methods -- End
  ngAfterViewChecked() { 

   
    /* search split fix function  */
    this.CustomHeightFunction();
    $(window).resize(e => {
      this.CustomHeightFunction();
    });

    // this.Set_Element_Focus();
  }

  // Set_Element_Focus() {
  //     const element =  this.vc.nativeElement;
  //     if (element != null) {
  //       setTimeout(() => element.focus(), 0);
  //    }
  // }

  validateSuffix(items: any, enteredValue: any, index: any) {
    if (enteredValue && enteredValue.length > 4 && items.indexOf(index)) {
      return true;
    }
    else if (!enteredValue && items.indexOf(index)) {
      return true;
    }
    else if (items.indexOf(index)) {
      // Check for duplicate entries
      let suffix = [];
      if (items) {
        items.forEach(x => {
          if ((x.suffix && x.suffix.toLowerCase()) == (enteredValue && enteredValue.toLowerCase())) {
            suffix.push(enteredValue);
          }
        });
      }
      if (suffix.length > 1) {
        return true;
      }
      else {
        return false;
      }
    }
  }

  validateSuffixRequiredTooltip(items: any, enteredValue: any, index: any) {
    if (!enteredValue && items.indexOf(index)) {
      return true;
    }
    else if (items.indexOf(index)) {
      return false;
    }
  }

  validateSuffixMaxCharsTooltip(items: any, enteredValue: any, index: any) {
    if (enteredValue && enteredValue.length > 4 && items.indexOf(index)) {
      return true;
    }
    else if (items.indexOf(index)) {
      return false;
    }
  }

  validateDuplicateSuffix(items: any, enteredValue: any, index: any) {
    if (items.indexOf(index)) {
      // Check for duplicate entries
      let suffix = [];
      if (items) {
        items.forEach(x => {
          if ((x.suffix && x.suffix.toLowerCase()) == (enteredValue && enteredValue.toLowerCase())) {
            suffix.push(enteredValue);
          }
        });
      }
      if (suffix.length > 1) {
        return true;
      }
      else {
        return false;
      }
    }
  }

  back(form: NgForm) {
    if (form.form.dirty)
      this.confirmationMessage(form);
    else
      this.router.navigate(["/cls-configuration", this.customerId, this.institutionId]);
  }

  clear(form: any) {
    this.suffixConfiguration = null;
    this.customerAccount = null;
    this.errorDisplayOnTop = false;
    form.form.markAsPristine();
    this.getAccountNumberSuffixConfiguration();
  }

  saveClsCustomerConfig(form: NgForm) {
    this.errorDisplayOnTop = false;
    const items = document.getElementsByClassName('border-danger');
    if (items.length > 0) {
      this.errorDisplayOnTop = true;
    }
    if (!this.errorDisplayOnTop) {
      this.suffixConfiguration.map(x => {
        x.id = Guid.create().toString();
      });

      this.customerAccount.suffixConfiguration = this.suffixConfiguration;

      this.clsConfigurationService.SaveAccountNumberSuffixConfiguration(this.customerAccount).subscribe((item: CustomerAccount) => {
        this.loadControlScreen = true;
        this.spinnerService.spinnerStop();
        if (item != null && item.customerId != null) {
          form.form.markAsPristine();
          let successMessage = 'Suffixes updated successfully.';
          this.showWarningDialogPopup(successMessage);
        }
      },
        (error) => {
          if (error.status == 403) {
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
  }

  showWarningDialogPopup(msg: string) {
    this.warningDialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      height: 'auto',
      disableClose: true,
      data: {
        isCopyErrorMsg: false,
        isCancelConfirm: false,
        message: msg
      }
    });

    this.warningDialogRef.afterClosed().subscribe(
      result => {
        if (result) {
          //this.router.navigate(["/cls-configuration", this.customerId]);
        }
      }
    );
    return this.warningDialogRef;
  }

  // Show confirmation message if form dirty
  confirmationMessage(form: NgForm) {
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
          form.form.markAsPristine();
          this.router.navigate(["/cls-configuration", this.customerId, this.institutionId]);
        }
        else {
          form.form.markAsDirty();
        }
      },
      error => { }
    );
  }

  validateEmail(email: any, index: any, accounts: any) {
    if (email) {
      if (email.includes('@')) {
        let validate0 = email.split('@')[0];
        let validate1 = email.split('@')[1];
        // Check for any spaces exists
        if(validate0.includes(' ') || validate1.includes(' ')){
          return true;
        }
        else{
          if (validate0 && validate1 && validate1.includes('.')) {
            let validate2 = validate1.split('.')[0];
            let validate3 = validate1.split('.')[1];
            // Check for any black spaces exists
            if(validate2.includes(' ') || validate3.includes(' ')){
              return true;
            }
            else{
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
}
