import { Bot } from "../interfaces/bot.interface.js"
/*
║ ➤ ${prefix}mascote - WhatsApp Jr
║ ➤ ${prefix}frase - Frases aleatórias

║ ➤ ${prefix}mascote - WhatsApp Jr
║ ➤ ${prefix}frase - Frases aleatórias
║ ➤ ${prefix}detector - Detector mentira
║ ➤ ${prefix}casal - Formar casal
║ ➤ ${prefix}gadometro - Nível de gado
*/

export const mainMenu  = (botInfo : Bot)=> { 
    let {name, prefix} = botInfo
    return `╔═══════════════════════════════
║ 🦔 ${name?.trim()} - Menu Principal
╠═══════════════════════════════
║ 
║ 📋 NAVEGAÇÃO:
║ ➤ ${prefix}menu 0   ❓ Informações
║ ➤ ${prefix}menu 1   🎨 Figurinhas
║ ➤ ${prefix}menu 2   🛠️ Utilidades
║ ➤ ${prefix}menu 3   📥 Downloads
║ ➤ ${prefix}menu 4   🎲 Diversão
║ 
╚═══════════════════════════════
   💻 Hedge by G`
}

export const mainMenuGroup  = (botInfo : Bot)=> { 
    let {name, prefix} = botInfo
    return `╔═══════════════════════════════
║ 🦔 ${name?.trim()} - Menu Principal
╠═══════════════════════════════
║ 
║ 📋 NAVEGAÇÃO:
║ ➤ ${prefix}menu 0   ❓ Informações
║ ➤ ${prefix}menu 1   🎨 Figurinhas
║ ➤ ${prefix}menu 2   🛠️ Utilidades
║ ➤ ${prefix}menu 3   📥 Downloads
║ ➤ ${prefix}menu 4   🎲 Diversão
║ ➤ ${prefix}menu 5   👥 Grupo
║ 
╚═══════════════════════════════
   💻 Hedge by G`
}

export const stickerMenu = (botInfo : Bot)=>{
    let {name, prefix} = botInfo
    return `╔═══════════════════════════════
║ 🎨 ${name?.trim()} - Figurinhas
╠═══════════════════════════════
║ 
║ ℹ️  Ajuda: ${prefix}comando guia
║ 
║ 🖼️ CRIAÇÃO DE STICKERS:
║ ➤ ${prefix}s - Imagem/vídeo → sticker
║ ➤ ${prefix}s 1 - Sticker circular
║ ➤ ${prefix}s 2 - Sticker sem corte
║ ➤ ${prefix}snome pack, autor - Renomear
║ ➤ ${prefix}simg - Sticker → imagem
║ ➤ ${prefix}ssf - Remove fundo automático
║ ➤ ${prefix}emojimix 💩+😀 - Mix de emojis
║ 
╚═══════════════════════════════
   💻 Hedge by G`
}

export const infoMenu = (botInfo : Bot)=>{
    let {name, prefix} = botInfo
    return `╔═══════════════════════════════
║ ❓ ${name?.trim()} - Informações
╠═══════════════════════════════
║ 
║ ℹ️  Ajuda: ${prefix}comando guia
║ 
║ 📊 SUPORTE & INFO:
║ ➤ ${prefix}info - Dados do bot
║ ➤ ${prefix}reportar texto - Reportar bug
║ ➤ ${prefix}meusdados - Seus dados de uso
║ 
╚═══════════════════════════════
   💻 Hedge by G`
}

export const downloadMenu = (botInfo : Bot)=>{
    let {name, prefix} = botInfo
    return `╔═══════════════════════════════
║ 📥 ${name?.trim()} - Downloads
╠═══════════════════════════════
║ 
║ ℹ️  Ajuda: ${prefix}comando guia
║ 
║ 🎵 MÍDIAS SOCIAIS:
║ ➤ ${prefix}play nome - Áudio YouTube
║ ➤ ${prefix}yt nome - Vídeo YouTube
║ ➤ ${prefix}fb link - Vídeo Facebook
║ ➤ ${prefix}ig link - Instagram
║ ➤ ${prefix}x link - Twitter/X
║ ➤ ${prefix}tk link - TikTok
║ ➤ ${prefix}img tema - Imagens Google
║ 
╚═══════════════════════════════
   💻 Hedge by G`
}

