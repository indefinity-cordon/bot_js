import base64 from "base-64";
import axios from "axios";

let bearersValidUntil = { "https://localhost:5000": 0 };
let bearersData = { "https://localhost:5000": { Authorization: "fixme" } };
const defaultHeaders = {
  accept: "application/json",
  "User-Agent": "Amogus/1.0.0.0",
  Api: "Tgstation.Server.Api/10.0.0",
};

export default async function declareTGS() {
  globalThis.discord_client.tgs_auth = async function (
    tgsAddress,
    tgsLoginString,
  ) {
    const authHeader = {
      Authorization: `Basic ${base64.encode(tgsLoginString)}`,
    };
    const headers = { ...defaultHeaders, ...authHeader };
    try {
      const response = await axios.post(`${tgsAddress}/api`, null, { headers });
      bearersData[tgsAddress] = {
        Authorization: `Bearer ${response.data.bearer}`,
      };
      bearersValidUntil[tgsAddress] = new Date(
        Date.now() - new Date().getTimezoneOffset() * 60000 + 600000,
      );
      return bearersData[tgsAddress];
    } catch (error) {
      console.log("TGS >> [ERROR] >> Auth Failed:", error);
    }
  };

  globalThis.discord_client.tgs_checkAuth = async function (
    tgsAddress,
    tgsLogin,
    tgsPass,
  ) {
    const valid_time = new Date(
      Date.now() - new Date().getTimezoneOffset() * 60000,
    );
    if (valid_time < bearersValidUntil[tgsAddress])
      return bearersData[tgsAddress];
    else
      return await globalThis.discord_client.tgs_auth(
        tgsAddress,
        `${tgsLogin}:${tgsPass}`,
      );
  };

  globalThis.discord_client.tgs_getInstances = async function (
    tgsAddress,
    tgsLogin,
    tgsPass,
  ) {
    const bearer = await globalThis.discord_client.tgs_checkAuth(
      tgsAddress,
      tgsLogin,
      tgsPass,
    );
    if (!bearer) return;
    const headers = { ...defaultHeaders, ...bearer };
    const response = await axios.get(`${tgsAddress}/api/Instance/List`, {
      headers,
    });
    const instances = response.data.content.map((instance) => ({
      id: instance.id,
      name: instance.name,
      online: instance.online,
    }));
    return instances;
  };

  globalThis.discord_client.tgs_getInstance = async function (
    tgsAddress,
    tgsLogin,
    tgsPass,
    instanceId,
  ) {
    const bearer = await globalThis.discord_client.tgs_checkAuth(
      tgsAddress,
      tgsLogin,
      tgsPass,
    );
    if (!bearer) return;
    const headers = { ...defaultHeaders, ...bearer };
    const response = await axios.get(
      `${tgsAddress}/api/Instance/${instanceId}`,
      { headers },
    );
    return response.data;
  };

  globalThis.discord_client.tgs_getActiveJobs = async function (
    tgsAddress,
    tgsLogin,
    tgsPass,
  ) {
    const bearer = await globalThis.discord_client.tgs_checkAuth(
      tgsAddress,
      tgsLogin,
      tgsPass,
    );
    if (!bearer) return;
    const headers = { ...defaultHeaders, ...bearer };
    const response = await axios.get(`${tgsAddress}/api/Job`, { headers });
    return response.data;
  };

  globalThis.discord_client.tgs_getRepository = async function (
    tgsAddress,
    tgsLogin,
    tgsPass,
    instanceId,
  ) {
    const bearer = await globalThis.discord_client.tgs_checkAuth(
      tgsAddress,
      tgsLogin,
      tgsPass,
    );
    if (!bearer) return;
    const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
    const response = await axios.get(`${tgsAddress}/api/Repository`, {
      headers,
    });
    return response.data;
  };

  globalThis.discord_client.tgs_start = async function (
    tgsAddress,
    tgsLogin,
    tgsPass,
    instanceId,
    interaction,
  ) {
    const bearer = await globalThis.discord_client.tgs_checkAuth(
      tgsAddress,
      tgsLogin,
      tgsPass,
    );
    if (!bearer) return;
    const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
    const response = await axios.put(`${tgsAddress}/api/DreamDaemon`, null, {
      headers,
    });
    if (!interaction) return response;
    globalThis.createLog("Server used command [TGS Start]");
    return response;
  };

  globalThis.discord_client.tgs_stop = async function (
    tgsAddress,
    tgsLogin,
    tgsPass,
    instanceId,
    interaction,
  ) {
    const bearer = await globalThis.discord_client.tgs_checkAuth(
      tgsAddress,
      tgsLogin,
      tgsPass,
    );
    if (!bearer) return;
    const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
    const response = await axios.delete(`${tgsAddress}/api/DreamDaemon`, {
      headers,
    });

    if (interaction) return response;
    globalThis.createLog("Server used command [TGS Stop]");
    return response;
  };

  globalThis.discord_client.tgs_softShutdown = async function (
    tgsAddress,
    tgsLogin,
    tgsPass,
    instanceId,
    interaction,
    graceful_action,
  ) {
    const bearer = await globalThis.discord_client.tgs_checkAuth(
      tgsAddress,
      tgsLogin,
      tgsPass,
    );
    if (!bearer) return;
    const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
    if (!graceful_action) {
      if (!interaction) return;
      graceful_action =
        await globalThis.discord_client.sendInteractionSelectMenu(
          interaction,
          "Select Action",
          [
            { label: "Soft Shutdown", value: "1" },
            { label: "Soft Restart", value: "0" },
          ],
          "Please select action to perform:",
        );
      if (!graceful_action) return;
    }
    const response = await axios.post(
      `${tgsAddress}/api/DreamDaemon`,
      { softShutdown: !!graceful_action },
      { headers },
    );

    if (!interaction) return response;
    globalThis.createLog("Server used command [TGS Start]");
    return response;
  };

  globalThis.discord_client.tgs_deploy = async function (
    tgsAddress,
    tgsLogin,
    tgsPass,
    instanceId,
    interaction,
  ) {
    const bearer = await globalThis.discord_client.tgs_checkAuth(
      tgsAddress,
      tgsLogin,
      tgsPass,
    );
    if (!bearer) return;
    const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
    const response = await axios.put(`${tgsAddress}/api/DreamMaker`, null, {
      headers,
    });

    if (interaction) return response;
    globalThis.createLog("Server used command [TGS Deploy]");
    return response;
  };

  globalThis.discord_client.tgs_testMerge = async function (
    tgsAddress,
    tgsLogin,
    tgsPass,
    instanceId,
    interaction,
    repository_data,
  ) {
    const bearer = await globalThis.discord_client.tgs_checkAuth(
      tgsAddress,
      tgsLogin,
      tgsPass,
    );
    if (!bearer) return;
    const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
    const response = await axios.post(
      `${tgsAddress}/api/Repository`,
      repository_data,
      { headers },
    );

    if (interaction) return response;
    globalThis.createLog("Server used command [TGS Test Merges]");
    return response;
  };

  globalThis.discord_client.tgs_handleTestMerge = async function (
    tgsAddress,
    tgsLogin,
    tgsPass,
    instanceId,
    interaction,
  ) {
    const repository = await globalThis.discord_client.tgs_getRepository(
      tgsAddress,
      tgsLogin,
      tgsPass,
      instanceId,
    );
    if (!repository?.origin || !repository?.reference)
      return await globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Request",
          desc: "Repository or branch not found.",
          color: "#c70058",
        },
        interaction,
      );

    if (!process.env.GITHUB_PAT)
      return await globalThis.discord_client.ephemeralEmbedEdit(
        {
          title: "Request",
          desc: "Warning, not found token to access.",
          color: "#c70058",
        },
        interaction,
      );

    const response = await axios.get(
      `https://api.github.com/repos/${repository.origin.replace("https://github.com/", "").replace(".git", "")}/pulls`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_PAT}`,
        },
        params: {
          base: repository.reference,
          state: "open",
          per_page: 500,
        },
      },
    );
    const prs = response.data;
    if (!prs.length)
      return await globalThis.discord_client.ephemeralEmbedEdit(
        { title: "Request", desc: "Not found any PRs.", color: "#c70058" },
        interaction,
      );

    const all_prs = prs.map((pr) => ({
      label: `PR #${pr.number}`,
      value: pr.number.toString(),
    }));

    const selected_prs =
      await globalThis.discord_client.sendInteractionSelectMenu(
        interaction,
        "Select PRs",
        all_prs,
        "Select PRs to be set for TM:",
        true,
      );
    if (!selected_prs) return;

    const new_test_merges = selected_prs.map((pr) => ({
      number: Number.parseInt(pr),
    }));

    const repository_data = {
      updateFromOrigin: true,
      reference: repository.reference,
      newTestMerges: new_test_merges,
    };

    return await globalThis.discord_client.tgs_testMerge(
      tgsAddress,
      tgsLogin,
      tgsPass,
      instanceId,
      interaction,
      repository_data,
    );
  };

  globalThis.discord_client.handling_tgs_actions = {
    stop: globalThis.discord_client.tgs_stop,
    start: globalThis.discord_client.tgs_start,
    deploy: globalThis.discord_client.tgs_deploy,
    softshutdown: globalThis.discord_client.tgs_softShutdown,
    testmerge: globalThis.discord_client.tgs_handleTestMerge,
  };

  globalThis.discord_client.handling_tgs = [
    { label: "Stop", value: "stop" },
    { label: "Start", value: "start" },
    { label: "Deploy", value: "deploy" },
    { label: "Soft Shutdown", value: "softshutdown" },
    { label: "Test Merges", value: "testmerge" },
  ];
}
