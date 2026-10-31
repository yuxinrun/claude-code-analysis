Add-Type -AssemblyName System.Drawing

$W = 1200
$H = 630
$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

function Brush($hex) {
  $c = [System.Drawing.ColorTranslator]::FromHtml($hex)
  return New-Object System.Drawing.SolidBrush($c)
}

$bg = Brush "#06100e"
$g.FillRectangle($bg, 0, 0, $W, $H)

# soft radial-ish glow
$glow = New-Object System.Drawing.Drawing2D.GraphicsPath
$glow.AddEllipse(640, -260, 780, 780)
$glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($glow)
$glowBrush.CenterColor = [System.Drawing.Color]::FromArgb(46, 10, 149, 138)
$glowBrush.SurroundColors = @([System.Drawing.Color]::Transparent)
$g.FillPath($glowBrush, $glow)

# grid
$gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(20, 234, 244, 239), 1)
for ($x = 0; $x -lt $W; $x += 56) { $g.DrawLine($gridPen, $x, 0, $x, $H) }
for ($y = 0; $y -lt $H; $y += 56) { $g.DrawLine($gridPen, 0, $y, $W, $y) }

# accent rule
$accentPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#0a958a"), 5)
$g.DrawLine($accentPen, 76, 132, 196, 132)

$mono = "Consolas"
$sans = "Microsoft YaHei"

# eyebrow
$fEyebrow = New-Object System.Drawing.Font($mono, 15, [System.Drawing.FontStyle]::Regular)
$bMuted = Brush "#7fae9f"
$g.DrawString("SOURCE  DECODED  /  HARNESS  ENGINEERING", $fEyebrow, $bMuted, 210, 122)

# title
$bInk = Brush "#eaf4ef"
$fTitle = New-Object System.Drawing.Font($sans, 52, [System.Drawing.FontStyle]::Bold)
$g.DrawString("把 Claude Code", $fTitle, $bInk, 72, 168)
$bAccent = Brush "#12c2b3"
$g.DrawString("拆开给你看", $fTitle, $bAccent, 72, 248)

# subtitle
$fSub = New-Object System.Drawing.Font($sans, 22, [System.Drawing.FontStyle]::Regular)
$bInk2 = Brush "#b9cbc4"
$g.DrawString("17 章 · 讲透一个生产级 Agent 的真实决策", $fSub, $bInk2, 76, 356)

# chips
$fChip = New-Object System.Drawing.Font($sans, 15, [System.Drawing.FontStyle]::Regular)
$chips = @("Agent Loop", "工具系统", "上下文压缩", "权限", "记忆", "多 Agent")
$x = 76
foreach ($chip in $chips) {
  $size = $g.MeasureString($chip, $fChip)
  $w = [int]$size.Width + 26
  $rect = New-Object System.Drawing.RectangleF($x, 412, $w, 34)
  $chipPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $chipPath.AddArc($rect.X, $rect.Y, 34, 34, 90, 180)
  $chipPath.AddArc($rect.Right - 34, $rect.Y, 34, 34, 270, 180)
  $chipPath.CloseFigure()
  $chipFill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(24, 18, 194, 179))
  $g.FillPath($chipFill, $chipPath)
  $chipPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 18, 194, 179), 1)
  $g.DrawPath($chipPen, $chipPath)
  $g.DrawString($chip, $fChip, $bInk2, $x + 13, 417)
  $x += $w + 10
}

# fish mark
$fish = Brush "#0a958a"
$g.FillEllipse($fish, 958, 300, 150, 108)
$tail = New-Object System.Drawing.Drawing2D.GraphicsPath
$tail.AddPolygon(@(
  (New-Object System.Drawing.Point(962, 354)),
  (New-Object System.Drawing.Point(892, 316)),
  (New-Object System.Drawing.Point(892, 392))
))
$g.FillPath($fish, $tail)
$eye = Brush "#06100e"
$g.FillEllipse($eye, 1052, 336, 16, 16)
$speedPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#e85734"), 5)
$speedPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$speedPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$g.DrawLine($speedPen, 850, 300, 900, 300)
$g.DrawLine($speedPen, 838, 354, 892, 354)
$g.DrawLine($speedPen, 850, 408, 900, 408)

# footer brand
$fBrand = New-Object System.Drawing.Font($sans, 17, [System.Drawing.FontStyle]::Bold)
$g.DrawString("鱼心快跑", $fBrand, $bInk, 76, 528)
$fSmall = New-Object System.Drawing.Font($mono, 15, [System.Drawing.FontStyle]::Regular)
$g.DrawString("YUXIN  RUSH,  BUGS  GONE   ·   yuxin.run", $fSmall, $bMuted, 196, 532)

$out = Join-Path (Split-Path -Parent $PSScriptRoot) "og-cover.png"
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Output "saved $out"