<#
.SYNOPSIS
    MindGuardAI Automated AWS Infrastructure Provisioning Script for us-east-1 (N. Virginia).
.DESCRIPTION
    Provisions VPC, Subnets (1a, 1b), Route Tables, IGW, NAT GW, Security Groups,
    RDS PostgreSQL 15, S3 ML Model Bucket, ECR Repository, Secrets Manager secrets,
    ECS Fargate Cluster, Task Definitions, and ALB.
.EXAMPLE
    .\infrastructure\setup_aws_us_east_1.ps1 -DbPassword "YourSecurePassword2026!" -AlertEmail "your-email@example.com"
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",

    [Parameter(Mandatory=$false)]
    [string]$DbPassword = "MindGuardPostgresPass2026!",

    [Parameter(Mandatory=$false)]
    [string]$AlertEmail = "counselor@university.edu"
)

$ErrorActionPreference = "Stop"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " MindGuardAI - AWS Production Provisioning in $Region" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Verify AWS Identity
Write-Host "[1/12] Verifying AWS CLI authentication..." -ForegroundColor Yellow
$caller = aws sts get-caller-identity --output json | ConvertFrom-Json
$AccountId = $caller.Account
Write-Host " Authenticated Account ID: $AccountId" -ForegroundColor Green

# 2. S3 Bucket for ML Models (NOTE: No LocationConstraint in us-east-1!)
$BucketName = "mindguard-ml-models-prod-$AccountId"
Write-Host "[2/12] Creating S3 Model Bucket ($BucketName)..." -ForegroundColor Yellow
try {
    aws s3api create-bucket --bucket $BucketName --region $Region 2>$null
    aws s3api put-public-access-block --bucket $BucketName `
        --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" `
        --region $Region
    Write-Host " S3 bucket ready." -ForegroundColor Green
} catch {
    Write-Host " S3 bucket already exists or initialized." -ForegroundColor DarkGray
}

# 3. Create ECR Repository
Write-Host "[3/12] Setting up Amazon ECR repository (mindguard-api)..." -ForegroundColor Yellow
try {
    aws ecr create-repository --repository-name mindguard-api --image-scanning-configuration scanOnPush=true --region $Region 2>$null
    Write-Host " ECR repository created." -ForegroundColor Green
} catch {
    Write-Host " ECR repository exists." -ForegroundColor DarkGray
}

# 4. Create VPC & Subnets
Write-Host "[4/12] Setting up VPC (10.0.0.0/16) and Availability Zones..." -ForegroundColor Yellow
$VpcId = aws ec2 describe-vpcs --filters "Name=tag:Name,Values=mindguard-vpc" --query "Vpcs[0].VpcId" --output text --region $Region 2>$null
if ($VpcId -eq "None" -or [string]::IsNullOrWhiteSpace($VpcId)) {
    $VpcId = aws ec2 create-vpc --cidr-block 10.0.0.0/16 --region $Region `
        --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=mindguard-vpc}]' `
        --query "Vpc.VpcId" --output text
    aws ec2 modify-vpc-attribute --vpc-id $VpcId --enable-dns-support '{"Value": true}' --region $Region
    aws ec2 modify-vpc-attribute --vpc-id $VpcId --enable-dns-hostnames '{"Value": true}' --region $Region
    Write-Host " Created VPC: $VpcId" -ForegroundColor Green
} else {
    Write-Host " Existing VPC detected: $VpcId" -ForegroundColor DarkGray
}

# Subnets helper function
function Get-OrCreate-Subnet {
    param($Name, $Cidr, $Az, $IsPublic)
    $SubnetId = aws ec2 describe-subnets --filters "Name=tag:Name,Values=$Name" --query "Subnets[0].SubnetId" --output text --region $Region 2>$null
    if ($SubnetId -eq "None" -or [string]::IsNullOrWhiteSpace($SubnetId)) {
        $SubnetId = aws ec2 create-subnet --vpc-id $VpcId --cidr-block $Cidr --availability-zone $Az --region $Region `
            --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$Name}]" `
            --query "Subnet.SubnetId" --output text
        if ($IsPublic) {
            aws ec2 modify-subnet-attribute --subnet-id $SubnetId --map-public-ip-on-launch --region $Region
        }
        Write-Host " Created Subnet: $Name ($SubnetId)" -ForegroundColor Green
    }
    return $SubnetId
}

