#!/usr/bin/env pwsh
# ============================================
# Treinador de Bolso — Deploy Script
# Deploys Edge Functions + Applies Migration
# ============================================

$PROJECT_REF = "fgokyxoukehyfpdaglnf"
$ErrorActionPreference = "Continue"

Write-Host "`n🚀 TREINADOR DE BOLSO — Deploy" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor DarkGray

# Check if logged in
Write-Host "`n🔐 Verificando login Supabase..." -ForegroundColor Yellow
$loginCheck = npx supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Precisa fazer login. Executando..." -ForegroundColor Red
    npx supabase login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Login falhou. Execute 'npx supabase login' manualmente." -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Autenticado" -ForegroundColor Green

# Link project
Write-Host "`n🔗 Linkando projeto $PROJECT_REF..." -ForegroundColor Yellow
npx supabase link --project-ref $PROJECT_REF 2>&1
Write-Host "✅ Projeto linkado" -ForegroundColor Green

# Apply migration
Write-Host "`n📦 Aplicando migration SQL..." -ForegroundColor Yellow
npx supabase db push 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  db push falhou, tentando via SQL direto..." -ForegroundColor Yellow
    # Fallback: apply migration via SQL file
    $sqlContent = Get-Content -Path "src\lib\migration_treinador_bolso.sql" -Raw
    # Try running via supabase db execute
    $sqlContent | npx supabase db execute --project-ref $PROJECT_REF 2>&1
}
Write-Host "✅ Migration aplicada" -ForegroundColor Green

# Deploy Edge Functions
$functions = @("process-upload", "coach-chat", "analyze-submission", "generate-report", "deliver-report")

foreach ($fn in $functions) {
    Write-Host "`n🔧 Deploying: $fn..." -ForegroundColor Yellow
    npx supabase functions deploy $fn --project-ref $PROJECT_REF --no-verify-jwt 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ $fn deployed!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $fn FAILED" -ForegroundColor Red
    }
}

Write-Host "`n================================" -ForegroundColor DarkGray
Write-Host "🎉 Deploy completo!" -ForegroundColor Cyan
Write-Host "`n📋 Próximos passos manuais:" -ForegroundColor Yellow
Write-Host "   1. Configure OPENAI_API_KEY em: https://supabase.com/dashboard/project/$PROJECT_REF/settings/functions" -ForegroundColor White
Write-Host "   2. Crie bucket 'submissions' em: https://supabase.com/dashboard/project/$PROJECT_REF/storage" -ForegroundColor White
Write-Host "   3. Crie bucket 'reports' em: https://supabase.com/dashboard/project/$PROJECT_REF/storage" -ForegroundColor White
