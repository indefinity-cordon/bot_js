import Entity from "./../entity.js";

class Guild extends Entity {
  constructor(db, id, meta) {
    super(db, id, meta);
    this.settings_data = {};
    this.modules = {};
  }

  async sync() {
    super.sync();
    for (const name in this.settings_data) {
      this.settings_data[name].sync();
    }
  }

  async load_parent() {
    super.load_parent();
    const guild_settings = await globalThis.gather_data(
      globalThis.database,
      "GuildSettings",
      "SELECT * FROM ##TABLE## WHERE guild = ?",
      [this.id],
    );
    for (const setting of guild_settings) {
      this.settings_data[setting.data.name] = setting;
    }
  }
}

export default async function LoadEntity() {
  globalThis.entity_construct["Guild"] = Guild;
  globalThis.entity_meta["Guild"] = GuildMeta;
}

const GuildMeta = {
  table: "guilds",
  class: Guild,
  columns: {
    id: "bigint",
    guild_id: "varchar",
  },
};
