import { FormGroup } from '@angular/forms';
import { MarcBibData } from '../shared/marc';
import { MarcFieldDTO } from 'src/app/_dtos/btcat.vm.dtos';

// custom validator to check that two fields match
export function isSystemGenerated(controlName: string, field: MarcFieldDTO) {
    return (formGroup: FormGroup) => {
        const control = formGroup.controls[controlName];

        // return null if controls haven't initialised yet
        if (!control || !field) {
          return null;
        }

        // set error on matchingControl if validation fails
        if (field.isSystemGenerated) { // } || !field.isCreateAllowed) {
            control.setErrors({ obsoleteErrorMessage: `${field.tag} is system generated` });
        } else {
            control.setErrors(null);
        }
    }
}
