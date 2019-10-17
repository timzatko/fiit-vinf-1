export class Document<T> {
  _index: string;
  _type: string;
  _id: string;
  _version: number;
  _seq_no: number;
  _primary_term: number;
  found: boolean;
  _source: T;
}

export type SearchResponse<T> = {
  took: number;
  timed_out: boolean;
  _shards: {
    total: number;
    successful: number;
    skipped: number;
    failed: number;
  };
  hits: Hits<T>;
};

export interface Hits<T> {
  total: {
    value: number;
    relation: string;
  };
  max_score: number;
  hits: T[];
}

export type SearchSuggestResponse = any;
