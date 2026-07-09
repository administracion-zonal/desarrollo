$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:8083"
$password = "Qa2026*"

$users = @(
  @{ Name = "ADMIN"; Cedula = "9000000001" },
  @{ Name = "ADMIN_VEHICULOS"; Cedula = "9000000002" },
  @{ Name = "ADMIN_COWORKING"; Cedula = "9000000003" },
  @{ Name = "ADMIN_CANCHAS"; Cedula = "9000000004" },
  @{ Name = "TALENTO_HUMANO"; Cedula = "9000000005" },
  @{ Name = "CHOFER"; Cedula = "9000000006" },
  @{ Name = "SERVIDOR_AZVCH"; Cedula = "9000000007" },
  @{ Name = "SERVIDOR_PUBLICO"; Cedula = "9000000008" },
  @{ Name = "PRIVADO"; Cedula = "9000000009" },
  @{ Name = "ESTUDIANTE"; Cedula = "9000000010" }
)

$results = New-Object System.Collections.Generic.List[Object]

function Invoke-TestRequest {
  param(
    [string]$Role,
    [string]$TestName,
    [string]$Method,
    [string]$Url,
    [string]$Token,
    [int[]]$ExpectedStatus,
    [object]$Body = $null
  )

  $headers = @{}
  if ($Token) { $headers["Authorization"] = "Bearer $Token" }

  $status = -1
  $ok = $false
  $detail = ""

  try {
    if ($Body -ne $null) {
      $json = $Body | ConvertTo-Json -Depth 10
      $resp = Invoke-WebRequest -Uri $Url -Method $Method -Headers $headers -ContentType "application/json" -Body $json
    } else {
      $resp = Invoke-WebRequest -Uri $Url -Method $Method -Headers $headers
    }

    $status = [int]$resp.StatusCode
    $ok = $ExpectedStatus -contains $status
    $detail = "HTTP $status"
  } catch {
    if ($_.Exception.Response -ne $null) {
      $status = [int]$_.Exception.Response.StatusCode.value__
      $ok = $ExpectedStatus -contains $status
      $detail = "HTTP $status"
    } else {
      $detail = $_.Exception.Message
    }
  }

  $results.Add([pscustomobject]@{
    Role = $Role
    Test = $TestName
    Method = $Method
    Url = $Url.Replace($baseUrl, "")
    Expected = ($ExpectedStatus -join "/")
    Result = if ($ok) { "PASS" } else { "FAIL" }
    Detail = $detail
  }) | Out-Null

  return @{ Ok = $ok; Status = $status }
}

