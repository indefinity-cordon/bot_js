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
        const rows = await this.db.query(`SELECT * FROM ${this.meta.table} WHERE id = ?`, [this.id]);
        const to_map = []
        if (rows.length > 0) {
            const db_data = rows[0];
            delete db_data['id'];
            for (const key in db_data) {
                if (!this.sync_data) {
                    to_map.push({key: db_data[key]})
                } else if (this.data[key] !== this.sync_data[key]) {
                    continue;
                } else if (db_data[key] !== this.sync_data[key]) {
                    to_map.push({key: db_data[key]})
                }
            }
        }
        if (to_map.length) await this.map(to_map)
        const rowToSave = await this.unmap();
        const columns = Object.keys(rowToSave).join(', ');
        const values = Object.values(rowToSave);
        const placeholders = values.map(() => '?').join(', ');
        await db.query(
            `INSERT INTO ${meta.table} (${columns}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${columns.split(', ').map(col => `${col} = VALUES(${col})`).join(', ')}`,
            values
        );
        this.sync_data = { ...rowToSave };
    }

    sync(interval = 30000) {
        auto_sync_interval = setInterval(async () => {
            try {
                await this.save();
            } catch (error) {
                console.log(`Database >> MySQL (ENTITY) >> [ERROR] >> ID: ${this.id}, Error:`, error);
            }
        }, interval);
    }
}

module.exports = Entity;
