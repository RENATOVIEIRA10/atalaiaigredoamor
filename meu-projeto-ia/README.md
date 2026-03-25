# Meu Projeto IA — Assistente Local com OpenAI

Assistente de IA local com 3 modos: chatbot com memória, agente autónomo e leitor de Obsidian.

## Pré-requisitos

- Node.js instalado (versão 18 ou superior)
- Chave da API da OpenAI (obtenha em https://platform.openai.com/api-keys)

## Instalação (copie e cole no terminal)

```bash
npm install
```

## Configuração da chave OpenAI

Abra o ficheiro `.env` e substitua `sk-COLE_SUA_CHAVE_AQUI` pela sua chave real.

## Como usar

### Modo 1 — Chatbot com memória (conversa contínua)
```bash
node index.js
```

### Modo 2 — Agente autónomo (cria código e ficheiros)
```bash
node agente.js
```

### Modo 3 — Leitor de Obsidian
```bash
node obsidian.js
```

## Comandos dentro do chatbot

| Comando | O que faz |
|---------|-----------|
| `novo`  | Limpa o histórico e começa nova sessão |
| `sair`  | Encerra o programa |

## Configurar o caminho do Obsidian

Abra o ficheiro `.env` e altere `OBSIDIAN_PATH` para o caminho da sua vault.
