import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css"; 
import axios from "axios";

interface Props {
    riderLocation: [number, number];
    deliveryLocation: [number, number];
}

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
          if (points.length > 0) {
            map.fitBounds(L.latLngBounds(points), { padding: [28, 28] });
          }
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


const UserOrderMap = ({ riderLocation, deliveryLocation }: Props) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Live Rider Tracking</p>
          <p className="text-xs text-slate-500">Clean route view without turn-by-turn overlay</p>
        </div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Live</span>
      </div>

      <MapContainer
        center={riderLocation}
        zoom={14}
        className="h-105 w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={riderLocation} icon={riderIcon}>
          <Popup>Rider</Popup>
        </Marker>
        <Marker position={deliveryLocation} icon={deliveryIcon}>
          <Popup>Delivery Location</Popup>
        </Marker>

        <RouteLine from={riderLocation} to={deliveryLocation} />
      </MapContainer>
    </div>
  );
};

export default UserOrderMap 