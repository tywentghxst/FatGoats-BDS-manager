Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# 1. Start the Bedrock Server Manager process in background
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

$cmd = "node"
$args = @((Join-Path $scriptPath "dist/server.cjs"), "--tray-parent")

if (Test-Path (Join-Path $scriptPath "bds-manager.exe")) {
    $cmd = Join-Path $scriptPath "bds-manager.exe"
    $args = "--tray-parent"
}

$Global:proc = $null

function Start-Manager {
    Write-Host "Starting Bedrock Server Manager in background..." -ForegroundColor Green
    if ($Global:proc -and -not $Global:proc.HasExited) {
        Stop-Manager
    }
    
    # Run the manager process hidden
    $Global:proc = Start-Process -FilePath $cmd -ArgumentList $args -WindowStyle Hidden -PassThru -WorkingDirectory $scriptPath
    Start-Sleep -Seconds 2
}

function Stop-Manager {
    Write-Host "Stopping Bedrock Server Manager..." -ForegroundColor Yellow
    if ($Global:proc -and -not $Global:proc.HasExited) {
        Stop-Process -Id $Global:proc.Id -Force -ErrorAction SilentlyContinue
    }
    
    # Ensure any stray bds-manager or server.cjs processes are terminated
    if ($cmd -like "*bds-manager*") {
        Get-Process -Name "bds-manager" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    }
}

Start-Manager

# Create Dynamic System Tray Icon (No .ico file required!)
$bmp = New-Object System.Drawing.Bitmap 32, 32
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(24, 24, 27)) # dark zinc layout background

# Draw elegant emerald cube/gem representation matching dashboard design
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (New-Object System.Drawing.Rectangle 2,2,28,28), [System.Drawing.Color]::Teal, [System.Drawing.Color]::LimeGreen, 45
$g.FillEllipse($brush, 2, 2, 28, 28)

# Overlay deep white letter "B"
$font = New-Object System.Drawing.Font "Segoe UI", 13, [System.Drawing.FontStyle]::Bold
$textBrush = New-Object System.Drawing.SolidBrush [System.Drawing.Color]::White
$g.DrawString("B", $font, $textBrush, 7, 3)

# Build system tray notify icon
$hIcon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)

$notifyIcon = New-Object System.Windows.Forms.NotifyIcon
$notifyIcon.Icon = $icon
$notifyIcon.Text = "Bedrock Server Manager (Running)"
$notifyIcon.Visible = $true

# Double click -> open dashboard
$notifyIcon.add_DoubleClick({
    Start-Process "http://localhost:3000"
})

# Show balloon tip on startup
$notifyIcon.ShowBalloonTip(3000, "Bedrock Server Manager", "BDS Panel started successfully in the background!`nDouble-click this icon to open the web dashboard.", [System.Windows.Forms.ToolTipIcon]::Info)

# Build interactive Context Menu
$contextMenu = New-Object System.Windows.Forms.ContextMenu
$menuOpen = New-Object System.Windows.Forms.MenuItem "Open Web Dashboard"
$menuRestart = New-Object System.Windows.Forms.MenuItem "Restart Manager Process"
$menuStatus = New-Object System.Windows.Forms.MenuItem "Show Active Status"
$menuDivider = New-Object System.Windows.Forms.MenuItem "-"
$menuExit = New-Object System.Windows.Forms.MenuItem "Shutdown Server & Exit"

$menuOpen.add_Click({
    Start-Process "http://localhost:3000"
})

$menuRestart.add_Click({
    $notifyIcon.ShowBalloonTip(2000, "Bedrock Server Manager", "Restarting BDS Manager service...", [System.Windows.Forms.ToolTipIcon]::Info)
    Stop-Manager
    Start-Sleep -Seconds 1
    Start-Manager
    $notifyIcon.ShowBalloonTip(2500, "Bedrock Server Manager", "Service restarted and running!", [System.Windows.Forms.ToolTipIcon]::Info)
})

$menuStatus.add_Click({
    $statusText = "Active"
    if ($Global:proc.HasExited) { $statusText = "Stopped" }
    $notifyIcon.ShowBalloonTip(3000, "BDS Manager Status", "Service State: $statusText`nPort: 3000`nProcess URL: http://localhost:3000", [System.Windows.Forms.ToolTipIcon]::Info)
})

$menuExit.add_Click({
    $notifyIcon.ShowBalloonTip(2000, "Bedrock Server Manager", "Stopping server processes completely...", [System.Windows.Forms.ToolTipIcon]::Info)
    Stop-Manager
    $notifyIcon.Visible = $false
    $notifyIcon.Dispose()
    [System.Windows.Forms.Application]::Exit()
    Exit
})

$contextMenu.MenuItems.Add($menuOpen) | Out-Null
$contextMenu.MenuItems.Add($menuStatus) | Out-Null
$contextMenu.MenuItems.Add($menuRestart) | Out-Null
$contextMenu.MenuItems.Add($menuDivider) | Out-Null
$contextMenu.MenuItems.Add($menuExit) | Out-Null

$notifyIcon.ContextMenu = $contextMenu

# Standard Application Event Loop for Windows Forms
[System.Windows.Forms.Application]::Run()
