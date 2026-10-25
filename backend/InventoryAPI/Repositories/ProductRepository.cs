using Microsoft.EntityFrameworkCore;
using InventoryAPI.Data;
using InventoryAPI.Models;

namespace InventoryAPI.Repositories
{
    public class ProductRepository : IProductRepository
    {
        private readonly ApplicationDbContext _context;

        public ProductRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Product>> GetAllAsync()
        {
            return await _context.Products
                .Include(p => p.Supplier)
                .OrderBy(p => p.Name)
                .ToListAsync();
        }

        public async Task<Product?> GetByIdAsync(int id)
        {
            return await _context.Products
                .Include(p => p.Supplier)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<Product?> GetBySkuAsync(string sku)
        {
            return await _context.Products
                .Include(p => p.Supplier)
                .FirstOrDefaultAsync(p => p.SKU == sku);
        }

        public async Task<Product> CreateAsync(Product product)
        {
            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return product;
        }

        public async Task<Product> UpdateAsync(Product product)
        {
            product.UpdatedAt = DateTime.UtcNow;
            _context.Products.Update(product);
            await _context.SaveChangesAsync();
            return product;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var product = await GetByIdAsync(id);
            if (product == null) return false;

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Product>> GetLowStockProductsAsync()
        {
            return await _context.Products
                .Include(p => p.Supplier)
                .Where(p => p.StockQuantity <= p.MinimumStock && p.IsActive)
                .ToListAsync();
        }

        public async Task<bool> UpdateStockAsync(int productId, int quantity)
        {
            var product = await GetByIdAsync(productId);
            if (product == null) return false;

            // Create transaction record
            var transaction = new StockTransaction
            {
                ProductId = productId,
                Type = quantity > 0 ? TransactionType.Purchase : TransactionType.Sale,
                Quantity = Math.Abs(quantity),
                TransactionDate = DateTime.UtcNow,
                PerformedBy = "System",
                Notes = quantity > 0 ? "Stock increase" : "Stock decrease"
            };

            _context.StockTransactions.Add(transaction);

            product.StockQuantity += quantity;
            product.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}