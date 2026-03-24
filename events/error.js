export default async function error(error) {
  console.error(error);
  globalThis._LogsHandler.error(
    error,
    "Frame encountered an error",
    globalThis.logWithID(4),
    "error",
  );
}
