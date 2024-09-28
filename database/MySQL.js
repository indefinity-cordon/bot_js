const mysql = require('mysql');
const chalk = require('chalk');

module.exports = async (client) => {
    client.mysqlCreate = async function (connection_params) {
        const connection = mysql.createConnection(connection_params);
        connection.on('error', err => console.log(chalk.blue(chalk.bold('Database')), chalk.white('>>'), chalk.red('[ERROR]'), chalk.white('>>'), chalk.blue('MySQL'), chalk.red(err)));
        await new Promise(async (resolve, reject) => {
            try {
                await mysqlConnect(connection);
                client.INT_modules += setInterval(async () => {
                    const mysql_active = await checkMySQLConnection(connection);
                    if (!mysql_active) {
                        console.log(chalk.blue(chalk.bold('Database')), chalk.white('>>'), chalk.red('[ERROR]'), chalk.white('>>'), chalk.red('Failed to restore MySQL connection'));
                    }
                }, 60000);
                resolve(true);
            } catch (err) {
                reject(err);
            }
        });
        return connection
    };

    if (!client.database) {
        console.log(chalk.blue(chalk.bold('Database')), chalk.white('>>'), chalk.red('MySQL'), chalk.green('connecting'), chalk.white('...'));
        client.database = await client.mysqlCreate({host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME})
        console.log(typeof(client.database.query))
        console.log(`nigggers`)
    };


    client.mysqlRequest = async function (database, query, params) {
        if (!database) {
            console.log(chalk.blue(chalk.bold('Database')), chalk.white('>>'), chalk.red('[ERROR]'), chalk.white('>>'), chalk.blue('MySQL'), chalk.red('Wrong DB at request'));
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

    client.mysqlSettingsRequest = async function (query) {
        if (!client.database) {
            console.log(chalk.blue(chalk.bold('Database')), chalk.white('>>'), chalk.red('[ERROR]'), chalk.white('>>'), chalk.blue('MySQL'), chalk.red('No DB at request'));
            return;
        }
        return await new Promise((resolve, reject) => {
            client.database.query("SELECT param FROM settings WHERE name = ?", [query], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    };
};

async function checkMySQLConnection(connection) {
    return new Promise((resolve) => {
        connection.ping(async (err) => {
            if (err) {
                console.log(chalk.blue(chalk.bold('Database')), chalk.white('>>'), chalk.red('[ERROR]'), chalk.white('>>'), chalk.red('MySQL Connection lost, attempting to reconnect...'));
                try {
                    await mysqlConnect(connection);
                    resolve(true);
                } catch (err) {
                    resolve(false);
                }
            } else {
                resolve(true);
            }
        });
    });
};

async function mysqlConnect(connection) {
    return new Promise((resolve, reject) => {
        connection.connect((err) => {
            if (err) {
                console.log(chalk.blue(chalk.bold('Database')), chalk.white('>>'), chalk.red('[ERROR]'), chalk.white('>>'), chalk.red('Failed to connect to MySQL'), err);
                reject(err);
            } else {
                console.log(chalk.blue(chalk.bold('Database')), chalk.white('>>'), chalk.green('Connected to MySQL'));
                resolve(true);
            }
        });
    });
};
