# ============================================================
# SINCRONIZAR PROJECTO DO GITHUB
# Este script descarrega todos os ficheiros do projecto
# para a tua pasta local e regista o servidor MCP.
# ============================================================

$REPO = "https://raw.githubusercontent.com/RENATOVIEIRA10/atalaiaigredoamor/main/meu-projeto-ia"
$PASTA = "C:\Users\$env:USERNAME\meu-projeto-ia"
$FICHEIROS = @(
    "package.json",
    "index.js",
    "agente.js",
    "obsidian.js",
    "claude.js",
    "claude-agente.js",
    "ia-dual.js",
    "mcp-server.js",
    "registar-mcp.ps1",
    "README.md"
)

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   SINCRONIZAR MEU-PROJETO-IA DO GITHUB    " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Cria a pasta se nao existir
if (-not (Test-Path $PASTA)) {
    New-Item -ItemType Directory -Path $PASTA -Force | Out-Null
    Write-Host "Pasta criada: $PASTA" -ForegroundColor Green
} else {
    Write-Host "Pasta existente: $PASTA" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "A descarregar ficheiros do GitHub..." -ForegroundColor Cyan
Write-Host ""

# Descarrega cada ficheiro
$sucesso = 0
$falhou = 0
foreach ($ficheiro in $FICHEIROS) {
    $url = "$REPO/$ficheiro"
    $destino = Join-Path $PASTA $ficheiro
    try {
        Invoke-WebRequest -Uri $url -OutFile $destino -UseBasicParsing -ErrorAction Stop
        Write-Host "  OK  $ficheiro" -ForegroundColor Green
        $sucesso++
    } catch {
        Write-Host "  FALHOU  $ficheiro" -ForegroundColor Red
        $falhou++
    }
}

Write-Host ""
Write-Host "$sucesso ficheiro(s) descarregados, $falhou falhou(aram)." -ForegroundColor $(if ($falhou -eq 0) { "Green" } else { "Yellow" })
Write-Host ""

# Cria o ficheiro .env se nao existir
$ENV_FILE = Join-Path $PASTA ".env"
if (-not (Test-Path $ENV_FILE)) {
    $envConteudo = @"
# -- OPENAI ------------------------------------------
# Obtenha em: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-COLE_SUA_CHAVE_OPENAI_AQUI

# -- ANTHROPIC (CLAUDE) ------------------------------
# Obtenha em: https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=sk-ant-COLE_SUA_CHAVE_CLAUDE_AQUI

# -- OBSIDIAN ----------------------------------------
# Caminho da tua vault do Obsidian
OBSIDIAN_PATH=C:\Users\$env:USERNAME\Documents\ObsidianVault
"@
    Set-Content -Path $ENV_FILE -Value $envConteudo -Encoding UTF8
    Write-Host "Ficheiro .env criado. Abre-o e preenche as tuas chaves!" -ForegroundColor Yellow
    Write-Host "  $ENV_FILE" -ForegroundColor White
    Write-Host ""
}

# Instala as dependencias
Write-Host "A instalar dependencias (npm install)..." -ForegroundColor Cyan
Set-Location $PASTA
npm install --silent 2>&1 | Out-Null
Write-Host "Dependencias instaladas." -ForegroundColor Green
Write-Host ""

# Remove registo MCP antigo e cria novo
Write-Host "A registar o servidor MCP no Claude Code..." -ForegroundColor Cyan
$MCP_SERVER = Join-Path $PASTA "mcp-server.js"

claude mcp remove meu-projeto-ia 2>$null | Out-Null
claude mcp add meu-projeto-ia -- node $MCP_SERVER 2>&1 | Out-Null

# Verifica o registo
$lista = claude mcp list 2>&1
if ($lista -match "meu-projeto-ia") {
    Write-Host "Servidor MCP registado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Nao foi possivel registar via CLI. A escrever directamente no .claude.json..." -ForegroundColor Yellow

    $CLAUDE_JSON = "$env:USERPROFILE\.claude.json"
    if (Test-Path $CLAUDE_JSON) {
        $raw = Get-Content $CLAUDE_JSON -Raw
        $config = $raw | ConvertFrom-Json

        if (-not $config.PSObject.Properties["mcpServers"]) {
            $config | Add-Member -MemberType NoteProperty -Name "mcpServers" -Value ([PSCustomObject]@{})
        }

        $servidor = [PSCustomObject]@{
            command = "node"
            args    = @($MCP_SERVER)
            env     = [PSCustomObject]@{
                OPENAI_API_KEY    = "COLE_SUA_CHAVE_OPENAI_AQUI"
                ANTHROPIC_API_KEY = "sk-ant-COLE_SUA_CHAVE_CLAUDE_AQUI"
                OBSIDIAN_PATH     = "C:\Users\$env:USERNAME\Documents\ObsidianVault"
            }
        }

        $config.mcpServers | Add-Member -MemberType NoteProperty -Name "meu-projeto-ia" -Value $servidor -Force
        $config | ConvertTo-Json -Depth 10 | Set-Content $CLAUDE_JSON -Encoding UTF8
        Write-Host "Servidor adicionado ao $CLAUDE_JSON" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   PROJECTO PRONTO!                        " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Abre o ficheiro .env e cola as tuas chaves:" -ForegroundColor White
Write-Host "     notepad $ENV_FILE" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Abre o Claude Code:" -ForegroundColor White
Write-Host "     claude" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Verifica o servidor MCP dentro do Claude:" -ForegroundColor White
Write-Host "     /mcp" -ForegroundColor Gray
Write-Host ""
Read-Host "Prima Enter para fechar"
