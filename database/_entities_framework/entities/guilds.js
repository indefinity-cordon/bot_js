const Entity = require('./../entity');

class Guild extends Entity {
	constructor(db, id, meta) {
		super(db, id, meta);
		this.settings_data = {};
		this.load_config();
	}

	async load_config() {
		const guild_settings = await global.gather_data(global.database, 'GuildSettings', "SELECT * FROM ##TABLE## WHERE guild = ?", [this.id]);
		for (const setting of guild_settings) {
			setting.sync();
			this.settings_data[setting.data.name] = setting;
		}
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
