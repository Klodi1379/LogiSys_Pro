from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import CustomUser
from inventory.models import Supplier, ProductCategory, Product
from warehousing.models import Warehouse, StorageLocation, StockItem
from orders.models import Customer
from transport.models import Vehicle, Driver

User = get_user_model()

class Command(BaseCommand):
    help = 'Setup initial data for the logistics system'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Setting up Logistics Management System...'))
        
        # Create superuser
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@logistics.com',
                password='admin123',
                role='admin'
            )
            self.stdout.write(self.style.SUCCESS('Superuser created: admin/admin123'))
        
        # Create sample manager user
        if not User.objects.filter(username='manager').exists():
            User.objects.create_user(
                username='manager',
                email='manager@logistics.com',
                password='manager123',
                role='warehouse_manager',
                first_name='John',
                last_name='Manager'
            )
            self.stdout.write(self.style.SUCCESS('Manager user created: manager/manager123'))
        
        # Create sample data
        self.create_sample_suppliers()
        self.create_sample_categories()
        self.create_sample_warehouses()
        self.create_sample_products()
        self.create_sample_customers()
        self.create_sample_vehicles()
        
        self.stdout.write(self.style.SUCCESS('Initial setup completed successfully!'))
        self.stdout.write(self.style.SUCCESS('You can now access the admin at: http://127.0.0.1:8000/admin/'))
        self.stdout.write(self.style.SUCCESS('Login credentials: admin/admin123'))

    def create_sample_suppliers(self):
        suppliers_data = [
            {
                'name': 'ABC Electronics Supplier',
                'contact_person': 'Mike Johnson',
                'email': 'mike@abcelectronics.com',
                'phone': '+1234567890',
                'address': '123 Electronics Street, Tech City',
                'tax_number': 'TAX001',
                'rating': 5
            },
            {
                'name': 'Global Manufacturing Co.',
                'contact_person': 'Sarah Wilson',
                'email': 'sarah@globalmanuf.com',
                'phone': '+1234567891',
                'address': '456 Industrial Ave, Manufacturing District',
                'tax_number': 'TAX002',
                'rating': 4
            }
        ]
        
        for data in suppliers_data:
            supplier, created = Supplier.objects.get_or_create(
                name=data['name'],
                defaults=data
            )
            if created:
                self.stdout.write(f'Created supplier: {supplier.name}')

    def create_sample_categories(self):
        categories_data = [
            {'name': 'Electronics'},
            {'name': 'Components'},
            {'name': 'Accessories'},
            {'name': 'Tools'},
            {'name': 'Office Supplies'}
        ]
        
        for data in categories_data:
            category, created = ProductCategory.objects.get_or_create(**data)
            if created:
                self.stdout.write(f'Created category: {category.name}')

    def create_sample_warehouses(self):
        manager = User.objects.filter(role='warehouse_manager').first()
        if not manager:
            manager = User.objects.filter(role='admin').first()
        
        warehouses_data = [
            {
                'name': 'Main Warehouse',
                'code': 'WH001',
                'address': '789 Warehouse Blvd',
                'city': 'Distribution City',
                'state': 'NY',
                'postal_code': '12345',
                'country': 'USA',
                'total_capacity_sqm': 5000.00,
                'total_capacity_cbm': 25000.00,
                'manager': manager
            },
            {
                'name': 'Regional Warehouse',
                'code': 'WH002', 
                'address': '321 Storage Lane',
                'city': 'Regional Hub',
                'state': 'CA',
                'postal_code': '67890',
                'country': 'USA',
                'total_capacity_sqm': 3000.00,
                'total_capacity_cbm': 15000.00,
                'manager': manager
            }
        ]
        
        for data in warehouses_data:
            warehouse, created = Warehouse.objects.get_or_create(
                code=data['code'],
                defaults=data
            )
            if created:
                self.stdout.write(f'Created warehouse: {warehouse.name}')
                
                # Create sample storage locations
                for zone in ['A', 'B']:
                    for aisle in ['01', '02']:
                        for rack in ['R1', 'R2']:
                            for shelf in ['S1', 'S2']:
                                StorageLocation.objects.get_or_create(
                                    warehouse=warehouse,
                                    zone=zone,
                                    aisle=aisle,
                                    rack=rack,
                                    shelf=shelf
                                )

    def create_sample_products(self):
        supplier = Supplier.objects.first()
        category = ProductCategory.objects.first()
        
        if supplier and category:
            products_data = [
                {
                    'name': 'Wireless Mouse',
                    'sku': 'WM001',
                    'description': 'Ergonomic wireless mouse with USB receiver',
                    'category': category,
                    'supplier': supplier,
                    'weight': 0.150,
                    'length': 12.0,
                    'width': 6.0,
                    'height': 4.0,
                    'cost_price': 15.00,
                    'selling_price': 25.00
                },
                {
                    'name': 'USB Cable - 2m',
                    'sku': 'USB001',
                    'description': 'High-speed USB cable 2 meters',
                    'category': category,
                    'supplier': supplier,
                    'weight': 0.100,
                    'length': 200.0,
                    'width': 2.0,
                    'height': 1.0,
                    'cost_price': 8.00,
                    'selling_price': 15.00
                }
            ]
            
            for data in products_data:
                product, created = Product.objects.get_or_create(
                    sku=data['sku'],
                    defaults=data
                )
                if created:
                    self.stdout.write(f'Created product: {product.name}')

    def create_sample_customers(self):
        customers_data = [
            {
                'name': 'Tech Solutions Inc.',
                'email': 'orders@techsolutions.com',
                'phone': '+1234567892',
                'address': '100 Business Ave',
                'city': 'Business City',
                'state': 'TX',
                'postal_code': '11111',
                'country': 'USA',
                'customer_type': 'business'
            },
            {
                'name': 'Individual Customer',
                'email': 'john.doe@email.com',
                'phone': '+1234567893',
                'address': '200 Home Street',
                'city': 'Residential Area',
                'state': 'FL',
                'postal_code': '22222',
                'country': 'USA',
                'customer_type': 'individual'
            }
        ]
        
        for data in customers_data:
            customer, created = Customer.objects.get_or_create(
                email=data['email'],
                defaults=data
            )
            if created:
                self.stdout.write(f'Created customer: {customer.name}')

    def create_sample_vehicles(self):
        vehicles_data = [
            {
                'license_plate': 'LOG001',
                'vehicle_type': 'van',
                'make': 'Ford',
                'model': 'Transit',
                'year': 2022,
                'color': 'White',
                'max_weight_kg': 1500.00,
                'max_volume_cbm': 10.0
            },
            {
                'license_plate': 'LOG002',
                'vehicle_type': 'truck',
                'make': 'Mercedes',
                'model': 'Sprinter',
                'year': 2021,
                'color': 'Blue',
                'max_weight_kg': 3500.00,
                'max_volume_cbm': 20.0
            }
        ]
        
        for data in vehicles_data:
            vehicle, created = Vehicle.objects.get_or_create(
                license_plate=data['license_plate'],
                defaults=data
            )
            if created:
                self.stdout.write(f'Created vehicle: {vehicle.license_plate}')
