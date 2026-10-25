using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InventoryAPI.Data;
using InventoryAPI.Models;

namespace InventoryAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TransactionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TransactionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<StockTransaction>>> GetTransactions()
        {
            return await _context.StockTransactions
                .Include(t => t.Product)
                .OrderByDescending(t => t.TransactionDate)
                .Take(100)
                .ToListAsync();
        }

        [HttpGet("product/{productId}")]
        public async Task<ActionResult<IEnumerable<StockTransaction>>> GetProductTransactions(int productId)
        {
            return await _context.StockTransactions
                .Where(t => t.ProductId == productId)
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<StockTransaction>> CreateTransaction(StockTransaction transaction)
        {
            transaction.TransactionDate = DateTime.UtcNow;
            _context.StockTransactions.Add(transaction);

            // Update product stock
            var product = await _context.Products.FindAsync(transaction.ProductId);
            if (product != null)
            {
                switch (transaction.Type)
                {
                    case TransactionType.Purchase:
                    case TransactionType.Return:
                        product.StockQuantity += transaction.Quantity;
                        break;
                    case TransactionType.Sale:
                    case TransactionType.Adjustment:
                        product.StockQuantity -= transaction.Quantity;
                        break;
                }
                product.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTransactions), new { id = transaction.Id }, transaction);
        }
    }
}