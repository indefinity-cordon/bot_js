const Discord = require('discord.js');
const chalk = require('chalk');

module.exports = async () => {
    global.errorHandler = new class ErrorHandler {}()
}