import { Component, OnInit, Output, EventEmitter, Input, AfterViewChecked } from "@angular/core";
import { FormGroup, FormArray, FormBuilder } from "@angular/forms";
import { SearchService } from 'src/app/services/search.service';
import { AddMoreService } from "../addmore/addmore-search.service";
import * as $ from "jquery";
import { Constants } from 'src/app/constants/constants';
import { SearchItem } from '../addmore/SearchItem';
import { SpinnerService } from '../../interceptor/spinner.service';

declare var $: any;

@Component({
    selector: "search-history",
    templateUrl: "./search-history.component.html"
})
export class SearchHistoryComponent implements OnInit, AfterViewChecked {
    searchHistoryData: any = {};
    //startSpinner: boolean = false;
    @Output() eventEmitterDoubleClick = new EventEmitter<any>();
    @Output() closeModalEvent = new EventEmitter<any>();
    searchFieldsData: SearchItem[];
    table: any;

    constructor(private service: SearchService,
        private addmoreService: AddMoreService,
        private spinnerService: SpinnerService) { }

        get loading(): boolean {
            return (this.spinnerService._loadingDefault);
        }

    ngOnInit() {

        if (
            localStorage.getItem(Constants.LocalStorage.ADDMORESETTINGS) == null ||
            localStorage.getItem(Constants.LocalStorage.ADDMORESETTINGS) === ""
        ) {
            this.addmoreService.loadAllSearchItems().subscribe(result => {
                this.searchFieldsData = result;

                localStorage.setItem(
                    Constants.LocalStorage.ADDMORESETTINGS,
                    JSON.stringify(this.searchFieldsData)
                );
            });
        } else {
            var data = localStorage.getItem(Constants.LocalStorage.ADDMORESETTINGS);
            this.searchFieldsData = JSON.parse(data);
        }
        this.loadSearchHistoryData();
    }
    // load search history data
    loadSearchHistoryData() {
        if (
            localStorage.getItem("actor") != null &&
            localStorage.getItem("actor") != ""
        ) {
            //this.startSpinner = true;
            //this.spinnerService.onRequestStarted();
            this.searchHistoryData = {};
            this.spinnerService.spinnerStart();
            let userId = localStorage.getItem("actor");
            this.service.getSearchHistory(userId).subscribe(
                item => {
                    //this.startSpinner = false;
                    //this.spinnerService.onRequestFinished();
                    this.spinnerService.spinnerStop();
                    this.searchHistoryData = item;
                    if (this.searchHistoryData && Object.keys(this.searchHistoryData).length > 0) {
                        this.searchHistoryData.searchOperations.forEach(searchItem => {

                            var finalResponse = JSON.parse(localStorage.getItem(
                                Constants.LocalStorage.SAVECATALOGITEMS
                              ));

                            searchItem.catalogs.forEach(function(catalog,index,theArray){
                                var profileData=finalResponse.filter(
                                    x => (x.profileName===catalog)
                                  );
                                  if(profileData==null || profileData.length==0){
                                      //if(catalog!="BTCAT Authority Main" && catalog!="B & T" && catalog!="BTCAT Workspace")
                                    theArray[index]=catalog+" (inactive)";
                                  }
                            });

                            searchItem.searchCriteria.forEach(search => {
                                if (this.searchFieldsData && this.searchFieldsData.length > 0 && search && search.searchField) {
                                    let field = this.searchFieldsData.find(x => x.fieldName == search.searchField);
                                    if (field) {
                                        search["sType"] = field.isContainOptions;
                                        search["displayName"] = field.displayName;
                                    }
                                    else {
                                        search["displayName"] = '';
                                    }
                                }
                                search["displayTerm"] = this.getSearchTerm(search);
                            });

                        });
                    }
                },
                error => {
                    //this.startSpinner = false;
                    //this.spinnerService.onRequestFinished();
                    this.spinnerService.spinnerStop();
                }
            );
        }
    }
    eventEmitDoubleClick(history: any) {
        $("#searchHistoryModal").modal("hide");
        this.eventEmitterDoubleClick.emit(history);
        this.closeModalEvent.emit(false);
    }
    OnDialogClose() {
        this.closeModalEvent.emit(false);
    }
    getSearchField(searchItem: any) {
        if (this.searchFieldsData && this.searchFieldsData.length > 0 && searchItem && searchItem.searchField) {
            let field = this.searchFieldsData.find(x => x.fieldName == searchItem.searchField);
            if (field) {
                searchItem["sType"] = field.isContainOptions;
                return field.displayName;
            }
        }
        return '';
    }
    ngAfterViewChecked() {
        if (this.searchHistoryData && this.searchHistoryData.searchOperations && this.searchHistoryData.searchOperations.length > 0) {
            if ($.fn.dataTable.isDataTable("#searchHistory")) {
                this.table = $("#searchHistory").DataTable();
            } else {
                this.table = $("#searchHistory").DataTable({
                    paging: false,
                    searching: false,
                    info: false,
                    sort: false,
                    fixedHeader: true,
                    autoWidth: false,
                    scrollX: false, scrollY: 220
                });
                $("#searchHistory").dataTable().fnDraw();
            }
        }

    }
    getSearchTerm(search: any) {
        if (search.searchField != 'PubDate') {
            return search.searchTerm;
        }
        else {
            let PubDate = search.searchTerm.split(',');
            if (PubDate[1] && PubDate[1] != '') {
                return search.searchTerm
            }
            else {
                return PubDate[0];
            }
        }
    }
}
