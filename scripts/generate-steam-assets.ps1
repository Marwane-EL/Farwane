Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot "..\steam-assets"
if (-not (Test-Path $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

$logoPath = Join-Path $PSScriptRoot "..\public\farwaneLogo.png"
$logoImg = [System.Drawing.Image]::FromFile((Resolve-Path $logoPath))

function Draw-Sparkle {
  param(
    [System.Drawing.Graphics]$g,
    [float]$cx,
    [float]$cy,
    [float]$r,
    [System.Drawing.Color]$color
  )
  $pts = @(
    (New-Object System.Drawing.PointF($cx, ($cy - $r))),
    (New-Object System.Drawing.PointF(($cx + $r * 0.28), ($cy - $r * 0.28))),
    (New-Object System.Drawing.PointF(($cx + $r), $cy)),
    (New-Object System.Drawing.PointF(($cx + $r * 0.28), ($cy + $r * 0.28))),
    (New-Object System.Drawing.PointF($cx, ($cy + $r))),
    (New-Object System.Drawing.PointF(($cx - $r * 0.28), ($cy + $r * 0.28))),
    (New-Object System.Drawing.PointF(($cx - $r), $cy)),
    (New-Object System.Drawing.PointF(($cx - $r * 0.28), ($cy - $r * 0.28)))
  )
  $shadowPts = $pts | ForEach-Object { New-Object System.Drawing.PointF(($_.X + 3), ($_.Y + 3)) }
  $blackBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 0, 0, 0))
  $g.FillPolygon($blackBrush, $shadowPts)
  $blackBrush.Dispose()

  $fillBrush = New-Object System.Drawing.SolidBrush($color)
  $g.FillPolygon($fillBrush, $pts)
  $fillBrush.Dispose()

  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::Black, 2.2)
  $g.DrawPolygon($pen, $pts)
  $pen.Dispose()
}

function Draw-NeoTitleAt {
  param(
    [System.Drawing.Graphics]$g,
    [string]$Text,
    [float]$TargetLeft,
    [float]$TargetTop,
    [float]$EmSize
  )

  $fontFamily = New-Object System.Drawing.FontFamily("Arial Black")
  $sf = [System.Drawing.StringFormat]::GenericTypographic

  # Build base path at (0,0) and measure exact glyph bounds
  $rawPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $rawPath.AddString($Text, $fontFamily, [int][System.Drawing.FontStyle]::Bold, $EmSize, (New-Object System.Drawing.PointF(0, 0)), $sf)
  $rawBounds = $rawPath.GetBounds()

  $dx = $TargetLeft - $rawBounds.X
  $dy = $TargetTop - $rawBounds.Y

  $shadowOffset = [Math]::Max(4, [float]($EmSize * 0.065))
  $strokeW = [Math]::Max(3, [float]($EmSize * 0.06))

  # 1. Purple neo-brutalist hard shadow
  $pathPurple = $rawPath.Clone()
  $matPurple = New-Object System.Drawing.Drawing2D.Matrix
  $matPurple.Translate(($dx + $shadowOffset * 1.45), ($dy + $shadowOffset * 1.45))
  $pathPurple.Transform($matPurple)
  $purpleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(195, 147, 51, 234))
  $g.FillPath($purpleBrush, $pathPurple)
  $purpleBrush.Dispose()
  $matPurple.Dispose()
  $pathPurple.Dispose()

  # 2. Solid black hard shadow
  $pathShadow = $rawPath.Clone()
  $matShadow = New-Object System.Drawing.Drawing2D.Matrix
  $matShadow.Translate(($dx + $shadowOffset), ($dy + $shadowOffset))
  $pathShadow.Transform($matShadow)
  $blackBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 8, 6, 14))
  $g.FillPath($blackBrush, $pathShadow)
  $blackBrush.Dispose()
  $matShadow.Dispose()
  $pathShadow.Dispose()

  # 3. Main text path
  $pathMain = $rawPath.Clone()
  $matMain = New-Object System.Drawing.Drawing2D.Matrix
  $matMain.Translate($dx, $dy)
  $pathMain.Transform($matMain)
  $bounds = $pathMain.GetBounds()

  $gradRect = New-Object System.Drawing.RectangleF(($bounds.X - 4), $bounds.Y, ($bounds.Width + 8), $bounds.Height)
  $gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $gradRect,
    [System.Drawing.Color]::FromArgb(255, 192, 132, 252),
    [System.Drawing.Color]::FromArgb(255, 74, 222, 128),
    [System.Drawing.Drawing2D.LinearGradientMode]::Horizontal
  )
  $blend = New-Object System.Drawing.Drawing2D.ColorBlend(3)
  $blend.Colors = @(
    [System.Drawing.Color]::FromArgb(255, 192, 132, 252),
    [System.Drawing.Color]::FromArgb(255, 250, 204, 21),
    [System.Drawing.Color]::FromArgb(255, 74, 222, 128)
  )
  $blend.Positions = @(0.0, 0.52, 1.0)
  $gradBrush.InterpolationColors = $blend

  $outlinePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 10, 8, 18), $strokeW)
  $outlinePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $g.DrawPath($outlinePen, $pathMain)
  $g.FillPath($gradBrush, $pathMain)

  $outlinePen.Dispose()
  $gradBrush.Dispose()
  $matMain.Dispose()
  $pathMain.Dispose()
  $rawPath.Dispose()
  $fontFamily.Dispose()

  return $bounds
}

