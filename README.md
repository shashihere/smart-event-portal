# Smart Event Management Portal - DevOps Deployment Challenge

This repository contains the full source code and DevOps pipeline configuration for the Smart Event Management Portal.

## Architecture

- **Frontend:** React + Vite (Vanilla CSS)
- **Backend:** Node.js + Express
- **Database:** MongoDB
- **Containerization:** Docker
- **Orchestration:** Kubernetes
- **CI/CD:** Jenkins

## Phase 1 - Source Code Management
The codebase is structured logically with `frontend/` and `backend/` directories.

## Phase 2 - Docker
To run locally:
```bash
docker-compose up -d --build
```

## Phase 3 - Kubernetes
To deploy to Kubernetes:
```bash
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

**Scaling:**
```bash
kubectl scale deployment eventportal-frontend --replicas=3
```

**Rolling Update:**
```bash
kubectl set image deployment/eventportal-frontend frontend=username/eventportal-frontend:v2
```

## Phase 4 - Jenkins
The `Jenkinsfile` at the root defines the pipeline. It requires the following credentials in Jenkins:
- `docker-hub-credentials`
- `github-token`

## Innovation Features
1. **Helm Chart Integration:** Simplifies Kubernetes deployment.
2. **Trivy Image Scanning:** Added to the Jenkins pipeline for security.
3. **Pipeline Notifications:** Slack/Discord webhook notifications on pipeline success/failure.
