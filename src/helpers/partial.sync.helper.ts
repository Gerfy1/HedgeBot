import { WASocket } from 'baileys'
import { GroupController } from '../controllers/group.controller.js'
import { showConsoleError, colorText } from '../utils/general.util.js'
import botTexts from './bot.texts.helper.js'

/**
 * Realiza uma sincronização parcial e otimizada de grupos
 * quando o bot está em muitos grupos (> 60)
 * 
 * @param client Cliente WASocket
 * @param fetchedGroups Grupos já obtidos com client.groupFetchAllParticipating()
 */
export async function partialSyncGroups(client: WASocket, fetchedGroups: any) {
    try {
        const groupController = new GroupController()
        const allGroups = Object.values(fetchedGroups) as any[]
        
        console.log(`🔄 Iniciando sincronização parcial de ${allGroups.length} grupos...`)
        
        // Processa grupos em pequenos lotes para evitar timeout
        const batchSize = 10
        for (let i = 0; i < allGroups.length; i += batchSize) {
            const batch = allGroups.slice(i, i + batchSize)
            await Promise.all(batch.map(async (group: any) => {
                // Registra ou atualiza o grupo no banco de dados
                await groupController.registerGroup(group)
            }))
            
            // Pequena pausa entre lotes para não sobrecarregar
            if (i + batchSize < allGroups.length) {
                await new Promise(resolve => setTimeout(resolve, 500))
            }
        }
        
        console.log(colorText(botTexts.groups_loaded))
        return true
    } catch (err: any) {
        showConsoleError(err, "PARTIAL-GROUP-SYNC")
        return false
    }
}