import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { SearchComponent } from "./search/search.component";
import { GlobalErrorComponent } from "./global-error.component";
import { PageNotFoundComponent } from "./page-not-found.component";
import { AuthorityViewComponent } from "./marc/authority-view/authority-view.component";
import { AppLayoutComponent } from "./shared/_layout/app-layout/app-layout.component";
import { CompareViewComponent } from "./marc/compare-view/compare-view.component";
import { MarcEditComponent } from "./marc/marc-edit/marc-edit.component";
import { AuthGuard } from "./security/auth.guard";
import { CanDeactivateGuard } from "./can-deactivate/can-deactivate.guard";
import { SessionTimeOutComponent } from "./sessiontimeout/sessiontimeout.component";
import { Z3950Component } from "./Z39.50Profile/component/z3950.component";
import { AuthorityResultsComponent } from "./authority-results/authority-results.component";
import { ViewTemplateComponent } from './template/view-template/view-template.component';
import { CreateTemplateComponent } from './template/create-template/create-template.component';
import { MergeMarcComponent } from './marc/merge-marc/merge-marc.component';
import { MarcRecordHistoryComponent } from './marc/marc-record-history/marc-record-history.component';
import { CompareHistoryViewComponent } from './marc/compare-history-view/compare-history-view.component';
import { MarcCreateComponent } from './marc/marc-create/marc-create.component';
import { CreateMacroComponent } from './macro/create-macro/create-macro.component';
import { ViewMacroComponent } from './macro/view-macro/view-macro.component';
import { UserConfigurationComponent } from './users/user-configuration/user-configuration.component';
import { UnauthorizedComponent } from './security/unauthorized.component';
import { LoginComponent } from './login/login.component';
import { MyPreferencesComponent } from './preferences/my-preferences/my-preferences.component';
import { Permissions } from './security/permissions';
import { MarcExportComponent } from './marc-export/marc-export.component';
import { CustomerNameMapComponent } from './customer/customer-name-map/customer-name-map.component';
import { ClsLabelConfigurationComponent } from './customer/cls-label-configuration/cls-label-configuration.component';
import { UploadRecordFileComponent } from './upload-record-file/upload-record-file.component';
import { ClsConfigurationComponent } from './customer/cls-configuration/cls-configuration.component';
import { ExtractComponent } from './extract/extract/extract.component';
import { BatchMarcoExecutionComponent } from './batch-marco-execution/batch-marco-execution.component';
import { AccountSuffixConfigurationComponent } from './customer/cls-configuration/account-suffix-configuration/account-suffix-configuration.component';
import { ATSReviewComponent } from './ats-review/ats-review.component';
import { ViewLogsComponent } from './extract/extract/viewlogs.component';
import { EnvSettingsComponent } from './env-settings/env-settings.component';
import { MarcEditContainerComponent } from './marc/marc-edit-container/marc-edit-container.component';
import { EnvSettingsCrudComponent } from './env-settings/env-settings-crud/env-settings-crud.component';
import { MarcEditContainerResolver } from './marc/marc-edit-container/marc-edit-container.resolver';
import { MacroAdminComponent } from './macro/macro-admin/macro-admin.component';

