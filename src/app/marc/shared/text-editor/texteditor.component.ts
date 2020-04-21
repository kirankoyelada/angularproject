import {
  Component, Input, OnInit, ViewChild, ElementRef, EventEmitter, Output,
  ChangeDetectionStrategy, SimpleChanges, ChangeDetectorRef, OnChanges, forwardRef
} from '@angular/core';
import * as $ from 'jquery';
import { Router } from '@angular/router';
import { NgForm, ControlContainer, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { modelGroupProvider } from '@angular/forms/src/directives/ng_model_group';
import { MarcSettingsService } from 'src/app/services/marc-settings.service';
import { MarcBibData, MarcEditorSettings, MarcBibSubFields } from '../marc';
import { EventParams, MarcFieldDTO, MarcSubFieldDTO } from 'src/app/_dtos/btcat.vm.dtos';
import { ClonerService } from 'src/app/services/cloner.service';
declare const CodeMirror: any;
import { Constants } from 'src/app/constants/constants';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { UserConfigurationService } from 'src/app/users/user-configuration.service';
@Component({
  // tslint:disable-next-line: component-selector
  selector: 'text-editor',
  templateUrl: './texteditor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => TextEditorComponent),
    }
  ],
  styles: []
})
export class TextEditorComponent implements OnInit, OnChanges, ControlValueAccessor {
  @ViewChild('codeM') input: ElementRef;
  @ViewChild(NgbTooltip) toolTip: NgbTooltip;
  @Input() public hintFilter: string;
  @Input() public authorityData: any;
  @Input() readonly = false;
  @Input() allowRevealingSpaces = false;
  @Input() cmEditorId: string; // used to fix ADA issue
  @Input() data: string;
  @Output() dataChange = new EventEmitter<string>();
  // tslint:disable-next-line: no-output-on-prefix
  @Output() blur = new EventEmitter<string>();
  @Input() SubFieldData: MarcSubFieldDTO[];
  @Input() form: NgForm;
  @Input() name: string;
  @Input() overrideValidation: boolean;
  delimiter = '';
  // tslint:disable-next-line: no-output-on-prefix
  @Output() onEnter = new EventEmitter();
  // tslint:disable-next-line: no-output-on-prefix
  @Output() onKeyboardUpDown = new EventEmitter<EventParams>();
  // tslint:disable-next-line: no-output-on-prefix
  @Output() onShiftTab = new EventEmitter<EventParams>();
  // tslint:disable-next-line: no-output-on-prefix
  @Output() onAltDelete = new EventEmitter();
  @Input() public field: MarcFieldDTO;
  errMsg = '';
  hintData: MarcBibSubFields[] = [];
  editor: any;
  marcSettings: MarcEditorSettings;
  marcBibData: MarcBibData;
  parentElement: any;
  isValid = true;
  @Input() isValidateSubfield :boolean = true;
  isISBN_UPC_ISSN_Valid = true;
  issubfieldAutoCompleteOpen = false;
  tooltipClass = ''; // 'warningTooltip'
  private isIEBrowser = /msie\s|trident\//i.test(window.navigator.userAgent);
  lengthValidations: any[] = [
    {
      tag: '020',
      subFields: [
        {
          code: 'a',
          minLength: 10,
          maxLength: 13,
        },
        {
          code: 'z',
          minLength: 10,
          maxLength: 13,
        },
      ]
    },
    {
      tag: '022',
      subFields: [
        {
          code: 'a',
          minLength: 9,
          maxLength: 9,
        },
      ],
    },
    {
      tag: '024',
      subFields: [
        {
          code: 'a',
          minLength: 12,
          maxLength: 12,
        },
      ],
      indicator: 1
    },
    {
      tag: '024',
      subFields: [
        {
          code: 'a',
          minLength: 14,
          maxLength: 14,
        },
      ], indicator: 7
    }
  ];
  taglengthToValidate: any[] = [
    {
      tag: '020',
      subField: 'a'
    },
    {
      tag: '020',
      subField: 'z'
    },
    {
      tag: '022',
      subField: 'a'
    },
    {
      tag: '024',
      subField: 'a',
      indicator: '1'
    },
    ,
    {
      tag: '024',
      subField: 'a',
      indicator: '7'
    }
  ];
  mandatorySubfields: any[] = [
    {
      tag: '040',
      subFields: [
        'a', 'c'
      ],
    },
    {
      tag: '245',
      subFields: [
        'a'
      ],
    },
    {
      tag: '260',
      subFields: [
        'c'
      ],
    },
    {
      tag: '264',
      subFields: [
        'c'
      ],
    },
    {
      tag: '300',
      subFields: [
        'a'
      ],
    },
  ];
  constructor(private router: Router, private elRef: ElementRef,
              private cdr: ChangeDetectorRef,
              private marcSettingsService: MarcSettingsService,
              private userConf: UserConfigurationService,
              private clonerService: ClonerService) {
    // To ensure that if User Preference is changed its reflected
    this.userConf.revealSpaces$.subscribe(showSpaces => this.revealSpaces(showSpaces));
  }

