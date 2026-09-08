<# : batch portion
@REM ----------------------------------------------------------------------------
@REM Apache Maven Wrapper startup batch script, version 3.3.2
@REM
@REM Optional ENV vars:
@REM   MVNW_REPOURL - repo url base for downloading maven distribution
@REM   MVNW_VERBOSE - true: enable verbose log; others: silence output
@REM ----------------------------------------------------------------------------
@IF "%__MVNW_ARG0_NAME__%"=="" (SET __MVNW_ARG0_NAME__=%~nx0)
@SET __MVNW_CMD__=
@SET __MVNW_ERROR__=
@SET __MVNW_PSMODULEP_SAVE=%PSModulePath%
@SET PSModulePath=
@FOR /F "usebackq tokens=1* delims==" %%A IN (`powershell -noprofile "& {$scriptDir='%~dp0'; $script='%__MVNW_ARG0_NAME__%'; icm -ScriptBlock ([Scriptblock]::Create((Get-Content -Raw '%~f0'))) -NoNewScope}"`) DO @(
  IF "%%A"=="MVN_CMD" (set __MVNW_CMD__=%%B) ELSE IF "%%B"=="" (echo %%A) ELSE (echo %%A=%%B)
)
@SET PSModulePath=%__MVNW_PSMODULEP_SAVE%
@SET __MVNW_PSMODULEP_SAVE=
@SET __MVNW_ARG0_NAME__=
@SET MVNW_USERNAME=
@SET MVNW_PASSWORD=
@IF NOT "%__MVNW_CMD__%"=="" (%__MVNW_CMD__% %*)
@echo Cannot start maven from wrapper >&2 && exit /b 1
@GOTO :EOF
: end batch / begin powershell #>

$ErrorActionPreference = "Stop"
if ($env:MVNW_VERBOSE -eq "true") { $VerbosePreference = "Continue" }

if (-not $env:JAVA_HOME) {
  $javaExe = (Get-Command -Name "java" -ErrorAction Ignore).Source
  if (-not $javaExe) { Write-Error "Cannot find java command and JAVA_HOME is not set" }
} else {
  $javaExe = "$env:JAVA_HOME/bin/java.exe"
}

[xml]$dummy = "<root/>"
$distributionUrl = $null
foreach ($line in (Get-Content -Path "$PSScriptRoot/.mvn/wrapper/maven-wrapper.properties")) {
  $t = $line.Trim()
  if ($t.StartsWith("distributionUrl=")) { $distributionUrl = $t.Substring("distributionUrl=".Length) }
  if ($t.StartsWith("distributionSha256Sum=")) { $distributionSha256Sum = $t.Substring("distributionSha256Sum=".Length) }
}
if (-not $distributionUrl) { Write-Error "cannot read distributionUrl property in $PSScriptRoot/.mvn/wrapper/maven-wrapper.properties" }

switch -wildcard -casesensitive ( $($distributionUrl -replace '^.*/','') ) {
  "maven-mvnd-*" { $MVN_CMD = "mvnd.cmd"; $USE_MVND = $true }
  default        { $MVN_CMD = $script -replace '^mvnw','mvn'; $USE_MVND = $false }
}
$MVN_CMD = $MVN_CMD.Trim('.', ' ')

if ($env:MVNW_REPOURL) {
  $MVNW_REPO_PATTERN = if ($USE_MVND) { "/org/apache/maven/mvnd/" } else { "/org/apache/maven/" }
  $distributionUrl = "$env:MVNW_REPOURL$MVNW_REPO_PATTERN$($distributionUrl -replace '^.*'+$MVNW_REPO_PATTERN,'')"
}
$distributionUrlName = $distributionUrl -replace '^.*/',''
$distributionUrlNameMain = $distributionUrlName -replace '\.[^.]*$','' -replace '-bin$',''
$MAVEN_HOME_PARENT = "$HOME/.m2/wrapper/dists/$distributionUrlNameMain"
$MAVEN_HOME_NAME = ([System.Security.Cryptography.MD5]::Create().ComputeHash([byte[]][char[]]$distributionUrl) | ForEach-Object { $_.ToString("x2") }) -join ''
$MAVEN_HOME = "$MAVEN_HOME_PARENT/$MAVEN_HOME_NAME"

if (Test-Path -Path "$MAVEN_HOME" -PathType Container) {
  Write-Verbose "found existing MAVEN_HOME at $MAVEN_HOME"
  Write-Output "MVN_CMD=$MAVEN_HOME/bin/$MVN_CMD"
  exit $?
}

if (-not ($distributionUrl -match "-bin\.zip$")) { Write-Error "distributionUrl is not valid, must end with -bin.zip, but found $distributionUrl" }

$TMP_DOWNLOAD_DIR = Join-Path $MAVEN_HOME_PARENT "$MAVEN_HOME_NAME.tmp"
if (Test-Path -Path $TMP_DOWNLOAD_DIR) { Remove-Item $TMP_DOWNLOAD_DIR -Recurse -Force }
New-Item -Path $TMP_DOWNLOAD_DIR -ItemType Directory | Out-Null

Write-Verbose "Couldn't find MAVEN_HOME, downloading and installing it ..."
Write-Verbose "Downloading from: $distributionUrl"

$webclient = New-Object System.Net.WebClient
if ($env:MVNW_USERNAME -and $env:MVNW_PASSWORD) {
  $webclient.Credentials = New-Object System.Net.NetworkCredential($env:MVNW_USERNAME, $env:MVNW_PASSWORD)
}
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$webclient.DownloadFile($distributionUrl, "$TMP_DOWNLOAD_DIR/$distributionUrlName") | Out-Null

if ($distributionSha256Sum) {
  $actual = (Get-FileHash "$TMP_DOWNLOAD_DIR/$distributionUrlName" -Algorithm SHA256).Hash.ToLower()
  if ($actual -ne $distributionSha256Sum.ToLower()) { Write-Error "Error: Failed to validate Maven distribution SHA-256" }
}

Expand-Archive "$TMP_DOWNLOAD_DIR/$distributionUrlName" -DestinationPath $TMP_DOWNLOAD_DIR | Out-Null
Rename-Item -Path "$TMP_DOWNLOAD_DIR/$distributionUrlNameMain" -NewName $MAVEN_HOME_NAME | Out-Null
try {
  Move-Item -Path "$TMP_DOWNLOAD_DIR/$MAVEN_HOME_NAME" -Destination $MAVEN_HOME_PARENT | Out-Null
} catch {
  if (-not (Test-Path -Path "$MAVEN_HOME" -PathType Container)) { Write-Error "fail to move MAVEN_HOME" }
} finally {
  if (Test-Path -Path $TMP_DOWNLOAD_DIR) { Remove-Item $TMP_DOWNLOAD_DIR -Recurse -Force }
}

Write-Output "MVN_CMD=$MAVEN_HOME/bin/$MVN_CMD"
