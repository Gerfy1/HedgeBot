import { WASocket } from 'baileys'

/**
 * Helper utilities para trabalhar com LIDs (Local Identifiers) no Baileys v7+
 * 
 * O WhatsApp agora usa LIDs para proteger privacidade em grupos.
 * Estes helpers facilitam a conversão entre LID e PN (Phone Number).
 */

/**
 * Tenta encontrar correspondência de ID no banco de dados considerando LID e PN
 * @param client - Cliente WASocket
 * @param senderId - ID do sender (pode ser LID ou PN)
 * @param participantsIds - Array de IDs dos participantes no banco
 * @returns ID correspondente encontrado no banco ou o senderId original
 */
export async function matchParticipantId(
    client: WASocket, 
    senderId: string, 
    participantsIds: string[]
): Promise<string> {
    // Se o ID já existe no banco, retorne-o
    if (participantsIds.includes(senderId)) {
        return senderId
    }

    try {
        // Tenta obter PN se o sender for LID
        const pn = await getPNFromLID(client, senderId)
        if (pn && participantsIds.includes(pn)) {
            console.log(`✅ LID→PN: ${senderId} → ${pn}`)
            return pn
        }

        // Tenta obter LID se o sender for PN
        const lid = await getLIDFromPN(client, senderId)
        if (lid && participantsIds.includes(lid)) {
            console.log(`✅ PN→LID: ${senderId} → ${lid}`)
            return lid
        }
    } catch (error) {
        console.log(`⚠️ Erro ao converter ID: ${error}`)
    }

    // Se não encontrou correspondência, retorna o ID original
    return senderId
}

/**
 * Converte Phone Number para LID
 * @param client - Cliente WASocket
 * @param phoneNumber - Número no formato PN (user@s.whatsapp.net)
 * @returns LID correspondente ou null se não encontrado
 */
export async function getLIDFromPN(client: WASocket, phoneNumber: string): Promise<string | null> {
    try {
        const store = client.signalRepository?.lidMapping
        if (!store) {
            console.warn('⚠️ LID mapping store não disponível')
            return null
        }
        
        const lid = await store.getLIDForPN(phoneNumber)
        return lid || null
    } catch (error: any) {
        console.error('Erro ao obter LID do PN:', error?.message || error)
        return null
    }
}

/**
 * Converte LID para Phone Number
 * @param client - Cliente WASocket
 * @param lid - LID a ser convertido
 * @returns Phone Number correspondente ou null se não encontrado
 */
export async function getPNFromLID(client: WASocket, lid: string): Promise<string | null> {
    try {
        const store = client.signalRepository?.lidMapping
        if (!store) {
            console.warn('⚠️ LID mapping store não disponível')
            return null
        }
        
        const pn = await store.getPNForLID(lid)
        return pn || null
    } catch (error: any) {
        console.error('Erro ao obter PN do LID:', error?.message || error)
        return null
    }
}

/**
 * Verifica se um JID é um Phone Number ou LID
 * @param jid - JID a ser verificado
 * @returns true se for PN, false se for LID
 */
export function isPhoneNumber(jid: string): boolean {
    // PNs geralmente começam com números
    // LIDs têm formato diferente
    if (!jid) return false
    
    const userPart = jid.split('@')[0]
    // Se começar com dígitos, provavelmente é PN
    return /^\d+/.test(userPart)
}

/**
 * Obtém o identificador preferencial (tenta LID primeiro, se não houver retorna o original)
 * @param client - Cliente WASocket
 * @param jid - JID (pode ser LID ou PN)
 * @returns Identificador preferencial
 */
export async function getPreferredId(client: WASocket, jid: string): Promise<string> {
    if (!jid) return jid
    
    try {
        // Se já for LID, retorna
        if (!isPhoneNumber(jid)) {
            return jid
        }
        
        // Tenta obter LID
        const lid = await getLIDFromPN(client, jid)
        return lid || jid
    } catch {
        return jid
    }
}

/**
 * Obtém Phone Number sempre que possível (útil para compatibilidade)
 * @param client - Cliente WASocket
 * @param jid - JID (pode ser LID ou PN)
 * @returns Phone Number se possível, senão retorna o JID original
 */
