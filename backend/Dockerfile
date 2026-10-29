# Multi-stage production Dockerfile for MindGuardAI FastAPI backend
# Stage 1: Build wheel dependencies
FROM python:3.11-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Final lightweight runtime container
FROM python:3.11-slim AS runner

WORKDIR /app

# Install curl (for healthcheck) and unzip (for awscli)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    unzip \
    && curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip -q awscliv2.zip \
    && ./aws/install \
    && rm -rf awscliv2.zip aws /var/lib/apt/lists/*

# Download AWS Lambda Web Adapter directly to bypass ECR Public rate limits
RUN mkdir -p /opt/extensions \
    && curl -Lo /opt/extensions/lambda-adapter https://github.com/awslabs/aws-lambda-web-adapter/releases/latest/download/lambda-adapter-x86_64 \
    && chmod +x /opt/extensions/lambda-adapter
ENV PORT=8000

# Create dedicated non-root application user
RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup -m -s /bin/bash appuser

# Copy installed python libraries from builder
COPY --from=builder /root/.local /home/appuser/.local
ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONPATH=/app
ENV AWS_DEFAULT_REGION=us-east-1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create model directory with appropriate permissions
RUN mkdir -p /app/app/ml/models && chown -R appuser:appgroup /app

# Copy application source code
COPY --chown=appuser:appgroup . /app

# Ensure entrypoint is executable
RUN chmod +x /app/entrypoint.sh 2>/dev/null || true

# Container healthcheck for ECS Target Group and ALB
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

USER appuser

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--workers", "2", "--host", "0.0.0.0", "--port", "8000"]
