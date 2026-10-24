# MindGuardAI — AWS Production Architecture & Deployment Runbook

**Region**: `us-east-1` (US East - N. Virginia)  
**Stack**: AWS ECS Fargate + RDS PostgreSQL + S3 + Secrets Manager + ALB + AWS Amplify  

---

## 1. Architecture Blueprint (`us-east-1`)

```text
[Students & Counselors]
         |
         v (HTTPS)
   +---------------+
   |  AWS Amplify  |  --> React + TypeScript Single Page App (Global CDN)
   +---------------+
         |
         | (REST API /api/v1)
         v
   +-------------------------------------------------------------+
   |  AWS VPC (10.0.0.0/16) in us-east-1                         |
   |                                                             |
   |  [Public Subnets (us-east-1a / us-east-1b)]                 |
   |     +-------------------------------------------------+     |
   |     |    Application Load Balancer (mindguard-alb)    |     |
   |     +-------------------------------------------------+     |
   |                              |                              |
   |  [Private Subnets (us-east-1a / us-east-1b)]                |
   |     +----------------------+     +--------------------+     |
   |     | ECS Fargate API      |     | ECS Fargate ML     |     |
   |     | (FastAPI + Uvicorn)  |     | (Worker)           |     |
   |     +----------------------+     +--------------------+     |
   |                |                            |               |
   |                v                            v               |
   |     +-------------------------------------------------+     |
   |     |          RDS PostgreSQL (db.t3.micro)           |     |
   |     +-------------------------------------------------+     |
   |                                                             |
   |  [Supporting Managed Services]                              |
   |     - AWS S3: Model weights storage                         |
   |     - AWS Secrets Manager: DB Credentials & JWT Secret      |
   |     - Amazon CloudWatch: Logs, Metrics & Alarms             |
   |     - Amazon SES: Crisis Triage Alerts (SMTP in us-east-1)  |
   +-------------------------------------------------------------+
```

---

## 2. Directory Structure

```text
mindguard/
├── amplify.yml                          # AWS Amplify build & deployment configuration
├── .github/
│   └── workflows/
│       └── deploy.yml                   # CI/CD GitHub Actions for ECR & ECS
├── backend/
│   ├── Dockerfile                       # Multi-stage production container with awscli & healthcheck
│   ├── entrypoint.sh                    # Container bootstrapper (S3 model sync + alembic migrations)
│   └── requirements.txt                 # Includes boto3>=1.28.0 for AWS SDK
└── infrastructure/
    ├── setup_aws_us_east_1.ps1          # 1-click automated PowerShell provisioning script
    ├── ecs-tasks/
    │   ├── mindguard-api-task.json      # ECS Task Definition for FastAPI service
    │   └── mindguard-ml-task.json       # ECS Task Definition for ML worker service
    ├── cloudwatch/
    │   └── dashboard.json               # CloudWatch dashboard metrics
    └── budget/
        ├── budget.json                  # $5.00 safety alert budget
        └── notifications.json           # Email threshold notifications
```

---

## 3. How to Deploy (Step-by-Step)

### Step 1: Automated Infrastructure Provisioning (One Command)

Open PowerShell as Administrator and run:
```powershell
# Run the automated provisioning script in us-east-1
.\infrastructure\setup_aws_us_east_1.ps1 -DbPassword "YourSecurePassword2026!" -AlertEmail "your-email@campus.edu"
```
This automatically configures your VPC, subnets, route tables, security groups, RDS PostgreSQL, ECR repository, S3 model bucket, Secrets Manager, and ALB in `us-east-1`.

### Step 2: Push Initial Backend Image to ECR

```powershell
$ACCOUNT_ID = (aws sts get-caller-identity --query "Account" --output text)
$REGION = "us-east-1"

# Authenticate Docker to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

# Build and Push Backend Image
docker build -t "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/mindguard-api:latest" ./backend
docker push "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/mindguard-api:latest"
```

### Step 3: Register ECS Tasks & Launch Service

```powershell
# Substitute <ACCOUNT_ID> in task definitions
(Get-Content .\infrastructure\ecs-tasks\mindguard-api-task.json) -replace '<ACCOUNT_ID>', $ACCOUNT_ID | Set-Content .\infrastructure\ecs-tasks\mindguard-api-task-rendered.json

aws ecs register-task-definition --cli-input-json file://infrastructure/ecs-tasks/mindguard-api-task-rendered.json --region $REGION

# Create ECS Service attached to the ALB Target Group
$SUBNET_1A = (aws ec2 describe-subnets --filters "Name=tag:Name,Values=mindguard-private-subnet-1a" --query "Subnets[0].SubnetId" --output text --region $REGION)
$SUBNET_1B = (aws ec2 describe-subnets --filters "Name=tag:Name,Values=mindguard-private-subnet-1b" --query "Subnets[0].SubnetId" --output text --region $REGION)
$SG_API = (aws ec2 describe-security-groups --filters "Name=group-name,Values=sg-api" --query "SecurityGroups[0].GroupId" --output text --region $REGION)
$TG_ARN = (aws elbv2 describe-target-groups --names mindguard-api-tg --query "TargetGroups[0].TargetGroupArn" --output text --region $REGION)

aws ecs create-service `
    --cluster mindguard-cluster `
    --service-name mindguard-api-service `
    --task-definition mindguard-api `
    --desired-count 2 `
    --launch-type FARGATE `
    --load-balancers "targetGroupArn=$TG_ARN,containerName=mindguard-api,containerPort=8000" `
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1A,$SUBNET_1B],securityGroups=[$SG_API],assignPublicIp=DISABLED}" `
    --region $REGION
```

### Step 4: Deploy Frontend to AWS Amplify

1. Push your repository to GitHub (`PASUPULASAITEJA/MindGuardAI`).
2. Go to the [AWS Amplify Console](https://console.aws.amazon.com/amplify/home?region=us-east-1).
3. Click **Host web app** -> Choose **GitHub** -> Select `PASUPULASAITEJA/MindGuardAI` branch `main`.
4. Amplify will automatically detect the [amplify.yml](file:///d:/mindguard/amplify.yml) file in the root.
5. In **Environment variables**, add:
   - `VITE_API_URL` = `http://<YOUR_ALB_DNS_NAME>/api/v1` (or HTTPS domain once configured).
6. Click **Save and Deploy**. Your frontend will be live worldwide on `https://main.<id>.amplifyapp.com`!

---

## 4. Operational Best Practices in `us-east-1`

- **S3 Bucket Creation**: `us-east-1` does not accept a `LocationConstraint` parameter when invoking `create-bucket`.
- **SES SMTP Endpoint**: `email-smtp.us-east-1.amazonaws.com` on Port `587` with STARTTLS.
- **Cost Protection**: The included budget template alerts you if projected spending crosses **$5.00/month**.
