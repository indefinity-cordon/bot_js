const Entity = require('./Entity');

class Server extends Entity {
    constructor(db, id, meta) {
        super(db, id, meta);
    }
}

global.entity_construct.push({'Server': Server})

const ServerMeta = {
    table: 'servers',
    class: Server,
    columns: {
        id: 'bigint',
        guild: 'bigint',
        server_name: 'varchar',
        db_name: 'varchar',
        file_name: 'varchar',
        ip: 'varchar',
        port: 'int',
        tgs_id: 'int',
    }
};

global.entity_meta.push({'Server': ServerMeta})
