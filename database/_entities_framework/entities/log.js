import Entity from "./../entity.js";

class Log extends Entity {
  constructor(db, id, meta) {
    super(db, id, meta);
  }
}

export default async function LoadEntity() {
  globalThis.entity_construct["Log"] = Log;
  globalThis.entity_meta["Log"] = LogMeta;
}

const LogMeta = {
  table: "logs",
  class: Log,
  columns: {
    id: "bigint",
    info: "varchar",
    log_time: "datetime",
  },
};