  emitValue() {
    this.dataChange.emit(this.editor ? this.editor.getValue() : this.data);
  }

  revealSpaces(revealSpaces: boolean) {
    if ( this.editor && this.allowRevealingSpaces ) {
      if (revealSpaces) {
         this.editor.setOption('specialChars',  /[ ]/ );
      } else {
        this.editor.setOption('specialChars',  /[]/ );
      }
    }
  }

  propagateChange = (_: any) => { };

  // Lifecycle Events
  ngOnInit() {
    this.parentElement = this.elRef.nativeElement;
    this.marcSettings = this.marcSettingsService.getMarcSettingsData();
    this.marcBibData = this.marcSettingsService.getMarcBibDataByTag(this.hintFilter);
    this.delimiter = this.marcSettings.delimiter;
    this.hintData = this.marcBibData ? this.marcBibData.subfields : [];
   
    this.overrideCmStyle();

    this.initializeCm();
    this.setTextAreaId();
    this.extraKeyEventHandler();

    if (this.editor && this.data && this.data.trim() === '') {
      if (!this.editor.getValue().trim().endsWith(this.editor.getOption('delimiter'))) {
        this.editor.replaceSelection(this.editor.getOption('delimiter'));
      }
    }
    this.registerCodeMirrorEvents();
    this.hyperlinkOverlay(this.editor, this.SubFieldData);
    this.revealSpaces(this.userConf.getRevealSpaces()); // Set the reveal spaces user's preference
  }

  ngOnChanges(changes: SimpleChanges): void {
    // TODO: Need to handle this in a better way while working on validation optimization
    if (this.editor && changes.hintFilter && changes.hintFilter.currentValue !== changes.hintFilter.previousValue) {
      this.marcBibData = this.marcSettingsService.getMarcBibDataByTag(this.hintFilter);
      this.hintData = this.marcBibData ? this.marcBibData.subfields : [];
      this.updateCmSettings();
    }
    if (changes.data && changes.data.currentValue !== changes.data.previousValue) {
      this.updateCmSettings();
    }

    if (changes.readonly && changes.readonly.currentValue !== changes.readonly.previousValue) {
      if (this.editor) {
        this.editor.setOption('readOnly', this.readonly);
      }
    }
    this.setTextAreaId();
  }
  ngAfterViewInit(): void {
     this.overrideCmStyle();
  }
  // ngAfterViewChecked() {
  //   this.overrideCmStyle();
  // }
  private initializeCm() {
    const code = this.input.nativeElement;
    if (this.input.nativeElement) {
      // console.log(code);
      this.editor = CodeMirror(code, {
        value: this.data,
        mode: 'simplemode',
        delimiter: this.delimiter,
        hintdata: this.hintData,
        closeOnUnfocus: true,
        lineWrapping: true,
        viewportMargin: 1,
        lineWiseCopyCut: false,
        readOnly: this.readonly,
        specialCharPlaceholder: () => {
          const node = document.createElement('span');
          node.innerHTML = '□';
          node.className = '';
          return node;
        }
      });
      this.propagateChange(this.editor.getValue());
      CodeMirror.hint.javascript = (cm) => {
        const inner = { from: cm.getCursor(), to: cm.getCursor(), list: [] };
        $.each(cm.getOption('hintdata'), (i, e) => {
          inner.list.push({ text: e.code, displayText: e.code + ' - ' + e.description });
        });
        return inner;
      };
    }
  }

