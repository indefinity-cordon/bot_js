import fs from "node:fs";

export default async function DataMeta() {
  globalThis.entity_meta = {};
  globalThis.entity_construct = {};

  const files = fs.readdirSync("./database/_entities_framework/entities");
  for (const file of files) {
    (await import(`./entities/${file}`)).default();
  }

  globalThis.gather_data = async function (db, table, query, params) {
    const meta = globalThis.entity_meta[table];
    if (!meta) {
      throw console.log(
        `Database >> MySQL (AUTO) >> [ERROR] >> Meta for table ${table} not found`,
      );
    }
    query = query.replace("##TABLE##", meta.table);
    const rows = await globalThis.mysqlRequest(db, query, params);
    if (!rows.length) {
      return [];
    }
    const entities = await Promise.all(
      rows.map(async (row) => {
        const entity = new meta.class(db, row.id, meta);
        delete row["id"];
        await entity.map(row);
        entity.sync_data = await entity.unmap();
        return entity;
      }),
    );
    return entities;
  };

  try {
    (await import("./database_lookup.js")).default(globalThis.database);
  } catch (error) {
    console.log("Database >> MySQL (AUTO) >> [ERROR] >>", error);
  }
}
