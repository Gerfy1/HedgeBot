import * as twitchFunctions from './twitch.functions.commands.js'

const twitchCommands = {
    twitch: {
        guide: `Ex: *{$p}twitch* - Exibe as configurações atuais do monitor Twitch.\n`,
        msgs: {
            reply: "🎮 **Configurações Twitch**\n\n" +
                   "**Status**: {$1}\n" +
                   "**Streamer**: {$2}\n" +
                   "**Grupo alvo**: {$3}\n" +
                   "**Intervalo**: {$4} minutos\n" +
                   "**Status atual**: {$5}\n"
        },
        function: twitchFunctions.twitchCommand
    },
    twitchset: {
        guide: `Ex: *{$p}twitchset* nome_streamer client_id client_secret - Configura as credenciais da Twitch.\n\n` +
               `**Como obter as credenciais**:\n` +
               `1. Acesse: https://dev.twitch.tv/console/apps\n` +
               `2. Crie um novo app\n` +
               `3. Copie o Client ID e Client Secret\n`,
        msgs: {
            reply: "✅ Twitch configurado para o streamer **{$1}**",
            error_params: "❌ Parâmetros insuficientes. Use: nome_streamer client_id client_secret"
        },
        function: twitchFunctions.twitchsetCommand
    },
    twitchgrupo: {
        guide: `Ex: *{$p}twitchgrupo* - Define o grupo atual como alvo das notificações.\n`,
        msgs: {
            reply: "✅ Grupo **{$1}** definido como alvo das notificações Twitch",
            error_not_group: "❌ Este comando só pode ser usado em grupos"
        },
        function: twitchFunctions.twitchgrupoCommand
    },
    twitchon: {
        guide: `Ex: *{$p}twitchon* - Ativa o monitor Twitch.\n`,
        msgs: {
            reply: "🎮 ✅ Monitor Twitch **ATIVADO**"
        },
        function: twitchFunctions.twitchonCommand
    },
    twitchoff: {
        guide: `Ex: *{$p}twitchoff* - Desativa o monitor Twitch.\n`,
        msgs: {
            reply: "🎮 ❌ Monitor Twitch **DESATIVADO**"
        },
        function: twitchFunctions.twitchoffCommand
    }

}

export default twitchCommands