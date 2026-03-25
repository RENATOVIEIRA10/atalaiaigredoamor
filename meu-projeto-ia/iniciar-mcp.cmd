@echo off
:: Este ficheiro inicia o servidor MCP sem problemas com espaços no caminho
:: O Claude Code usa este .cmd como ponto de entrada

cd /d "%~dp0"
node "%~dp0mcp-server.js"
