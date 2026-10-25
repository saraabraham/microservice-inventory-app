namespace InventoryAPI.Models
{
    public enum TransactionType
    {
        Purchase,
        Sale,
        Adjustment,
        Return
    }

    public class StockTransaction
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public Product? Product { get; set; }
        public TransactionType Type { get; set; }
        public int Quantity { get; set; }
        public string? Reference { get; set; }
        public string? Notes { get; set; }
        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
        public string PerformedBy { get; set; } = "System";
    }
}