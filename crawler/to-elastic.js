const fs = require('fs');
const path = require('path');
const parse = require('csv-parse');

const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });

const argv = require('minimist')(process.argv);

const BULK_SIZE = 1000;
const OUT_FILE_NAME = argv.dev ? 'out-copy.csv' : 'out.csv';

let row = 0;
let csvHeader;
let buffer = [];

fs.createReadStream(path.resolve(__dirname, OUT_FILE_NAME))
    .pipe(parse({ delimiter: ',' }))
    .on('data', async (csvRow) => {
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
    .on('end',async () => {
        if (row % BULK_SIZE) {
            await send();
        }

        console.log('Finished!');
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
        console.log(`Sending ${row - BULK_SIZE} - ${row} in bulk!`);
    }

    const body = [];

    buffer.map(data => format(data)).forEach(data => {
       body.push({ index: { _index: 'items', _type: data.category } });
       body.push(data);
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

function format(data) {
    Object.keys(data).forEach(key => {
        const value = data[key];

        if (!value || !value.length) {
            delete data[key];
        } else if (['currentPrice', 'oldPrice'].includes(key)) {
            data[key] = formatPrice(value);
        } else if (['isbn-13', 'sales_rank', 'pages', 'averageRating'].includes(key)) {
            data[key] = toNumber(value)
        } else if (key === 'file_size') {
            const match = value.match(/(\d+([.,]\d+)?)\s+([a-zA-Z]+)/);

            if (match) {
                const size = Number(match[1]);
                const units = match[3];

                data['file_size'] = { size, units };
            }
        }
    });

    return data;
}

function formatPrice(value) {
    return Number(value.replace(/[$ ]/g, ''));
}

function toNumber(value) {
    return Number(value.replace(/,/g, ''))
}
