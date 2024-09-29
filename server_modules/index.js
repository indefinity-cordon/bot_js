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

    /**
     * @type {Number}
     */
    online

    constructor(database_server, client) {
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
        this.online = 0;
        this.pull_data_update = async function () {
            const server_settings = await client.mysqlRequest(client.database, "SELECT name, param FROM server_settings WHERE server_name = ?", [this.server_name]);
            for (const setting of server_settings) {
                this[setting.name] = setting.param;
            }
        };
        this.pull_data_update()
        this.drop_link = async function () {
            clearInterval(this.update_status_messages_interval);
            clearInterval(this.update_roles_interval);
            clearInterval(this.update_custom_operatos_interval);
            for(const type in this.updater_messages) {
                clearInterval(this.message_updater_intervals[type]);
                delete this.message_updater_intervals[type];
                delete this.updater_messages[type];
            }
            for(const type in this.update_custom_operators_data['intervals']) {
                clearInterval(this.update_custom_operators_data[type]);
            }
            this.updater_messages = null;
        };
    }
}