  private updateCmSettings() {
    if (this.editor) {
      this.editor.setOption('hintdata', this.hintData);
    }
    this.parentElement = this.elRef.nativeElement;
    this.overrideCmStyle();
  }

  private overrideCmStyle() {
    if (this.marcSettings){
      $('.cm-keyword').attr('style', 'color: ' + this.marcSettings.subfieldcolor + ' !important;font-family:'+this.marcSettings.font + ' !important;font-size:'+this.marcSettings.fontsize+ ' !important');
      if(this.editor) {
      // $('pre').attr('style', 'font-size:!inherit;font-family:'+this.marcSettings.font + ' !important');
      // $('.CodeMirror').attr('style', 'font-size:'+this.marcSettings.fontsize+ ' !important;font-family:'+this.marcSettings.font + ' !important');
      var tokens = this.editor.getLineTokens(1, true);
      if(tokens && tokens.length >0)
      {
      var start = CodeMirror.Pos(0, tokens[0].start);
      var end = CodeMirror.Pos(0, tokens[tokens.length -1].end);
      this.editor.getDoc().markText(start,end,{
        css: "font-size :"+ this.marcSettings.fontsize+";font-family:"+this.marcSettings.font
          });
      }
      $('.cm-keyword').attr('style', 'color: ' + this.marcSettings.subfieldcolor + ' !important;font-family:'+this.marcSettings.font + ' !important;font-size:'+this.marcSettings.fontsize+ ' !important');
    }
  }
  }

  writeValue(obj: any): void {
    if (this.editor && this.editor.getDoc() && this.editor.getDoc().cm) {
      const value = obj ? obj : '';
      this.editor.getDoc().cm.setValue(value);
    }
  }
  registerOnChange(fn: any): void {
    this.editor.getDoc().cm.change = fn;
  }
  registerOnTouched(fn: any): void { }

