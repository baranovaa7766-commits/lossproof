param(
    [int]$Port = 8081,
    [string]$OutDir = (Join-Path (Split-Path -Parent $PSScriptRoot) "assets\icons")
)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Upload receiver listening on http://localhost:$Port/ -> $OutDir"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    $response.Headers.Add("Access-Control-Allow-Origin", "*")
    $response.Headers.Add("Access-Control-Allow-Methods", "POST, OPTIONS")
    $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, X-File-Name")
    try {
        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 204
        } elseif ($request.HttpMethod -eq "POST") {
            $name = $request.QueryString["name"]
            if (-not $name) { $name = "upload.bin" }
            $outPath = Join-Path $OutDir $name
            $ms = New-Object System.IO.MemoryStream
            $request.InputStream.CopyTo($ms)
            [System.IO.File]::WriteAllBytes($outPath, $ms.ToArray())
            Write-Host "Saved $($ms.Length) bytes -> $outPath"
            $response.StatusCode = 200
            $msg = [System.Text.Encoding]::UTF8.GetBytes("OK $($ms.Length) bytes -> $name")
            $response.OutputStream.Write($msg, 0, $msg.Length)
        } else {
            $response.StatusCode = 405
        }
    } catch {
        $response.StatusCode = 500
        $errBytes = [System.Text.Encoding]::UTF8.GetBytes("500: $($_.Exception.Message)")
        $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
    } finally {
        $response.OutputStream.Close()
    }
}
