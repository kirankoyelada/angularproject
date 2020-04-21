import { Injectable } from '@angular/core';
import { UserIdleService } from 'angular-user-idle';
import { Router } from '@angular/router';
import { SpinnerService } from '../../shared/interceptor/spinner.service';
import { MatDialog } from '@angular/material';
import { ConfirmationDialogComponent } from 'src/app/components/shared/confirmation-dialog/confirmation-dialog.component';
import { ConfigurationService } from 'src/app/services/configuration.service';

@Injectable({
  providedIn: 'root'
})
export class UserIdleSettingsService {
  ConfirmBoxShown: boolean;
  justInitiated: boolean;

  constructor(private userIdle: UserIdleService,
    private spinnerService: SpinnerService,
    private configurationService: ConfigurationService,
    private router: Router,
    private dialog: MatDialog) {
      this.userIdle.setConfigValues({
      idle: configurationService.currentConfiguration().idleTime,
      timeout: configurationService.currentConfiguration().sessionTimeOut,
      ping: 0 });
  }

  ResetTimer() {
    this.initiateUserIdleModuleSettings();
  }

  initiateUserIdleModuleSettings() {
    this.justInitiated = true;
    this.dialog.closeAll();
    this.userIdle.startWatching();
    this.setUserIdleModuleSettings();

    setTimeout(() => {
      this.justInitiated = false;
    }, 15000); // 15 secs delay to not start displaying the popup as soon as service starts

    this.userIdle.onTimerStart().subscribe((count) => {
      if (!this.justInitiated) {
        setTimeout(() => {
          if (!this.ConfirmBoxShown) {
            this.ConfirmBoxShown = true;
            if (!this.IsRestrictedSite()) {
              this.DisplayConfirmBox('You are about to be logged off due to inactivity.<br>' +
                                        'Click below if you would like to remain logged on.');
            }
          }
        }, 100);
      }
    });
    this.userIdle.onTimeout().subscribe(() => {
      this.SessionTimeout();
    });
  }
  IsRestrictedSite(): boolean {
    return (window.location.hash.startsWith('#/login') || window.location.hash.startsWith('#/sessionTimeOut'));
  }
  SessionTimeout() {
    this.dialog.closeAll();
    this.ConfirmBoxShown = false;
    this.justInitiated = false;
    this.userIdle.stopWatching();
    // fix for bug - 2973
    this.spinnerService.onRequestFinished();
    if (!this.IsRestrictedSite()) {
      // not on login screen then only redirect to sessionTimeout
      this.router.navigate(['/sessionTimeOut']);
    }
    setTimeout(() => { this.spinnerService.spinnerStop(); }, 2000);
  }

  DisplayConfirmBox(message: string) {

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: message && message.length > 200 ? '500px' : '300px',
      height: 'auto',
      disableClose: false,
      data: {
        isCancelConfirm: true,
        isCopyErrorMsg: false,
        buttonOneLabel: 'Continue session',
        buttonTwoVisible: false,
        message,
        title: 'Confirm Logout'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.ConfirmBoxShown = false;
      this.ResetTimer(); // restart the timer;
    });
  }
  // Setup Idle module settings at runtime.
  setUserIdleModuleSettings() {
    this.dialog.closeAll();
    this.ConfirmBoxShown = false;
    let idleTimeout = 36000;
    if (localStorage.getItem('timeOutDetails') !== null && localStorage.getItem('timeOutDetails') !== undefined) {
      const timeOutDetails = JSON.parse(localStorage.getItem('timeOutDetails'));
      // tslint:disable-next-line: radix
      idleTimeout = parseInt(timeOutDetails.idleTime);
      if (idleTimeout <= 0) {
        idleTimeout = 36000; // 10 hrs
      }
    }
    this.userIdle.stopWatching();
    // 15 seconds for displaying the confirmation box
    this.userIdle.setConfigValues({ idle: idleTimeout, timeout: 15, ping: 0 });
    // this.userIdle.setConfigValues({ idle: 5, timeout: 5, ping: 1 });
    this.userIdle.startWatching();
    this.userIdle.resetTimer();
  }
}
