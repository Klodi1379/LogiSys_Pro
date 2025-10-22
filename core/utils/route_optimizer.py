"""
Route optimization utilities using OR-Tools
"""
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from typing import List, Dict, Tuple, Optional
import math
import logging

logger = logging.getLogger(__name__)


class RouteOptimizer:
    """Route optimization using Google OR-Tools"""

    def __init__(self):
        self.distance_matrix = None
        self.locations = []

    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two coordinates using Haversine formula

        Args:
            lat1, lon1: First location coordinates
            lat2, lon2: Second location coordinates

        Returns:
            Distance in kilometers
        """
        R = 6371  # Earth's radius in kilometers

        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)

        a = (math.sin(delta_lat / 2) ** 2 +
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        return R * c

    def create_distance_matrix(self, locations: List[Dict]) -> List[List[int]]:
        """
        Create distance matrix from list of locations

        Args:
            locations: List of dicts with 'latitude' and 'longitude' keys

        Returns:
            Distance matrix (2D list)
        """
        self.locations = locations
        n = len(locations)
        matrix = [[0] * n for _ in range(n)]

        for i in range(n):
            for j in range(n):
                if i != j:
                    distance = self.calculate_distance(
                        locations[i]['latitude'],
                        locations[i]['longitude'],
                        locations[j]['latitude'],
                        locations[j]['longitude']
                    )
                    # Convert to meters and round to int
                    matrix[i][j] = int(distance * 1000)

        self.distance_matrix = matrix
        return matrix

    def optimize_route(
        self,
        locations: List[Dict],
        num_vehicles: int = 1,
        depot_index: int = 0,
        vehicle_capacity: Optional[List[int]] = None,
        demands: Optional[List[int]] = None
    ) -> Dict:
        """
        Optimize delivery route using OR-Tools

        Args:
            locations: List of location dicts with 'latitude', 'longitude', and 'name'
            num_vehicles: Number of vehicles available
            depot_index: Index of the depot/warehouse
            vehicle_capacity: List of vehicle capacities (optional)
            demands: List of delivery demands for each location (optional)

        Returns:
            Dict with optimized routes and statistics
        """
        try:
            # Create distance matrix
            if self.distance_matrix is None:
                self.create_distance_matrix(locations)

            # Create routing model
            manager = pywrapcp.RoutingIndexManager(
                len(locations),
                num_vehicles,
                depot_index
            )
            routing = pywrapcp.RoutingModel(manager)

            # Create distance callback
            def distance_callback(from_index, to_index):
                from_node = manager.IndexToNode(from_index)
                to_node = manager.IndexToNode(to_index)
                return self.distance_matrix[from_node][to_node]

            transit_callback_index = routing.RegisterTransitCallback(distance_callback)
            routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

            # Add capacity constraints if provided
            if vehicle_capacity and demands:
                def demand_callback(from_index):
                    from_node = manager.IndexToNode(from_index)
                    return demands[from_node]

                demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
                routing.AddDimensionWithVehicleCapacity(
                    demand_callback_index,
                    0,  # null capacity slack
                    vehicle_capacity,  # vehicle maximum capacities
                    True,  # start cumul to zero
                    'Capacity'
                )

            # Set search parameters
            search_parameters = pywrapcp.DefaultRoutingSearchParameters()
            search_parameters.first_solution_strategy = (
                routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
            )
            search_parameters.local_search_metaheuristic = (
                routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
            )
            search_parameters.time_limit.seconds = 30

            # Solve
            solution = routing.SolveWithParameters(search_parameters)

            if solution:
                return self._extract_routes(manager, routing, solution, locations)
            else:
                logger.warning("No solution found for route optimization")
                return {'error': 'No solution found'}

        except Exception as e:
            logger.error(f"Route optimization failed: {str(e)}")
            return {'error': str(e)}

    def _extract_routes(self, manager, routing, solution, locations) -> Dict:
        """Extract route information from solution"""
        routes = []
        total_distance = 0
        total_load = 0

        for vehicle_id in range(routing.vehicles()):
            index = routing.Start(vehicle_id)
            route = {
                'vehicle_id': vehicle_id,
                'stops': [],
                'distance': 0,
                'load': 0
            }

            while not routing.IsEnd(index):
                node_index = manager.IndexToNode(index)
                route['stops'].append({
                    'index': node_index,
                    'location': locations[node_index],
                    'order': len(route['stops'])
                })

                previous_index = index
                index = solution.Value(routing.NextVar(index))
                route['distance'] += routing.GetArcCostForVehicle(
                    previous_index, index, vehicle_id
                )

            # Add final return to depot
            node_index = manager.IndexToNode(index)
            route['stops'].append({
                'index': node_index,
                'location': locations[node_index],
                'order': len(route['stops'])
            })

            route['distance_km'] = round(route['distance'] / 1000, 2)
            total_distance += route['distance']

            routes.append(route)

        result = {
            'routes': routes,
            'total_distance_km': round(total_distance / 1000, 2),
            'num_vehicles_used': len([r for r in routes if len(r['stops']) > 2]),
            'success': True
        }

        logger.info(f"Route optimization completed: {result['num_vehicles_used']} vehicles, {result['total_distance_km']} km")
        return result

    def optimize_shipment_route(self, shipment) -> Dict:
        """
        Optimize route for a specific shipment

        Args:
            shipment: Shipment object with orders

        Returns:
            Optimized route information
        """
        # Get warehouse location
        warehouse = shipment.pickup_warehouse or shipment.orders.first().source_warehouse

        if not warehouse:
            return {'error': 'No warehouse found'}

        # Build locations list
        locations = [{
            'name': warehouse.name,
            'latitude': float(warehouse.latitude) if warehouse.latitude else 0.0,
            'longitude': float(warehouse.longitude) if warehouse.longitude else 0.0,
            'type': 'depot'
        }]

        # Add delivery locations
        for order in shipment.orders.all():
            # You might want to geocode the delivery address if coordinates aren't available
            locations.append({
                'name': order.customer.name,
                'latitude': 0.0,  # Add actual coordinates
                'longitude': 0.0,  # Add actual coordinates
                'type': 'delivery',
                'order_id': order.id,
                'order_number': order.order_number
            })

        # Optimize
        return self.optimize_route(
            locations=locations,
            num_vehicles=1,
            depot_index=0
        )

    def calculate_estimated_time(self, distance_km: float, average_speed_kmh: float = 50) -> Dict:
        """
        Calculate estimated travel time

        Args:
            distance_km: Distance in kilometers
            average_speed_kmh: Average speed in km/h

        Returns:
            Dict with time estimates
        """
        hours = distance_km / average_speed_kmh
        minutes = hours * 60

        return {
            'distance_km': round(distance_km, 2),
            'estimated_hours': round(hours, 2),
            'estimated_minutes': round(minutes, 0),
            'average_speed_kmh': average_speed_kmh
        }

    def suggest_vehicle(self, route_distance_km: float, total_weight_kg: float) -> Dict:
        """
        Suggest appropriate vehicle based on route and load

        Args:
            route_distance_km: Total route distance
            total_weight_kg: Total weight to transport

        Returns:
            Dict with vehicle suggestions
        """
        suggestions = []

        if total_weight_kg < 100 and route_distance_km < 50:
            suggestions.append({'type': 'motorcycle', 'priority': 1})
            suggestions.append({'type': 'van', 'priority': 2})

        elif total_weight_kg < 500:
            suggestions.append({'type': 'van', 'priority': 1})
            suggestions.append({'type': 'truck', 'priority': 2})

        elif total_weight_kg < 2000:
            suggestions.append({'type': 'truck', 'priority': 1})

        else:
            suggestions.append({'type': 'lorry', 'priority': 1})

        return {
            'total_weight_kg': total_weight_kg,
            'route_distance_km': route_distance_km,
            'suggestions': suggestions
        }