export async function ensurePhoneNumber(client: WASocket, jid: string): Promise<string> {
    if (!jid) return jid
    
    try {
        // Se já for PN, retorna
        if (isPhoneNumber(jid)) {
            return jid
        }
        
        // Tenta obter PN
        const pn = await getPNFromLID(client, jid)
        return pn || jid
    } catch {
        return jid
    }
}

/**
 * Obtém o melhor identificador para exibição
 * @param client - Cliente WASocket
 * @param jid - JID (pode ser LID ou PN)
 * @returns String formatada para exibição
 */
export async function getDisplayId(client: WASocket, jid: string): Promise<string> {
    if (!jid) return 'Desconhecido'
    
    try {
        const pn = await ensurePhoneNumber(client, jid)
        const number = pn.split('@')[0]
        
        // Formata número de telefone
        if (/^\d+$/.test(number)) {
            return `+${number}`
        }
        
        return jid
    } catch {
        return jid
    }
}

/**
 * Armazena um mapeamento LID/PN manualmente (útil após onWhatsApp)
 * @param client - Cliente WASocket
 * @param lid - LID
 * @param phoneNumber - Phone Number (PN)
 * @example
 * await storeLIDMapping(client, 'lid123', '5511999999999@s.whatsapp.net')
 */
export async function storeLIDMapping(client: WASocket, lid: string, phoneNumber: string): Promise<void> {
    try {
        const store = client.signalRepository?.lidMapping
        if (!store) {
            console.warn('⚠️ LID mapping store não disponível')
            return
        }
        
        // ✅ Baileys v7+: usar storeLIDPNMappings (plural) com array
        // LIDMapping = { pn: string, lid: string }
        await store.storeLIDPNMappings([{ pn: phoneNumber, lid }])
        console.log(`✅ Mapeamento LID/PN armazenado: ${lid} <-> ${phoneNumber}`)
    } catch (error: any) {
        console.error('Erro ao armazenar mapeamento LID/PN:', error?.message || error)
    }
}

/**
 * Verifica se um participante de grupo tem PN disponível
 * @param participant - Participante do grupo (formato Baileys v7)
 * @returns Phone Number se disponível, senão retorna o ID
 */
export function getParticipantIdentifier(participant: any): string {
    // No Baileys v7, participantes têm: id (preferencial), phoneNumber ou lid
    if (participant.phoneNumber) {
        return participant.phoneNumber
    }
    
    if (participant.lid) {
        return participant.lid
    }
    
    return participant.id || participant.jid || 'unknown'
}

/**
 * Extrai informações de um participante de grupo (Baileys v7+)
 * @param participant - Participante do grupo
 * @returns Objeto com id, phoneNumber (se disponível), e lid (se disponível)
 */
export function parseParticipant(participant: any): { id: string, phoneNumber?: string, lid?: string } {
    return {
        id: participant.id || participant.jid,
        phoneNumber: participant.phoneNumber,
        lid: participant.lid
    }
}

/**
 * Obtém o owner de um grupo no formato correto
 * @param groupMetadata - Metadados do grupo (Baileys v7+)
 * @returns ID do owner (LID preferencial, PN como fallback)
 */
export function getGroupOwner(groupMetadata: any): string {
    // No Baileys v7: owner (LID) e ownerPn (Phone Number)
    return groupMetadata.owner || groupMetadata.ownerPn || ''
}

/**
 * Obtém o criador da descrição do grupo
 * @param groupMetadata - Metadados do grupo (Baileys v7+)
 * @returns ID do criador da descrição
 */
export function getGroupDescriptionOwner(groupMetadata: any): string {
    // No Baileys v7: descOwner (LID) e descOwnerPn (Phone Number)
    return groupMetadata.descOwner || groupMetadata.descOwnerPn || ''
}

/**
 * Normaliza uma lista de JIDs mistos (LIDs e PNs) para o formato preferencial
 * @param client - Cliente WASocket
 * @param jids - Array de JIDs
 * @param preferPN - Se true, prefere PN; se false, prefere LID
 * @returns Array normalizado
 */
export async function normalizeJids(
    client: WASocket, 
    jids: string[], 
    preferPN: boolean = false
): Promise<string[]> {
    const normalized: string[] = []
    
    for (const jid of jids) {
        if (preferPN) {
            normalized.push(await ensurePhoneNumber(client, jid))
        } else {
            normalized.push(await getPreferredId(client, jid))
        }
    }
    
    return normalized
}
