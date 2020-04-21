import { Component, OnInit } from '@angular/core';
import * as $ from "jquery";
import { Router } from '@angular/router';
import { Constants } from 'src/app/constants/constants';
@Component({
  template: `
        <app-header></app-header>
         <div style="margin-top:120px">
       <h3 class="text-center">You are not authorized to access this page. Please contact your system administrator.<br/><button (click)="goBack()" type="button" class="btn btn-primary mt-2">Home</button> </h3>
      </div>
            `
})
export class UnauthorizedComponent implements OnInit {
  constructor(
    private router: Router
    ) { }
  
  ngOnInit(){
  }
  ngAfterViewInit() { $('.modal-backdrop').remove();}
  goBack(): void {
    
    localStorage.removeItem(Constants.LocalStorage.BIBSEARCHREQUEST);
    localStorage.removeItem(Constants.LocalStorage.SEARCHZ3950REQUEST);
    localStorage.removeItem(Constants.LocalStorage.AUTHSEARCHREQUEST);
    this.router.navigate(["/search"]);
  }
}
