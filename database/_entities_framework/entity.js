class Entity {
    constructor(db, id, meta) {
        this.db = db;
        this.id = id;
        this.meta = meta;
        this.data = {};
        this.sync_data = {};
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
        const to_map = {};
        let local_update = false;
        if (rows.length > 0) {
            const db_data = rows[0];
            delete db_data['id'];
            for (const key in db_data) {
                if (!this.sync_data.length || !(key in this.sync_data)) {
                    to_map[key] = db_data[key];
                } else if (this.data[key] !== this.sync_data[key]) {
                    local_update = true;
                } else if (db_data[key] !== this.sync_data[key]) {
                    to_map[key] = db_data[key];
                }
            }
        } else {
            local_update = true;
        }
        if (Object.entries(to_map).length) {
            await this.map(to_map);
        }
        const row_to_save = await this.unmap();
        if (local_update) {
            const columns = Object.keys(row_to_save).join(', ');
            const values = Object.values(row_to_save);
            const placeholders = values.map(() => '?').join(', ');
            await global.mysqlRequest(this.db, `INSERT INTO ${meta.table} (${columns}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${columns.split(', ').map(col => `${col} = VALUES(${col})`).join(', ')}`, values);
        }
        this.sync_data = { ...row_to_save };
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
