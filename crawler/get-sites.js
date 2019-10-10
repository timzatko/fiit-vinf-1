#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SiteMapper = require('sitemapper');

const argv = require('minimist')(process.argv);

const getSites = () => {
    if (argv.dev) {
        return Promise.resolve(['https://www.barnesandnoble.com/w/adobe-photoshop-cc-classroom-in-a-book-andrew-faulkner/1124173961?ean=9780135261781'])
    }

    // siteMapper
    const siteMapper = new SiteMapper();

    const outPath = path.resolve(__dirname, 'sites.txt');

    if (fs.existsSync(outPath)) {
        console.log('loading from ' + outPath + ' --- remove this file to fetch sites again');

        return Promise.resolve(fs.readFileSync(outPath, 'utf8').split('\n').filter(site => site && site.length));
    } else {
        console.log('fetching sites from live site-map...');

        return siteMapper.fetch('https://www.barnesandnoble.com/sitemap.xml').then(({ sites }) => {
            fs.writeFileSync(outPath, sites.join('\n'), { encoding: 'utf8' });

            return sites;
        });
    }
};

module.exports = getSites;

