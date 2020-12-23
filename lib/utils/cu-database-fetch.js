import fetch from "node-fetch";
import dotEnv from "dotenv";
import btoa from "btoa";

dotEnv.config();

export function cuDatabaseFetch(url, init = {}) {
  if (!process.env.CU_DATABASE_AUTH_TOKEN) {
    throw Error(`CU_DATABASE_AUTH_TOKEN env variable is required`);
  }

  const finalUrl = getBaseUrl() + url;

  init.headers = init.headers || {};
  init.headers.Authorization = `Basic ${btoa(
    process.env.CU_DATABASE_AUTH_TOKEN
  )}`;
  if (typeof init.body === "object") {
    init.body = JSON.stringify(init.body, null, 2);
    init.headers["content-type"] = "application/json";
  }

  return fetch(finalUrl, init).then((r) => {
    if (r.ok) {
      return r.json();
    } else {
      return r.text().then(
        (text) => {
          console.log(text);
          throw Error(
            `cu database responded with http ${r.status} ${r.statusText}`
          );
        },
        () => {
          throw Error(
            `cu database responded with http ${r.status} ${r.statusText}`
          );
        }
      );
    }
  });
}

export function getBaseUrl() {
  return process.env.CU_DATABASE_URL || "http://localhost:8080";
}
