import Entity from "./../entity.js";

class Settings extends Entity {
  constructor(db, id, meta) {
    super(db, id, meta);
  }

  async map(row) {
    await super.map(row);

    if (row["setting"] && isJsonString(this.data.setting)) {
      this.data.param = JSON.parse(this.data.setting);
    }
  }

  async unmap() {
    const row = await super.unmap();

    if (isJsonStringifable(this.data.param)) {
      row.setting = JSON.stringify(this.data.param);
    }
    return row;
  }
}

export default async function LoadEntity() {
  globalThis.entity_construct["Settings"] = Settings;
  globalThis.entity_meta["Settings"] = SettingsMeta;
}

const SettingsMeta = {
  table: "settings",
  class: Settings,
  columns: {
    id: "bigint",
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
