import { WASocket } from "baileys";
import { Bot } from "../interfaces/bot.interface.js";
import { Message } from "../interfaces/message.interface.js";
import { Group } from "../interfaces/group.interface.js";
import { TwitchController } from "../controllers/twitch.controller.js";
import { buildText, messageErrorCommandUsage } from "../utils/general.util.js";
import * as waUtil from "../utils/whatsapp.util.js";
import twitchCommands from './twitch.list.commands.js'
import { startTwitchMonitor, stopTwitchMonitor } from "../helpers/twitch.monitor.helper.js";

export async function twitchCommand(client: WASocket, botInfo: Bot, message: Message, group: Group){
    const twitchController = new TwitchController()
    const config = twitchController.getConfig()

    const replyText = buildText(twitchCommands.twitch.msgs.reply,
        config.enabled ? "✅" : "❌",
        config.streamer_name || "Não configurado",
        config.target_group ? "Configurado" : "Não configurado",
        config.check_interval,
        config.is_live ? "🔴 AO VIVO" : "⚫ OFFLINE"
    )

    await waUtil.replyText(client, message.chat_id, replyText, message.wa_message, {expiration: message.expiration})
}

export async function twitchsetCommand(client: WASocket, botInfo: Bot, message: Message, group: Group) {
    if (!message.args.length) {
        throw new Error(messageErrorCommandUsage(botInfo.prefix, message))
    }

    const twitchController = new TwitchController()
    const [streamerName, clientId, clientSecret] = message.args

    if (!streamerName || !clientId || !clientSecret) {
        throw new Error(twitchCommands.twitchset.msgs.error_params)
    }

    twitchController.setStreamer(streamerName)
    twitchController.setCredentials(clientId, clientSecret)

    const replyText = buildText(twitchCommands.twitchset.msgs.reply, streamerName)
    await waUtil.replyText(client, message.chat_id, replyText, message.wa_message, { expiration: message.expiration })
}

export async function twitchgrupoCommand(client: WASocket, botInfo: Bot, message: Message, group: Group){
    if (!message.isGroupMsg || !group){
        throw new Error(twitchCommands.twitchgrupo.msgs.error_not_group)
    }

    const twitchController = new TwitchController()
    twitchController.setTargetGroup(group.id)

    const replyText = buildText(twitchCommands.twitchgrupo.msgs.reply, group.name)
    await waUtil.replyText(client, message.chat_id, replyText, message.wa_message, {expiration: message.expiration})
}

export async function twitchonCommand(client: WASocket, botInfo: Bot, message: Message, group: Group) {
    const twitchController = new TwitchController()
    twitchController.setEnabled(true)

    startTwitchMonitor(client, botInfo)

    await waUtil.replyText(client, message.chat_id, twitchCommands.twitchon.msgs.reply, message.wa_message, {expiration: message.expiration})
}

export async function twitchoffCommand(client: WASocket, botInfo: Bot, message: Message, group: Group) {
    const twitchController = new TwitchController()
    twitchController.setEnabled(false)

    stopTwitchMonitor()

    await waUtil.replyText(client, message.chat_id, twitchCommands.twitchoff.msgs.reply, message.wa_message, {expiration: message.expiration})
}