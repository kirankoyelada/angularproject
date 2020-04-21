import { Component, forwardRef, Output, EventEmitter, ElementRef, ViewChildren, QueryList, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, NG_VALIDATORS, AbstractControl, Validators } from '@angular/forms';


@Component({
    // tslint:disable-next-line: component-selector
    selector: 'checkbox-group',
    template: `<ng-content></ng-content>`,
    providers: [
        { provide: NG_VALUE_ACCESSOR, multi: true, useExisting: forwardRef(() => CheckboxGroupComponent) },
        { provide: NG_VALIDATORS, multi: true, useExisting: CheckboxGroupComponent }
    ]
})
export class CheckboxGroupComponent implements ControlValueAccessor {
    // tslint:disable-next-line: variable-name
    @ViewChildren('chkBox') checkBoxCtrls: QueryList<ElementRef>;
    private _model: string[];
    @Input() data: string[];
    @Input() selectAllVal: string;
    private onChange: (m: any) => void;
    private onTouched: (m: any) => void;

    // Validate
    validate(ctrl: AbstractControl) {
        return Validators.required(ctrl);
    }

    get model() {
        return this._model;
    }

    writeValue(value: string[]): void {
        this._model = value;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    set(value: string[]) {
        this._model = value;
        this.onChange(this._model);
        this.onTouched(this._model);
    }

    addOrRemove(value: string) {
        if (!this.contains(value) && value === '0') {
            this.set([]);
            this.add(value);
            this.data.forEach(val => {
                this.add(val);
            });
        } else if (this.contains(value) && value === '0') {
            this.set([]);
        } else if (this.contains(value) && this.contains('0')) {
            this.remove('0');
            this.remove(value);
        } else if (this.contains(value)) {
            this.remove('0');
            this.remove(value);
        } else {
            this.add(value);
        }
        let selectAll = true;
        this.data.forEach(
            ele => {
                if (!this._model.includes(ele)) {
                    selectAll = false;
                }
            }
        )

        if (selectAll) {
            this.add('0');
        }
        else {
            this.remove('0');
        }
    }

    // addOrRemoveAll() {
    //   this.checkBoxCtrls.forEach(ctrl => {
    //       this.add(ctrl.nativeElement.value);
    //   });
    // }

    contains(value: string): boolean {
        if (this._model instanceof Array) {
            return this._model.indexOf(value) > -1;
        } else if (!!this._model) {
            return this._model === value;
        }

        return false;
    }

    private add(value: string) {
        if (!this.contains(value)) {
            if (this._model instanceof Array) {
                this._model.push(value);
            } else {
                this._model = [value];
            }
            this.onChange(this._model);
            this.onTouched(this._model);
        }
    }

    private remove(value: string) {
        const index = this._model.indexOf(value);
        if (!this._model || index < 0) {
            return;
        }

        this._model.splice(index, 1);
        this.onChange(this._model);
        this.onTouched(this._model);
    }
}
