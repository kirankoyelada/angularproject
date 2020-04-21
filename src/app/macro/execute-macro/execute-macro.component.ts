import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { SpinnerService } from "src/app/shared/interceptor/spinner.service";
import { MacroService } from "../shared/service/macro.service";
import { Constants } from "src/app/constants/constants";
import { MarcSubFieldDTO, MarcDTO } from "src/app/_dtos/btcat.vm.dtos";
import { MacroRequest, Macro, InputParameters } from "../shared/macro";
import { Marc, MarcField, RoleBasedMacro } from "src/app/marc/shared/marc";
import { MarcAdapter } from 'src/app/marc/shared/service/marc-adapter.service';
import { ConfirmationDialogComponent } from "src/app/components/shared/confirmation-dialog/confirmation-dialog.component";
import { MatDialog } from "@angular/material";
import { AutofillMonitor } from '@angular/cdk/text-field';
import { Router } from '@angular/router';
import { ClsConfigurationService } from 'src/app/services/cls-configuration.service';
import { BaseComponent } from 'src/app/base.component';
import { AuthenticationService } from 'src/app/security/authentication.service';

declare var $: any;

@Component({
  selector: "app-execute-macro",
  templateUrl: "./execute-macro.component.html",
  styleUrls: ["./execute-macro.component.css"]
})
export class ExecuteMacroComponent  extends BaseComponent implements OnInit {
  allMacroList: string[];
  Macros:Macro[];
  currentMacro:Macro;
  customerMacroList: string[];  
  localUserRole: any;
  @Input() marc: Marc;
  @Input() ListMarc: Marc[];
  @Input() marcSettings: any;
  finalDataArray: any;
  marcItem: Marc;
  searchMacros: string;
  lstMarcItem: Marc[] = [];
  roleBasedMacros: RoleBasedMacro[] = [];
  isAllCustomerSelected:boolean=false;
  isDeletedDBSelected:boolean=false;
  @Input() isActive: any;
  @Input() hasMacroExecutionPermission: boolean = false;
  macroName: any;
  @Output() onMarcRecordChange = new EventEmitter<Marc>();
  @Output() onMarcRecordShowErrorMsg = new EventEmitter<Marc>();
  @Output() private clearData=new EventEmitter<boolean>();
  @Output() private onResetTableGrid=new EventEmitter<boolean>();
  user:any;
  loggedInUserEmailID:any;
  get macroList(): string[]{ 
    if(this.isExternalUser){
      if(this.customerMacroList){       
        return this.searchMacros ? this.customerMacroList.filter(p => p.toLowerCase().indexOf(this.searchMacros.toLowerCase()) != -1) :
        this.customerMacroList;
      }      
    }
    else{     
      if(this.allMacroList){      
        return this.searchMacros ? this.allMacroList.filter(p => p.toLowerCase().indexOf(this.searchMacros.toLowerCase()) != -1) :
        this.allMacroList;
      }  
    }
  }

  constructor(
    private _titleService: Title,
    private route: Router,
    private spinnerService: SpinnerService,
    private dialog: MatDialog,
    private macroService: MacroService,
    private marcAdapter: MarcAdapter,
    private clsConfigurationService: ClsConfigurationService,
    private authenticationService: AuthenticationService    
  ) {
    super(route, authenticationService);
  }

  ngOnInit() {
    const saveCatalogs = JSON.parse(localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS));
    if (saveCatalogs && saveCatalogs.length > 0) {
      this.isDeletedDBSelected = saveCatalogs.findIndex(i => i.isActive && i.profileName === Constants.DELETEDDBPROFILENAME) != -1;
    }

