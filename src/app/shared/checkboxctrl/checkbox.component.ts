
import { CheckboxGroupComponent } from './checkbox-group.component';
import { Host, Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';

@Component({
    selector: 'checkbox',
    template: `
    <div class="custom-checkbox-div" (click)="toggleCheck()">
        <input [id]="value" [name]="value" type="checkbox" (focus)="onFocus()" [checked]="isChecked()" #chkBox />
        <label [for]="value">{{value == '0' ? 'Select All' : value}}</label>
    </div>`
})
export class CheckboxComponent {
    @Input() value: string;
    @Input() name: string;
    @Output() toggle = new EventEmitter();
    @Output() focus = new EventEmitter();
    constructor(@Host() private checkboxGroup: CheckboxGroupComponent) {
    }

    toggleCheck() {
        this.checkboxGroup.addOrRemove(this.value);
        this.toggle.emit();
    }

    isChecked() {
        return this.checkboxGroup.contains(this.value);
    }

    onFocus() {
        this.focus.emit();
    }
}
