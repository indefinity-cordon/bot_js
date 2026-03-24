import Entity from "./../entity.js";

class ServerChannels extends Entity {
  constructor(db, id, meta) {
    super(db, id, meta);
  }
}

export default async function LoadEntity() {
  globalThis.entity_construct["ServerChannels"] = ServerChannels;
  globalThis.entity_meta["ServerChannels"] = ServerChannelsMeta;
}

const ServerChannelsMeta = {
  table: "server_channels",
  class: ServerChannels,
  columns: {
    id: "bigint",
    server: "bigint",
    type: "varchar",
    channel_id: "varchar",
    message_id: "varchar",
  },
};
