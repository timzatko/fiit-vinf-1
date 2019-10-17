import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Item } from "../item/item";
import { SearchService } from "../search/search.service";
import { Document } from "../elastic-search/elastic-search.types";
import { FormControl } from "@angular/forms";
import { PageEvent } from "@angular/material/paginator";

export const ALL_CATEGORIES = Symbol("All Categories");
export const ALL_PUBLICATION_YEARS = Symbol("All Publication Years");
export const SORT_BY_RELEVANCE = Symbol("Sort By Relevance");

@Component({
  selector: "app-search-page",
  templateUrl: "./search-page.component.html",
  styleUrls: ["./search-page.component.scss"]
})
export class SearchPageComponent implements OnInit {
  searchQuery: string;

  resultCount: number;
  currentPage = 0;
  pageSize = 20;

  items: Document<Item>[];

  categories: { value: string | Symbol; name: string }[] = [
    { value: ALL_CATEGORIES, name: "All Categories" },
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

  sorts: { value: { [key: string]: "asc" | "desc" }; name: string }[] = [
    { value: { average_rating: "asc" }, name: "Rating (ASC)" },
    { value: { average_rating: "desc" }, name: "Rating (DESC)" },
    { value: { price: "asc" }, name: "Price (ASC)" },
    { value: { price: "desc" }, name: "Price (DESC)" }
  ];

  publicationYears: number[] = [];

  categoryControl = new FormControl(ALL_CATEGORIES);
  publicationYearControl = new FormControl(ALL_PUBLICATION_YEARS);
  sortControl = new FormControl(SORT_BY_RELEVANCE);
  priceFromControl = new FormControl();
  priceToControl = new FormControl();

  constructor(
    private activatedRoute: ActivatedRoute,
    private searchService: SearchService
  ) {}

  get ALL_PUBLICATION_YEARS() {
    return ALL_PUBLICATION_YEARS;
  }

  get SORT_BY_RELEVANCE() {
    return SORT_BY_RELEVANCE;
  }

  ngOnInit() {
    this.search();

    this.publicationYears = new Array(200).fill(0).map((_, index) => {
      return this._thisYear() - index;
    });
  }

  search() {
    this.activatedRoute.queryParams.subscribe(queryParams => {
      this.searchQuery = queryParams["q"];
      this.items = null;

      this.searchService
        .getBySearchQuery(
          this.searchQuery,
          {
            category: this.categoryControl.value,
            publicationDate: this.publicationYearControl.value,
            price: {
              from: this.priceFromControl.value,
              to: this.priceToControl.value
            }
          },
          this.sortControl.value,
          {
            from: this.pageSize * this.currentPage,
            size: this.pageSize
          }
        )
        .subscribe(hits => {
          this.resultCount = hits.total.value;

          this.items = hits.hits;
        });
    });
  }

  onPageChange(page: PageEvent) {
    this.currentPage = page.pageIndex;

    this.search();
  }

  private _thisYear() {
    return new Date().getFullYear();
  }
}
