const sqlite3 = require('sqlite3')
const open = require('sqlite').open
const fs = require('fs')
const process = require('process')

const filename = 'contacts.sqlite3'
const numContacts = parseInt(process.argv[2], 10);

const shouldMigrate = !fs.existsSync(filename)

/**
 * Generate `numContacts` contacts,
 * one at a time
 *
 */
function * generateContacts () {
 // TODO

// let's create a loop
  for (let i = 0; i <= numContacts; i++) {
    yield [`name-${i}`, `email-${i}@domain.tld`]
  }
}

// Creation de la table
const migrate = async (db) => {
  console.log('Migrating db ...')
  await db.exec(`
        CREATE TABLE contacts(
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL
         )
     `)
  console.log('Done migrating db')
}

const insertContacts = async (db) => {
    console.log('Inserting contacts ...')

    let query = 'INSERT INTO contacts (name, email) VALUES '
    let count = 0

    for (const contacts of generateContacts()) {
        const name = contacts[0].replace(/'/g, "''")
        const email = contacts[1].replace(/'/g, "''")

        query = query + `('${name}', '${email}'), `
        count += 1

        if (count === 800) {
            await db.run(query.slice(0, -2))
            query = 'INSERT INTO contacts (name, email) VALUES '
            count = 0
        }

        console.log(`Correctly inserted contact ${name}`)
    }
    
    if (count > 0) {
        await db.run(query.slice(0, -2))
    }
}


// query
const queryContact = async (db) => {
  const start = Date.now();
  const res = await db.get("SELECT name FROM contacts WHERE email = ?", [
    `email-${numContacts}@domain.tld`,
  ]);
  if (!res || !res.name) {
    console.error("Contact not found");
    process.exit(1);
  }
  const end = Date.now();
  const elapsed = end - start;
  console.log(`Query took ${elapsed} milliseconds`);
  
  // Log the results to a document
  const logEntry = `${numContacts} contacts, ${elapsed} milliseconds\n`;
    fs.appendFileSync("query_InsertTime.txt", logEntry);
    
  // Making a graph from the table
  const graphEntry = `size : ${numContacts}, mill :${elapsed}\n`;
  fs.appendFileSync("graph_InsertTime.csv", graphEntry);

}

(async () => {
  const db = await open({
    filename,
    driver: sqlite3.Database
  })
  if (shouldMigrate) {
    await migrate(db)
  }
  await insertContacts(db)
  await queryContact(db)
  await db.close()
})()