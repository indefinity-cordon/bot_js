const Entity = require('./../entity');

class Log extends Entity {
    constructor(db, id, meta) {
        super(db, id, meta);
    }
}

module.exports = async () => {
    global.entity_construct['Log'] = Log;
    global.entity_meta['Log'] = LogMeta;
};

const LogMeta = {
    table: 'logs',
    class: Log,
    columns: {
        id: 'bigint',
        info: 'varchar',
        log_time: 'datetime'
    }
};
