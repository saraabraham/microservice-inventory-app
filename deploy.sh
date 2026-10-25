#!/usr/bin/env bash
# deploy.sh — Build, push, and deploy the Inventory Management System to Kubernetes
#
# Usage:
#   ./deploy.sh <dockerhub-username>
#
# Prerequisites:
#   - Docker is running
#   - kubectl is configured and pointing at your cluster (minikube, Docker Desktop, etc.)
#   - You are logged in to Docker Hub: docker login
#
# Example:
#   ./deploy.sh saraab

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <dockerhub-username>"
  exit 1
fi

DOCKERHUB_USER="$1"
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "────────────────────────────────────────────────────────"
echo " Docker Hub user : $DOCKERHUB_USER"
echo " Repo root       : $REPO_ROOT"
echo "────────────────────────────────────────────────────────"

# ── 1. Build & push images ────────────────────────────────────────────────────

echo ""
echo "▶ Building inventory-api …"
docker build -t "$DOCKERHUB_USER/inventory-api:latest" "$REPO_ROOT/backend/InventoryAPI"
docker push "$DOCKERHUB_USER/inventory-api:latest"

echo ""
echo "▶ Building inventory-stats (StatsService) …"
docker build -t "$DOCKERHUB_USER/inventory-stats:latest" "$REPO_ROOT/stats-service"
docker push "$DOCKERHUB_USER/inventory-stats:latest"

echo ""
echo "▶ Building inventory-frontend …"
docker build -t "$DOCKERHUB_USER/inventory-frontend:latest" "$REPO_ROOT/frontend/inventory-client"
docker push "$DOCKERHUB_USER/inventory-frontend:latest"

# ── 2. Patch image names in K8s manifests (sed in-place) ─────────────────────

echo ""
echo "▶ Patching Kubernetes manifests with Docker Hub username …"
for f in "$REPO_ROOT"/k8s/inventory-api.yaml "$REPO_ROOT"/k8s/stats-service.yaml "$REPO_ROOT"/k8s/frontend.yaml; do
  sed -i.bak "s|DOCKERHUB_USERNAME|$DOCKERHUB_USER|g" "$f"
  rm -f "${f}.bak"
done

# ── 3. Apply manifests ────────────────────────────────────────────────────────

echo ""
echo "▶ Applying Kubernetes manifests …"
kubectl apply -f "$REPO_ROOT/k8s/postgres.yaml"

echo "   Waiting for PostgreSQL to become ready …"
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s

kubectl apply -f "$REPO_ROOT/k8s/inventory-api.yaml"
kubectl apply -f "$REPO_ROOT/k8s/stats-service.yaml"
kubectl apply -f "$REPO_ROOT/k8s/frontend.yaml"

# ── 4. Show access info ───────────────────────────────────────────────────────

echo ""
echo "▶ All resources applied. Fetching node IP …"

NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null || echo "localhost")

# minikube users can also run: minikube ip
if command -v minikube &>/dev/null; then
  MINIKUBE_IP=$(minikube ip 2>/dev/null || echo "")
  if [[ -n "$MINIKUBE_IP" ]]; then
    NODE_IP="$MINIKUBE_IP"
  fi
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo " Application is now (or will shortly be) available at:"
echo ""
echo "   Frontend    →  http://$NODE_IP:30080"
echo "   InventoryAPI Swagger  →  http://$NODE_IP:30081/swagger"
echo "   StatsService Swagger  →  http://$NODE_IP:30082/swagger"
echo "   Stats endpoint        →  http://$NODE_IP:30082/api/stats"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Check pod status with:  kubectl get pods"
echo "View logs with:         kubectl logs -l app=inventory-api"
