import { Directive, Input } from '@angular/core';
import { NG_VALIDATORS, Validator, ValidationErrors, FormGroup } from '@angular/forms';
import { RequiredField } from './requiredfield.validator';
import { HasMinLength } from './minlength.validtor';
import { ValidationParams } from './validation-dto';
import { IsObsolete } from './obsolete.validator';
import { isSystemGenerated } from './systemgenerated.validator';

@Directive({
  selector: '[validatetag]',
    providers: [{ provide: NG_VALIDATORS, useExisting: MarcTagValidationfactoryDirective, multi: true }]
})
export class MarcTagValidationfactoryDirective {
  // tslint:disable-next-line: no-input-rename
  @Input('validationParams') validationParams: ValidationParams;
  constructor() { }

  validate(formGroup: FormGroup): ValidationErrors {
    let validationErrors;
    if (this.validationParams) {
      const requiredFormGroup = RequiredField(this.validationParams.controls[0])(formGroup);
      const minlengthFormGroup = HasMinLength(this.validationParams.controls[0])(requiredFormGroup);
      // tslint:disable-next-line: max-line-length
      const obsoleteFormGroup = IsObsolete(this.validationParams.controls[0], this.validationParams.field, this.validationParams.bibData)(minlengthFormGroup);
      validationErrors = isSystemGenerated(this.validationParams.controls[0], this.validationParams.field)(obsoleteFormGroup);
    }
    return validationErrors;
}

}
