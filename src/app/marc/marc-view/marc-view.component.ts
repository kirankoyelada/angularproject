import { Component, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { Marc, MarcEditorSettings } from '../shared/marc';
import { MarcService } from '../shared/service/marc-service';
import { SpinnerService } from 'src/app/shared/interceptor/spinner.service';
import * as $ from "jquery";
import { Constants } from 'src/app/constants/constants';
@Component({
    selector: 'marc-view',
    templateUrl: './marc-view.component.html'
})
export class MarcViewComponent {
    @Input() marcId: string;
    @Input() authorityId: string;
    @Input() marcItem: Marc;
    @Input() marchistoryId:string;
    @Input() recordReason: string;
    @Input() recordNumber: string;
    isSoftDelete: boolean;
    // public properties
    marc: Marc = new Marc();
    marcSettings: MarcEditorSettings;
    //startSpinner: boolean = false;

    constructor(private service: MarcService,private spinnerService: SpinnerService  ) {
        if (localStorage.getItem(Constants.LocalStorage.MARCSETTINGS) != null && localStorage.getItem(Constants.LocalStorage.MARCSETTINGS) != "undefined" && localStorage.getItem(Constants.LocalStorage.MARCBIBDATA) != null) {
           
           var settings  = localStorage.getItem(Constants.LocalStorage.MARCSETTINGS);
            this.marcSettings = JSON.parse(settings);
        }
        else {
            this.loadMarcSettings();
        }
    }

    ngOnInit(): void {
        // this.marc = new Marc();
        // this.loadMarcDetails();
    }

    ngOnChanges(): void {
        if (this.marc && this.marc != null && ((this.marcId && this.marc.id != this.marcId)
            || (this.authorityId && this.marc.id != this.authorityId) || (this.marchistoryId && this.marc.id != this.marchistoryId) ||
          (this.marcItem && this.marc != this.marcItem)) )  {
            this.marc = new Marc();
            this.loadMarcDetails();
        }
    }

    // get tag description to display as tool tip
    getTagDescription(tag: string): string {
        return "";
    }

    // load marc setting
    loadMarcSettings() {
        this.service.getMarcSettings().subscribe((item) => {
            if (item && item) {
                this.marcSettings = item.MarcEditorSettings;
                localStorage.setItem(Constants.LocalStorage.MARCSETTINGS, JSON.stringify(this.marcSettings));
                localStorage.setItem(Constants.LocalStorage.DEFAULTENVSETTINGS, JSON.stringify(this.marcSettings));
                if (item.BibMarcData && item.BibMarcData.length > 0) {
                    let marcBibData = item.BibMarcData.sort((a: any, b: any) => a.tag - b.tag);
                    localStorage.setItem(Constants.LocalStorage.MARCBIBDATA, JSON.stringify(marcBibData));
                }
            }
        });
    }

    // load marc details
    loadMarcDetails() {
        this.isSoftDelete = !this.recordReason || this.recordReason === "";

        if (this.authorityId && this.authorityId.length > 0) {
            //this.startSpinner = true;
            //this.spinnerService.onRequestStarted();
            this.spinnerService.spinnerStart();
            this.service.getAuthorityRecord(this.authorityId).subscribe((item) => {
                this.marc = item;
               // this.startSpinner = false;
               //this.spinnerService.onRequestFinished();
               this.spinnerService.spinnerStop();
            },
                (error) => {
                    console.log(error);
                  //  this.startSpinner = false;
                  //this.spinnerService.onRequestFinished();
                  this.spinnerService.spinnerStop();
                });
        }
        else if(this.marcItem != null){
            this.marc = this.marcItem;
            $('.MARCrecords').scrollTop(0);
        }
        else if (this.marcId && this.marcId.length > 0) {
            this.spinnerService.spinnerStart();
            if(!this.isSoftDelete){
                this.service.getDeletedMarcRecordById(this.marcId).subscribe((item) => {
                    this.marc = item;
                    this.spinnerService.spinnerStop();
                },
                    (error) => {
                        console.log(error);
                       this.spinnerService.spinnerStop();
                    });
            }
            else{
                this.service.getMarcRecordById(this.marcId).subscribe((item) => {
                    this.marc = item;
                    this.spinnerService.spinnerStop();
                },
                    (error) => {
                        console.log(error);
                       this.spinnerService.spinnerStop();
                    });
            }
        }
        else if (this.marchistoryId && this.marchistoryId.length > 0) {
            //this.startSpinner = true;
            //this.spinnerService.onRequestStarted();
            this.spinnerService.spinnerStart();
            this.service.getMarcRecordHistoryById(this.marchistoryId).subscribe((item) => {
                this.marc = item;

                //this.startSpinner = false;
                //this.spinnerService.onRequestFinished();
                this.spinnerService.spinnerStop();
            },
                (error) => {
                    console.log(error);
                   // this.startSpinner = false;
                   //this.spinnerService.onRequestFinished();
                   this.spinnerService.spinnerStop();
                });
        }       
        else {
            this.marc = new Marc();
        }
    }
}
