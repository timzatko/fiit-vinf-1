#!/usr/bin/env bash

curl --header "Content-Type: application/json" \
  --request PUT \
  --data "$(cat setup/index.json)" \
  http://localhost:9200/items