function Get-TextGlyphBounds {
  param([string]$Text, [float]$EmSize)
  $ff = New-Object System.Drawing.FontFamily("Arial Black")
  $sf = [System.Drawing.StringFormat]::GenericTypographic
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $p.AddString($Text, $ff, [int][System.Drawing.FontStyle]::Bold, $EmSize, (New-Object System.Drawing.PointF(0, 0)), $sf)
  $b = $p.GetBounds()
  $p.Dispose()
  $ff.Dispose()
  return $b
}

function Draw-NeoPillBadge {
  param(
    [System.Drawing.Graphics]$g,
    [float]$CenterX,
    [float]$TopY,
    [float]$FontSize
  )
  $font = New-Object System.Drawing.Font("Arial Black", $FontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $text = "CRÉEZ  ·  VOTEZ  ·  DOMINEZ"
  $sz = $g.MeasureString($text, $font)
  $padX = $FontSize * 1.25
  $padY = $FontSize * 0.45
  $boxW = $sz.Width + $padX * 2
  $boxH = $sz.Height + $padY * 2
  $boxX = $CenterX - ($boxW / 2)

  # Hard neo-brutalist offset shadow
  $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 168, 85, 247))
  $g.FillRectangle($shadowBrush, ($boxX + 4), ($TopY + 4), $boxW, $boxH)
  $shadowBrush.Dispose()

  # Card fill
  $fillBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 24, 20, 38))
  $g.FillRectangle($fillBrush, $boxX, $TopY, $boxW, $boxH)
  $fillBrush.Dispose()

  # Border
  $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 192, 132, 252), 2.5)
  $g.DrawRectangle($borderPen, $boxX, $TopY, $boxW, $boxH)
  $borderPen.Dispose()

  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 244, 244, 245))
  $g.DrawString($text, $font, $textBrush, (New-Object System.Drawing.RectangleF($boxX, $TopY, $boxW, $boxH)), $sf)

  $textBrush.Dispose()
  $sf.Dispose()
  $font.Dispose()
}

