const Entity = require('./../entity');

class Server extends Entity {
    constructor(db, id, meta) {
        super(db, id, meta);
        this.updater_messages = {};
        this.update_custom_operators_data = {'intervals': {}, 'additional': {}};
        this.game_connection = null;
        this.message_updater_intervals = null;
        this.update_status_messages_interval = null;
        this.update_roles_interval = null;
        this.update_custom_operatos_interval = null;
        this.settings_data = {};
        this.load_config();
    }

    destroy() {
        super.destroy();
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
    }

    async load_config() {
        const server_settings = await global.gather_data(global.database, 'ServerSettings', "SELECT * FROM ##TABLE## WHERE server = ?", [this.id]);
        for (const setting of server_settings) {
            setting.sync();
            this.settings_data[setting.name] = setting;
        }
    }

    async map(row) {
        super.map(row);

        if (row['guild']) {
            const guild_link = await global.mysqlRequest(global.database, "SELECT guild_id FROM guilds WHERE id = ?", [row['guild']]);
            this.data.guild_id = guild_link[0].guild_id;
        }
    }

    async unmap() {
        const row = super.unmap();

        if (this.data.guild_id) {
            const guild_link = await global.mysqlRequest(global.database, "SELECT id FROM guilds WHERE guild_id = ?", [this.data.guild_id]);
            row['guild'] = guild_link[0].id;
        }
        return row;
    }
}

module.exports = async () => {
    global.entity_construct['Server'] = Server;
    global.entity_meta['Server'] = ServerMeta;
};

const ServerMeta = {
    table: 'servers',
    class: Server,
    columns: {
        id: 'bigint',
        guild: 'bigint',
        server_name: 'varchar',
        db_connection_string: 'varchar',
        file_name: 'varchar',
        ip: 'varchar',
        port: 'int',
        tgs_id: 'int',
    }
};
