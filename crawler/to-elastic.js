const fs = require('fs');
const path = require('path');
const parse = require('csv-parse');

const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });

const BULK_SIZE = 1000;

let row = 0;
let csvHeader;
let buffer = [];

fs.createReadStream(path.resolve(__dirname, 'out.csv'))
    .pipe(parse({ delimiter: ',' }))
    .on('data', async (csvRow) => {
        if (!csvHeader) {
            csvHeader = csvRow;
        } else {
            row++;

            buffer.push(toJSON(csvRow));

            if (!(row % BULK_SIZE)) {
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
    console.log(`Sending ${row - BULK_SIZE} - ${row} in bulk!`);

    const body = [];

    buffer.forEach(data => {
       body.push({ index: { } });
       body.push(data);
    });

    buffer = [];

    // send to elastic
    try {
        await client.bulk({
            index: 'books',
            body,
        });
    } catch (e) {
        console.error(e);
    }
}
