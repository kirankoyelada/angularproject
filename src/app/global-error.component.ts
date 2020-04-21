import { Component } from '@angular/core';
import { Location } from '@angular/common';
import * as $ from "jquery";
import { SpinnerService } from './shared/interceptor/spinner.service';
@Component({
  template: `
  <app-header></app-header>
  <div style="margin-top:120px">
        <h2 class="text-center unexpectedError">An unexpected error occurred during the operation. Please contact your system administrator.  <br/><button (click)="goBack()" type="button" class="btn btn-primary mt-2">Go Back</button> </h2>
       </div>
    `
})
export class GlobalErrorComponent {
  constructor(private location: Location,private spinnerService:SpinnerService) { }
  
  ngOnInit(){
    this.spinnerService.onRequestFinished();
  }
  ngAfterViewInit() { $('.modal-backdrop').remove(); 
}
  goBack(): void { 

    this.location.back();
  }
}