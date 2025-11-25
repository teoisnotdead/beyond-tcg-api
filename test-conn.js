const { Client } = require('pg');

const client = new Client({
    host: '127.0.0.1',
    port: 5433,
    user: 'test_user',
    password: 'test_password',
    database: 'beyond_tcg_test',
});

client.connect()
    .then(() => {
        console.log('Connected successfully');
        return client.end();
    })
    .catch(err => {
        console.error('Connection error', err);
        process.exit(1);
    });
