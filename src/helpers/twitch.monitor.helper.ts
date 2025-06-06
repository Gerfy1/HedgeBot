import { WASocket } from "baileys";
import { TwitchController } from "../controllers/twitch.controller.js";
import { GroupController } from "../controllers/group.controller.js";
import { Bot } from "../interfaces/bot.interface.js";
import * as twitchUtil from "../utils/twitch.util.js";
import * as waUtil from "../utils/whatsapp.util.js";
import { buildText } from "../utils/general.util";

let monitorInterval: NodeJS.Timeout | null = null;

const RATE_LIMIT_DELAY = 2000; 
const MAX_RETRIES = 3;
const RETRY_DELAYS = [5000, 10000, 20000]; 

export function startTwitchMonitor(client: WASocket, botInfo: Bot) {
    const twitchController = new TwitchController();
    const config = twitchController.getConfig();

    if (!config.enabled || !config.streamer_name || !config.client_id || !config.client_secret){
        console.log('⚠️ Monitor Twitch não iniciado - configuração incompleta')
        return
    }

    if (monitorInterval) {
        clearInterval(monitorInterval);
    }

    console.log(`🎮 Monitor Twitch iniciado para ${config.streamer_name}`)

    console.log('🔍 Verificando status atual da stream...')
    checkStreamStatus(client, botInfo, true) 

    monitorInterval = setInterval(async () =>{
        await checkStreamStatus(client, botInfo, false) 
    }, config.check_interval * 60 * 1000)
}

export function stopTwitchMonitor() {
    if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = null;
        console.log('🛑 Monitor Twitch parado')
    }
}

async function checkStreamStatus(client: WASocket, botInfo: Bot, isInitialCheck: boolean = false){
    try{
        const twitchController = new TwitchController();
        const groupController = new GroupController();
        const config = twitchController.getConfig();

        if (!config.target_group) return

        if (!config.access_token){
            const accessToken = await twitchUtil.getTwitchAccessToken(config.client_id, config.client_secret)
            twitchController.setAccessToken(accessToken)
            config.access_token = accessToken
        } 

        const streamData = await twitchUtil.getStreamData(config.streamer_name, config.client_id, config.access_token)
        const isCurrentlyLive = streamData !== null
        const wasLive = config.is_live

        if (isInitialCheck) {
            console.log(`🔍 Status inicial: ${isCurrentlyLive ? '🔴 ONLINE' : '⚫ OFFLINE'}`)
            if (isCurrentlyLive && streamData) {
                console.log(`📺 Jogo: ${streamData.game_name || 'N/A'}`)
                console.log(`📝 Título: ${streamData.tittle}`) 
            }
        }
        if (isCurrentlyLive !== wasLive || (isInitialCheck && isCurrentlyLive)) {
            twitchController.setLiveStatus(isCurrentlyLive)

            if (isCurrentlyLive && streamData) {
                if (isInitialCheck) {
                    console.log(`🔴 ${streamData.user_name} já está AO VIVO! Aplicando configurações...`)
                } else {
                    console.log(`🔴 ${streamData.user_name} entrou AO VIVO! Processando...`)
                }
                await handleStreamOnline(client, botInfo, streamData, config.target_group, isInitialCheck)
            } else if (!isCurrentlyLive && !isInitialCheck) {
                await handleStreamOffline(client, botInfo, config.target_group)
            }
        } else if (isInitialCheck) {
            console.log(`⚫ ${config.streamer_name} está offline - aguardando...`)
        }
    } catch (error){
        console.error('Erro no monitor Twitch:', error)
    }
}        

