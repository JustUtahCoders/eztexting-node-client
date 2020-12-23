import "./utils/exit-properly.js";
import mkdirp from "mkdirp";
import fs from "fs/promises";
import path from "path";
import { eztextFetch } from "./utils/eztext-fetch.js";

const timestamp = Date.now();

const dirName = `./data/${timestamp}`;

console.log(`Creating directory ${dirName}`);

mkdirp(dirName).then(async () => {
  let morePages = true;
  let pageNum = 1;
  const allContacts = [];

  while (morePages) {
    const newContacts = await fetchContactsPage(pageNum++);
    allContacts.push(...newContacts);
    if (newContacts.length === 0) {
      morePages = false;
      console.log(`No more pages`);
    }
  }

  const filepath = path.resolve(dirName, "contacts.json");
  console.log(`Writing ${filepath}`);
  await fs.writeFile(filepath, JSON.stringify(allContacts, null, 2), "utf-8");
});

async function fetchContactsPage(pageNum) {
  console.log(`Fetching Page ${pageNum}`);
  const response = await eztextFetch(
    `https://app.eztexting.com/contacts?format=json&itemsPerPage=200&sortBy=CreatedAt&sortDir=desc&page=${pageNum}`
  );
  if (response.status === 200) {
    let text = await response.text();
    try {
      const json = JSON.parse(text);
      return json.Response.Entries;
    } catch (err) {
      console.log(`Server did not respond with json`);
      return [];
    }
  } else if (response.status === 401) {
    throw Error(`Invalid username or password`);
  } else {
    console.log(`Server responded with status ${response.status}`);
    return [];
  }
}
