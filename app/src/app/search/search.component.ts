import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FormControl } from "@angular/forms";
import { debounceTime, skip, switchMap, takeUntil } from "rxjs/operators";
import { SearchService } from "./search.service";
import { Item } from "../item/item";
import { Observable } from "rxjs";
import { Router } from "@angular/router";
import { Document } from "../elastic-search/elastic-search.types";
import { MatAutocompleteTrigger } from "@angular/material/autocomplete";

@Component({
  selector: "app-search",
  templateUrl: "./search.component.html",
  styleUrls: ["./search.component.scss"]
})
export class SearchComponent implements OnInit {
  @ViewChild(MatAutocompleteTrigger, { static: true, read: ElementRef })
  searchInput: ElementRef;
  @ViewChild(MatAutocompleteTrigger, { static: false })
  autoComplete: MatAutocompleteTrigger;

  searchQueryControl = new FormControl();

  suggestions: Observable<Document<Item>[]>;

  constructor(private searchService: SearchService, private router: Router) {}

  get searchQuery() {
    return this.searchQueryControl.value;
  }

  ngOnInit() {
    const query$ = this.searchQueryControl.valueChanges;

    this.suggestions = query$.pipe(
      debounceTime(300),
      switchMap(query =>
        this.searchService
          .getAutocompleteSuggestions(query)
          .pipe(takeUntil(query$.pipe(skip(1))))
      )
    );
  }

  displayWith(option: AutocompleteOption) {
    if (!option) {
      return "";
    } else if (option.type === "document") {
      return option.document._source.name;
    } else {
      return option.query;
    }
  }

  async onKeyUpEnter() {
    if (!this.autoComplete.activeOption && this.searchQuery) {
      this._navigateToSearch(this.searchQuery);
    }
  }

  async onOptionSelect(option: AutocompleteOption) {
    if (option.type === "document") {
      await this.router.navigate(["item", option.document._id]).then(() => {
        this.searchInput.nativeElement.blur();
      });
    } else {
      this._navigateToSearch(option.query);
    }
  }

  private async _navigateToSearch(query: string) {
    this.autoComplete.closePanel();

    await this.router
      .navigate(["search"], {
        queryParams: { q: query }
      })
      .then(() => {
        this.searchInput.nativeElement.blur();
      });
  }
}

type AutocompleteOption =
  | { type: "document"; document: Document<Item> }
  | { type: "query"; query: string };
