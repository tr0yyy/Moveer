const moveerMessage = require('../moveerMessage.js')
const helper = require('../helpers/helper.js')
const check = require('../helpers/check.js')

async function move(args, message, rabbitMqChannel) {
  try {
    const messageMentions = [...message.mentions.users.values()] // Mentions in the message
    let numberOfMoves = args[0]

    if (args.join().includes('"')) {
      const names = helper.getNameWithSpacesName(args, message.author.id)
      numberOfMoves = names[0]
    }
    await check.ifTextChannelIsMoveerAdmin(message)
    check.ifMessageContainsMentions(message)
    let position = numberOfMoves
    for (const user of messageMentions) {
      position += 1
      if (position > messageMentions.length) position = 1
      const toVoiceChannel = await helper.getChannelByName(message, position)
      check.ifVoiceChannelExist(message, toVoiceChannel, toVoiceChannel)
      const myUser = await helper.findUserByUserName(message, user)
      check.ifChannelIsTextChannel(message, toVoiceChannel)
      const userIdToMove = await myUser.map(({ id }) => id)
      await check.forMovePerms(message, userIdToMove, toVoiceChannel)
      await check.forConnectPerms(message, userIdToMove, toVoiceChannel)

      // No errors in the message, lets get moving!
      if (userIdToMove.length > 0) helper.moveUsers(message, userIdToMove, toVoiceChannel.id, rabbitMqChannel)
    }
    check.checkifPatreonGuildRepeat(message)
  } catch (err) {
    if (!err.logMessage) {
      console.log(err)
      moveerMessage.reportMoveerError('Above alert was caused by:\n' + err.stack)
    }
    moveerMessage.logger(message, err.logMessage)
    moveerMessage.sendMessage(message, err.sendMessage)
  }
}

module.exports = {
  move,
}
