const Entity = require('./../entity');

class GuildSettings extends Entity {
    constructor(db, id, meta) {
        super(db, id, meta);
    }

    map(row) {
        super.map(row);

        if (row['setting'] && isJsonString(this.data.setting)) {
            this.param = JSON.parse(this.data.setting);
        }
    }

    unmap() {
        const row = super.unmap();

        if (isJsonStringifable(this.data.param)) {
            row.setting = JSON.stringify(this.data.param);
        }
        return row;
    }
}

module.exports = async () => {
    global.entity_construct['GuildSettings'] = GuildSettings;
    global.entity_meta['GuildSettings'] = GuildSettingsMeta;
};

const GuildSettingsMeta = {
    table: 'guild_settings',
    class: GuildSettings,
    columns: {
        id: 'bigint',
        guild: 'varchar',
        name: 'varchar',
        setting: 'varchar',
    }
};

function isJsonString(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

function isJsonStringifable(obj) {
    try {
        JSON.stringify(obj);
        return true;
    } catch (e) {
        return false;
    }
}
