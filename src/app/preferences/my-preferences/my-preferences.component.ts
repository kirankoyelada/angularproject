import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { Location } from '@angular/common';
import { Constants } from 'src/app/constants/constants';
import { UserConfigurationService } from 'src/app/users/user-configuration.service';
import { ControlNumber, LocationName } from './my-preferences';
import { User } from 'src/app/users/user';
import { SpinnerService } from 'src/app/shared/interceptor/spinner.service';
import { ConfirmationDialogComponent } from 'src/app/components/shared/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { FormCanDeactivate } from 'src/app/can-deactivate/form-can-deactivate';
import { AuthenticationService } from 'src/app/security/authentication.service';
import { CustomerService } from '../../customer/shared/services/customer.service';
import { Customers } from '../../customer/shared/customer';
import { SubSink } from 'subsink';
declare var $: any;

@Component({
  selector: 'app-my-preferences',
  templateUrl: './my-preferences.component.html'
})
export class MyPreferencesComponent extends FormCanDeactivate implements OnInit {

  constructor(private userConf: UserConfigurationService, private spinnerService: SpinnerService,
              private dialog: MatDialog, private prevLocation: Location, private titleService: Title, routr: Router,
              authenticationService: AuthenticationService, private cutomerService: CustomerService

  ) {
    super(routr, authenticationService);

  }
  actor: string;
  controlNumber: string;
  location: string;
  revealSpaces: boolean;
  public users: User[];
  loggedInUser: User;
  user: User;
  router: any;
  cWidowHeight: number;
  cHeaderHeight: number;
  cSearchHeight: number;
  cNavHeight: number;
  headerHeight: number;
  newHeight: number;
  newUserHeight: number;
  isHide = true;
  customers: Customers[];
  private subs = new SubSink();
  // TODO need to remove this hardcoding
  controlNumbers: ControlNumber[] = [
    { key: 'bl', name: 'bl' },
    { key: 'be', name: 'be' },
    { key: 'cl', name: 'cl' },
    { key: 'oc', name: 'oc' },
    { key: 'jb', name: 'jb' }
  ];
  // TODO need to move into configuration instead of here
  locations: LocationName[] = [
    { key: 'NjBwBT', name: 'Bridgewater' },
    { key: 'IMmBT', name: 'Momence' },
    { key: 'GCmBT', name: 'Commerce' },
    { key: 'NJB', name: 'James Bennett' }
  ];

  @ViewChild('form') form: NgForm;

  ngOnInit() {
    this.titleService.setTitle('BTCAT | My Preferences');
    this.getLoggedInUser();
  }


  // set the page height dynamically based on resizing the screen
  customHeightFunction() {
    this.cWidowHeight = $(window).height();
    this.cHeaderHeight = $('app-header nav').height();
    this.cSearchHeight = $('app-search-box .search_filter').height();
    this.cNavHeight = $('.mainNavSection').height();
    this.headerHeight =
      this.cHeaderHeight + this.cSearchHeight + this.cNavHeight;
    this.newHeight = this.cWidowHeight - this.headerHeight;
    this.newHeight = this.newHeight - 100;
    this.newUserHeight = this.newHeight - 32;
  }

  // tslint:disable-next-line: use-life-cycle-interface
  ngAfterViewChecked() {
    // set the page hight based on the expand and collapse search icon.
    this.customHeightFunction();

    $(window).resize(() => {
      this.customHeightFunction();
    });
  }

  // get the logged In User
  getLoggedInUser() {
    this.actor = localStorage.getItem(Constants.LocalStorage.ACTOR);
    const loggedInUser = JSON.parse(localStorage.getItem('currentUser'));
    this.isHide = true;
    // reading all users and filtering the logged In user
    this.controlNumber = loggedInUser.ControlNumber != null ? loggedInUser.ControlNumber : 'bl';
    this.location = loggedInUser.Location != null ? loggedInUser.Location : 'NjBwBT';
    this.revealSpaces = loggedInUser.revealSpaces != null ? loggedInUser.revealSpaces : false;
    this.userConf.getUserByName(this.actor).subscribe(userItem => {
      this.loggedInUser = userItem;
      this.controlNumber = this.loggedInUser.controlNumber != null ? this.loggedInUser.controlNumber : 'bl';
      this.location = this.loggedInUser.location != null ? this.loggedInUser.location : 'NjBwBT';
      this.revealSpaces = this.loggedInUser.revealSpaces != null ? this.loggedInUser.revealSpaces : false;
      this.isHide = false;
    });
  }

  // Save the User Preference
  saveUserPrefernces(form: NgForm) {
    this.loggedInUser.controlNumber = this.controlNumber;
    this.loggedInUser.location = this.location;
    this.loggedInUser.revealSpaces = this.revealSpaces;
    this.spinnerService.spinnerStart();
    this.userConf.saveUserPrefernces(this.loggedInUser).subscribe(
      result => {
        form.form.markAsPristine();
        this.spinnerService.spinnerStop();
        if (result.Message != '') {
          const user = localStorage.getItem(Constants.LocalStorage.USER);
          const userObj = JSON.parse(user);
          const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
            width: "500px",
            height: "auto",
            disableClose: true,
            data: {
              isCopyErrorMsg: false,
              isCancelConfirm: false,
              message:
                "The preferences for the user <b>" +
                userObj.LastName +
                ", " +
                userObj.FirstName + "</b> has been updated successfully."
            }
          });
          dialogRef.afterClosed().subscribe(() => {
            userObj.revealSpaces = this.revealSpaces;
            userObj.Location = this.location;
            userObj.ControlNumber = this.controlNumber;
            localStorage.setItem(Constants.LocalStorage.USER, JSON.stringify(userObj));
          });
        }
      },
      error => {
        if (error.status == 403) {
          this.spinnerService.spinnerStop();
          if (form.dirty) {
            form.form.markAsPristine();
          }
          alert(error.statusText);
          this.router.navigate(['/unauthorized']);
        } else {
          this.spinnerService.spinnerStop();
          throw error;
        }
      }
    );

  }

  back(form: NgForm) {
    if (form && form.form.dirty) {
      this.confirmationMessage(form);
    } else {
      this.prevLocation.back();
    }
  }

  clear(form: NgForm) {
    if (form.dirty) {
      this.controlNumber = this.loggedInUser.controlNumber != null ? this.loggedInUser.controlNumber : 'bl';
      this.location = this.loggedInUser.location != null ? this.loggedInUser.location : 'NjBwBT';
      form.form.markAsPristine();
    }

  }


  confirmationMessage(form: NgForm) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      height: 'auto',
      disableClose: true,
      data: {
        isCopyErrorMsg: false,
        isCancelConfirm: true,
        message:
          'There are unsaved changes. Are you sure you want to leave this page? '
      }
    });

    dialogRef.afterClosed().subscribe(
      result => {
        if (result) {
          form.form.markAsPristine();
          this.prevLocation.back();
        } else { form.form.markAsDirty(); }
      },
      () => { }
    );
  }
}
