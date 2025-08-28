from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import Q, Count, Sum
from django.utils import timezone
from datetime import timedelta

from .serializers import *
from accounts.models import CustomUser, UserProfile
from inventory.models import Supplier, ProductCategory, Product
from warehousing.models import Warehouse, StorageLocation, StockItem
from orders.models import Customer, Order, OrderItem
from transport.models import Vehicle, Driver, Shipment

# Authentication Views
class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token view that includes user info"""
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            # Add user info to the response
            from rest_framework_simplejwt.tokens import RefreshToken
            username = request.data.get('username')
            user = CustomUser.objects.get(username=username)
            
            response.data['user'] = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'full_name': user.get_full_name()
            }
        return response

# User Management ViewSets
class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """Only admins can create/delete users"""
        if self.action in ['create', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
            return [permission() for permission in permission_classes]
        return super().get_permissions()
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user info"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

# Inventory ViewSets
class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['is_active', 'rating']
    search_fields = ['name', 'contact_person', 'email']
    ordering_fields = ['name', 'rating', 'created_at']

class ProductCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category', 'supplier').all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['category', 'supplier', 'is_active']
    search_fields = ['name', 'sku', 'description']
    ordering_fields = ['name', 'sku', 'created_at']
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products with low stock levels"""
        low_stock_products = []
        for product in Product.objects.filter(is_active=True):
            current_stock = product.current_stock
            if current_stock <= product.reorder_point:
                product_data = self.get_serializer(product).data
                product_data['current_stock'] = current_stock
                low_stock_products.append(product_data)
        
        return Response(low_stock_products)

# Warehousing ViewSets
class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.select_related('manager').all()
    serializer_class = WarehouseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['is_active', 'city', 'country']
    search_fields = ['name', 'code', 'city']

class StorageLocationViewSet(viewsets.ModelViewSet):
    queryset = StorageLocation.objects.select_related('warehouse').all()
    serializer_class = StorageLocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['warehouse', 'is_available']

class StockItemViewSet(viewsets.ModelViewSet):
    queryset = StockItem.objects.select_related('product', 'warehouse', 'location').all()
    serializer_class = StockItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['warehouse', 'product']
    search_fields = ['product__name', 'product__sku', 'batch_number']
    
    @action(detail=False, methods=['get'])
    def by_warehouse(self, request):
        """Get stock items grouped by warehouse"""
        warehouse_id = request.query_params.get('warehouse_id')
        if warehouse_id:
            items = self.get_queryset().filter(warehouse_id=warehouse_id)
            serializer = self.get_serializer(items, many=True)
            return Response(serializer.data)
        return Response({'error': 'warehouse_id parameter required'}, 
                       status=status.HTTP_400_BAD_REQUEST)

# Order Management ViewSets
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['customer_type', 'is_active']
    search_fields = ['name', 'email', 'phone']

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related('customer', 'processed_by', 'source_warehouse').prefetch_related('items__product').all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'priority', 'customer']
    search_fields = ['order_number', 'customer__name']
    ordering_fields = ['order_date', 'status']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm an order and change status"""
        order = self.get_object()
        if order.status == 'pending':
            order.status = 'confirmed'
            order.processed_by = request.user
            order.save()
            return Response({'status': 'Order confirmed'})
        return Response({'error': 'Order cannot be confirmed'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get order statistics for dashboard"""
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        
        stats = {
            'total_orders': Order.objects.count(),
            'pending_orders': Order.objects.filter(status='pending').count(),
            'orders_today': Order.objects.filter(order_date__date=today).count(),
            'orders_this_week': Order.objects.filter(order_date__date__gte=week_ago).count(),
        }
        return Response(stats)

# Transport ViewSets
class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['vehicle_type', 'status']
    search_fields = ['license_plate', 'make', 'model']
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get available vehicles"""
        available_vehicles = Vehicle.objects.filter(status='active')
        serializer = self.get_serializer(available_vehicles, many=True)
        return Response(serializer.data)

class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.select_related('user', 'assigned_vehicle').all()
    serializer_class = DriverSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['is_available', 'license_class']
    search_fields = ['user__first_name', 'user__last_name', 'license_number']

class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.select_related('driver__user', 'vehicle').prefetch_related('orders').all()
    serializer_class = ShipmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'driver', 'vehicle']
    search_fields = ['shipment_number', 'tracking_number']
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update shipment status"""
        shipment = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in dict(Shipment.STATUS_CHOICES):
            shipment.status = new_status
            
            # Update timestamps based on status
            if new_status == 'picked_up':
                shipment.pickup_date = timezone.now()
            elif new_status == 'delivered':
                shipment.actual_delivery = timezone.now()
            
            shipment.save()
            return Response({'status': f'Shipment status updated to {new_status}'})
        
        return Response({'error': 'Invalid status'}, 
                       status=status.HTTP_400_BAD_REQUEST)

# Dashboard ViewSet
class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get comprehensive dashboard statistics"""
        today = timezone.now().date()
        
        # Calculate stats
        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(status='pending').count()
        active_shipments = Shipment.objects.filter(status__in=['picked_up', 'in_transit']).count()
        total_products = Product.objects.filter(is_active=True).count()
        
        # Low stock products
        low_stock_count = 0
        for product in Product.objects.filter(is_active=True):
            if product.current_stock <= product.reorder_point:
                low_stock_count += 1
        
        available_vehicles = Vehicle.objects.filter(status='active').count()
        active_drivers = Driver.objects.filter(is_available=True).count()
        
        # Recent data
        recent_orders = Order.objects.order_by('-created_at')[:5]
        recent_shipments = Shipment.objects.order_by('-created_at')[:5]
        
        stats_data = {
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'active_shipments': active_shipments,
            'total_products': total_products,
            'low_stock_products': low_stock_count,
            'available_vehicles': available_vehicles,
            'active_drivers': active_drivers,
            'recent_orders': OrderSerializer(recent_orders, many=True).data,
            'recent_shipments': ShipmentSerializer(recent_shipments, many=True).data,
        }
        
        return Response(stats_data)
