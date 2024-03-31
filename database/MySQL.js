const mysql = require('mysql');
const chalk = require('chalk');

const connection = mysql.createConnection({host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,});
connection.on('error', err => console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`MySQL Main`), chalk.white(`>>`), chalk.red(err)));

const cmi_connection = mysql.createConnection({host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME_CMI,});
cmi_connection.on('error', err => console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`MySQL CMI`), chalk.white(`>>`), chalk.red(err)));

const tgmc_connection = mysql.createConnection({host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME_TGMC,});
tgmc_connection.on('error', err => console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`MySQL TGMC`), chalk.white(`>>`), chalk.red(err)));

module.exports = async () => {
    console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`MySQL`), chalk.green(`starting connecting...`))
    global.database = connection;
    global.cmi_database = cmi_connection;
    global.tgmc_database = tgmc_connection;
    connection.connect((err) => {
        if (!err) {
            console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`MySQL`), chalk.green(`Connected to the Main database.`))
        }
    });
    cmi_connection.connect((err) => {
        if (!err) {
            console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`MySQL`), chalk.green(`Connected to the CMI database.`))
        }
    });
    tgmc_connection.connect((err) => {
        if (!err) {
            console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`MySQL`), chalk.green(`Connected to the TGMC database.`))
        }
    });
    return;
}