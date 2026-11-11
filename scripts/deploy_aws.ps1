# MindGuard AI — PowerShell AWS Deployment Runner
param (
    [string]$AccessKey = $env:AWS_ACCESS_KEY_ID,
    [string]$SecretKey = $env:AWS_SECRET_ACCESS_KEY,
    [string]$Region = $(if ($env:AWS_DEFAULT_REGION) { $env:AWS_DEFAULT_REGION } else { "ap-south-1" }),
    [string]$InstanceType = "t3.medium"
)

$venvPython = "d:\mindguard\backend\.venv\Scripts\python.exe"

if (-not $AccessKey -or -not $SecretKey) {
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "  MINDGUARD AI — AUTOMATED AWS DEPLOYMENT" -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "Please enter your AWS credentials below:" -ForegroundColor Yellow
    if (-not $AccessKey) {
        $AccessKey = Read-Host "AWS Access Key ID (e.g. AKIA...)"
    }
    if (-not $SecretKey) {
        $SecretKey = Read-Host "AWS Secret Access Key" -AsSecureString
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecretKey)
        $SecretKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    }
}

& $venvPython d:\mindguard\scripts\deploy_to_aws.py --access-key $AccessKey --secret-key $SecretKey --region $Region --instance-type $InstanceType
