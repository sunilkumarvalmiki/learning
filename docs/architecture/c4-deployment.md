# C4 Model: Deployment Diagram

## Overview

The Deployment diagram shows how the system is deployed to infrastructure, including servers, containers, and networking.

## Deployment Options

The AI Knowledge Management System supports three deployment models:
1. **Local Development** - Single machine with Docker Compose
2. **Self-Hosted** - On-premises or private cloud with Kubernetes
3. **Cloud SaaS** - Multi-tenant cloud deployment

## 1. Local Development Deployment

```mermaid
C4Deployment
    title Deployment Diagram - Local Development

    Deployment_Node(laptop, "Developer Laptop", "macOS/Windows/Linux") {
        Deployment_Node(docker, "Docker Desktop", "Docker 24+") {
            Container(web_app, "Web App", "Next.js Dev Server", "localhost:3000")
            Container(api, "API Gateway", "Node.js", "localhost:8080")
            Container(postgres, "PostgreSQL", "PostgreSQL 15", "localhost:5432")
            Container(qdrant, "Qdrant", "Qdrant", "localhost:6333")
            Container(redis, "Redis", "Redis 7", "localhost:6379")
            Container(minio, "MinIO", "MinIO", "localhost:9000")
            Container(nats, "NATS", "NATS", "localhost:4222")
        }
    }

    Rel(web_app, api, "API calls", "HTTP")
    Rel(api, postgres, "SQL", "TCP")
    Rel(api, qdrant, "Vector search", "HTTP")
    Rel(api, redis, "Cache", "Redis Protocol")
    Rel(api, minio, "File storage", "S3 API")
    Rel(api, nats, "Async jobs", "NATS")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

### Docker Compose Configuration

**File**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: knowledge_user
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: knowledge_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  nats:
    image: nats:latest
    ports:
      - "4222:4222"
      - "8222:8222"

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: development
      PORT: 8080
      DATABASE_URL: postgres://knowledge_user:dev_password@postgres:5432/knowledge_db
      REDIS_URL: redis://redis:6379
      QDRANT_URL: http://qdrant:6333
      MINIO_ENDPOINT: minio:9000
      NATS_URL: nats://nats:4222
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis
      - qdrant
      - minio
      - nats
    volumes:
      - ./backend:/app
      - /app/node_modules

volumes:
  postgres_data:
  qdrant_data:
  redis_data:
  minio_data:
```

**Usage**:
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down

# Clean volumes (CAUTION: deletes data)
docker-compose down -v
```

## 2. Self-Hosted Kubernetes Deployment

```mermaid
C4Deployment
    title Deployment Diagram - Self-Hosted Kubernetes

    Deployment_Node(k8s_cluster, "Kubernetes Cluster", "K8s 1.28+") {
        Deployment_Node(ingress, "Ingress Layer") {
            Container(traefik, "Traefik", "Ingress Controller", "Load balancer + SSL")
        }

        Deployment_Node(app_layer, "Application Layer") {
            Container(api_pod1, "API Gateway Pod 1", "Node.js")
            Container(api_pod2, "API Gateway Pod 2", "Node.js")
            Container(api_pod3, "API Gateway Pod 3", "Node.js")
            Container(worker_pod1, "Worker Pod 1", "Processing Service")
            Container(worker_pod2, "Worker Pod 2", "Processing Service")
        }

        Deployment_Node(data_layer, "Data Layer") {
            ContainerDb(postgres_primary, "PostgreSQL Primary", "StatefulSet")
            ContainerDb(postgres_replica, "PostgreSQL Replica", "StatefulSet")
            ContainerDb(qdrant_node1, "Qdrant Node 1", "StatefulSet")
            ContainerDb(qdrant_node2, "Qdrant Node 2", "StatefulSet")
            ContainerDb(redis_cluster, "Redis Cluster", "StatefulSet")
        }

        Deployment_Node(storage_layer, "Storage Layer") {
            Container(minio_cluster, "MinIO Cluster", "Distributed mode, 4+ nodes")
        }
    }

    Deployment_Node(users, "Users", "Internet") {
        Container(browser, "Web Browser", "")
        Container(desktop, "Desktop App", "")
    }

    Rel(browser, traefik, "HTTPS", "443")
    Rel(desktop, traefik, "HTTPS", "443")
    Rel(traefik, api_pod1, "HTTP", "8080")
    Rel(traefik, api_pod2, "HTTP", "8080")
    Rel(traefik, api_pod3, "HTTP", "8080")

    Rel(api_pod1, postgres_primary, "SQL", "5432")
    Rel(api_pod1, qdrant_node1, "gRPC", "6334")
    Rel(api_pod1, redis_cluster, "Redis", "6379")
    Rel(api_pod1, minio_cluster, "S3 API", "9000")

    Rel(worker_pod1, postgres_primary, "SQL", "5432")
    Rel(worker_pod1, qdrant_node1, "gRPC", "6334")
    Rel(worker_pod1, minio_cluster, "S3 API", "9000")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="2")
