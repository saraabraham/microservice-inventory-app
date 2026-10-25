# Inventory Management System

A microservice-based inventory management system built with React, TypeScript, and .NET 8, deployable via Kubernetes.

---

## Architecture Overview

```
Browser
  │
  └─► Frontend (nginx, NodePort 30080)
        │
        ├─► /api/*       ──► InventoryAPI  (ClusterIP :80 → pod :8080)
        │                        │
        │                        └─► PostgreSQL (ClusterIP :5432, PersistentVolume)
        │
        └─► /api/stats   ──► StatsService  (ClusterIP :80 → pod :8080)
                                 │
                                 └─► InventoryAPI (cluster-internal HTTP call)
```

### Microservices

| Service | Language | Role | Port (NodePort) |
|---|---|---|---|
| **InventoryAPI** | C# .NET 8 | Core REST API — products, transactions, suppliers | 30081 |
| **StatsService** | C# .NET 8 | Aggregation service — calls InventoryAPI and returns summary stats | 30082 |
| **Frontend** | React + nginx | SPA served by nginx, which also reverse-proxies API calls | 30080 |
| **PostgreSQL** | postgres:16 | Persistent relational database (not externally exposed) | — |

All three application microservices are horizontally scalable independently (each has its own Kubernetes `Deployment`). The database is intentionally a single replica.

---

## Quick Start

### Option A — Kubernetes (assignment submission)

**Prerequisites:** Docker, kubectl, a running cluster (minikube / Docker Desktop), and a Docker Hub account.

```bash
# 1. Log in to Docker Hub
docker login

# 2. Build, push, and deploy everything
./deploy.sh <your-dockerhub-username>

# 3. Open the app (minikube example)
open http://$(minikube ip):30080
```

The script builds all three images, pushes them to Docker Hub, patches the Kubernetes manifests with your username, and applies them.

### Option B — Docker Compose (local development)

```bash
docker-compose up --build
```

| URL | Service |
|---|---|
| http://localhost:3000 | Frontend |
| http://localhost:8080/swagger | InventoryAPI Swagger |
| http://localhost:8081/swagger | StatsService Swagger |

---

## API Reference

### InventoryAPI (`/api/products`, `/api/transactions`)

| Method | Path | Description |
|---|---|---|
| GET | `/api/products` | List all products |
| GET | `/api/products/{id}` | Get product by ID |
| GET | `/api/products/low-stock` | Products below minimum stock |
| GET | `/api/products/reorder-suggestions` | Smart reorder list |
| GET | `/api/products/export` | CSV export |
| POST | `/api/products` | Create product |
| POST | `/api/products/import` | Bulk CSV import |
| PUT | `/api/products/{id}` | Update product |
| PATCH | `/api/products/{id}/stock` | Adjust stock quantity |
| DELETE | `/api/products/{id}` | Delete product |
| GET | `/api/transactions` | All stock transactions |
| GET | `/api/transactions/product/{id}` | Transactions for one product |
| POST | `/api/transactions` | Record a transaction |

### StatsService (`/api/stats`)

| Method | Path | Description |
|---|---|---|
| GET | `/api/stats` | Aggregated inventory statistics |
| GET | `/api/stats/health` | Health check |

**Sample response from `/api/stats`:**
```json
{
  "totalProducts": 42,
  "totalStockUnits": 3150,
  "totalStockValue": 189420.50,
  "lowStockCount": 5,
  "categories": [
    { "category": "Storage", "count": 12, "totalStock": 900 },
    { "category": "Seating", "count": 8,  "totalStock": 600 }
  ]
}
```

---

## Project Structure

```
├── backend/InventoryAPI/      # Core REST API (.NET 8 + PostgreSQL)
│   ├── Controllers/
│   ├── Models/
│   ├── DTOs/
│   ├── Data/
│   ├── Repositories/
│   └── Dockerfile
├── stats-service/             # Aggregation microservice (.NET 8)
│   ├── Program.cs
│   └── Dockerfile
├── frontend/inventory-client/ # React + TypeScript SPA
│   ├── src/
│   │   ├── components/
│   │   └── services/api.ts    # calls both InventoryAPI and StatsService
│   ├── nginx.conf             # reverse-proxies /api/ and /api/stats
│   └── Dockerfile
├── k8s/
│   ├── postgres.yaml          # PVC + Deployment + ClusterIP Service
│   ├── inventory-api.yaml     # Deployment (2 replicas) + NodePort Service
│   ├── stats-service.yaml     # Deployment (2 replicas) + NodePort Service
│   └── frontend.yaml          # Deployment (2 replicas) + NodePort Service
├── docker-compose.yml         # Local dev
└── deploy.sh                  # One-shot build + push + deploy script
```

