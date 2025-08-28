from rest_framework import serializers
from accounts.models import CustomUser, UserProfile
from inventory.models import Supplier, ProductCategory, Product
from warehousing.models import Warehouse, StorageLocation, StockItem
from orders.models import Customer, Order, OrderItem
from transport.models import Vehicle, Driver, Shipment

# User Serializers
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'

class CustomUserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 
                 'phone_number', 'is_active_driver', 'profile', 'date_joined']
        read_only_fields = ['date_joined']

# Inventory Serializers
class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'
        read_only_fields = ['total_orders', 'created_at', 'updated_at']

class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    current_stock = serializers.ReadOnlyField()
    volume = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['current_stock', 'volume', 'created_at', 'updated_at']

# Warehousing Serializers
class StorageLocationSerializer(serializers.ModelSerializer):
    location_code = serializers.ReadOnlyField()
    
    class Meta:
        model = StorageLocation
        fields = '__all__'
        read_only_fields = ['location_code', 'created_at']

class WarehouseSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    storage_locations = StorageLocationSerializer(many=True, read_only=True)
    
    class Meta:
        model = Warehouse
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class StockItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    location_code = serializers.CharField(source='location.location_code', read_only=True)
    available_quantity = serializers.ReadOnlyField()
    
    class Meta:
        model = StockItem
        fields = '__all__'
        read_only_fields = ['available_quantity', 'last_movement', 'created_at', 'updated_at']

# Order Serializers
class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ['total_orders', 'total_spent', 'created_at', 'updated_at']

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    quantity_pending = serializers.ReadOnlyField()
    
    class Meta:
        model = OrderItem
        fields = '__all__'
        read_only_fields = ['line_total', 'quantity_pending']

class OrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.get_full_name', read_only=True)
    warehouse_name = serializers.CharField(source='source_warehouse.name', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['order_number', 'created_at', 'updated_at']

class OrderCreateSerializer(serializers.ModelSerializer):
    """Separate serializer for creating orders with items"""
    items = OrderItemSerializer(many=True, write_only=True)
    
    class Meta:
        model = Order
        fields = ['customer', 'priority', 'requested_delivery_date', 'delivery_address', 
                 'delivery_city', 'items']
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        
        # Calculate totals
        order.subtotal = sum(item.line_total for item in order.items.all())
        order.total_amount = order.subtotal
        order.save()
        
        return order

# Transport Serializers
class VehicleSerializer(serializers.ModelSerializer):
    is_available = serializers.ReadOnlyField()
    
    class Meta:
        model = Vehicle
        fields = '__all__'
        read_only_fields = ['is_available', 'created_at', 'updated_at']

class DriverSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    vehicle_license = serializers.CharField(source='assigned_vehicle.license_plate', read_only=True)
    
    class Meta:
        model = Driver
        fields = '__all__'
        read_only_fields = ['total_deliveries', 'on_time_delivery_rate', 'created_at', 'updated_at']

class ShipmentSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source='driver.user.get_full_name', read_only=True)
    vehicle_license = serializers.CharField(source='vehicle.license_plate', read_only=True)
    orders_count = serializers.IntegerField(source='orders.count', read_only=True)
    
    class Meta:
        model = Shipment
        fields = '__all__'
        read_only_fields = ['shipment_number', 'tracking_number', 'orders_count', 'created_at', 'updated_at']

# Dashboard Serializers
class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    total_orders = serializers.IntegerField()
    pending_orders = serializers.IntegerField()
    active_shipments = serializers.IntegerField()
    total_products = serializers.IntegerField()
    low_stock_products = serializers.IntegerField()
    available_vehicles = serializers.IntegerField()
    active_drivers = serializers.IntegerField()
    recent_orders = OrderSerializer(many=True, read_only=True)
    recent_shipments = ShipmentSerializer(many=True, read_only=True)
