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

    const isbn13 = Number(query);
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
        SearchSuggestResponse<Document<Item>, { suggestion }>
      >(this.elasticSearchService.url("items/_search"), {
        ...query,
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
      })
    ).pipe(
      map(response => {
        if (response.hits.total.value > 0) {
          return response.hits.hits;
        }

        const suggestion = response.suggest.suggestion;
        return !suggestion.length ? [] : suggestion[0].options;
      })
    );
  }

  getBySearchQuery(
    query: string,
    limits: { from: number; size: number } = { from: 0, size: 20 }
  ): Observable<Hits<Document<Item>>> {
    const queries: any = [
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
    ];

    const isbn13 = Number(query);
    if (Number.isInteger(isbn13)) {
      queries.push({
        constant_score: {
          filter: {
            match: { "isbn-13": isbn13 }
          },
          boost: 100
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
              should: queries
            }
          }
        }
      )
    ).pipe(map(resp => resp.hits));
  }
}
