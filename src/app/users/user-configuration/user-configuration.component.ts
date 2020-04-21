import { Component, NgModule, OnInit, ViewChild, ViewChildren, QueryList, OnDestroy } from "@angular/core";
import { BrowserModule, Title } from "@angular/platform-browser";
import { Pipe, PipeTransform } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { Observable } from "rxjs";
import { FormControl } from "@angular/forms";
import { map, startWith } from "rxjs/operators";
import { UserConfigurationService } from "../user-configuration.service";
import { User, UserRole } from "../user";
import { Role, Permission } from "src/app/shared/role";
import { FilterPipePipe } from "src/app/filter-pipe.pipe";
import { Constants } from "src/app/constants/constants";
import { SpinnerService } from "src/app/shared/interceptor/spinner.service";
import { Location } from "@angular/common";
import { ConfirmationDialogComponent } from "src/app/components/shared/confirmation-dialog/confirmation-dialog.component";
import { MatDialog, MatAutocompleteTrigger, MatOption, MatAutocomplete, _countGroupLabelsBeforeOption, _getOptionScrollPosition, AUTOCOMPLETE_OPTION_HEIGHT, AUTOCOMPLETE_PANEL_HEIGHT, MatDialogRef } from '@angular/material';
import { FormCanDeactivate } from "src/app/can-deactivate/form-can-deactivate";
import { CommonService } from "src/app/shared/service/common.service";
import { Router } from "@angular/router";
import { isObject } from 'util';
import { url } from 'inspector';
import { AuthenticationService } from 'src/app/security/authentication.service';
import { Permissions } from 'src/app/security/permissions';
import { SubSink } from 'subsink';
import { Z3950Profile } from 'src/app/Z39.50Profile/model/z3950';
import { Catalogs } from 'src/app/marc/shared/marc';
import { Z3950Service } from 'src/app/Z39.50Profile/service/z3950.service';
import { BaseComponent } from 'src/app/base.component';
import { CustomerService } from 'src/app/customer/shared/services/customer.service';
import { Customers} from 'src/app/customer/shared/customer';