export const utilityMenu = (botInfo : Bot)=>{
    let {name, prefix} = botInfo
    return `╔═══════════════════════════════
║ 🛠️ ${name?.trim()} - Utilidades
╠═══════════════════════════════
║ 
║ ℹ️  Ajuda: ${prefix}comando guia
║ 
║ 🔍 CONSULTAS & TEXTO:
║ ➤ ${prefix}steamverde jogo - Jogos piratas
║ ➤ ${prefix}brasileirao - Tabela do BR
║ ➤ ${prefix}animes - Lançamentos anime
║ ➤ ${prefix}mangas - Lançamentos manga
║ ➤ ${prefix}filmes - Filmes em alta
║ ➤ ${prefix}series - Séries em alta
║ ➤ ${prefix}encurtar link - Encurtador
║ ➤ ${prefix}letra musica - Letras
║ ➤ ${prefix}traduz idioma texto - Tradutor
║ ➤ ${prefix}pesquisa texto - Google
║ ➤ ${prefix}clima cidade - Previsão
║ ➤ ${prefix}noticias - Notícias atuais
║ ➤ ${prefix}moeda tipo valor - Conversor
║ ➤ ${prefix}calc expressao - Calculadora
║ ➤ ${prefix}ddd - Info DDD
║ ➤ ${prefix}tabela - Caracteres especiais
║ 
║ 🎧 ÁUDIO:
║ ➤ ${prefix}ouvir - Áudio → texto
║ ➤ ${prefix}audio - Extrair áudio
║ ➤ ${prefix}efeitoaudio tipo - Efeitos
║ ➤ ${prefix}voz pt texto - Texto → áudio
║ 
║ 🖼️ IMAGENS:
║ ➤ ${prefix}upimg - Upload imagem
║ ➤ ${prefix}rbg - Remove fundo
║ 
║ 🎯 RECONHECIMENTO:
║ ➤ ${prefix}qualmusica - ID música
║ ➤ ${prefix}qualanime - ID anime
║ 
╚═══════════════════════════════
   💻 Hedge by G`
}

export const groupMenu = (botInfo : Bot) =>{
    let {name, prefix} = botInfo
    return `╔═══════════════════════════════
║ 👥 ${name?.trim()} - Grupo
╠═══════════════════════════════
║ 
║ ℹ️  Ajuda: ${prefix}comando guia
║ 
║ 📊 INFORMAÇÕES:
║ ➤ ${prefix}grupo - Dados do grupo
║ ➤ ${prefix}adms - Lista de admins
║ ➤ ${prefix}dono - Dono do grupo
║ 
╚═══════════════════════════════
   💻 Hedge by G`
}

