#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const SiteMapper = require("sitemapper");
const mkdirp = require("mkdirp");

const argv = require("minimist")(process.argv);
const outPath = path.join(__dirname, "out");

const getSites = () => {
  if (argv.dev) {
    return Promise.resolve([
      "https://www.barnesandnoble.com/w/adobe-photoshop-cc-classroom-in-a-book-andrew-faulkner/1124173961?ean=9780135261781"
    ]);
  }

  // siteMapper
  const siteMapper = new SiteMapper();

  mkdirp.sync(outPath);
  const outFile = path.resolve(outPath, "sites.txt");

  if (fs.existsSync(outFile)) {
    console.log(
      "loading from " + outFile + " --- remove this file to fetch sites again"
    );

    return Promise.resolve(
      fs
        .readFileSync(outFile, "utf8")
        .split("\n")
        .filter(site => site && site.length)
    );
  } else {
    console.log("fetching sites from live site-map...");

    return siteMapper
      .fetch("https://www.barnesandnoble.com/sitemap.xml")
      .then(({ sites }) => {
        fs.writeFileSync(outFile, sites.join("\n"), { encoding: "utf8" });

        return sites;
      });
  }
};

module.exports = getSites;
