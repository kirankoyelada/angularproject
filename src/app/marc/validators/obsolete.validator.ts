import { FormGroup } from '@angular/forms';
import { MarcFieldDTO, MarcBibDataDTO } from 'src/app/_dtos/btcat.vm.dtos';

// custom validator to check that two fields match
export function IsObsolete(controlName: string, field: MarcFieldDTO, bibDataArray: MarcBibDataDTO[]) {
    return (formGroup: FormGroup) => {
        const control = formGroup.controls[controlName];

        // return null if controls haven't initialised yet
        if (!control || !bibDataArray || field) {
          return null;
        }

        const bibData = bibDataArray.find(x => x.tag === field.tag);

        // set error on matchingControl if validation fails
        if (bibData.isObsolete) {
            control.setErrors({ obsoleteErrorMessage: `Obsolete tag` });
        } else {
            control.setErrors(null);
        }
    }
}
