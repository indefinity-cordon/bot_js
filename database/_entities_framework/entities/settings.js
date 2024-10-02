const Entity = require('./Entity');

class Settings extends Entity {
    constructor(db, id, meta) {
        super(db, id, meta);
    }

    map(row) {
        super.map(row);

        if (isJsonString(this.data.param)) {
            this.data.param = JSON.parse(this.data.settings);
        }
    }

    unmap() {
        const row = super.unmap();

        if (isJsonStringifable(this.data.param)) {
            row.param = JSON.stringify(this.data.settings);
        }
        return row;
    }
}

global.entity_construct.push({'Settings': Settings})

const SettingsMeta = {
    table: 'settings',
    class: Settings,
    columns: {
        id: 'bigint',
        name: 'varchar',
        param: 'varchar',
    }
};

global.entity_meta.push({'Settings': SettingsMeta})

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
