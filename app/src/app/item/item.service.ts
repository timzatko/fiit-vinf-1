import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ElasticSearchService } from "../elastic-search/elastic-search.service";
import { Item } from "./item";
import { Observable } from "rxjs";
import { Document } from "../elastic-search/elastic-search.types";

@Injectable({
  providedIn: "root"
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
}
