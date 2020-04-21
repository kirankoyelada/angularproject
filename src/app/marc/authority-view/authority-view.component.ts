import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
declare var $: any;
@Component({
    selector: 'authority-view',
    templateUrl: './authority-view.component.html'
})
export class AuthorityViewComponent {
    authorityId: string;
    CWidowHeight: number;
    CHeaderHeight: number;
    CSearchHeight: number;
    CNavHeight: number;
    HeaderHeight: number;
    NewHeight: number;
  

    constructor(private router: Router,
        private route: ActivatedRoute,   
        private _location: Location,private cdr: ChangeDetectorRef) {
    }
 /* search split fix function - var values */
 CustomHeightFunction() {
    this.CWidowHeight = $(window).height();
    this.CHeaderHeight = $("app-header nav").height();
    this.CSearchHeight = $("app-search-box .search_filter").height();
    this.CNavHeight = $(".mainNavSection").height();
    this.HeaderHeight =
    this.CHeaderHeight +
    this.CSearchHeight +
    this.CNavHeight;
    this.NewHeight = this.CWidowHeight - this.HeaderHeight;
    this.NewHeight = this.NewHeight - 90;
    this.cdr.detectChanges();
    }
    ngAfterViewChecked() {
    this.CustomHeightFunction();
    
    $(window).resize(e => {
            this.CustomHeightFunction();
    });
    }
    ngOnInit() {
        this.route.params.subscribe(params => {
            // get authorityId from param
            if (params['authorityId']) {
                this.authorityId = params['authorityId'];
            }
        });
    }

    back(){
        this._location.back();
    }
}