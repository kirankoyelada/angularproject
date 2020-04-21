import { Component, OnInit,Output,EventEmitter, Input } from "@angular/core";
import { FormGroup, FormArray, FormBuilder } from "@angular/forms";
import { AddMoreService } from "./addmore-search.service";
import { SearchItem } from "./SearchItem";
import { Constants } from "src/app/constants/constants";
import { DropResult } from 'ngx-smooth-dnd';

@Component({
  selector: "app-searchbox-addmore",
  templateUrl: "./search-box-add-more.component.html"
})
export class SearchBoxAddMoreComponent implements OnInit {
  addMoreForm: FormGroup;
  searchitems: FormArray;

  @Input()
  defaultAddedItems: SearchItem[];
  addmoreItems: SearchItem[];
  isMoreItemsAdded:boolean;

  @Output()
  MoreItemsAdded: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(
    private formBuilder: FormBuilder,
    private addmoreService: AddMoreService
  ) {}

  ngOnInit() {
    this.addMoreForm = this.formBuilder.group({
      searchitems: this.formBuilder.array([])
    });
    // this.addmoreItems = this.addmoreService.loadAllSearchItems().pipe(
    //   tap(user => this.addMoreForm.patchValue(user))
    // );
    if (
      localStorage.getItem(Constants.LocalStorage.ADDMORESETTINGS) == null ||
      localStorage.getItem(Constants.LocalStorage.ADDMORESETTINGS) === ""
    ) {
      this.addmoreService.loadAllSearchItems().subscribe(result => {
        this.addmoreItems = result;

        localStorage.setItem(
          Constants.LocalStorage.ADDMORESETTINGS,
          JSON.stringify(this.addmoreItems)
        );
      });
    } else {
      var data = localStorage.getItem(Constants.LocalStorage.ADDMORESETTINGS);
      this.addmoreItems = JSON.parse(data);
    }
  }

  submit(items: SearchItem[]) {
    localStorage.setItem(
      Constants.LocalStorage.ADDMORESETTINGS,
      JSON.stringify(items)
    );
    this.OnMoreItemsAdded();
  }

  onSearchFieldDrop(dropResult: DropResult) {
    this.addmoreItems = this.applyDrag(this.addmoreItems, dropResult);
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

  OnMoreItemsAdded()
  {
     this.isMoreItemsAdded=true;
     this.MoreItemsAdded.emit(this.isMoreItemsAdded);
  }

  resetAddOrMoreItems(){
    this.addmoreItems = this.defaultAddedItems;
  }
  //clear the unchecked columns on click esc key button
  onKeyDown(event)
  {
    this.resetAddOrMoreItems();
  }
}
