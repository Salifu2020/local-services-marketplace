# PowerShell script to find console.log statements
# Run this in PowerShell: .\cleanup-logs.ps1

Write-Host "Finding all console.log statements..." -ForegroundColor Yellow

# Find all console.log statements
$files = Get-ChildItem -Path src -Recurse -Include *.js,*.jsx | Select-String -Pattern "console\.log" | Group-Object Path

Write-Host "`nFound console.log in $($files.Count) files:" -ForegroundColor Cyan

foreach ($file in $files) {
    Write-Host "`n$($file.Name): $($file.Count) occurrences" -ForegroundColor Green
    $file.Group | ForEach-Object {
        Write-Host "  Line $($_.LineNumber): $($_.Line.Trim())" -ForegroundColor Gray
    }
}

Write-Host "`nTotal console.log statements found: $((Get-ChildItem -Path src -Recurse -Include *.js,*.jsx | Select-String -Pattern 'console\.log').Count)" -ForegroundColor Yellow
Write-Host "`nNote: Review each file and remove console.log statements manually or use find/replace in your IDE." -ForegroundColor Magenta


