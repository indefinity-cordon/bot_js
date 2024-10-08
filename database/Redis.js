const redis = require('redis');

module.exports = async () => {
	if (!global.redis_connection) {
		global.redis_connection = redis.createClient(process.env.REDIS_STRING);
		global.redis_connection.on('error', err => console.log('Database >> Redis >> [ERROR] >>', err));
		console.log('Database >> Redis >> Connecting ...');
		redisConnect();
	}

	setInterval(async () => {
		const redisActive = await checkRedisConnection();
		if (!redisActive) {
			console.log('Database >> Redis >> [ERROR] >> Failed to Restore Connection');
		}
	}, 60000);
};

async function checkRedisConnection() {
	try {
		const result = await global.redis_connection.ping();
		if (result === 'PONG') return true;
	} catch (err) {
		console.log('Database >> Redis >> [ERROR] >> Connection Lost ... Redconnect Attempt ...');
		return await redisConnect();
	}
};

async function redisConnect() {
	try {
		await global.redis_connection.connect();
		console.log('Database >> Redis >> Connected');
		return true;
	} catch (err) {
		console.log('Database >> Redis >> [ERROR] >> Connection Error:', err);
		return false;
	}
};