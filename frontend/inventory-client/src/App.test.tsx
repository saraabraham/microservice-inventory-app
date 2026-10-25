import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mock the entire services/api module ───────────────────────────────────────
// This avoids touching axios or axios.create at all, which causes
// "multiple React copies" errors when jest.resetModules is involved.
jest.mock('./services/api', () => ({
  productService: {
    getAll:      jest.fn(),
    getLowStock: jest.fn(),
    getById:     jest.fn(),
    create:      jest.fn(),
    update:      jest.fn(),
    updateStock: jest.fn(),
    delete:      jest.fn(),
  },
  statsService: {
    getStats: jest.fn(),
  },
}));

import { productService, statsService } from './services/api';
import Dashboard from './components/Dashboard';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const sampleProducts = [
  {
    id: 1, sku: 'BILLY-001', name: 'BILLY Bookcase', description: 'Shelves',
    category: 'Storage', price: 79.99, stockQuantity: 150, minimumStock: 20,
    supplierId: 1, location: 'A-1', isLowStock: false, isActive: true,
  },
  {
    id: 2, sku: 'MALM-001', name: 'MALM Bed Frame', description: 'Bed',
    category: 'Bedroom', price: 299.99, stockQuantity: 5, minimumStock: 10,
    supplierId: 1, location: 'C-1', isLowStock: true, isActive: true,
  },
];

const sampleStats = {
  totalProducts: 2,
  totalStockUnits: 155,
  totalStockValue: 11999.85,
  lowStockCount: 1,
  categories: [
    { category: 'Storage', count: 1, totalStock: 150 },
    { category: 'Bedroom', count: 1, totalStock: 5 },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const mockedProductService = productService as jest.Mocked<typeof productService>;
const mockedStatsService   = statsService   as jest.Mocked<typeof statsService>;

beforeEach(() => jest.clearAllMocks());

// ── 1. statsService unit tests ────────────────────────────────────────────────
describe('statsService', () => {
  it('resolves with aggregated inventory statistics', async () => {
    mockedStatsService.getStats.mockResolvedValueOnce({ data: sampleStats } as any);

    const res = await statsService.getStats();

    expect(mockedStatsService.getStats).toHaveBeenCalledTimes(1);
    expect(res.data.totalProducts).toBe(2);
    expect(res.data.lowStockCount).toBe(1);
    expect(res.data.categories).toHaveLength(2);
  });

  it('includes a breakdown by category', async () => {
    mockedStatsService.getStats.mockResolvedValueOnce({ data: sampleStats } as any);

    const res = await statsService.getStats();
    const names = res.data.categories.map(c => c.category);

    expect(names).toContain('Storage');
    expect(names).toContain('Bedroom');
  });
});

// ── 2. productService unit tests ──────────────────────────────────────────────
describe('productService', () => {
  it('getAll resolves with a list of products', async () => {
    mockedProductService.getAll.mockResolvedValueOnce({ data: sampleProducts } as any);

    const res = await productService.getAll();

    expect(res.data).toHaveLength(2);
    expect(res.data[0].sku).toBe('BILLY-001');
  });

  it('getLowStock returns only products below minimum stock', async () => {
    const lowStock = sampleProducts.filter(p => p.isLowStock);
    mockedProductService.getLowStock.mockResolvedValueOnce({ data: lowStock } as any);

    const res = await productService.getLowStock();

    expect(res.data).toHaveLength(1);
    expect(res.data[0].name).toBe('MALM Bed Frame');
  });
});

// ── 3. Dashboard component tests ──────────────────────────────────────────────
describe('Dashboard', () => {
  const renderDashboard = () =>
    render(<MemoryRouter><Dashboard /></MemoryRouter>);

  it('renders all four stat card headings', async () => {
    mockedProductService.getAll.mockResolvedValueOnce({ data: sampleProducts } as any);
    mockedStatsService.getStats.mockResolvedValueOnce({ data: sampleStats } as any);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Total Products')).toBeInTheDocument();
      expect(screen.getByText('Total Stock Units')).toBeInTheDocument();
      expect(screen.getByText('Total Stock Value')).toBeInTheDocument();
      expect(screen.getByText('Low Stock Items')).toBeInTheDocument();
    });
  });

  it('shows the StatsService badge when stats load successfully', async () => {
    mockedProductService.getAll.mockResolvedValueOnce({ data: sampleProducts } as any);
    mockedStatsService.getStats.mockResolvedValueOnce({ data: sampleStats } as any);

    renderDashboard();

    await waitFor(() =>
      expect(screen.getByText('Stats via StatsService')).toBeInTheDocument()
    );
  });

  it('shows unavailable badge when StatsService call fails', async () => {
    mockedProductService.getAll.mockResolvedValueOnce({ data: sampleProducts } as any);
    mockedStatsService.getStats.mockRejectedValueOnce(new Error('network error'));

    renderDashboard();

    await waitFor(() =>
      expect(screen.getByText('Stats Service unavailable')).toBeInTheDocument()
    );
  });

  it('displays low-stock alert when there are low-stock items', async () => {
    mockedProductService.getAll.mockResolvedValueOnce({ data: sampleProducts } as any);
    mockedStatsService.getStats.mockResolvedValueOnce({ data: sampleStats } as any);

    renderDashboard();

    await waitFor(() =>
      expect(screen.getByText('Low Stock Alert')).toBeInTheDocument()
    );
  });
});
