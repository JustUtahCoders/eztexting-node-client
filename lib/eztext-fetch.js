import fetch from "node-fetch";

export function authenticatedFetch(url, init) {
  if (!process.env.EZTEXTING_USERNAME) {
    throw Error(`env var EZTEXTING_USERNAME is missing`);
  }

  if (!process.env.EZTEXTING_PASSWORD) {
    throw Error(`env var EZTEXTING_PASSWORD is missing`);
  }

  if (init && typeof init.body === "object") {
    init.body = JSON.stringify(init.body, null, 2);
  }

  const prefix = url.includes("?") ? `&` : `?`;
  const finalUrl = `${url}${prefix}User=${process.env.EZTEXTING_USERNAME}&Password=${process.env.EZTEXTING_PASSWORD}`;

  return fetch(finalUrl, init);
}
