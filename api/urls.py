from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import *

# Create router and register viewsets
router = DefaultRouter()

# User management
router.register(r'users', UserViewSet, basename='user')

# Inventory management
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'categories', ProductCategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')

# Warehousing
router.register(r'warehouses', WarehouseViewSet, basename='warehouse')
router.register(r'storage-locations', StorageLocationViewSet, basename='storage-location')
router.register(r'stock-items', StockItemViewSet, basename='stock-item')

# Order management
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'orders', OrderViewSet, basename='order')

# Transport
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'drivers', DriverViewSet, basename='driver')
router.register(r'shipments', ShipmentViewSet, basename='shipment')

# Dashboard
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # API routes
    path('', include(router.urls)),
]
