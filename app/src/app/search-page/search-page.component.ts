import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Item } from "../item/item";
import { SearchService } from "../search/search.service";
import { Document } from "../elastic-search/elastic-search.types";

@Component({
  selector: "app-search-page",
  templateUrl: "./search-page.component.html",
  styleUrls: ["./search-page.component.scss"]
})
export class SearchPageComponent implements OnInit {
  searchQuery: string;

  items: Document<Item>[];

  constructor(
    private activatedRoute: ActivatedRoute,
    private searchService: SearchService
  ) {}

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(queryParams => {
      this.searchQuery = queryParams["q"];
      this.items = null;

      this.searchService.getBySearchQuery(this.searchQuery).subscribe(items => {
        this.items = items;
      });
    });
  }
}
