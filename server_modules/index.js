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
     * @type {bigint}
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
    status_messages;

    /**
     * @type {NodeJS.Timer}
     */
    status_interval;

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
        this.guild = BigInt(0);
        this.ip = '';
        this.port = 0;
        this.status_messages = [];
        this.status_interval = null;
        this.update_status_messages_interval = null;
        this.update_roles_interval = null;
    }
}