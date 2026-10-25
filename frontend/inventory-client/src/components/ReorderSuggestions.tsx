import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, ShoppingCart, Mail } from 'lucide-react';

interface ReorderSuggestion {
    id: number;
    sku: string;
    name: string;
    category: string;
    currentStock: number;
    minimumStock: number;
    deficit: number;
    suggestedOrderQuantity: number;
    estimatedCost: number;
    priority: string;
    supplier: {
        id: number;
        name: string;
        email: string;
    };
}

const ReorderSuggestions: React.FC = () => {
    const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

    useEffect(() => {
        loadSuggestions();
    }, []);

    const loadSuggestions = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}//products/reorder-suggestions`);
            setSuggestions(response.data);
        } catch (error) {
            console.error('Error loading suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: number) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItems(newSelected);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Critical':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'High':
                return 'bg-orange-100 text-orange-800 border-orange-300';
            default:
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        }
    };

    const generatePurchaseOrder = () => {
        const selected = suggestions.filter(s => selectedItems.has(s.id));

        if (selected.length === 0) {
            alert('Please select items to order');
            return;
        }

        const totalCost = selected.reduce((sum, item) => sum + item.estimatedCost, 0);

        const poText = `PURCHASE ORDER
Generated: ${new Date().toLocaleString()}

Items to Order:
${selected.map((item, index) =>
            `${index + 1}. ${item.name} (${item.sku})
   Supplier: ${item.supplier.name}
   Quantity: ${item.suggestedOrderQuantity}
   Unit Price: $${(item.estimatedCost / item.suggestedOrderQuantity).toFixed(2)}
   Total: $${item.estimatedCost.toFixed(2)}
`).join('\n')}

Total Estimated Cost: $${totalCost.toFixed(2)}

---
This is an automated purchase order suggestion.
Please review and approve before placing the order.
`;

        const blob = new Blob([poText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `PO-${Date.now()}.txt`;
        link.click();
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    const totalEstimatedCost = suggestions
        .filter(s => selectedItems.has(s.id))
        .reduce((sum, s) => sum + s.estimatedCost, 0);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-ikea-blue">Reorder Suggestions</h1>
                    <p className="text-gray-600 mt-1">
                        {suggestions.length} product{suggestions.length !== 1 ? 's' : ''} need restocking
                    </p>
                </div>
                {selectedItems.size > 0 && (
                    <button
                        onClick={generatePurchaseOrder}
                        className="bg-ikea-blue text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center"
                    >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Generate PO ({selectedItems.size} items - ${totalEstimatedCost.toFixed(2)})
                    </button>
                )}
            </div>

            {suggestions.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                    <div className="text-green-600 text-6xl mb-4">✓</div>
                    <h2 className="text-2xl font-bold text-green-900 mb-2">All Good!</h2>
                    <p className="text-green-700">
                        No products currently need reordering. All stock levels are healthy.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.size === suggestions.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedItems(new Set(suggestions.map(s => s.id)));
                                            } else {
                                                setSelectedItems(new Set());
                                            }
                                        }}
                                        className="rounded"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Priority
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Product
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Current Stock
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Suggested Order
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Est. Cost
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Supplier
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {suggestions.map((suggestion) => (
                                <tr key={suggestion.id} className={selectedItems.has(suggestion.id) ? 'bg-blue-50' : ''}>
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.has(suggestion.id)}
                                            onChange={() => toggleSelection(suggestion.id)}
                                            className="rounded"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getPriorityColor(suggestion.priority)}`}>
                                            {suggestion.priority === 'Critical' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                            {suggestion.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{suggestion.name}</div>
                                        <div className="text-sm text-gray-500">{suggestion.sku} • {suggestion.category}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm">
                                            <span className="font-bold text-red-600">{suggestion.currentStock}</span>
                                            <span className="text-gray-500"> / {suggestion.minimumStock} min</span>
                                        </div>
                                        <div className="text-xs text-red-600">
                                            {suggestion.deficit > 0 ? `${suggestion.deficit} below minimum` : 'At minimum'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-ikea-blue">
                                            {suggestion.suggestedOrderQuantity} units
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">
                                            ${suggestion.estimatedCost.toFixed(2)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{suggestion.supplier.name}</div>
                                        <a
                                            href={`mailto:${suggestion.supplier.email}?subject=Purchase Order - ${suggestion.name}`}
                                            className="text-xs text-ikea-blue hover:underline flex items-center"
                                        >
                                            <Mail className="w-3 h-3 mr-1" />
                                            {suggestion.supplier.email}
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ReorderSuggestions;