async function executeWithRetry<T>(
    operation: () => Promise<T>, 
    operationName: string, 
    maxRetries: number = MAX_RETRIES
): Promise<T | null> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                const delay = RETRY_DELAYS[attempt - 1] || 20000
                console.log(`🔄 Tentativa ${attempt + 1}/${maxRetries + 1} para ${operationName} em ${delay/1000}s...`)
                await new Promise(resolve => setTimeout(resolve, delay))
            }

            const result = await operation()
            if (attempt > 0) {
                console.log(`✅ ${operationName} realizada com sucesso na tentativa ${attempt + 1}`)
            }
            return result

        } catch (error: any) {
            if (attempt === maxRetries) {
                console.error(`❌ Falha definitiva em ${operationName} após ${maxRetries + 1} tentativas:`, error?.message || error)
                return null
            }

            if (error?.message?.includes('rate-overlimit') || error?.data === 429) {
                console.log(`⚠️ Rate limit detectado em ${operationName}, tentando novamente...`)
            } else {
                console.error(`⚠️ Erro em ${operationName} (tentativa ${attempt + 1}):`, error?.message || error)
            }
        }
    }
    return null
}

async function handleStreamOnline(client: WASocket, botInfo: Bot, streamData: any, groupId: string, isInitialCheck: boolean = false){
    try {
        const groupController = new GroupController();
        const group = await groupController.getGroup(groupId)
        
        if (!group) return

        const actionText = isInitialCheck ? "Aplicando configurações de live..." : "Processando nova live..."
        console.log(`🔴 ${streamData.user_name} - ${actionText}`)

        const notificationText = isInitialCheck ? 
            `🔴 𝐋𝐈𝐕𝐄 𝐄𝐌 𝐀𝐍𝐃𝐀𝐌𝐄𝐍𝐓𝐎!\n\n` +
            `🎮 ${streamData.user_name} está AO VIVO!\n\n` +
            `🎯 𝐉𝐨𝐠𝐨: ${streamData.game_name || 'Categoria não definida'}\n` +
            `📺 𝐓í𝐭𝐮𝐥𝐨: ${streamData.title}\n\n` +
            `⏳ _Configurando chat para live..._\n\n` +
            `🦔 _Monitor Twitch ativado pelo HedgeBot_`
            :
            `🔴 𝐋𝐈𝐕𝐄 𝐈𝐍𝐈𝐂𝐈𝐀𝐃𝐀!\n\n` +
            `🎮 ${streamData.user_name} está AO VIVO!\n\n` +
            `🎯 𝐉𝐨𝐠𝐨: ${streamData.game_name || 'Categoria não definida'}\n` +
            `📺 𝐓í𝐭𝐮𝐥𝐨: ${streamData.title}\n\n` +
            `⏳ _Configurando chat para live..._\n\n` +
            `🦔 _Notificação automática do HedgeBot_`

        const mainMessageSent = await executeWithRetry(async () => {
            return await waUtil.sendText(client, groupId, notificationText, {expiration: group.expiration})
        }, "envio da mensagem principal")

        if (!mainMessageSent) {
            console.log(`🔴 ⚠️ Falha ao enviar mensagem principal - abortando configurações`)
            return
        }

        const twitchUrl = `https://twitch.tv/${streamData.user_login}`
        const linkMessage = `🎬 𝖠𝖲𝖲𝖨𝖲𝖳𝖠 𝖠𝖦𝖮𝖱𝖠: ${twitchUrl}`

        const linkSent = await executeWithRetry(async () => {
            return await waUtil.sendLinkWithRetryPreview(client, groupId, linkMessage, {expiration: group.expiration})
        }, "envio do link com preview")

        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY))

        const newTitle = group.name.startsWith('[ON]') ? group.name : `[ON] ${group.name}`
        
        if (!group.name.startsWith('[ON]')) {
            await executeWithRetry(async () => {
                await client.groupUpdateSubject(groupId, newTitle)
                await groupController.setNameGroup(groupId, newTitle)
            }, "atualização do título do grupo")

            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY))
        } else {
            console.log(`📝 Título já está com [ON], pulando atualização`)
        }
        if (!group.restricted) {
            await executeWithRetry(async () => {
                await client.groupSettingUpdate(groupId, 'announcement')
                await groupController.setRestrictedGroup(groupId, true)
            }, "restrição do grupo")

            console.log(`🔒 Chat restrito! Apenas admins podem falar durante a live`)
        } else {
            console.log(`🔒 Grupo já está restrito, pulando restrição`)
        }

        const confirmationText = `🔒 𝐂𝐇𝐀𝐓 𝐑𝐄𝐒𝐓𝐑𝐈𝐓𝐎 𝐃𝐔𝐑𝐀𝐍𝐓𝐄 𝐀 𝐋𝐈𝐕𝐄\n\n` +
            `⚡ Apenas admins podem falar agora\n` +
            `🎬 Aproveitem a live!\n\n` +
            `🦔 _HedgeBot Monitor ativado_`

        await executeWithRetry(async () => {
            return await waUtil.sendText(client, groupId, confirmationText, {expiration: group.expiration})
        }, "envio da confirmação de restrição")

        const successText = isInitialCheck ? "configurações aplicadas" : "processada"
        console.log(`🔴 ✅ Live de ${streamData.user_name} ${successText} com sucesso!`)

    } catch (error) {
        console.error('Erro ao processar stream online:', error)
    }       
}