---

## Kubernetes Details

- **Persistent storage:** `postgres-pvc` (1 Gi `PersistentVolumeClaim`) — survives pod restarts and redeployments.
- **Secrets:** DB credentials stored in a Kubernetes `Secret` (`postgres-secret`), referenced by env vars in the postgres and inventory-api pods.
- **Health probes:** All application deployments define `readinessProbe` and `livenessProbe` so Kubernetes only routes traffic to healthy pods.
- **Scaling:** To scale a service independently, e.g. `kubectl scale deployment inventory-api --replicas=4`.
- **External access:** NodePort services on 30080 (frontend), 30081 (API), 30082 (stats). In production this would be an `Ingress` controller.

---

## Software Architecture Design

### Component Responsibilities

**InventoryAPI** is the core domain service. It owns all business logic and data persistence: products, suppliers, stock transactions, and reorder logic. It is the single source of truth and the only service that communicates with the database. It exposes a RESTful HTTP API consumed by both the frontend (via the nginx proxy) and by StatsService.

**StatsService** is an aggregation microservice. It holds no state of its own — it calls InventoryAPI at request time, computes summary statistics (total value, low-stock count, category breakdown), and returns them. This separation means the dashboard's stat cards can be scaled and deployed independently of the main API. It demonstrates the *Backend for Frontend (BFF)* cloud pattern: a lightweight service purpose-built for one consumer's data shape.

**Frontend** is a React SPA served by an nginx container. nginx also acts as a reverse proxy, forwarding `/api/stats` to StatsService and all other `/api/` requests to InventoryAPI. This means the browser only ever talks to one origin, avoiding CORS issues and hiding internal service topology.

**PostgreSQL** is a managed, containerised relational database. It is the only stateful component and the only one not designed to scale horizontally. Its data is stored on a Kubernetes `PersistentVolumeClaim` so it survives pod restarts and redeployments.

### Architecture Patterns Used

- **Microservices** — each service is independently deployable, versioned, and scalable.
- **Backend for Frontend (BFF)** — StatsService shapes data specifically for the dashboard, reducing client complexity.
- **API Gateway / Reverse Proxy** — nginx in the frontend pod acts as the single entry point, routing requests and shielding internal addresses.
- **Sidecar-less service mesh (basic)** — inter-service communication is plain HTTP over Kubernetes DNS names (`inventory-api`, `stats-service`), keeping the deployment simple while still being cluster-internal.
- **Persistent Volume** — decouples the database lifecycle from the pod lifecycle, a foundational cloud storage pattern.

### Scalability

The three application services each have independent Kubernetes `Deployment` objects. Any one can be scaled without touching the others:

```bash
kubectl scale deployment inventory-api --replicas=4
kubectl scale deployment stats-service --replicas=6
kubectl scale deployment frontend      --replicas=3
```

The database is intentionally a single replica. Scaling PostgreSQL horizontally requires read replicas or a managed cloud database (e.g. AWS RDS, Google Cloud SQL), which is outside the scope of this project. This limitation is acknowledged below.

---

## Benefits, Challenges, and Security

### Benefits

- **Independent deployability** — a bug fix in StatsService can be deployed without restarting InventoryAPI or the frontend. This reduces deployment risk and downtime.
- **Independent scalability** — if the dashboard is under heavy load, only StatsService needs more replicas. The database, which cannot scale horizontally, is not part of that critical path.
- **Technology flexibility** — each service could be rewritten in a different language without affecting the others, as long as the REST contract is preserved.
- **Resilience** — the frontend gracefully degrades if StatsService is unavailable; stat cards show "Unavailable" while product data from InventoryAPI continues to load.
- **Separation of concerns** — StatsService demonstrates that aggregation and reporting logic can evolve independently of the core domain service.

