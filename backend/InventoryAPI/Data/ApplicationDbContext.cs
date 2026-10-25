using Microsoft.EntityFrameworkCore;
using InventoryAPI.Models;

namespace InventoryAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Product> Products { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<StockTransaction> StockTransactions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Product configuration
            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.SKU).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
                entity.HasIndex(e => e.SKU).IsUnique();

                entity.HasOne(e => e.Supplier)
                    .WithMany(s => s.Products)
                    .HasForeignKey(e => e.SupplierId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Supplier configuration
            modelBuilder.Entity<Supplier>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Email).HasMaxLength(100);
            });

            // StockTransaction configuration
            modelBuilder.Entity<StockTransaction>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.Product)
                    .WithMany()
                    .HasForeignKey(e => e.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Seed data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Seed Suppliers
            modelBuilder.Entity<Supplier>().HasData(
                new Supplier { Id = 1, Name = "Scandinavian Furniture Co.", ContactPerson = "Erik Larsson", Email = "erik@scandi.com", Phone = "+46-123-456", Address = "Stockholm, Sweden" },
                new Supplier { Id = 2, Name = "Baltic Wood Supplies", ContactPerson = "Anna Kowalski", Email = "anna@baltic.com", Phone = "+48-987-654", Address = "Gdansk, Poland" }
            );

            // Seed Products
            // Seed Products with Images
            modelBuilder.Entity<Product>().HasData(
                new Product
                {
                    Id = 1,
                    SKU = "BILLY-001",
                    Name = "BILLY Bookcase",
                    Description = "Adjustable shelves for customized storage",
                    Category = "Storage",
                    Price = 79.99m,
                    StockQuantity = 150,
                    MinimumStock = 20,
                    SupplierId = 1,
                    Location = "Warehouse A-1",
                    ImageUrl = "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400&h=400&fit=crop"
                },
                new Product
                {
                    Id = 2,
                    SKU = "EKTORP-001",
                    Name = "EKTORP Sofa",
                    Description = "3-seat sofa with removable washable cover",
                    Category = "Furniture",
                    Price = 599.99m,
                    StockQuantity = 25,
                    MinimumStock = 5,
                    SupplierId = 1,
                    Location = "Warehouse B-3",
                    ImageUrl = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop"
                },
                new Product
                {
                    Id = 3,
                    SKU = "LACK-001",
                    Name = "LACK Coffee Table",
                    Description = "Easy to assemble side table",
                    Category = "Tables",
                    Price = 49.99m,
                    StockQuantity = 200,
                    MinimumStock = 30,
                    SupplierId = 2,
                    Location = "Warehouse A-2",
                    ImageUrl = "https://images.unsplash.com/photo-1617097900219-2d6c81ecb60f?w=400&h=400&fit=crop"
                },
                new Product
                {
                    Id = 4,
                    SKU = "MALM-001",
                    Name = "MALM Bed Frame",
                    Description = "Queen size bed frame with storage boxes",
                    Category = "Bedroom",
                    Price = 299.99m,
                    StockQuantity = 15,
                    MinimumStock = 10,
                    SupplierId = 2,
                    Location = "Warehouse C-1",
                    ImageUrl = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop"
                },
                new Product
                {
                    Id = 5,
                    SKU = "KALLAX-001",
                    Name = "KALLAX Shelf Unit",
                    Description = "4x4 shelving unit, perfect for storage boxes",
                    Category = "Storage",
                    Price = 129.99m,
                    StockQuantity = 80,
                    MinimumStock = 15,
                    SupplierId = 1,
                    Location = "Warehouse A-1",
                    ImageUrl = "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&h=400&fit=crop"
                },
                new Product
                {
                    Id = 6,
                    SKU = "POANG-001",
                    Name = "POÄNG Armchair",
                    Description = "Comfortable armchair with bent wood frame",
                    Category = "Furniture",
                    Price = 149.99m,
                    StockQuantity = 45,
                    MinimumStock = 8,
                    SupplierId = 1,
                    Location = "Warehouse B-2",
                    ImageUrl = "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&h=400&fit=crop"
                },
                new Product
                {
                    Id = 7,
                    SKU = "HEMNES-001",
                    Name = "HEMNES Dresser",
                    Description = "8-drawer dresser in solid wood",
                    Category = "Bedroom",
                    Price = 399.99m,
                    StockQuantity = 20,
                    MinimumStock = 5,
                    SupplierId = 2,
                    Location = "Warehouse C-2",
                    ImageUrl = "https://images.unsplash.com/photo-1558998966-079c4dbe6fd9?w=400&h=400&fit=crop"
                },
                new Product
                {
                    Id = 8,
                    SKU = "LISABO-001",
                    Name = "LISABO Dining Table",
                    Description = "Ash veneer dining table, seats 4-6 people",
                    Category = "Tables",
                    Price = 279.99m,
                    StockQuantity = 30,
                    MinimumStock = 8,
                    SupplierId = 2,
                    Location = "Warehouse A-3",
                    ImageUrl = "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400&h=400&fit=crop"
                },
                new Product
                {
                    Id = 9,
                    SKU = "RANARP-001",
                    Name = "RANARP Floor Lamp",
                    Description = "Adjustable floor lamp, perfect for reading",
                    Category = "Lighting",
                    Price = 89.99m,
                    StockQuantity = 60,
                    MinimumStock = 15,
                    SupplierId = 1,
                    Location = "Warehouse B-1",
                    ImageUrl = "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&h=400&fit=crop"
                },
                new Product
                {
                    Id = 10,
                    SKU = "VARDAGEN-001",
                    Name = "VARDAGEN Cookware Set",
                    Description = "5-piece stainless steel cookware set",
                    Category = "Kitchen",
                    Price = 199.99m,
                    StockQuantity = 40,
                    MinimumStock = 10,
                    SupplierId = 1,
                    Location = "Warehouse D-1",
                    ImageUrl = "https://images.unsplash.com/photo-1584990347449-39e4e37260d9?w=400&h=400&fit=crop"
                },
                new Product
                {
                    Id = 11,
                    SKU = "TARVA-001",
                    Name = "TARVA Nightstand",
                    Description = "Pine wood nightstand with 2 drawers",
                    Category = "Bedroom",
                    Price = 69.99m,
                    StockQuantity = 55,
                    MinimumStock = 12,
                    SupplierId = 2,
                    Location = "Warehouse C-1",
                    ImageUrl = "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=400&h=400&fit=crop"
                },
                new Product
                {
                    Id = 12,
                    SKU = "VIMLE-001",
                    Name = "VIMLE Corner Sofa",
                    Description = "5-seat corner sofa with chaise",
                    Category = "Furniture",
                    Price = 1299.99m,
                    StockQuantity = 8,
                    MinimumStock = 3,
                    SupplierId = 1,
                    Location = "Warehouse B-3",
                    ImageUrl = "https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?w=400&h=400&fit=crop"
                },
                new Product
                {
                    Id = 13,
                    SKU = "RASKOG-001",
                    Name = "RÅSKOG Cart",
                    Description = "Utility cart with wheels, perfect for kitchen or office",
                    Category = "Storage",
                    Price = 39.99m,
                    StockQuantity = 120,
                    MinimumStock = 25,
                    SupplierId = 1,
                    Location = "Warehouse A-2",
                    ImageUrl = "https://images.unsplash.com/photo-1588471980726-8346cb477a33?w=400&h=400&fit=crop"
                },
                new Product
                {
                    Id = 14,
                    SKU = "STOCKHOLM-001",
                    Name = "STOCKHOLM Mirror",
                    Description = "Large walnut veneer framed mirror",
                    Category = "Decor",
                    Price = 249.99m,
                    StockQuantity = 18,
                    MinimumStock = 5,
                    SupplierId = 2,
                    Location = "Warehouse D-2",
                    ImageUrl = "https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&h=400&fit=crop"
                },
                new Product
                {
                    Id = 15,
                    SKU = "FJALLBO-001",
                    Name = "FJÄLLBO TV Unit",
                    Description = "Industrial style TV bench with metal frame",
                    Category = "Storage",
                    Price = 179.99m,
                    StockQuantity = 35,
                    MinimumStock = 8,
                    SupplierId = 2,
                    Location = "Warehouse A-3",
                    ImageUrl = "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop"
                }
            );

            // Seed Stock Transactions
            modelBuilder.Entity<StockTransaction>().HasData(
                new StockTransaction
                {
                    Id = 1,
                    ProductId = 1,
                    Type = TransactionType.Purchase,
                    Quantity = 50,
                    Reference = "PO-001",
                    TransactionDate = DateTime.UtcNow.AddDays(-10),
                    PerformedBy = "John Doe"
                },
                new StockTransaction
                {
                    Id = 2,
                    ProductId = 1,
                    Type = TransactionType.Sale,
                    Quantity = 10,
                    Reference = "SO-001",
                    TransactionDate = DateTime.UtcNow.AddDays(-5),
                    PerformedBy = "Jane Smith"
                },
                new StockTransaction
                {
                    Id = 3,
                    ProductId = 2,
                    Type = TransactionType.Purchase,
                    Quantity = 15,
                    Reference = "PO-002",
                    TransactionDate = DateTime.UtcNow.AddDays(-7),
                    PerformedBy = "John Doe"
                },
                new StockTransaction
                {
                    Id = 4,
                    ProductId = 3,
                    Type = TransactionType.Sale,
                    Quantity = 25,
                    Reference = "SO-002",
                    TransactionDate = DateTime.UtcNow.AddDays(-2),
                    PerformedBy = "Jane Smith"
                }
            );
        }
    }
}