$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8794
$prefix = "http://127.0.0.1:$port/"

Set-Location $root
Write-Host "郎拉麵小遊戲"
Write-Host "網址：$prefix"
Write-Host "按 Ctrl+C 停止。"

if (Get-Command python -ErrorAction SilentlyContinue) {
  python -m http.server $port --bind 127.0.0.1
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
  py -3 -m http.server $port --bind 127.0.0.1
} else {
  Write-Host "找不到 Python。請直接開啟 index.html。"
  Read-Host "按 Enter 關閉"
}
