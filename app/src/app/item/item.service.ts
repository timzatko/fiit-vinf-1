import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ElasticSearchService } from "../elastic-search/elastic-search.service";
import { Item } from "./item";
import { Observable } from "rxjs";
import {
  Document,
  Hits,
  SearchResponse,
} from "../elastic-search/elastic-search.types";
import { map } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class ItemService {
  constructor(
    private httpClient: HttpClient,
    private elasticSearchService: ElasticSearchService
  ) {}

  get(id: string): Observable<Document<Item>> {
    return this.httpClient.get<Document<Item>>(
      this.elasticSearchService.url("items/_doc/" + id)
    );
  }

  getFeatured(): Observable<Document<Item>[]> {
    const year = new Date().getFullYear();

    return this.httpClient
      .post<SearchResponse<Document<Item>>>(
        this.elasticSearchService.url("items/_search"),
        {
          size: 8,
          query: {
            range: {
              publication_date: {
                gte: year,
                lt: year + 1,
                format: "yyyy",
              },
            },
          },
          sort: [{ average_rating: "desc" }],
          track_total_hits: false,
        }
      )
      .pipe(map((resp) => resp.hits.hits));
  }
}
