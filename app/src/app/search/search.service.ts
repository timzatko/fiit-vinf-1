import { Injectable } from "@angular/core";
import { ElasticSearchService } from "../elastic-search/elastic-search.service";
import { BehaviorSubject, from, Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";
import {
  Document,
  Hits,
  SearchResponse,
  SearchSuggestResponse
} from "../elastic-search/elastic-search.types";
import { Item } from "../item/item";
import {
  ALL_CATEGORIES,
  ALL_PUBLICATION_YEARS,
  SORT_BY_RELEVANCE
} from "../search-page/search-page.component";

@Injectable({
  providedIn: "root"
})
export class SearchService {
  searchQuery$ = new BehaviorSubject<string>(undefined);

  constructor(
    private elasticSearchService: ElasticSearchService,
    private httpClient: HttpClient
  ) {}

  getAutocompleteSuggestions(
    text: string | undefined
  ): Observable<AutoCompleteItem[]> {
    if (typeof text === "undefined" || !text.length) {
      return of([]);
    }

    let query = undefined;

    const isbn13 = Number(text);
    if (Number.isInteger(isbn13)) {
      query = {
        query: {
          bool: {
            should: [
              {
                term: {
                  "isbn-13": isbn13
                }
              }
            ]
          }
        }
      };
    }

    return from(
      this.httpClient.post<
        SearchSuggestResponse<Document<Item>, { name; author }>
      >(this.elasticSearchService.url("items/_search"), {
        ...query,
        suggest: {
          name: {
            prefix: text,
            completion: {
              field: "name.completion",
              fuzzy: {
                fuzziness: "AUTO"
              }
            }
          },
          author: {
            prefix: text,
            completion: {
              field: "author.completion",
              fuzzy: {
                fuzziness: "AUTO"
              }
            }
          }
        }
      })
    ).pipe(
      map(response => {
        let output: AutoCompleteItem[] = [];

        const isbnHits = response.hits.hits;
        const nameSuggestions = response.suggest.name;
        const authorSuggestions = response.suggest.author;

        if (isbnHits.length) {
          output = output.concat(
            isbnHits.map(document => ({ type: "isbn", document }))
          );
        }

        if (nameSuggestions) {
          output = output.concat(
            nameSuggestions[0].options.map(document => ({
              type: "name-suggestion",
              document
            }))
          );
        }

        if (authorSuggestions) {
          output = output.concat(
            authorSuggestions[0].options.map(document => ({
              type: "author-suggestion",
              document
            }))
          );
        }

        output.sort((a, b) => {
          return b.document._score - a.document._score;
        });

        return output;
      })
    );
  }

  getBySearchQuery(
    query: string,
    filters: {
      publicationDate: number | typeof ALL_PUBLICATION_YEARS;
      category: string | typeof ALL_CATEGORIES;
      price: { from: number | undefined; to: number | undefined };
      pages: { from: number | undefined; to: number | undefined };
    },
    sortBy: { [key: string]: "asc" | "desc" } | typeof SORT_BY_RELEVANCE,
    limits: { from: number; size: number } = { from: 0, size: 20 }
  ): Observable<SearchResponse<Document<Item>>> {
    let should: any | undefined = undefined;

    const filter: any[] = [];

    if (typeof query !== "undefined" && query.length) {
      const queries: any[] = [
        {
          constant_score: {
            filter: {
              match: { name: query }
            },
            boost: 10
          }
        },
        {
          constant_score: {
            filter: {
              match: { author: query }
            },
            boost: 3
          }
        },
        {
          constant_score: {
            filter: {
              match: { description: query }
            },
            boost: 3
          }
        },
        {
          constant_score: {
            filter: {
              match: { editorial_reviews: query }
            },
            boost: 1
          }
        }
      ];

      const isbn13 = Number(query);
      if (Number.isInteger(isbn13)) {
        queries.push({
          constant_score: {
            filter: {
              term: { "isbn-13": isbn13 }
            },
            boost: 100
          }
        });
      }

      should = {
        should: queries,
        minimum_should_match: 1
      };
    }

    if (typeof filters.category !== "symbol") {
      filter.push({
        term: {
          category: filters.category
        }
      });
    }

    if (Number.isInteger(filters.price.from)) {
      filter.push({
        range: {
          price: {
            gte: filters.price.from
          }
        }
      });
    }

    if (Number.isInteger(filters.price.to)) {
      filter.push({
        range: {
          price: {
            lte: filters.price.to
          }
        }
      });
    }

    if (Number.isInteger(filters.pages.from)) {
      filter.push({
        range: {
          pages: {
            gte: filters.pages.from
          }
        }
      });
    }

    if (Number.isInteger(filters.pages.to)) {
      filter.push({
        range: {
          pages: {
            lte: filters.pages.to
          }
        }
      });
    }

    if (typeof filters.publicationDate !== "symbol") {
      filter.push({
        bool: {
          should: [
            {
              range: {
                publication_date: {
                  gte: filters.publicationDate,
                  lt: filters.publicationDate + 1,
                  format: "yyyy"
                }
              }
            },
            {
              range: {
                release_date: {
                  gte: filters.publicationDate,
                  lt: filters.publicationDate + 1,
                  format: "yyyy"
                }
              }
            }
          ],
          minimum_should_match: 1
        }
      });
    }

    let sort: { [key: string]: "asc" | "desc" }[] | undefined = undefined;

    if (typeof sortBy !== "symbol") {
      sort = [sortBy];
    }

    return from(
      this.httpClient.post<SearchResponse<Document<Item>>>(
        this.elasticSearchService.url("items/_search"),
        {
          from: limits.from,
          size: limits.size,
          sort: sort,
          query: {
            bool: {
              filter: filter,
              ...should
            }
          },
          aggregations: {
            min_price: {
              min: {
                field: "price"
              }
            },
            avg_price: {
              avg: {
                field: "price"
              }
            },
            max_price: {
              max: {
                field: "price"
              }
            },
            prices: {
              histogram: {
                field: "price",
                interval: 10
              }
            },
            significant_publisher: {
              significant_terms: {
                field: "publisher.keyword"
              }
            }
          }
        }
      )
    );
  }
}

export interface AutoCompleteItem {
  type: "author-suggestion" | "name-suggestion" | "isbn";
  document: Document<Item>;
}
