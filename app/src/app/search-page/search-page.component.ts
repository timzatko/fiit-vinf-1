import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Item } from "../item/item";
import { SearchService } from "../search/search.service";
import { Document } from "../elastic-search/elastic-search.types";
import { FormControl } from "@angular/forms";

const allCategories = Symbol("All Categories");

@Component({
  selector: "app-search-page",
  templateUrl: "./search-page.component.html",
  styleUrls: ["./search-page.component.scss"]
})
export class SearchPageComponent implements OnInit {
  searchQuery: string;

  results: number;
  limits: { from: number; size: number } = { from: 0, size: 20 };

  items: Document<Item>[];

  categories: { value: string | Symbol; name: string }[] = [
    { value: allCategories, name: "All Categories" },
    { value: "Music", name: "Music" },
    { value: "Books", name: "Books" },
    { value: "Teen Books", name: "Teen Books" },
    { value: "Textbooks", name: "Textbooks" },
    { value: "Kids' Books", name: "Kids' Books" },
    { value: "Newsstand", name: "Newsstand" },
    { value: "NOOK Books", name: "NOOK Books" },
    { value: "Gift, Home & Office", name: "Gift, Home & Office" },
    { value: "Toys", name: "Toys" },
    { value: "Movies & TV", name: "Movies & TV" },
    { value: "NOOK", name: "NOOK" }
  ];

  categoryControl = new FormControl(allCategories);

  get page() {
    return (this.limits.from % this.limits.size) + 1;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private searchService: SearchService
  ) {}

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(queryParams => {
      this.searchQuery = queryParams["q"];
      this.items = null;

      this.searchService
        .getBySearchQuery(this.searchQuery, this.limits)
        .subscribe(hits => {
          this.results = hits.total.value;

          this.items = hits.hits;
        });
    });
  }
}