```

### Kubernetes Manifests

#### API Gateway Deployment

**File**: `k8s/api-gateway-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: knowledge-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api
        image: knowledge-system/api-gateway:1.0.0
        ports:
        - containerPort: 8080
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "8080"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: connection-string
        - name: REDIS_URL
          value: "redis://redis-cluster:6379"
        - name: QDRANT_URL
          value: "http://qdrant:6333"
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: openai-credentials
              key: api-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: knowledge-system
spec:
  selector:
    app: api-gateway
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: ClusterIP

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: knowledge-system
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

#### PostgreSQL StatefulSet

**File**: `k8s/postgres-statefulset.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-config
  namespace: knowledge-system
data:
  POSTGRES_DB: knowledge_db
  POSTGRES_USER: knowledge_user

---
apiVersion: v1
kind: Secret
metadata:
  name: postgres-credentials
  namespace: knowledge-system
type: Opaque
stringData:
  password: <base64-encoded-password>
  connection-string: postgres://knowledge_user:<password>@postgres-primary:5432/knowledge_db

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: knowledge-system
spec:
  serviceName: postgres
  replicas: 2
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        envFrom:
        - configMapRef:
            name: postgres-config
        env:
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: password
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: "fast-ssd"
      resources:
        requests:
          storage: 50Gi

---
apiVersion: v1
kind: Service
metadata:
  name: postgres-primary
  namespace: knowledge-system
spec:
  selector:
    app: postgres
    role: primary
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
```

#### Ingress Configuration

**File**: `k8s/ingress.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: knowledge-system-ingress
  namespace: knowledge-system
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    traefik.ingress.kubernetes.io/router.middlewares: default-compress@kubernetescrd,default-rate-limit@kubernetescrd
spec:
  ingressClassName: traefik
  tls:
  - hosts:
    - api.knowledge-system.com
    - app.knowledge-system.com
    secretName: knowledge-system-tls
  rules:
  - host: api.knowledge-system.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 80
  - host: app.knowledge-system.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-app
            port:
              number: 80
```

### Monitoring & Observability

#### Prometheus Metrics

```yaml
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: api-gateway-metrics
  namespace: knowledge-system
spec:
  selector:
    matchLabels:
      app: api-gateway
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
```

#### Grafana Dashboards

Key metrics to monitor:
- **API Gateway**: Request rate, response time (p50, p95, p99), error rate
- **Processing Queue**: Queue depth, processing time, failure rate
- **Database**: Connection pool usage, query time, cache hit rate
- **Vector DB**: Search latency, index size, memory usage
- **Storage**: Disk usage, upload/download bandwidth

## 3. Cloud SaaS Deployment

```mermaid
C4Deployment
    title Deployment Diagram - Cloud SaaS (AWS)

    Deployment_Node(aws, "AWS Cloud", "us-east-1") {
        Deployment_Node(cloudfront, "CloudFront CDN", "Edge Locations") {
            Container(cdn, "CDN", "Static assets, API cache")
        }

        Deployment_Node(alb, "Application Load Balancer") {
            Container(lb, "ALB", "SSL termination, routing")
        }

        Deployment_Node(ecs, "ECS Fargate Cluster") {
            Container(api_task1, "API Task 1", "Fargate")
            Container(api_task2, "API Task 2", "Fargate")
            Container(api_task3, "API Task 3", "Fargate")
            Container(worker_task1, "Worker Task 1", "Fargate")
            Container(worker_task2, "Worker Task 2", "Fargate")
        }

        Deployment_Node(rds, "RDS Multi-AZ") {
            ContainerDb(postgres_primary, "PostgreSQL Primary", "db.r5.xlarge")
            ContainerDb(postgres_replica, "PostgreSQL Replica", "db.r5.xlarge")
        }

        Deployment_Node(elasticache, "ElastiCache") {
            ContainerDb(redis, "Redis Cluster", "cache.r5.large")
        }

        Deployment_Node(s3, "S3") {
            Container(uploads_bucket, "Uploads Bucket", "S3 Standard")
            Container(backups_bucket, "Backups Bucket", "S3 Glacier")
        }

        Deployment_Node(ec2_qdrant, "EC2 Auto Scaling Group") {
            ContainerDb(qdrant1, "Qdrant Instance 1", "c5.2xlarge")
            ContainerDb(qdrant2, "Qdrant Instance 2", "c5.2xlarge")
        }
    }

    System_Ext(users, "Users", "Global")

    Rel(users, cloudfront, "HTTPS", "443")
    Rel(cloudfront, alb, "HTTP", "80")
    Rel(alb, api_task1, "HTTP", "8080")
    Rel(alb, api_task2, "HTTP", "8080")
    Rel(alb, api_task3, "HTTP", "8080")

    Rel(api_task1, postgres_primary, "SQL", "5432")
    Rel(api_task1, redis, "Redis", "6379")
    Rel(api_task1, qdrant1, "gRPC", "6334")
    Rel(api_task1, uploads_bucket, "S3 API", "443")

    Rel(worker_task1, postgres_primary, "SQL", "5432")
    Rel(worker_task1, qdrant1, "gRPC", "6334")
    Rel(worker_task1, uploads_bucket, "S3 API", "443")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="2")
```

