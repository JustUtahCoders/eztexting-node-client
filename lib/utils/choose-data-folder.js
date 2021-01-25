import fs from "fs/promises";
import { readStdin } from "./read-stdin.js";

export async function chooseDataFolder() {
  const files = await fs.readdir("./data");
  if (files.length === 0) {
    throw Error("Contacts must first be fetched");
  }

  console.log("Data folders:");
  files.forEach((file) => console.log("--> ", file));

  console.log(`Choose folder. Default is latest (${files[files.length - 1]}):`);
  let folder = (await readStdin()).trim();

  if (folder.trim().length === 0) {
    folder = files[files.length - 1];
  }

  try {
    await fs.stat(`./data/${folder}`);
  } catch (err) {
    console.error(err);
    throw Error(`Invalid data folder ./data/${folder}`);
  }

  return folder;
}
