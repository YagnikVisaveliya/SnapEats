import { useParams } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useEffect, useState } from "react";
import type { IOrder } from "../types";
import axios from "axios";

const OrderPage = () => {
  const { id } = useParams();
  const socketContext = useSocket();
  const socket = socketContext?.socket;

  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/order/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      console.log(data);
      setOrder(data.order);
    } catch (error) {
      console.log("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (!socket) return;

    const onOrderUpdate = () => {
      fetchOrder();
    };
    socket.on("order:status_updated", onOrderUpdate);
    return () => {
      socket.off("order:status_updated", onOrderUpdate);
    };
  }, [socket]);

  if (loading) {
    return <p className="text-center text-gray-500">Loading...</p>;
  }

  if (!order) {
    return <p className="text-center text-gray-500">Order not found</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <div className="max-w-md mx-auto space-y-5">
        {/* Order Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">
            Order #{order._id.slice(-6)}
          </h1>

          <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full capitalize">
            {order.status}
          </span>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Items</h2>

          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center text-sm border-b pb-2 last:border-none"
              >
                <span className="text-gray-700">
                  {item.name}{" "}
                  <span className="text-gray-500">x{item.quantity}</span>
                </span>

                <span className="font-medium text-gray-800">
                  ₹{item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h2 className="font-semibold text-gray-800 mb-2">Delivery Address</h2>

          <p className="text-sm text-gray-600 leading-relaxed">
            {order.deliveryAddress.fromattedAddress}
          </p>

          <p className="text-sm text-gray-500 mt-2">
            📞 {order.deliveryAddress.mobile}
          </p>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-4 space-y-2">
          <h2 className="font-semibold text-gray-800 mb-2">Payment Summary</h2>

          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>₹{order.subTotal}</span>
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery Fee</span>
            <span>₹{order.deliveryCharge}</span>
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>Platform Fee</span>
            <span>₹{order.platformCharge}</span>
          </div>

          <div className="border-t pt-2 flex justify-between font-semibold text-gray-800">
            <span>Total</span>
            <span>₹{order.totalAmount}</span>
          </div>

          <div className="pt-3 border-t text-xs text-gray-500 space-y-1">
            <p>Payment Method: {order.paymentMethod}</p>
            <p>Payment Status: {order.paymentStatus}</p>
          </div>
        </div>
      </div>

      {/* {(order.status === "rider_assigned" || order.status === "picked_up") &&
        (riderLocation ? (
          <UserOrderMap
            riderLocation={riderLocation}
            deliveryLocation={[
              order.deliveryAddress.latitude!,
              order.deliveryAddress.longitude!,
            ]}
          />
        ) : (
          <p>Waiting for rider location</p>
        ))} */}
    </div>
  );
};

export default OrderPage;
