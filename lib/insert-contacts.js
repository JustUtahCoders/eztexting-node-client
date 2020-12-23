import { chooseDataFolder } from "./utils/choose-data-folder.js";
import "./utils/exit-properly.js";
import { readContacts } from "./utils/read-contacts.js";
import _ from "lodash";
import { cuDatabaseFetch, getBaseUrl } from "./utils/cu-database-fetch.js";
import { readStdin } from "./utils/read-stdin.js";
import fs from "fs/promises";
import dayjs from "dayjs";

(async () => {
  const dataFolder = await chooseDataFolder();
  const contacts = await readContacts(dataFolder);
  let index = 0,
    maxToProcess = Infinity,
    numProcessed = 0;

  for (let contact of contacts) {
    console.log("\n\n\n");
    console.log("|--------------------------------");
    console.log(`| ${++index} / ${contacts.length}`);
    console.log("|--------------------------------");

    if (contact.processed) {
      console.log(`--> Already processed`);
      continue;
    }

    console.log(contact);

    contact.processed = true;
    const { clientDuplicates, leadDuplicates } = await searchForDuplicates(
      contact
    );

    if (clientDuplicates.length === 0 && leadDuplicates.length === 0) {
      console.log(`--> No Duplicates detected`);
      const leadId = await insertLead(contact);
      contact.cuDatabaseLeadId = leadId;
      contact.leadInserted = true;
    } else {
      console.log(`--> Duplicates Detected`);
      clientDuplicates.forEach((client) =>
        console.log(
          `----> c${client.id}: ${client.firstName} ${
            client.lastName
          } - ${getBaseUrl()}/clients/${client.id}`
        )
      );
      leadDuplicates.forEach((lead) =>
        console.log(
          `----> l${lead.id}: ${lead.firstName} ${
            lead.lastName
          } - ${getBaseUrl()}/leads/${lead.id}`
        )
      );
      console.log(
        `Reuse client/lead? For client with id 1, enter c1. For lead, enter l1. To create a new lead, leave blank`
      );
      const choice = await readStdin();
      if (_.isEmpty(choice.trim())) {
        const leadId = await insertLead(contact);
        contact.cuDatabaseLeadId = leadId;
        contact.leadInserted = true;
      } else if (choice.startsWith("l")) {
        const leadId = Number(choice.slice(1));
        if (isNaN(leadId)) {
          throw Error(`Invalid lead id ${choice.slice(1)}`);
        }
        contact.cuDatabaseLeadId = leadId;
        await updateLead(contact, leadId);
      } else if (choice.startsWith("c")) {
        const clientId = Number(choice.slice(1));
        if (isNaN(clientId)) {
          throw Error(`Invalid lead id ${choice.slice(1)}`);
        }
        contact.cuDatabaseClientId = clientId;
        await updateClient(contact, clientId);
      } else {
        throw Error(`Invalid input`);
      }
    }

    await writeContactsToDisk(dataFolder, contacts);

    if (++numProcessed >= maxToProcess) {
      console.log(`Processed max of ${maxToProcess} contacts`);
      process.exit(0);
    }
  }

  console.log("Done with all contacts");
  process.exit(0);
})();

async function writeContactsToDisk(dataFolder, contacts) {
  await fs.writeFile(
    `./data/${dataFolder}/contacts.json`,
    JSON.stringify(contacts, null, 2),
    "utf-8"
  );
}

async function updateLead(contact, leadId) {
  console.log(`--> Updating lead ${leadId}`);
  contact.cuDatabaseLeadId = leadId;
  if (contact.OptOut) {
    console.log(`----> Opting out of texts`);
    await cuDatabaseFetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      body: {
        smsConsent: false,
      },
    });
    console.log(`----> Done updating`);
  } else {
    console.log(`----> Nothing to update`);
  }
}

async function updateClient(contact, clientId) {
  console.log(`--> Updating client ${clientId}`);
  contact.cuDatabaseClientId = clientId;
  if (contact.OptOut) {
    console.log(`----> Opting out of texts`);
    await cuDatabaseFetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      body: {
        smsConsent: false,
      },
    });
    console.log(`----> Done updating`);
  } else {
    console.log(`----> Nothing to update`);
  }
}

async function insertLead(contact) {
  console.log(`--> Inserting lead`);
  const leadToCreate = {
    dateOfSignUp: dayjs(contact.CreatedAt, "MM-DD-YYYY").format("YYYY-MM-DD"),
    firstName: contact.FirstName || "Unknown",
    lastName: contact.LastName || "Unknown",
    phone: contact.PhoneNumber,
    smsConsent: Boolean(contact.OptOut),
    eventSources: [],
    leadServices: [],
  };

  const result = await cuDatabaseFetch(`/api/leads`, {
    method: "POST",
    body: [leadToCreate],
  });
  const leadId = result.leadIds[0];

  console.log(`--> Lead inserted. ID: ${leadId}`);
  return leadId;
}

async function searchForDuplicates(contact) {
  const [
    clientNameDuplicates,
    clientPhoneDuplicates,
    leadNameDuplicates,
    leadPhoneDuplicates,
  ] = await Promise.all([
    contact.FirstName || contact.LastName
      ? cuDatabaseFetch(
          `/api/clients?name=${encodeURIComponent(
            _.get(contact, "FirstName", "") +
              " " +
              _.get(contact, "LastName", "")
          )}`
        ).then((r) => r.clients)
      : [],
    contact.PhoneNumber
      ? cuDatabaseFetch(`/api/clients?phone=${contact.PhoneNumber}`).then(
          (r) => r.clients
        )
      : [],
    contact.FirstName || contact.LastName
      ? cuDatabaseFetch(
          `/api/leads?name=${encodeURIComponent(
            _.get(contact, "FirstName", "") +
              " " +
              _.get(contact, "LastName", "")
          )}`
        ).then((r) => r.leads)
      : [],
    contact.PhoneNumber
      ? cuDatabaseFetch(`/api/leads?phone=${contact.PhoneNumber}`).then(
          (r) => r.leads
        )
      : [],
  ]);

  return {
    clientDuplicates: _.uniqBy(
      clientNameDuplicates.concat(clientPhoneDuplicates),
      "id"
    ),
    leadDuplicates: _.uniqBy(
      leadNameDuplicates.concat(leadPhoneDuplicates),
      "id"
    ),
  };
}
