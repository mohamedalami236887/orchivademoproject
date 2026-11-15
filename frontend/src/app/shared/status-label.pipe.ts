import { Pipe, PipeTransform } from '@angular/core';
@Pipe({name:'statusLabel'})
export class StatusLabelPipe implements PipeTransform {
  transform(value:string|null|undefined):string { return value ? value.toLowerCase().replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase()) : '—'; }
}
