import Entity from "./../entity.js";

class Server extends Entity {
  constructor(db, id, meta) {
    super(db, id, meta);
    this.updater_messages = {};
    this.update_custom_operators_data = { intervals: {}, additional: {} };
    this.game_connection = null;
    this.message_updater_intervals = null;
    this.update_status_messages_interval = null;
    this.update_roles_interval = null;
    this.update_custom_operatos_interval = null;
    this.settings_data = {};
    this.handling_updaters = {};
    this.handling_actions = {};
    this.handling_commands = [];
    this.modules = {};
    this.updaters_poll = [];
  }

  destroy() {
    super.destroy();
    clearInterval(this.update_status_messages_interval);
    clearInterval(this.update_roles_interval);
    clearInterval(this.update_custom_operatos_interval);
    for (const type in this.updater_messages) {
      clearInterval(this.message_updater_intervals[type]);
      delete this.message_updater_intervals[type];
      delete this.updater_messages[type];
    }
    for (const type in this.update_custom_operators_data["intervals"]) {
      clearInterval(this.update_custom_operators_data[type]);
    }
    this.updater_messages = null;
  }

  async sync() {
    super.sync();
    for (const name in this.settings_data) {
      this.settings_data[name].sync();
    }
  }

  async load_parent() {
    super.load_parent();
    const server_settings = await globalThis.gather_data(
      globalThis.database,
      "ServerSettings",
      "SELECT * FROM ##TABLE## WHERE server = ?",
      [this.id],
    );
    for (const setting of server_settings) {
      this.settings_data[setting.data.name] = setting;
    }
  }

  async map(row) {
    await super.map(row);

    if (row["guild"]) {
      const guild_link = await globalThis.mysqlRequest(
        globalThis.database,
        "SELECT guild_id FROM guilds WHERE id = ?",
        [row["guild"]],
      );
      this.data.guild_id = guild_link[0].guild_id;
    }
  }

  async unmap() {
    const row = await super.unmap();

    if (this.data.guild_id) {
      const guild_link = await globalThis.mysqlRequest(
        globalThis.database,
        "SELECT id FROM guilds WHERE guild_id = ?",
        [this.data.guild_id],
      );
      row["guild"] = guild_link[0].id;
    }
    return row;
  }
}

export default async function LoadEntity() {
  globalThis.entity_construct["Server"] = Server;
  globalThis.entity_meta["Server"] = ServerMeta;
}

const ServerMeta = {
  table: "servers",
  class: Server,
  columns: {
    id: "bigint",
    guild: "bigint",
    server_name: "varchar",
    db_connection_string: "varchar",
    file_name: "varchar",
    ip: "varchar",
    port: "int",
    tgs_id: "int",
    tgs_address: "varchar",
    tgs_login: "varchar",
    tgs_pass: "varchar",
  },
};
