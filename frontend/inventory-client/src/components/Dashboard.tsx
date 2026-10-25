import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Product, InventoryStats, productService, statsService } from '../services/api';
import { Package, AlertTriangle, TrendingUp, DollarSign, Activity } from 'lucide-react';

// Lazy load charts component to reduce initial bundle
const DashboardCharts = lazy(() => import('./DashboardCharts'));

const Dashboard: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [stats, setStats] = useState<InventoryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statsError, setStatsError] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Products are still fetched from InventoryAPI (used by charts)
            // Aggregate stats come from the dedicated StatsService microservice
            const [productsRes, statsRes] = await Promise.all([
                productService.getAll(),
                statsService.getStats().catch(() => {
                    setStatsError(true);
                    return null;
                }),
            ]);
            setProducts(productsRes.data);
            if (statsRes) setStats(statsRes.data);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Build category distribution map from stats service response for charts
    const categoryDistribution: Record<string, number> = stats
        ? Object.fromEntries(stats.categories.map(c => [c.category, c.count]))
        : {};

    // Skeleton loading state
    if (loading) {
        return (
            <div className="p-6">
                <h1 className="text-3xl font-bold text-ikea-blue mb-6">Inventory Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="h-64 bg-gray-100 rounded"></div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="h-64 bg-gray-100 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-ikea-blue">Inventory Dashboard</h1>
                {/* Badge showing stats are sourced from the StatsService microservice */}
                <div className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full ${statsError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    <Activity className="w-3 h-3" />
                    {statsError ? 'Stats Service unavailable' : 'Stats via StatsService'}
                </div>
            </div>

            {/* Stat Cards — values sourced from the StatsService microservice */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Total Products</p>
                            <p className="text-2xl font-bold text-ikea-blue">
                                {stats ? stats.totalProducts : products.length}
                            </p>
                        </div>
                        <Package className="w-12 h-12 text-ikea-blue opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Total Stock Units</p>
                            <p className="text-2xl font-bold text-ikea-blue">
                                {stats
                                    ? stats.totalStockUnits.toLocaleString()
                                    : products.reduce((s, p) => s + p.stockQuantity, 0).toLocaleString()}
                            </p>
                        </div>
                        <TrendingUp className="w-12 h-12 text-ikea-blue opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Total Stock Value</p>
                            <p className="text-2xl font-bold text-ikea-blue">
                                ${stats
                                    ? stats.totalStockValue.toLocaleString()
                                    : products.reduce((s, p) => s + p.price * p.stockQuantity, 0).toLocaleString()}
                            </p>
                        </div>
                        <DollarSign className="w-12 h-12 text-ikea-blue opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Low Stock Items</p>
                            <p className="text-2xl font-bold text-red-600">
                                {stats
                                    ? stats.lowStockCount
                                    : products.filter(p => p.isLowStock).length}
                            </p>
                        </div>
                        <AlertTriangle className="w-12 h-12 text-red-600 opacity-20" />
                    </div>
                </div>
            </div>

            {/* Low Stock Alert */}
            {(stats ? stats.lowStockCount > 0 : products.some(p => p.isLowStock)) && (
                <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <div className="flex items-start">
                        <AlertTriangle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" />
                        <div className="flex-1">
                            <h3 className="text-red-800 font-semibold">Low Stock Alert</h3>
                            <p className="text-red-700 text-sm">
                                {stats ? stats.lowStockCount : products.filter(p => p.isLowStock).length} product(s) are running low on stock
                            </p>
                        </div>
                    </div>
                    <div className="mt-3">
                        {products.filter(p => p.isLowStock).slice(0, 5).map(product => (
                            <div key={product.id} className="text-sm text-red-700 py-1">
                                • {product.name} — Only {product.stockQuantity} units left (Min: {product.minimumStock})
                            </div>
                        ))}
                        {(stats ? stats.lowStockCount : products.filter(p => p.isLowStock).length) > 5 && (
                            <div className="text-sm text-red-600 py-1 font-semibold">
                                + {(stats ? stats.lowStockCount : products.filter(p => p.isLowStock).length) - 5} more items
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Category breakdown — sourced from StatsService */}
            {stats && (
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-xl font-semibold text-ikea-blue mb-4">Products by Category</h2>
                    <div className="space-y-3">
                        {stats.categories.map(({ category, count }) => (
                            <div key={category} className="flex items-center justify-between">
                                <span className="text-gray-700">{category}</span>
                                <div className="flex items-center">
                                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                                        <div
                                            className="bg-ikea-blue h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(count / stats.totalProducts) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-gray-600 font-semibold w-8">{count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Charts — Lazy loaded, use full product list from InventoryAPI */}
            <Suspense fallback={
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-white rounded-lg shadow p-6">
                            <div className="h-64 bg-gray-100 animate-pulse rounded flex items-center justify-center">
                                <p className="text-gray-400">Loading charts...</p>
                            </div>
                        </div>
                    ))}
                </div>
            }>
                <DashboardCharts
                    products={products}
                    categoryDistribution={categoryDistribution}
                />
            </Suspense>
        </div>
    );
};

export default Dashboard;
