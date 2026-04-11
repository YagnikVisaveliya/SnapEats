import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { BiRupee, BiMap, BiShoppingBag, BiTrendingUp } from "react-icons/bi";

interface Summary {
  totalDelivered: number;
  totalEarning: number;
  totalDistance: number;
  averageEarning: number;
}

interface OrderHistory {
  _id: string;
  totalAmount: number;
  riderEarning: number;
  distance: number;
  restaurantName: string;
  createdAt: string;
  status: string;
}

const RiderHistory = () => {
  const [range, setRange] = useState<"day" | "week" | "month">("week"); //default to week
  const [summary, setSummary] = useState<Summary | null>(null);
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_RIDER_SERVICE_URL}/api/rider/order/delivered?range=${range}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setSummary(data.summary);
      setOrders(data.orders);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Range Selector */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">Analytics & History</h2>
        <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
          {["day", "week", "month"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r as "day" | "week" | "month")}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition ${
                range === r
                  ? "bg-white text-[#e23744] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading && !summary ? (
        <div className="text-center py-10 text-slate-500 font-medium">Loading analytics...</div>
      ) : summary ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <BiRupee size={60} />
              </div>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Earnings</p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                ₹{summary.totalEarning.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <BiShoppingBag size={60} />
              </div>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Completed Deliveries</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{summary.totalDelivered}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <BiMap size={60} />
              </div>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Distance Travelled</p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {summary.totalDistance.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <BiTrendingUp size={60} />
              </div>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Avg. Earning</p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                ₹{summary.averageEarning.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* History List */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
              <h3 className="font-semibold text-slate-800">Delivered Orders</h3>
            </div>
            {orders.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No orders delivered in this period.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <div key={order._id} className="p-5 hover:bg-slate-50 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-slate-900 tracking-tight">{order.restaurantName}</h4>
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 capitalize">
                            {order.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 font-medium">
                          Order #{order._id.substring(order._id.length - 8).toUpperCase()}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          {format(new Date(order.createdAt), "PPp")}
                        </p>
                      </div>

                      <div className="flex items-center gap-6 sm:justify-end">
                        <div className="text-center">
                          <p className="text-xs uppercase font-bold text-slate-400">Distance</p>
                          <p className="font-semibold text-slate-700">{order.distance} km</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase font-bold text-slate-400">Earned</p>
                          <p className="font-bold text-emerald-600 text-lg">₹{order.riderEarning.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default RiderHistory;
