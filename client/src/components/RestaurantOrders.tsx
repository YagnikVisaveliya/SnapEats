import { useEffect, useRef, useState } from "react";
import type { IOrder } from "../types";
import { useSocket } from "../context/SocketContext";
import audio from "../assets/notification.mp3";
import axios from "axios";
import OrderCard from "./OrderCard";

const ACTIVE_STATUS = [
  "placed",
  "accepted",
  "preparing",
  "ready_for_rider",
  "rider_assigned",
  "picked_up",
];

const RestaurantOrders = ({ restaurantId }: { restaurantId: string }) => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioUnlock, setAudioUnlock] = useState(false);

  const socket = useSocket();
  const audioref = useRef<HTMLAudioElement | null>(null);

  const [activeTab, setActiveTab] = useState<"ACTIVE" | "COMPLETED">("ACTIVE");

  useEffect(() => {
    audioref.current = new Audio(audio);
    audioref.current.load();
  }, []);

  const unlockAudio = () => {
    if (audioref.current) {
      audioref.current
        .play()
        .then(() => {
          audioref.current?.pause();
          audioref.current!.currentTime = 0;
          setAudioUnlock(true);
          console.log("Audio unlocked");
        })
        .catch((error) => {
          console.log("Error unlocking audio:", error);
        });
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/order/restaurant/${restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      setOrders(data.orders);
      // setLoading(false);
    } catch (error) {
      console.log("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchOrders();
  }, [restaurantId]);

  useEffect(() => {
    if (!socket) return;

    const onNewOrder = () => {
      console.log("New Order recived socket");

      if (audioUnlock && audioref.current) {
        audioref.current.currentTime = 0;
        audioref.current.play().catch((err) => {
          console.error("Audio play failed:", err);
        });
      }

      fetchOrders();
    };

    socket.on("order:new", onNewOrder);

    return () => {
      socket.off("order:new", onNewOrder);
    };
  }, [socket, audioUnlock]);

  useEffect(() => {
    if(!socket) return;
    const onUpdateOrder = () => {
      fetchOrders();
    }
    socket.on("order:rider_assigned", onUpdateOrder);

    return () => {
      socket.off("order:rider_assigned", onUpdateOrder);
    }

  }, [socket]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-gray-500">Loading orders...</p>
      </div>
    );
  }

  const activeOrders = orders.filter((order) =>
    ACTIVE_STATUS.includes(order.status),
  );
  const completedOrders = orders.filter(
    (order) => !ACTIVE_STATUS.includes(order.status),
  );

  return (
    <div className="space-y-6">
      {!audioUnlock && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <p className="font-semibold text-blue-900">
                Enable Sound Notification
              </p>
              <p className="text-sm text-blue-700">
                Get Notified when new orders arrive
              </p>
            </div>
          </div>

          <button
            onClick={unlockAudio}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition active:scale-95"
          >
            Enable sound
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200 pb-px">
        <button
          onClick={() => setActiveTab("ACTIVE")}
          className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors ${
            activeTab === "ACTIVE"
              ? "border-b-2 border-red-500 text-red-600"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Active Orders
        </button>
        <button
          onClick={() => setActiveTab("COMPLETED")}
          className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors ${
            activeTab === "COMPLETED"
              ? "border-b-2 border-red-500 text-red-600"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Completed Orders
        </button>
      </div>

      {activeTab === "ACTIVE" && (
        <div className="space-y-4">
          {activeOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No Active orders</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onStatusUpdate={fetchOrders}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "COMPLETED" && (
        <div className="space-y-4">
          {completedOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No completed orders</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onStatusUpdate={fetchOrders}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RestaurantOrders;
