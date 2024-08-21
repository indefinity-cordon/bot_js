const mysql = require('mysql');
const chalk = require('chalk');

const connection = mysql.createConnection({host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME});
connection.on('error', err => console.log(chalk.blue(chalk.bold(`Database`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`MySQL Main`), chalk.white(`>>`), chalk.red(err)));

module.exports = async (client) => {
    console.log(chalk.blue(chalk.bold(`Database`)), chalk.white(`>>`), chalk.red(`MySQL`), chalk.green(`starting connecting...`));
    client.database = new Promise((resolve, reject) => {
        connection.connect((err, result) => {
            if (err) {
                console.log(chalk.blue(chalk.bold(`Database`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`MySQL`), chalk.red(`Failed connect to the Main database.`));
                reject(err);
            } else {
                client.database = connection;
                console.log(chalk.blue(chalk.bold(`Database`)), chalk.white(`>>`), chalk.red(`MySQL`), chalk.green(`Connected to the Main database.`));
                resolve(result);
            }
        });
    });

    client.createDBConnection = async function ({
        game_server: game_server
    }) {
        const game_connection = mysql.createConnection({host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: game_server.database});
        game_connection.on('error', err => console.log(chalk.blue(chalk.bold(`Database`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`MySQL Game`), chalk.red(err)));
        return await new Promise((resolve, reject) => {
            game_connection.connect((err, result) => {
                if (err) {
                    console.log(chalk.blue(chalk.bold(`Database`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`MySQL Game`), chalk.red(`Failed connect to the Game database.`));
                    reject(err);
                } else {
                    game_server.game_connection = game_connection
                    console.log(chalk.blue(chalk.bold(`Database`)), chalk.white(`>>`), chalk.red(`MySQL Game`), chalk.green(`Connected to the Game database.`));
                    resolve(result);
                }
            });
        });
    }
    client.databaseRequest = async function ({
        database: database,
        query: query,
        params: params
    }) {
        if (!database) {
            console.log(chalk.blue(chalk.bold(`Database`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`MySQL`), chalk.red(`Wrong DB at request`));
            return;
        }
        return await new Promise((resolve, reject) => {
            database.query(query, [...params], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    };
    client.databaseSettingsRequest = async function (client, query) {
        if (!client.database) {
            console.log(chalk.blue(chalk.bold(`Database`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`MySQL`), chalk.red(`No DB at request`));
            return;
        }
        return await new Promise((resolve, reject) => {
            database.query(query, [], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    };
}
