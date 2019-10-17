export class Document<Doc> {
  _index: string;
  _type: string;
  _id: string;
  _version: number;
  _seq_no: number;
  _primary_term: number;
  _source: Doc;
  _score: number;
  found: boolean;
}

export type SearchResponse<Doc> = {
  took: number;
  timed_out: boolean;
  _shards: {
    total: number;
    successful: number;
    skipped: number;
    failed: number;
  };
  hits: Hits<Doc>;
};

export interface Hits<Doc> {
  total: {
    value: number;
    relation: string;
  };
  max_score: number;
  hits: Doc[];
}

export type SearchSuggestResponse<Doc, Q> = SearchResponse<Doc> & {
  suggest: { [P in keyof Q]: Suggestion<Doc> };
};

interface Suggestion<Doc> {
  text: string;
  offset: number;
  length: number;
  options: Doc[];
}
