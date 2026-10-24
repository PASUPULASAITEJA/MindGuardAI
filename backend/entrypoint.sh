#!/bin/bash
set -e

# Default AWS region to us-east-1 (N. Virginia)
export AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:-"us-east-1"}

echo "=================================================="
echo "MindGuardAI Backend Starting in us-east-1"
echo "=================================================="

# Sync ML models from S3 if bucket is configured
if [ -n "$S3_MODEL_BUCKET" ]; then
    echo "==> Syncing ML models from S3 bucket: s3://${S3_MODEL_BUCKET}/models/..."
    mkdir -p /app/app/ml/models
    aws s3 sync "s3://${S3_MODEL_BUCKET}/models/" /app/app/ml/models/ --region "$AWS_DEFAULT_REGION" || {
        echo "Warning: S3 model sync failed or bucket is empty. Using local model fallback."
    }
else
    echo "==> S3_MODEL_BUCKET not specified. Using bundled ML models."
fi

# Run database migrations if requested
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "==> Executing Alembic database migrations (upgrade head)..."
    alembic upgrade head
fi

echo "==> Starting application process: $@"
exec "$@"
