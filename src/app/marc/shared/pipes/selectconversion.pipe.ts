import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'selectconversion'
})
export class SelectconversionPipe implements PipeTransform {

  transform(value: string, type: string): any {
    return value.toLowerCase() === 'select' ? `Select ${type}` : value;
  }

}
