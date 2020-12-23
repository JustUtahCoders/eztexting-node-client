import fs from "fs/promises";

export async function readContacts(dataFolder) {
  const text = await fs.readFile(`./data/${dataFolder}/contacts.json`, "utf-8");
  return JSON.parse(text);
}
