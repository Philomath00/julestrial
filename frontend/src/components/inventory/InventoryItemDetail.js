import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import inventoryService from '../../services/inventoryService';
import { format } from 'date-fns';

const InventoryItemDetail = () => {
  const [item, setItem] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const fetchItemDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const itemResponse = await inventoryService.getItemById(id);
        setItem(itemResponse.data);

        const transactionsResponse = await inventoryService.getItemTransactions(id);
        setTransactions(transactionsResponse.data.results || transactionsResponse.data);

        setError(null);
      } catch (err) {
        setError(err.message || `Failed to fetch inventory item details for ID ${id}.`);
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchItemDetails();
  }, [id]);

  if (loading) return <p>Loading item details...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!item) return <p>Inventory item not found.</p>;

  return (
    <div>
      <h2>Inventory Item: {item.name} (ID: {item.id})</h2>
      <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px' }}>
        <h4>Item Information</h4>
        <p><strong>Description:</strong> {item.description || 'N/A'}</p>
        <p><strong>Category:</strong> {item.category_name || (item.category || 'N/A')}</p>
        <p><strong>Unit of Measure:</strong> {item.unit_of_measure || 'N/A'}</p>
        <p><strong>Quantity on Hand:</strong> {parseFloat(item.quantity_on_hand).toFixed(2)}</p>
        <p><strong>Reorder Level:</strong> {parseFloat(item.reorder_level).toFixed(2)}</p>
        <p><strong>Last Stocktake:</strong> {item.last_stocktake_date ? format(new Date(item.last_stocktake_date), 'PPP') : 'N/A'}</p>
      </div>

      <Link to={`/inventory/items/${item.id}/edit`} style={{ marginRight: '10px' }}>
        <button>Edit Item</button>
      </Link>
      <Link to={`/inventory/items/${item.id}/adjust`} style={{ marginRight: '10px' }}>
        <button>Adjust Stock</button>
      </Link>
      <Link to="/inventory">
        <button>Back to Items List</button>
      </Link>

      <div style={{ marginTop: '20px' }}>
        <h4>Transaction History</h4>
        {transactions.length > 0 ? (
          <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr>
                <th style={{padding: '8px'}}>Date</th>
                <th style={{padding: '8px'}}>Type</th>
                <th style={{padding: '8px'}}>Quantity</th>
                <th style={{padding: '8px'}}>User</th>
                <th style={{padding: '8px'}}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td style={{padding: '8px'}}>{tx.transaction_date ? format(new Date(tx.transaction_date), 'Pp') : 'N/A'}</td>
                  <td style={{padding: '8px'}}>{tx.transaction_type_display || tx.transaction_type}</td>
                  <td style={{padding: '8px', textAlign: 'right'}}>{parseFloat(tx.quantity).toFixed(2)}</td>
                  <td style={{padding: '8px'}}>{tx.user ? tx.user.username : 'N/A'}</td>
                  <td style={{padding: '8px'}}>{tx.notes || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No transaction history for this item.</p>
        )}
      </div>
    </div>
  );
};

export default InventoryItemDetail;
