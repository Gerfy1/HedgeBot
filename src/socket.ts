import {makeWASocket, fetchLatestBaileysVersion, WASocket, DisconnectReason} from 'baileys'
import NodeCache from 'node-cache'
import { BotController } from './controllers/bot.controller.js'
import { connectionClose, connectionOpen, connectionPairingCode, connectionQr } from './events/connection.event.js'
import { messageReceived } from './events/message-received.event.js'
import { addedOnGroup } from './events/group-added.event.js'
import { groupParticipantsUpdated } from './events/group-participants-updated.event.js'
import { partialGroupUpdate } from './events/group-partial-update.event.js'
import { syncGroupsOnStart } from './helpers/groups.sync.helper.js'
import { partialSyncGroups } from './helpers/partial.sync.helper.js'
import { executeEventQueue, queueEvent } from './helpers/events.queue.helper.js'
import botTexts from './helpers/bot.texts.helper.js'
import { askQuestion, colorText } from './utils/general.util.js'
import { useNeDBAuthState } from './helpers/session.auth.helper.js'
import { startTwitchMonitor } from './helpers/twitch.monitor.helper.js'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import fs from 'fs'

function configSocket(state: any, retryCache: any, version: any, messagesCache: any): any {
    const browserInfo: [string, string, string] = ['HedgeBot-Server', 'Chrome', '120.0.0.0']
    
    return {
        auth: state,
        version: [2, 3000, 1029393272],
        
        // ✅ CONFIGURAÇÕES DE CONECTIVIDADE PARA ORACLE CLOUD
        connectTimeoutMs: 120000,
        defaultQueryTimeoutMs: 600002,
        keepAliveIntervalMs: 45000,
        retryRequestDelayMs: 3000,
        maxMsgRetryCount: 2,
        
        // ✅ REDUZIR CARGA DE REDE
        shouldSyncHistoryMessage: () => false,
        shouldIgnoreJid: (jid: string | undefined) => {
            if (!jid) return false;
            return jid.includes('broadcast') || jid.includes('status');
        },
        
        // ✅ CONFIGURAÇÕES DE BROWSER CORRIGIDAS
        browser: browserInfo,
        
        // ✅ LOGGING MÍNIMO
        logger: pino({ 
            level: 'error',
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: false,
                    translateTime: true,
                    ignore: 'pid,hostname'
                }
            }
        }),
        msgRetryCounterCache: retryCache,
        msgRetryCounterMap: messagesCache,
        markOnlineOnConnect: false,
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        linkPreviewImageThumbnailWidth: 128,
        firewall: false,
        emitOwnEvents: false,
        qrTimeout: 60000,
        reportConnectionTimeouts: false,
        
        options: {
            chats: {
                limit: 100
            }
        }
    } as any
}

//Cache de tentativa de envios  
const retryCache = new NodeCache({ stdTTL: 300, checkperiod: 60 })
//Cache de eventos na fila até o bot inicializar
const eventsCache = new NodeCache({ stdTTL: 600, checkperiod: 120 })
//Cache de mensagens para serem reenviadas em caso de falha
const messagesCache = new NodeCache({ stdTTL: 300, useClones: false, checkperiod: 60 })

// ✅ SISTEMA DE RECONEXÃO INTELIGENTE PARA ORACLE CLOUD
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 3
const RECONNECT_DELAYS = [5000, 15000, 60000]
let isReconnecting = false
let lastDisconnectTime = 0

// ✅ CONTROLE DE RATE LIMITING
const messageQueue = new Map()
const MESSAGE_DELAY = 500
const MAX_MESSAGES_PER_MINUTE = 100
const messageTimestamps: number[] = []

// ✅ DEBOUNCE PARA MENSAGENS
const messageProcessingQueue = new Map()

// ✅ GARBAGE COLLECTION AGRESSIVO
function forceGarbageCollection() {
    if (global.gc) {
        global.gc()
        console.log('🧹 Garbage collection executado')
    }
    
    retryCache.flushAll()
    if (messageQueue.size > 20) {
        messageQueue.clear()
    }
    
    const now = Date.now()
    while (messageTimestamps.length > 0 && now - messageTimestamps[0] > 120000) {
        messageTimestamps.shift()
    }
}

// ✅ FUNÇÃO DE RECONEXÃO OTIMIZADA - CORRIGIDA PARA ES6
async function scheduleReconnect(fastReconnect = false) {
    const now = Date.now()
    
    if (now - lastDisconnectTime < 10000) {
        console.log('⏳ Aguardando 10s antes de reconectar...')
        setTimeout(() => scheduleReconnect(fastReconnect), 10000)
        return
    }
    
    lastDisconnectTime = now
    
    if (isReconnecting) {
        console.log('⏳ Reconexão já em andamento...')
        return
    }

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log(`❌ Máximo de tentativas atingido. Limpando sessão e reiniciando...`)
        
        // ✅ USAR fs IMPORTADO AO INVÉS DE require
        try {
            if (fs.existsSync('./storage/session.db')) {
                fs.unlinkSync('./storage/session.db')
            }
            if (fs.existsSync('./baileys_auth_info')) {
                fs.rmSync('./baileys_auth_info', { recursive: true, force: true })
            }
            console.log('🗑️ Sessão limpa automaticamente')
        } catch (error: any) {
            console.log('⚠️ Erro ao limpar sessão:', error?.message || error)
        }
        
        reconnectAttempts = 0
        setTimeout(() => {
            console.log('🔄 Reiniciando processo...')
            process.exit(1)
        }, 5000)
        return
    }
    
    isReconnecting = true
    
    const delay = RECONNECT_DELAYS[reconnectAttempts] || 60000
    
    console.log(`🔄 Reconectando em ${delay/1000}s (${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`)
    
    forceGarbageCollection()
    
    setTimeout(() => {
        reconnectAttempts++
        isReconnecting = false
        console.log('🔄 Iniciando reconexão...')
        connect()
    }, delay)
}

