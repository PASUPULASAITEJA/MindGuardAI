#!/usr/bin/env python3
"""
MindGuard AI — Automated AWS EC2 One-Click Deployment Script
Uses boto3 to provision a secure EC2 instance, configure security groups,
and bootstrap the full MindGuard AI Docker application stack automatically.
"""

import sys
import os
import time
import argparse
from pathlib import Path

try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError
except ImportError:
    print("Error: boto3 is required. Run 'pip install boto3'")
    sys.exit(1)


def parse_args():
    parser = argparse.ArgumentParser(description="Automated AWS Deployment for MindGuard AI")
    parser.add_argument("--access-key", default=os.getenv("AWS_ACCESS_KEY_ID"), help="AWS Access Key ID")
    parser.add_argument("--secret-key", default=os.getenv("AWS_SECRET_ACCESS_KEY"), help="AWS Secret Access Key")
    parser.add_argument("--region", default=os.getenv("AWS_DEFAULT_REGION", "ap-south-1"), help="AWS Region (default: ap-south-1 Mumbai or us-east-1)")
    parser.add_argument("--instance-type", default="t3.micro", help="EC2 Instance Type (default: t3.micro for Free Tier)")
    parser.add_argument("--key-name", default=None, help="Existing EC2 Key Pair name (optional)")
    return parser.parse_args()


def get_ec2_client_and_resource(args):
    session = boto3.Session(
        aws_access_key_id=args.access_key,
        aws_secret_access_key=args.secret_key,
        region_name=args.region
    )
    sts = session.client("sts")
    identity = sts.get_caller_identity()
    print(f"[AWS Auth] Connected as IAM Account: {identity.get('Account')} | ARN: {identity.get('Arn')}")
    return session.client("ec2"), session.resource("ec2")


def get_or_create_security_group(ec2_client, ec2_resource, vpc_id=None):
    sg_name = "mindguard-ai-production-sg"
    description = "Security group for MindGuard AI Web, API, and SSH access"

    try:
        sgs = ec2_client.describe_security_groups(
            Filters=[{"Name": "group-name", "Values": [sg_name]}]
        )
        if sgs["SecurityGroups"]:
            sg_id = sgs["SecurityGroups"][0]["GroupId"]
            print(f"[Security Group] Found existing security group: {sg_id} ({sg_name})")
            return sg_id
    except ClientError:
        pass

    print(f"[Security Group] Creating new security group: {sg_name}...")
    create_kwargs = {"GroupName": sg_name, "Description": description}
    if vpc_id:
        create_kwargs["VpcId"] = vpc_id

    sg_res = ec2_client.create_security_group(**create_kwargs)
    sg_id = sg_res["GroupId"]

    # Authorize ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 8000 (FastAPI API)
    ip_permissions = [
        {"IpProtocol": "tcp", "FromPort": 22, "ToPort": 22, "IpRanges": [{"CidrIp": "0.0.0.0/0", "Description": "SSH Admin Access"}]},
        {"IpProtocol": "tcp", "FromPort": 80, "ToPort": 80, "IpRanges": [{"CidrIp": "0.0.0.0/0", "Description": "HTTP Web Access"}]},
        {"IpProtocol": "tcp", "FromPort": 443, "ToPort": 443, "IpRanges": [{"CidrIp": "0.0.0.0/0", "Description": "HTTPS Secure Web Access"}]},
        {"IpProtocol": "tcp", "FromPort": 8000, "ToPort": 8000, "IpRanges": [{"CidrIp": "0.0.0.0/0", "Description": "FastAPI Direct Ingress"}]},
    ]
    ec2_client.authorize_security_group_ingress(GroupId=sg_id, IpPermissions=ip_permissions)
    print(f"[Security Group] Successfully configured ingress rules on {sg_id}")
    return sg_id


def find_latest_ubuntu_ami(ec2_client):
    print("[AMI Search] Locating latest official Canonical Ubuntu 22.04 LTS AMI...")
    response = ec2_client.describe_images(
        Filters=[
            {"Name": "name", "Values": ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]},
            {"Name": "state", "Values": ["available"]},
            {"Name": "architecture", "Values": ["x86_64"]}
        ],
        Owners=["099720109477"]  # Canonical official owner ID
    )
    images = sorted(response["Images"], key=lambda x: x["CreationDate"], reverse=True)
    if not images:
        raise RuntimeError("No suitable Ubuntu 22.04 AMI found in this region.")
    ami_id = images[0]["ImageId"]
    print(f"[AMI Search] Selected AMI: {ami_id} ({images[0]['Name']})")
    return ami_id


