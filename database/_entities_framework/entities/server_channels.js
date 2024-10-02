const Entity = require('./../entity');

class ServerChannels extends Entity {
    constructor(db, id, meta) {
        super(db, id, meta);
    }
}

module.exports = async () => {
    global.entity_construct['ServerChannels'] = ServerChannels;
    global.entity_meta['ServerChannels'] = ServerChannelsMeta;
};

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