export default async function connect(){
    try {
        const { state, saveCreds } = await useNeDBAuthState()
        const { version } = await fetchLatestBaileysVersion()
        const client : WASocket = makeWASocket(configSocket(state, retryCache, version, messagesCache))
        let isBotReady = false
        eventsCache.set("events", [])

        client.ev.process(async(events)=>{
            const botInfo = new BotController().getBot()

            if (events['connection.update']) {
    const connectionState = events['connection.update']
    const { connection, qr, receivedPendingNotifications } = connectionState

    if (!receivedPendingNotifications) {
        if (qr) {
            console.log(colorText(botTexts.not_connected, '#e0e031'))
            connectionQr(qr)
        } 
        else if (connection === 'connecting') {
            console.log(colorText(botTexts.connecting))
        } 
        else if (connection === 'close') {
            const shouldReconnect = await connectionClose(connectionState)
            if (shouldReconnect) {
                scheduleReconnect()
            }
        }
    } 
    else {
        console.log('✅ Conexão estabelecida! Inicializando bot...')
        reconnectAttempts = 0
        isReconnecting = false

        await connectionOpen(client)
                    
                    try {
                        const groups = await client.groupFetchAllParticipating()
                        const groupCount = Object.keys(groups).length
                        
                        if (groupCount > 40) {
                            console.log(`⚠️ Muitos grupos (${groupCount}), usando sincronização parcial`)
                            await partialSyncGroups(client, groups)
                        } else {
                            console.log(`🔄 Sincronizando ${groupCount} grupos...`)
                            await syncGroupsOnStart(client)
                        }
                    } catch (error: any) {
                        console.log('⚠️ Erro na sincronização, continuando...', error?.message || error)
                    }
                    
                    try {
                        startTwitchMonitor(client, botInfo)
                    } catch (error: any) {
                        console.log('⚠️ Erro ao iniciar monitor Twitch:', error?.message || error)
                    }
                    
                    isBotReady = true
                    await executeEventQueue(client, eventsCache)
                    console.log(colorText(botTexts.server_started))
                }
            }

            if (events['creds.update']){
                await saveCreds()
            }

            if (events['lid-mapping.update']){
                const lidMapping = events['lid-mapping.update']
                console.log('🆔 Novo mapeamento LID/PN recebido:', Object.keys(lidMapping).length, 'entradas')
            }

            if (events['messages.upsert'] && isBotReady){
                const messageEvent = events['messages.upsert']

                if (messageEvent.messages && messageEvent.messages.length > 0) {
                    const msg = messageEvent.messages[0]
                    
                    const now = Date.now()
                    while (messageTimestamps.length > 0 && now - messageTimestamps[0] > 60000) {
                        messageTimestamps.shift()
                    }
                    
                    if (messageTimestamps.length >= MAX_MESSAGES_PER_MINUTE) {
                        console.log(`⚠️ Rate limit ativado - aguardando...`)
                        await new Promise(resolve => setTimeout(resolve, 2000))
                    }
                    
                    messageTimestamps.push(now)
                    
                    try {
                        await new Promise(resolve => setTimeout(resolve, MESSAGE_DELAY))
                        await messageReceived(client, { messages: [msg], type: 'notify' }, botInfo, messagesCache)
                    } catch (error: any) {
                        if (error?.message?.includes('rate-overlimit')) {
                            console.log('⚠️ Rate limit do WhatsApp, aguardando...')
                            await new Promise(resolve => setTimeout(resolve, 10000))
                        } else {
                            console.error('❌ Erro ao processar mensagem:', error?.message || error)
                        }
                    }
                }
            }

            if (events['group-participants.update'] && isBotReady){
                try {
                    await groupParticipantsUpdated(client, events['group-participants.update'], botInfo)
                } catch (error: any) {
                    console.error('Erro participantes:', error?.message)
                }
            }
            
            if (events['groups.upsert'] && isBotReady){
                try {
                    await addedOnGroup(client, events['groups.upsert'], botInfo)
                } catch (error: any) {
                    console.error('Erro novo grupo:', error?.message)
                }
            }

            if (events['groups.update'] && isBotReady){
                const groups = events['groups.update']
                if (groups.length == 1 && groups[0].participants == undefined){
                    try {
                        await partialGroupUpdate(groups[0])
                    } catch (error: any) {
                        console.error('Erro atualizar grupo:', error?.message)
                    }
                }
            }
        })
    } catch (error: any) {
        console.error('❌ Erro crítico na conexão:', error?.message || error)
        scheduleReconnect()
    }
}

setInterval(() => {
    const memUsage = process.memoryUsage()
    const memUsedMB = Math.round(memUsage.rss / 1024 / 1024)
    
    if (memUsedMB > 300) {
        console.log(`⚠️ Uso de memória: ${memUsedMB}MB`)
        
        if (memUsedMB > 500 && global.gc) {
            console.log('🧹 Executando garbage collection...')
            global.gc()
        }
    }
    
    if (messageProcessingQueue.size > 100) {
        console.log('🧹 Limpando queue de mensagens...')
        messageProcessingQueue.clear()
    }
}, 60000)
