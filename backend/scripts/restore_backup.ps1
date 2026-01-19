<#
.SYNOPSIS
    Restores a MongoDB backup from a zip file downloaded from GitHub Actions.
.DESCRIPTION
    This script automates the process of unzipping a backup and restoring it to your database.
    It requires 'mongorestore' (part of MongoDB Command Line Tools) to be installed.
.PARAMETER ZipPath
    The path to the downloaded .zip file.
.PARAMETER TargetUri
    (Optional) The MongoDB connection string. Defaults to the one in your .env file.
#>

param (
    [Parameter(Mandatory=$true)]
    [string]$ZipPath,

    [string]$TargetUri
)

# 1. Check Prerequisites
if (-not (Get-Command mongorestore -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: 'mongorestore' is not installed or not in your PATH." -ForegroundColor Red
    Write-Host "   Please install MongoDB Database Tools: https://www.mongodb.com/try/download/database-tools"
    exit 1
}

# 2. Get Mongo URI from .env if not provided
if ([string]::IsNullOrWhiteSpace($TargetUri)) {
    if (Test-Path "$PSScriptRoot\..\.env") {
        $envContent = Get-Content "$PSScriptRoot\..\.env"
        $lines = $envContent | Select-String "MONGO_URI="
        if ($lines) {
            $TargetUri = $lines.ToString().Split('=', 2)[1].Trim()
            # Remove quotes if present
            $TargetUri = $TargetUri -replace '^"|"$', ''
            Write-Host "✅ Found MONGO_URI in .env" -ForegroundColor Green
        }
    }
}

if ([string]::IsNullOrWhiteSpace($TargetUri)) {
    Write-Host "❌ Error: Could not find MONGO_URI. Please provide it as an argument or ensure .env exists." -ForegroundColor Red
    exit 1
}

# 3. Prepare Extraction
$extractPath = "$PSScriptRoot\..\temp_restore_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Force -Path $extractPath | Out-Null
Write-Host "📂 Extracting backup to temporary folder..." -ForegroundColor Cyan

try {
    Expand-Archive -Path $ZipPath -DestinationPath $extractPath -Force
} catch {
    Write-Host "❌ Error unzipping file: $_" -ForegroundColor Red
    exit 1
}

# 4. Find the Dump Folder
# The zip contains backup_TIMESTAMP/DB_NAME/...
$dumpFolders = Get-ChildItem -Path $extractPath -Directory -Recurse | Where-Object { $_.Name -match "backup_" }
if (-not $dumpFolders) {
    # Maybe it was zipped differently, look for the root extracted folder
    $dumpFolders = $extractPath
} else {
    $dumpFolders = $dumpFolders.FullName
}

Write-Host "🔍 Backup contents found." -ForegroundColor Cyan

# 5. Restore
Write-Host "⏳ Starting Restore to Atlas... (This may take time)" -ForegroundColor Magenta
Write-Host "   Target: $TargetUri"

# WARNING: This will overwrite existing data.
try {
    # --drop ensures the old collection is removed before restoring
    # Use $dumpFolders as the source
    Start-Process -FilePath "mongorestore" -ArgumentList "--uri=`"$TargetUri`"", "--drop", "`"$dumpFolders`"" -Wait -NoNewWindow
    Write-Host "`n✅ Restore Process Completed." -ForegroundColor Green
} catch {
    Write-Host "❌ Restore failed: $_" -ForegroundColor Red
}

# 6. Cleanup
Remove-Item -Path $extractPath -Recurse -Force
Write-Host "🧹 Cleanup done."
