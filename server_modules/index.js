module.exports = class Server {
    /**
     * @type {string}
     */
    server_name;

    /**
     * @type {string}
     */
    database;

    /**
     * @type {object}
     */
    game_connection;

    /**
     * @type {string}
     */
    init_file_name;

    /**
     * @type {string}
     */
    guild;

    /**
     * @type {string}
     */
    ip;

    /**
     * @type {number}
     */
    port;

    /**
     * @type {Array}
     */
    updater_messages;

    /**
     * @type {Array}
     */
    message_updater_intervals;

    /**
     * @type {NodeJS.Timer}
     */
    update_status_messages_interval;

    /**
     * @type {NodeJS.Timer}
     */
    update_roles_interval;

    constructor() {
        this.server_name = '';
        this.database = '';
        this.game_connection = null;
        this.init_file_name = '';
        this.guild = '';
        this.ip = '';
        this.port = 0;
        this.updater_messages = {};
        this.message_updater_intervals = null;
        this.update_status_messages_interval = null;
        this.update_roles_interval = null;
    }
}