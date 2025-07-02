import apiClient from './api';

const inventoryService = {
  // === Item Endpoints ===
  getAllItems: (params) => {
    return apiClient.get('/inventory-items/', { params });
  },
  getItemById: (id) => {
    return apiClient.get(`/inventory-items/${id}/`);
  },
  createItem: (itemData) => {
    // quantity_on_hand is usually not set directly at creation via this form,
    // but through an initial STOCK_IN transaction.
    // The backend serializer for InventoryItem has quantity_on_hand as read-only.
    return apiClient.post('/inventory-items/', itemData);
  },
  updateItem: (id, itemData) => {
    // Similar to create, quantity_on_hand is not directly updatable.
    return apiClient.put(`/inventory-items/${id}/`, itemData); // or PATCH
  },
  deleteItem: (id) => {
    return apiClient.delete(`/inventory-items/${id}/`);
  },
  // Custom action on ItemViewSet
  adjustStock: (itemId, adjustmentData) => {
    // adjustmentData: { transaction_type: 'ADJ', quantity: 'delta_value', notes: '...' }
    return apiClient.post(`/inventory-items/${itemId}/adjust-stock/`, adjustmentData);
  },
  getItemTransactions: (itemId, params) => {
    return apiClient.get(`/inventory-items/${itemId}/transactions/`, { params });
  },

  // === Category Endpoints ===
  getAllCategories: (params) => {
    return apiClient.get('/inventory-categories/', { params });
  },
  createCategory: (categoryData) => {
    return apiClient.post('/inventory-categories/', categoryData);
  },
  updateCategory: (id, categoryData) => {
    return apiClient.put(`/inventory-categories/${id}/`, categoryData);
  },
  deleteCategory: (id) => {
    return apiClient.delete(`/inventory-categories/${id}/`);
  },

  // === Transaction Endpoints (Standalone, if needed, but often done via item adjustments) ===
  createTransaction: (transactionData) => {
    // transactionData: { item: pk, transaction_type: 'IN'/'OUT'/'ADJ', quantity: ..., notes: ... }
    // This directly creates a transaction and updates stock (handled by backend serializer)
    return apiClient.post('/inventory-transactions/', transactionData);
  },
  // Listing all transactions might be useful for an audit log view
  getAllTransactions: (params) => {
    return apiClient.get('/inventory-transactions/', { params });
  }
};

export default inventoryService;