  // Set id to textarea, which is used for ADA
  setTextAreaId() {
    const textAreaRef = $(this.input.nativeElement).find('*').find('textarea');
    if (textAreaRef) {
      $(textAreaRef).attr('id', this.cmEditorId);
    }
  }
  // Code Mirror Event Handlers
  private extraKeyEventHandler() {
    this.editor.setOption('extraKeys', {
      Tab: (cm) => {
        this.tabPressedHandler(cm);
      },
      'Shift-Tab': (cm) => {
        this.shifttabPresedHandler(cm);
      },
      'Ctrl-D': (cm) => {
        this.ctrldPressedHandler(cm);
      },
      'Alt-Delete': (cm) => {
        this.altDeleteHandler(cm);
      },
      Alt: () => {
        this.altHandler();
      },
      Enter: () => {
        this.onEnter.emit();
      },
      Up: (cm) => {
        return this.keyupHandler(cm);
      },
      Down: (cm) => {
        return this.keydownHandler(cm);
      }
    });
  }
  private altHandler() {
    return CodeMirror.Pass;
  }
  private tabPressedHandler(cm: any) {
    const currentCursor = cm.getCursor();
    const val = cm.getValue();
    const ch = val.indexOf(cm.getOption('delimiter'), currentCursor.ch);
    if (ch !== -1) {
      if (val[ch + 1] === cm.getOption('delimiter')) {
        cm.setCursor({ line: currentCursor.line, ch: ch + 1 });
      }
      else if (val[ch + 2] === cm.getOption('delimiter')) {
        cm.setCursor({ line: currentCursor.line, ch: ch + 2 });
      }
      else if (val[ch + 2] === ' ' ) {
        cm.setCursor({ line: currentCursor.line, ch: ch + 3 });
      } else {
        cm.setCursor({ line: currentCursor.line, ch: ch + 2 });
      }
    } else {
      if (this.parentElement && this.parentElement.nextElementSibling &&
        this.parentElement.nextElementSibling.children && this.parentElement.nextElementSibling.children.length > 0) {
        // if drag icon is hidden, then focus delete icon
        if (!this.parentElement.nextElementSibling.children[0].hidden) {
          this.parentElement.nextElementSibling.children[0].focus();
        }
        else if (this.parentElement.nextElementSibling.children[1]) {
          this.parentElement.nextElementSibling.children[1].focus();
        }
      }
    }
  }
  private shifttabPresedHandler(cm: any) {
    const currentCursor = cm.getCursor();
    const val = cm.getValue();
    const delimiter = cm.getOption('delimiter');
    // exclude current position if current position is delimiter
    // tslint:disable-next-line: max-line-length
    const currentDelimiterIndex = val.lastIndexOf(delimiter, (currentCursor.ch > 0 && val[currentCursor.ch] === delimiter) ? currentCursor.ch - 1 : currentCursor.ch);
    const ch = val.lastIndexOf(delimiter, currentDelimiterIndex > 0 ? currentDelimiterIndex - 1 : currentDelimiterIndex);
    if (ch !== -1 && currentDelimiterIndex > 0) {
      if (val[ch + 1] === cm.getOption('delimiter')) {
        cm.setCursor({ line: currentCursor.line, ch: ch + 1 });
      }
      else if (val[ch + 2] === cm.getOption('delimiter')) {
        cm.setCursor({ line: currentCursor.line, ch: ch + 2 });
      }
      else if (val[ch + 2] === ' ') {
        cm.setCursor({ line: currentCursor.line, ch: ch + 3 });
      } else {
        cm.setCursor({ line: currentCursor.line, ch: ch + 2 });
      }
    } else {
      const shiftTabEmitterParams: EventParams = {
        controlName: 'marcDesc',
        position: currentCursor,
        action: 'focus-left-element'
      };
      this.onShiftTab.emit(shiftTabEmitterParams);
    }
  }
  private ctrldPressedHandler(cm: any) {
    const currentCursor = cm.getCursor();
    const val = cm.getValue();
    if (val && val[currentCursor.ch - 1] !== cm.getOption('delimiter') || (val === null || val === '' || val === undefined)) {
      cm.replaceSelection(cm.getOption('delimiter'));
    }
    this.displayMention(cm);
    this.mentionSelectionCompletionHandler(cm, this.editor);
  }
  private altDeleteHandler(cm: any) {
    this.onAltDelete.emit();
  }
  private keyupHandler(cm: any) {
    const pos = cm.getCursor(); // or {line , ch };
    const tok = cm.getLineTokens(pos.line);
    const firstPosition = tok[0];
    const firstRowTopPosition = this.editor.charCoords({ line: pos.line, ch: firstPosition ? firstPosition.start : 0 }, 'local').top;
    const CursorRowTopPosition = this.editor.charCoords(pos, 'local').top;
    if (CursorRowTopPosition === firstRowTopPosition) {
      CodeMirror.signal(cm, 'cursormovenext', { action: 'focus-top-element', pos });
    } else {
      return CodeMirror.Pass;
    }
  }
  private keydownHandler(cm: any) {
    const pos = cm.getCursor(); // or {line , ch };
    const tok = cm.getLineTokens(pos.line);
    const lastPosition = tok[tok.length - 1];
    const lastRowBottomPosition = cm.cursorCoords({ line: pos.line, ch: lastPosition ? lastPosition.end : 0 }, 'local').bottom;
    const CursorRowBottomPosition = cm.cursorCoords(pos, 'local').bottom;
    // Identify bottom line and character position, when text is wrapped
    if (CursorRowBottomPosition === lastRowBottomPosition) {
      const firstRowBottomPosition = this.editor.cursorCoords({ line: pos.line, ch: 0 }, 'local').bottom;
      // wrapped text
      if (firstRowBottomPosition !== lastRowBottomPosition) {
        let bottomStartPosition = pos.ch;
        let bottomRowStartPosition = CursorRowBottomPosition;
        while (bottomRowStartPosition === CursorRowBottomPosition && bottomStartPosition > 0) {
          bottomStartPosition = bottomStartPosition - 1;
          bottomRowStartPosition = cm.cursorCoords({ line: pos.line, ch: bottomStartPosition }, 'local').bottom;
        }
        if (pos.ch != bottomStartPosition) {
          bottomStartPosition = bottomStartPosition + 1;
        }
        CodeMirror.signal(cm, 'cursormovenext', {
          action: 'focus-bottom-element',
          pos: { line: pos.line, ch: pos.ch - bottomStartPosition }
        });
      } else {
        CodeMirror.signal(cm, 'cursormovenext', { action: 'focus-bottom-element', pos });
      }
    } else {
      return CodeMirror.Pass;
    }
  }
  // Autocomplete EventHandler
  private mentionSelectionCompletionHandler(cm, editor) {
    const completion = cm.state.completionActive;
    if (completion) {
      const pick = completion.pick;
      completion.pick = function(data, i) {
        pick.apply(this, arguments);
        // NO SPACE/NBSP Needed so deleted the code
      };
    }
  }
  // Component Event Handler
  focusHandler() {
    this.errMsg = '';
    this.isValid = true;
    this.isISBN_UPC_ISSN_Valid = true;
    const val = this.data;
    const length = val ? val.length : 0;
    if (this.editor) {
      this.editor.focus();
    }
    if (length !== 0 && this.data !== this.delimiter) {
      // focus to first sub field
      const currentCursor = this.editor.getCursor();
      const ch = this.data.indexOf(this.delimiter, 0);
      if (ch !== -1) {
        if (val[ch + 1] === this.delimiter) {
          this.editor.setCursor({ line: currentCursor.line, ch: ch + 1 });
        }
        else if (val[ch + 2] === this.delimiter) {
          this.editor.setCursor({ line: currentCursor.line, ch: ch + 2 });
        }
        else if (val[ch + 2] === ' ') {
          this.editor.setCursor({ line: currentCursor.line, ch: ch + 3 });
        } else {
          this.editor.setCursor({ line: currentCursor.line, ch: ch + 2 });
        }
      }
    }
  }
  onBlur(changes: any) {
    // TODO: Temporray solution. Will handle while refactoring for validation
    this.updateCmSettings();
    this.validateData(this.data);
    this.blur.emit(this.data);
  }
  // focussed from next control(shift-tab)
  focusLastSubfield() {
    const val = this.data;
    const length = val ? val.length : 0;
    this.editor.focus();
    if (length !== 0 && this.data !== this.delimiter) {
      // focus to last sub field
      const currentCursor = this.editor.getCursor();
      const ch = this.data.lastIndexOf(this.delimiter, length);
      if (ch !== -1) {
        if (val[ch + 2] === ' ' ) {
          this.editor.setCursor({ line: currentCursor.line, ch: ch + 3 });
        } else {
          this.editor.setCursor({ line: currentCursor.line, ch: ch + 2 });
        }
      }
    }
  }

