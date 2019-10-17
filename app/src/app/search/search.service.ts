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
  ALL_PUBLICATION_YEARS
} from "../search-page/search-page.component";

@Injectable({
  providedIn: "root"
})
export class SearchService {
  constructor(
    private elasticSearchService: ElasticSearchService,
    private httpClient: HttpClient
  ) {}

  getAutocompleteSuggestions(text: string): Observable<Document<Item>[]> {
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
        SearchSuggestResponse<Document<Item>, { "name-suggestion" }>
      >(this.elasticSearchService.url("items/_search"), {
        ...query,
        suggest: {
          "name-suggestion": {
            text,
            completion: {
              field: "name.completion",
              fuzzy: {
                fuzziness: 1
              }
            }
          }
        }
      })
    ).pipe(
      map(response => {
        if (response.hits.total.value > 0) {
          return response.hits.hits;
        }

        const suggestion = response.suggest["name-suggestion"];
        return !suggestion.length ? [] : suggestion[0].options;
      })
    );
  }

  getBySearchQuery(
    query: string,
    filters: {
      publicationDate: number | typeof ALL_PUBLICATION_YEARS;
      category: string | typeof ALL_CATEGORIES;
    },
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

    if (filters.category !== ALL_CATEGORIES) {
      filter.push({
        term: {
          "category.keyword": filters.category
        }
      });
    }

    if (filters.publicationDate !== ALL_PUBLICATION_YEARS) {
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

    return from(
      this.httpClient.post<SearchResponse<Document<Item>>>(
        this.elasticSearchService.url("items/_search"),
        {
          from: limits.from,
          size: limits.size,
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
