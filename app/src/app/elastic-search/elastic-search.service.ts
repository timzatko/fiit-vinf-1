import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ElasticSearchService {
  public readonly host = "http://localhost:9200";

  constructor() {}

  url(query: string) {
    return this.host + "/" + query;
  }
}