declare var $: any;
@Component({
  selector: "app-user-configuration",
  templateUrl: "./user-configuration.component.html",
  styleUrls: ["./user-configuration.component.css"]
})
export class UserConfigurationComponent extends FormCanDeactivate
  implements OnInit,OnDestroy,BaseComponent {
  @ViewChild("form") form: NgForm;
  myControl = new FormControl();
  roles: Role[];
  permissions: Permission[];
  filteredOptions: Observable<string[]>;
  cWidowHeight: number;
  cHeaderHeight: number;
  cSearchHeight: number;
  cNavHeight: number;
  headerHeight: number;
  newHeight: number;
  newUserHeight: number;
  newCustomerHeight: number;
  users: User[];
  selectedPermission:string[]=[];
  userRole:Role[];
  userRoleIsPartial:boolean[];
  searchText:string = "";
  searchCustomer:string;
  selectedUsers:User[];
  user:User;
  tempUser:User;

  preUser:User;
  selectedRoles:Role[]=[];
  selectedUserRoles:Role[]=[];
  isUserNameRequired:boolean=false;
  displayWarnMessage:boolean=false;
  rolePartialCheck:boolean;
  showRolePermissionList:boolean=false;
  isUserFound:boolean=false;
  warningMsg:string='One or more errors occurred while saving the user configuration. Please correct them to proceed.';
  private subs = new SubSink();
  checkedRoles: UserRole[] = [];
  checkedCustomers:string[];
  checkedPermissions: string[] = [];
  validationMsg: string = "";
  previousUser: string = "";
  unsavedChanges: string = "";
  preCheckedRoles: UserRole[] = [];
  preCheckedPermissions: any[] = [];
  preCheckedCustomers:string[]=[];
  isbuttonShows: boolean = false;
  // Permissions (add user, assign roles and permissions)
  hasWritePermission: boolean = false;
  displayUnAuthMessage: boolean = false;
  userName:any;
  defaultCatalogs:any;
  z3950Profiles: Z3950Profile[];
  allRoles:any=[];
  modifiedRole:any;
  selectedRoleCode:any = '';
  isRoleDisabled = false;
  customers:Customers[];

  constructor(
    private userConf: UserConfigurationService,
    private spinnerService: SpinnerService,
    private location: Location,
    private dialog: MatDialog,
    private _titleService: Title,
    private router: Router,
    private z3950Service: Z3950Service,
    private authenticationService: AuthenticationService,
    private customerService:CustomerService
  ) {
    super(router, authenticationService);
  }
  @ViewChildren(MatAutocompleteTrigger, { read: MatAutocompleteTrigger }) matAutocompleteTrigger: QueryList<MatAutocompleteTrigger>;


  ngOnInit() {
    this.getAllCustomers();
    this._titleService.setTitle("BTCAT | Internal User Role Assignment");
    this.spinnerService.spinnerStart();
    this.getConfiguration();
    this.z3950Service.getAllZ3950Profiles().subscribe((data) => {
      this.z3950Profiles = data;
      for (var i = 0; i < this.z3950Profiles.length; i++) {
        this.z3950Profiles[i].isActive = false;
      }
    })
    this.spinnerService.spinnerStop();
  }

  // set the page height dynamically based on resizing the screen
  customHeightFunction() {
    this.cWidowHeight = $(window).height();
    this.cHeaderHeight = $("app-header nav").height();
    this.cSearchHeight = $("app-search-box .search_filter").height();
    this.cNavHeight = $(".mainNavSection").height();
    this.headerHeight =
      this.cHeaderHeight + this.cSearchHeight + this.cNavHeight;
    this.newHeight = this.cWidowHeight - this.headerHeight;
    this.newHeight = this.newHeight - 165;
    this.newUserHeight = this.newHeight - 32;
    this.newCustomerHeight = this.newHeight - 32;
  }

  getConfiguration() {
    this.subs.sink=this.userConf.getUsers().subscribe(x => (this.users = x));
    if (
      localStorage.getItem(Constants.LocalStorage.ROLES) != null &&
      localStorage.getItem(Constants.LocalStorage.PERMISSIONS) != null
    ) {
      this.roles = JSON.parse(
        localStorage.getItem(Constants.LocalStorage.ROLES)
      );
      this.permissions = JSON.parse(
        localStorage.getItem(Constants.LocalStorage.PERMISSIONS)
      );
    } else {
      this.subs.sink=this.userConf.getRoles().subscribe(x => {
        this.roles = x;
      });
      this.subs.sink=this.userConf.getPermissions().subscribe(x => {
        this.permissions = x;
      });
    }
  }

  findUser() {
    if (this.searchText != undefined && this.searchText != "" && this.searchText != "User not found") {
      if (!isObject(this.searchText)) {
        let findUser = this.users.find(x => {
          let name = x.lastName + ", " + x.firstName;
          return name.toLowerCase() === this.searchText.toLowerCase();
        });
        if (findUser != undefined) {
          this.checkedRoles = findUser.roles;
          this.checkedPermissions = findUser.permissions;
          this.checkedCustomers = findUser.associatedCustomerGuids;
          return true;
        } else {
          this.checkedRoles = [];
          this.checkedPermissions = [];
          this.checkedCustomers=[];
          this.showRolePermissionList = false;
          this.isbuttonShows = false;
          return false;
        }
      }
    } else {
      this.checkedRoles = [];
      this.checkedPermissions = [];
      this.checkedCustomers=[];
      this.showRolePermissionList = false;
      this.isbuttonShows = false;
    }
  }

  clear(form: NgForm) {
    if (form.dirty) {
      form.form.markAsPristine();
    }
    this.displayWarnMessage = false;
    this.displayUnAuthMessage = false;
    this.isUserNameRequired = false;
    this.preCheckedRoles = [];
    this.preCheckedPermissions = [];
    this.preCheckedCustomers = [];
    this.previousUser = '';
    this.preUser = new User();
    this.searchText = '';
    this.searchCustomer = '';
    this.userRole = [];
    this.rolePartialCheck = false;
    this.showRolePermissionList = false;
    this.checkedRoles = [];
    this.checkedPermissions = [];
    this.checkedCustomers=[];
    this.isbuttonShows = false;
  }

  back(form: NgForm) {
    if (form && form.form.dirty) {
      this.confirmationMessage(form, "back");
    } else {
      this.location.back();
    }
  }

  getRoleDetails(role: Role) {
    if (this.selectedUserRoles) {
      //var getRoleInfo;
      var getRoleInfo = this.selectedUserRoles.find(x => {
        if (x.code === role.code) return x.isPartial;
      });
      if (getRoleInfo) return getRoleInfo;
      else return false;
    } else return false;
  }
  ngAfterViewInit(): void {
    $(document).ready(function() {
      $("#mainNav li.home").removeClass("active");
      $("#mainNav li.admin").addClass("active");
    });

    this.subs.sink=this.matAutocompleteTrigger.changes.subscribe(trigger => {
      trigger.toArray().map(item => {
        // set default scroll position to 0
        item.autocomplete._setScrollTop(0);
        item._scrollToOption = () => {
          const index: number =
            item.autocomplete._keyManager.activeItemIndex || 0;
          const labelCount = _countGroupLabelsBeforeOption(
            index,
            item.autocomplete.options,
            item.autocomplete.optionGroups
          );
          // tslint:disable-next-line: max-line-length
          const newScrollPosition = _getOptionScrollPosition(
            index,
            25,
            item.autocomplete._getScrollTop(),
            AUTOCOMPLETE_PANEL_HEIGHT
          );
          item.autocomplete._setScrollTop(newScrollPosition);
        };
      });
    });
  }

  displayFn(user: User): string {
    return user? user.lastName + ', ' + user.firstName: '';
  }
  ngAfterViewChecked() {
    if (this.users != undefined)
      this.users = this.users.filter(
        x => x.firstName != null && x.lastName != null
      );
    //set the page hight based on the expand and collapse search icon.
    this.customHeightFunction();

    $(window).resize(e => {
      this.customHeightFunction();
    });
  }
  saveCofiguration(form: NgForm) {
    const items = document.getElementsByClassName("border-danger");
    if (!this.requiredFieldsValidation(form) || items.length !== 0) {
      if (this.checkedRoles.length > 0 || this.checkedPermissions.length > 0) {
        this.saveUserConfiguration(form);
      } else {
        let dialogRef = this.dialog.open(ConfirmationDialogComponent, {
          width: "500px",
          height: "auto",
          disableClose: true,
          data: {
            isCopyErrorMsg: false,
            isCancelConfirm: true,
            message:
              "All the permissions of the user <b>" + this.user.lastName+', '+this.user.firstName + "</b> have been removed. Do you still want to proceed? "
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.saveUserConfiguration(form);
          }
        });
      }
      this.validationMsg = '';
      this.displayWarnMessage = false;
      this.displayUnAuthMessage = false;
    }
  }

  saveUserConfiguration(form :NgForm) {
    this.defaultCatalogs=[];
    if(this.hasAccess(Permissions.CON_USR)){
      this.spinnerService.spinnerStart();
      if (this.checkedRoles.length === 0) {
        this.user.roles = [];
      }
      // this.user.roles = this.selectedRoles;
      // this.user.permissions = this.selectedPermission.map(String);
      this.user.roles = this.checkedRoles;
      this.user.permissions = this.checkedPermissions;
      this.user.associatedCustomerGuids = this.checkedCustomers;
      this.userName=localStorage.getItem(Constants.LocalStorage.ACTOR);
      this.allRoles=JSON.parse(localStorage.getItem(Constants.LocalStorage.ROLES));
      //this.spinnerService.spinnerStop();
      this.subs.sink=this.userConf.saveUser(this.user).subscribe(
        result => {
          this.spinnerService.spinnerStop();

          if (result != "") {
            // reset permissions if current user is updated
            if(this.authenticationService.currentUserValue
              && this.authenticationService.currentUserValue.UserName == this.user.userName) {
              this.authenticationService.updateCurrentUserPermissions(this.user.permissions);
              this.defaultCatalogs = JSON.parse(localStorage.getItem(Constants.LocalStorage.DEFAULTCATALOGS));
              if (this.userName == this.user.userName) {
                if (this.allRoles != undefined) {
                  this.allRoles.forEach(element => {
                    if (element.code == this.user.roles[0].code) {
                      this.modifiedRole = element;
                      return this.modifiedRole;
                    }
                  });
                }
                this.defaultCatalogs = this.modifiedRole.catalogs ? this.defaultCatalogs.filter(p => this.modifiedRole.catalogs.findIndex(c => c === p.id) != -1
                  || p.profileName === Constants.DELETEDDBPROFILENAME) : [];
                
                  this.defaultCatalogs.forEach(item => {
                  if (item.profileName === Constants.DELETEDDBPROFILENAME) {
                    item.isActive = false;
                  }
                });
                
                if(!this.isExternalUser){
                  localStorage.setItem(Constants.LocalStorage.SAVECATALOGITEMS, JSON.stringify([...this.defaultCatalogs, ...this.z3950Profiles]));
                }

              }
            }
            const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
              width: "500px",
              height: "auto",
              disableClose: true,
              data: {
                isCopyErrorMsg: false,
                isCancelConfirm: false,
                message:
                  "Permissions for the user <b>" +
                  this.user.lastName +
                  ", " +
                  this.user.firstName +
                  "</b> saved successfully."
              }
            });
            dialogRef.afterClosed().subscribe(() => {
              this.clear(form);
              this.spinnerService.spinnerStart();
              this.subs.sink = this.userConf.getUsers().subscribe(x => (this.users = x));
              if (this.userName == this.user.userName) {
                localStorage.removeItem(Constants.LocalStorage.BIBSEARCHREQUEST);
                localStorage.removeItem(Constants.LocalStorage.SEARCHZ3950REQUEST);
                localStorage.removeItem(Constants.LocalStorage.AUTHSEARCHREQUEST);
                this.router.navigate(["/search"]);
              }
              this.spinnerService.spinnerStop();
            });
          }
        },
        error => {
          if (error.status == 403) {
            //this.displayUnAuthMessage = true;
            this.spinnerService.spinnerStop();
            if (form.dirty) {
              form.form.markAsPristine();
            }
            alert(error.statusText);
            this.router.navigate(["/unauthorized"]);
          } else {
            this.spinnerService.spinnerStop();
            throw error;
          }
        }
      );
    }
  }

  // Show confirmation message if form dirty
  confirmationMessage(form: NgForm, actionType: string) {
    if (actionType === "selectUser") {
      this.unsavedChanges =
        "There are unsaved roles/permissions for the user <b>" +
        this.preUser.lastName +
        ", " +
        this.preUser.firstName +
        "</b>. Are you sure you want to switch to a new user?";
    } else {
      this.unsavedChanges =
        "There are unsaved changes. Are you sure you want to leave this page?";
    }
    let dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: "500px",
      height: "auto",
      disableClose: true,
      data: {
        isCopyErrorMsg: false,
        isCancelConfirm: true,
        message: this.unsavedChanges
      }
    });

    dialogRef.afterClosed().subscribe(
      result => {
        if (result) {
          form.form.markAsPristine();
          if (actionType === "back") {
            this.location.back();
          }
          if (actionType === 'selectUser') {
            this.selectUser(this.user, form);
            this.preUser = null;
            this.preCheckedPermissions = [];
            this.preCheckedCustomers = [];
            this.preCheckedRoles = [];
            this.previousUser = '';
          }
        } else {
          form.form.markAsDirty();
          this.searchText = this.previousUser;
          this.user = this.preUser;
          //this.searchText = this.user.lastName + ', ' + this.user.firstName;
          this.checkedRoles = this.preCheckedRoles;
          this.checkedPermissions = this.preCheckedPermissions;
          this.checkedCustomers = this.preCheckedCustomers;
          //this.previousUser='';
          //this.selectUser(this.previousUser,form);
        }

        //this.matAutocompleteTrigger.closePanel();
      },
      error => { }
    );
  }
  setPermissionList(role: any, $event, myForm: NgForm) {
    myForm.form.markAsDirty();
    this.selectedRoleCode = role.code;
    this.previousUser = this.searchText;
    this.preUser = this.tempUser;
    var roleEle = this.checkedRoles.find(a => a.code == role.code);
    //     if (roleEle && roleEle.isPartial && $event.currentTarget.checked)
    //     {
    //       $event.currentTarget.checked = false;
    //     }
    if (roleEle && $event.currentTarget.checked) {
      $event.currentTarget.checked = false;
    }
    if ($event.currentTarget.checked) {
      this.isRoleDisabled = true;
      if (roleEle) {
        roleEle.isPartial = false;
      } else {
        let userRole = new UserRole();
        userRole.code = role.code;
        userRole.isPartial = false;
        //document.getElementById("myCheck").disabled = false;
        this.checkedRoles.push(userRole);
      }

      if (this.checkedPermissions != undefined) {
        this.checkedPermissions = this.mergeArrays(this.checkedPermissions, role.permissions);
      } else {
        this.checkedPermissions = role.permissions;
      }
    } else {

      this.isRoleDisabled = false;
      const index: number = this.checkedRoles.findIndex(
        x => x.code == role.code
      );
      if (index !== -1) {
        this.checkedRoles.splice(index, 1);
      }

      let allPermissions: string[] = [];
      this.roles.forEach(x => {
        this.checkedRoles.forEach(y => {
          if (x.code === y.code) {
            if (allPermissions.length > 0) {
              allPermissions = this.mergeArrays(allPermissions, x.permissions);
            } else {
              allPermissions = x.permissions;
            }
          }
        });
      });

      let remPermissions: string[] = [];
      this.checkedPermissions.forEach(p => {
        let isExists = allPermissions.includes(p);
        if (!isExists)
          remPermissions.push(p);
      })

      this.checkedPermissions = this.checkedPermissions.filter(x => !remPermissions.includes(x));

      // this.checkedPermissions = [];
      // this.checkedRoles.map(x => {
      //   let role = this.roles.find(y => y.code === x.code);
      //   if (role) {
      //     if (this.checkedPermissions.length > 0) {
      //       this.checkedPermissions = this.mergeArrays(role.permissions);
      //     } else {
      //       this.checkedPermissions = role.permissions;
      //     }
      //   }
      // });
    }
    this.preCheckedRoles = this.checkedRoles;
    this.preCheckedPermissions = this.checkedPermissions;
    this.preCheckedCustomers = this.checkedCustomers;
  }

  setOnlyRole(permission: any, $event, myForm: NgForm) {
    myForm.form.markAsDirty();
    this.previousUser = this.searchText;
    this.preUser = this.tempUser;
    if ($event.currentTarget.checked) {
      this.checkedPermissions.push(permission.code);
    } else {
      const index: number = this.checkedPermissions.indexOf(permission.code);
      if (index !== -1) {
        this.checkedPermissions.splice(index, 1);
        if (this.checkedPermissions.length == 0) {
          this.checkedRoles = [];
          this.isRoleDisabled = false;
        }
      }
    }


  }
  setRoleList(permission: any, $event, myForm: NgForm) {
    myForm.form.markAsDirty();
    this.previousUser = this.searchText;
    this.preUser = this.tempUser;
    if ($event.currentTarget.checked) {
      this.checkedPermissions.push(permission.code);
      this.roles.forEach(x => {
        let permissionExists = x.permissions.find(x => x === permission.code);
        if (permissionExists) {
          var roleEle = this.checkedRoles.find(a => a.code == x.code);
          if (roleEle) {
            //roleEle.isPartial = !this.arraysEqual(this.checkedPermissions, x.permissions);
            roleEle.isPartial = !this.checkEveryPermissionsExists(
              x.permissions,
              this.checkedPermissions
            );
          } else {
            let userRole = new UserRole();
            userRole.code = x.code;
            userRole.isPartial = !this.checkEveryPermissionsExists(
              x.permissions,
              this.checkedPermissions
            );
            this.checkedRoles.push(userRole);
          }
        }
      });
    } else {
      const index: number = this.checkedPermissions.indexOf(permission.code);
      if (index !== -1) {
        this.checkedPermissions.splice(index, 1);
      }
      if (this.checkedPermissions.length == 0) this.checkedRoles = [];
      else {
        var tempCheckedRoles = [...this.checkedRoles];
        tempCheckedRoles.forEach(x => {
          let role = this.roles.find(y => y.code === x.code);
          if (role) {
            if (
              this.checkEveryPermissionsExists(
                role.permissions,
                this.checkedPermissions
              )
            )
              x.isPartial = false;
            else x.isPartial = true;
          }
        });
        tempCheckedRoles.forEach(x => {
          let role = this.roles.find(y => y.code === x.code);
          if (!x.isPartial) {
            if (
              role &&
              !this.checkEveryPermissionsExists(
                role.permissions,
                this.checkedPermissions
              )
            ) {
              const index: number = this.checkedRoles.indexOf(x);
              if (index !== -1) {
                this.checkedRoles.splice(index, 1);
              }
            }
          } else {
            if (
              role &&
              !role.permissions.some(r => this.checkedPermissions.includes(r))
            ) {
              const index: number = this.checkedRoles.indexOf(x);
              if (index !== -1) {
                this.checkedRoles.splice(index, 1);
              }
            }
          }
        });
      }
    }
    this.preCheckedRoles = this.checkedRoles;
    this.preCheckedPermissions = this.checkedPermissions;
    this.preCheckedCustomers = this.checkedCustomers;
  }

  checkEveryPermissionsExists(src, dest): boolean {
    var res = src.every(v => dest.includes(v));
    return res;
  }

  getRolePartialInfo(role: Role): boolean {
    var val: boolean = false;
    var getRoleInfo = this.checkedRoles.find(x => x.code === role.code);
    if (getRoleInfo) val = getRoleInfo.isPartial;
    return val;
  }

  getRoleInfo(role: Role): boolean {
    var val: boolean = false;
    var getRoleInfo = this.checkedRoles.find(x => x.code === role.code);
    // if (getRoleInfo && !getRoleInfo.isPartial) val = true;
    if (getRoleInfo) val = true;
    return val;
  }

  mergeArrays(jointArray, ...arrays) {
    arrays.forEach(array => {
      jointArray = [...jointArray, ...array];
    });
    const uniqueArray = jointArray.filter(
      (item, index) => jointArray.indexOf(item) === index
    );
    return uniqueArray;
  }

  arraysEqual(src, dest) {
    if (src === dest) return true;
    if (src == null || dest == null) return false;
    if (src.length != dest.length) return false;

    const clnSrc = [...src];
    const clnDest = [...dest];
    const sorSrc = clnSrc.sort();
    const sorDest = clnDest.sort();

    for (var i = 0; i < sorSrc.length; ++i) {
      if (sorSrc[i] !== sorDest[i]) return false;
    }
    return true;
  }

  //validations block
  requiredFieldsValidation(myForm: any): boolean {
    if (this.searchText === "" || this.searchText === undefined) {
      this.displayWarnMessage = true;
      this.isUserNameRequired = true;
      this.validationMsg = "Required";
      return true;
    } else {
      this.displayWarnMessage = false;
      this.isUserNameRequired = false;
      this.validationMsg = "";
      return false;
    }
  }
  //end of validation block

  selectUser(selectedUser: any, form: NgForm) {
    if (selectedUser.firstName != 'User not found') {
      //if (event.isUserInput === true) {
      this.isUserNameRequired = true;
      this.isbuttonShows = true;
      this.displayWarnMessage = false;
      this.displayUnAuthMessage = false;
      this.user = JSON.parse(JSON.stringify(selectedUser));
      this.checkedRoles = [];
      this.checkedPermissions = [];
      this.checkedCustomers = [];
      this.searchCustomer='';
      if (selectedUser && selectedUser.roles.length > 0) {
        this.selectedRoleCode = selectedUser.roles[0].code;
        this.isRoleDisabled = true;
        this.checkedRoles = JSON.parse(JSON.stringify(selectedUser.roles));
        this.checkedPermissions = JSON.parse(JSON.stringify(selectedUser.permissions));
        this.checkedCustomers = JSON.parse(JSON.stringify(selectedUser.associatedCustomerGuids));
      }
      this.showRolePermissionList = true;
      //this.searchText = selectedUser.lastName + ', ' + selectedUser.firstName;
      if (form.dirty && JSON.stringify(this.preUser) != JSON.stringify(this.user)) {
        this.confirmationMessage(form, 'selectUser');
      }
      else {
        this.tempUser = JSON.parse(JSON.stringify(selectedUser));
      }
      if (this.searchText != '') {
        this.isUserNameRequired = false;
      } else {
        this.isUserNameRequired = true;
      }
      //}
    } else {
      selectedUser.firstName = '';
      return false;
    }

  }
  getAllCustomers() {
    this.spinnerService.spinnerStart();
    this.subs.sink = this.customerService.getCustomers().subscribe((item) => {
      this.customers = item.sort((a, b) => (a.customerName.toLowerCase() > b.customerName.toLowerCase()) ? 1 : -1);
      //Load selected customer from Name mapping screen

      this.spinnerService.spinnerStop();
    },
      (error) => {
        console.log(error);
        this.spinnerService.spinnerStop();
      }
    );
  }
  getCheckedCustomers(customer: Customers): boolean {
    var val: boolean = false;
    if (!this.checkedCustomers) {
      return val;
    }
    else {
      var getCustomerInfo = this.checkedCustomers.find(x => x === customer.id);
      if (getCustomerInfo) val = true;
      return val;
    }

  }
  setCustomer(customer:any,$event,myForm:NgForm) {
    myForm.form.markAsDirty();
    this.previousUser=this.searchText;
    this.preUser=this.tempUser;
    if($event.currentTarget.checked){
      if(this.checkedCustomers === null){
        this.checkedCustomers=[];
      }
      this.checkedCustomers.push(customer.id);
    } else {
      const index: number = this.checkedCustomers.indexOf(customer.id);
      if (index !== -1) {
        this.checkedCustomers.splice(index, 1);
      }
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
