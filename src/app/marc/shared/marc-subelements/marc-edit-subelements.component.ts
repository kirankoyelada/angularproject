import {
  Component, OnInit, Input, OnChanges, Output, EventEmitter, SimpleChanges,
  Renderer2, ViewChildren, QueryList, Inject, AfterViewChecked
} from '@angular/core';
import { MarcEditorSettings, Value } from '../marc';
import { DOCUMENT } from '@angular/common';
import { NgForm } from '@angular/forms';
import {
  MatAutocompleteTrigger, _countGroupLabelsBeforeOption, _getOptionScrollPosition,
  AUTOCOMPLETE_PANEL_HEIGHT
} from '@angular/material';
import * as $ from 'jquery';
import { PageScrollService } from 'ngx-page-scroll-core';
import { Observable, of } from 'rxjs';
import { MarcFieldDTO, MarcBibDataDTO, ValueDTO } from 'src/app/_dtos/btcat.vm.dtos';
import { ClonerService } from 'src/app/services/cloner.service';
declare var $: any;

@Component({
  selector: 'edit-subelements',
  templateUrl: './marc-edit-subelements.component.html'
})

export class MarcEditSubElementsComponent implements OnInit, OnChanges, AfterViewChecked {
  @ViewChildren(MatAutocompleteTrigger, { read: MatAutocompleteTrigger }) matAutocompleteTrigger: QueryList<MatAutocompleteTrigger>;

  @Input() field: MarcFieldDTO;
  @Input() leaderField: string;
  tagData: MarcBibDataDTO;
  values: Array<Observable<ValueDTO[]>> = [];
  @Input() existingMARCData: MarcBibDataDTO[];
  @Input() marcSettings: MarcEditorSettings;
  @Input() formData: NgForm;
  @Output() valueUpdate = new EventEmitter<any>();
  @Input() fieldIndex: number;
  @Input() originalData: string;
  @Input() leaderDataWithHyphons: string;
  @Input() overrideValidation: boolean;
  @Output() leaderDataWithHyphonsChange = new EventEmitter<string>();
  // tslint:disable-next-line: no-output-on-prefix
  @Output() onAltDelete = new EventEmitter();
  isSingleEle: boolean;
  newValue = '';
  updatedLeaderValue = '';
  isValidLang: boolean;
  originalLang: string;
  canMoveNextByMaxLength = true;
  @Input()
  get value() {
    return this.controlValue;
  }
  set value(val) {
    this.controlValue = val;
    this.valueUpdate.emit(val);
  }

  private controlValue: string;

