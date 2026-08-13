$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$audioDirectory = Join-Path $root 'public\audio\poems'
$dataDirectory = Join-Path $root 'src\data'
New-Item -ItemType Directory -Path $audioDirectory -Force | Out-Null
New-Item -ItemType Directory -Path $dataDirectory -Force | Out-Null

$indexResponse = Invoke-WebRequest -Uri 'https://karuta.ru/poems/' -UseBasicParsing
$index = [System.Text.Encoding]::UTF8.GetString($indexResponse.RawContentStream.ToArray())
$matches = [regex]::Matches($index, 'href="poems/(?<slug>\d{3}-[^"?]+\.html)"')
$slugs = $matches | ForEach-Object { $_.Groups['slug'].Value } | Sort-Object -Unique
$poems = @()

foreach ($slug in $slugs) {
  $number = [int]$slug.Substring(0, 3)
  Write-Host "Downloading poem $($number.ToString('000'))..."
  $pageResponse = Invoke-WebRequest -Uri "https://karuta.ru/poems/$slug" -UseBasicParsing
  $html = [System.Text.Encoding]::UTF8.GetString($pageResponse.RawContentStream.ToArray())
  $readingMatch = [regex]::Match($html, '<p>\s*<span class="red">(?<text>.*?)</p>', 'Singleline')
  $keyMatch = [regex]::Match($html, '<h4>.*?</span>\.\s*<span[^>]*>(?<key>[^<]+)</span>', 'Singleline')
  if (-not $readingMatch.Success) { throw "Reading not found for $slug" }

  $reading = '<span class="red">' + $readingMatch.Groups['text'].Value
  $reading = [regex]::Replace($reading, '<br\s*/?>', "`n", 'IgnoreCase')
  $reading = [regex]::Replace($reading, '<[^>]+>', '')
  $reading = [System.Net.WebUtility]::HtmlDecode($reading).Trim()
  $reading = (($reading -split "\r?\n") | ForEach-Object { $_.Trim() } | Where-Object { $_ }) -join "`n"

  $id = $number.ToString('000')
  $audioPath = Join-Path $audioDirectory "$id.mp3"
  if (-not (Test-Path $audioPath)) {
    Invoke-WebRequest -Uri "https://karuta.ru/assets/sounds/$id.mp3" -OutFile $audioPath
  }

  $poems += [ordered]@{
    number = $number
    kimariji = [System.Net.WebUtility]::HtmlDecode($keyMatch.Groups['key'].Value)
    hiragana = $reading
    image = "/cards/$id.png"
    audio = "/audio/poems/$id.mp3"
  }
}

$json = $poems | ConvertTo-Json -Depth 4
$target = Join-Path $dataDirectory 'poems.json'
[System.IO.File]::WriteAllText($target, $json, [System.Text.UTF8Encoding]::new($false))
Write-Host "Saved $($poems.Count) poems to $target"
