import React from 'react';
import { Product } from '../services/api';
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#0051BA', '#FFDB00', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

interface DashboardChartsProps {
    products: Product[];
    categoryDistribution: Record<string, number>;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ products, categoryDistribution }) => {
    // Prepare data for category pie chart
    const categoryData = Object.entries(categoryDistribution).map(([name, value]) => ({
        name,
        value
    }));

    // Prepare data for stock levels bar chart
    const stockData = products
        .sort((a, b) => a.stockQuantity - b.stockQuantity)
        .slice(0, 10)
        .map(p => ({
            name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
            stock: p.stockQuantity,
            minimum: p.minimumStock
        }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution Pie Chart */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-ikea-blue mb-4">Category Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Stock Levels Bar Chart */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-ikea-blue mb-4">Lowest Stock Items</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stockData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            fontSize={12}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="stock" fill="#0051BA" name="Current Stock" />
                        <Bar dataKey="minimum" fill="#FFDB00" name="Minimum Stock" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default DashboardCharts;