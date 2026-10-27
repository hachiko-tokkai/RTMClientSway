param(
    [Parameter(Mandatory = $true)][string]$KaizJar,
    [string]$Cache = (Join-Path $env:USERPROFILE '.gradle\caches')
)
$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'build.ps1') -Cache $Cache
$verify = Join-Path $PSScriptRoot 'build\verify'
New-Item -ItemType Directory -Force -Path $verify | Out-Null
$deps = @(Get-ChildItem -LiteralPath $Cache -Recurse -File -Filter '*.jar' | Where-Object {
    $_.Name -eq 'asm-debug-all-5.0.3.jar' -or $_.Name -eq 'launchwrapper-1.12.jar' -or
    $_.Name -like 'forgeBin-1.7.10-*.jar' -or $_.Name -eq 'guava-17.0.jar' -or
    $_.Name -eq 'lwjgl-2.9.1.jar'
})
$cp = (@((Join-Path $PSScriptRoot 'build\classes')) + @($deps.FullName)) -join ';'
& javac -encoding UTF-8 -cp $cp -d $verify (Join-Path $PSScriptRoot 'tools\VerifyTransformer.java')
if ($LASTEXITCODE -ne 0) { throw 'verification compile failed' }
& java -cp "$verify;$cp" VerifyTransformer $KaizJar
if ($LASTEXITCODE -ne 0) { throw 'bytecode verification failed' }
& javac -encoding UTF-8 -source 8 -target 8 -cp $cp -d $verify (Join-Path $PSScriptRoot 'tools\fixtures\jp\ngt\rtm\rail\TileEntityLargeRailSwitchCore.java') (Join-Path $PSScriptRoot 'tools\VerifyVisualMotion.java')
if ($LASTEXITCODE -ne 0) { throw 'motion verification compile failed' }
& java -cp "$verify;$cp" rtmsway.VerifyVisualMotion
if ($LASTEXITCODE -ne 0) { throw 'motion verification failed' }

& javac -encoding UTF-8 -source 8 -target 8 -cp $cp -d $verify (Join-Path $PSScriptRoot 'tools\VerifyCurve.java')
if ($LASTEXITCODE -ne 0) { throw 'curve verification compile failed' }
& java -cp "$verify;$cp" rtmsway.VerifyCurve (Join-Path $PSScriptRoot 'tools\reference\RTMBodyMotion.js')
if ($LASTEXITCODE -ne 0) { throw 'reference curve verification failed' }
