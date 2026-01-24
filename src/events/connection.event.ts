import {DisconnectReason, ConnectionState, WASocket} from 'baileys'
import { Boom } from '@hapi/boom'
import { BotController } from '../controllers/bot.controller.js'
import { buildText, showConsoleError, colorText, askQuestion } from '../utils/general.util.js'
import botTexts from '../helpers/bot.texts.helper.js'
import { UserController } from '../controllers/user.controller.js'
import { getHostNumber } from '../utils/whatsapp.util.js'
import qrcode from 'qrcode-terminal'
import { cleanCreds } from '../helpers/session.auth.helper.js'
import { startTwitchMonitor } from '../helpers/twitch.monitor.helper.js'

export async function connectionQr(qr: string){
    if (qr) {
        await new Promise<void>(resolve => {
            qrcode.generate(qr, {small: true}, (qrcode) => {
                console.log(qrcode)
                resolve()
            })
        })
    }
}

export async function connectionPairingCode(client: WASocket){
    const answerNumber = await askQuestion(botTexts.input_phone_number)
    const code = await client.requestPairingCode(answerNumber.replace(/\W+/g,""))
    console.log(colorText(buildText(botTexts.show_pairing_code, code)))
}

export async function connectionOpen(client: WASocket){
    try{
        const botController = new BotController()
        const botInfo = botController.getBot()
        botController.startBot(getHostNumber(client))
        console.log(colorText("🦔 " + botTexts.bot_data))
        await checkOwnerRegister()
        startTwitchMonitor(client,botInfo)
    } catch(err: any) {
        showConsoleError(err, "CONNECTION")
        client.end(new Error("fatal_error"))
    }
}

export async function connectionClose(connectionState : Partial<ConnectionState>){
    try{
        const { lastDisconnect } = connectionState
        let needReconnect = false
        const errorCode = (new Boom(lastDisconnect?.error)).output.statusCode
        const errorMessage = lastDisconnect?.error?.message || ''

        console.log(`⚠️ Desconectado - Código: ${errorCode}, Motivo: ${errorMessage}`)

        if (errorMessage == "admin_command"){
            showConsoleError(new Error(botTexts.disconnected.command), 'CONNECTION')
            needReconnect = false
        } else if (errorMessage == "fatal_error"){
            showConsoleError(new Error(botTexts.disconnected.fatal_error), 'CONNECTION')
            needReconnect = false
        } else {
            // ✅ Baileys v7: Tratar códigos de desconexão específicos
            switch (errorCode) {
                case DisconnectReason?.loggedOut:
                    // Usuário deslogou - limpar credenciais
                    await cleanCreds()
                    showConsoleError(new Error(botTexts.disconnected.logout), 'CONNECTION')
                    needReconnect = false
                    break
                    
                case 405: // Method Not Allowed - sessão inválida
                    await cleanCreds()
                    needReconnect = true
                    break
                    
                case 515: // Stream Errored - precisa reiniciar (comum no Baileys v7)
                    console.log('🔄 Stream Error - reiniciando conexão...')
                    needReconnect = true
                    break
                    
                case DisconnectReason?.restartRequired:
                    // Restart normal após scan do QR
                    showConsoleError(new Error(botTexts.disconnected.restart), 'CONNECTION')
                    needReconnect = true
                    break
                    
                case DisconnectReason?.connectionClosed:
                case DisconnectReason?.connectionLost:
                case DisconnectReason?.timedOut:
                    // Problemas de rede - reconectar
                    console.log('🔄 Problema de conexão detectado, tentando reconectar...')
                    needReconnect = true
                    break
                    
                case DisconnectReason?.connectionReplaced:
                    // Outra sessão aberta - NÃO reconectar automaticamente
                    console.log('⚠️ Conexão substituída por outra sessão')
                    needReconnect = false
                    break
                    
                case DisconnectReason?.badSession:
                    // Sessão corrompida - limpar e reconectar
                    await cleanCreds()
                    needReconnect = true
                    break
                    
                default:
                    showConsoleError(new Error(buildText(botTexts.disconnected.bad_connection, errorCode.toString(), errorMessage)), 'CONNECTION')
                    needReconnect = true
            }
        }

        return needReconnect
    } catch(err: any){
        console.error('Erro no handler de desconexão:', err?.message || err)
        return true // Em caso de erro, tentar reconectar
    }
}

 async function checkOwnerRegister(){
    const owner = await new UserController().getOwner()

    if (!owner){
        console.log(colorText(botTexts.owner_not_found, "#d63e3e"))
    } else {
        console.log(colorText(botTexts.owner_registered))
    }
}