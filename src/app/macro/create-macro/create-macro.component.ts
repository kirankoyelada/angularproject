import {
  Component,
  OnInit,
  ViewChild,
  AfterViewChecked,
  ChangeDetectorRef,
  ViewChildren,
  QueryList,
  AfterViewInit,
  Renderer2,
  OnDestroy
} from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { Constants } from "src/app/constants/constants";
import { NgForm } from "@angular/forms";
import { FormCanDeactivate } from "src/app/can-deactivate/form-can-deactivate";
import { CommonService } from "src/app/shared/service/common.service";
import { ConfirmationDialogComponent } from "src/app/components/shared/confirmation-dialog/confirmation-dialog.component";
import { MatDialog, MatAutocompleteTrigger, _countGroupLabelsBeforeOption, _getOptionScrollPosition, AUTOCOMPLETE_PANEL_HEIGHT } from "@angular/material";
import { Title } from "@angular/platform-browser";
import * as $ from "jquery";
import { SpinnerService } from "src/app/shared/interceptor/spinner.service";
import { SubSink } from "subsink";
import { Location } from '@angular/common';
import { Macro } from '../shared/macro';
import { MacroService } from '../shared/service/macro.service';
import { AuthenticationService } from 'src/app/security/authentication.service';
declare var $: any;

