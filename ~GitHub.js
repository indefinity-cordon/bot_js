import simpleGit from "simple-git";

const git = simpleGit(process.cwd());

export default async function LoadAutoUpdate() {
  globalThis.git_commit = await getLastLocalCommit();
  console.log("GitHub >> Current commit:", globalThis.git_commit);
  globalThis._LogsHandler.sendSimplyLog(
    "System",
    null,
    globalThis.logWithID(),
    [
      {
        name: "Start",
        value: `Commit SHA: ${globalThis.git_commit.hash}\nMessage: ${globalThis.git_commit.message}`,
      },
    ],
  );

  setInterval(tryForUpdate, 10 * 60000);
}

async function getLastCommit() {
  try {
    await git.addConfig("credential.helper", "store");

    if (process.env.GITHUB_PAT) {
      await git.remote([
        "set-url",
        "origin",
        `https://${process.env.GITHUB_PAT}@github.com/${process.env.GITHUB_LINK}.git`,
      ]);
    }
    await git.fetch();
    const log = await git.log([`origin/${process.env.GITHUB_BRANCH}`]);
    return log.latest;
  } catch (error) {
    globalThis.custom_error_log("GitHub >> [ERROR] >> Failed (remote):", error);
  }
}

async function getLastLocalCommit() {
  try {
    const log = await git.log([process.env.GITHUB_BRANCH]);
    return log.latest;
  } catch (error) {
    globalThis.custom_error_log("GitHub >> [ERROR] >> Failed (local):", error);
  }
}

async function pullChanges() {
  try {
    await git.pull("origin", process.env.GITHUB_BRANCH);
    console.log("GitHub >> Pulled latest changes");
  } catch (error) {
    globalThis.custom_error_log("GitHub >> [ERROR] >>", error);
  }
}

let last_time_failed = 0;
async function tryForUpdate() {
  const remote_commit = await getLastCommit();
  if (!globalThis.git_commit)
    globalThis.git_commit = await getLastLocalCommit();
  if (
    (!remote_commit || !globalThis.git_commit) &&
    last_time_failed < Date.now() - 15 * 60000
  ) {
    last_time_failed = Date.now();
    console.log(
      "GitHub >> [WARNING] >> Failed version check, make sure all setted up right: remote, local and github pat",
    );
    globalThis._LogsHandler.sendSimplyLog("Git", null, globalThis.logWithID(), [
      {
        name: "Warning",
        value: `Failed version check, make sure all setted up right: remote, local and github pat`,
      },
    ]);
  } else if (
    remote_commit.hash !== globalThis.git_commit.hash &&
    (remote_commit.message.includes("[STABLE]") ||
      (process.env.DEV && remote_commit.message.includes("[DEV]")))
  ) {
    console.log("GitHub >> New commit found, checking changes...");

    await pullChanges();
    globalThis.restartApp("Pulled new changes from GIT");
  }
}
