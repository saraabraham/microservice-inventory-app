#!/bin/bash
set -e
echo "Creating Kubernetes deployment files..."

# ── 1. Stats Service ──────────────────────────────────────────────────────────
mkdir -p stats-service

cat > stats-service/StatsService.csproj << 'EOF'
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
</Project>
EOF

cat > stats-service/Program.cs << 'EOF'
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var inventoryApiUrl = Environment.GetEnvironmentVariable("INVENTORY_API_URL")
    ?? "http://localhost:8080";

builder.Services.AddHttpClient("inventory", client =>
{
    client.BaseAddress = new Uri(inventoryApiUrl);
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowAll");

app.MapGet("/api/stats", async (IHttpClientFactory httpClientFactory) =>
{
    var client = httpClientFactory.CreateClient("inventory");
    var products = await client.GetFromJsonAsync<List<Product>>("/api/products");
    if (products == null) return Results.Problem("Could not fetch products from InventoryAPI");

    var stats = new
    {
        TotalProducts = products.Count,
        TotalStockUnits = products.Sum(p => p.StockQuantity),
        TotalStockValue = products.Sum(p => p.Price * p.StockQuantity),
        LowStockCount = products.Count(p => p.StockQuantity <= p.MinimumStock),
        Categories = products
            .GroupBy(p => p.Category)
            .Select(g => new { Category = g.Key, Count = g.Count(), TotalStock = g.Sum(p => p.StockQuantity) })
            .OrderByDescending(c => c.Count)
            .ToList()
    };
    return Results.Ok(stats);
})
.WithName("GetStats").WithOpenApi();

app.MapGet("/api/stats/health", () => Results.Ok(new { Status = "Healthy", Service = "StatsService" }))
.WithName("Health").WithOpenApi();

app.Run();

record Product(int Id, string SKU, string Name, string Category, decimal Price, int StockQuantity, int MinimumStock);
EOF

cat > stats-service/Dockerfile << 'EOF'
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY StatsService.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "StatsService.dll"]
EOF

# ── 2. InventoryAPI changes ───────────────────────────────────────────────────
cat > backend/InventoryAPI/Dockerfile << 'EOF'
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY InventoryAPI.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "InventoryAPI.dll"]
EOF

cat > backend/InventoryAPI/appsettings.json << 'EOF'
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=inventorydb;Username=postgres;Password=postgres"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
EOF

cat > backend/InventoryAPI/InventoryAPI.csproj << 'EOF'
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="AutoMapper.Extensions.Microsoft.DependencyInjection" Version="12.0.1" />
    <PackageReference Include="FluentValidation.AspNetCore" Version="11.3.1" />
    <PackageReference Include="Microsoft.AspNetCore.Cors" Version="2.3.0" />
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="8.0.15" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.0">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.0.10" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="8.0.0">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.6.2" />
  </ItemGroup>
</Project>
EOF

cat > backend/InventoryAPI/Program.cs << 'EOF'
using Microsoft.EntityFrameworkCore;
using InventoryAPI.Data;
using InventoryAPI.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<IProductRepository, ProductRepository>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.EnsureCreated();
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();
app.Run();
EOF

# Delete old SQL Server migrations
rm -rf backend/InventoryAPI/Migrations

# ── 3. Frontend ───────────────────────────────────────────────────────────────
cat > frontend/inventory-client/Dockerfile << 'EOF'
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
EOF

cat > frontend/inventory-client/nginx.conf << 'EOF'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

cat > frontend/inventory-client/.env.production << 'EOF'
REACT_APP_API_URL=http://localhost:30081/api
DISABLE_ESLINT_PLUGIN=true
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
EOF

# ── 4. Kubernetes YAMLs ───────────────────────────────────────────────────────
mkdir -p k8s

cat > k8s/postgres.yaml << 'EOF'
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 1
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
          image: postgres:16
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_DB
              value: inventorydb
            - name: POSTGRES_USER
              value: postgres
            - name: POSTGRES_PASSWORD
              value: postgres
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/postgresql/data
      volumes:
        - name: postgres-storage
          persistentVolumeClaim:
            claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
EOF

cat > k8s/inventory-api.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inventory-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: inventory-api
  template:
    metadata:
      labels:
        app: inventory-api
    spec:
      containers:
        - name: inventory-api
          image: YOUR_DOCKERHUB_USERNAME/inventory-api:latest
          ports:
            - containerPort: 8080
          env:
            - name: ConnectionStrings__DefaultConnection
              value: "Host=postgres;Port=5432;Database=inventorydb;Username=postgres;Password=postgres"
---
apiVersion: v1
kind: Service
metadata:
  name: inventory-api
spec:
  type: NodePort
  selector:
    app: inventory-api
  ports:
    - port: 80
      targetPort: 8080
      nodePort: 30081
EOF

cat > k8s/stats-service.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stats-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: stats-service
  template:
    metadata:
      labels:
        app: stats-service
    spec:
      containers:
        - name: stats-service
          image: YOUR_DOCKERHUB_USERNAME/stats-service:latest
          ports:
            - containerPort: 8080
          env:
            - name: INVENTORY_API_URL
              value: "http://inventory-api"
---
apiVersion: v1
kind: Service
metadata:
  name: stats-service
spec:
  type: NodePort
  selector:
    app: stats-service
  ports:
    - port: 80
      targetPort: 8080
      nodePort: 30082
EOF

cat > k8s/frontend.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: YOUR_DOCKERHUB_USERNAME/inventory-frontend:latest
          ports:
            - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
spec:
  type: NodePort
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 80
      nodePort: 30080
EOF

# ── 5. Docker Compose ─────────────────────────────────────────────────────────
cat > docker-compose.yml << 'EOF'
version: "3.9"
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: inventorydb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  inventory-api:
    build: ./backend/InventoryAPI
    ports:
      - "8080:8080"
    environment:
      ConnectionStrings__DefaultConnection: "Host=postgres;Port=5432;Database=inventorydb;Username=postgres;Password=postgres"
    depends_on:
      - postgres

  stats-service:
    build: ./stats-service
    ports:
      - "8081:8080"
    environment:
      INVENTORY_API_URL: "http://inventory-api:8080"
    depends_on:
      - inventory-api

  frontend:
    build: ./frontend/inventory-client
    ports:
      - "3000:80"
    depends_on:
      - inventory-api

volumes:
  postgres-data:
EOF

cat > .gitignore << 'EOF'
bin/
obj/
*.user
*.db
*.db-shm
*.db-wal
publish/
deploy.zip
node_modules/
npm-debug.log*
build/
.env.local
.DS_Store
EOF

echo ""
echo "✅ All files created. Now open k8s/inventory-api.yaml, k8s/stats-service.yaml"
echo "   and k8s/frontend.yaml and replace YOUR_DOCKERHUB_USERNAME with your username."
