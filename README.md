# 🦔 HedgeBot - WhatsApp Bot

Bot para WhatsApp com suporte a figurinhas, comandos administrativos, integração com Twitch e muito mais.

## 🚀 Versão Atual

- **Bot:** v1.0
- **Baileys:** v7.1.3+ (Com suporte a LID)
- **Node:** >= 18.x
- **TypeScript:** 5.8.3

## ⚡ Instalação Rápida

```bash
# Clone o repositório
git clone <repo-url>
cd HedgeBot

# Instale as dependências
yarn install

# Configure o ambiente (primeira vez)
yarn migrate

# Execute o bot
yarn dev
```

## 📦 Scripts Disponíveis

```bash
yarn start      # Executa o bot em produção (requer build)
yarn dev        # Executa o bot em desenvolvimento
yarn build      # Compila TypeScript para JavaScript
yarn migrate    # Executa migração de banco de dados
yarn clean      # Limpa a pasta dist/
```

## 🆕 Atualização para Baileys v7 (Sistema LID)

O bot foi atualizado para o **Baileys v7.x.x**, que introduz o sistema **LID (Local Identifier)** para proteger a privacidade dos usuários em grupos.

### O que mudou?

- ✅ **LID Support:** Identificadores anônimos em grupos
- ✅ **Auth State:** Suporte a `lid-mapping` e `device-index`
- ✅ **ACKs Removidos:** Confirmações de leitura desabilitadas para evitar banimentos
- ✅ **Protobufs:** Atualizado para usar `.create()` ao invés de `.fromObject()`

### Migrando de v6 para v7

**Opção 1 - Migração Automática (Recomendado):**
```bash
yarn install  # Atualiza o Baileys
yarn dev      # O Baileys migra a sessão automaticamente
```

**Opção 2 - Limpar Sessão (Se houver problemas):**
```bash
rm -rf baileys_auth_info storage/session.db
yarn dev  # Escanear QR Code novamente
```

📖 **Documentação completa:** [MIGRATION_BAILEYS_V7.md](docs/MIGRATION_BAILEYS_V7.md)

## 🔧 Estrutura do Projeto

```
HedgeBot/
├── src/
│   ├── commands/        # Comandos do bot
│   ├── controllers/     # Controladores (bot, grupo, user, twitch)
│   ├── events/          # Eventos do WhatsApp
│   ├── helpers/         # Funções auxiliares
│   ├── interfaces/      # Interfaces TypeScript
│   ├── services/        # Serviços de banco de dados
│   ├── utils/           # Utilitários diversos
│   │   └── lid.util.ts  # 🆕 Helper para trabalhar com LIDs
│   ├── app.ts           # Entrada principal
│   ├── socket.ts        # Configuração do WebSocket
│   └── config.ts        # Configurações
├── docs/                # Documentação
│   ├── MIGRATION_BAILEYS_V7.md  # 🆕 Guia de migração
│   ├── CHANGELOG.md
│   └── COMANDOS.md
└── storage/             # Banco de dados local
```

## 🤖 Funcionalidades

### Comandos Principais
- **Admin:** Gerenciamento de usuários, grupos e bot
- **Download:** Download de mídias (YouTube, TikTok, Instagram, Facebook)
- **Grupo:** Configurações de grupo, welcome, antilink, antiflood, antifake
- **Info:** Informações sobre usuário, grupo, bot
- **Misc:** Comandos diversos (clima, piada, frase, etc.)
- **Sticker:** Criação e manipulação de figurinhas
- **Twitch:** Notificações de lives da Twitch
- **Utility:** Utilitários (tradutor, calculadora, etc.)

### Proteções de Grupo
- ✅ **AntiLink:** Remove links não autorizados
- ✅ **AntiFlood:** Previne spam de mensagens
- ✅ **AntiFake:** Bloqueia números suspeitos
- ✅ **Blacklist:** Lista negra de usuários
- ✅ **Word Filter:** Filtro de palavras
- ✅ **Auto Reply:** Respostas automáticas

