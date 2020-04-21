import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
// 3rd party Modules
import { NgxSmoothDnDModule } from 'ngx-smooth-dnd';
import { NgxPageScrollCoreModule } from 'ngx-page-scroll-core';
import { NgxPageScrollModule } from 'ngx-page-scroll';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatSelectModule } from '@angular/material/select';
import { ScrollDispatchModule } from '@angular/cdk/scrolling';
import { UserIdleModule } from 'angular-user-idle';
import { Ng5SliderModule } from 'ng5-slider';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {HotkeyModule} from 'angular2-hotkeys';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ColorPickerModule } from 'ngx-color-picker';

// Material Modules
import {
  MatSortModule,
  MatTooltipModule,
  MatInputModule,
  MatAutocompleteModule,
  MatDialogModule,
  MatButtonModule,
  MAT_AUTOCOMPLETE_SCROLL_STRATEGY,
  MatTableModule,
  MatCheckboxModule,
  MatTabsModule,
  MatIconModule
} from '@angular/material';

// Components
import { AppComponent } from './app.component';
import { HeaderComponent } from './shared/header/header.component';
import { MenuComponent } from './menu/menu.component';
import { SearchComponent } from './search/search.component';
import { SearchResultsComponent } from './search-results/search-results.component';
import { AuthorityResultsComponent } from './authority-results/authority-results.component';
import { LoginComponent } from './login/login.component';
import { MarcViewComponent } from './marc/marc-view/marc-view.component';
import { MultipleMarcViewComponent } from './marc/multiple-marc-view/multiple-marc-view.component';
import { AuthorityViewComponent } from './marc/authority-view/authority-view.component';
import { AppLayoutComponent } from './shared/_layout/app-layout/app-layout.component';
import { SearchBoxComponent } from './shared/search-box/search-box.component';
import { CompareViewComponent } from './marc/compare-view/compare-view.component';
import { MarcEditComponent } from './marc/marc-edit/marc-edit.component';
import { TextEditorComponent } from './marc/shared/text-editor/texteditor.component';
import { MarcFieldViewComponent } from './marc/shared/marc-field-view/marc-field-view.component';
import { UnauthorizedComponent } from './security/unauthorized.component';

// Services
import { SearchService } from './services/search.service';
import { MarcService } from './marc/shared/service/marc-service';
import { MarcSettingsService } from './services/marc-settings.service';
import { AuthGuard } from './security/auth.guard';
import { ClonerService } from 'src/app/services/cloner.service';


import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';

import { CommonService } from './shared/service/common.service';
import { MarcDifferentiatorComponent } from './marc/marc-differentiator/marc-differentiator.component';
import { MarcEditSubElementsComponent } from './marc/shared/marc-subelements/marc-edit-subelements.component';
import { PageNotFoundComponent } from './page-not-found.component';
import { GlobalErrorComponent } from './global-error.component';
import { GlobalErrorHandlerService } from './global-error-handler.service';
import { MatProgressBarModule, MatProgressSpinnerModule } from '@angular/material';
import { CanDeactivateGuard } from './can-deactivate/can-deactivate.guard';
import { ConfirmationDialogComponent } from './components/shared/confirmation-dialog/confirmation-dialog.component';
import { SearchBoxAddMoreComponent } from './shared/search-box/addmore/search-box-add-more.component';
import { AddMoreService } from './shared/search-box/addmore/addmore-search.service';
import { SessionTimeOutComponent } from './sessiontimeout/sessiontimeout.component';
import { ContextMenuComponent } from './marc/marc-edit/context-menu/context-menu.component';
import { SearchHistoryComponent } from './shared/search-box/search-history/search-history.component';

import { SearchResultsColumnsComponent } from './search-results/search-results-columns/search-results-columns.component';
import { AddMoreColumnsService } from './search-results/search-results-columns/search-results-columns.service';
import { Z3950Component } from './Z39.50Profile/component/z3950.component';
import { SearchCatalogComponent } from './shared/search-box/search-catalogs/search-catalog.component';
import { SearchCatalogService } from './shared/search-box/search-catalogs/search-catalog.service';
import { CustomHttpInterceptor } from './shared/interceptor/customHttpInterceptor';
import { SpinnerService } from './shared/interceptor/spinner.service';
import { PreviousRouteService } from './services/previousRouteService';
import { CreateTemplateComponent } from './template/create-template/create-template.component';
import { ViewTemplateComponent } from './template/view-template/view-template.component';
import { TemplateDataAdapter } from './template/shared/service/template-data-adapter.service';
import { MergeMarcComponent } from './marc/merge-marc/merge-marc.component';
import { MarcFieldComponent } from './marc/shared/marc-field/marc-field.component';
import { LDRConversionPipe } from './marc/shared/pipes/ldrconversion.pipe';
import { MarcRecordHistoryComponent } from './marc/marc-record-history/marc-record-history.component';
import { CompareHistoryViewComponent } from './marc/compare-history-view/compare-history-view.component';
import { MarcHistoryDifferentiatorComponent } from './marc/marc-history-differentiator/marc-history-differentiator.component';
import { MultipleMarcHistoryViewComponent } from './marc/multiple-marc-history-view/multiple-marc-history-view.component';
import { MarcCreateComponent } from './marc/marc-create/marc-create.component';
import { CreateMacroComponent } from './macro/create-macro/create-macro.component';
import { ViewMacroComponent } from './macro/view-macro/view-macro.component';
import { ExecuteMacroComponent } from './macro/execute-macro/execute-macro.component';
import { A11yModule } from '@angular/cdk/a11y';
import { UserConfigurationComponent } from './users/user-configuration/user-configuration.component';
import { FilterPipePipe } from './filter-pipe.pipe';
import { SelectconversionPipe } from './marc/shared/pipes/selectconversion.pipe';
import { BaseComponent } from './base.component';
import { AuthenticationService } from './security/authentication.service';
import { TokenInterceptor } from './security/token.interceptor';
import { MyPreferencesComponent } from './preferences/my-preferences/my-preferences.component';
import { MarcExportComponent } from './marc-export/marc-export.component';
import {CheckboxGroupComponent} from './shared/checkboxctrl/checkbox-group.component';
import {CheckboxComponent} from './shared/checkboxctrl/checkbox.component';