### AWS Infrastructure

#### ECS Task Definition

```json
{
  "family": "api-gateway",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/api-gateway:1.0.0",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "8080"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:database-url"
        },
        {
          "name": "OPENAI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:openai-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/api-gateway",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

#### Terraform Configuration

**File**: `terraform/main.tf`

```hcl
provider "aws" {
  region = "us-east-1"
}

# VPC
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "knowledge-system-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  enable_vpn_gateway = false
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier           = "knowledge-system-db"
  engine               = "postgres"
  engine_version       = "15.3"
  instance_class       = "db.r5.xlarge"
  allocated_storage    = 100
  storage_type         = "gp3"
  storage_encrypted    = true

  db_name  = "knowledge_db"
  username = "knowledge_user"
  password = var.db_password

  multi_az               = true
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  skip_final_snapshot = false
  final_snapshot_identifier = "knowledge-system-final-snapshot"
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "knowledge-system-cache"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = "cache.r5.large"
  num_cache_nodes      = 2
  parameter_group_name = "default.redis7"
  port                 = 6379

  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
}

# S3 Buckets
resource "aws_s3_bucket" "uploads" {
  bucket = "knowledge-system-uploads"

  versioning {
    enabled = true
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  lifecycle_rule {
    enabled = true

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 365
      storage_class = "GLACIER"
    }
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "knowledge-system-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECS Service - API Gateway
resource "aws_ecs_service" "api_gateway" {
  name            = "api-gateway"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api_gateway.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.https]
}

# Auto Scaling
resource "aws_appautoscaling_target" "api_gateway" {
  max_capacity       = 10
  min_capacity       = 3
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api_gateway.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "api_gateway_cpu" {
  name               = "api-gateway-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api_gateway.resource_id
  scalable_dimension = aws_appautoscaling_target.api_gateway.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api_gateway.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}
```

### Cost Optimization

**Monthly Costs** (AWS us-east-1, 10K active users):

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **ECS Fargate** | 3 API tasks (0.5 vCPU, 1GB) | $72 |
| **ECS Fargate** | 2 Worker tasks (1 vCPU, 2GB) | $96 |
| **RDS PostgreSQL** | db.r5.xlarge Multi-AZ | $620 |
| **ElastiCache Redis** | cache.r5.large (2 nodes) | $340 |
| **EC2 (Qdrant)** | c5.2xlarge (2 instances) | $488 |
| **S3 Storage** | 500GB uploads | $12 |
| **S3 Requests** | 1M PUT, 10M GET | $5 |
| **CloudFront** | 1TB data transfer | $85 |
| **Application Load Balancer** | ALB + target groups | $23 |
| **Data Transfer** | 500GB out | $45 |
| **CloudWatch Logs** | 100GB logs | $55 |
| **Total** | | **~$1,841/month** |

**Cost per User**: $0.18/month (10K users)

## Infrastructure as Code

### GitOps Workflow

```
Developer → Git Push → GitHub Actions → ArgoCD → Kubernetes Cluster
```

**ArgoCD Application**:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: knowledge-system
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/sunilkumarvalmiki/learning.git
    targetRevision: main
    path: k8s
  destination:
    server: https://kubernetes.default.svc
    namespace: knowledge-system
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## Disaster Recovery

### Backup Strategy

1. **Database Backups**:
   - PostgreSQL: Automated daily backups, 30-day retention
   - Point-in-time recovery: Restore to any moment within last 7 days
   - Cross-region replication to DR region

2. **Object Storage**:
   - S3 versioning enabled
   - Cross-region replication
   - Lifecycle policies (Standard → IA → Glacier)

3. **Configuration**:
   - All configs in Git
   - Secrets in Secrets Manager / Vault
   - Infrastructure as Code (Terraform)

### Recovery Time Objective (RTO) / Recovery Point Objective (RPO)

| Tier | RTO | RPO | Strategy |
|------|-----|-----|----------|
| **Critical** | <1 hour | <5 minutes | Active-active multi-region |
| **High** | <4 hours | <1 hour | Active-passive DR site |
| **Medium** | <24 hours | <24 hours | Backup restore |

## Next Steps

- See [Operations Runbooks](../operations/) for deployment procedures
- See [Monitoring Guide](../operations/monitoring.md) for observability setup
- See [Incident Response](../operations/incident-response.md) for emergency procedures
