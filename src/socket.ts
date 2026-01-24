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

// ✅ Cache de metadados de grupos para evitar rate limit (Baileys v7+)
const groupMetadataCache = new NodeCache({ stdTTL: 600, checkperiod: 120 })

function configSocket(state: any, retryCache: any, version: any, messagesCache: any): any {
    return {
        auth: state,
        version,
        
        // ✅ TIMEOUTS ADEQUADOS (valores em ms)
        connectTimeoutMs: 60000,        // 60s para conectar
        defaultQueryTimeoutMs: 60000,   // 60s para queries (NÃO 10 minutos!)
        keepAliveIntervalMs: 30000,     // 30s keepalive
        retryRequestDelayMs: 2500,      // 2.5s entre retries
        
        // ✅ Baileys v7: Cache de metadados de grupos para evitar rate limit
        cachedGroupMetadata: async (jid: string) => groupMetadataCache.get(jid),
        
        // ✅ getMessage OBRIGATÓRIO para reenvio de mensagens
        getMessage: async (key: any) => {
            if (key.id) {
                const msg = messagesCache.get(key.id)
                return msg?.message || undefined
            }
            return undefined
        },
        
        // ✅ REDUZIR CARGA DE REDE
        shouldSyncHistoryMessage: () => false,
        shouldIgnoreJid: (jid: string | undefined) => {
            if (!jid) return false
            return jid.includes('broadcast') || jid.includes('status')
        },
        
        // ✅ LOGGING MÍNIMO
        logger: pino({ level: 'silent' }),
        
        // ✅ Configurações de retry
        msgRetryCounterCache: retryCache,
        
        // ✅ Configurações estáveis
        markOnlineOnConnect: false,     // Não marcar online (recebe notificações no celular)
        syncFullHistory: false,         // Não sincronizar histórico completo
        generateHighQualityLinkPreview: false,
        qrTimeout: 60000,
        
        // ✅ Baileys v7: printQRInTerminal removido (usar evento qr)
    } as any
}


//Cache de tentativa de envios  
const retryCache = new NodeCache({ stdTTL: 300, checkperiod: 60 })
//Cache de eventos na fila até o bot inicializar
const eventsCache = new NodeCache({ stdTTL: 600, checkperiod: 120 })
//Cache de mensagens para serem reenviadas em caso de falha
const messagesCache = new NodeCache({ stdTTL: 300, useClones: false, checkperiod: 60 })

// ✅ Baileys v7: Exporta função para atualizar cache de grupos
export function updateGroupMetadataCache(jid: string, metadata: any) {
    groupMetadataCache.set(jid, metadata)
}

export function getGroupMetadataFromCache(jid: string) {
    return groupMetadataCache.get(jid)
}

// ✅ SISTEMA DE RECONEXÃO INFINITA
let reconnectAttempts = 0
// Delays progressivos: 3s, 5s, 10s, 15s, 30s, 1min, 2min, 5min (depois fica em 5min)
const RECONNECT_DELAYS = [3000, 5000, 10000, 15000, 30000, 60000, 120000, 300000]
let isReconnecting = false
let lastDisconnectTime = 0

// ✅ CONTROLE DE RATE LIMITING
const messageQueue = new Map()
const MESSAGE_DELAY = 500
const MAX_MESSAGES_PER_MINUTE = 100
const messageTimestamps: number[] = []

// ✅ DEBOUNCE PARA MENSAGENS
const messageProcessingQueue = new Map()

// ✅ GARBAGE COLLECTION (sem limpar caches críticos)
function forceGarbageCollection() {
    if (global.gc) {
        global.gc()
        console.log('🧹 Garbage collection executado')
    }
    
    // ⚠️ NÃO limpar retryCache - necessário para reconexões!
    
    if (messageQueue.size > 50) {
        messageQueue.clear()
    }
    
    const now = Date.now()
    while (messageTimestamps.length > 0 && now - messageTimestamps[0] > 120000) {
        messageTimestamps.shift()
    }
}

// ✅ FUNÇÃO DE RECONEXÃO INFINITA
async function scheduleReconnect(fastReconnect = false) {
    const now = Date.now()
    
    // Evitar reconexões muito rápidas
    if (now - lastDisconnectTime < 5000) {
        console.log('⏳ Aguardando 5s antes de reconectar...')
        setTimeout(() => scheduleReconnect(fastReconnect), 5000)
        return
    }
    
    lastDisconnectTime = now
    
    if (isReconnecting) {
        console.log('⏳ Reconexão já em andamento...')
        return
    }
    
    isReconnecting = true
    
    // Pega o delay baseado na tentativa, máximo é o último valor do array (5 min)
    const delay = RECONNECT_DELAYS[Math.min(reconnectAttempts, RECONNECT_DELAYS.length - 1)]
    
    console.log(`🔄 Reconectando em ${delay/1000}s (tentativa ${reconnectAttempts + 1})`)
    
    // GC a cada 10 tentativas para liberar memória
    if (reconnectAttempts % 10 === 0) {
        forceGarbageCollection()
    }
    
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
        let isInitializing = false  // ✅ Flag para evitar inicialização duplicada
        eventsCache.set("events", [])

        client.ev.process(async(events)=>{
            const botInfo = new BotController().getBot()

            if (events['connection.update']) {
                const connectionState = events['connection.update']
                const { connection, qr, receivedPendingNotifications } = connectionState

                // ✅ Tratar QR e estados de conexão
                if (qr) {
                    console.log(colorText(botTexts.not_connected, '#e0e031'))
                    connectionQr(qr)
                } 
                else if (connection === 'connecting') {
                    console.log(colorText(botTexts.connecting))
                } 
                else if (connection === 'close') {
                    // ✅ Reset flags ao desconectar
                    isBotReady = false
                    isInitializing = false
                    const shouldReconnect = await connectionClose(connectionState)
                    if (shouldReconnect) {
                        scheduleReconnect()
                    }
                }
                // ✅ Conexão aberta com sucesso - APENAS se não estiver já inicializando
                else if ((connection === 'open' || receivedPendingNotifications) && !isInitializing && !isBotReady) {
                    isInitializing = true  // ✅ Marcar que está inicializando
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
                    isInitializing = false  // ✅ Finalizado
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
                
                // ✅ Baileys v7: Armazenar mapeamentos LID/PN automaticamente
                try {
                    const store = client.signalRepository?.lidMapping
                    if (store && typeof store.storeLIDPNMappings === 'function') {
                        const mappings = Object.entries(lidMapping).map(([pn, lid]) => ({ pn, lid: lid as string }))
                        if (mappings.length > 0) {
                            await store.storeLIDPNMappings(mappings)
                            console.log('✅ Mapeamentos LID/PN armazenados')
                        }
                    }
                } catch (error: any) {
                    console.log('⚠️ Erro ao armazenar mapeamento LID/PN:', error?.message || error)
                }
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
