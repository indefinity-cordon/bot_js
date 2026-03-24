import mysql from "mysql";

export default async function MySQL(load_complex_things) {
  globalThis.mysqlCreate = async function (connection_params) {
    const connection = mysql.createConnection(
      process.TEST_RUN
        ? process.env.DB_CONNECTION_STRING_BOT
        : connection_params,
    );
    connection.on("error", (err) =>
      console.log("Database >> MySQL >> [ERROR] >>", err),
    );
    await mysqlConnect(connection);
    await new Promise((resolve) => {
      try {
        setInterval(async () => {
          const mysql_active = await checkMySQLConnection(connection);
          if (!mysql_active) {
            console.warn(
              "Database >> MySQL >> [ERROR] >> Failed to Restore Connection",
            );
          }
        }, 60000);
        resolve(true);
      } catch {
        resolve(false);
      }
    });
    return connection;
  };

  globalThis.mysqlRequest = async function (database, query, params = []) {
    if (!database) {
      console.error(`DB >> MySQL >> [WARNING] >> Wrong DB at request`);
      return [];
    }

    try {
      return await new Promise((resolve, reject) => {
        database.query(query, [...params], (err, result) => {
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

async function checkMySQLConnection(connection) {
  return new Promise((resolve) => {
    connection.ping(async (err) => {
      if (err) {
        console.warn(
          "Database >> MySQL >> [ERROR] >> Connection Lost ... Reconnect Attempt ...",
        );
        try {
          await mysqlConnect(connection);
          resolve(true);
        } catch {
          resolve(false);
        }
      } else {
        resolve(true);
      }
    });
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
        resolve(true);
      }
    });
  });
}