    this.localUserRole = localStorage.getItem(Constants.LocalStorage.USERROLE);   
    this.roleBasedMacros=JSON.parse(localStorage.getItem(Constants.LocalStorage.ROLEBASEDMACROS));   
    this.currentMacro = new Macro();
    this.currentMacro.inputVariables=[];
    this.macroService.getallMacros().subscribe(result => {
      this.Macros = result;
      this.allMacroList=[];
      this.Macros.forEach(macro => {
        if (!macro.customerOnly) {
          this.allMacroList.push(macro.macroName);
        }
      });
      
      if(this.roleBasedMacros){
        const roleMacro = this.roleBasedMacros.find(a => a.role === this.localUserRole);
        if (roleMacro) {
         const macroList=[];
          roleMacro.macros.forEach(macro => {
            var macros = [];
            macros=this.allMacroList.filter(p => p.toLowerCase().indexOf(macro.toLowerCase()) != -1);
            macros.forEach(m=>{
              macroList.push(m);
            })
          });
          this.allMacroList=[...macroList];
        } 
      } 
    });
    if(this.isExternalUser){
      this.getCustomerMacros();
    }
    else {
      this.customerMacroList = [];
      }
      var items = JSON.parse(
          localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS)
      );
      if (items != null && items.length > 0) {
          this.isAllCustomerSelected = items.findIndex(i => i.isActive && i.profileName === "All Customers") != -1;
      }    
  }

  getCustomerMacros() {
    if (this.currentCustomerId) {
      this.clsConfigurationService.getCustomerConfiguartionDetail(this.currentCustomerId).subscribe((result) => {
        if (result && result.customerConfiguration && result.customerConfiguration.macros && result.customerConfiguration.macros.length > 0) {

          this.customerMacroList = result.customerConfiguration.macros;
        }
        else {
          this.customerMacroList = [];
        }
      });
    }
    else {
      this.customerMacroList = [];
    }
  }

  executeMacro(macroName: any,inputVariables:InputParameters[]){
    let routeName: string = this.route.url;
    if (routeName.indexOf("batch-macro-execution") != -1) {
      this.executeBatchMacro(this.currentMacro.macroName,this.currentMacro.inputVariables);
    }
    else{
      this.executeMacroWithInputVariables(this.currentMacro.macroName,this.currentMacro.inputVariables);
    }
  }

  reset(){
    this.currentMacro = new Macro();
    this.currentMacro.inputVariables=[];
  }

  executeMacroWithInputVariables(macroName: any,inputVariables : InputParameters[]){
    this.isActive = true;
    this.macroName = macroName;
    let finalDataArray = [];
    this.applyRulesToMarcRecord(this.marc);
    if (finalDataArray.length > 0) {
      this.marc.fields = finalDataArray;
    }

    // let request = {
    //   MacroName: macroName,
    //   MarcRecord: this.marc,
    //   InputVariables : inputVariables
    // };

    let marcIds = [];
    marcIds.push(this.marc.id);
    let request = {
      MacroName: macroName,
      EmailID: this.loggedInUserEmailID,
      // MarcIds: marcIds,
      InputVariables : inputVariables,
      Marc:this.marc
    };

    this.executeMacroServiceCall(request);
  }

  executeMacroServiceCall(request: any) {
    this.spinnerService.spinnerStart();
    let userInfo = localStorage.getItem('actor');
    this.macroService.batchMacroExecution(request,userInfo).subscribe(result => {
      this.currentMacro = new Macro();
      this.currentMacro.inputVariables=[];
      if (result.Message) {
        //this.onMarcRecordShowErrorMsg.emit(this.marc); fix:Bug 6273:
        this.spinnerService.spinnerStop();
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
          width: "500px",
          height: "auto",
          disableClose: true,
          data: {
            isErrorMsg: true,
            isCopyErrorMsg: true,
            isCancelConfirm: false,
            message: "An error occurred while executing the macro. Please contact the system administrator with following error details:<br/>",
            stackMessage: result.Message
          }
        });
        dialogRef.afterClosed().subscribe(() => {
        });
      } else {
        if (result && result.Marcs && result.Marcs.length > 0) {
          var marcRecord = result.Marcs[0];
          let destinationRecord = this.marcAdapter.transform(
            marcRecord
          );
          if (this.route.url != "/save_batch-macro-execution") {
            this.marcItem = this.buildMacroExecuteFinalMarc(
              destinationRecord,
              this.marc
            );
          }
          this.onMarcRecordChange.emit(this.marcItem);
        }
        this.spinnerService.spinnerStop();
      }
    },
      (error) => {
        if (error.status == 403) {
          //this.displayUnAuthMessage = true;
          this.spinnerService.spinnerStop();
          this.closeNav();
          this.hasMacroExecutionPermission = false;
        }
        else {
          this.spinnerService.spinnerStop();
          throw (error);
        }
      });
  }

  executeBatchMacro(macroName: string,inputVariables:InputParameters[]) {
    this.spinnerService.spinnerStart();
    this.isActive = true;
    this.macroName = macroName;
    let finalDataArray = [];
    this.lstMarcItem = [];
    // this.ListMarc.forEach(marc => {
    //   finalDataArray = [];
    //   finalDataArray = this.applyRulesToMarcRecord(marc);
    //   if (finalDataArray.length > 0) {
    //     this.marc.fields = finalDataArray;
    //     this.lstMarcItem.push(this.marc);
    //   }
    // })
    //get logged in user email id from local storage
    if(localStorage.getItem(Constants.LocalStorage.USER)!=undefined){
      this.user=localStorage.getItem(Constants.LocalStorage.USER);
      console.log('logged in user information is',JSON.parse(this.user).EmailID);
      this.loggedInUserEmailID=JSON.parse(this.user).EmailID;
    }

    var marcIds = [];
    this.ListMarc.forEach(marc => {
      marcIds.push(marc.id);
    });

    // let request = {
    //   MacroName: macroName,
    //   EmailID: this.loggedInUserEmailID,
    //   MarcRecords: this.ListMarc,
    //   InputVariables : inputVariables
    // };

    let request = {
      MacroName: macroName,
      EmailID: this.loggedInUserEmailID,
      MarcIds: marcIds,
      InputVariables : inputVariables
    };

    if (this.ListMarc && this.ListMarc.length > 0) {
      this.batchMacroExecution(request);
    }
    //this.spinnerService.spinnerStart();
  }

  // Build Final marc from after macro execute for Marc
  private buildMacroExecuteFinalMarc(postMarc: Marc, preMarc: Marc): Marc {

    const color = "#b6e2e9";
    const postMarcLength = postMarc.fields.length;
    let postMarcFields = postMarc.fields;
    let preMarcFields = preMarc.fields;

    for (let i = 0; i < postMarcLength; i++) {
      if (
        !(
          postMarcFields[i].tag == "Leader" &&
          this.getLeaderData(postMarcFields[i]) == this.getLeaderData(preMarcFields[i])
        )
      ) {

        if (postMarcFields[i]) {
          var preLengthMatch = preMarcFields.filter(x => x.tag === postMarcFields[i].tag &&
            (x.ind1 === null ? x.ind1 : x.ind1.trim()) === (postMarcFields[i].ind1 === null ? postMarcFields[i].ind1 : postMarcFields[i].ind1.trim()) &&
            (x.ind2 === null ? x.ind2 : x.ind2.trim()) === (postMarcFields[i].ind2 === null ? postMarcFields[i].ind2 : postMarcFields[i].ind2.trim()) &&
            (x.subFieldDescription === null ? x.subFieldDescription : x.subFieldDescription.trim()) === (postMarcFields[i].subFieldDescription === null ? postMarcFields[i].subFieldDescription : postMarcFields[i].subFieldDescription.trim())).length;

          var postLengthMatch = postMarcFields.filter(x => x.tag === postMarcFields[i].tag &&
            (x.ind1 === null ? x.ind1 : x.ind1.trim()) === (postMarcFields[i].ind1 === null ? postMarcFields[i].ind1 : postMarcFields[i].ind1.trim()) &&
            (x.ind2 === null ? x.ind2 : x.ind2.trim()) === (postMarcFields[i].ind2 === null ? postMarcFields[i].ind2 : postMarcFields[i].ind2.trim()) &&
            (x.subFieldDescription === null ? x.subFieldDescription : x.subFieldDescription.trim()) === (postMarcFields[i].subFieldDescription === null ? postMarcFields[i].subFieldDescription : postMarcFields[i].subFieldDescription.trim())).length;

          if (preLengthMatch != postLengthMatch) {
            // Multiple macro run on same marc record -- multiple tag add scenario.
            var elementPos = postMarcFields.map(function (x) { return x.tag; }).lastIndexOf(postMarcFields[i].tag);
            postMarcFields[elementPos].color = color;
          }

          var matchLength = preMarcFields.filter(x => x.tag === postMarcFields[i].tag).length;
          if (matchLength === 1) {//single tag updated
            var item = preMarcFields.filter(x => x.tag === postMarcFields[i].tag);
            if (
              postMarcFields[i].tag === item[0].tag &&
              (((postMarcFields[i].ind1 === null ? postMarcFields[i].ind1 : postMarcFields[i].ind1.trim()) != (item[0].ind1 === null ? item[0].ind1 : item[0].ind1.trim())) ||
                ((postMarcFields[i].ind2 === null ? postMarcFields[i].ind2 : postMarcFields[i].ind2.trim()) != (item[0].ind2 === null ? item[0].ind2 : item[0].ind2.trim())) ||
                ((postMarcFields[i].subFieldDescription === null ? postMarcFields[i].subFieldDescription : postMarcFields[i].subFieldDescription.trim()) != (item[0].subFieldDescription === null ? item[0].subFieldDescription : item[0].subFieldDescription.trim())))
            ) {
              postMarcFields[i].color = color;
            }
          } else if (matchLength == 0) { //single tag added
            postMarcFields[i].color = color;
          } else if (matchLength > 1) { //Multiple tags added/updated
            var multipleTagsPostMarc = postMarcFields.filter(x => x.tag === postMarcFields[i].tag);
            var multipleTagsPreMarc = preMarcFields.filter(x => x.tag === postMarcFields[i].tag);

            var multipleTagsMatch = multipleTagsPreMarc.filter(
              x =>
                (x.subFieldDescription === null ? x.subFieldDescription : x.subFieldDescription.trim()) === (postMarcFields[i].subFieldDescription === null ? postMarcFields[i].subFieldDescription : postMarcFields[i].subFieldDescription.trim()) &&
                x.tag === postMarcFields[i].tag &&
                (x.ind1 === null ? x.ind1 : x.ind1.trim()) === (postMarcFields[i].ind1 === null ? postMarcFields[i].ind1 : postMarcFields[i].ind1.trim()) &&
                (x.ind2 === null ? x.ind2 : x.ind2.trim()) === (postMarcFields[i].ind2 === null ? postMarcFields[i].ind2 : postMarcFields[i].ind2.trim())
            )

            if (multipleTagsMatch.length == 0) {
              postMarcFields[i].color = color;
            }
          }
        }
      }
    }
    postMarc.fields = postMarcFields;
    postMarc.id = preMarc.id;
    postMarc.isActive = preMarc.isActive;
    postMarc.isBTCATMain = preMarc.isBTCATMain;
    postMarc.lastModifiedBy = preMarc.lastModifiedBy;
    postMarc.lastModifiedDate = preMarc.lastModifiedDate;
    postMarc.recordNumber = preMarc.recordNumber;
    postMarc.createdDate = preMarc.createdDate;
    postMarc.createdBy = preMarc.createdBy;

    return postMarc;
  }

  private getLeaderData(field: MarcField): string {
    if (field && field.tag == "Leader" && field.data) {
      return field.data.substring(5, 10) + field.data.substring(17, 20);
    }
    return "";
  }

  applyRulesToMarcRecord(marc: Marc): any {
    const fixedFieldArray = [];
    let leaderField: any;
    let finalDataArray = [];
    let isValid = true;
    this.marc = marc;
    if (this.marc && this.marc.fields && this.marc.fields.length > 0) {
      // Fixed Fields
      this.marc.fields.forEach(field => {
        if (
          field.tag &&
          field.tag != null &&
          field.tag.toString().trim() !== ""
        ) {
          field.tag = field.tag.toString();
          if (Constants.ControlFields.findIndex(t => t === field.tag) !== -1) {
            if (field.data != null) {
              field.data = field.data.replace(/#/g, " ");
            }
            if (field.subFieldDescription != null) {
              field.subFieldDescription = field.subFieldDescription.replace(
                /#/g,
                " "
              );
            }
            fixedFieldArray.push(field);
          } else if (field.tag === "Leader") {
            leaderField = field;
          }
        }
      });

      if (fixedFieldArray && fixedFieldArray.length > 0) {
        finalDataArray = fixedFieldArray.sort((a, b) =>
          a.tag > b.tag ? 1 : b.tag > a.tag ? -1 : 0
        );
      }

      if (leaderField) {
        leaderField.data = leaderField.data.replace(/#/g, " ");
        if (leaderField.subFieldDescription)
          leaderField.subFieldDescription = leaderField.subFieldDescription.replace(
            /#/g,
            " "
          );
        finalDataArray.unshift(leaderField);
      }
      // Sub fields
      this.marc.fields.forEach(field => {
        if (
          field.tag &&
          field.tag != null &&
          field.tag.toString().trim() !== ""
        ) {
          field.tag = field.tag.toString();
          if (
            !(
              Constants.ControlFields.findIndex(t => t === field.tag) !== -1 ||
              field.tag === "Leader"
            )
          ) {
            if (
              field.subFieldDescription &&
              field.subFieldDescription != null &&
              field.subFieldDescription.trim() !== ""
            ) {
              const subFieldData = field.subFieldDescription
                .trim()
                .split(this.marcSettings.delimiter);
              if (
                subFieldData &&
                subFieldData != null &&
                subFieldData.length > 1
              ) {
                if (subFieldData[0] === "" && subFieldData[1] !== "") {
                  const exitsubfileds = field.subfields;
                  field.subfields = [];
                  let i = 0;
                  subFieldData.forEach(f => {
                    const subField = new MarcSubFieldDTO();
                    if (f !== "") {
                      const code = f.charAt(0);
                      let data = '';
                      if (code && code != null && code !== "") {
                        data = f.slice(1);
                        if (data && data != null && data.trim() !== "") {
                          if (data.slice(-1).trim() === "") {
                            data = data.slice(0, -1);
                          }
                          if (data.slice(0, 1).trim() === "") {
                            data = data.substr(1);
                          }
                        }
                        subField.code = code;
                        subField.data = data;
                        if (
                          exitsubfileds[i] &&
                          exitsubfileds[i].authorityId != null
                        ) {
                          subField.authorityId = exitsubfileds[i].authorityId;
                        }

                        field.subfields.push(subField);
                      }
                      i++;
                    }
                  });
                }
              }
            } else {
              field.subfields = [];
            }
            if (field.ind1 === "#") {
              field.ind1 = " ";
            }
            if (field.ind2 === "#") {
              field.ind2 = " ";
            }
            finalDataArray.push(field);
          }
        }
      });
    }
    return finalDataArray;
  }

  openNav() {
    $(".MarcEditor").css("margin-right", "220px");
    $(".macroSideNav").width(210);
    $(".macroSideNavHeaderCollapsed").hide();
    this.onResetTableGrid.emit();
  }

  closeNav() {
    $(".MarcEditor").css("margin-right", "1rem");
    $(".macroSideNav").width(0);
    $(".macroSideNavHeaderCollapsed").show();
  }

  executeSingleOrBatchMacros(macroName: string) {
    //get the current route
    let routeName: string = this.route.url;
    var macro=this.Macros.filter(x => x.macroName === macroName);
    if (macro.length > 0 && macro) {
      this.currentMacro = JSON.parse(JSON.stringify(macro[0]));
      if (this.currentMacro.inputVariables.length > 0) {
        $('#macroInputVariable').modal({
          keyboard: true,
          backdrop: 'static',
          show: true
        });
      }
      else {
        // this.executeMacroWithInputVariables(macroName,[]);
        if (routeName.indexOf("batch-macro-execution") != -1) {
          this.executeBatchMacro(macroName,this.currentMacro.inputVariables); //to do need to get macro name
        } else {
          this.executeMacro(macroName,this.currentMacro.inputVariables); //to do need to get macro name
        }
      }
    }
  }

  batchMacroExecution(request: any) {
    let userInfo = localStorage.getItem('actor');
    this.macroService.batchMacroExecution(request, userInfo).subscribe((result) => {

      this.spinnerService.spinnerStop();
      let strSuccess=result.Message;
      if(strSuccess !=""){
        this.alertMessage("<b>"+request.MacroName+"</b> macro execution started successfully.");
        this.clearData.emit(true);
      }
      else{
        this.alertMessage("Something went wrong while execution macro, Please contact Admin");
        this.clearData.emit(false);
      }
      this.closeNav();

    }, (error) => {
      this.spinnerService.spinnerStop();
      this.alertMessage("Something went wrong while execution macro, Please contact Admin");
      this.clearData.emit(false);
    });
  }

  alertMessage(text:string){
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: "500px",
      height: "auto",
      disableClose: true,
      data: {
        isCopyErrorMsg: false,
        isCancelConfirm: false,
        message:text,
        title:'Notification'
      }
    });
    dialogRef.afterClosed().subscribe(() => {
    });
  }
}

