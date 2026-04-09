import type { IOrder } from "../types";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css"; 
import axios from "axios";

const riderIcon = new L.DivIcon({
  html: "🛵",
  iconSize: [30, 30],
  className: "",
});

const deliveryIcon = new L.DivIcon({
  html: "📦",
  iconSize: [30, 30],
  className: "",
});

const restaurantIcon = new L.DivIcon({
  html: "🍽️",
  iconSize: [30, 30],
  className: "",
});

interface Props {
    order:IOrder;
}

type RouteStage = "restaurant" | "delivery";

const RouteLine = ({
  from,
  to,
}: {
  from: [number, number];
  to: [number, number];
}) => {
  const map = useMap();
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);

  useEffect(() => {
    let active = true;

    const loadRoute = async () => {
      try {
        const { data } = await axios.get(
          `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}`,
          {
            params: {
              overview: "full",
              geometries: "geojson",
              steps: false,
            },
          },
        );

        const coordinates = data?.routes?.[0]?.geometry?.coordinates ?? [];
        const points = coordinates.map(([longitude, latitude]: [number, number]) => [latitude, longitude] as [number, number]);

        if (active) {
          setRoutePoints(points);
        }
      } catch (error) {
        console.error("Failed to load route:", error);
        if (active) {
          setRoutePoints([]);
        }
      }
    };

    loadRoute();

    return () => {
      active = false;
    };
  }, [from, to, map]);

  if (routePoints.length === 0) {
    return null;
  }

  return <Polyline positions={routePoints} pathOptions={{ color: "#2563eb", weight: 5, opacity: 0.9 }} />;
};

const MapView = ({ center }: { center: [number, number] }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 17, { animate: true });
  }, [center, map]);

  return null;
};




const RiderOrderMap = ({ order }: Props) => {
  const [riderLocation, setRiderLocation] = useState<[number, number] | null>(null);
  const [restaurantLocation, setRestaurantLocation] = useState<[number, number] | null>(null);

  if(order.deliveryAddress.latitude === null || order.deliveryAddress.longitude === null){
    return null;
  }

  const deliveryLocation: [number, number] = [order.deliveryAddress.latitude, order.deliveryAddress.longitude];

  useEffect(() => {
    let active = true;

    const fetchRestaurantLocation = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/restaurant/${order.restaurantId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const coordinates = data?.restaurant?.autoLocation?.coordinates;
        if (active && Array.isArray(coordinates) && coordinates.length === 2) {
          setRestaurantLocation([coordinates[1], coordinates[0]]);
        }
      } catch (error) {
        console.error("Error fetching restaurant location:", error);
      }
    };

    fetchRestaurantLocation();

    return () => {
      active = false;
    };
  }, [order.restaurantId]);

  useEffect(() => {
    const fetchLocation = () => {
      navigator.geolocation.getCurrentPosition((pos)=>{
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;

        setRiderLocation([latitude, longitude]);

        axios.post(`${import.meta.env.VITE_REALTIME_SERVICE_URL}/api/v1/internal/emit`, {
          event: "rider:location",
          room: `user:${order.userId}`,
          payload: {
            latitude,
            longitude,
          }
        },{
          headers: {
            "x-internal-key": import.meta.env.VITE_INTERNAL_SERVICE_KEY,
          }
        });

      },(err) => console.error("Error fetching location:", err),
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
        }
      );
    }
    fetchLocation();
    const interval = setInterval(fetchLocation, 10000);

    return () => clearInterval(interval);
  },[order.userId]);

  if(!riderLocation){
    return null;
  }

  const routeStage: RouteStage =
    order.status === "picked_up" || order.status === "delivered"
      ? "delivery"
      : "restaurant";

  const routeTarget = routeStage === "restaurant" ? restaurantLocation : deliveryLocation;

  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">Rider Map</p>
        <p className="text-xs text-slate-500">
          {routeStage === "restaurant"
            ? "Route to the restaurant first"
            : "Now route to the delivery location"}
        </p>
      </div>
      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
        {routeStage === "restaurant" ? "To Restaurant" : "To Delivery"}
      </span>
    </div>

    <div className="relative">
      <MapContainer
        center={riderLocation}
        zoom={17}
        className="h-105 w-full"
      >
        <MapView center={riderLocation} />
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={riderLocation} icon={riderIcon}>
          <Popup>Your bike</Popup>
        </Marker>

        {restaurantLocation && routeStage === "restaurant" && (
          <Marker position={restaurantLocation} icon={restaurantIcon}>
            <Popup>Restaurant</Popup>
          </Marker>
        )}

        <Marker position={deliveryLocation} icon={deliveryIcon}>
          <Popup>Delivery Location</Popup>
        </Marker>

        {routeTarget && <RouteLine from={riderLocation} to={routeTarget} />}

      </MapContainer>
    </div>

  </div>
}

export default RiderOrderMap