import { forEach } from '@angular/router/src/utils/collection';
import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, Observable, forkJoin } from 'rxjs';
import { CommonService } from 'src/app/shared/service/common.service';
import { Title } from '@angular/platform-browser';
import { Constants } from 'src/app/constants/constants';
import * as $ from 'jquery';
import { UserIdleSettingsService } from 'src/app/shared/sessionSettings/userIdleSettings.service';
import { UserInfo } from './login';
import { Z3950AttributeOptions, MarcEditorSettings, AttributeValues, Catalogs, SystemSettings } from '../marc/shared/marc';
import { MarcService } from '../marc/shared/service/marc-service';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { SpinnerService } from '../shared/interceptor/spinner.service';
import { AuthenticationService } from '../security/authentication.service';
import { Z3950Service } from '../Z39.50Profile/service/z3950.service';
import { Z3950Profile } from '../Z39.50Profile/model/z3950';
import { Role } from '../shared/role';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('btnLogin') input: ElementRef;

  userInfo: UserInfo = new UserInfo();
  systemSettings: SystemSettings;
  userValidations: FormGroup;
  marcEditorSettings: MarcEditorSettings;
  marcSubscription: Subscription;
  z3950AttributeOptions: Z3950AttributeOptions;
  actor: string;
  userName: string;
  password: string;
  flag: boolean;
  defaultCatalogs1: any;
  tempZ3950Profiles: any;
  userRole: any;
  showErr = false;
  defaultCatalogs: Catalogs[] = [];
  z3950SearchType: AttributeValues[] = [];
  z3950Profiles: Z3950Profile[] = [];
  allRoles: Role[];

  constructor(
    public rs: AuthenticationService,
    public service: CommonService,
    private router: Router,
    private titleService: Title,
    private marcService: MarcService,
    private route: ActivatedRoute,
    private z3950Service: Z3950Service,
    private userIdleSettingsService: UserIdleSettingsService,
    private spinnerService: SpinnerService
  ) {
  }

  roles: Role[];
  rolesSubscription: Subscription;
  ngOnInit() {
    this.titleService.setTitle('BTCAT | Login');
    this.userValidations = new FormGroup({
      user: new FormControl('', Validators.required),
      pass: new FormControl('', Validators.required)
    });

    this.route.params.subscribe(params => {
      if (params.logout) {
        localStorage.clear(); // Removes all the items from Local Storage
      } else if (localStorage.getItem(Constants.LocalStorage.ACTOR) != null && localStorage.getItem(Constants.LocalStorage.ACTOR) != '') {
        this.router.navigate(['/search']);
      } else {
        localStorage.clear(); // Removes all the items from Local Storage
      }
    });
  }

  ngAfterViewInit() { $('.modal-backdrop').remove(); }

  Login() {
    this.showErr = false;
    this.spinnerService.onRequestStarted();

    this.rs.login(this.userName, this.password).subscribe(result => {
      if (result) {
        this.initializeUserData(result); // Set all local storage values
      }
    },
      (error) => {
        console.log(error);
        if (error.status == 401) {
          this.showErr = true;
        }
        this.spinnerService.onRequestFinished();
      });
  }

  initializeUserData(result: any) {
    localStorage.setItem(Constants.LocalStorage.USER, JSON.stringify(result));
    localStorage.setItem(Constants.LocalStorage.USERDISPLAYNAME, result.LastName + ', ' + result.FirstName);
    localStorage.setItem(Constants.LocalStorage.USERNAME, result.UserName);
    localStorage.setItem(Constants.LocalStorage.AUTHTOKEN, result.token);
    localStorage.setItem(Constants.LocalStorage.ACTOR, result.UserName);
    localStorage.setItem(Constants.LocalStorage.BIBSEARCHREQUEST, null);
    localStorage.setItem(Constants.LocalStorage.ASSOCIATEDCUSTOMERS, JSON.stringify(result.associatedCustomers));

    // Get SystemSettings and Z3950 profiles and accordingly set all catalog items
    this.getRestOfDetails(result.userRoleCode);
  }

  getRestOfDetails(userRoleCode: any) {

    // TO DO: Both Roles and Marc Editor Settings should be part of single api call
    this.marcEditorSettings = new MarcEditorSettings();
    this.z3950AttributeOptions = new Z3950AttributeOptions();
    this.z3950SearchType = [];
    this.defaultCatalogs = [];
    this.allRoles = [];
    this.spinnerService.onRequestStarted();

    forkJoin(
      this.z3950Service.getAllZ3950Profiles(),
      this.marcService.getMarcSettings()
    )
      .subscribe(([resZ3950, resMarcSettings]) => {
        this.SetZ3950Data(resZ3950);
        this.SetMarcSettings(resMarcSettings);

        // Get User Role from All Roles and accordingly the default catalogs
        if (this.allRoles !== undefined) {
          this.allRoles.forEach(element => {
            if (element.code === userRoleCode) {
              this.userRole = element;
              localStorage.setItem(Constants.LocalStorage.USERROLE, element.code);
              return this.userRole;
            }
          });
        }

        // All Catalogs in database
        localStorage.setItem(Constants.LocalStorage.ALLCATALOGS, JSON.stringify([...this.defaultCatalogs, ...this.z3950Profiles]));

        // Set Default Catalog as per User Role
        this.defaultCatalogs = this.userRole ?
          (this.userRole.catalogs ? this.defaultCatalogs.filter(p => this.userRole.catalogs.findIndex(c => c === p.id) !== -1
            || p.profileName === Constants.DELETEDDBPROFILENAME)
            : []) : [];
            
        this.defaultCatalogs.forEach(item => {
          if (item.profileName === Constants.DELETEDDBPROFILENAME) {
            item.isActive = false;
          }
        });

        localStorage.setItem(Constants.LocalStorage.SAVECATALOGITEMS, JSON.stringify([...this.defaultCatalogs, ...this.z3950Profiles]));

        // All done so now Navigate to Home Page
        this.router.navigate(['/search']);
      },
        (error) => {
          console.log(error);
          if (error.status == 401) {
            this.showErr = true;
          }
        }, () => {
          this.spinnerService.onRequestFinished();
        });

  }

  SetZ3950Data(data: Z3950Profile[]) {
    this.z3950Profiles = data;
    this.z3950Profiles.forEach(d => { d.isActive = false; });
  }

  SetMarcSettings(item: SystemSettings) {
    localStorage.setItem(Constants.LocalStorage.TEMPLATETYPES, JSON.stringify(item.TemplateTypes));
    console.log(item.fontFamilies);
    localStorage.setItem(Constants.LocalStorage.FONTFAMILIES,JSON.stringify(item.fontFamilies))
    if (item.atsReviewFields) {
      localStorage.setItem(Constants.LocalStorage.ATSREVIEWFIELDS, JSON.stringify(item.atsReviewFields));
    }
    this.marcEditorSettings = item.MarcEditorSettings;
    this.allRoles = item.Roles;
    this.defaultCatalogs = item.Catalogs;
    if (item.BibMarcData && item.BibMarcData.length > 0) {
      const marcBibData = item.BibMarcData.sort((a: any, b: any) => a.tag - b.tag);
      localStorage.setItem(Constants.LocalStorage.MARCBIBDATA, JSON.stringify(marcBibData));
    }
    localStorage.setItem(Constants.LocalStorage.MARCSETTINGS, JSON.stringify(this.marcEditorSettings));
    localStorage.setItem(Constants.LocalStorage.DEFAULTENVSETTINGS, JSON.stringify(this.marcEditorSettings));

    localStorage.setItem(Constants.LocalStorage.DEFAULTCATALOGS, JSON.stringify(this.defaultCatalogs));
    localStorage.setItem(Constants.LocalStorage.EXPORTMARCCONFIGDATA, JSON.stringify(item.ExportMarcConfigData));

    this.z3950AttributeOptions = item.Z3950AttributeOptions;
    localStorage.setItem(Constants.LocalStorage.Z3950ATTRIBUTEOPTIONS, JSON.stringify(this.z3950AttributeOptions));

    const sortedSearchType = item ? item.Z3950SearchType.sort((a: any, b: any) => a.order - b.order) : null;
    this.z3950SearchType = sortedSearchType;
    localStorage.setItem(Constants.LocalStorage.Z3950SEARCHTYPE, JSON.stringify(this.z3950SearchType));

    const timeOutDetails = item.TimeOut;
    localStorage.setItem('timeOutDetails', JSON.stringify(timeOutDetails));

    this.userIdleSettingsService.setUserIdleModuleSettings();

    localStorage.setItem(Constants.LocalStorage.ROLES, JSON.stringify(item.Roles.filter(x => x.isActive == true)));
    localStorage.setItem(Constants.LocalStorage.PERMISSIONS, JSON.stringify(item.Permissions.filter(x => x.isActive == true)));

    const CLSCustomerLabelDefaultConfiguration = item.CLSCustomerLabelDefaultConfiguration;
    localStorage.setItem(Constants.LocalStorage.CLSCustomerLabelDefaultConfiguration,
      JSON.stringify(CLSCustomerLabelDefaultConfiguration));

    const roleBasedmacros = item.roleBasedMacros;
    localStorage.setItem(Constants.LocalStorage.ROLEBASEDMACROS,
      JSON.stringify(roleBasedmacros));
  }

  ngOnDestroy() {
    if (this.marcSubscription) {
      this.marcSubscription.unsubscribe();
    }
  }


  onKeydown(event) {
    if (event.key === Constants.ENTERKEY) {
      event.preventDefault();
      this.Login();
    }
  }

}