@Component({
  selector: 'app-create-macro',
  templateUrl: './create-macro.component.html',
  styleUrls: ['./create-macro.component.css']
})
export class CreateMacroComponent  extends FormCanDeactivate
  implements OnDestroy, AfterViewInit, AfterViewChecked, OnInit {
  // form properties
  @ViewChildren(MatAutocompleteTrigger, { read: MatAutocompleteTrigger }) matAutocompleteTrigger: QueryList<MatAutocompleteTrigger>;
  @ViewChild('form') form: NgForm;
  isAddNewBtnClicked = false;
  isNewCursor = false;
  tagIndex = -1;
  isUpdating = false;
  displayDuplicateWarnMessage = false;
  macro : Macro = new Macro();
  isShowMsg = false;
  isLoaded = false;
  isExpandSearchItem: any;
  cWidowHeight: number;
  cHeaderHeight: number;
  cSearchHeight: number;
  cNavHeight: number;
  headerHeight: number;
  newHeight: number;
  private subs = new SubSink();
  showBackBtn: boolean;
  nRFHeight: any;
  macroDescription: string;
  macroInsitution: string;
  macroLevel: string;
  macroName: string;
  macroType: string;
  displayWarnMessage: boolean = false;
  isEdit: boolean = false;
  isClone: boolean = false;
  macroCopy: Macro = new Macro();
  isNameRequired: boolean = true;
  isLevelRequired: boolean = true;
  isInstitutionRequired: boolean = true;
  isCLSCustomerRequired: boolean = true;
  isKeyAssignmentRequired: boolean = true;
  isDependencyRequired: boolean = true;
  isVariablesRequired: boolean = true;
  currentMacroText: string = '';
  isAddNewEnabled: boolean = false;
  pythonScripts: any;
  macroId: any;

  //constructor method is used to apply the dependencey injection for below services.
  constructor(
    private route: ActivatedRoute,
    private renderer2: Renderer2,
    private commonService: CommonService,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private _titleService: Title,
    private spinnerService: SpinnerService,
    private macroService: MacroService,
    private location: Location,
    private authenticationService: AuthenticationService
  ) {    
    super(router, authenticationService);
    
    this.macro.type = "Select";
    this.macro.level = "Select";
    this.macro.fields = [];
   
      //this.loadExistingPythonScripts();
  }

  // life cycle events
  ngOnInit() {
    this._titleService.setTitle("BTCAT | New Macro");
    //Get the mode and Id from the parameters for the Edit and clone
    this.isEdit = false;
    this.isClone = false;
    var currentUrl = this.router.url;
    this.currentMacroText = 'New Macro';
    if (currentUrl.indexOf("edit-macro") > 0) {
      this.isEdit = true;
      this._titleService.setTitle("BTCAT | Edit Macro");
      this.currentMacroText = 'Edit Macro';
    } else if (currentUrl.indexOf("clone-macro") > 0) {
      this.isClone = true;
      this._titleService.setTitle("BTCAT | Clone Macro");
      this.currentMacroText = 'Clone Macro';
    }
    this.route.params.subscribe(params => {
      this.macroId = params.id;
    });
    this.showBackBtn = true;

    if (this.isEdit || this.isClone) {
      this.getMacroById(this.macroId);
    }
    else {
      this.isLoaded = true;
    }

    this.subs.add(
      this.commonService.currentMessage.subscribe(
        message => (this.isExpandSearchItem = message)
      )
    );
  }

  // Life Cycle Events
  ngAfterViewInit(): void {
    this.Set_Element_Focus();
  }
  Set_Element_Focus() {
    const element = this.renderer2.selectRootElement(`#macro-name`);
    if (element != null) {
      setTimeout(() => element.focus(), 0);
    }
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  ngAfterViewChecked() {

    //set the page hight based on the expand and collapse search icon.
    this.customHeightFunction();

    $(window).resize(e => {
      this.customHeightFunction();
    });

  }

  //#region getmethods

  // get the template information based on template id.
  getMacroById(id: any) {
    //this.spinnerService.onRequestStarted();
    this.spinnerService.spinnerStart();
    this.macroService.getMacroById(id).subscribe(result => {
      this.macro = result;
      this.isLoaded = true;
      this.isAddNewEnabled = true;
      //Validate the User whether have access to page or not, if not redirect to 'Page not found' page.
      let validUser: boolean = true;
      if (localStorage.getItem(Constants.LocalStorage.ACTOR) !== null &&
        localStorage.getItem(Constants.LocalStorage.ACTOR) !== "") {

        let actor = localStorage.getItem(Constants.LocalStorage.ACTOR);

        if (this.macro &&
          (this.macro.id == this.macroId &&
            ((this.macro.level.toLowerCase() == 'local' &&
              (this.macro.createdBy.toLowerCase() == actor.toLowerCase() ||
                this.macro.lastModifiedBy.toLowerCase() == actor.toLowerCase())) ||
              this.macro.level.toLowerCase() != 'local'))) {
          validUser = true;
        }
        else {
          validUser = false;
        }
      }
      else {
        validUser = false;
      }

      if (!validUser) {
        this.router.navigate([
          "/**/"
        ]);
      }

      //if mode is clone set the Id and Name values
      if (this.isClone) {
        this.macro.id = "";
        this.macro.description = "";
        this.macro.name = "Clone of " + this.macro.name;
      }
      this.macroCopy = this.convertToJson(this.macro);
      //this.spinnerService.onRequestFinished();
      this.spinnerService.spinnerStop();
    });
  }

  // get the existing python scripts api. TODO
  loadExistingPythonScripts() {
    this.macroService.getloadExistingPythonScripts().subscribe(item => {
      if (item) {
        this.pythonScripts = item;
      }
    });
  }

  // #endregion getmethods
  //#region PrivateMethods

  // clear the warning and required flag validations.
  clearErrors() {
    this.displayWarnMessage = false;
    this.displayDuplicateWarnMessage = false;
    this.isNameRequired = true;
    this.isLevelRequired = true;
    this.isInstitutionRequired = true;
    this.isCLSCustomerRequired = true;
    this.isKeyAssignmentRequired = true;
    this.isDependencyRequired = true;
    this.isVariablesRequired = true;
  }

  // parse object in to the json.
  convertToJson(jsonObj: Macro) {
    var macroString = JSON.stringify(jsonObj);
    return JSON.parse(macroString);
  }

  ValidateForm(id: string) {
    if (this.macro.name)
      this.macro.name = this.macro.name.trim();
    if (this.macro.institution)
      this.macro.institution = this.macro.institution.trim();

    if (id == "macro-name") {
      if (this.macro.name == "" || this.macro.name == undefined) {
        this.isNameRequired = false;
      }
      else {
        this.displayDuplicateWarnMessage = false;
        this.isNameRequired = true;
      }
    }
    else if (id == "macro-level" || id == "macro-institution") {
      if (this.macro.level == "Select" || this.macro.level == undefined) {
        this.isLevelRequired = false;
      }
      else {
        this.isLevelRequired = true;
        if (this.macro.level == "Institutional") {
          if (this.macro.institution == "" || this.macro.institution == undefined) {
            this.isInstitutionRequired = false;
          }
          else {
            this.isInstitutionRequired = true;
          }
        }

      }
    }
    else if (id == "macro-clsCustomer") {
      if (this.macro.clsCustomer == "" || this.macro.clsCustomer == undefined) {
        this.isCLSCustomerRequired = false;
      }
      else {
        this.isCLSCustomerRequired = true;
      }
    }
    else if (id == "macro-keyAssignment") {
      if (this.macro.keyAssignment == "" || this.macro.keyAssignment == undefined) {
        this.isKeyAssignmentRequired = false;
      }
      else {
        this.isKeyAssignmentRequired = true;
      }
    }
    else if (id == "macro-dependency") {
      if (this.macro.dependency == "" || this.macro.dependency == undefined) {
        this.isDependencyRequired = false;
      }
      else {
        this.isDependencyRequired = true;
      }
    }
    else if (id == "macro-variables") {
      if (this.macro.variables == "" || this.macro.variables == undefined) {
        this.isVariablesRequired = false;
      }
      else {
        this.isVariablesRequired = true;
      }
    }
  }

  // verify the required field validations
  requiredFieldsValidation(myForm: any): boolean {
    if (this.macro.name)
      this.macro.name = this.macro.name.trim();
    if (this.macro.institution)
      this.macro.institution = this.macro.institution.trim();

    if (this.macro.name != "" && this.macro.name != undefined) {
      this.isNameRequired = true;
    } else {
      this.isNameRequired = false;
    }

    if (this.macro.level != "Select" && this.macro.level != undefined) {
      this.isLevelRequired = true;
      if (
        this.macro.level == "Institutional" &&
        (this.macro.institution == "" ||
          this.macro.institution == undefined)
      ) {
        this.isInstitutionRequired = false;
      } else {
        this.isInstitutionRequired = true;
      }
    } else {
      this.isLevelRequired = false;
    }

    if (this.macro.clsCustomer != "" && this.macro.clsCustomer != undefined) {
      this.isCLSCustomerRequired = true;
    } else {
      this.isCLSCustomerRequired = false;
    }

    if (this.macro.keyAssignment != "" && this.macro.keyAssignment != undefined) {
      this.isKeyAssignmentRequired = true;
    } else {
      this.isKeyAssignmentRequired = false;
    }

    if (this.macro.dependency != "" && this.macro.dependency != undefined) {
      this.isDependencyRequired = true;
    } else {
      this.isDependencyRequired = false;
    }

    if (this.macro.variables != "" && this.macro.variables != undefined) {
      this.isVariablesRequired = true;
    } else {
      this.isVariablesRequired = false;
    }

   
    if (
      this.isNameRequired &&
      this.isCLSCustomerRequired && this.isKeyAssignmentRequired && this.isDependencyRequired && this.isVariablesRequired &&
      this.isLevelRequired &&
      this.isInstitutionRequired 
    ) {
      this.displayWarnMessage = false;
      return true;
    } else {
      this.displayWarnMessage = true;
      this.displayDuplicateWarnMessage = false;
      myForm.form.markAsDirty();
      return false;
    }
  }
  // set the page height dynamically based on resizing the screen
  customHeightFunction() {
    this.cWidowHeight = $(window).height();
    this.cHeaderHeight = $("app-header nav").height();
    this.cSearchHeight = $("app-search-box .search_filter").height();
    this.cNavHeight = $(".mainNavSection").height();
    this.nRFHeight = $(".newRecordFields").height();
    this.headerHeight =
      this.cHeaderHeight +
      this.cSearchHeight +
      this.cNavHeight +
      this.nRFHeight;
    this.newHeight = this.cWidowHeight - this.headerHeight;
    this.newHeight = this.newHeight - 145;
    this.cdr.markForCheck();
  }
  //#endregion PrivateMethods

  //it is used for template type changes action. if we are in edit-template not load the default master data.
  macroTypeChange(event, type) {
    if (
      this.router.url.indexOf("edit-macro") > 0 && this.macro 
    ) {
      this.isAddNewEnabled = true;
      return false;
    }
    if (type == "Select") {
      this.macro.type = "Select";
      this.macro.fields = [];
      this.isAddNewEnabled = false;
    }
  }
  //#endregion events

  //#region action methods

  //Create a new template by using new template object
  saveMacro(myForm) {
    const items = document.getElementsByClassName("border-danger");
    if (!this.requiredFieldsValidation(myForm) || items.length !== 0) {
      this.displayWarnMessage = true;
      this.displayDuplicateWarnMessage = false;
    } 
    else {
      this.saveMacroDetails(myForm);
    }
  }

  // If cancel the template reset the form elements to default.
  cancel(form) {
    this.displayDuplicateWarnMessage = false;
    this.clearErrors();
    if (form.dirty) {
      form.form.markAsPristine();
      if (this.isClone || this.isEdit) {
        this.macro = new Macro();
        this.macro = this.convertToJson(this.macroCopy);
      } else {
        this.macro = new Macro();
        this.macro.type = "Select";
        this.macro.level = "Select";
        this.macro.macroDetails = null;
        this.isAddNewEnabled = false;
      }
    }
  }

  // verify the form changes and navigate to template view.
  back(form: NgForm) {
    if (form && form.form.dirty) {
      this.confirmationMessage(form);
    } else {
      //this.router.navigate(["/templates"]);
      this.location.back();
    }
  }


   //apply the validation styles
  hasClass(event: any) {
    if (event && event.value === "") {
      event.classList.remove("border-danger");
    }
    if (event && event.classList && event.classList.contains("border-danger")) {
      return "Invalid data";
    } else {
      return null;
    }
  }


  // If Level is Global/Local, the text field should be blanked out and disabled.
  disableControl() {
    if (this.macro.level.toLowerCase() != "institutional") {
      this.macro.institution = "";
      return true;
    }
    return false;
  }

  onLevelChanged(event: Event) {
    this.isInstitutionRequired = true;
    this.macro.institution = "";
  }

  // Show confirmation message if form dirty
  confirmationMessage(form: NgForm) {
    let dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: "500px",
      height: "auto",
      disableClose: true,
      data: {
        isCopyErrorMsg:false,
        isCancelConfirm: true,
        message:
          "There are unsaved changes. Are you sure you want to leave this page? "
      }
    });

    dialogRef.afterClosed().subscribe(
      result => {
        if (result) {
          form.form.markAsPristine();
          this.router.navigate(["/macros"]);
        } else form.form.markAsDirty();
      },
      error => { }
    );
  }

  saveMacroDetails(myForm: NgForm) {

    this.displayDuplicateWarnMessage = false;
    this.displayWarnMessage = false;

    myForm.form.markAsPristine();
    this.macro.createdBy = localStorage.getItem("actor");
    this.macro.isActive = true;
    this.macro.name = this.macro.name.trim();
    this.macro.institution = this.macro.institution.trim();
    this.macro.dependency = this.macro.dependency.trim();
    //TODO
    //this.spinnerService.onRequestStarted();
    this.spinnerService.spinnerStart();
      if (
        localStorage.getItem(Constants.LocalStorage.ACTOR) !== null &&
        localStorage.getItem(Constants.LocalStorage.ACTOR) !== ""
      ) {
        this.macro.lastModifiedBy = localStorage.getItem(
          Constants.LocalStorage.ACTOR
        );
      }

    this.macroService.saveMacro(this.macro).subscribe(result => {
      //this.spinnerService.onRequestFinished();
      this.spinnerService.spinnerStop();

      if (result == "") {
        this.displayDuplicateWarnMessage = true;
        this.displayWarnMessage = true;
        $("#macro-name").focus();
        myForm.form.markAsDirty();
      }
      else {
        this.displayWarnMessage = false;
        this.displayDuplicateWarnMessage = false;
        myForm.form.markAsPristine();
        localStorage.removeItem(Constants.LocalStorage.FILTERPARAMS);
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
          width: "500px",
          height: "auto",
          disableClose: true,
          data: {
            isCopyErrorMsg:false,
            isCancelConfirm: false,
            message: "The macro has been saved successfully."
          }
        });
        dialogRef.afterClosed().subscribe(() => {
          this.back(myForm);
        });
      }
    });

  }

  //fix for enter key on macro description.
  getMacroDesc() {
    var content = this.macro.description;
    var caret = $('#macro-description').prop("selectionStart");
    this.macro.description = content.substring(0, caret) + "\n" + content.substring(caret, content.length);
  }

}

