const SLEEP_TIME = 2000; // sleep medzi requestami je 2s

// imports
const path = require("path");
const fs = require("fs-extra");
const crypto = require("crypto");

const Crawler = require("crawler");
const CsvWriteStream = require("csv-write-stream");

const getSites = require("./get-sites");

const argv = require("minimist")(process.argv);

const outDir = path.resolve(__dirname, "out-html");
fs.ensureDirSync(outDir);

const allowedCategories = [
  "Music",
  "Books",
  "Teen Books",
  "Textbooks",
  "Kids' Books",
  "category",
  "Newsstand",
  "NOOK Books",
  "Gift, Home & Office",
  "Toys",
  "Movies & TV",
  "NOOK"
];

function getId(url) {
  const cleanUrl = new Buffer(url).toString("base64");
  return crypto
    .createHash("md5")
    .update(cleanUrl)
    .digest("hex");
}

function getHtmlOutPath(url) {
  return path.resolve(outDir, getId(url) + ".html");
}

const csvWriter = CsvWriteStream();

csvWriter.pipe(fs.createWriteStream("out.csv", { flags: "a" }));

const productAttributes = [
  "Release Date",
  "ISBN-13",
  "Publisher",
  "Publication date",
  "Series",
  "Pages",
  "Sales rank",
  "Product dimensions",
  "Age Range",
  "Edition description",
  "Format",
  "File size",
  "UPC",
  "Original Release"
].map(attribute => {
  return { id: attribute.replace(/ /g, "_").toLowerCase(), title: attribute };
});

// crawler
const crawler = new Crawler({
  // maxConnections: 5
  // rateLimit: 50,
});

// counter
let counter = 0;
const increment = (url, other = " ") => {
  console.log(`[${++counter}]${other}${url}`);
};

const error = (url, e) => {
  console.error(`[${++counter}][ERROR] ${url}`, e);
};

// callbacks
const itemCallback = (e, response, done) => {
  if (e) {
    error(e);

    done();
  } else {
    const { $, request } = response;

    try {
      const url = request.uri.href;

      const id = getId(url);
      const author = $("[itemprop=author]")
        .text()
        .trim();
      const itemName = $("[itemprop=name]")
        .text()
        .trim();
      const format = $("[itemprop=bookFormat]")
        .text()
        .trim();
      const currentPrice = $(".current-price")
        .text()
        .trim();
      const oldPrice = $(".old-price")
        .text()
        .trim();
      const description = $(".overview-content")
        .text()
        .trim();
      const averageRating = (() => {
        const averageRating = $(".hreview-aggregate .rating .average")
          .text()
          .trim();

        return averageRating.length
          ? averageRating
          : $(".gig-average-review")
              .text()
              .trim();
      })();
      const editorialReviews = $("#EditorialReviews p")
        .text()
        .trim();
      const image = $("#pdpMainImage").attr("src");

      const category = (() => {
        const breadcrumbs = $(".breadCrumbNav")
          .text()
          .trim()
          .split("\n");

        if (breadcrumbs.length >= 2) {
          const category = breadcrumbs[1];

          if (allowedCategories.indexOf(category) !== -1) {
            return category;
          }
        }

        return undefined;
      })();

      const itemObject = {
        id,
        url,
        itemName,
        currentPrice,
        oldPrice,
        description,
        averageRating,
        author,
        editorialReviews,
        format,
        category,
        image
      };

      function getProductDetails(detail) {
        return $(`#ProductDetailsTab th:contains("${detail}")`)
          .parent()
          .find("td")
          .text()
          .trim();
      }

      productAttributes.forEach(({ id, title }) => {
        itemObject[id] = getProductDetails(title);
      });

      if (argv.dev) {
        console.log(itemObject);
      }

      if (!itemName.length) {
        console.warn(`${url} is missing some important attributes!`);
        console.log(itemObject);
      } else {
        if (!argv.dev) {
          csvWriter.write(itemObject);
        }

        increment(url);
      }

      // just write an empty file
      const body = "" || response.body;
      fs.createWriteStream(getHtmlOutPath(url)).write(body);

      done();
    } catch (e) {
      error(e);

      done();
    }
  }
};

getSites().then(async sites => {
  for (let uri of sites) {
    if (!fs.existsSync(getHtmlOutPath(uri))) {
      await new Promise(resolve => {
        crawler.queue([
          {
            uri,
            callback: itemCallback
          }
        ]);

        setTimeout(resolve, SLEEP_TIME); // sleep je nastaveny na 1000 ms
      });
    } else {
      increment(uri, "[SKIP] ");
    }
  }
});
