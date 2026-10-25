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