  // Register CodeMirror Events
  registerCodeMirrorEvents() {
    // Custom event to handle up & down arrow key press from the editor
    this.editor.on('cursormovenext', (args) => {
      const keyboardEmitterParams: EventParams = {
        controlName: 'marcDesc',
        position: args.pos,
        action: args.action
      };
      this.onKeyboardUpDown.emit(keyboardEmitterParams);
    });
    this.editor.on('change', (cm, changeObj) => {
      const pos = cm.getCursor(); // or {line , ch };
      const tok = cm.getTokenAt(pos);

      if (changeObj.origin === '+delete') {
        const val = cm.getValue();
        const isDelimiter = tok.string === cm.getOption('delimiter') || (val && val[pos.ch - 1] === cm.getOption('delimiter'));
        if (isDelimiter) {
          this.displayMention(cm);
          this.mentionSelectionCompletionHandler(cm, this.editor);
        }
      }
      this.field.isSubFieldChanged = true;
      // Close autocomplete on input or paste
      if (cm.state.completionActive && tok.string !== cm.getOption('delimiter') &&
        // tslint:disable-next-line: max-line-length
        ((changeObj.origin === '+input' && changeObj.text && changeObj.text[0] !== cm.getOption('delimiter')) || changeObj.origin === 'paste')) {
        CodeMirror.commands.autocomplete(cm, null);
      }
      // this.cdr.markForCheck();
      this.form.form.markAsDirty();
      this.propagateChange(cm.getValue());
      this.emitValue();
    });
    this.editor.on('focus', (cm, changeObj) => {
      // Clear validation on focus
      this.toolTip.close();
      this.errMsg = '';
      this.isValid = true;
      this.isISBN_UPC_ISSN_Valid = true;
      if (cm.getValue().trim() === '') {
        cm.replaceSelection(cm.getOption('delimiter'));
        if (this.hintData && this.hintData.length > 0) {
          this.displayMention(cm);
          this.mentionSelectionCompletionHandler(cm, this.editor);
        }
      } else {
        setTimeout(() => {
          const pos = cm.getCursor(); // or {line , ch };
          const tok = cm.getTokenAt(pos);
          if (tok.string === cm.getOption('delimiter')) {
            this.displayMention(cm);
            this.mentionSelectionCompletionHandler(cm, this.editor);
          }
        }, 100);
      }
    });
    this.editor.on('blur', (cm, changeObj) => {
        if (cm.getSelection()) {
          const currentCursor = this.editor.getCursor();
          this.editor.setCursor({ line: currentCursor.line, ch: currentCursor.ch });
        }
        //Validate onblur even if autocomplete is open
        if(!this.readonly){
          this.validateData(cm.getValue());
          this.blur.emit(this.editor ? this.editor.getValue() : this.data);
        }
    });

    this.editor.on('beforeChange', (cm, changeObj) => {
      const typedNewLine = changeObj.origin === '+input' && typeof changeObj.text === 'object' && changeObj.text.join('') === '';
      if (typedNewLine) {
        return changeObj.cancel();
      }

      const pastedNewLine = changeObj.origin === 'paste' && typeof changeObj.text === 'object' && changeObj.text.length > 1;
      if (pastedNewLine) {
        const newText = changeObj.text.join(' ');
        return changeObj.update(null, null, [newText]);
      }

      return null;
    });

    this.editor.on('endCompletion', (cm) => {
      this.issubfieldAutoCompleteOpen = false;
      // Validate data when auto complete close due to focusout
      if (!cm.state.focused) {
        this.validateData(cm.getValue());
      }
    });

  }
  checkRepeat(str) {
    if(str && str !=null && str !='')
    {
     return str.indexOf(this.marcSettings.delimiter+this.marcSettings.delimiter) >-1?true : false;
    }
  }
  // Editor Private Methods
  validateData(value: string, checkFromParent: boolean = false) {
    if(value != null){
      value = value.trim();
    }
    this.isValid = true;
    if (!this.overrideValidation && this.isValidateSubfield == true) {
      this.isISBN_UPC_ISSN_Valid = true;
      this.errMsg = '';
      let repeatErrorMsg = '';
      let invalidErrorMsg = '';
      let invalidDataErrorMsg = '';
      let obsoleteErrorMsg = '';
      const mandatoryFieldsErrorMsg = '';
      const hasHintData = this.hintData && this.hintData.length > 0;
      const regexp = new RegExp('^[a-z0-9]{1}$');
      if (this.marcSettings && value && value != null && value != this.marcSettings.delimiter ) {
        if (value.trimLeft().indexOf(this.marcSettings.delimiter) != 0 && value.trimLeft().charAt(0) != this.marcSettings.delimiter) {
          invalidErrorMsg = 'Invalid';
          this.tooltipClass = 'editDescErrorTooltip';
          this.isValid = false;
        } else {
          const subFieldData = value
            .split(this.marcSettings.delimiter);
          if (subFieldData && subFieldData.length > 0 && subFieldData[0] == '') {
            subFieldData.shift();
          }
          const codeData = subFieldData.map(a => a.charAt(0));

          const codeArr = [];
          subFieldData.forEach(ele => {
            if (ele) {
              const subFieldCode = ele.charAt(0);
              let sfdata = ele.slice(1);
              const subFieldExists = hasHintData ? this.hintData.find(
                c => c.code === subFieldCode
              ) : null;
              codeArr.push(subFieldCode);
              const msg = (this.marcSettings.delimiter + subFieldCode);
              if (hasHintData && subFieldExists) {
                if (subFieldExists.isObsolete && this.field.isSubFieldChanged === true) {
                  this.tooltipClass = 'editDescErrorTooltip';
                  this.isValid = false;
                  if (obsoleteErrorMsg.indexOf(subFieldCode) === -1) {
                    obsoleteErrorMsg = obsoleteErrorMsg !== '' ? (obsoleteErrorMsg + ', ' + msg) : msg;
                  }
                  return;
                }
                if (!subFieldExists.repeatable) {
                  const findDuplicates = codeData.filter(h =>
                    h.includes(subFieldCode)
                  );
                  if (findDuplicates && findDuplicates.length > 1) {
                    this.tooltipClass = 'editDescErrorTooltip';
                    this.isValid = false;
                    if (repeatErrorMsg.indexOf(subFieldCode) === -1) {
                      repeatErrorMsg = repeatErrorMsg !== '' ? (repeatErrorMsg + ', ' + msg) : msg;
                    }
                  }
                }
                let isValidate = this.taglengthToValidate.filter(h =>
                  h.tag == this.field.tag && h.subField == subFieldCode
                );

                if (this.field.tag == '024') {
                  isValidate = isValidate.filter(a => a.indicator == this.field.ind1);
                }
                if (isValidate && isValidate.length > 0) {
                  let startWthRegex = /^[0-9].*$/;
                  if (sfdata && !startWthRegex.test(sfdata)) {
                    this.tooltipClass = !this.isValid ? 'editDescErrorTooltip' : 'warningTooltip';
                    this.isISBN_UPC_ISSN_Valid = false;
                    if (invalidDataErrorMsg.indexOf(subFieldCode) === -1) {
                      invalidDataErrorMsg = invalidDataErrorMsg !== '' ? (invalidDataErrorMsg + ', ' + msg) : msg;
                    }
                  }
                  else if (sfdata && !Constants.validateISBNUPCData(subFieldCode, sfdata, this.field)) {
                    this.tooltipClass = !this.isValid ? 'editDescErrorTooltip' : 'warningTooltip';
                    this.isISBN_UPC_ISSN_Valid = false;
                    if (invalidDataErrorMsg.indexOf(subFieldCode) === -1) {
                      invalidDataErrorMsg = invalidDataErrorMsg !== '' ? (invalidDataErrorMsg + ', ' + msg) : msg;
                    }
                  }
                }
              } else {
                const isValidCode = hasHintData ? false : regexp.test(subFieldCode);
                if (!isValidCode) {
                  this.tooltipClass = 'editDescErrorTooltip';
                  this.isValid = false;
                  if (invalidErrorMsg.indexOf(subFieldCode) === -1) {
                    invalidErrorMsg = invalidErrorMsg !== '' ? (invalidErrorMsg + ', ' + msg) : msg;
                  }
                }
              }

            }
          });

          if (invalidErrorMsg !== '') {
            invalidErrorMsg = invalidErrorMsg + ' is invalid';
          }
          if (repeatErrorMsg !== '') {
            this.tooltipClass = 'editDescErrorTooltip';
            repeatErrorMsg = repeatErrorMsg + ' is not repeatable';
          }
          if (invalidDataErrorMsg !== '') {
            if (this.field && this.field.tag) {
              invalidDataErrorMsg = (this.field.tag === '020' ? 'ISBN' : (this.field.tag === '024' ? 'UPC' : 'ISSN')) + ' in ' + invalidDataErrorMsg;
            }
            invalidDataErrorMsg = invalidDataErrorMsg + ' is invalid';
          }
          if (obsoleteErrorMsg !== '') {
            this.tooltipClass = 'editDescErrorTooltip';
            obsoleteErrorMsg = obsoleteErrorMsg + ' is obsolete';
          }
        }
        if (this.checkRepeat(value)) {
          invalidErrorMsg = invalidErrorMsg != '' ? (this.marcSettings.delimiter + ',' + invalidErrorMsg) : (this.marcSettings.delimiter + ' is invalid');
          this.tooltipClass = 'editDescErrorTooltip';
          this.isValid = false;
        }
      }
      else if(!checkFromParent) {
          invalidErrorMsg = 'Required';
          this.tooltipClass = 'editDescErrorTooltip';
          this.isValid = false;
      }

      if (invalidErrorMsg !== '' || repeatErrorMsg !== '' || invalidDataErrorMsg !== '' || obsoleteErrorMsg !== '') {
        // tslint:disable-next-line: max-line-length
        this.errMsg = (invalidErrorMsg !== '' ? invalidErrorMsg + '\n' : '') + (repeatErrorMsg !== '' ? repeatErrorMsg + '\n' : '') + (invalidDataErrorMsg !== '' ? invalidDataErrorMsg + '\n' : '') + obsoleteErrorMsg;
      }

    }

  }

