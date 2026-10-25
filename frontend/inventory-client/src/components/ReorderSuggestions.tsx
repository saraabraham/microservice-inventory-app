import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, ShoppingCart, Mail, CheckCircle } from 'lucide-react';

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
    const [approving, setApproving] = useState(false);
    const [approveSuccess, setApproveSuccess] = useState<string | null>(null);
    const [editedQty, setEditedQty] = useState<Record<number, number>>({});

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

    const getQty = (item: ReorderSuggestion) =>
        editedQty[item.id] ?? item.suggestedOrderQuantity;

    const reorderSingle = async (item: ReorderSuggestion) => {
        setApproving(true);
        setApproveSuccess(null);
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/transactions`, {
                productId: item.id,
                transactionType: 'Purchase',
                quantity: getQty(item),
                notes: `Reorder from ${item.supplier.name}`,
            });
            setApproveSuccess(`Purchase transaction created for ${item.name}.`);
            await loadSuggestions();
        } catch (error) {
            console.error('Error creating transaction:', error);
        } finally {
            setApproving(false);
        }
    };

    const approvePurchases = async () => {
        const selected = suggestions.filter(s => selectedItems.has(s.id));
        if (selected.length === 0) return;
        setApproving(true);
        setApproveSuccess(null);
        try {
            await Promise.all(selected.map(item =>
                axios.post(`${process.env.REACT_APP_API_URL}/transactions`, {
                    productId: item.id,
                    transactionType: 'Purchase',
                    quantity: getQty(item),
                    notes: `Reorder from ${item.supplier.name}`,
                })
            ));
            setApproveSuccess(`Created ${selected.length} Purchase transaction${selected.length > 1 ? 's' : ''}. Check Transaction History.`);
            setSelectedItems(new Set());
            await loadSuggestions();
        } catch (error) {
            console.error('Error creating transactions:', error);
        } finally {
            setApproving(false);
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
                    <div className="flex gap-2">
                        <button
                            onClick={approvePurchases}
                            disabled={approving}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50"
                        >
                            <CheckCircle className="w-5 h-5 mr-2" />
                            {approving ? 'Creating...' : `Approve & Record Purchases (${selectedItems.size})`}
                        </button>
                        <button
                            onClick={generatePurchaseOrder}
                            className="bg-ikea-blue text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center"
                        >
                            <ShoppingCart className="w-5 h-5 mr-2" />
                            Generate PO (${totalEstimatedCost.toFixed(2)})
                        </button>
                    </div>
                )}
            </div>

            {approveSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center text-green-800">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    {approveSuccess}
                </div>
            )}

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
                                    Order Qty (editable)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Est. Cost
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Supplier
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Action
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
                                        <input
                                            type="number"
                                            min="1"
                                            value={getQty(suggestion)}
                                            onChange={e => setEditedQty(prev => ({ ...prev, [suggestion.id]: parseInt(e.target.value) || 1 }))}
                                            className="w-24 border border-gray-300 rounded px-2 py-1 text-sm font-bold text-ikea-blue focus:outline-none focus:ring-2 focus:ring-ikea-blue"
                                        />
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
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => reorderSingle(suggestion)}
                                            disabled={approving}
                                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                                        >
                                            <CheckCircle className="w-3 h-3" />
                                            Reorder
                                        </button>
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