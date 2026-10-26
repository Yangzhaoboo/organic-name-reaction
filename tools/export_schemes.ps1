# 用本机 ChemDraw（COM 自动化）把 tools/out/*.cdxml 导出成 public/schemes/*.png + *.svg
# 用法：pwsh -File tools/export_schemes.ps1
# 注意：运行前请先关闭正在使用的 ChemDraw，避免抢文档。

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$srcDir = Join-Path $PSScriptRoot 'out'
$outDir = Join-Path $root 'public\schemes'

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$files = Get-ChildItem $srcDir -Filter *.cdxml -ErrorAction SilentlyContinue
if (-not $files) {
  Write-Host "没有找到 cdxml，请先运行: python tools/build_schemes.py" -ForegroundColor Yellow
  exit 1
}

Write-Host "启动 ChemDraw 自动化…"
$app = New-Object -ComObject ChemDraw.Application
try { $app.Visible = $false } catch {}
try { $app.Preferences.PNGResolution = 300 } catch {}
try { $app.Preferences.TransparentPNGs = $false } catch {}

$ok = 0
foreach ($f in $files) {
  $id = $f.BaseName
  try {
    $doc = $app.Documents.Open($f.FullName)
    $doc.SaveAs((Join-Path $outDir "$id.png"))
    $doc.SaveAs((Join-Path $outDir "$id.svg"))
    $doc.Close(0)
    Write-Host ("  ok    {0}" -f $id) -ForegroundColor Green
    $ok++
  } catch {
    Write-Host ("  FAIL  {0}: {1}" -f $id, $_.Exception.Message) -ForegroundColor Red
  }
}

try { $app.Quit() } catch {}
Write-Host ("完成：{0}/{1} 导出到 {2}" -f $ok, $files.Count, $outDir)
