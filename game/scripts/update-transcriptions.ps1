$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$dataPath = Join-Path $root 'src\data\poems.json'
$poems = Get-Content -LiteralPath $dataPath -Raw -Encoding UTF8 | ConvertFrom-Json

$indexResponse = Invoke-WebRequest -Uri 'https://karuta.ru/poems/' -UseBasicParsing
$index = [System.Text.Encoding]::UTF8.GetString($indexResponse.RawContentStream.ToArray())
$matches = [regex]::Matches($index, 'href="poems/(?<slug>\d{3}-[^"?]+\.html)"')
$slugs = $matches | ForEach-Object { $_.Groups['slug'].Value } | Sort-Object -Unique

foreach ($slug in $slugs) {
  $number = [int]$slug.Substring(0, 3)
  Write-Host "Reading transcription $($number.ToString('000'))..."
  $pageResponse = Invoke-WebRequest -Uri "https://karuta.ru/poems/$slug" -UseBasicParsing
  $html = [System.Text.Encoding]::UTF8.GetString($pageResponse.RawContentStream.ToArray())
  $match = [regex]::Match($html, '<p>\s*<span class="red">.*?</p>\s*<h5>.*?</h5>\s*<p>(?<text>.*?)</p>', 'Singleline')
  if (-not $match.Success) { throw "Transcription not found for $slug" }

  $transcription = $match.Groups['text'].Value
  $transcription = [regex]::Replace($transcription, '<br\s*/?>', "`n", 'IgnoreCase')
  $transcription = [regex]::Replace($transcription, '<[^>]+>', '')
  $transcription = [System.Net.WebUtility]::HtmlDecode($transcription)
  $transcription = (($transcription -split "\r?\n") | ForEach-Object { $_.Trim() } | Where-Object { $_ }) -join "`n"
  $poems[$number - 1] | Add-Member -NotePropertyName transcription -NotePropertyValue $transcription -Force
}

$json = $poems | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($dataPath, $json, [System.Text.UTF8Encoding]::new($false))
Write-Host "Saved transcriptions for $($poems.Count) poems"
