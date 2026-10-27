param([string]$Cache = (Join-Path $env:USERPROFILE '.gradle\caches'))
$ErrorActionPreference = 'Stop'
$project = $PSScriptRoot
$deps = @(
    Get-ChildItem -LiteralPath $Cache -Recurse -File -Filter '*.jar' | Where-Object {
        $_.Name -like 'forgeBin-1.7.10-*.jar' -or $_.Name -eq 'asm-debug-all-5.0.3.jar' -or
        $_.Name -eq 'launchwrapper-1.12.jar' -or $_.Name -eq 'lwjgl-2.9.1.jar' -or $_.Name -eq 'guava-17.0.jar'
    }
)
if ($deps.Count -lt 5) { throw '必要なForge 1.7.10/ASM/LaunchWrapper/LWJGL/Guavaのキャッシュがありません。' }
$classes = Join-Path $project 'build\classes'
$dist = Join-Path $project 'dist'
New-Item -ItemType Directory -Force -Path $classes,$dist | Out-Null
$classRoot = [IO.Path]::GetFullPath($classes).TrimEnd('\') + '\'
foreach ($classFile in Get-ChildItem -LiteralPath $classes -Recurse -File -Filter '*.class') {
    if (-not $classFile.FullName.StartsWith($classRoot, [StringComparison]::OrdinalIgnoreCase)) { throw 'class path outside build directory' }
    Remove-Item -LiteralPath $classFile.FullName
}
$sources = @(Get-ChildItem -LiteralPath (Join-Path $project 'src\main\java') -Recurse -Filter '*.java' | ForEach-Object FullName)
& javac -encoding UTF-8 -source 8 -target 8 -classpath (($deps | ForEach-Object FullName) -join ';') -d $classes $sources
if ($LASTEXITCODE -ne 0) { throw 'javac failed' }
Copy-Item -Path (Join-Path $project 'src\main\resources\mcmod.info') -Destination $classes
Copy-Item -LiteralPath (Join-Path $project 'LICENSE') -Destination $classes
Copy-Item -LiteralPath (Join-Path $project 'THIRD_PARTY_NOTICES.md') -Destination $classes
$output = Join-Path $dist 'RTMClientSway-1.1.1.jar'
& jar cfm $output (Join-Path $project 'src\main\resources\META-INF\MANIFEST.MF') -C $classes .
if ($LASTEXITCODE -ne 0) { throw 'jar failed' }
Write-Output $output
