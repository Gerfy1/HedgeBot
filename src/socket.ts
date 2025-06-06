import {makeWASocket, fetchLatestBaileysVersion, WASocket, DisconnectReason} from 'baileys'
import NodeCache from 'node-cache'
import configSocket from './config.js'
import { BotController } from './controllers/bot.controller.js'
import { connectionClose, connectionOpen, connectionPairingCode, connectionQr } from './events/connection.event.js'
import { messageReceived } from './events/message-received.event.js'
import { addedOnGroup } from './events/group-added.event.js'
import { groupParticipantsUpdated } from './events/group-participants-updated.event.js'
import { partialGroupUpdate } from './events/group-partial-update.event.js'
import { syncGroupsOnStart } from './helpers/groups.sync.helper.js'
import { executeEventQueue, queueEvent } from './helpers/events.queue.helper.js'
import botTexts from './helpers/bot.texts.helper.js'
import { askQuestion, colorText } from './utils/general.util.js'
import { useNeDBAuthState } from './helpers/session.auth.helper.js'
import { startTwitchMonitor } from './helpers/twitch.monitor.helper.js'
import { Boom } from '@hapi/boom'

//Cache de tentativa de envios
const retryCache = new NodeCache()
//Cache de eventos na fila até o bot inicializar
const eventsCache = new NodeCache()
//Cache de mensagens para serem reenviadas em caso de falha
const messagesCache = new NodeCache({stdTTL: 5*60, useClones: false})

// ✅ SISTEMA DE RECONEXÃO INTELIGENTE
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_DELAYS = [2000, 5000, 10000, 20000, 60000] // Delays progressivos
let isReconnecting = false

// ✅ DEBOUNCE PARA MENSAGENS
const messageProcessingQueue = new Map()

// ✅ FUNÇÃO DE RECONEXÃO INTELIGENTE
function scheduleReconnect(fastReconnect = false) {
    if (isReconnecting) {
        console.log('⏳ Reconexão já em andamento...')
        return
    }

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log(`❌ Máximo de tentativas de reconexão atingido (${MAX_RECONNECT_ATTEMPTS})`)
        console.log('🔄 Aguardando 5 minutos antes de tentar novamente...')
        
        setTimeout(() => {
            reconnectAttempts = 0
            scheduleReconnect()
        }, 5 * 60 * 1000) // 5 minutos
        return
    }

    isReconnecting = true
    
    // ✅ DELAY BASEADO NO TIPO DE RECONEXÃO
    const delay = fastReconnect ? 1000 : (RECONNECT_DELAYS[reconnectAttempts] || 60000)
    
    console.log(`🔄 Reconectando em ${delay/1000}s (Tentativa ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`)
    
    setTimeout(() => {
        reconnectAttempts++
        isReconnecting = false
        console.log('🔄 Iniciando reconexão...')
        connect()
    }, delay)
}

// ✅ DEBOUNCE PARA PROCESSAMENTO DE MENSAGENS
async function processMessageWithDebounce(client: WASocket, msg: any, botInfo: any, messagesCache: NodeCache) {
    const messageId = msg.key?.id
    if (!messageId) return

    // Evitar processar mensagem duplicada
    if (messageProcessingQueue.has(messageId)) {
        return
    }

    messageProcessingQueue.set(messageId, true)

    try {
        // ✅ DELAY PEQUENO PARA EVITAR SPAM
        await new Promise(resolve => setTimeout(resolve, 50))
        
        await messageReceived(client, { messages: [msg], type: 'notify' }, botInfo, messagesCache)
    } catch (error: any) {
        console.error(`Erro ao processar mensagem ${messageId}:`, error?.message || error)
    } finally {
        // ✅ LIMPAR QUEUE APÓS 5 SEGUNDOS
        setTimeout(() => {
            messageProcessingQueue.delete(messageId)
        }, 5000)
    }
}