### Challenges

- **Distributed system complexity** — a request to the dashboard now involves three hops (browser → nginx → StatsService → InventoryAPI). Debugging failures requires checking logs across multiple pods.
- **Database as a single point of failure** — all microservices ultimately depend on one PostgreSQL instance. If it goes down, the entire application fails. A production deployment would use a managed database with automatic failover.
- **Network latency** — StatsService makes a synchronous HTTP call to InventoryAPI on every `/api/stats` request. Under high load, this amplifies the call volume on InventoryAPI. Caching or an event-driven approach (e.g. a message queue) would mitigate this.
- **No service discovery or circuit breaking** — if InventoryAPI is slow, StatsService will block waiting for it. A production system would add a circuit breaker (e.g. Polly in .NET) to fail fast and return a cached response.

### Security

#### Identified Issues

1. **Database credentials in Kubernetes Secret** — credentials are stored in a `Secret` object (`postgres-secret`), which is base64-encoded but not encrypted at rest by default in Kubernetes. Anyone with access to the cluster can read them with `kubectl get secret`.
2. **No TLS / HTTPS** — all traffic (browser → nginx, nginx → backend, StatsService → InventoryAPI) is plain HTTP. An attacker with network access could intercept or modify requests.
3. **No authentication or authorisation** — the REST APIs are entirely open. Any client inside the cluster can call InventoryAPI or StatsService without credentials.
4. **NodePort external exposure** — NodePort services are exposed on all cluster nodes. In a cloud environment this means all node IPs on those ports are reachable from the internet unless firewalled.
5. **StatsService trusts InventoryAPI unconditionally** — there is no mutual TLS or token validation between the two services.

#### Mitigations Applied

- **Kubernetes Secret** used for DB credentials rather than hard-coding them in the deployment YAML or container images.
- **PostgreSQL is ClusterIP only** — the database is not exposed outside the cluster at all; only InventoryAPI can reach it.
- **nginx reverse proxy** hides internal service names and ports from the browser.

#### Mitigations Recommended for Production

- **Encrypt Secrets at rest** using a KMS provider (e.g. AWS KMS, HashiCorp Vault with the Kubernetes secrets engine).
- **Add TLS** via a Kubernetes `Ingress` controller with cert-manager (Let's Encrypt) to terminate HTTPS at the cluster edge.
- **Add authentication** to the REST APIs using JWT tokens (e.g. ASP.NET Core `[Authorize]` with an identity provider).
- **Replace NodePort with Ingress** so only one load-balancer IP is exposed, with proper hostname routing and TLS termination.
- **Add network policies** (`NetworkPolicy` resources) to restrict which pods can communicate with each other — e.g. only InventoryAPI should be allowed to connect to PostgreSQL.
- **Add mutual TLS between services** using a service mesh (e.g. Istio or Linkerd) for zero-trust inter-service authentication.

### Business Case for Cloud / Microservice Architecture

For an inventory management system, the microservice approach provides direct business value:

- **Independent scaling of hot paths** — the stats/reporting API can be scaled during end-of-day reporting without scaling the transactional API, reducing infrastructure cost.
- **Faster release cycles** — teams can ship updates to the frontend or StatsService without coordinating a full-system release, reducing time-to-market.
- **Resilience** — a crash in the stats aggregation service does not take down order processing. In a retail context this is critical: lost sales cost more than a missing dashboard widget.
- **Vendor flexibility** — containerised workloads can move between cloud providers (AWS EKS, GCP GKE, Azure AKS) with minimal changes to the Kubernetes manifests.

The system is admittedly small and would not require Kubernetes in a real early-stage deployment. The architecture is designed to demonstrate scalability principles that become essential as data volumes, user load, and team size grow.

---

## Features

- Product CRUD with supplier and warehouse location tracking
- Real-time low-stock alerts
- Stock transaction history (Purchase / Sale / Adjustment / Return)
- Smart reorder suggestions (grouped by supplier, prioritised by urgency)
- Bulk CSV import / export
- Barcode generation (CODE128 from SKU)
- Interactive dashboard with charts — stat cards sourced from **StatsService**, charts from **InventoryAPI**
