// imports
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');

const Crawler = require('crawler');
const CsvWriteStream = require('csv-write-stream');

const getSites = require('./get-sites');

const argv = require('minimist')(process.argv);

const outDir = path.resolve(__dirname, 'out-html');
fs.ensureDirSync(outDir);

function getHtmlOutPath(url) {
    const cleanUrl = new Buffer(url).toString('base64');
    const hashedUrl = crypto.createHash('md5').update(cleanUrl).digest('hex');

    return path.resolve(outDir, hashedUrl + '.html');
}

const csvWriter = CsvWriteStream();

csvWriter.pipe(fs.createWriteStream('out.csv', { flags: 'a' }));

const productAttributes = [
    'Release Date',
    'ISBN-13',
    'Publisher',
    'Publication date',
    'Series',
    'Pages',
    'Sales rank',
    'Product dimensions',
    'Age Range',
    'Edition description',
    'Format',
    'File size',
    'UPC',
    'Original Release',
].map(attribute => {
    return { id: attribute.replace(/ /g, '_').toLowerCase(), title: attribute };
});

// crawler
const crawler = new Crawler({
    maxConnections: 5,
    // rateLimit: 50,
});

// counter
let counter = 0;
const increment = (url, other = ' ') => {
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

            const author = $('[itemprop=author]').text().trim();
            const itemName = $('[itemprop=name]').text().trim();
            const format = $('[itemprop=bookFormat]').text().trim();
            const currentPrice = $('.current-price').text().trim();
            const oldPrice = $('.old-price').text().trim();
            const description = $('.overview-content').text().trim();
            const averageRating = (() => {
                const averageRating = $('.hreview-aggregate .rating .average').text().trim();

                return averageRating.length ? averageRating : $('.gig-average-review').text().trim();
            })();
            const editorialReviews = $('#EditorialReviews p').text().trim();
            const image = $('#pdpMainImage').attr('src');

            const category = (() => {
                const breadcrumbs = $('.breadCrumbNav:not(.invisible)').text().trim().split('\n');

                return breadcrumbs.length >= 2 ? breadcrumbs[1] : '';
            })();

            const itemObject = {
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
                image,
            };

            function getProductDetails(detail) {
                return $(`#ProductDetailsTab th:contains("${detail}")`).parent().find('td').text().trim();
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

                fs.createWriteStream(getHtmlOutPath(url)).write(response.body);
            } else {
                if (!argv.dev) {
                    csvWriter.write(itemObject);
                }

                increment(url);
            }

            done();
        } catch (e) {
            error(e);

            done();
        }
    }
};


getSites().then(sites => {
    sites.forEach(uri => {
        if (!fs.existsSync(getHtmlOutPath(uri))) {
            crawler.queue([{
                uri,
                callback: itemCallback
            }]);
        } else {
            increment(uri, '[SKIP] ')
        }
    })
});
