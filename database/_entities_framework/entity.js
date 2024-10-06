class Entity {
    constructor(db, id, meta) {
        this.db = db;
        this.id = id;
        this.meta = meta;
        this.data = {};
        this.sync_data = null;
        this.auto_sync_interval = null;
    }

    destroy() {
        this.db = null;
        this.meta = null;
        this.data = null;
        this.sync_data = null;
        clearInterval(this.auto_sync_interval);
    }

    async map(row) {
        for (const key in row) {
            this.data[key] = row[key];
        }
    }

    async unmap() {
        return { ...this.data };
    }

    async save() {
        const rows = this.id ? await global.mysqlRequest(this.db, `SELECT * FROM ${this.meta.table} WHERE id = ?`, [this.id]) : [];
        var to_map_outgoing = null;
        if (rows.length > 0) {
            const to_map_incoming = {};
            to_map_outgoing = {};
            const db_data = rows[0];
            delete db_data['id'];
            for (const key in db_data) {
                if (!Object.entries(this.sync_data).length || !(key in this.sync_data)) {
                    to_map_incoming[key] = db_data[key];
                } else if (this.data[key] !== this.sync_data[key]) {
                    to_map_outgoing[key] = this.data[key];
                } else if (db_data[key] !== this.sync_data[key]) {
                    to_map_incoming[key] = db_data[key];
                }
            }
            await this.map(to_map_incoming);
            await this.map(to_map_outgoing);
            this.sync_data = await this.unmap();
        } else {
            to_map_outgoing = await this.unmap();
        }
        if (Object.entries(to_map_outgoing).length) {
            await this.map(to_map_outgoing);
            const columns = Object.keys(to_map_outgoing).join(', ');
            const values = Object.values(to_map_outgoing);
            const placeholders = values.map(() => '?').join(', ');
            await global.mysqlRequest(this.db, `INSERT INTO ${this.meta.table} (${columns}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${columns.split(', ').map(col => `${col} = VALUES(${col})`).join(', ')}`, values);
        }
    }

    async sync(interval = 10000) {
        await this.save();
        this.auto_sync_interval = setInterval(async () => {
            try {
                await this.save();
            } catch (error) {
                console.log(`Database >> MySQL (ENTITY) >> [ERROR] >> ID: ${this.id}, Error:`, error);
            }
        }, interval);
    }
}

module.exports = Entity;
