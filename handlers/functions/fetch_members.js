export default async function FetchMembers() {
  globalThis.fetchMembers = async (guild, callback) => {
    let after = null;
    let accumulative_result = [];

    while (true) {
      const members = await guild.members.list({
        limit: 1000,
        after,
      });
      if (members.size === 0) break;
      accumulative_result.push(await callback(members));
      after = members.last().id;
    }

    return accumulative_result;
  };
}
