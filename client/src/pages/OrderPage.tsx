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
            const {data} = await axios.get(`${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/order/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })
            console.log(data)
            setOrder(data.order);
        } catch (error) {
            console.log("Error fetching order details:", error);
        }finally{            
            setLoading(false);
        }
    }

    useEffect(()=>{
        fetchOrder();
    }, [id]);

    useEffect(()=>{
        if(!socket) return;

        const onOrderUpdate = () => {
            fetchOrder();
        }
        socket.on("order:status_updated", onOrderUpdate);
        return ()=> {
            socket.off("order:status_updated", onOrderUpdate);
        }

    }, [socket]);

    if(loading){
        return <p className="text-center text-gray-500">Loading...</p>
    }

    if(!order){
        return <p className="text-center text-gray-500">Order not found</p>
    }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold">Order #{order._id.slice(-6)}</h1>
      <div className="rounded-lg bg-blue-50 p-3 text-sm font-medium">
        Status: <span className="capitalize">{order.status}</span>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm space-y-2">
        <h2 className="font-semibold">Items</h2>
        {order.items.map((item, i) => (
          <div className="flex justify-between text-sm" key={i}>
            <span>
              {item.name} x {item.quantity}
            </span>
            <span>₹{item.price * item.quantity}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm space-y-1">
        <h2 className="font-semibold">Delivery Address</h2>
        <p className="text-sm text-gray-600">
          {order.deliveryAddress.fromattedAddress}
        </p>
        <p className="text-sm text-gray-600">
          Mobile: {order.deliveryAddress.mobile}
        </p>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm space-y-2">
        <div className="flex justify-between text-sm">
          <span>SubTotal</span> <span>₹{order.subTotal}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Delivery Fee</span> <span>₹{order.deliveryCharge}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Platform Fee</span> <span>₹{order.platformCharge}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Total</span> <span>₹{order.totalAmount}</span>
        </div>

        <p className="text-xs text-gray-500">
          Payment Method: {order.paymentMethod}
        </p>
        <p className="text-xs text-gray-500">
          Payment Status: {order.paymentStatus}
        </p>
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
  )
}

export default OrderPage    