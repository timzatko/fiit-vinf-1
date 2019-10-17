import { Injectable } from "@angular/core";
import { ElasticSearchService } from "../elastic-search/elastic-search.service";
import { from, Observable } from "rxjs";
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
  constructor(
    private elasticSearchService: ElasticSearchService,
    private httpClient: HttpClient
  ) {}

  getAutocompleteSuggestions(text: string): Observable<AutoCompleteItem[]> {
    let query = undefined;

    const isbn13 = Number(text);
    if (Number.isInteger(isbn13)) {
      query = {
        query: {
          term: {
            "isbn-13": isbn13
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
            text,
            completion: {
              field: "name.completion",
              fuzzy: {
                fuzziness: 1
              }
            }
          },
          author: {
            text,
            completion: {
              field: "author.completion",
              fuzzy: {
                fuzziness: 1
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
    },
    sortBy: { [key: string]: "asc" | "desc" } | typeof SORT_BY_RELEVANCE,
    limits: { from: number; size: number } = { from: 0, size: 20 }
  ): Observable<Hits<Document<Item>>> {
    const filter: any[] = [];

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

    if (typeof filters.category !== "symbol") {
      filter.push({
        term: {
          "category.keyword": filters.category
        }
      });
    }

    if (typeof filters.price.from !== "undefined") {
      filter.push({
        range: {
          price: {
            gte: filters.price.from
          }
        }
      });
    }

    if (typeof filters.price.to !== "undefined") {
      filter.push({
        range: {
          price: {
            lte: filters.price.to
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
              should: queries,
              minimum_should_match: 1
            }
          }
        }
      )
    ).pipe(map(resp => resp.hits));
  }
}

export interface AutoCompleteItem {
  type: "author-suggestion" | "name-suggestion" | "isbn";
  document: Document<Item>;
}