function New-SteamBanner {
  param(
    [string]$FileName,
    [int]$Width,
    [int]$Height,
    [bool]$IncludeText = $true,
    [bool]$TransparentBg = $false,
    [bool]$VerticalLayout = $false
  )

  $bmp = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  if (-not $TransparentBg) {
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 13, 11, 20))
    $g.FillRectangle($bgBrush, 0, 0, $Width, $Height)
    $bgBrush.Dispose()

    $path1 = New-Object System.Drawing.Drawing2D.GraphicsPath
    $glowSize1 = [int]([Math]::Max($Width, $Height) * 0.8)
    $path1.AddEllipse([int](-$glowSize1 * 0.25), [int](-$glowSize1 * 0.25), $glowSize1, $glowSize1)
    $pgb1 = New-Object System.Drawing.Drawing2D.PathGradientBrush($path1)
    $pgb1.CenterColor = [System.Drawing.Color]::FromArgb(75, 168, 85, 247)
    $pgb1.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 168, 85, 247))
    $g.FillPath($pgb1, $path1)
    $pgb1.Dispose()
    $path1.Dispose()

    $path2 = New-Object System.Drawing.Drawing2D.GraphicsPath
    $glowSize2 = [int]([Math]::Max($Width, $Height) * 0.75)
    $path2.AddEllipse([int]($Width - $glowSize2 * 0.75), [int]($Height - $glowSize2 * 0.75), $glowSize2, $glowSize2)
    $pgb2 = New-Object System.Drawing.Drawing2D.PathGradientBrush($path2)
    $pgb2.CenterColor = [System.Drawing.Color]::FromArgb(60, 74, 222, 128)
    $pgb2.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 74, 222, 128))
    $g.FillPath($pgb2, $path2)
    $pgb2.Dispose()
    $path2.Dispose()

    $dotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(24, 192, 132, 252))
    $step = [Math]::Max(22, [int]($Width / 38))
    for ($x = $step; $x -lt $Width; $x += $step) {
      for ($y = $step; $y -lt $Height; $y += $step) {
        $g.FillEllipse($dotBrush, $x, $y, 2, 2)
      }
    }
    $dotBrush.Dispose()

    $frameThick = [Math]::Max(4, [int]($Height * 0.012))
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 168, 85, 247), $frameThick)
    $g.DrawRectangle($borderPen, 8, 8, $Width - 16, $Height - 16)
    $borderPen.Dispose()
  }

  if (-not $IncludeText) {
    $iconH = [int]($Height * 0.44)
    $iconW = [int]($iconH * ($logoImg.Width / [double]$logoImg.Height))
    $ix = [int](($Width - $iconW) / 2)
    $iy = [int](($Height - $iconH) / 2)
    $g.DrawImage($logoImg, $ix, $iy, $iconW, $iconH)
    Draw-Sparkle -g $g -cx ($ix + $iconW + 40) -cy ($iy + 20) -r 24 -color ([System.Drawing.Color]::FromArgb(255, 250, 204, 21))
    Draw-Sparkle -g $g -cx ($ix - 40) -cy ($iy + $iconH - 20) -r 18 -color ([System.Drawing.Color]::FromArgb(255, 74, 222, 128))
  } elseif ($VerticalLayout) {
    $iconH = [int]($Width * 0.35)
    $iconW = [int]($iconH * ($logoImg.Width / [double]$logoImg.Height))
    $ix = [int](($Width - $iconW) / 2)
    $iy = [int]($Height * 0.17)
    $g.DrawImage($logoImg, $ix, $iy, $iconW, $iconH)

    $emSize = [Math]::Round($Width * 0.145)
    $gBounds = Get-TextGlyphBounds -Text "FarWane" -EmSize $emSize
    $titleX = ($Width - $gBounds.Width) / 2
    $titleY = $iy + $iconH + ($Height * 0.05)
    $drawn = Draw-NeoTitleAt -g $g -Text "FarWane" -TargetLeft $titleX -TargetTop $titleY -EmSize $emSize

    Draw-Sparkle -g $g -cx ($drawn.Right + 16) -cy ($drawn.Top - 6) -r ([Math]::Max(12, $emSize * 0.16)) -color ([System.Drawing.Color]::FromArgb(255, 250, 204, 21))
    Draw-NeoPillBadge -g $g -CenterX ($Width / 2) -TopY ($drawn.Bottom + $Height * 0.045) -FontSize ([Math]::Max(13, [Math]::Round($Width * 0.028)))
  } else {
    $emSize = [Math]::Round([Math]::Min($Height * 0.27, $Width * 0.12))
    $gBounds = Get-TextGlyphBounds -Text "FarWane" -EmSize $emSize

    $iconH = [int]($gBounds.Height * 1.25)
    $iconW = [int]($iconH * ($logoImg.Width / [double]$logoImg.Height))
    $gap = [int]($emSize * 0.20)

    $totalW = $iconW + $gap + $gBounds.Width
    $startX = ($Width - $totalW) / 2
    $rowCenterY = if (-not $TransparentBg -and $Height -ge 260) { $Height * 0.41 } else { $Height * 0.50 }

    $iconX = [int]$startX
    $iconY = [int]($rowCenterY - ($iconH / 2))
    $g.DrawImage($logoImg, $iconX, $iconY, $iconW, $iconH)

    $titleLeft = $startX + $iconW + $gap
    $titleTop = $rowCenterY - ($gBounds.Height / 2)
    $drawn = Draw-NeoTitleAt -g $g -Text "FarWane" -TargetLeft $titleLeft -TargetTop $titleTop -EmSize $emSize

    $sparkR = [Math]::Max(10, [float]($emSize * 0.16))
    Draw-Sparkle -g $g -cx ($drawn.Right + $sparkR * 1.1) -cy ($drawn.Top - $sparkR * 0.2) -r $sparkR -color ([System.Drawing.Color]::FromArgb(255, 250, 204, 21))
    Draw-Sparkle -g $g -cx ($iconX - $sparkR * 0.6) -cy ($iconY + $iconH - $sparkR * 0.3) -r ($sparkR * 0.72) -color ([System.Drawing.Color]::FromArgb(255, 74, 222, 128))

    if (-not $TransparentBg -and $Height -ge 260) {
      $badgeFontSz = [Math]::Max(13, [Math]::Round($emSize * 0.165))
      Draw-NeoPillBadge -g $g -CenterX ($Width / 2) -TopY ($drawn.Bottom + $Height * 0.075) -FontSize $badgeFontSz
    }
  }

  $outPath = Join-Path $outDir $FileName
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
  Write-Output "Generated $FileName ($Width x $Height)"
}

New-SteamBanner -FileName "header_capsule_920x430.png"   -Width 920  -Height 430
New-SteamBanner -FileName "small_capsule_462x174.png"    -Width 462  -Height 174
New-SteamBanner -FileName "main_capsule_1232x706.png"    -Width 1232 -Height 706
New-SteamBanner -FileName "vertical_capsule_748x896.png" -Width 748  -Height 896 -VerticalLayout $true
New-SteamBanner -FileName "library_capsule_600x900.png"  -Width 600  -Height 900 -VerticalLayout $true
New-SteamBanner -FileName "library_header_920x430.png"   -Width 920  -Height 430
New-SteamBanner -FileName "library_hero_3840x1240.png"   -Width 3840 -Height 1240 -IncludeText $false
New-SteamBanner -FileName "library_logo_1280x720.png"    -Width 1280 -Height 720 -TransparentBg $true

$logoImg.Dispose()
