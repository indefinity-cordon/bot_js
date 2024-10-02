const Entity = require('./Entity');

class GuildSettings extends Entity {
    constructor(db, id, meta) {
        super(db, id, meta);
    }
}

global.entity_construct.push({'GuildSettings': GuildSettings})

const GuildSettingsMeta = {
    table: 'guild_settings',
    class: GuildSettings,
    columns: {
        id: 'bigint',
        guild: 'varchar',
        name: 'varchar',
        param: 'varchar',
    }
};

global.entity_meta.push({'GuildSettings': GuildSettingsMeta})
