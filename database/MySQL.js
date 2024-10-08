const mysql = require('mysql');

module.exports = async (load_complex_things) => {
	global.mysqlCreate = async function (connection_params) {
		const connection = mysql.createConnection(connection_params);
		connection.on('error', err => console.log('Database >> MySQL >> [ERROR] >>', err));
		await new Promise(async (resolve, reject) => {
			try {
				await mysqlConnect(connection);
				setInterval(async () => {
					const mysql_active = await checkMySQLConnection(connection);
					if (!mysql_active) {
						console.log('Database >> MySQL >> [ERROR] >> Failed to Restore Connection');
					}
				}, 60000);
				resolve(true);
			} catch (err) {
				resolve(false);
			}
		});
		return connection;
	};

	global.mysqlRequest = async function (database, query, params = []) {
		if (!database) throw 'Database >> MySQL >> [WARNING] >> Wrong DB at request';

		return await new Promise((resolve, reject) => {
			database.query(query, [...params], (err, result) => {
				if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			});
		});
	};

	if (!global.database) {
		console.log(`Database >> MySQL >> Connecting ...`);
		global.database = await global.mysqlCreate(process.env.DB_CONNECTION_STRING_BOT);
	}

	if (!global.database) {
		console.log(`Database >> MySQL >> Connecting ...`);
		global.database = await global.mysqlCreate(process.env.DB_CONNECTION_STRING_BOT);
	}

	if (load_complex_things) require('./_entities_framework/index.js')();

	global.createLog = async function (text_log) {
		const interaction_log = new global.entity_construct['Log'](global.database, null, global.entity_meta['Log']);
		interaction_log.data.info = text_log;
		interaction_log.save();
	};
};


async function checkMySQLConnection(connection) {
	return new Promise((resolve) => {
		connection.ping(async (err) => {
			if (err) {
				console.log('Database >> MySQL >> [ERROR] >> Connection Lost ... Reconnect Attempt ...');
				try {
					await mysqlConnect(connection);
					resolve(true);
				} catch (err) {
					resolve(false);
				}
			} else {
				resolve(true);
			}
		});
	});
};

async function mysqlConnect(connection) {
	return new Promise((resolve, reject) => {
		connection.connect((err) => {
			if (err) {
				console.log('Database >> MySQL >> [ERROR] >> Connection Error:', err);
				reject(err);
			} else {
				console.log('Database >> MySQL >> Connected');
				resolve(true);
			}
		});
	});
};
