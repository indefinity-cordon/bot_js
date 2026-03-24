import mysql from "mysql";
import fs from "node:fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

export default async function LoadTest() {
  const connection = await mysqlConnect();
  const data = fs.readFileSync(
    "./database/discord_bot_test_setup.sql",
    "utf-8",
  );

  const queries = data.split(";").filter((q) => q.trim());
  for (const query of queries) {
    await new Promise((resolve, reject) => {
      connection.query(query, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  connection.end();
}

function mysqlConnect() {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection(
      process.env.DB_CONNECTION_STRING_BOT,
    );
    connection.connect((err) => {
      if (err) {
        globalThis.custom_error_log(
          "Database >> MySQL >> Connection Error:",
          err,
        );
        reject(err);
      } else {
        console.log("Database >> MySQL >> Connected");
        resolve(connection);
      }
    });
  });
}
