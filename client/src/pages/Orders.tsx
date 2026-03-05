import { useEffect, useState } from "react";
import type { IOrder } from "../types";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import axios from "axios";

const ACTIVE_STATUS=[
    "placed",
    "accepted",
    "preparing",
    "ready_for_rider",
    "rider_assigned",
    "picked_up"
]

const Orders = () => {
    const [orders, setOrders] = useState<IOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const socketContext = useSocket();
    const socket = socketContext?.socket;

    const fetchOrders = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/order/my`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            console.log(data);
            
            setOrders(data.orders);
        } catch (error) {
            console.log("Error fetching orders:", error);
        }finally{
            setLoading(false);
        }
    }

    useEffect(()=>{
        fetchOrders();
    }, [])

    useEffect(()=>{
        if(!socket) return;

        const onOrderUpdate = ()=>{
            fetchOrders();
        }

        socket.on("order:status_updated", onOrderUpdate);

        return ()=> {
            socket.off("order:status_updated", onOrderUpdate);
        }
    },[socket]);

    if(loading){
        return <p className="text-center text-gray-500">Loading...</p>
    }

    if(orders.length === 0){
        return <div className="flex min-h-[60vh] items-center justify-center">
            <p className="text-gray-500">No orders found</p>
        </div>
    }

    const activeOrders = orders.filter(order => ACTIVE_STATUS.includes(order.status));
    const completedOrders = orders.filter(order => !ACTIVE_STATUS.includes(order.status));



  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">My Orders</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Active Orders</h2>

        {activeOrders.length === 0 ? (
          <p>No active orders</p>
        ) : (
          activeOrders.map((order) => (
            <OrderRow
              key={order._id}
              order={order}
              onClick={() => navigate(`/order/${order._id}`)}
            />
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Completed Orders</h2>

        {completedOrders.length === 0 ? (
          <p>No Completed orders</p>
        ) : (
          completedOrders.map((order) => (
            <OrderRow
              key={order._id}
              order={order}
              onClick={() => navigate(`/order/${order._id}`)}
            />
          ))
        )}
      </section>
    </div>
  )
}

export default Orders

const OrderRow = ({
  order,
  onClick,
}: {
  order: IOrder;
  onClick: () => void;
}) => {
  return (
    <div
      className="cursor-pointer rounded-xl bg-white p-4 shadow-sm hover:bg-gray-50"
      onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">Order #{order._id.slice(-6)}</p>
        <span className="text-xs capitalize text-gray-500">{order.status}</span>
      </div>

      <div className="mt-2 text-sm text-gray-600">
        {order.items.map((item, i) => (
          <span key={i}>
            {item.name} x {item.quantity}
            {i < order.items.length - 1 && ", "}
          </span>
        ))}
      </div>

      <div className="mt-2 flex justify-between text-sm font-medium">
        <span>Total</span>
        <span>₹{order.totalAmount}</span>
      </div>
    </div>
  );
};
