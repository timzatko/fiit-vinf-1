import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Item } from "../item/item";
import { ItemService } from "../item/item.service";
import { Document } from "../elastic-search/elastic-search.types";

@Component({
  selector: "app-item-page",
  templateUrl: "./item-page.component.html",
  styleUrls: ["./item-page.component.scss"]
})
export class ItemPageComponent implements OnInit {
  private itemDocument: Document<Item>;
  private item: Item;

  information: { name: string; key: string }[] = [
    { name: "ISBN", key: "isbn-13" },
    { name: "Publisher", key: "publisher" },
    { name: "Age range", key: "age_range" },
    { name: "Pages", key: "pages" },
    { name: "Publication date", key: "publication_date" },
    { name: "Release date", key: "release_date" },
    { name: "Sales rank", key: "sales_rank" },
    { name: "Series", key: "series" },
    { name: "Upc", key: "upc" },
    { name: "Format", key: "format" },
    { name: "Product dimensions", key: "product_dimensions" },
    { name: "Edition description", key: "edition_description" }
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private itemService: ItemService
  ) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      const id = params["id"];

      this.itemService.get(id).subscribe(resp => {
        this.itemDocument = resp;
        this.item = this.itemDocument._source;
      });
    });
  }

  propertyExists(key: string) {
    return typeof this.item[key] !== "undefined";
  }
}
