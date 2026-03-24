import mysql from "mysql";

export default async function MySQL(load_complex_things) {
  globalThis.mysqlCreate = async function (connection_params, database) {
    const connection = mysql.createConnection(
      process.TEST_RUN
        ? process.env.DB_CONNECTION_STRING_BOT
        : connection_params,
    );
    connection.on("error", (err) =>
      console.log("Database >> MySQL >> [ERROR] >>", err),
    );
    await mysqlConnect(connection);
    if (database) database.connection = connection;
    else
      database = {
        connection: connection,
        active: false,
        connection_params: connection_params,
      };
    await new Promise((resolve) => {
      try {
        setInterval(async () => {
          checkMySQLConnection(database);
        }, 60000);
        resolve(true);
      } catch {
        resolve(false);
      }
    });
    return database;
  };

  globalThis.mysqlRequest = async function (database, query, params = []) {
    try {
      return await new Promise((resolve, reject) => {
        database.connection.query(query, [...params], (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    } catch (error) {
      globalThis.custom_error_log(
        `DB >> QUERY ${query}} >> [ERROR] >> `,
        error,
      );
    }
  };

  if (!globalThis.database) {
    console.log(`Database >> MySQL >> Connecting ...`);
    globalThis.database = await globalThis.mysqlCreate(
      process.env.DB_CONNECTION_STRING_BOT,
    );
  }

  if (load_complex_things) {
    (await import("./_entities_framework/index.js")).default();
  }

  globalThis.createLog = async function (text_log, game_server) {
    const interaction_log = new globalThis.entity_construct["Log"](
      globalThis.database,
      null,
      globalThis.entity_meta["Log"],
    );
    interaction_log.data.info = game_server
      ? `${game_server.data.server_name}: ${globalThis.logWithID()}: ${text_log}`
      : `${globalThis.logWithID()}: ${text_log}`;
    interaction_log.save();
  };
}

async function checkMySQLConnection(database) {
  await database.connection.ping(async (err) => {
    if (err) {
      database.active = false;
      console.warn(
        "Database >> MySQL >> [ERROR] >> Connection Lost ... Reconnect Attempt ...",
      );
      try {
        await mysqlConnect(database.connection);
      } catch (err) {
        if (err.fatal)
          globalThis.mysqlCreate(database.connection_params, database);
      }
    } else {
      database.active = true;
    }
  });
}

async function mysqlConnect(connection) {
  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        console.log("Database >> MySQL >> [ERROR] >> Connection Error:", err);
        reject(err);
      } else {
        console.log("Database >> MySQL >> Connected");
        resolve();
      }
    });
  });
}
