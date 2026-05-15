$files = Get-ChildItem -Path 'app' -Recurse -Include '*.tsx' -ErrorAction SilentlyContinue
foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        $updated = $content -replace '#7b68ee', '#E0A11A' `
                            -replace '#6857c7', '#c88c0a'
        [System.IO.File]::WriteAllText($file.FullName, $updated)
        Write-Host "Updated: $($file.Name)"
    } catch {
        Write-Host "Error in $($file.Name): $_"
    }
}
Write-Host "Reemplazo completado!"