  private displayMention(cm) {
    cm.showHint({
      hint: (cm) => {
        const inner = { from: cm.getCursor(), to: cm.getCursor(), list: [] };
        $.each(cm.getOption('hintdata'), (i, e) => {
          if (!e.isObsolete || e.isObsolete === false) {
            inner.list.push({ text: e.code, displayText: e.code + ' - ' + e.description });
          }
        });
        if (inner.list.length > 0) {
          this.issubfieldAutoCompleteOpen = true;
        }
        return inner;
      }
    });
  }
  rightTrim(str) {
    if (str && str != '') {
      return str.replace(/\s+$/, "");
    }
  }
  private hoverWidgetOnOverlay(cm, overlayClass, subfield) {
    cm.getWrapperElement().addEventListener('click', e => {

      const onToken = e.target.classList.contains('cm-' + overlayClass);
      if (onToken) {
        const code = e.target.previousElementSibling.innerText.length > 1 ? e.target.previousElementSibling.innerText[1] : '';
        const data = e.target.innerText ? e.target.innerText.trim() : '';
        const authRecord = subfield.find(a => a.code === code && a.data && a.data.trim() === data);
        if (authRecord) {
          this.router.navigate([
            '/authority-view/',
            authRecord.authorityId
          ]);
        }
      }
    });
  }
  private hyperlinkOverlay(cm, subfield) {
    if (!cm) { return; }

    const rxword = cm.getOption('delimiter'); // Define what separates a word

    const actualWord = '';
    cm.addOverlay({
      token(stream) {
        let ch = stream.peek();
        let word = '';
        let code = '';
        let startPosition = 0;

        if (rxword.includes(ch) || ch === '\uE000' || ch === '\uE001') {
          stream.next();
          return null;
        }
        while ((ch = stream.peek()) && !rxword.includes(ch)) {
          if (ch !== ' ' && code === '') {
            code = ch;
            startPosition = startPosition + 1;
          } else {
            if (code !== '') {
              word += ch;
              if (word === ' ') {
                startPosition = startPosition + 1;
              }
            }
          }
          stream.next();
        }

        if (word.trim() === '') {
          return null;
        }

        if (word[0] === ' ') {
          word = word.substring(1);
        }
        stream.start = stream.start + startPosition;
        if (word.substring(word.length - 1) === ' ') {
          stream.pos = stream.pos - 1;
          word = word.substring(0, word.length - 1);
        }
        if (subfield && subfield.findIndex(a => a.code === code && a.data === word &&
          (a.authorityId != null && a.authorityId !== '')) !== -1) { return 'url'; } // CSS class: cm-url
      }
    },
      { opaque: true }  // opaque will remove any spelling overlay etc
    );

    this.hoverWidgetOnOverlay(cm, 'url', subfield);
  }
  checkData(checkFromParent :boolean = false) {
    if (this.editor) {
      if (this.hintFilter && this.hintFilter.length < 3) {
        this.marcBibData = this.marcSettingsService.getMarcBibDataByTag(this.field.tag);
        this.hintData = this.marcBibData ? this.marcBibData.subfields : [];
      }
      this.validateData(this.data,checkFromParent);
      this.cdr.markForCheck();
    }
  }
  closeAutocomplete() {
    if (this.editor.state.completionActive) {
      CodeMirror.commands.autocomplete(this.editor, null);
    }
  }
}
