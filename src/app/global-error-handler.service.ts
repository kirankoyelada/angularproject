import { Injectable, ErrorHandler, Injector, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthenticationService } from './security/authentication.service';
import { MatDialog } from '@angular/material';
import { ConfirmationDialogComponent } from './components/shared/confirmation-dialog/confirmation-dialog.component';
import { SpinnerService } from 'src/app/shared/interceptor/spinner.service';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

@Injectable()
export class GlobalErrorHandlerService implements ErrorHandler {
  constructor(private injector: Injector, private dialog: MatDialog,
    private authenticationService: AuthenticationService,
    private spinnerService: SpinnerService) { }

  handleError(error: any) {
    const appInsights = this.injector.get(ApplicationInsights);
    const user = this.authenticationService.currentUserValue ? this.authenticationService.currentUserValue.UserName : '';
    appInsights.setAuthenticatedUserContext(user);
    appInsights.trackException({ exception: error });

    let router = this.injector.get(Router);

    let errorMessage = '';
    if (error instanceof HttpErrorResponse) {
      //Backend returns unsuccessful response codes such as 404, 500 etc.
      console.error('Backend returned status code: ', error.status);
      console.error('Response body:', error.message);
      if (error.status > 0) {
        if (error.status == 401) {
          // auto logout if 401 Unauthorized response returned from api
          this.authenticationService.logout();
          location.reload(true);
        }
        else if (error.status == 404) {
          errorMessage = `No Record(s) Found`;
        }
        // else if (error.status > 500) {
        //   const ngZone = this.injector.get(NgZone);
        //   ngZone.run(() => {
        //     router.navigate(['/error'], { skipLocationChange: false });
        //   });
        // }
        else {
          if (error.error) {
            errorMessage = `Error Code: ${error.status}\nMessage: ${error.error.Message}`;
          }
          else {
            errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
          }
        }
      }
      if(errorMessage){
        this.alert(errorMessage);
      }
    } else {
      //A client-side or network error occurred.
      console.error('An error occurred:', error.message);
    }
    this.spinnerService.spinnerStop();
    appInsights.clearAuthenticatedUserContext();
  }


  alert(message: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: message && message.length > 200 ? '500px' : '300px',
      height: 'auto',
      disableClose: true,
      data: {
        isCancelConfirm: false,
        isCopyErrorMsg: false,
        message: message,
        title: 'Error'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }
}