// Directives
import { MarcEditorDirective } from '../../src/app/directives/marc-editor.directive';
import { OnlyNumber } from './onlynumber.directive';
import { OnlyNumberAndSpace } from './onlynumberandspace.directive';
import { AllowHypenNumberOnlyDirective } from './allowhypennumberonly.directive';
import { AllowHashNumberOnlyDirective } from './allowhashnumberonly.directive';
import { MarcTagValidationfactoryDirective } from './marc/validators/marc-tag-validationfactory.directive';
import { AutosizeDirective } from './directives/autosize.directive';
import { AllowNumberXOnlyDirective } from './allownumberxonly.directive';
import { MoveNextByMaxLengthDirective } from './movenextbymaxlength.directive';
import { AllowCommaNumberOnlyDirective } from './allowcommanumberonly.directive';
import { SortPipe } from './shared/pipe/sort.pipe';
import { CustomerNameMapComponent } from './customer/customer-name-map/customer-name-map.component';
import { ClsLabelConfigurationComponent } from './customer/cls-label-configuration/cls-label-configuration.component';
import { UploadRecordFileComponent } from './upload-record-file/upload-record-file.component';
import { CustomerFilterPipe } from './customer-filter-pipe.pipe';
import { ClsConfigurationComponent } from './customer/cls-configuration/cls-configuration.component';
import { FilterCustomerByNamePipe } from './customer/shared/pipes/filter-customer-by-name.pipe';
import { FilterCustomerByIdPipe } from './customer/shared/pipes/filter-customer-by-id.pipe';
import { FilterCustomerByAccountNumberPipe } from './customer/shared/pipes/filter-customer-by-accountNumber.pipe';
import { ExtractComponent } from './extract/extract/extract.component';
import { BatchMarcoExecutionComponent } from './batch-marco-execution/batch-marco-execution.component';
import { AccountSuffixConfigurationComponent } from './customer/cls-configuration/account-suffix-configuration/account-suffix-configuration.component';
import { ATSReviewComponent } from './ats-review/ats-review.component';
import { ExtractService } from './extract/extract/extract.service';
import { AtsReviewService } from './ats-review/ats-review.service';
import { Undo979Tag } from './extract/extract/undo979tag.component';
import { ATSReviewConfigureColumnsComponent } from './ats-review/configure-columns/configure-columns.component';
import { SearchPipe } from './search-pipe';
import { ConfigurationService, Configuration } from './services/configuration.service';
import { ViewLogsComponent } from './extract/extract/viewlogs.component';
import { EnvSettingsComponent } from './env-settings/env-settings.component';
import { MarcEditContainerComponent } from './marc/marc-edit-container/marc-edit-container.component';
import { TagCreateComponent } from './marc/shared/tag-create/tag-create.component';
import { EnvSettingsCrudComponent } from './env-settings/env-settings-crud/env-settings-crud.component';
import { MarcEditContainerResolver } from './marc/marc-edit-container/marc-edit-container.resolver';
import { FilterInstitutionsPipePipe } from './env-settings/filter-institutions-pipe.pipe';
import { MarcEditContainerAdapterService } from './marc/marc-edit-container/marc-edit-container-adapter.service';
import { MacroAdminComponent } from './macro/macro-admin/macro-admin.component';
@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    MenuComponent,
    SearchComponent,
    MarcEditComponent,
    MarcCreateComponent,
    SearchResultsComponent,
    LoginComponent,
    MarcViewComponent,
    OnlyNumber,
    OnlyNumberAndSpace,
    AllowHypenNumberOnlyDirective,
    AllowNumberXOnlyDirective,
    AllowHashNumberOnlyDirective,
    MoveNextByMaxLengthDirective,
    AllowCommaNumberOnlyDirective,
    MarcDifferentiatorComponent,
    MultipleMarcViewComponent,
    GlobalErrorComponent,
    PageNotFoundComponent,
    AuthorityViewComponent,
    AppLayoutComponent,
    SearchBoxComponent,
    SearchBoxAddMoreComponent,
    CompareViewComponent,
    ConfirmationDialogComponent,
    SessionTimeOutComponent,
    MarcEditorDirective,
    ContextMenuComponent,
    MarcEditSubElementsComponent,
    SearchHistoryComponent,
    SearchResultsColumnsComponent,
    Z3950Component,
    AuthorityResultsComponent,
    SearchCatalogComponent,
    TextEditorComponent,
    AutosizeDirective,
    ViewTemplateComponent,
    CreateTemplateComponent,
    MergeMarcComponent,
    MarcFieldViewComponent,
    MarcFieldComponent,
    LDRConversionPipe,
    MarcRecordHistoryComponent,
    CompareHistoryViewComponent,
    MarcHistoryDifferentiatorComponent,
    MarcTagValidationfactoryDirective,
    MultipleMarcHistoryViewComponent,
    CreateMacroComponent,
    ViewMacroComponent,
    ExecuteMacroComponent,
    UserConfigurationComponent,
    FilterPipePipe,
    CustomerFilterPipe,
    FilterCustomerByNamePipe,
    FilterCustomerByAccountNumberPipe,
    UnauthorizedComponent,
    SelectconversionPipe,
    MyPreferencesComponent,
    MarcExportComponent,
    CheckboxGroupComponent,
    CheckboxComponent,
    SortPipe,
    CustomerNameMapComponent,
    ClsLabelConfigurationComponent,
    UploadRecordFileComponent,
    ClsConfigurationComponent,
    ExtractComponent,
    FilterCustomerByIdPipe,
    BatchMarcoExecutionComponent,
    AccountSuffixConfigurationComponent,
    ATSReviewComponent,
    Undo979Tag,
    ATSReviewConfigureColumnsComponent,
    SearchPipe,
    ViewLogsComponent,
    EnvSettingsComponent,
    MarcEditContainerComponent,
    TagCreateComponent,
    EnvSettingsCrudComponent,
    FilterInstitutionsPipePipe,
    MacroAdminComponent,
    TagCreateComponent
  ],
  imports: [
    BrowserModule,
    MatTabsModule,
    MatIconModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    MatSortModule,
    MatTooltipModule,
    BrowserAnimationsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    Ng5SliderModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    DragDropModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    ScrollDispatchModule,
    NgxSmoothDnDModule,
    NgxPageScrollCoreModule.forRoot({ duration: 50, _logLevel: 3 }),
    NgxPageScrollModule,
    NgbModule.forRoot(),
    A11yModule,
    MatTableModule,
    MatCheckboxModule,
    // Set the config values in service
    UserIdleModule.forRoot({}),
    HotkeyModule.forRoot(),
    ColorPickerModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CustomHttpInterceptor,
      multi: true,
    },
    {
      provide: ConfigurationService,
      useFactory: configurationServiceFactory
    },
    SearchService,
    CommonService,
    MarcService,
    MarcSettingsService,
    MarcEditContainerResolver,
    MarcEditContainerAdapterService,
    TemplateDataAdapter,
    AddMoreService,
    AddMoreColumnsService,
    SearchCatalogService,
    GlobalErrorHandlerService,
    SpinnerService,
    PreviousRouteService,
    ClonerService,
    ExtractService,
    AuthGuard,
    CanDeactivateGuard,
    {
      provide: ApplicationInsights,
      useFactory: appInsightsFactory,
      deps: [ConfigurationService]
    },
    AuthenticationService,
    AtsReviewService
  ],
  bootstrap: [AppComponent],
  entryComponents: [ConfirmationDialogComponent, Undo979Tag, ATSReviewConfigureColumnsComponent, TagCreateComponent]
})

export class AppModule {}

export function appInsightsFactory(appConfig: ConfigurationService): ApplicationInsights {
  return new ApplicationInsights({
    config: {
      instrumentationKey: appConfig.currentConfiguration().azureAppInsightsInstrumentationKey
    }
  });
}

export function configurationServiceFactory(): ConfigurationService {
  const configuration = new Configuration();
  const configurationService = new ConfigurationService();

  // Read environment variables from browser window
  const browserWindow = window || {};
  const browserWindowEnv = browserWindow['__env'] || {};

  // Assign environment variables from browser window to settings
  // In the current implementation, properties from appSettings.js overwrite defaults from the SettingsService.
  // If needed, a deep merge can be performed here to merge properties instead of overwriting them.
  for (const key in browserWindowEnv) {
    if (browserWindowEnv.hasOwnProperty(key)) {
      configuration[key] = window['__env'][key];
    }
  }

  configurationService.setConfiguration(configuration);
  return configurationService;
};
