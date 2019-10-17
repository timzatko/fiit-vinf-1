import { Injectable } from "@angular/core";
import { ElasticSearchService } from "../elastic-search/elastic-search.service";
import { from, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";
import {
  Document,
  SearchResponse,
  SearchSuggestResponse
} from "../elastic-search/elastic-search.types";
import { Item } from "../item/item";

@Injectable({
  providedIn: "root"
})
export class SearchService {
  constructor(
    private elasticSearchService: ElasticSearchService,
    private httpClient: HttpClient
  ) {}

  getAutocompleteSuggestions(text: string): Observable<Document<Item>[]> {
    return from(
      this.httpClient.post<SearchSuggestResponse>(
        this.elasticSearchService.url("items/_search"),
        {
          suggest: {
            suggestion: {
              text,
              completion: {
                field: "name.completion",
                fuzzy: {
                  fuzziness: 1
                }
              }
            }
          }
        }
      )
    ).pipe(
      map(response => {
        const suggestion = response.suggest.suggestion;

        if (!suggestion.length) {
          return [];
        }

        return suggestion[0].options;
      })
    );
  }

  getBySearchQuery(
    query: string,
    limits: { from; size } = { from: 0, size: 20 }
  ): Observable<Document<Item>[]> {
    return from(
      this.httpClient.post<SearchResponse<Document<Item>>>(
        this.elasticSearchService.url("items/_search"),
        {
          from: limits.from,
          size: limits.size,
          query: {
            bool: {
              should: [
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
              ]
            }
          }
        }
      )
    ).pipe(map(resp => resp.hits.hits));
  }
}
