import "./utils/exit-properly.js";
import mkdirp from "mkdirp";
import fs from "fs/promises";
import path from "path";
import { readContacts } from "./utils/read-contacts.js";
import { chooseDataFolder } from "./utils/choose-data-folder.js";
import _ from "lodash";

(async () => {
  console.log("Choose folder with partial list");
  const dataFolder1 = await chooseDataFolder();

  console.log("Choose folder with full list");
  const dataFolder2 = await chooseDataFolder();

  const timestamp = Date.now();

  const dirName = `./data/${timestamp}`;

  console.log(
    `Creating directory ${dirName}, which will contain list of contacts not in ${dataFolder1} but in ${dataFolder2}`
  );

  await mkdirp(dirName);

  console.log(`Calculating contact diff`);

  const partialContacts = await readContacts(dataFolder1);
  const fullContacts = await readContacts(dataFolder2);

  const diffContacts = _.differenceBy(fullContacts, partialContacts, "ID");

  console.log(`Partial list: ${partialContacts.length}`);
  console.log(`Full list: ${fullContacts.length}`);
  console.log(`Diff list: ${diffContacts.length}`);

  const filepath = path.resolve(dirName, "contacts.json");
  console.log(`Writing ${filepath}`);
  await fs.writeFile(filepath, JSON.stringify(diffContacts, null, 2), "utf-8");
  process.exit(0);
})();
