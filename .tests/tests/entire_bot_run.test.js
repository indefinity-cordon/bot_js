/* eslint-disable no-undef */
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

describe("Full bot run", () => {
  beforeAll(async () => {
    process.TEST_RUN = true;
    await import(`${process.cwd()}/bot.js`);
  });

  afterAll(async () => {
    globalThis.discord_client.destroy();
  });

  const test_timeout = 1 * 60000;
  test(
    "Bot should khs",
    async () => {
      const result = await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (globalThis.initialized) {
            clearInterval(interval);
            resolve(globalThis.initialized);
          }
        }, 5000);
      });
      expect(result).toBe(true);
    },
    test_timeout,
  );
});
