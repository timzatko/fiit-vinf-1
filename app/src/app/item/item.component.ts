import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from "@angular/core";
import { Item } from "./item";
import { Document } from "../elastic-search/elastic-search.types";
import { Router } from "@angular/router";

@Component({
  selector: "app-item",
  templateUrl: "./item.component.html",
  styleUrls: ["./item.component.scss"]
})
export class ItemComponent implements OnInit, OnChanges {
  @Input() item: Document<Item>;

  private _item: Item;

  constructor(private router: Router) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
    if ("item" in changes) {
      this._item = changes.item.currentValue._source;
    }
  }

  getYear(year: string) {
    return new Date(year).getFullYear();
  }

  async onImageClick() {
    await this.router.navigate(["/item", this.item._id]);
  }
}
