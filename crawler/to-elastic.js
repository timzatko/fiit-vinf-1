const fs = require("fs");
const path = require("path");
const parse = require("csv-parse");

const { Client } = require("@elastic/elasticsearch");
const client = new Client({ node: "http://localhost:9200" });

const argv = require("minimist")(process.argv);

const BULK_SIZE = 1000;
const OUT_FILE_NAME = argv.dev ? "out-copy.csv" : "out.csv";

let row = 0;
let csvHeader;
let buffer = [];

fs.createReadStream(path.resolve(__dirname, OUT_FILE_NAME))
  .pipe(parse({ delimiter: "," }))
  .on("data", async csvRow => {
    if (!csvHeader) {
      csvHeader = csvRow;
    } else {
      row++;

      buffer.push(toJSON(csvRow));

      if (!(row % BULK_SIZE) || argv.dev) {
        await send();
      }
    }
  })
  .on("end", async () => {
    if (row % BULK_SIZE) {
      await send();
    }

    console.log("Finished!");
    // console.log(csvHeader);
  });

function toJSON(row) {
  const object = {};

  for (let index in csvHeader) {
    if (csvHeader.hasOwnProperty(index)) {
      const key = csvHeader[index];

      object[key] = row[index];
    }
  }

  return object;
}

async function send() {
  if (!argv.dev) {
    console.log(`Sending ${row - buffer.length} - ${row} in bulk!`);
  }

  const body = [];

  buffer
    .map(data => formatItem(data))
    .filter(data => {
      return (
        typeof data.price !== "undefined" && typeof data.name !== "undefined"
      );
    })
    .forEach(data => {
      body.push({ index: { _index: "items", _id: data.id } });
      body.push(removeId(data));
    });

  buffer = [];

  // send to elastic
  try {
    if (!argv.dev) {
      await client.bulk({ body });
    } else {
      console.log(body);
      // process.exit();
    }
  } catch (e) {
    console.error(e);
  }
}

// format item
function formatItem(data) {
  function formatPrice(value) {
    if (!value.match(/^\$\d+(\.\d+)?$/)) {
      return undefined;
    }
    return Number(value.replace(/[$ ]/g, ""));
  }

  function toNumber(value) {
    return Number(value.replace(/,/g, ""));
  }

  function renameProperty(fromKey, toKey) {
    data[toKey] = data[fromKey];
    delete data[fromKey];
  }

  renameProperty("currentPrice", "price");
  renameProperty("itemName", "name");
  renameProperty("oldPrice", "old_price");
  renameProperty("averageRating", "average_rating");
  renameProperty("editorialReviews", "editorial_reviews");

  Object.keys(data).forEach(key => {
    const value = data[key];

    if (!value || !value.length) {
      delete data[key];
    } else if (["price", "old_price"].includes(key)) {
      data[key] = formatPrice(value);
    } else if (
      ["isbn-13", "sales_rank", "pages", "average_rating"].includes(key)
    ) {
      data[key] = toNumber(value);
    } else if (key === "file_size") {
      const match = value.match(/(\d+([.,]\d+)?)\s+([a-zA-Z]+)/);

      if (match) {
        const size = Number(match[1]);
        const units = match[3];

        data["file_size"] = { size, units };
      }
    }
  });

  return data;
}

function removeId(data) {
  delete data["id"];
  return data;
}
