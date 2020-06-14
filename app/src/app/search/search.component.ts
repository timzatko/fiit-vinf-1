import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { debounceTime, skip, switchMap, takeUntil } from "rxjs/operators";
import { AutoCompleteItem, SearchService } from "./search.service";
import { Observable, Subject } from "rxjs";
import { Router } from "@angular/router";
import { MatAutocompleteTrigger } from "@angular/material/autocomplete";

@Component({
  selector: "app-search",
  templateUrl: "./search.component.html",
  styleUrls: ["./search.component.scss"],
})
export class SearchComponent implements OnInit, OnDestroy {
  @ViewChild(MatAutocompleteTrigger, { static: true, read: ElementRef })
  searchInput: ElementRef;
  @ViewChild(MatAutocompleteTrigger, { static: false })
  autoComplete: MatAutocompleteTrigger;

  searchQueryControl = new FormControl();

  suggestions: Observable<AutoCompleteItem[]>;

  unsubscribe$ = new Subject();

  constructor(private searchService: SearchService, private router: Router) {}

  get searchQuery() {
    return this.searchQueryControl.value;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    const searchQuery$ = this.searchQueryControl.valueChanges;

    this.suggestions = searchQuery$.pipe(
      debounceTime(300),
      switchMap((query) =>
        this.searchService
          .getAutocompleteSuggestions(query)
          .pipe(takeUntil(searchQuery$.pipe(skip(1))))
      )
    );

    this.searchService.searchQuery$.asObservable().subscribe((value) => {
      this.searchQueryControl.setValue(value);
    });
  }

  displayWith(option: AutocompleteOption) {
    if (!option) {
      return "";
    } else if (option.type === "item") {
      return option.document.document._source.name;
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
    if (option.type === "item") {
      await this.router
        .navigate(["item", option.document.document._id])
        .then(() => {
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
        queryParams: { q: query },
      })
      .then(() => {
        this.searchInput.nativeElement.blur();
      });
  }
}

type AutocompleteOption =
  | { type: "item"; document: AutoCompleteItem }
  | { type: "query"; query: string };
