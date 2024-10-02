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
        data
    }

    map(row) {
        for (const key in row) {
            this.data[key] = row[key];
        }
    }

    unmap() {
        return { ...this.data };
    }

    async save() {
        const rows = await this.db.query(`SELECT * FROM ${this.meta.table} WHERE id = ?`, [this.id]);
        if (rows.length > 0) {
            const dbData = rows[0];
            delete dbData['id'];
            for (const key in dbData) {
                if (!this.lastSyncedData) {
                    this.map({key: dbData[key]})
                } else if (this.data[key] !== this.lastSyncedData[key]) {
                    continue;
                } else if (dbData[key] !== this.lastSyncedData[key]) {
                    this.map({key: dbData[key]})
                }
            }
        }
        const rowToSave = this.unmap();
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
