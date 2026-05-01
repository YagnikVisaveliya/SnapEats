import { useEffect, useState } from "react";
import type { IOrder } from "../types";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import toast from "react-hot-toast";
import { FiClock, FiShoppingBag } from "react-icons/fi";
import { useAppData } from "../context/AppContext";

const ACTIVE_STATUS=[
    "placed",
    "accepted",
    "preparing",
    "ready_for_rider",
    "rider_assigned",
    "picked_up"
]

const Orders = () => {
  const { fetchCart } = useAppData();
    const [orders, setOrders] = useState<IOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(null);
    const navigate = useNavigate();
    const socket = useSocket();

    const getSmartReorderCandidates = (allOrders: IOrder[]) => {
      const deliveredOrders = allOrders.filter((order) => order.status === "delivered");
      const nowHour = new Date().getHours();

      const scored = deliveredOrders.map((order) => {
        const orderHour = new Date(order.createdAt).getHours();
        const hourDistance = Math.min(
          Math.abs(nowHour - orderHour),
          24 - Math.abs(nowHour - orderHour),
        );

        return {
          order,
          hourDistance,
          createdAtTime: new Date(order.createdAt).getTime(),
        };
      });

      return scored
        .sort((a, b) => {
          if (a.hourDistance !== b.hourDistance) return a.hourDistance - b.hourDistance;
          return b.createdAtTime - a.createdAtTime;
        })
        .slice(0, 3)
        .map((entry) => entry.order);
    };

    const smartReorderOrders = getSmartReorderCandidates(orders);

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
        socket.on("order:rider_assigned", onOrderUpdate);

        return ()=> {
            socket.off("order:status_updated", onOrderUpdate);
            socket.off("order:rider_assigned", onOrderUpdate);
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

    const reorderAndCheckout = async (order: IOrder) => {
      if (!order.items?.length) {
        toast.error("No items available in this order to reorder");
        return;
      }

      setReorderingOrderId(order._id);

      try {
        const authHeaders = {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        };

        const { data: cartData } = await axios.get(
          `${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/cart/myCart`,
          { headers: authHeaders },
        );

        const existingCart = Array.isArray(cartData?.cart) ? cartData.cart : [];
        const existingRestaurantId = existingCart[0]?.restaurantId?._id ?? existingCart[0]?.restaurantId;
        const currentOrderRestaurantId = String(order.restaurantId);

        if (
          existingCart.length > 0 &&
          String(existingRestaurantId) !== currentOrderRestaurantId
        ) {
          const shouldClear = window.confirm(
            "Your cart has items from another restaurant. Clear cart and continue reorder?",
          );

          if (!shouldClear) {
            setReorderingOrderId(null);
            return;
          }

          await axios.delete(
            `${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/cart/clear`,
            { headers: authHeaders },
          );
        }

        for (const item of order.items) {
          const quantity = Number(item.quantity ?? 0);
          if (!item.itemId || quantity <= 0) continue;

          for (let i = 0; i < quantity; i++) {
            await axios.post(
              `${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/cart/add`,
              {
                restaurantId: currentOrderRestaurantId,
                itemId: item.itemId,
              },
              { headers: authHeaders },
            );
          }
        }

        await fetchCart();
        toast.success("Items added to cart. Redirecting to checkout...");
        navigate("/checkout");
      } catch (error: any) {
        const message = error?.response?.data?.message || "Failed to reorder items";
        toast.error(message);
      } finally {
        setReorderingOrderId(null);
      }
    };



  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">My Orders</h1>

      {smartReorderOrders.length > 0 && (
        // <section className="space-y-3 rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
        //   <div className="flex items-center justify-between gap-3">
        //     <div>
        //       <h2 className="text-lg font-semibold text-slate-900">Quick Reorder</h2>
        //       <p className="text-sm text-slate-600">Based on your recent delivered orders and current time</p>
        //     </div>
        //     <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-rose-600 shadow-sm">
        //       <FiClock />
        //       Smart picks
        //     </span>
        //   </div>

        //   <div className="grid gap-3 md:grid-cols-3">
        //     {smartReorderOrders.map((order) => (
        //       <div key={`quick-${order._id}`} className="rounded-xl border border-white bg-white p-3 shadow-sm">
        //         <p className="text-sm font-semibold text-slate-900">{order.restaurantName || `Order #${order._id.slice(-6)}`}</p>
        //         <p className="mt-1 line-clamp-2 text-xs text-slate-600">
        //           {order.items.slice(0, 3).map((item) => `${item.name} x ${item.quantity}`).join(", ")}
        //         </p>
        //         <p className="mt-2 text-sm font-bold text-slate-900">₹{order.totalAmount}</p>

        //         <button
        //           onClick={() => reorderAndCheckout(order)}
        //           disabled={reorderingOrderId === order._id}
        //           className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#E23744] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#c92f3c] disabled:cursor-not-allowed disabled:opacity-70"
        //         >
        //           <FiShoppingBag />
        //           {reorderingOrderId === order._id ? "Adding..." : "Reorder & Checkout"}
        //         </button>
        //       </div>
        //     ))}
        //   </div>
        // </section>
         <section className="space-y-3 rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Quick Reorder
          </h2>
          <p className="text-sm text-slate-600">
            Based on your recent delivered orders and current time
          </p>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-rose-600 shadow-sm">
          <FiClock />
          Smart picks
        </span>
      </div>

      {/* Grid */}
      <div className="grid gap-3 md:grid-cols-3 items-stretch">
        {smartReorderOrders.map((order) => (
          
          <div
            key={`quick-${order._id}`}
            className="flex h-full flex-col justify-between rounded-xl border border-white bg-white p-3 shadow-sm"
          >
            
            {/* TOP CONTENT */}
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {order.restaurantName ||
                  `Order #${order._id.slice(-6)}`}
              </p>

              <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                {order.items
                  .slice(0, 3)
                  .map(
                    (item) =>
                      `${item.name} x ${item.quantity}`
                  )
                  .join(", ")}
              </p>
            </div>

            {/* BOTTOM (ALWAYS ALIGNED) */}
            <div className="mt-3">
              <p className="text-sm font-bold text-slate-900">
                ₹{order.totalAmount}
              </p>

              <button
                onClick={() => reorderAndCheckout(order)}
                disabled={reorderingOrderId === order._id}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#E23744] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#c92f3c] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <FiShoppingBag />
                {reorderingOrderId === order._id
                  ? "Adding..."
                  : "Reorder & Checkout"}
              </button>
            </div>
          </div>

        ))}
      </div>
    </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Active Orders ({activeOrders.length})</h2>

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
        <h2 className="text-lg font-semibold">Completed Orders ({completedOrders.length})</h2>

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