export const groupAdminMenu = (botInfo : Bot)=>{
    let {name, prefix} = botInfo
    return `╔═══════════════════════════════
║ 👥 ${name?.trim()} - Admin Grupo
╠═══════════════════════════════
║ 
║ ℹ️  Ajuda: ${prefix}comando guia
║ 
║ 📊 INFORMAÇÕES:
║ ➤ ${prefix}grupo - Dados do grupo
║ ➤ ${prefix}adms - Lista de admins
║ ➤ ${prefix}fotogrupo - Mudar foto
║ ➤ ${prefix}mt texto - Marcar todos
║ ➤ ${prefix}mm texto - Marcar membros
║ ➤ ${prefix}dono - Dono do grupo
║ 
║ 👤 MEMBROS:
║ ➤ ${prefix}membro @user - Dados membro
║ ➤ ${prefix}topativos - Top 10 ativos
║ ➤ ${prefix}inativos num - Membros inativos
║ 
║ ⚡ ADMINISTRATIVO:
║ ➤ ${prefix}add +55983xx... - Adicionar
║ ➤ ${prefix}ban @user - Remover
║ ➤ ${prefix}aviso @user - Dar aviso
║ ➤ ${prefix}rmaviso @user - Tirar aviso
║ ➤ ${prefix}zeraravisos - Zerar avisos
║ ➤ ${prefix}restrito - Fechar grupo
║ ➤ ${prefix}promover @user - Promover
║ ➤ ${prefix}rebaixar @admin - Rebaixar
║ ➤ ${prefix}link - Link do grupo
║ ➤ ${prefix}rlink - Resetar link
║ ➤ ${prefix}apg - Apagar mensagem
║ 
║ 🛡️ RECURSOS DE PROTEÇÃO:
║ 
║ ✅ BEM-VINDO:
║ ➤ ${prefix}bemvindo - On/Off mensagem
║ 
║ 🔇 MUTAR GRUPO:
║ ➤ ${prefix}mutar - Só admins usam bot
║ 
║ 🎨 AUTO-STICKER:
║ ➤ ${prefix}autosticker - Auto criar sticker
║ 
║ 🚫 ANTI-LINK:
║ ➤ ${prefix}antilink - Bloquear links
║ ➤ ${prefix}addexlink - Exceção link
║ ➤ ${prefix}rmexlink - Remover exceção
║ 
║ 🚫 ANTI-FAKE:
║ ➤ ${prefix}antifake - Bloquear fakes
║ ➤ ${prefix}addexfake - Exceção fake
║ ➤ ${prefix}rmexfake - Remover exceção
║ 
║ 🚫 ANTI-FLOOD:
║ ➤ ${prefix}antiflood - Anti spam
║ 
║ 🤖 RESPOSTA AUTO:
║ ➤ ${prefix}autoresp - On/Off auto resposta
║ ➤ ${prefix}respostas - Ver respostas
║ ➤ ${prefix}addresp palavra resposta
║ ➤ ${prefix}rmresp palavra
║ 
║ 🔒 BLOQUEIO CMD:
║ ➤ ${prefix}bcmd !cmd1 !cmd2 - Bloquear
║ ➤ ${prefix}dcmd !cmd1 !cmd2 - Liberar
║ 
║ 📝 LISTA NEGRA:
║ ➤ ${prefix}listanegra - Ver lista
║ ➤ ${prefix}addlista +55983xx... - Adicionar
║ ➤ ${prefix}rmlista +55983xx... - Remover
║ 
║ 🚫 FILTRO PALAVRAS:
║ ➤ ${prefix}addfiltros palavra - Filtrar
║ ➤ ${prefix}rmfiltros palavra - Liberar
║ 
╚═══════════════════════════════
   💻 Hedge by G`
}

export const miscMenu = (botInfo : Bot) =>{
    let {name, prefix} = botInfo
    return `╔═══════════════════════════════
║ 🎲 ${name?.trim()} - Diversão
╠═══════════════════════════════
║ 
║ ℹ️  Ajuda: ${prefix}comando guia
║ 
║ 🎮 JOGOS:
║ ➤ ${prefix}ppt opção - Pedra/Papel/Tesoura
║ ➤ ${prefix}caracoroa - Cara ou Coroa
║ ➤ ${prefix}roletarussa - Roleta Russa
║ 
║ 🎯 SORTEIO:
║ ➤ ${prefix}sorteio num - Sortear número
║ 
║ 🎭 ENTRETENIMENTO:
║ ➤ ${prefix}chance texto - % de chance
║ 
╚═══════════════════════════════
   💻 Hedge by G`
}