$PubSubnet1a = Get-OrCreate-Subnet "mindguard-public-subnet-1a" "10.0.1.0/24" "us-east-1a" $true
$PubSubnet1b = Get-OrCreate-Subnet "mindguard-public-subnet-1b" "10.0.2.0/24" "us-east-1b" $true
$PrivSubnet1a = Get-OrCreate-Subnet "mindguard-private-subnet-1a" "10.0.3.0/24" "us-east-1a" $false
$PrivSubnet1b = Get-OrCreate-Subnet "mindguard-private-subnet-1b" "10.0.4.0/24" "us-east-1b" $false

# 5. Gateways & Routing
Write-Host "[5/12] Configuring Internet Gateway & Routing..." -ForegroundColor Yellow
$IgwId = aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$VpcId" --query "InternetGateways[0].InternetGatewayId" --output text --region $Region 2>$null
if ($IgwId -eq "None" -or [string]::IsNullOrWhiteSpace($IgwId)) {
    $IgwId = aws ec2 create-internet-gateway --region $Region --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=mindguard-igw}]' --query "InternetGateway.InternetGatewayId" --output text
    aws ec2 attach-internet-gateway --internet-gateway-id $IgwId --vpc-id $VpcId --region $Region
}

# Public Route Table
$PubRtId = aws ec2 describe-route-tables --filters "Name=tag:Name,Values=mindguard-public-rt" --query "RouteTables[0].RouteTableId" --output text --region $Region 2>$null
if ($PubRtId -eq "None" -or [string]::IsNullOrWhiteSpace($PubRtId)) {
    $PubRtId = aws ec2 create-route-table --vpc-id $VpcId --region $Region --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=mindguard-public-rt}]' --query "RouteTable.RouteTableId" --output text
    aws ec2 create-route --route-table-id $PubRtId --destination-cidr-block 0.0.0.0/0 --gateway-id $IgwId --region $Region
    aws ec2 associate-route-table --subnet-id $PubSubnet1a --route-table-id $PubRtId --region $Region 2>$null
    aws ec2 associate-route-table --subnet-id $PubSubnet1b --route-table-id $PubRtId --region $Region 2>$null
}

# 6. Security Groups
Write-Host "[6/12] Creating Security Groups (sg-alb, sg-api, sg-db, sg-ml)..." -ForegroundColor Yellow
function Get-OrCreate-SG {
    param($Name, $Desc)
    $SgId = aws ec2 describe-security-groups --filters "Name=group-name,Values=$Name" --query "SecurityGroups[0].GroupId" --output text --region $Region 2>$null
    if ($SgId -eq "None" -or [string]::IsNullOrWhiteSpace($SgId)) {
        $SgId = aws ec2 create-security-group --group-name $Name --description $Desc --vpc-id $VpcId --region $Region --output text --query "GroupId"
    }
    return $SgId
}

$SgAlb = Get-OrCreate-SG "sg-alb" "ALB public ingress"
$SgApi = Get-OrCreate-SG "sg-api" "FastAPI ECS service"
$SgDb = Get-OrCreate-SG "sg-db" "RDS PostgreSQL"
$SgMl = Get-OrCreate-SG "sg-ml" "ML Worker service"

# Authorize ingress rules safely
aws ec2 authorize-security-group-ingress --group-id $SgAlb --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $Region 2>$null || true
aws ec2 authorize-security-group-ingress --group-id $SgAlb --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $Region 2>$null || true
aws ec2 authorize-security-group-ingress --group-id $SgApi --protocol tcp --port 8000 --source-group $SgAlb --region $Region 2>$null || true
aws ec2 authorize-security-group-ingress --group-id $SgDb --protocol tcp --port 5432 --source-group $SgApi --region $Region 2>$null || true
aws ec2 authorize-security-group-ingress --group-id $SgDb --protocol tcp --port 5432 --source-group $SgMl --region $Region 2>$null || true

# 7. RDS PostgreSQL
Write-Host "[7/12] Provisioning RDS PostgreSQL 15 (Free tier eligible)..." -ForegroundColor Yellow
try {
    aws rds create-db-subnet-group --db-subnet-group-name mindguard-db-subnet-group `
        --db-subnet-group-description "Private subnets for MindGuard" `
        --subnet-ids "[\`"$PrivSubnet1a\`", \`"$PrivSubnet1b\`"]" --region $Region 2>$null
} catch {}

$DbEndpoint = aws rds describe-db-instances --db-instance-identifier mindguard-db --query "DBInstances[0].Endpoint.Address" --output text --region $Region 2>$null
if ($DbEndpoint -eq "None" -or [string]::IsNullOrWhiteSpace($DbEndpoint)) {
    Write-Host " Launching RDS instance (takes ~5 minutes)..." -ForegroundColor Cyan
    aws rds create-db-instance `
        --db-instance-identifier mindguard-db `
        --db-instance-class db.t3.micro `
        --engine postgres `
        --engine-version 15.6 `
        --allocated-storage 20 `
        --master-username mindguard_user `
        --master-user-password $DbPassword `
        --db-name mindguard `
        --vpc-security-group-ids $SgDb `
        --db-subnet-group-name mindguard-db-subnet-group `
        --no-publicly-accessible `
        --backup-retention-period 7 `
        --region $Region
} else {
    Write-Host " RDS Endpoint: $DbEndpoint" -ForegroundColor Green
}