async function handleStreamOffline(client: WASocket, botInfo: Bot, groupId: string) {
   try {
        const groupController = new GroupController()
        const twitchController = new TwitchController()
        const group = await groupController.getGroup(groupId)
        const config = twitchController.getConfig()
        
        if (!group) return

        console.log(`⚫ Stream finalizada. Processando...`)

        const newTitle = group.name.replace(/^\[ON\]\s*/, '')
        
        await executeWithRetry(async () => {
            await client.groupUpdateSubject(groupId, newTitle)
            await groupController.setNameGroup(groupId, newTitle)
        }, "remoção da tag do título")

        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY))

        await executeWithRetry(async () => {
            await client.groupSettingUpdate(groupId, 'not_announcement')
            await groupController.setRestrictedGroup(groupId, false)
        }, "liberação do grupo")

        console.log(`💬 Chat liberado! Todos podem falar novamente`)

        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY))

        const notification = `⚫ 𝐋𝐈𝐕𝐄 𝐅𝐈𝐍𝐀𝐋𝐈𝐙𝐀𝐃𝐀\n\n` +
            `📺 A live foi encerrada!\n` +
            `❤️ Obrigado por assistir!\n\n` +
            `💬 𝐂𝐇𝐀𝐓 𝐋𝐈𝐁𝐄𝐑𝐀𝐃𝐎 𝐏𝐀𝐑𝐀 𝐓𝐎𝐃𝐎𝐒\n` +
            `🎉 Podem conversar à vontade agora!\n\n` +
            `🦔 _Notificação automática do HedgeBot_`

        const mainMessageSent = await executeWithRetry(async () => {
            return await waUtil.sendText(client, groupId, notification, { expiration: group.expiration })
        }, "envio da notificação principal")

        const recordingUrl = `https://twitch.tv/${config.streamer_name}/videos`
        const recordingMessage = `🎞️ 𝕬𝖘𝖘𝖎𝖘𝖙𝖆 𝖆 𝖌𝖗𝖆𝖛𝖆çã𝖔: ${recordingUrl}`

        const recordingLinkSent = await executeWithRetry(async () => {
            return await waUtil.sendLinkWithRetryPreview(client, groupId, recordingMessage, { expiration: group.expiration })
        }, "envio do link de gravação com preview")

        if (mainMessageSent && recordingLinkSent) {
            console.log(`⚫ ✅ Fim da live processado com sucesso!`)
        } else {
            console.log(`⚫ ⚠️ Fim da live processado parcialmente`)
        }

    } catch (error) {
        console.error('Erro ao processar stream offline:', error)
    }

}