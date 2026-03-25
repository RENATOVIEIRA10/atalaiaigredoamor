# ============================================================
# REGISTAR SERVIDOR MCP NO CLAUDE CODE
# Execute este script UMA VEZ no PowerShell para registar
# o servidor MCP correctamente, sem erros de caminho.
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  REGISTAR SERVIDOR MCP NO CLAUDE CODE  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Detecta automaticamente o caminho deste script
$PASTA = Split-Path -Parent $MyInvocation.MyCommand.Path
$MCP_SERVER = Join-Path $PASTA "mcp-server.js"

Write-Host "Pasta detectada: $PASTA" -ForegroundColor Yellow
Write-Host "Servidor MCP:    $MCP_SERVER" -ForegroundColor Yellow
Write-Host ""

# Verifica se o ficheiro existe
if (-not (Test-Path $MCP_SERVER)) {
    Write-Host "ERRO: mcp-server.js nao encontrado em:" -ForegroundColor Red
    Write-Host "  $MCP_SERVER" -ForegroundColor Red
    Write-Host ""
    Write-Host "Certifica-te de que executas este script dentro da pasta meu-projeto-ia" -ForegroundColor Yellow
    Read-Host "Prima Enter para sair"
    exit 1
}

# Verifica se o node_modules existe
$NODE_MODULES = Join-Path $PASTA "node_modules"
if (-not (Test-Path $NODE_MODULES)) {
    Write-Host "node_modules nao encontrado. A instalar dependencias..." -ForegroundColor Yellow
    Set-Location $PASTA
    npm install
    Write-Host ""
}

# Verifica se o .env existe e tem as chaves
$ENV_FILE = Join-Path $PASTA ".env"
if (-not (Test-Path $ENV_FILE)) {
    Write-Host "AVISO: Ficheiro .env nao encontrado." -ForegroundColor Yellow
    Write-Host "Cria o ficheiro .env com as tuas chaves antes de usar o servidor." -ForegroundColor Yellow
    Write-Host ""
}

# Remove registo antigo se existir
Write-Host "A remover registo antigo (se existir)..." -ForegroundColor Gray
claude mcp remove meu-projeto-ia 2>$null | Out-Null

# Regista o servidor com o caminho entre aspas para lidar com espacos
Write-Host "A registar o servidor MCP..." -ForegroundColor Green
Write-Host ""

# Usa cmd /c para garantir compatibilidade com caminhos com espacos
claude mcp add meu-projeto-ia --env "OPENAI_API_KEY=$env:OPENAI_API_KEY" --env "ANTHROPIC_API_KEY=$env:ANTHROPIC_API_KEY" --env "OBSIDIAN_PATH=$env:OBSIDIAN_PATH" -- node $MCP_SERVER

Write-Host ""

# Verifica se foi registado
Write-Host "A verificar o registo..." -ForegroundColor Gray
$LISTA = claude mcp list 2>&1
if ($LISTA -match "meu-projeto-ia") {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  SERVIDOR MCP REGISTADO COM SUCESSO!   " -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para usar, abre o Claude Code:" -ForegroundColor Cyan
    Write-Host "  claude" -ForegroundColor White
    Write-Host ""
    Write-Host "Dentro do Claude, verifica o estado do servidor:" -ForegroundColor Cyan
    Write-Host "  /mcp" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  FALHOU O REGISTO. A tentar metodo alternativo..." -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""

    # Metodo alternativo: editar directamente o ~/.claude.json
    $CLAUDE_JSON = "$env:USERPROFILE\.claude.json"

    if (Test-Path $CLAUDE_JSON) {
        $config = Get-Content $CLAUDE_JSON -Raw | ConvertFrom-Json

        # Cria a estrutura mcpServers se nao existir
        if (-not $config.PSObject.Properties["mcpServers"]) {
            $config | Add-Member -MemberType NoteProperty -Name "mcpServers" -Value @{}
        }

        # Adiciona o servidor
        $servidor = @{
            command = "node"
            args    = @($MCP_SERVER)
            env     = @{
                OPENAI_API_KEY     = if ($env:OPENAI_API_KEY) { $env:OPENAI_API_KEY } else { "sk-COLE_SUA_CHAVE_OPENAI_AQUI" }
                ANTHROPIC_API_KEY  = if ($env:ANTHROPIC_API_KEY) { $env:ANTHROPIC_API_KEY } else { "sk-ant-COLE_SUA_CHAVE_CLAUDE_AQUI" }
                OBSIDIAN_PATH      = if ($env:OBSIDIAN_PATH) { $env:OBSIDIAN_PATH } else { "C:\Users\$env:USERNAME\Documents\ObsidianVault" }
            }
        }

        $config.mcpServers | Add-Member -MemberType NoteProperty -Name "meu-projeto-ia" -Value $servidor -Force
        $config | ConvertTo-Json -Depth 10 | Set-Content $CLAUDE_JSON -Encoding UTF8

        Write-Host "Servidor adicionado directamente ao $CLAUDE_JSON" -ForegroundColor Green
        Write-Host ""
        Write-Host "Abre o Claude Code e corre /mcp para verificar:" -ForegroundColor Cyan
        Write-Host "  claude" -ForegroundColor White
    } else {
        Write-Host "Ficheiro $CLAUDE_JSON nao encontrado." -ForegroundColor Red
        Write-Host "Certifica-te de que o Claude Code esta instalado e ja foi executado pelo menos uma vez." -ForegroundColor Yellow
    }
}

Write-Host ""
Read-Host "Prima Enter para fechar"
