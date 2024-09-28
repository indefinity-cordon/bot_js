module.exports = class Server {
    /**
     * @type {String}
     */
    server_name;

    /**
     * @type {String}
     */
    database;

    /**
     * @type {Object}
     */
    game_connection;

    /**
     * @type {String}
     */
    init_file_name;

    /**
     * @type {String}
     */
    guild;

    /**
     * @type {String}
     */
    ip;

    /**
     * @type {Number}
     */
    port;

    /**
     * @type {Number}
     */
    tgs_id;

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

    /**
     * @type {NodeJS.Timer}
     */
    update_custom_operatos_interval;

    /**
     * @type {Array}
     */
    update_custom_operators_data;

    /**
     * @type {Boolean}
     */
    server_online

    constructor(database_server) {
        this.server_name = database_server.server_name;
        this.database = database_server.db_name;
        this.init_file_name = database_server.file_name;
        this.guild = database_server.guild;
        this.ip = database_server.ip;
        this.port = database_server.port;
        this.tgs_id = database_server.tgs_id;
        this.updater_messages = {};
        this.update_custom_operators_data = {'intervals': {}, 'additional': {}};
        this.game_connection = null;
        this.message_updater_intervals = null;
        this.update_status_messages_interval = null;
        this.update_roles_interval = null;
        this.update_custom_operatos_interval = null;
        this.server_online = false;
    }
}