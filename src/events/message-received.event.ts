import {getContentType, WASocket, WAMessage, MessageUpsertType} from 'baileys'
import { showConsoleError} from '../utils/general.util.js'
import { Bot } from '../interfaces/bot.interface.js'
import NodeCache from 'node-cache'
import { UserController } from '../controllers/user.controller.js'
import { handleGroupMessage, handlePrivateMessage } from '../helpers/message.handler.helper.js'
import { GroupController } from '../controllers/group.controller.js'
import { storeMessageOnCache, formatWAMessage } from '../utils/whatsapp.util.js'
import { commandInvoker } from '../helpers/command.invoker.helper.js'
import { updateGroupMetadataCache } from '../socket.js'

export async function messageReceived (client: WASocket, messages : {messages: WAMessage[], requestId?: string, type: MessageUpsertType}, botInfo : Bot, messageCache: NodeCache){
    try{
        if (messages.messages[0].key.fromMe) {
            storeMessageOnCache(messages.messages[0], messageCache)
        }
    
        switch (messages.type){
            case 'notify':
                const userController = new UserController()
                const groupController = new GroupController()
                const idChat = messages.messages[0].key.remoteJid
                const isGroupMsg = idChat?.includes("@g.us")
                
                // ✅ Se for grupo, garantir que ele esteja registrado
                let group = null
                if (isGroupMsg && idChat) {
                    group = await groupController.getGroup(idChat)
                    
                    // ✅ Se o grupo não existir, registrar automaticamente
                    if (!group) {
                        try {
                            const groupMetadata = await client.groupMetadata(idChat)
                            await groupController.registerGroup(groupMetadata)
                            group = await groupController.getGroup(idChat)
                            // ✅ Baileys v7: Atualizar cache de metadados
                            updateGroupMetadataCache(idChat, groupMetadata)
                            console.log(`✅ Grupo registrado automaticamente: ${groupMetadata.subject}`)
                        } catch (error: any) {
                            console.error(`⚠️ Erro ao registrar grupo ${idChat}:`, error?.message || error)
                        }
                    }
                }
                
                let message = await formatWAMessage(messages.messages[0], group, botInfo.host_number, client)

                if (message) {
                    await userController.registerUser(message.sender, message.pushname)
        
                    if (!isGroupMsg) {
                        const needCallCommand = await handlePrivateMessage(client, botInfo, message)
                        if (needCallCommand) {
                            await commandInvoker(client, botInfo, message, null)
                        }
                    } else if (group) {
                        const needCallCommand = await handleGroupMessage(client, group, botInfo, message)
                        if (needCallCommand) {
                            await commandInvoker(client, botInfo, message, group)
                        }
                    } else {
                        console.log(`⚠️ Mensagem de grupo ${idChat} ignorada - grupo não registrado`)
                    }
                }

                break
        }
    } catch(err: any){
        showConsoleError(err, "MESSAGES.UPSERT")
    }
}