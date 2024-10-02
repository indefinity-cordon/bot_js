const Entity = require('./Entity');

class Guild extends Entity {
    constructor(db, id, meta) {
        super(db, id, meta);
    }
}

global.entity_construct.push({'Guild': Guild})

const GuildMeta = {
    table: 'guilds',
    class: Guild,
    columns: {
        id: 'bigint',
        guild_id: 'varchar',
    }
};

global.entity_meta.push({'Guild': GuildMeta})