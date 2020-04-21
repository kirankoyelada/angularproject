import { Component, Input,Output,EventEmitter } from "@angular/core";
import { Constants } from "src/app/constants/constants";
import { Columns } from "./Columns";
import { DropResult } from 'ngx-smooth-dnd';
declare var $: any;

@Component({
  selector: "app-searchresults-columns",
  templateUrl: "./search-results-columns.component.html"
})
export class SearchResultsColumnsComponent  {
  @Input()
  tableFields:Columns[];

  @Input() showModal:boolean;

  @Output()
  OnGridColumnsAdded: EventEmitter<Columns[]> = new EventEmitter<Columns[]>();

  ngOnInit() {
    this.showModal = true;
    // if (
    //   localStorage.getItem(Constants.LocalStorage.ADDMORECOLUMNS) != null ||
    //   localStorage.getItem(Constants.LocalStorage.ADDMORECOLUMNS) != ""
    // ) {
    //     var data = localStorage.getItem(Constants.LocalStorage.ADDMORECOLUMNS);
    //     this.tableFields = JSON.parse(data);
    // }
  }

  onClickPopUp(event){
    this.showModal = true;
  }

  onCrossClick(event)
  {
    if(event.target.classList.contains('closePopUp') && event.target.classList.contains('close'))
    {
      if (
        localStorage.getItem(Constants.LocalStorage.ADDMORECOLUMNS) != null ||
        localStorage.getItem(Constants.LocalStorage.ADDMORECOLUMNS) != ""
      ) {
          var data = localStorage.getItem(Constants.LocalStorage.ADDMORECOLUMNS);
          this.tableFields = JSON.parse(data);
      }
    }
    $('#addMoreColumnsBody').scrollTop(0);
    $("#addMoreColumns").modal("hide");
  }

  onDropColumn(dropResult: DropResult) {

    this.tableFields = this.applyDrag(this.tableFields, dropResult);
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

  addRemoveColumns(columns: Columns[]) {
    localStorage.setItem(
      Constants.LocalStorage.ADDMORECOLUMNS,
      JSON.stringify(this.tableFields)
    );
    this.OnGridColumnsAdded.emit(this.tableFields);
    $('#addMoreColumnsBody').scrollTop(0);
    $("#addMoreColumns").modal("hide");
  }

  resetTableColumns(){
    if (
      localStorage.getItem(Constants.LocalStorage.ADDMORECOLUMNS) != null ||
      localStorage.getItem(Constants.LocalStorage.ADDMORECOLUMNS) != ""
    ) {
        var data = localStorage.getItem(Constants.LocalStorage.ADDMORECOLUMNS);
        this.tableFields = JSON.parse(data);
    }
    $('#addMoreColumnsBody').scrollTop(0);
    $("#addMoreColumns").modal("hide");
  }
  //clear the unchecked columns on click esc key button
  onKeyDown(event)
  {
    this.resetTableColumns();
  }
}

