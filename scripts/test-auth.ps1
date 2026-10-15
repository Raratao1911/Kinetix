param([string]$BaseUrl = 'http://localhost:5173')

$ErrorActionPreference = 'Stop'
$BaseUrl = $BaseUrl.TrimEnd('/')

function Invoke-Api {
    param([string]$Method, [string]$Path, $Payload, [string]$Token)
    $request = @{ Uri = "$BaseUrl$Path"; Method = $Method; UseBasicParsing = $true }
    if ($null -ne $Payload) {
        $request.ContentType = 'application/json; charset=utf-8'
        $request.Body = [Text.Encoding]::UTF8.GetBytes(($Payload | ConvertTo-Json -Depth 10))
    }
    if ($Token) { $request.Headers = @{ Authorization = "Bearer $Token" } }
    try {
        $response = Invoke-WebRequest @request
        return @{ Status = [int]$response.StatusCode; Body = ($response.Content | ConvertFrom-Json) }
    } catch {
        if ($null -eq $_.Exception.Response) { throw }
        return @{ Status = [int]$_.Exception.Response.StatusCode; Body = $null }
    }
}

function Assert-Status {
    param($Response, [int]$Expected, [string]$Name)
    if ($Response.Status -ne $Expected) { throw "$Name : esperado HTTP $Expected, recebido $($Response.Status)." }
    Write-Host "PASS: $Name (HTTP $Expected)"
}

# Synthetic accounts are kept to allow checking persistence after a restart.
$suffix = [Guid]::NewGuid().ToString('N')
$password = 'TesteKinetix@123'
$patient = @{ nome = 'Paciente Teste Automatizado'; email = "paciente.$suffix@example.com"; senha = $password; cidade = 'Barueri'; uf = 'SP'; telefone = '+5511999999999'; dataNascimento = '2000-01-01'; documentoIdentidade = '52998224725'; aceiteTermos = $true }
$physio = @{ nome = 'Fisio Teste Automatizado'; email = "fisio.$suffix@example.com"; senha = $password; crefitoNumero = $suffix.Substring(0, 20); crefitoUf = 'SP'; cidade = 'Barueri'; uf = 'SP'; atendeOnline = $false; especialidadesIds = @(); documentoIdentidade = '52998224725'; aceiteTermos = $true }

foreach ($case in @(
    @{ Name = 'Paciente'; Payload = $patient; Path = '/api/v1/auth/pacientes'; Profile = '/api/v1/paciente/perfil'; Role = 'PACIENTE' },
    @{ Name = 'Fisioterapeuta'; Payload = $physio; Path = '/api/v1/auth/fisioterapeutas'; Profile = '/api/v1/fisioterapeuta/perfil'; Role = 'FISIO' }
)) {
    $created = Invoke-Api -Method POST -Path $case.Path -Payload $case.Payload
    Assert-Status $created 201 "Cadastro $($case.Name)"
    if ($created.Body.perfil -ne $case.Role -or !$created.Body.token) { throw 'Resposta de cadastro incompleta.' }
    $login = Invoke-Api -Method POST -Path '/api/v1/auth/login' -Payload @{ email = $case.Payload.email; senha = $password }
    Assert-Status $login 200 "Login $($case.Name)"
    if ($login.Body.usuarioId -ne $created.Body.usuarioId) { throw 'Login retornou um usuario diferente.' }
    Assert-Status (Invoke-Api -Method GET -Path $case.Profile -Token $login.Body.token) 200 "Perfil autenticado $($case.Name)"
    Assert-Status (Invoke-Api -Method POST -Path $case.Path -Payload $case.Payload) 409 "Cadastro duplicado $($case.Name)"
    Assert-Status (Invoke-Api -Method POST -Path '/api/v1/auth/login' -Payload @{ email = $case.Payload.email; senha = 'SenhaIncorreta' }) 401 "Senha incorreta $($case.Name)"
}

Assert-Status (Invoke-Api -Method GET -Path '/api/v1/paciente/perfil') 401 'Perfil sem token'
Assert-Status (Invoke-Api -Method POST -Path '/api/v1/auth/pacientes' -Payload @{ nome = 'Teste'; email = 'invalido'; senha = 'curta' }) 400 'Cadastro invalido'
Write-Host 'Todos os testes de autenticacao passaram.'