  constructor(private renderer2: Renderer2,
              private pageScrollService: PageScrollService,
              private clonerService: ClonerService,
              @Inject(DOCUMENT) private document: any) { }
  ngAfterViewChecked() {
    this.matAutocompleteTrigger.changes.subscribe((trigger) => {
      trigger.toArray().map((item) => {
        // set default scroll position to 0
        item.autocomplete._setScrollTop(0);
        item._scrollToOption = () => {
          const index: number = item.autocomplete._keyManager.activeItemIndex || 0;
          const labelCount = _countGroupLabelsBeforeOption(index, item.autocomplete.options, item.autocomplete.optionGroups);
          // tslint:disable-next-line: max-line-length
          const newScrollPosition = _getOptionScrollPosition(index, 25, item.autocomplete._getScrollTop(), AUTOCOMPLETE_PANEL_HEIGHT);
          item.autocomplete._setScrollTop(newScrollPosition);
        };
      });
    });
    if (this.isSingleEle && (this.field.tag === '006' || this.field.tag === '007') && this.tagData && this.tagData.subElements) {
      if (this.tagData.subElements.length === 1) {
        const elem = document.getElementById('dateEnteredOn-life0' + this.fieldIndex);
        if (elem != null) {
          $('#dateEnteredOn-life0' + this.fieldIndex).trigger('focusout');
          $('#dateEnteredOn-life0' + this.fieldIndex).blur();
          this.setFirstElementFocus();
        }
      } else {
        setTimeout(() => {
          const fieldIndex = this.fieldIndex;
          if (this.field.tag === '006' || this.field.tag === '007') {
            this.renderer2.selectRootElement(`#dateEnteredOn-life1${fieldIndex}`).select();
          }
        }, 0);
      }
      this.isSingleEle = false;
    }
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.leaderField && changes.leaderField.currentValue !== changes.leaderField.previousValue && this.field.tag !== 'Leader') {
      this.intialLoad();
      this.newValue = this.field.data;
      this.updateNewValue(false);
    }
  }
  ngOnInit(): void {
    if (this.field && this.field.tag === 'Leader') {
      this.intialLoad();
      this.updatedLeaderValue = this.field.data;
      this.updateNewValue(true);
    }
    this.setFirstElementFocus();

    if (this.overrideValidation) {
      if( this.field.subelements &&  this.field.subelements.length >0)
      this.field.subelements.forEach(ele => ele.isValid = true);
    }
  }
   intialLoad() {
    const tagData = this.clonerService.deepClone<MarcBibDataDTO>(this.existingMARCData.find(a => a.tag === (this.field.tag === '000' ? 'Leader' :this.field.tag)));
    if (this.field.tag === '008') {
      const type = this.leaderField.charAt(6);
      const leaderData = this.existingMARCData.find(a => a.tag === 'Leader');
      if (
        leaderData &&
        leaderData.subElements &&
        leaderData.subElements.length > 0
      ) {
        const subElementData = leaderData.subElements.find(a => a.element === '06');
        if (
          subElementData &&
          subElementData.values &&
          subElementData.values.length > 0
        ) {
          const elementData = subElementData.values.find(a => a.code === type);
          if (elementData && tagData.subElements != null) {
            const subEleData = tagData.subElements.find(a => a.element === '18-34');
            if (subEleData && subEleData.materialType != null) {
              const relativeFields = subEleData.materialType.find(a => a.type.toLowerCase() === elementData.materialType.toLowerCase());
              const index = tagData.subElements.findIndex(a => a.element === '18-34');
              if (index) {
                tagData.subElements.splice(index, 1, ...relativeFields.relativefields);
              }
            }
          }
        }
      }
    }
    if (this.field.tag === '007' || this.field.tag === '006') {
      const subElementData = tagData.subElements[0];
      if (
        subElementData &&
        subElementData.values != null &&
        subElementData.values.length > 0
      ) {
        if (this.field.data == null) {
          this.field.data = '';
        }
        const value = subElementData.values.find(
          a => a.code == this.field.data.charAt(0)
        );
        tagData.subElements = [];
        tagData.subElements[0] = subElementData;
        if (value && value.materialType && value.materialType != null) {
          const relativefields = subElementData.materialType.find(a => a.type.toLowerCase() == value.materialType.toLowerCase());
          Array.prototype.push.apply(tagData.subElements, relativefields.relativefields);
        }
      }
    }
    if (tagData && tagData.subElements && tagData.subElements.length > 0) {
      const subFieldDescription = this.field.data;
      tagData.subElements.forEach(subElement => {
        if (subFieldDescription && subFieldDescription !== '') {
          if (subElement.length != null && subElement.length !== '') {
            if (+subElement.length > 1) {
              const charArray = subElement.element.split('-');
              const data = subFieldDescription.substring(
                parseInt(charArray[0]),
                parseInt(charArray[1]) + 1
              );
              let isOnLoad = true;
              if (this.field.originalData && this.field.tag === '008' && subElement.element === '35-37' && data.length === 3) {
                const originalLang = this.field.originalData.substring(
                  parseInt(charArray[0]),
                  parseInt(charArray[1]) + 1
                );
                this.originalLang = originalLang;
                if (originalLang != data) {
                  isOnLoad = false;
                }
              }
              subElement['isValid'] = this.isValidSubElementData(subElement, data, isOnLoad);
            } else {
              const data = subFieldDescription.charAt(+subElement.element);
              subElement['isValid'] = this.isValidSubElementData(subElement, data, true);
            }
          }
        }
      });
    }
    this.tagData = this.clonerService.deepClone<MarcBibDataDTO>(tagData);
  }
  getTagData(subFieldDescription: any, subElement: any, field: any) {
    if (subFieldDescription && subFieldDescription != '') {

      if (subElement.length != null && subElement.length != '') {
        if (subElement.length > 1) {
          const charArray = subElement.element.split('-');
          let data = subFieldDescription.substring(
            parseInt(charArray[0]),
            parseInt(charArray[1]) + 1
          );
          return data.trim() != '' ? (data = this.rightTrim(data)) : data.trim();
        } else {
          const data = subFieldDescription.charAt(subElement.element);
          return data.trim() != '' ? data : data.trim();
        }
      }
    }
    return '';
  }
  rightTrim(str) {
    if (str && str != '') {
      return str.replace(/\s+$/, "");
    }
  }
  getLeaderTagData(subFieldDescription: any, subElement: any, field: any) {
    if (subFieldDescription && subFieldDescription !== '') {

      if (subElement.length !== null && subElement.length !== '') {
        if (subElement.length > 1) {
          const charArray = subElement.element.split('-');
          const data = subFieldDescription.substring(
            parseInt(charArray[0]),
            parseInt(charArray[1]) + 1
          );
          return data;
        } else {
          const data = subFieldDescription.charAt(subElement.element);
          return data;
        }
      }
    }
    return '';
  }
  // replace header string based on rules
  replaceString(start: any, end: any, what: any, data: any) {
    return data.substring(0, start) + what + data.substring(end);
  }
  hasClass(event: any) {
    if (event.classList.contains('border-danger')) {
      return 'Invalid data';
    } else {
      return '';
    }
  }
  onBlurChange(event: any, subEle: any, trigger: any, isLeader: boolean) {
    if ((event.relatedTarget === null && trigger) || (event.relatedTarget && event.relatedTarget.nodeName !== 'MAT-OPTION' && trigger)) {
      trigger.closePanel();
    }
    this.updateNewValue(isLeader);
  }
  onSubelementFocus(event: any, isLeader: boolean, subElement: any, index: number) {
    const values = this.tagData.subElements[index].values;
    if (values !== null) {
      this.values[index] = of(values);
    }
    let val = event.target.value;
    if (val.indexOf('#') > -1 && event.target) {
      val = val.replace(/#/g, '');
      event.target.value = val;
    }
    // if (val.match(/[A-Z]/) && event.target) {
    //   event.target.value = val.replace(/[A-Z]/g, '');
    //   return false;
    // }
    val = event.target.value;
    this.formData.form.markAsDirty();
    subElement['isValid'] = true;
    val = val == '' ? ' ' : val;
    if (!this.isValidSubElementData(subElement, val, false)) {
      subElement['isValid'] = false;
    }

    if (subElement['isValid'] == false) {
      if (event.target) {
        event.target.classList.add('border-danger');
      }
    }
  }
  onKeyUp(
    event: any,
    subElement: any,
    field: any,
    isAutoSelect: any,
    index: any,
    autocompletetrigger: any
  ) {
    if (event.target.value.length === subElement.length) {
      if (!isAutoSelect && autocompletetrigger && event.key != "Tab" && event.key != "Shift" && event.key && event.key.indexOf('Arrow') == -1 && event.key != 'Backspace') {
        autocompletetrigger.closePanel();
      }
    }
    if (!isAutoSelect && event && (event.shiftKey && event.keyCode == 51)) {
      if(subElement.values && subElement.values.findIndex(a =>a.code==' ') === -1)
      {
      event.preventDefault();
      }
      else if(event.target.value.length < subElement.length ){
        event.target.value = event.target.value +' ';
        if (this.field.tag == 'Leader' && this.leaderDataWithHyphons && (subElement.element === '17' || subElement.element === '18')) {
          let value =  event.target.value;
          this.leaderDataWithHyphons = this.replaceString(
            parseInt(subElement.element),
            parseInt(subElement.element) + parseInt(subElement.length),
            value == ' ' ? '#' : (value == '' ? '-' : value),
            this.leaderDataWithHyphons
          );
          this.leaderDataWithHyphonsChange.emit(this.leaderDataWithHyphons);
        }
      }
        }
  }
  onKeyDown(
    event: any,
    subElement: any
  ) {
    if (event && (event.shiftKey && event.keyCode == 51)) {
      if(subElement.values && subElement.values.findIndex(a =>a.code==' ') === -1)
      {
      event.preventDefault();
      }
      else if(event.target.value.length < subElement.length ){
        event.target.value = event.target.value +' ';
        if (this.field.tag == 'Leader' && this.leaderDataWithHyphons && (subElement.element === '17' || subElement.element === '18')) {
          let value =  event.target.value;
          this.leaderDataWithHyphons = this.replaceString(
            parseInt(subElement.element),
            parseInt(subElement.element) + parseInt(subElement.length),
            value == ' ' ? '#' : (value == '' ? '-' : value),
            this.leaderDataWithHyphons
          );
          this.leaderDataWithHyphonsChange.emit(this.leaderDataWithHyphons);
        }
      }
    }
  }
  onShiftEnterPress(event: any) {
    if (event.preventDefault) {
      event.preventDefault();
    }
    event.returnValue = false;
    event.stopPropagation();
  }
  onDelete() {
    this.onAltDelete.emit();
  }
  deActivateMoveNextByMaxLength(event: any) {
    this.canMoveNextByMaxLength = false;
  }
  validateLeaderDataOnChange(
    event: any,
    subElement: any,
    field: any,
    isAutoSelect: any,
    index: any,
    autocompletetrigger: any,
  ) {
    // TODO: State Mgmt Issue
    this.canMoveNextByMaxLength = true;
    this.updatedLeaderValue = '';
    let val = isAutoSelect ? event.option.value : event.target.value;
    if (val.indexOf('#') > -1 && event.target) {
      val = val.replace(/#/g, '');
      event.target.value = val;
    }
    // if (val.match(/[A-Z]/) && event.target) {
    //   event.target.value = val.replace(/[A-Z]/g, '');
    //   return false;
    // }
    val = isAutoSelect ? event.option.value : event.target.value;
    this.formData.form.markAsDirty();
    subElement['isValid'] = true;
    val = val == '' ? ' ' : val;
    if (!this.isValidSubElementData(subElement, val, false)) {
      subElement['isValid'] = false;
    }

    if (subElement['isValid'] == false) {
      if (event.target) {
        event.target.classList.add('border-danger');
      }
    }
    if (subElement.length == 1) {
      this.updatedLeaderValue = this.replaceString(
        parseInt(subElement.element),
        parseInt(subElement.element) + parseInt(subElement.length),
        val,
        this.value
      );
      if (this.leaderDataWithHyphons == undefined || this.leaderDataWithHyphons == null) {
        this.leaderDataWithHyphons = this.field.data;
      }
      if (this.field.tag == 'Leader' && this.leaderDataWithHyphons && (subElement.element === '17' || subElement.element === '18')) {
        let value = isAutoSelect ? event.option.value : event.target.value;
        this.leaderDataWithHyphons = this.replaceString(
          parseInt(subElement.element),
          parseInt(subElement.element) + parseInt(subElement.length),
          value == ' ' ? '#' : (value == '' ? '-' : value),
          this.leaderDataWithHyphons
        );
        this.leaderDataWithHyphonsChange.emit(this.leaderDataWithHyphons);
      }
    }
    if (parseInt(subElement.length) > 1) {
      if (parseInt(val.length) != parseInt(subElement.length)) {
        for (let i = 0; i < parseInt(subElement.length) - parseInt(val.length); i++) {
          val = val + ' ';
        }
      }
      this.updatedLeaderValue = this.replaceString(
        parseInt(subElement.element.split('-')[0]),
        parseInt(subElement.element.split('-')[0]) + parseInt(subElement.length),
        val,
        this.value
      );
    }
    if (this.field.tag == '006' || this.field.tag == '007' && val && val.length == 1) {
      const value = subElement.values.find(a => a.code == val);
      if (value && value.materialType && value.materialType != null) {
        const relativefields = subElement.materialType.find(a => a.type.toLowerCase() == value.materialType.toLowerCase());
        if (relativefields) {
          const subElements1 = this.tagData.subElements[0];
          this.tagData.subElements = [];
          this.tagData.subElements.push(subElements1);
          Array.prototype.push.apply(this.tagData.subElements, relativefields.relativefields);
        }
      }
    }
    if (isAutoSelect && event.source) {
      const fieldIndex = this.fieldIndex;
      setTimeout(() => {
        let id = '#dateEnteredOn-life' + (index + 1);
        id = id + fieldIndex;
        const elem: any = document.getElementById('dateEnteredOn-life' + (index + 1) + '' + fieldIndex);
        if (elem != null) {
          this.renderer2.selectRootElement('#dateEnteredOn-life' + (index + 1) + '' + fieldIndex).select();
        } else {
          const e: any = document.getElementById('dateEnteredOn-life' + (index) + '' + fieldIndex);
          if (e && e.parentElement && e.parentElement.nextElementSibling) {
            const nextControl: any = e.parentElement.nextElementSibling.children;
            let i = 0;
            while (nextControl[i]) {
              if (nextControl[i]) {
                if (nextControl[i].type === e.type && nextControl[i].hidden == false) {
                  nextControl[i].select();
                  return;
                }
              } else {
                return;
              }
              i++;
            }
          }
        }
      }, 0);
    }

  }
  validateDataOnChange(
    event: any,
    subElement: any,
    field: any,
    isAutoSelect: any,
    index: any,
    autocompletetrigger: any,
  ) {
    // TODO: State Management Issue
    this.canMoveNextByMaxLength = true;
    this.newValue = '';
    this.formData.form.markAsDirty();
    // if (subElement.isEditable) {
    //   if (subElement.validationRules && subElement.validationRules.length > 0) {
    subElement['isValid'] = true;
    let val = isAutoSelect ? event.option.value : event.target.value;
    if (val.indexOf('#') > -1 && event.target) {
      val = val.replace(/#/g, '');
      event.target.value = val;
    }
    // if (val.match(/[A-Z]/) && event.target) {
    //   event.target.value = val.replace(/[A-Z]/g, '');
    //   return false;
    // }
    val = isAutoSelect ? event.option.value : event.target.value;
    val = val == '' ? ' ' : val;
    if (!this.isValidSubElementData(subElement, val, false)) {
      subElement['isValid'] = false;
    }

    if ((this.field.tag == '006' || this.field.tag == '007') && subElement.element == '00' && (val && val.length == 1)) {
      const value = subElement.values.find(a => a.code == val);
      if (value && value.materialType && value.materialType != null) {
        const relativefields = subElement.materialType.find(a => a.type.toLowerCase() == value.materialType.toLowerCase());
        if (relativefields) {
          const subElements1 = this.tagData.subElements[0];
          this.tagData.subElements = [];
          this.tagData.subElements.push(subElements1);
          Array.prototype.push.apply(this.tagData.subElements, relativefields.relativefields);
          this.isSingleEle = true;
        }
      }
      if (val.trim() == '' && value == undefined) {
        this.tagData.subElements.splice(1, this.tagData.subElements.length);
        this.isSingleEle = true;
        // this.setFirstElementFocus();
      }
    }
    if ((subElement.element == '00' && (this.field.tag == '006' || this.field.tag == '007')) || (this.field.tag == '008' && (this.value == null || this.value.trim() == ''))) {
      this.value = '';
      const arraylen = this.tagData.subElements[this.tagData.subElements.length - 1].element.split('-');
      const spacesNeedtoAdd = parseInt(arraylen[arraylen.length - 1]) + 1;
      this.value = this.value + (new Array(spacesNeedtoAdd + 1)).join(' ');
      if ((this.field.tag == '007' || this.field.tag == '006') && this.originalData && this.originalData.charAt(0) == val.trim()) {
        this.value = this.originalData;
      }
    }
    if (subElement.length == 1) {
      this.newValue = this.replaceString(
        parseInt(subElement.element),
        parseInt(subElement.element) + parseInt(subElement.length),
        val,
        this.value
      );
    }
    if (parseInt(subElement.length) > 1) {
      if (parseInt(val.length) != parseInt(subElement.length)) {
        val = val + (new Array(parseInt(subElement.length) + 1 - val.length)).join(' ');
      }
      this.newValue = this.replaceString(
        parseInt(subElement.element.split('-')[0]),
        parseInt(subElement.element.split('-')[0]) + parseInt(subElement.length),
        val,
        this.value
      );
    }
    if (isAutoSelect) {
      this.setNextElementFocus(index, isAutoSelect);
    }
  }
  updateNewValue(isLeader: boolean) {
    const isValidRow = this.tagData.subElements.filter(x => x.isValid == false).length > 0 ? false : true;
    if (!isLeader && this.newValue !== '') {
      this.valueUpdate.emit({
        oldValue: this.value,
        updatedvalue: this.newValue,
        isValidRow,
        fieldIndex: this.fieldIndex
      });
      this.newValue = '';
    } else if (isLeader && this.updatedLeaderValue != '') {
      this.valueUpdate.emit({
        oldValue: this.value,
        updatedvalue: this.updatedLeaderValue,
        isValidRow,
        fieldIndex: this.fieldIndex
      });
      this.updatedLeaderValue = '';
    } else {
      this.valueUpdate.emit({
        oldValue: this.value,
        updatedvalue: this.value,
        isValidRow,
        fieldIndex: this.fieldIndex
      });
    }
  }
  isValidSubElementData(subElement: any, value: any, isOnLoad: boolean) {
    let isValid = true;
    if (!this.overrideValidation) {
      if (!isOnLoad && subElement && subElement.element == '35-37' && this.field.tag == '008') {
        this.isValidLang = true;
      }
      if (
        value &&
        value != null &&
        value.trim() != '' &&
        subElement.validationRules &&
        subElement.validationRules != null
      ) {
        if (subElement.length > 1) {
          if (subElement.length == 4 && value == '||||') {
            isValid = true;
            return isValid;
          } else if (subElement.length == 2 && value == '||') {
            isValid = true;
            return isValid;
          } else if (subElement.length == 3) {
            if (value == '|||') {
              isValid = true;
              return isValid;
            }
            if (
              subElement.element == '06-08' &&
              subElement.description == 'Image bit depth (06-08)'
            ) {
              if (value > 0 && value < 1000) {
                isValid = true;
                return isValid;
              }
            }
            if (subElement.description.indexOf('Running time for motion pictures and videorecordings') > -1) {
              if (value >= 0 && value < 1000 || (value == '---') || (value == 'nnn')) {
                isValid = true;
                return isValid;
              } else {
                isValid = false;
              }
            }
          }
          if (
            value.length == subElement.length && subElement.validationRules != null && subElement.validationRules.length > 0 &&
            subElement.validationRules[0].length == subElement.length
          ) {
            if (value.trim() != '' && !isOnLoad && subElement.element == '35-37' && this.field.tag == '008') {
              const data = subElement.values.find(a => a.code == value);
              if (data === undefined) {
                isValid = false;
              }
              if (data && data.isDisable) {
                isValid = false;
                this.isValidLang = false;
              }
            } else if (
              value.trim() != '' &&
              subElement.validationRules.indexOf(value) == -1
            ) {
              isValid = false;
            }
          } else {
            if (subElement.validationRules.indexOf('#') > -1) {
              value = value.replace(/\s/g, '');
            }
            const data = value.split('');
            if (
              data &&
              (subElement.validationRules != undefined && subElement.validationRules.length > 0 &&
                data.some(x => subElement.validationRules.indexOf(x) == -1))
            ) {
              isValid = false;
            }
          }
        } else {
          // if (subElement.validationRules.indexOf(event.target.value) == -1) {
          if (
            value.trim() != '' &&
            subElement.validationRules.indexOf(value) == -1
          ) {
            isValid = false;
          }
        }
      }
      if (
        subElement && subElement.description.indexOf('Place of publication, production, or execution') > -1
      ) {
        const pattern = /^[a-z\s]+$/;
        if (value && value != null && value.trim() != '') {
          if (!(pattern.test(value))) {
            isValid = false;
          } else {
            isValid = true;
          }
          return isValid;
        }
      }
    }
    return isValid;
  }
  setFirstElementFocus() {
    const subscriber = new EventEmitter<boolean>();
    subscriber.subscribe((val) => {
      this.focusFirstSubelement();
    });
    this.scrolltoPosition(subscriber);
  }
  setNextElementFocus(index: number, isAutoSelect: boolean = true) {
    const subscriber = new EventEmitter<boolean>();
    if (isAutoSelect) {
      subscriber.subscribe(() => {
        this.focusNextSubelement(index);
      });
    }
    // Hardcoded to greater than one so that scroll will happen when the focus goes to third sub-component.
    // Ideally there should be a configuration paramenter that says how many columns per row.
    if (index > 1) {
      this.scrolltoPosition(subscriber);
    } else {
      if (isAutoSelect) {
        this.focusNextSubelement(index);
      }
    }
  }
  focusFirstSubelement() {
    setTimeout(() => {
      const fieldIndex = this.fieldIndex;
      if (this.field.tag === '006' || this.field.tag === '007') {
        this.renderer2.selectRootElement(`#dateEnteredOn-life0${fieldIndex}`).select();
      } else {
        this.renderer2.selectRootElement(`#dateEnteredOn-life1${fieldIndex}`).select();
      }
    }, 0);
  }
  focusNextSubelement(index: number) {
    setTimeout(() => {
      const elem: any = document.getElementById('dateEnteredOn-life' + (index + 1) + '' + this.fieldIndex);
      if (elem != null) {
        this.renderer2.selectRootElement('#dateEnteredOn-life' + (index + 1) + '' + this.fieldIndex).select();
      } else {
        const e: any = document.getElementById('dateEnteredOn-life' + (index) + '' + this.fieldIndex);
        if (e && e.parentElement && e.parentElement.nextElementSibling) {
          const nextControl: any = e.parentElement.nextElementSibling.children;
          let i = 0;
          while (nextControl[i]) {
            if (nextControl[i]) {
              if (nextControl[i].type === e.type && nextControl[i].hidden === false) {
                nextControl[i].select();
                return;
              }
            } else {
              return;
            }
            i++;
          }
        }
      }
    }, 0);
  }
  scrolltoPosition(subscriber: EventEmitter<boolean>) {
    setTimeout(() => {
      let subElementScrollTarget = '';
      if (this.field.tag === '006' || this.field.tag === '007') {
        subElementScrollTarget = `#dateEnteredOn-life0${this.fieldIndex}`;
      } else {
        subElementScrollTarget = `#dateEnteredOn-life1${this.fieldIndex}`;
      }
      if (this.fieldIndex > 1) {
        this.pageScrollService.scroll({
          document: this.document,
          scrollTarget: subElementScrollTarget,
          scrollViews: [document.getElementById('marceditgrid')],
          scrollOffset: 45,
          advancedInlineOffsetCalculation: true,
          interruptible: false,
          scrollFinishListener: subscriber,
        });
      } else {
        this.pageScrollService.scroll({
          document: this.document,
          scrollTarget: subElementScrollTarget,
          scrollViews: [document.getElementById('marceditgrid')],
          scrollOffset: 45,
          advancedInlineOffsetCalculation: true,
          interruptible: false,
          scrollFinishListener: subscriber,
        });
      }


    }, 0);
  }
}

