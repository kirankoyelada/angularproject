import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { DropResult } from 'ngx-smooth-dnd';
import { ATSReviewFields } from 'src/app/customer/shared/customer';
import { Constants } from 'src/app/constants/constants';
declare var $: any;

@Component({
    selector: 'app-ats-review-configure-columns',
    templateUrl: './configure-columns.component.html',
    styleUrls: ['./configure-columns.component.css']
})

export class ATSReviewConfigureColumnsComponent {
    atsReviewFields: any = [];
    error = false;
    constructor(
        private dialogRef: MatDialogRef<ATSReviewConfigureColumnsComponent>,
        @Inject(MAT_DIALOG_DATA) private data: any) {
        if (localStorage.getItem(
            Constants.LocalStorage.ATSREVIEWCOLUMNS
        )) {
            this.atsReviewFields = JSON.parse(localStorage.getItem(
                Constants.LocalStorage.ATSREVIEWCOLUMNS
            ));
            this.atsReviewFields.forEach(field => {
                field.editable = false;
                field.isNew = false;
            });
        }
        else {
            this.atsReviewFields = [];
        }
    }

    addNewAtsReviewField() {
        if (this.atsReviewFields && this.atsReviewFields.length < 50) {
            let atsReviewField = new ATSReviewFields();
            atsReviewField.editable = true;
            atsReviewField.isNew = true;
            this.atsReviewFields.push(atsReviewField);
            setTimeout(() => {
                let index = this.atsReviewFields.length - 1;
                $('#ATSReviewFieldTitleTag' + index).focus();
            }, 10);
        }
    }
    removeReviewField(index: any) {
        this.atsReviewFields.splice(index, 1);
    }
    onDropReviewFields(dropResult: DropResult) {
        this.atsReviewFields = this.applyDrag(this.atsReviewFields, dropResult);
    }


    applyDrag = (arr, dragResult) => {
        const { removedIndex, addedIndex, payload } = dragResult;
        if (removedIndex === null && addedIndex === null) { return arr; }

        const result = [...arr];
        let itemToAdd = payload;

        if (removedIndex !== null) {
            itemToAdd = result.splice(removedIndex, 1)[0];
        }

        if (addedIndex !== null) {
            result.splice(addedIndex, 0, itemToAdd);
        }

        return result;
    }


    validateLabelReviewField(atsReviewField:any) {
        if ( atsReviewField && !atsReviewField.label || atsReviewField.label == "") {
            atsReviewField.isLabelValid = true;
        }
        else {
            atsReviewField.isLabelValid = false;
        }
    }
    validateTagReviewField(atsReviewField:any) {
        if (atsReviewField && !atsReviewField.tag || atsReviewField.tag == "") {
            atsReviewField.isTagValid = true;
        }
        else {
            atsReviewField.isTagValid = false;
        }
    }
    validateSubFieldReviewField(atsReviewField:any) {
        if (atsReviewField && (!atsReviewField.subFieldCode || atsReviewField.subFieldCode == "")) {
            atsReviewField.isSubFieldValid = true;
            if (!this.checkControlNumber(atsReviewField.tag)) {
            }
        }
        else {
            atsReviewField.isSubFieldValid = false;
        }

    }


    checkControlNumber(controlNumber: string) {
        if (controlNumber && controlNumber.length != 0) {
            if (controlNumber.length == 3) {
                if (controlNumber[0] == '0' && controlNumber[1] == '0') {
                    return true;
                }
            }
        }
        else
            return false;
    }
    ok() {
        this.error = false;
        let valid = true;
        this.atsReviewFields.forEach(field => {
            this.validateTagReviewField(field);
            this.validateSubFieldReviewField(field);
            this.validateLabelReviewField(field);
            valid = valid && !this.disableEdit(field);            
        });
        if(valid){
            this.dialogRef.close(this.atsReviewFields);
        }
        else{
            this.error = true;
        }
    }

    cancel() {
        this.dialogRef.close();
    }

    disableEdit(field:any):boolean{
        return !(field.label && field.label.trim().length>0 && field.tag && field.tag.trim().length>0 && (field.tag.indexOf("00") == 0 || field.subFieldCode));
    }

    edit(field:any){
        if(this.disableEdit(field)){
            field.editable = !field.editable;
        }
    }
        
    remove_special_char(event) {
        var k;
        k = event.charCode;
        return ((k > 64 && k < 91) || (k > 96 && k < 123) || k == 8 || k == 32 || (k >= 48 && k <= 57));
    }
}
