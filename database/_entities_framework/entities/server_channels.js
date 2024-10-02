const Entity = require('./Entity');

class ServerChannels extends Entity {
    constructor(db, id, meta) {
        super(db, id, meta);
    }
}

global.entity_construct.push({'ServerChannels': ServerChannels})

const ServerChannelsMeta = {
    table: 'server_channels',
    class: ServerChannels,
    columns: {
        id: 'bigint',
        server: 'bigint',
        type: 'varchar',
        channel_id: 'varchar',
        message_id: 'varchar',
    }
};

global.entity_meta.push({'ServerChannels': ServerChannelsMeta})
