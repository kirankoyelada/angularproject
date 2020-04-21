import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'leaderConversion'
})
export class LDRConversionPipe implements PipeTransform {

  transform(value: string): any {
    return value.toLowerCase() === 'leader' ? '000' : value;
  }

}