export const miscGroupMenu = (botInfo : Bot) =>{
    let {name, prefix} = botInfo
    return `╔═══════════════════════════════
║ 🎲 ${name?.trim()} - Diversão Grupo
╠═══════════════════════════════
║ 
║ ℹ️  Ajuda: ${prefix}comando guia
║ 
║ 🎮 JOGOS:
║ ➤ ${prefix}ppt opção - Pedra/Papel/Tesoura
║ ➤ ${prefix}caracoroa - Cara ou Coroa
║ ➤ ${prefix}roletarussa - Roleta Russa
║ 
║ 🎯 SORTEIO:
║ ➤ ${prefix}sorteio num - Sortear número
║ ➤ ${prefix}sorteiomembro - Sortear membro
║ 
║ 🎭 ENTRETENIMENTO:
║ ➤ ${prefix}chance texto - % de chance
║ ➤ ${prefix}bafometro - Nível álcool
║ ➤ ${prefix}top5 tema - Ranking top 5
║ ➤ ${prefix}par @p1 @p2 - Compatibilidade
║ 
╚═══════════════════════════════
   💻 Hedge by G`
}

export const adminMenu = (botInfo : Bot)=>{
    let {prefix, name} = botInfo
    return `╔═══════════════════════════════
║ ⚙️ ${name?.trim()} - Administração
╠═══════════════════════════════
║ 
║ ℹ️  Ajuda: ${prefix}comando guia
║ 
║ 🛠️ GERAL:
║ ➤ ${prefix}info - Info do bot
║ ➤ ${prefix}ping - Status sistema
║ ➤ ${prefix}bloquear @user - Bloquear
║ ➤ ${prefix}desbloquear @user - Desbloquear
║ ➤ ${prefix}listablock - Lista bloqueados
║ ➤ ${prefix}bcgrupos texto - BC grupos
║ ➤ ${prefix}desligar - Desligar bot
║
║ 🎮 TWITCH MONITOR:
║ ➤ ${prefix}twitch - Status configuração
║ ➤ ${prefix}twitchset nome id secret - Configurar
║ ➤ ${prefix}twitchgrupo - Definir grupo alvo
║ ➤ ${prefix}twitchon - Ativar monitor
║ ➤ ${prefix}twitchoff - Desativar monitor
║ 
║ 🎨 CUSTOMIZAÇÃO:
║ ➤ ${prefix}nomebot nome - Mudar nome
║ ➤ ${prefix}prefixo simbolo - Mudar prefixo
║ ➤ ${prefix}fotobot - Mudar foto
║ ➤ ${prefix}recado texto - Mudar status
║ 
║ 👥 GRUPOS:
║ ➤ ${prefix}grupos - Dados grupos
║ ➤ ${prefix}entrargrupo link - Entrar
║ 
║ 👤 USUÁRIOS:
║ ➤ ${prefix}usuario @user - Dados user
║ 
║ ⭐ ADMINS BOT:
║ ➤ ${prefix}admins - Lista admins
║ ➤ ${prefix}addadmin - Promover admin
║ ➤ ${prefix}rmadmin - Rebaixar admin
║ 
║ 🛡️ RECURSOS GLOBAIS:
║ 
║ 🎨 AUTO-STICKER PV:
║ ➤ ${prefix}autostickerpv - Auto sticker PV
║ 
║ 🔒 BLOQUEIO GLOBAL:
║ ➤ ${prefix}bcmdglobal !cmd - Bloquear cmd
║ ➤ ${prefix}dcmdglobal !cmd - Liberar cmd
║ 
║ ⭐ MODO ADMIN:
║ ➤ ${prefix}modoadmin - Só admins usam
║ 
║ ⏱️ TAXA COMANDOS:
║ ➤ ${prefix}taxacomandos num - Limite/min
║ 
║ 💬 MENSAGENS PV:
║ ➤ ${prefix}comandospv - Permitir PV
║ 
╚═══════════════════════════════
   💻 Hedge by G`
}