foreach ($u in $users) {
  $loginBody = @{ cedula = $u.Cedula; password = $password }

  $token = $null
  $idUsuario = $null

  try {
    $loginResp = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body ($loginBody | ConvertTo-Json)
    $token = $loginResp.token
    $idUsuario = [int]$loginResp.idUsuario

    $results.Add([pscustomobject]@{
      Role = $u.Name
      Test = "Login"
      Method = "POST"
      Url = "/api/auth/login"
      Expected = "200"
      Result = if ($token) { "PASS" } else { "FAIL" }
      Detail = if ($token) { "HTTP 200" } else { "Sin token" }
    }) | Out-Null
  } catch {
    $status = -1
    if ($_.Exception.Response -ne $null) {
      $status = [int]$_.Exception.Response.StatusCode.value__
    }

    $results.Add([pscustomobject]@{
      Role = $u.Name
      Test = "Login"
      Method = "POST"
      Url = "/api/auth/login"
      Expected = "200"
      Result = "FAIL"
      Detail = if ($status -gt 0) { "HTTP $status" } else { $_.Exception.Message }
    }) | Out-Null

    continue
  }

  Invoke-TestRequest -Role $u.Name -TestName "Perfil" -Method "GET" -Url "$baseUrl/api/usuarios/perfil/$idUsuario" -Token $token -ExpectedStatus @(200) | Out-Null
  Invoke-TestRequest -Role $u.Name -TestName "Mis reservas coworking" -Method "GET" -Url "$baseUrl/api/reservas/mis" -Token $token -ExpectedStatus @(200) | Out-Null
  Invoke-TestRequest -Role $u.Name -TestName "Mis reservas cancha" -Method "GET" -Url "$baseUrl/api/cancha/mis" -Token $token -ExpectedStatus @(200) | Out-Null

  switch ($u.Name) {
    "ADMIN" {
      Invoke-TestRequest -Role $u.Name -TestName "Pendientes vehiculos" -Method "GET" -Url "$baseUrl/api/vehiculos/solicitudes/pendientes" -Token $token -ExpectedStatus @(200) | Out-Null
      Invoke-TestRequest -Role $u.Name -TestName "Admin vehiculos todas" -Method "GET" -Url "$baseUrl/api/vehiculos/admin/todas" -Token $token -ExpectedStatus @(200) | Out-Null
      Invoke-TestRequest -Role $u.Name -TestName "Desbloqueo usuario" -Method "PUT" -Url "$baseUrl/api/usuarios/9000000009/desbloquear" -Token $token -ExpectedStatus @(200,400) | Out-Null
    }
    "ADMIN_VEHICULOS" {
      Invoke-TestRequest -Role $u.Name -TestName "Pendientes vehiculos" -Method "GET" -Url "$baseUrl/api/vehiculos/solicitudes/pendientes" -Token $token -ExpectedStatus @(200) | Out-Null
      Invoke-TestRequest -Role $u.Name -TestName "Choferes" -Method "GET" -Url "$baseUrl/api/vehiculos/choferes" -Token $token -ExpectedStatus @(200) | Out-Null
    }
    "ADMIN_COWORKING" {
      Invoke-TestRequest -Role $u.Name -TestName "Reservas todas coworking" -Method "GET" -Url "$baseUrl/api/reservas/todas" -Token $token -ExpectedStatus @(200) | Out-Null
    }
    "ADMIN_CANCHAS" {
      Invoke-TestRequest -Role $u.Name -TestName "Reservas todas cancha" -Method "GET" -Url "$baseUrl/api/cancha/todas" -Token $token -ExpectedStatus @(200) | Out-Null
    }
    "TALENTO_HUMANO" {
      Invoke-TestRequest -Role $u.Name -TestName "Documentos TH" -Method "GET" -Url "$baseUrl/talento-humano/documentos/$idUsuario" -Token $token -ExpectedStatus @(200,404) | Out-Null
      Invoke-TestRequest -Role $u.Name -TestName "Crear o activar" -Method "POST" -Url "$baseUrl/talento-humano/crear-o-activar" -Token $token -ExpectedStatus @(200,400) -Body @{ cedula = "9000000011"; nombres = "QA ALTA TEMP" } | Out-Null
    }
    "CHOFER" {
      Invoke-TestRequest -Role $u.Name -TestName "Reservas chofer" -Method "GET" -Url "$baseUrl/api/vehiculos/chofer" -Token $token -ExpectedStatus @(200) | Out-Null
      Invoke-TestRequest -Role $u.Name -TestName "Orden movilizacion chofer" -Method "GET" -Url "$baseUrl/api/vehiculos/chofer/orden-movilizacion/1" -Token $token -ExpectedStatus @(200,400,404) | Out-Null
    }
    "SERVIDOR_AZVCH" {
      Invoke-TestRequest -Role $u.Name -TestName "Mis solicitudes vehiculos" -Method "GET" -Url "$baseUrl/api/vehiculos/solicitudes/mis" -Token $token -ExpectedStatus @(200) | Out-Null
      $fecha = (Get-Date).AddDays(2).ToString("yyyy-MM-dd")
      $body = @{
        fecha = $fecha
        horaInicio = "08:00"
        horaFin = "09:00"
        motivo = "QA solicitud vehiculo"
        destino = "Destino QA"
        observaciones = "Observaciones QA"
        origen = "Conocoto"
        servidores = "QA Usuario"
      }
      Invoke-TestRequest -Role $u.Name -TestName "Crear solicitud vehiculo" -Method "POST" -Url "$baseUrl/api/vehiculos/solicitudes" -Token $token -ExpectedStatus @(200,400) -Body $body | Out-Null
    }
    "SERVIDOR_PUBLICO" {
      Invoke-TestRequest -Role $u.Name -TestName "Acceso vehiculos prohibido" -Method "GET" -Url "$baseUrl/api/vehiculos/solicitudes/mis" -Token $token -ExpectedStatus @(403) | Out-Null
    }
    "PRIVADO" {
      Invoke-TestRequest -Role $u.Name -TestName "Acceso vehiculos prohibido" -Method "GET" -Url "$baseUrl/api/vehiculos/solicitudes/mis" -Token $token -ExpectedStatus @(403) | Out-Null
    }
    "ESTUDIANTE" {
      Invoke-TestRequest -Role $u.Name -TestName "Acceso vehiculos prohibido" -Method "GET" -Url "$baseUrl/api/vehiculos/solicitudes/mis" -Token $token -ExpectedStatus @(403) | Out-Null
    }
  }
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outDir = "c:\woksSpace\ADMINISTRACION_ZONAL\backend\target\qa"
if (!(Test-Path $outDir)) { New-Item -Path $outDir -ItemType Directory | Out-Null }
$outFile = Join-Path $outDir "qa_smoke_roles_$stamp.csv"

$results | Export-Csv -NoTypeInformation -Path $outFile -Encoding UTF8

"QA_FILE=$outFile"
"QA_TOTAL=" + $results.Count
"QA_FAILS=" + (($results | Where-Object { $_.Result -eq 'FAIL' }).Count)

$results | Sort-Object Role, Test | Format-Table -AutoSize
