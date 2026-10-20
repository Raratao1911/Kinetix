$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$dir = Join-Path $root '.local/mailpit'
$exe = Join-Path $dir 'mailpit.exe'
if (!(Test-Path -LiteralPath $exe)) { throw 'Instale o binario oficial do Mailpit em .local/mailpit/mailpit.exe. Veja o README.' }
$db = Join-Path $dir 'messages.db'
Start-Process -FilePath $exe -ArgumentList @('--listen', '127.0.0.1:8025', '--smtp', '127.0.0.1:1025', '--database', $db) -WindowStyle Hidden
Write-Host 'Caixa de e-mail local: http://localhost:8025'