export default async function connect(){
    try {
        const { state, saveCreds } = await useNeDBAuthState()
        const { version } = await fetchLatestBaileysVersion()
        const client : WASocket = makeWASocket(configSocket(state, retryCache, version, messagesCache))
        let connectionType : string | null = null
        let isBotReady = false
        eventsCache.set("events", [])

        //Eventos
        client.ev.process(async(events)=>{
            const botInfo = new BotController().getBot()

            //Status da conexão
            if (events['connection.update']){
                const connectionState = events['connection.update']
                const { connection, qr, receivedPendingNotifications, lastDisconnect } = connectionState

                if (!receivedPendingNotifications) {
                    if (qr) {
                        if (!connectionType) {
                            console.log(colorText(botTexts.not_connected, '#e0e031'))
                            connectionType = await askQuestion(botTexts.input_connection_method)

                            if (connectionType == '2') {
                                connectionPairingCode(client)
                            } else {
                                connectionQr(qr) 
                            }
                        } else if (connectionType != '2') {
                            connectionQr(qr) 
                        }
                    } else if (connection == 'connecting'){
                        console.log(colorText(botTexts.connecting))
                    } else if (connection === 'close'){
                        // ✅ MELHOR TRATAMENTO DE DESCONEXÃO
                        const shouldReconnect = await connectionClose(connectionState)
                        
                        if (shouldReconnect) {
                            // ✅ CORREÇÃO NO ACESSO AO STATUS CODE
                            let statusCode: number
                            
                            try {
                                statusCode = (lastDisconnect?.error as any)?.output?.statusCode || 
                                           new Boom(lastDisconnect?.error)?.output?.statusCode ||
                                           500 // Fallback
                            } catch {
                                statusCode = 500
                            }
                            
                            // ✅ DIFERENTES ESTRATÉGIAS BASEADAS NO ERRO
                            switch(statusCode) {
                                case DisconnectReason.connectionLost:
                                case DisconnectReason.timedOut:
                                    console.log('📡 Conexão perdida/timeout - reconectando suavemente...')
                                    scheduleReconnect(true) // Reconexão rápida
                                    break
                                    
                                case DisconnectReason.badSession:
                                case DisconnectReason.loggedOut:
                                    console.log('❌ Sessão inválida - limpando dados...')
                                    reconnectAttempts = 0 // Resetar contador
                                    scheduleReconnect(false) // Reconexão normal
                                    break
                                    
                                case DisconnectReason.connectionReplaced:
                                    console.log('🔄 Conexão substituída - não reconectando')
                                    break
                                    
                                default:
                                    console.log(`❓ Desconexão: ${statusCode} - tentando reconectar...`)
                                    scheduleReconnect()
                            }
                        }
                    }
                } else {
                    // ✅ CONEXÃO ESTABELECIDA COM SUCESSO
                    console.log('✅ Conexão estabelecida! Inicializando bot...')
                    reconnectAttempts = 0 // ✅ RESETAR CONTADOR DE TENTATIVAS
                    isReconnecting = false
                    
                    await connectionOpen(client)
                    await syncGroupsOnStart(client)
                    
                    // ✅ INICIAR MONITOR TWITCH APÓS CONEXÃO ESTÁVEL
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

            // ✅ REMOVER TRATAMENTO DE ERROR INVÁLIDO
            // (O tratamento de erros já funciona através do connection.close)

            // Credenciais
            if (events['creds.update']){
                await saveCreds()
            }

            // ✅ RECEBER MENSAGEM COM DEBOUNCE
            if (events['messages.upsert']){
                const messageEvent = events['messages.upsert']

                if (isBotReady && messageEvent.messages) {
                    for (const msg of messageEvent.messages) {
                        await processMessageWithDebounce(client, msg, botInfo, messagesCache)
                    }
                }
            }

            // Atualização de participantes no grupo
            if (events['group-participants.update']){
                const participantsUpdate = events['group-participants.update']

                if (isBotReady) {
                    try {
                        await groupParticipantsUpdated(client, participantsUpdate, botInfo)
                    } catch (error: any) {
                        console.error('Erro ao processar atualização de participantes:', error?.message || error)
                    }
                } else {
                    queueEvent(eventsCache, "group-participants.update", participantsUpdate)    
                }
            }
            
            // Novo grupo
            if (events['groups.upsert']){
                const groups = events['groups.upsert']

                if (isBotReady) {
                    try {
                        await addedOnGroup(client, groups, botInfo)
                    } catch (error: any) {
                        console.error('Erro ao processar novo grupo:', error?.message || error)
                    }
                } else {
                    queueEvent(eventsCache, "groups.upsert", groups)     
                }
            }

            // Atualização parcial de dados do grupo
            if (events['groups.update']){
                const groups = events['groups.update']

                if (groups.length == 1 && groups[0].participants == undefined){
                    if (isBotReady) {
                        try {
                            await partialGroupUpdate(groups[0])
                        } catch (error: any) {
                            console.error('Erro ao processar atualização de grupo:', error?.message || error)
                        }
                    } else {
                        queueEvent(eventsCache, "groups.update", groups)
                    }
                }
            }
        })

    } catch (error: any) {
        console.error('❌ Erro crítico na conexão:', error?.message || error)
        scheduleReconnect()
    }
}

// ✅ MONITOR DE RECURSOS (OPCIONAL)
setInterval(() => {
    const memUsage = process.memoryUsage()
    const memUsedMB = Math.round(memUsage.rss / 1024 / 1024)
    
    if (memUsedMB > 300) {
        console.log(`⚠️ Uso de memória: ${memUsedMB}MB`)
        
        // Forçar limpeza se muito alto
        if (memUsedMB > 500 && global.gc) {
            console.log('🧹 Executando garbage collection...')
            global.gc()
        }
    }
    
    // Limpar caches antigos
    if (messageProcessingQueue.size > 100) {
        console.log('🧹 Limpando queue de mensagens...')
        messageProcessingQueue.clear()
    }
}, 60000) // A cada minuto