import { Injectable } from '@angular/core';
import * as $ from "jquery";
import * as jsPdf from 'jspdf';
import html2canvas from 'html2canvas';
import { Marc, MarcEditorSettings } from 'src/app/marc/shared/marc';
import { Constants } from 'src/app/constants/constants';
import { MarcService } from 'src/app/marc/shared/service/marc-service';
import { SpinnerService } from '../interceptor/spinner.service';
import * as moment from 'moment-timezone';

@Injectable({
    providedIn: 'root'
})

export class PrintService {

    // public properties
    marcSettings: MarcEditorSettings;

    constructor(private service: MarcService,
        private spinnerService: SpinnerService) {

    }
    generatePDFPrintPreview(marc: any, lineSpaceSelection: string) {        
        let dateTime = new Date();
        this.marcSettings = JSON.parse(localStorage.getItem(Constants.LocalStorage.MARCSETTINGS));
        let currentDateTime =  moment(dateTime).format('MM/DD/YYYY') + '$' + moment(dateTime).format('HH:mm:ss');
        let fileName = (marc.recordNumber == null ? 'New' : marc.recordNumber)  + '_' + moment(dateTime).format('YYYYMMDDHHmmss') + '.pdf';
        this.service.getMarcGeneratedPdf(marc, this.marcSettings.delimiter, lineSpaceSelection, currentDateTime).subscribe((data) => {
            let file = new Blob([data], { type: 'application/pdf' });
            

            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                window.navigator.msSaveOrOpenBlob(file, fileName);
            }
            else {
                var objectUrl = URL.createObjectURL(file);
                var pwa = window.open(objectUrl);
                if (!pwa || pwa.closed || typeof pwa.closed == 'undefined') {
                    alert('Please disable your Pop-up blocker and try again.');
                }
            }
            this.spinnerService.spinnerStop();
        },
            (error) => {
                console.log(error);
                this.spinnerService.spinnerStop();
            });
    }
}