def read_user_data_script():
    script_path = Path(__file__).resolve().parent / "aws_bootstrap.sh"
    if not script_path.exists():
        raise FileNotFoundError(f"Bootstrap script not found at {script_path}")
    with open(script_path, "r", encoding="utf-8") as f:
        return f.read()


def launch_instance(ec2_client, ec2_resource, args):
    ami_id = find_latest_ubuntu_ami(ec2_client)
    sg_id = get_or_create_security_group(ec2_client, ec2_resource)
    user_data = read_user_data_script()

    run_kwargs = {
        "ImageId": ami_id,
        "InstanceType": args.instance_type,
        "MinCount": 1,
        "MaxCount": 1,
        "SecurityGroupIds": [sg_id],
        "UserData": user_data,
        "BlockDeviceMappings": [
            {
                "DeviceName": "/dev/sda1",
                "Ebs": {
                    "VolumeSize": 30,  # 30 GB SSD for Docker containers and ML models
                    "VolumeType": "gp3",
                    "DeleteOnTermination": True
                }
            }
        ],
        "TagSpecifications": [
            {
                "ResourceType": "instance",
                "Tags": [
                    {"Key": "Name", "Value": "MindGuardAI-Production-Server"},
                    {"Key": "Project", "Value": "MindGuardAI"},
                    {"Key": "Environment", "Value": "Production"}
                ]
            }
        ]
    }

    if args.key_name:
        run_kwargs["KeyName"] = args.key_name

    print(f"[EC2 Launch] Launching {args.instance_type} instance in {args.region}...")
    instance_res = ec2_resource.create_instances(**run_kwargs)[0]
    instance_id = instance_res.id
    print(f"[EC2 Launch] Instance created with ID: {instance_id}. Waiting for instance to start running...")

    instance_res.wait_until_running()
    instance_res.reload()

    public_ip = instance_res.public_ip_address
    public_dns = instance_res.public_dns_name

    print("\n" + "=" * 70)
    print("🚀 MINDGUARD AI AWS DEPLOYMENT INITIATED SUCCESSFULLY!")
    print("=" * 70)
    print(f"Instance ID:    {instance_id}")
    print(f"Region:         {args.region}")
    print(f"Public IPv4:    {public_ip}")
    print(f"Public DNS:     {public_dns}")
    print(f"\nLive Application URL:  http://{public_ip}/")
    print(f"API Documentation:     http://{public_ip}/docs")
    print("=" * 70)
    print("\n[Note on Bootstrap Progress]")
    print("The EC2 server is currently running the cloud-init bootstrap script:")
    print("  1. Installing Docker & Docker Compose...")
    print("  2. Pulling and building MindGuard AI containers...")
    print("  3. Starting Nginx reverse proxy on port 80...")
    print("\nThis process takes approximately 3 to 4 minutes to complete.")
    print(f"You can monitor live progress anytime via SSH:")
    print(f"  ssh -i <your-key.pem> ubuntu@{public_ip} 'sudo tail -f /var/log/mindguard_deploy.log'")
    print("=" * 70 + "\n")

    return public_ip


def main():
    args = parse_args()

    if not args.access_key or not args.secret_key:
        print("\n" + "!" * 70)
        print("AWS Credentials Required!")
        print("!" * 70)
        print("Please provide your AWS credentials:")
        print("  Option 1: Pass them as arguments:")
        print("    python scripts/deploy_to_aws.py --access-key AKIA... --secret-key wJalr... --region ap-south-1")
        print("\n  Option 2: Set environment variables:")
        print("    $env:AWS_ACCESS_KEY_ID = 'AKIA...'")
        print("    $env:AWS_SECRET_ACCESS_KEY = 'wJalr...'")
        print("    $env:AWS_DEFAULT_REGION = 'ap-south-1'")
        print("    python scripts/deploy_to_aws.py")
        print("!" * 70 + "\n")
        sys.exit(1)

    try:
        ec2_client, ec2_resource = get_ec2_client_and_resource(args)
        launch_instance(ec2_client, ec2_resource, args)
    except Exception as e:
        print(f"\n[Deployment Error] {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
