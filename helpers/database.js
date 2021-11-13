const moveerMessage = require('../moveerMessage.js')
const config = require('../config.js')
const log = require('./logger.js')

async function connectToDb(message) {
  try {
    const { Client } = require('pg')
    const client = new Client({
      connectionString: config.postgreSQLConnection,
    })
    await client.connect()
    log.debug('BAZA DE DATE')
    return client
  } catch (err) {
    if (!err.logMessage) console.log(err)
    moveerMessage.reportMoveerError('dberror: ' + err.stack)
    if (message === 'welcome') return
    moveerMessage.logger(message, 'Error')
    moveerMessage.sendMessage(
      message,
      'Moveer cannot communicate with its database. Since this is a admin command please create a text channel named moveeradmin and use that until my developer fixes this! He has been alerted but please poke him inside the support server! https://discord.gg/dTdH3gD'
    )
  }
}

const getPatreonGuildObject = async (message, guildId) => {
  const dbConnection = await connectToDb(message)
  const searchForPatreonGuild = await dbConnection.query('SELECT * FROM "patreons" WHERE "guildId" = \'' + guildId + "'")
  await dbConnection.end()
  return searchForPatreonGuild
}

const addSuccessfulMove = async (message, usersMoved) => {
  const dbConnection = await connectToDb(message)
  await dbConnection.query('UPDATE moves SET successCount = successCount + ' + usersMoved + ' WHERE id = 1')
  await dbConnection.end()
}

const updateMoveerAdminChannel = async (message, guildId, channelId) => {
  const dbConnection = await connectToDb(message)
  await dbConnection.query(
    'UPDATE "guilds" SET "adminChannelId" = \'' + channelId + '\' WHERE "guildId" = \'' + guildId + "'"
  )
  await dbConnection.end()
}

const insertGuildMoveerAdminChannel = async (message, guildId, channelId) => {
  const dbConnection = await connectToDb(message)
  const query = {
    text: 'INSERT INTO "guilds" ("guildId", "adminChannelId") VALUES($1, $2)',
    values: [guildId, channelId],
  }
  await dbConnection.query(query)
  await dbConnection.end()
}

const insertGuildAfterWelcome = async (guildId) => {
  const dbConnection = await connectToDb('welcome')
  const query = {
    text: 'INSERT INTO "guilds" ("guildId", "adminChannelId") VALUES($1, $2)',
    values: [guildId, '106679489135706112'],
  }
  await dbConnection.query(query)
  await dbConnection.end()
}

const getGuildObject = async (message, guildId) => {
  const dbConnection = await connectToDb(message)
  const searchForGuild = await dbConnection.query('SELECT * FROM "guilds" WHERE "guildId" = \'' + guildId + "'")
  await dbConnection.end()
  if (searchForGuild.rowCount === 0) {
    await insertGuildAfterWelcome(guildId) // Guild not in DB for some reason, add it.
    return true
  }
  return searchForGuild
}

const updateSentRateLimitMessage = async (message, guildId) => {
  const checkIfGuildInDb = await getGuildObject(message, guildId)
  if (checkIfGuildInDb.rowCount === 0) await insertGuildAfterWelcome(guildId)
  const dbConnection = await connectToDb(message)
  await dbConnection.query('UPDATE "guilds" SET "sentRLMessage" = \'' + 1 + '\' WHERE "guildId" = \'' + guildId + "'")
  await dbConnection.end()
}

module.exports = {
  getGuildObject,
  addSuccessfulMove,
  updateMoveerAdminChannel,
  insertGuildMoveerAdminChannel,
  insertGuildAfterWelcome,
  updateSentRateLimitMessage,
  getPatreonGuildObject,
}
