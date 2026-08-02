@echo off
REM Windows counterpart of the extensionless "claude" stub next to this file.
REM findOnPath only resolves names suffixed with a PATHEXT entry on Windows,
REM so the shell script alone leaves the agent undetected there.
if "%~1"=="--version" (
  echo 9.9.9 ^(stub^)
  exit /b 0
)
echo stub agent started with: %*
REM Hold the pty open by reading stdin, matching the "cat" in the sh stub.
findstr "^"