### Integrações
- 🟣 **Twitch:** Monitora lives e envia notificações
- 🤖 **AI:** Integração com Deepgram para transcrição de áudio
- 🎨 **Media:** Processamento de imagens, vídeos e áudios

## 📝 Configuração

### Primeira Execução

1. Execute `yarn migrate` para configurar o banco de dados
2. Execute `yarn dev`
3. Escolha o método de conexão:
   - **Opção 1:** QR Code (padrão)
   - **Opção 2:** Código de emparelhamento

4. Escaneie o QR Code ou digite o código no WhatsApp
5. Aguarde a conexão ser estabelecida

### Configurações do Bot

As configurações são armazenadas no banco de dados local (`storage/session.db`) e podem ser alteradas através de comandos administrativos.

## 🔐 Sistema LID (Baileys v7+)

### O que é LID?

LID (Local Identifier) é o novo sistema do WhatsApp para proteger privacidade:

- **Phone Number (PN):** Formato antigo (`5511999999999@s.whatsapp.net`)
- **LID:** Novo identificador anônimo (não mostra número em grupos)
- Ambos são JIDs válidos e compatíveis

### Trabalhando com LIDs

```typescript
import * as lidUtil from './utils/lid.util.js'

// Converter PN para LID
const lid = await lidUtil.getLIDFromPN(client, phoneNumber)

// Converter LID para PN
const pn = await lidUtil.getPNFromLID(client, lid)

// Obter identificador preferencial
const id = await lidUtil.getPreferredId(client, jid)

// Informações de participante
const info = lidUtil.parseParticipant(participant)
```

📖 Veja mais em: [lid.util.ts](src/utils/lid.util.ts)

## ⚙️ Otimizações para Oracle Cloud

O bot possui otimizações específicas para rodar em servidores Oracle Cloud:

- ✅ Rate limiting agressivo
- ✅ Garbage collection automático
- ✅ Controle de memória
- ✅ Reconexão inteligente
- ✅ Delays entre mensagens

## 🛠️ Desenvolvimento

### Requisitos
- Node.js >= 18.x
- Yarn v4.x (ou Yarn Classic)
- TypeScript 5.x
- FFmpeg (para processamento de mídia)

### Build

```bash
yarn build  # Compila para dist/
```

### Estrutura de Comandos

Cada categoria de comando possui dois arquivos:

- `[categoria].list.commands.ts` - Definição e metadados dos comandos
- `[categoria].functions.commands.ts` - Implementação das funções

## 📊 Banco de Dados

O bot utiliza **NeDB** (banco NoSQL baseado em arquivos) para armazenamento local:

- `storage/session.db` - Sessão e autenticação
- `storage/groups.db` - Dados dos grupos
- `storage/users.db` - Dados dos usuários
- `storage/participants.db` - Dados dos participantes

## 🚨 Solução de Problemas

### Erro de Conexão
```bash
# Limpar sessão e reconectar
rm -rf baileys_auth_info storage/session.db
yarn dev
```

### Módulo não encontrado
```bash
# Reinstalar dependências
rm -rf node_modules yarn.lock
yarn install
```

### Erros de memória (Oracle Cloud)
- O bot possui garbage collection automático
- Limite de memória: ~500MB
- Reduzir grupos se necessário (limite: 50)

### Ban do WhatsApp
- ⚠️ **ACKs desabilitados** (evita banimentos)
- Aguarde 24-48h se banido temporariamente
- Não envie muitas mensagens rapidamente

## 📄 Licença

GPL-3.0-only

## 👨‍💻 Autor

**Gerfy**

## 📚 Recursos

- [Baileys GitHub](https://github.com/WhiskeySockets/Baileys)
- [Documentação Baileys v7](https://whiskey.so/migrate-latest)
- [TypeScript](https://www.typescriptlang.org/)
- [Node.js](https://nodejs.org/)

---

**Última atualização:** Outubro 2025
