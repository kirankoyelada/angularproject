import { Component, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { MarcField, MarcEditorSettings } from '../marc';
import { CommonService } from 'src/app/shared/service/common.service';
@Component({
    selector: 'marc-field-view',
    templateUrl: './marc-field-view.component.html'
})
export class MarcFieldViewComponent {
    constructor(private commonService: CommonService){}
    @Input() field: MarcField = new MarcField();
    @Input() marcSettings: MarcEditorSettings;
    backgroundColor: string;
    ngOnInit(): void {
        this.backgroundColor = this.field.color ? this.field.color : (this.marcSettings ? this.marcSettings.backgroundcolor : '');
    }

    ngOnChanges(): void {
        this.backgroundColor = this.field.color ? this.field.color : (this.marcSettings ? this.marcSettings.backgroundcolor : '');
    }

    getLeaderData(leaderField:any){
       return leaderField.data.substring(5, 10) + leaderField.data.substring(17, 20).replace(/#/g, ' ');
    }
}
