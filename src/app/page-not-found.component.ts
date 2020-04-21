import { Component } from '@angular/core';
import { Location } from '@angular/common';
import * as $ from "jquery";
import { SpinnerService } from './shared/interceptor/spinner.service';
import { Router } from '@angular/router';
@Component({
  template: `
        <app-header></app-header>
         <div style="margin-top:120px">
       <h3 class="text-center">Page Not Found.<br/><button (click)="goBack()" type="button" class="btn btn-primary mt-2">Go Back</button> </h3>
      </div>
            `
})
export class PageNotFoundComponent {
  constructor(
    private router: Router,
    private location: Location,private spinnerService:SpinnerService
    ) { }
  
  ngOnInit(){
    this.spinnerService.onRequestFinished();
  }
  ngAfterViewInit() { $('.modal-backdrop').remove();}
  goBack(): void {
    //this.location.back();
    this.router.navigate(["/search"]);
  }
}