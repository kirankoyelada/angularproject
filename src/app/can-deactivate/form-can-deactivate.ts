import {NgForm, FormGroup, FormGroupDirective} from '@angular/forms';
import { ComponentCanDeactivate } from './component-can-deactivate';

export abstract class FormCanDeactivate extends ComponentCanDeactivate {

  abstract get form(): NgForm;

  canDeactivate(): boolean {
    return  !this.form || (this.form.submitted || !this.form.dirty);
  }
}


export abstract class FormModuleCanDeactivate extends ComponentCanDeactivate {

  abstract get form(): FormGroup;
  abstract get formGroupDir(): FormGroupDirective;

  canDeactivate(): boolean {
    return !this.form.dirty || this.formGroupDir.submitted;
  }
}