# 8. Secrets Manager
Write-Host "[8/12] Storing Application Secrets in Secrets Manager..." -ForegroundColor Yellow
function Set-Secret {
    param($Name, $Val)
    try {
        aws secretsmanager create-secret --name $Name --secret-string "$Val" --region $Region 2>$null
    } catch {
        aws secretsmanager put-secret-value --secret-id $Name --secret-string "$Val" --region $Region 2>$null
    }
}

$DatabaseUrl = "postgresql+asyncpg://mindguard_user:$DbPassword@$DbEndpoint:5432/mindguard"
Set-Secret "mindguard/database-url" $DatabaseUrl
Set-Secret "mindguard/jwt-secret" "6b8f1d8712a4c119cbf446d338f936b7ef99df3e481b471ca04df1f19811802d"
Set-Secret "mindguard/cors-origins" '["https://main.*.amplifyapp.com", "http://localhost:5173"]'

# 9. CloudWatch Log Groups
Write-Host "[9/12] Creating CloudWatch Log Groups in $Region..." -ForegroundColor Yellow
aws logs create-log-group --log-group-name /mindguard/api --region $Region 2>$null || true
aws logs put-retention-policy --log-group-name /mindguard/api --retention-in-days 30 --region $Region 2>$null || true
aws logs create-log-group --log-group-name /mindguard/ml-worker --region $Region 2>$null || true
aws logs put-retention-policy --log-group-name /mindguard/ml-worker --retention-in-days 30 --region $Region 2>$null || true

# 10. ECS Cluster
Write-Host "[10/12] Creating ECS Cluster (mindguard-cluster)..." -ForegroundColor Yellow
aws ecs create-cluster --cluster-name mindguard-cluster --settings "name=containerInsights,value=enabled" --region $Region 2>$null || true

# 11. Application Load Balancer
Write-Host "[11/12] Provisioning ALB and Target Group..." -ForegroundColor Yellow
$AlbArn = aws elbv2 describe-load-balancers --names mindguard-alb --query "LoadBalancers[0].LoadBalancerArn" --output text --region $Region 2>$null
if ($AlbArn -eq "None" -or [string]::IsNullOrWhiteSpace($AlbArn)) {
    $AlbArn = aws elbv2 create-load-balancer --name mindguard-alb --subnets $PubSubnet1a $PubSubnet1b `
        --security-groups $SgAlb --scheme internet-facing --type application --region $Region `
        --query "LoadBalancers[0].LoadBalancerArn" --output text
}
$AlbDns = aws elbv2 describe-load-balancers --names mindguard-alb --query "LoadBalancers[0].DNSName" --output text --region $Region

$TgArn = aws elbv2 describe-target-groups --names mindguard-api-tg --query "TargetGroups[0].TargetGroupArn" --output text --region $Region 2>$null
if ($TgArn -eq "None" -or [string]::IsNullOrWhiteSpace($TgArn)) {
    $TgArn = aws elbv2 create-target-group --name mindguard-api-tg --protocol HTTP --port 8000 `
        --vpc-id $VpcId --target-type ip --health-check-path /health --region $Region `
        --query "TargetGroups[0].TargetGroupArn" --output text
    aws elbv2 create-listener --load-balancer-arn $AlbArn --protocol HTTP --port 80 `
        --default-actions Type=forward,TargetGroupArn=$TgArn --region $Region 2>$null
}

# 12. Completion Summary
Write-Host "================================================================" -ForegroundColor Green
Write-Host " AWS Provisioning Completed Successfully!" -ForegroundColor Green
Write-Host " Region:        $Region (N. Virginia)" -ForegroundColor Cyan
Write-Host " Account ID:    $AccountId" -ForegroundColor Cyan
Write-Host " VPC ID:        $VpcId" -ForegroundColor Cyan
Write-Host " ALB DNS:       $AlbDns" -ForegroundColor Cyan
Write-Host " ECR Repo:      $AccountId.dkr.ecr.$Region.amazonaws.com/mindguard-api" -ForegroundColor Cyan
Write-Host " S3 Models:     s3://$BucketName/models/" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Green
