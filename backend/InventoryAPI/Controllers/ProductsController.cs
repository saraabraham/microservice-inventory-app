using Microsoft.AspNetCore.Mvc;
using InventoryAPI.Models;
using InventoryAPI.DTOs;
using InventoryAPI.Repositories;
using System.Text;

namespace InventoryAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly IProductRepository _productRepository;

        public ProductsController(IProductRepository productRepository)
        {
            _productRepository = productRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts()
        {
            var products = await _productRepository.GetAllAsync();
            var productDtos = products.Select(p => new ProductDto
            {
                Id = p.Id,
                SKU = p.SKU,
                Name = p.Name,
                Description = p.Description,
                Category = p.Category,
                Price = p.Price,
                StockQuantity = p.StockQuantity,
                MinimumStock = p.MinimumStock,
                SupplierId = p.SupplierId,
                SupplierName = p.Supplier?.Name,
                Location = p.Location,
                IsLowStock = p.StockQuantity <= p.MinimumStock,
                IsActive = p.IsActive
            });

            return Ok(productDtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductDto>> GetProduct(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);

            if (product == null)
            {
                return NotFound();
            }

            var productDto = new ProductDto
            {
                Id = product.Id,
                SKU = product.SKU,
                Name = product.Name,
                Description = product.Description,
                Category = product.Category,
                Price = product.Price,
                StockQuantity = product.StockQuantity,
                MinimumStock = product.MinimumStock,
                SupplierId = product.SupplierId,
                SupplierName = product.Supplier?.Name,
                Location = product.Location,
                IsLowStock = product.StockQuantity <= product.MinimumStock,
                IsActive = product.IsActive
            };

            return Ok(productDto);
        }

        [HttpGet("low-stock")]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetLowStockProducts()
        {
            var products = await _productRepository.GetLowStockProductsAsync();
            var productDtos = products.Select(p => new ProductDto
            {
                Id = p.Id,
                SKU = p.SKU,
                Name = p.Name,
                Description = p.Description,
                Category = p.Category,
                Price = p.Price,
                StockQuantity = p.StockQuantity,
                MinimumStock = p.MinimumStock,
                SupplierId = p.SupplierId,
                SupplierName = p.Supplier?.Name,
                Location = p.Location,
                IsLowStock = true,
                IsActive = p.IsActive
            });

            return Ok(productDtos);
        }

        [HttpPost]
        public async Task<ActionResult<ProductDto>> CreateProduct(CreateProductDto createDto)
        {
            // Check if SKU already exists
            var existing = await _productRepository.GetBySkuAsync(createDto.SKU);
            if (existing != null)
            {
                return BadRequest("A product with this SKU already exists.");
            }

            var product = new Product
            {
                SKU = createDto.SKU,
                Name = createDto.Name,
                Description = createDto.Description,
                Category = createDto.Category,
                Price = createDto.Price,
                StockQuantity = createDto.StockQuantity,
                MinimumStock = createDto.MinimumStock,
                SupplierId = createDto.SupplierId,
                Location = createDto.Location
            };

            var created = await _productRepository.CreateAsync(product);
            var createdProduct = await _productRepository.GetByIdAsync(created.Id);

            var productDto = new ProductDto
            {
                Id = createdProduct!.Id,
                SKU = createdProduct.SKU,
                Name = createdProduct.Name,
                Description = createdProduct.Description,
                Category = createdProduct.Category,
                Price = createdProduct.Price,
                StockQuantity = createdProduct.StockQuantity,
                MinimumStock = createdProduct.MinimumStock,
                SupplierId = createdProduct.SupplierId,
                SupplierName = createdProduct.Supplier?.Name,
                Location = createdProduct.Location,
                IsLowStock = createdProduct.StockQuantity <= createdProduct.MinimumStock,
                IsActive = createdProduct.IsActive
            };

            return CreatedAtAction(nameof(GetProduct), new { id = productDto.Id }, productDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(int id, UpdateProductDto updateDto)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
            {
                return NotFound();
            }

            if (updateDto.Name != null) product.Name = updateDto.Name;
            if (updateDto.Description != null) product.Description = updateDto.Description;
            if (updateDto.Category != null) product.Category = updateDto.Category;
            if (updateDto.Price.HasValue) product.Price = updateDto.Price.Value;
            if (updateDto.MinimumStock.HasValue) product.MinimumStock = updateDto.MinimumStock.Value;
            if (updateDto.SupplierId.HasValue) product.SupplierId = updateDto.SupplierId.Value;
            if (updateDto.Location != null) product.Location = updateDto.Location;
            if (updateDto.IsActive.HasValue) product.IsActive = updateDto.IsActive.Value;

            await _productRepository.UpdateAsync(product);

            return NoContent();
        }

        [HttpPatch("{id}/stock")]
        public async Task<IActionResult> UpdateStock(int id, [FromBody] int quantityChange)
        {
            var success = await _productRepository.UpdateStockAsync(id, quantityChange);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var success = await _productRepository.DeleteAsync(id);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportProducts()
        {
            var products = await _productRepository.GetAllAsync();

            var csv = new StringBuilder();
            csv.AppendLine("SKU,Name,Category,Price,Stock,Minimum Stock,Supplier,Location,Status");

            foreach (var product in products)
            {
                csv.AppendLine($"{product.SKU},{product.Name},{product.Category},{product.Price}," +
                              $"{product.StockQuantity},{product.MinimumStock},{product.Supplier?.Name}," +
                              $"{product.Location},{(product.IsActive ? "Active" : "Inactive")}");
            }

            var bytes = Encoding.UTF8.GetBytes(csv.ToString());
            return File(bytes, "text/csv", $"inventory-export-{DateTime.Now:yyyyMMdd}.csv");
        }

        [HttpPost("import")]
        public async Task<IActionResult> ImportProducts([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
                return BadRequest("Only CSV files are allowed");

            var results = new ImportResult(); // Use proper class instead of anonymous type

            try
            {
                using var reader = new StreamReader(file.OpenReadStream());

                // Skip header line
                await reader.ReadLineAsync();

                while (!reader.EndOfStream)
                {
                    var line = await reader.ReadLineAsync();
                    if (string.IsNullOrWhiteSpace(line)) continue;

                    var values = line.Split(',');

                    if (values.Length < 8)
                    {
                        results.Errors.Add($"Invalid row: {line}");
                        results.Failed++;
                        continue;
                    }

                    try
                    {
                        var sku = values[0].Trim();
                        var existing = await _productRepository.GetBySkuAsync(sku);

                        if (existing != null)
                        {
                            // Update existing product
                            existing.Name = values[1].Trim();
                            existing.Description = values[2].Trim();
                            existing.Category = values[3].Trim();
                            existing.Price = decimal.Parse(values[4].Trim());
                            existing.StockQuantity = int.Parse(values[5].Trim());
                            existing.MinimumStock = int.Parse(values[6].Trim());
                            existing.Location = values[7].Trim();

                            await _productRepository.UpdateAsync(existing);
                        }
                        else
                        {
                            // Create new product
                            var product = new Product
                            {
                                SKU = sku,
                                Name = values[1].Trim(),
                                Description = values[2].Trim(),
                                Category = values[3].Trim(),
                                Price = decimal.Parse(values[4].Trim()),
                                StockQuantity = int.Parse(values[5].Trim()),
                                MinimumStock = int.Parse(values[6].Trim()),
                                SupplierId = 1, // Default supplier
                                Location = values[7].Trim()
                            };

                            await _productRepository.CreateAsync(product);
                        }

                        results.Success++;
                    }
                    catch (Exception ex)
                    {
                        results.Errors.Add($"Error processing row '{line}': {ex.Message}");
                        results.Failed++;
                    }
                }
            }
            catch (Exception ex)
            {
                return BadRequest($"Error processing file: {ex.Message}");
            }

            return Ok(new
            {
                Message = $"Import completed. Success: {results.Success}, Failed: {results.Failed}",
                Results = results
            });
        }

        [HttpGet("reorder-suggestions")]
        public async Task<ActionResult<IEnumerable<object>>> GetReorderSuggestions()
        {
            var products = await _productRepository.GetAllAsync();

            var suggestions = products
                .Where(p => p.IsActive && p.StockQuantity <= p.MinimumStock * 1.5) // Within 150% of minimum
                .Select(p => new
                {
                    p.Id,
                    p.SKU,
                    p.Name,
                    p.Category,
                    CurrentStock = p.StockQuantity,
                    MinimumStock = p.MinimumStock,
                    Deficit = p.MinimumStock - p.StockQuantity,
                    SuggestedOrderQuantity = CalculateReorderQuantity(p),
                    EstimatedCost = p.Price * CalculateReorderQuantity(p),
                    Priority = p.StockQuantity == 0 ? "Critical" :
                               p.StockQuantity < p.MinimumStock ? "High" : "Medium",
                    Supplier = p.Supplier != null ? new { p.Supplier.Id, p.Supplier.Name, p.Supplier.Email } : null
                })
                .OrderBy(s => s.CurrentStock)
                .ToList();

            return Ok(suggestions);
        }

        private int CalculateReorderQuantity(Product product)
        {
            // Simple algorithm: Order enough to reach 200% of minimum stock
            var targetStock = product.MinimumStock * 2;
            var needed = targetStock - product.StockQuantity;
            return Math.Max(needed, product.MinimumStock); // At least minimum stock
        }

        public class ImportResult
        {
            public int Success { get; set; } = 0;
            public int Failed { get; set; } = 0;
            public List<string> Errors { get; set; } = new List<string>();
        }
    }
}