const routes: Routes = [
  {
    path: "",
    redirectTo: "search",
    pathMatch: "full",
    canDeactivate: [CanDeactivateGuard],
    data: { title: 'My Calendar' }
  },
  {
    path: "login/:logout",
    component: LoginComponent,
    canDeactivate: [CanDeactivateGuard],

    data: { title: 'BTCAT | Login' }
  },
  {
    path: "search",
    component: SearchComponent,
    canActivate: [AuthGuard],
    canDeactivate: [CanDeactivateGuard],

    data: { title: 'BTCAT | Search' }
  },
  {
    path: "search/:marcId",
    component: SearchComponent,
    canActivate: [AuthGuard],
    canDeactivate: [CanDeactivateGuard],
    data: { title: 'BTCAT | Search' }
  },

  // { path: "search/:searchFlag", component: SearchComponent, canActivate: [AuthGuard] },
  {
    path: "",
    component: AppLayoutComponent,
    canActivate: [AuthGuard],
    canDeactivate: [CanDeactivateGuard],
    children: [
      {
        path: "authority-view/:authorityId",
        component: AuthorityViewComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        data: { title: 'BTCAT | Search' }
      },
      {
        path: "compare-view/:marcParams",
        component: CompareViewComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],

        data: { title: 'BTCAT | Compare Records' }

      },
      {
        path: "compare-history-view/:marcParams",
        component: CompareHistoryViewComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        data: { title: 'BTCAT | Compare Records' }
      },
      {
        path: "multiple-edit/:marcParams/:count",
        component: MarcEditContainerComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        canActivate: [AuthGuard],
        resolve: { selectedMarcs: MarcEditContainerResolver },
        data: { title: 'BTCAT | Edit Records' }

      },
      {
        path: "bibliographic-edit/:id/:count",
        component: MarcEditComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        canActivate: [AuthGuard],
        data: { title: 'BTCAT | MARC Editor'}
      },
      {
        path: "bibliographic-edit/:id/:count/:reason",
        component: MarcEditComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        canActivate: [AuthGuard],
        data: { title: 'BTCAT | MARC Editor'}
      },
      {
        path: "z3950-edit",
        component: MarcCreateComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],

        data: { title: 'BTCAT | MARC Editor' }
      },
      {
        path: "z3950-clone",
        component: MarcCreateComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],

        data: { title: 'BTCAT | Clone Editor' }
      },
      {
        path: "bibliographic-clone/:id/:count",
        component: MarcCreateComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        canActivate: [AuthGuard],
        data: { title: 'BTCAT | Clone Record',
        permissions: [Permissions.CLN_BIB_MN, Permissions.CLN_BIB_WS] }
      },
      {
        path: "bibliographic-create/:id/:count",
        component: MarcCreateComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        canActivate: [AuthGuard],
        data: { title: 'BTCAT | Create Record',
        permissions: [Permissions.CRT_BIB_MN, Permissions.CRT_BIB_WS] }
      },
      {
        path: "z3950",
        component: Z3950Component,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        canActivate: [AuthGuard],
        data: { title: 'BTCAT | Z39.50 Profiles',
        permissions: [Permissions.CED_Z395]}
      },
      {
        path: "env-settings-crud",
        component: EnvSettingsCrudComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        canActivate: [AuthGuard],
        data: { title: 'BTCAT | Environmental Settings Home',
        permissions: [Permissions.ENV_SETTINGS]}
      },
      {
        path: "env-settings/:id/:custID",
        component: EnvSettingsComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        canActivate: [AuthGuard],
        data: { title: 'BTCAT | Environmental Settings',
        permissions: [Permissions.ENV_SETTINGS]}
      },
      {
        path: "authority-search",
        component: AuthorityResultsComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],

        data: { title: 'BTCAT | Search' }
      },
      {
        path: "templates",
        component: ViewTemplateComponent,
        pathMatch: "full",
        canActivate: [AuthGuard],
        data: { title: 'BTCAT | Templates',
        permissions: [Permissions.CED_GTEMP, Permissions.CED_ITEMP, Permissions.CED_LTEMP] }
      },
      {
        path: "extract",
        component: ExtractComponent,
        canActivate: [AuthGuard],
        canDeactivate: [CanDeactivateGuard],
        data: { title: 'BTCAT | Extract' }
      },
      {
        path: "users",
        component: UserConfigurationComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        canActivate: [AuthGuard],
        data: { title: 'BTCAT | Users',
        permissions: [Permissions.CON_USR] }
      },
      {
        path: "myPreferences",
        component: MyPreferencesComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        data: { title: 'BTCAT | My Preferences' }
      },
      {
        path: "cls-label-configuration",
        component: ClsLabelConfigurationComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        data: { title: 'BTCAT | CLS Label Configuration' }
      },
      {
        path: "cls-label-configuration/:id/:instituteId",
        component: ClsLabelConfigurationComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        data: { title: 'BTCAT | CLS Label Configuration' }
      },
      {
        path: "account-suffix-configuration/:account/:id/:instituteId",
        component: AccountSuffixConfigurationComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        data: { title: 'BTCAT | Account Suffix Configuration' }
      },
      {
        path: "cls-extract-viewlogs",
        component: ViewLogsComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        data: { title: 'BTCAT | CLS Extarct View Logs' }
      },
      {
        path: "create-template/:isNew",
        component: CreateTemplateComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        canActivate: [AuthGuard],
        data: { title: 'BTCAT | New Template',
        permissions: [Permissions.CED_GTEMP, Permissions.CED_ITEMP, Permissions.CED_LTEMP] }
      },
      {
        path: "edit-template/:id",
        component: CreateTemplateComponent,
        pathMatch: "full",
        canActivate: [AuthGuard],
        canDeactivate: [CanDeactivateGuard],
        data: { title: 'BTCAT | Edit Template',
        permissions: [Permissions.CED_GTEMP, Permissions.CED_ITEMP, Permissions.CED_LTEMP] }
      },
      {
        path: "clone-template/:id",
        component: CreateTemplateComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        canActivate: [AuthGuard],
        data: { title:'BTCAT | Clone Template',
        permissions: [Permissions.CED_GTEMP, Permissions.CED_ITEMP, Permissions.CED_LTEMP] }
      },
      {
        path: "new-record",
        component: ViewTemplateComponent,
        pathMatch: "full",
        canActivate: [AuthGuard],
        data: { title:'BTCAT | New Template',
        permissions: [Permissions.CRT_BIB_MN, Permissions.CRT_BIB_WS] }
      },
      {
        path: "merge-marc/:marcParams",
        component: MergeMarcComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        canActivate: [AuthGuard],
        data: { title: 'BTCAT | Merge Marc',
        permissions: [Permissions.MRG_REC] }
      },
      {
        path: "merge-record-history-marc/:recordHistoryMarcParams",
        component: MergeMarcComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        canActivate: [AuthGuard],
        data: { title: 'BTCAT | Merge Record History Marc',
        permissions: [Permissions.MRG_REC] }
      },
      {
        path: "record-history/:recordNumber",
        component: MarcRecordHistoryComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],

        data: { title: 'BTCAT | Record History Compare' }
      },
      {
        path: "macros",
        component: ViewMacroComponent,
        pathMatch: "full",

      },
      {
        path: "create-macro",
        component: CreateMacroComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],

      },
      {
        path: "edit-macro/:id",
        component: CreateMacroComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],

      },
      {
        path: "clone-macro/:id",
        component: CreateMacroComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],

      },
      {
        path: "marc-extract",
        component: MarcExportComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        canActivate: [AuthGuard],
        data: { title: 'BTCAT | MARC Extract',permissions:[Permissions.BT_EXT]}
      },
      {
        path: "upload-record",
        component: UploadRecordFileComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        canActivate: [AuthGuard],
        data: { title: 'BTCAT | Gap Customer File',permissions: [Permissions.GP_CUST_FUNC]}
      },
      {
        path: "batch-macro-execution",
        component: BatchMarcoExecutionComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        canActivate: [AuthGuard],
        data: { title: 'BTCAT | Batch Macro Execution'}
      },
      {
        path: "save_batch-macro-execution/:fromRecordNumber/:toRecordNumber",
        component: BatchMarcoExecutionComponent,
        pathMatch: "full",
        canDeactivate: [CanDeactivateGuard],
        canActivate: [AuthGuard],
        data: { title: 'BTCAT | Batch Macro Execution'}
      },
      {
        path: "cls-configuration",
        component: ClsConfigurationComponent,
        canActivate: [AuthGuard],
        canDeactivate: [CanDeactivateGuard],

        data: { title: 'BTCAT | Cls Configuration' }
      },
      {
        path: "cls-configuration/:id/:instituteId",
        component: ClsConfigurationComponent,
        canActivate: [AuthGuard],
        canDeactivate: [CanDeactivateGuard],

        data: { title: 'BTCAT | Cls Configuration' }
      },
      {
        path: "customer-name-map",
        component: CustomerNameMapComponent,
        canActivate: [AuthGuard],
        canDeactivate: [CanDeactivateGuard],

        data: { title: 'BTCAT | Customer Name Map' }
      },
      {
        path: "ats-review",
        component: ATSReviewComponent,
        canActivate: [AuthGuard],
        data: { title: 'BTCAT | ATS Review' , permissions:[Permissions.ATS_REV]}
      },
      {
        path: "macro-admin",
        component: MacroAdminComponent,
        canActivate: [AuthGuard],
        data: { title: 'BTCAT | Macro Admin' , permissions:[Permissions.CRT_MAC]}
      }
    ]
  },

  {
    path: "login",
    component: LoginComponent,
    canDeactivate: [CanDeactivateGuard],

    data: { title: 'BTCAT | Login' }
  },
  { path: "sessionTimeOut", component: SessionTimeOutComponent,

  data: { title: 'BTCAT | Search' } },
  {
    path: "error",
    component: GlobalErrorComponent,
    canDeactivate: [CanDeactivateGuard],

    data: { title: 'BTCAT | Error' }
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent,
    pathMatch: "full",

    data: { title: 'BTCAT | UnAuthorized'}
  },
  {
    path: "**",
    component: PageNotFoundComponent,
    canDeactivate: [CanDeactivateGuard],
    data: { title: 'BTCAT | UnAuthorized'}
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
