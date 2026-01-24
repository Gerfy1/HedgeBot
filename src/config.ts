import { pino } from 'pino'
import { AuthenticationState, WAVersion, UserFacingSocketConfig } from 'baileys'
import NodeCache from 'node-cache'
import { getMessageFromCache } from './utils/whatsapp.util.js'

/**
 * ⚠️ NOTA: Este arquivo é mantido para compatibilidade mas não é mais utilizado.
 * A configuração principal está em socket.ts com suporte completo ao Baileys v7.
 * 
 * Principais mudanças no Baileys v7:
 * - LID system (Local Identifiers) para privacidade
 * - cachedGroupMetadata obrigatório para evitar rate limit
 * - Não enviar ACKs (causa banimento)
 * - ESM obrigatório
 * - Protobufs: usar .create() ao invés de .fromObject()
 */
export default function configSocket (state : AuthenticationState, retryCache : NodeCache, version: WAVersion, messageCache: NodeCache){
    const config : UserFacingSocketConfig =  {
        auth: state,
        version,
        msgRetryCounterCache : retryCache,
        defaultQueryTimeoutMs: 45000,
        syncFullHistory: false,
        markOnlineOnConnect: false, // ✅ Baileys v7: false para receber notificações no celular
        qrTimeout: undefined,
        logger: pino({level: 'silent'}),
        // ✅ Baileys v7: isPnUser substitui isJidUser (ambos LID e PN são JIDs)
        shouldIgnoreJid: jid => jid?.includes('broadcast') || jid?.endsWith('@newsletter'),
        getMessage: async (key) => {
            const message = (key.id) ? getMessageFromCache(key.id, messageCache) : undefined
            return message
        }
    }

    return config
}