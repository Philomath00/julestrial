import React, { useState, useEffect } from 'react';
import inventoryService from '../../services/inventoryService';
import { Link } from 'react-router-dom';

const InventoryItemList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getAllItems();
      setItems(response.data.results || response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory items.');
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete item ${id}? This might be restricted if transactions exist.`)) {
      try {
        await inventoryService.deleteItem(id);
        // Refetch or filter list locally
        setItems(prevItems => prevItems.filter(item => item.id !== id));
        alert(`Item ${id} deleted successfully.`);
      } catch (err) {
        alert(`Failed to delete item ${id}: ${err.message} - ${err.response?.data?.detail || ''}`);
        console.error("Delete error:", err.response?.data || err);
      }
    }
  };

  if (loading) return <p>Loading inventory items...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!items.length) {
    return (
      <div>
        <p>No inventory items found.</p>
        <Link to="/inventory/items/new"><button>Add New Item</button></Link>
      </div>
    );
  }

  return (
    <div>
      <h2>Inventory Items</h2>
      <Link to="/inventory/items/new">
        <button style={{ marginBottom: '1em' }}>Add New Item</button>
      </Link>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{padding: '8px'}}>ID</th>
            <th style={{padding: '8px'}}>Name</th>
            <th style={{padding: '8px'}}>Category</th>
            <th style={{padding: '8px'}}>Quantity on Hand</th>
            <th style={{padding: '8px'}}>Unit</th>
            <th style={{padding: '8px'}}>Reorder Level</th>
            <th style={{padding: '8px'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td style={{padding: '8px'}}>{item.id}</td>
              <td style={{padding: '8px'}}>{item.name}</td>
              <td style={{padding: '8px'}}>{item.category_name || (item.category || 'N/A')}</td>
              <td style={{padding: '8px', textAlign: 'right'}}>{parseFloat(item.quantity_on_hand).toFixed(2)}</td>
              <td style={{padding: '8px'}}>{item.unit_of_measure || 'N/A'}</td>
              <td style={{padding: '8px', textAlign: 'right'}}>{parseFloat(item.reorder_level).toFixed(2)}</td>
              <td style={{padding: '8px', textAlign: 'center'}}>
                <Link to={`/inventory/items/${item.id}`} style={{ marginRight: '5px' }}>
                  <button>View</button>
                </Link>
                <Link to={`/inventory/items/${item.id}/edit`} style={{ marginRight: '5px' }}>
                  <button>Edit</button>
                </Link>
                <Link to={`/inventory/items/${item.id}/adjust`} style={{ marginRight: '5px' }}>
                  <button>Adjust Stock</button>
                </Link>
                <button onClick={() => handleDelete(item.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryItemList;
