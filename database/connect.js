const mysql = require('mysql');
const chalk = require('chalk');
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

module.exports = async () => {
    console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`MySQL`), chalk.green(`is connecting...`))
    connection.connect((err) => {
        if (err) {
            console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`MySQL`), chalk.white(`>>`), chalk.red(`Failed to connect to MySQL!`), chalk.white(`>>`), chalk.red(err))
            process.exit(1)
        } else {
            console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`MySQL`), chalk.green(`Connected to the MySQL server.`))
            global.database = connection;
        }
    });
    return;
}
