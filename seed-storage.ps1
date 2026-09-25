param(
    [string]$RootPath = (Join-Path $PSScriptRoot 'storage'),
    [int]$MaxDepth = 5
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-SeedFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $lines = @(
        'Seeded storage file',
        "Generated: $(Get-Date -Format o)",
        "Path: $Path",
        '---',
        'This file was created automatically to simulate a populated project storage tree.'
    )

    for ($i = 0; $i -lt 6; $i++) {
        $lines += "Line $i - sample content for file browser testing."
    }

    [System.IO.File]::WriteAllText($Path, ($lines -join [Environment]::NewLine) + [Environment]::NewLine)
}

function Invoke-SeedDirectory {
    param(
        [Parameter(Mandatory = $true)]
        [string]$DirectoryPath,

        [Parameter(Mandatory = $true)]
        [int]$CurrentDepth,

        [Parameter(Mandatory = $true)]
        [int]$MaxDepth
    )

    for ($i = 0; $i -lt 5; $i++) {
        $fileName = "file-{0}-{1}.txt" -f $i, ([System.Guid]::NewGuid().ToString('N').Substring(0, 8))
        $filePath = Join-Path $DirectoryPath $fileName
        Write-SeedFile -Path $filePath
    }

    if ($CurrentDepth -ge $MaxDepth) {
        return
    }

    for ($i = 0; $i -lt 5; $i++) {
        $folderName = "folder-{0}-{1}" -f $i, ([System.Guid]::NewGuid().ToString('N').Substring(0, 8))
        $childPath = Join-Path $DirectoryPath $folderName
        New-Item -ItemType Directory -Path $childPath -Force | Out-Null
        Invoke-SeedDirectory -DirectoryPath $childPath -CurrentDepth ($CurrentDepth + 1) -MaxDepth $MaxDepth
    }
}

if (Test-Path -LiteralPath $RootPath) {
    Remove-Item -LiteralPath $RootPath -Recurse -Force
}

New-Item -ItemType Directory -Path $RootPath -Force | Out-Null

$rootFolderCount = Get-Random -Minimum 5 -Maximum 11
$rootFileCount = Get-Random -Minimum 25 -Maximum 101

for ($i = 0; $i -lt $rootFolderCount; $i++) {
    $folderName = "root-folder-{0}-{1}" -f $i, ([System.Guid]::NewGuid().ToString('N').Substring(0, 8))
    $folderPath = Join-Path $RootPath $folderName
    New-Item -ItemType Directory -Path $folderPath -Force | Out-Null
    Invoke-SeedDirectory -DirectoryPath $folderPath -CurrentDepth 1 -MaxDepth $MaxDepth
}

for ($i = 0; $i -lt $rootFileCount; $i++) {
    $fileName = "root-file-{0}-{1}.txt" -f $i, ([System.Guid]::NewGuid().ToString('N').Substring(0, 8))
    $filePath = Join-Path $RootPath $fileName
    Write-SeedFile -Path $filePath
}

Write-Host "Created seed data under $RootPath"
Write-Host "Root folders: $rootFolderCount"
Write-Host "Root files: $rootFileCount"
Write-Host "Max depth: $MaxDepth"
