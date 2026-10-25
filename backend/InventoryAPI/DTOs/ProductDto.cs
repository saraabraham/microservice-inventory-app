namespace InventoryAPI.DTOs
{
    public class ProductDto
    {
        public int Id { get; set; }
        public string SKU { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public int MinimumStock { get; set; }
        public int SupplierId { get; set; }
        public string? SupplierName { get; set; }
        public string Location { get; set; } = string.Empty;
        public bool IsLowStock { get; set; }
        public bool IsActive { get; set; }
        public string? ImageUrl { get; set; }
    }

    public class CreateProductDto
    {
        public string SKU { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public int MinimumStock { get; set; }
        public int SupplierId { get; set; }
        public string Location { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
    }

    public class UpdateProductDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Category { get; set; }
        public decimal? Price { get; set; }
        public int? MinimumStock { get; set; }
        public int? SupplierId { get; set; }
        public string? Location { get; set; }
        public bool? IsActive { get; set; }
    }
}