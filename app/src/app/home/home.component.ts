import { Component, OnInit } from "@angular/core";
import { Item } from "../item/item";
import { ItemService } from "../item/item.service";
import { Document } from "../elastic-search/elastic-search.types";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit {
  items: Document<Item>[];

  constructor(private itemService: ItemService) {}

  ngOnInit() {
    this.itemService.getFeatured().subscribe((items) => {
      this.items = items;
    });
  }
}
