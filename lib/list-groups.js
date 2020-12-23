import "./utils/exit-properly.js";
import { chooseDataFolder } from "./utils/choose-data-folder.js";
import { readContacts } from "./utils/read-contacts.js";
import _ from "lodash";

(async () => {
  const dataFolder = await chooseDataFolder();
  const contacts = await readContacts(dataFolder);
  let groups = [];
  for (let contact of contacts) {
    groups.push(...(contact.Groups || []));
  }

  groups = _.uniq(groups);

  console.log("Num contacts:", contacts.length);

  console.log(`All groups in contact list:`);
  console.log(JSON.stringify(groups, null, 2));

  process.exit(0);
})();
