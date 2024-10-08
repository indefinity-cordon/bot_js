const fs = require('fs');

module.exports = async () => {
	global.entity_meta = {};
	global.entity_construct = {};

	fs.readdirSync('./database/_entities_framework/entities').forEach(file => {
		require(`./entities/${file}`)();
	});

	//Make here finding out already loaded and sync new added/removed in entity to remove it then too
	global.gather_data = async function(db, table, query, params) {
		const meta = global.entity_meta[table];
		if (!meta) {
			throw console.log(`Database >> MySQL (AUTO) >> [ERROR] >> Meta for table ${table} not found`);
		}
		query = query.replace('##TABLE##', meta.table);
		const rows = await global.mysqlRequest(db, query, params);
		if (!rows.length) {
			return [];
		}
		const entities = await Promise.all(rows.map(async row => {
			const entity = new meta.class(db, row.id, meta);
			delete row['id'];
			await entity.map(row);
			entity.sync_data = await entity.unmap();
			return entity;
		}));
		return entities;
	};

	try {
		await require('./database_lookup.js')(global.database);
	} catch (error) {
		console.log('Database >> MySQL (AUTO) >> [ERROR] >>', error);
	}
};
