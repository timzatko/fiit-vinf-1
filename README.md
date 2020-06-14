# FIIT VINF 1

[![pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit&logoColor=white)](https://github.com/pre-commit/pre-commit)

This project is an implementation of a school course assignment (Information Retrieval at Faculty of Informatics and Information Technologies Slovak Technical University in Bratislava).
The simplified version of the assignment:

1. Crawl a large amount of structure data
1. Use Elastic Search as a data storage
1. Make some non-trivial Elasticsearch queries
1. Create a user interface to browse the data

**Note:** The overall solution is not production-ready - eg. there should be some kind of API between the frontend and the Elasticsearch (so the Elasticsearch endpoint is not publicly exposed). However, this was not the aim of this project.

I decided to crawl books from [https://www.barnesandnoble.com/](https://www.barnesandnoble.com/).

## Prerequisites

- [Docker](https://www.docker.com/)
- [Node](https://nodejs.org/en/) (use version `v11.12.0`)
- [pre-commit](https://pre-commit.com/), don't forget to run pre-commit install in the repository root

## Running the App

Firstly install the dependencies (for the crawler and frontend).

```bash
npm install
```

Then the app can be launched via docker-compose.

```bash
docker-compose up
```

- App Frontend will be running on [http://localhost:4200](http://localhost:4200)
- Elasticsearch will be running on [http://localhost:9200](http://localhost:9200)
- Kibana will be running on [http://localhost:5601](http://localhost:5601)

At this time, the website is empty, as there are not any data in the database, use crawler to populate it with the data.

## Crawler

Crawler crawls various items (mainly books, but also CDs, e-books etc.) from [https://www.barnesandnoble.com/](https://www.barnesandnoble.com/).
It fetches the sitemap and then it collects all item data from the links. It parses the DOM of the website to extract the data by using CSS selectors.
It also does the preprocessing of the data like removing the whitespaces or formatting of the numerical values.

### Usage

1. Navigate to the _crawler_ directory `cd crawler`
2. Run the crawler `npm start`. This will fetch the sitemap and will crawl all sites in parallel (websites and crawled data are in `crawler/out` and `crawler/out-html`).
3. Import data to the Elastic `npm run export` (the Elasticsearch need to be running)

## Development

Prettier is run before every commit ensuring that the code looks best, it can also be run manually via `npm run prettier` in the root of the repository.
