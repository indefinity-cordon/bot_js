const fs = require('fs');

module.exports = async () => {
    global.entity_meta = [];
    global.entity_construct = {};

    fs.readdirSync('./entities').forEach(file => {
        require(`./entities/${file}`)();
    });

    global.gather_data = async function(db, table, query, params) {
        const meta = entityMeta[table];
        if (!meta) {
            throw console.log(`Database >> MySQL (AUTO) >> [ERROR] >> Meta for table ${table} not found`);
        }
        query = query.replace('##TABLE##', meta.table);
        const rows = await global.mysqlRequest(query, params);
        if (!rows.length) {
            return [];
        }
        const entities = rows.map(row => {
            const parsedRow = meta.parse ? meta.parse(row) : row;
            return new meta.class(parsedRow.id, parsedRow);
        });
        return entities;
    };

    try {
        await require('./database_lookup.js')(global.database);
    } catch (error) {
        console.log('Database >> MySQL (AUTO) >> [ERROR] >>', error);
    }
};
