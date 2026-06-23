# Этот скрипт настраивает всё для запуска "Здесь и сейчас"
# Запускать из PowerShell (не CMD)

Write-Host "=== Настройка 'Здесь и сейчас' ===" -ForegroundColor Cyan
Write-Host ""

# 1. Проверка .env.local
if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "1. Создан .env.local — заполни его перед запуском!" -ForegroundColor Yellow
} elseif ((Get-Content ".env.local" | Select-String "placeholder").Count -gt 0) {
    Write-Host "1. ⚠️ .env.local ещё содержит placeholder-ы — замени их!" -ForegroundColor Yellow
} else {
    Write-Host "1. ✅ .env.local заполнен" -ForegroundColor Green
}

# 2. Установка зависимостей
Write-Host "2. Устанавливаю зависимости..." -ForegroundColor Cyan
npm install 2>&1 | Out-Null
Write-Host "   ✅ Зависимости установлены" -ForegroundColor Green

# 3. Проверка миграций
if (Test-Path "supabase/migrations/0001_initial_schema.sql") {
    Write-Host "3. ✅ Миграции найдены (supabase/migrations/)" -ForegroundColor Green
}

# 4. Сборка
Write-Host "4. Собираю проект..." -ForegroundColor Cyan
npm run build 2>&1 | Select-String -Pattern "✓|Error" 
Write-Host ""
Write-Host "=== Готово! ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Запусти сервер:  npm run dev" -ForegroundColor Green
Write-Host "Открой:          http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "После настройки Supabase выполни:" -ForegroundColor Yellow
Write-Host "  npx supabase link --project-ref <ref>" -ForegroundColor Yellow
Write-Host "  npx supabase db push" -ForegroundColor Yellow
