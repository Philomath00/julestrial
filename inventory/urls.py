from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InventoryCategoryViewSet, InventoryItemViewSet,
    InventoryTransactionViewSet
)

router = DefaultRouter()
router.register(r'inventory-categories', InventoryCategoryViewSet, basename='inventorycategory')
router.register(r'inventory-items', InventoryItemViewSet, basename='inventoryitem')
router.register(r'inventory-transactions', InventoryTransactionViewSet, basename='inventorytransaction')

# Custom actions on InventoryItemViewSet (e.g., /inventory-items/{pk}/adjust-stock/
# and /inventory-items/{pk}/transactions/) are auto-routed by DefaultRouter.

urlpatterns = [
    path('', include(router.urls)),
]
