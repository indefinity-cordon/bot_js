const Entity = require('./../entity');

class Guild extends Entity {
    constructor(db, id, meta) {
        super(db, id, meta);
    }
}

module.exports = async () => {
    global.entity_construct['Guild'] = Guild;
    global.entity_meta['Guild'] = GuildMeta;
};

const GuildMeta = {
    table: 'guilds',
    class: Guild,
    columns: {
        id: 'bigint',
        guild_id: 'varchar',
    }
};
