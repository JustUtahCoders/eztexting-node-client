import { chooseDataFolder } from "./utils/choose-data-folder.js";
import "./utils/exit-properly.js";
import { readContacts } from "./utils/read-contacts.js";
import _ from "lodash";
import fs from "fs/promises";

(async () => {
  const dataFolder = await chooseDataFolder();
  const contacts = await readContacts(dataFolder);
  for (let contact of contacts) {
    delete contact.cuDatabaseLeadId;
    delete contact.cuDatabaseClientId;
    delete contact.processed;
    delete contact.leadInserted;
  }

  await fs.writeFile(
    `./data/${dataFolder}/contacts.json`,
    JSON.stringify(contacts, null, 2),
    "utf-8"
  );
  console.log("Reset contacts");
  process.exit(0);
})();
