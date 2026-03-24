import Entity from "./../entity.js";

class ServerSettings extends Entity {
  constructor(db, id, meta) {
    super(db, id, meta);
  }

  async map(row) {
    await super.map(row);

    if (row["setting"] && isJsonString(this.data.setting)) {
      this.param = JSON.parse(this.data.setting);
    }
  }

  async unmap() {
    const row = await super.unmap();

    if (this.data["param"] && isJsonStringifable(this.data.param)) {
      row.setting = JSON.stringify(this.data.param);
    }
    return row;
  }
}

export default async function LoadEntity() {
  globalThis.entity_construct["ServerSettings"] = ServerSettings;
  globalThis.entity_meta["ServerSettings"] = ServerSettingsMeta;
}

const ServerSettingsMeta = {
  table: "server_settings",
  class: ServerSettings,
  columns: {
    id: "bigint",
    server: "bigint",
    name: "varchar",
    setting: "varchar",
  },
};

function isJsonString(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

function isJsonStringifable(obj) {
  try {
    JSON.stringify(obj);
    return true;
  } catch {
    return false;
  }
}
