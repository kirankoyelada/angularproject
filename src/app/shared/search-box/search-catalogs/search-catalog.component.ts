import { Component, OnInit,Output,EventEmitter, Input } from "@angular/core";
import { FormGroup, FormArray, FormBuilder } from "@angular/forms";
import { SearchCatalogService } from "./search-catalog.service";
import { SearchCatalogItem } from "./searchCatalogItem";
import { Constants } from "src/app/constants/constants";
import { Z3950Profile } from 'src/app/Z39.50Profile/model/z3950';
import { Z3950Service } from 'src/app/Z39.50Profile/service/z3950.service';
import { SpinnerService } from '../../interceptor/spinner.service';
import { DropResult } from 'ngx-smooth-dnd';
import { BaseComponent } from 'src/app/base.component';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/security/authentication.service';

@Component({
  selector: "app-searchcatalog",
  templateUrl: "./search-catalog.component.html"
})
export class SearchCatalogComponent extends BaseComponent implements OnInit {

  @Input()
  defaultCatalogItems: any;
  @Input() hasSearchMainPermission: boolean = true;
  @Input() hasSearchWorkspacePermission: boolean = true;
  @Input() hasSearchAuthorityPermission: boolean = false;
  @Input() hasSearchDeleteMainRecordsPermission: boolean = false;
  @Input() hasSearchDeleteWSRecordsPermission: boolean = false;
  @Input() hasSearchCustomerDelWSPermission: boolean = false;
  @Input() hasSearchDelRecordsPermission: boolean = false;

  searchCatalogItems: any;
  defaultCatalogs: any = [];
  isCatalogSaved: boolean;
  isDeletedDBSelected: boolean = false;
  @Output()
  selectedCatalogItemsAdded: EventEmitter<boolean> = new EventEmitter<boolean>();
  z3950CatalogItems: any;
  disableDeleteRadioButton: boolean =false;
  disableZ3950RadioButton: boolean = false;
  disableDatabaseRadioButton: boolean = false;

  get isDefaultCatalogsSelected(): any {
    if (this.searchCatalogItems && this.searchCatalogItems.filter(x => x.isActive).length === 0) {
      this.isDeletedDBSelected = false;
      return null;
    } // None
    else if (this.searchCatalogItems && this.searchCatalogItems.filter(x => x.isActive && x.profileName == Constants.DELETEDDBPROFILENAME).length == 1
    ) {
      this.isDeletedDBSelected = true;
      return 'deletedDB';
    } // Deleted DB
    else if (this.searchCatalogItems && this.searchCatalogItems.filter(x => x.isActive && x.profileName != Constants.DELETEDDBPROFILENAME && isNaN(x.id)).length > 0) {
      this.isDeletedDBSelected = false;
      return false;
    } // Z39.50
    else {
      this.isDeletedDBSelected = false;
      return true;
    } // Databases
  }

  get hasAllCatalogs():boolean{
    var catalogCount = 0;
    
    catalogCount = this.searchCatalogItems && this.searchCatalogItems.filter(
      x =>
        this.defaultCatalogs.findIndex(c => c.id == x.id && c.profileName != Constants.DELETEDDBPROFILENAME) > -1
    ).length > 0 ? catalogCount + 1 : catalogCount;

    catalogCount =this.searchCatalogItems.filter(
      x =>
        this.defaultCatalogs.findIndex(c => c.id == x.id) === -1
    ).length > 0 ? catalogCount + 1 : catalogCount;
    
    catalogCount =this.searchCatalogItems && this.searchCatalogItems.filter(
      x =>
        this.defaultCatalogs.findIndex(c => c.id == x.id && c.profileName == Constants.DELETEDDBPROFILENAME) > -1
    ).length > 0 ? catalogCount + 1 : catalogCount;

    return catalogCount > 1;
  }

  constructor(
    private z3950Service:Z3950Service,
    private router: Router,
    private authenticationService: AuthenticationService,
    private spinnerService: SpinnerService
  ) {super(router, authenticationService);}


  ngOnInit() {
    this.defaultCatalogs=JSON.parse(localStorage.getItem(Constants.LocalStorage.DEFAULTCATALOGS));
    //this.searchCatalogItems=JSON.parse(this.defaultCatalogs);
    if (
      localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS) == null ||
      localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS) === ""
    ) {

      //this.spinnerService.onRequestStarted();
      this.spinnerService.spinnerStart();

      this.z3950Service.getAllZ3950Profiles().subscribe(result => {

        //this.spinnerService.onRequestFinished();
        this.spinnerService.spinnerStop();
        result.forEach(x=> {
          x.isActive = false;
          x.NonEncrypt = false;
        });

        this.z3950CatalogItems = [...this.defaultCatalogs,...result];
        this.searchCatalogItems =this.z3950CatalogItems;
        localStorage.setItem(
          Constants.LocalStorage.SAVECATALOGITEMS,
          JSON.stringify(this.z3950CatalogItems)
        );

      });
    } else {
      this.resetSelectionBasedonPermission();
      var data = localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS);
      this.searchCatalogItems = JSON.parse(data);
      this.enableDisableCatalogButtons();
    }
  }

  enableDisableCatalogButtons() {
  var delValue=this.searchCatalogItems.filter(x =>this.defaultCatalogs.findIndex(c => c.id == x.id && c.profileName == Constants.DELETEDDBPROFILENAME) > -1).length > 0;
  var z3950Value=this.searchCatalogItems.filter(x =>this.defaultCatalogs.findIndex(c => c.id == x.id) === -1).length > 0;
  var databaseValue=this.searchCatalogItems.filter(x =>this.defaultCatalogs.findIndex(c => c.id == x.id && c.profileName != Constants.DELETEDDBPROFILENAME) > -1).length > 0;
  this.disableZ3950RadioButton=!z3950Value;
  this.disableDatabaseRadioButton=!databaseValue
  this.disableDeleteRadioButton=!delValue;
  }

  ngOnChanges()
  {
    var data = localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS);
    if (data)
      this.searchCatalogItems = JSON.parse(data);
    this.resetSelectionBasedonPermission();
    this.enableDisableCatalogButtons();
  }
  // disable the save button if we are not select any values from the search catalog screen
  DisableSearchCatalogSave(items: any) {
    var filterItems = items.filter(x => x.isActive);
    if(filterItems.length > 0 )
      return false;
    else
      return true;
  }

  submit(items: any) {
    var localCatalogs=JSON.parse(localStorage.getItem(Constants.LocalStorage.SAVECATALOGITEMS));
    localStorage.setItem(
      Constants.LocalStorage.SAVECATALOGITEMS,
      JSON.stringify(items)
    );
    if(items.findIndex(c => c.profileName == Constants.DELETEDDBPROFILENAME && c.isActive == true) !== -1){
      localStorage.setItem(Constants.LocalStorage.DELETEDDBCHECKED,"true");
    }else{
      localStorage.removeItem(Constants.LocalStorage.DELETEDDBCHECKED);
    }
    if(items.filter(m=>localCatalogs.findIndex(sp=>sp.id == m.id && sp.isActive == true && m.isActive == true) !== -1).length === 0){
      localStorage.removeItem(Constants.LocalStorage.BIBSEARCHREQUEST);
      localStorage.removeItem(Constants.LocalStorage.SEARCHZ3950REQUEST);
      localStorage.removeItem(Constants.LocalStorage.AUTHSEARCHREQUEST);
      this.router.navigate(["/search"]);
    }
    this.OnMoreItemsAdded();
  }

  OnMoreItemsAdded()
  {
    this.isCatalogSaved=true;
    this.selectedCatalogItemsAdded.emit(this.isCatalogSaved);
  }

  resetCatalogItems(){
    this.searchCatalogItems = this.defaultCatalogItems;
  }

  toggleSelectionCatalogItems(defaultCatalog: any){
    this.searchCatalogItems.forEach(catalogItems => {
      catalogItems.isActive = defaultCatalog == null ? false : (
        (!defaultCatalog && this.defaultCatalogs.findIndex(c => c.id == catalogItems.id) === -1) ||
        (defaultCatalog && this.defaultCatalogs.findIndex(c => c.id == catalogItems.id) > -1 && (
          (catalogItems.id === "1" && this.hasSearchMainPermission) ||
          (catalogItems.id === "2" && this.hasSearchWorkspacePermission) ||
          (catalogItems.id != "1" && catalogItems.id != "2")
        )));
    });

    // On click of "Databases", Constants.DELETEDDBPROFILENAME should get unselected
    if (defaultCatalog === true) {
      this.searchCatalogItems.forEach(catalogItem => {
        if (catalogItem.profileName === Constants.DELETEDDBPROFILENAME) {
          catalogItem.isActive = false;
        }
      });
    }

    // Only Constants.DELETEDDBPROFILENAME should get checked on selecting Constants.DELETEDDBPROFILENAME
    if (defaultCatalog === 'deletedDB') {
      this.isDeletedDBSelected = true;

      this.searchCatalogItems.forEach(
        catalogItem => {
          catalogItem.isActive =
            (catalogItem.profileName === Constants.DELETEDDBPROFILENAME&& (this.hasSearchDeleteMainRecordsPermission || this.hasSearchDeleteWSRecordsPermission ||
              this.hasSearchCustomerDelWSPermission || this.hasSearchDelRecordsPermission))
        });
    } else {
      this.isDeletedDBSelected = false;
    }
  }
  enableCheckBox(catalogId:string): boolean {
    var filterItems = this.searchCatalogItems.filter(
      x =>
        x.isActive &&
        this.defaultCatalogs.findIndex(c=> c.id == x.id) > -1
    );
    var z3950profiles = this.searchCatalogItems.filter(
      x =>
        x.isActive &&
        this.defaultCatalogs.findIndex(c=> c.id == x.id) === -1
    );
    if(filterItems.length>0 &&
      this.defaultCatalogs.findIndex(c=> c.id == catalogId) === -1){//catalogId!="1" && catalogId!="2" && catalogId!="3"){
      return false;
    } else if (catalogId === "12" && this.defaultCatalogs.findIndex(c => c.id == catalogId)>-1) {
      return (this.isDefaultCatalogsSelected == null && (this.hasSearchDeleteMainRecordsPermission || this.hasSearchDeleteWSRecordsPermission ||
        this.hasSearchCustomerDelWSPermission || this.hasSearchDelRecordsPermission)
        || this.isDeletedDBSelected);
    } else if (catalogId != "12" && this.isDeletedDBSelected) {
      return false;
    }
    else{
      if(z3950profiles.length>0 &&  this.defaultCatalogs.findIndex(c=> c.id == catalogId) > -1){//(catalogId==="1" || catalogId==="2" || catalogId==="3")){
        return false;
      }
      else if(filterItems.length>0 && this.defaultCatalogs.findIndex(c=> c.id == catalogId) > -1){//(catalogId==="1" || catalogId==="2" || catalogId==="3")){
        return (catalogId === "1" && this.hasSearchMainPermission) ||
          (catalogId === "2" && this.hasSearchWorkspacePermission) ||
          (catalogId === "3" && this.hasSearchAuthorityPermission) || (
            this.defaultCatalogs.findIndex(c=> c.id == catalogId) > -1 &&
            ((catalogId != "1" && catalogId != "2" && catalogId != "3"))
          );
      }
      else{
        if (catalogId == "1" || catalogId == "2" || catalogId == "3") {
          return (catalogId == "1" && this.hasSearchMainPermission) ||
            (catalogId == "2" && this.hasSearchWorkspacePermission) ||
            (catalogId == "3" && this.hasSearchAuthorityPermission);
        }
        else {
          return true;
        }
      }
    }
  }

  resetSelectionBasedonPermission() {
    if (this.searchCatalogItems) {
      this.searchCatalogItems.forEach(item => {
        if (item.id == "1" || item.id == "2" || item.id == "3") {
          item.isActive = item.isActive && this.enableCheckBox(item.id);
        }
      });
    }
  }

  onSearchFieldDrop(dropResult: DropResult) {
    this.searchCatalogItems = this.applyDrag(this.searchCatalogItems, dropResult);
  }

  applyDrag = (arr, dragResult) => {
    const { removedIndex, addedIndex, payload } = dragResult;
    if (removedIndex === null && addedIndex === null) { return arr; }

    const result = [...arr];
    let itemToAdd = payload;

    if (removedIndex !== null) {
      itemToAdd = result.splice(removedIndex, 1)[0];
    }

    if (addedIndex !== null) {
      result.splice(addedIndex, 0, itemToAdd);
    }

    return result;
  }
}
