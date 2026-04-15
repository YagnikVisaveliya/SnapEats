import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import AdminRestaurantCard from "../components/AdminRestaurantCard";
import RiderAdmin from "../components/RiderAdmin";
import { useAppData } from "../context/AppContext";
import toast from "react-hot-toast";
import VerifiedRestaurant from "../components/VerifiedRestaurant";
import { FiActivity, FiBarChart2, FiCheckCircle, FiClock, FiLogOut, FiRefreshCw, FiTruck } from "react-icons/fi";

const Admin = () => {
  const { setUser, setIsAuth } = useAppData();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [unverifiedRestaurants, setUnverifiedRestaurants] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [unverifiedRiders, setUnverifiedRiders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<{ totalRevenue: number; totalOrders: number }>({
    totalRevenue: 0,
    totalOrders: 0,
  });
  const [topRestaurants, setTopRestaurants] = useState<Array<[string, number]>>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<
    "overview" | "restaurants" | "unverifiedRestaurants" | "riders" | "unverifiedRiders" | "orders" | "analytics"
  >("overview");

  const authHeader = {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  };

  const normalizeList = (payload: any, key: string) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.[key])) return payload[key];
    return [];
  };

  const logoutHandler = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuth(false);
    toast.success("Logged out successfully");
  };

  const fetchAdminData = async () => {
    setRefreshing(true);
    try {
      const [
        restaurantsRes,
        unverifiedRestaurantsRes,
        ridersRes,
        unverifiedRidersRes,
        ordersRes,
        revenueRes,
        topRestaurantsRes,
      ] = await Promise.all([
        axios.get(`${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/restaurants`, authHeader),
        axios.get(`${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/restaurants/unverified`, authHeader),
        axios.get(`${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/riders`, authHeader),
        axios.get(`${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/riders/unverified`, authHeader),
        axios.get(`${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/all-orders`, authHeader),
        axios.get(`${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/revenue`, authHeader),
        axios.get(`${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/top-restaurants`, authHeader),
      ]);

      setRestaurants(normalizeList(restaurantsRes.data, "restaurants"));
      setUnverifiedRestaurants(normalizeList(unverifiedRestaurantsRes.data, "restaurants"));
      setRiders(normalizeList(ridersRes.data, "riders"));
      setUnverifiedRiders(normalizeList(unverifiedRidersRes.data, "riders"));
      setAllOrders(normalizeList(ordersRes.data, "orders"));
      setRevenue({
        totalRevenue: Number(revenueRes.data?.totalRevenue ?? 0),
        totalOrders: Number(revenueRes.data?.totalOrders ?? 0),
      });
      setTopRestaurants(Array.isArray(topRestaurantsRes.data) ? topRestaurantsRes.data : []);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load admin dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const paidOrders = useMemo(
    () => allOrders.filter((order) => order.paymentStatus === "paid"),
    [allOrders],
  );

  const activeOrders = useMemo(
    () =>
      allOrders.filter((order) =>
        ["placed", "accepted", "preparing", "ready_for_rider", "rider_assigned", "picked_up"].includes(order.status),
      ),
    [allOrders],
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const topRestaurantRows = useMemo(() => {
    return topRestaurants.map(([restaurantId, earnings], index) => {
      const restaurant = restaurants.find((item) => item._id === restaurantId);
      return {
        rank: index + 1,
        name: restaurant?.name ?? `Restaurant ${restaurantId.slice(-5)}`,
        phone: restaurant?.phone,
        earnings,
      };
    });
  }, [topRestaurants, restaurants]);

  const statCards = [
    {
      label: "Total Restaurants",
      value: restaurants.length,
      helper: `${unverifiedRestaurants.length} pending verification`,
      icon: FiCheckCircle,
      color: "from-rose-500 to-orange-500",
    },
    {
      label: "Total Riders",
      value: riders.length,
      helper: `${unverifiedRiders.length} pending verification`,
      icon: FiTruck,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "All Orders",
      value: allOrders.length,
      helper: `${activeOrders.length} active now`,
      icon: FiActivity,
      color: "from-amber-500 to-yellow-500",
    },
    {
      label: "Paid Orders",
      value: revenue.totalOrders,
      helper: `${paidOrders.length} payments confirmed`,
      icon: FiBarChart2,
      color: "from-emerald-500 to-teal-500",
    },
  ];

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center bg-slate-950">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur">
          <p className="text-sm font-semibold tracking-wide text-white/80">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-rose-600/20 blur-3xl" />
        <div className="absolute right-10 top-40 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl" />
      </div>

      <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">SnapEats Control Hub</h1>
            <p className="text-sm text-slate-300">Restaurants, riders, orders, revenue and ranking in one place</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminData}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={logoutHandler}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
            >
              <FiLogOut />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl space-y-6 px-6 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/4 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-300">{item.label}</p>
                <div className={`rounded-lg bg-linear-to-br ${item.color} p-2 text-white`}>
                  <item.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-white">{item.value}</p>
              <p className="mt-1 text-xs text-slate-400">{item.helper}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/4 p-2">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "overview", label: "Overview" },
              { key: "restaurants", label: `All Restaurants (${restaurants.length})` },
              { key: "unverifiedRestaurants", label: `Unverified Restaurants (${unverifiedRestaurants.length})` },
              { key: "riders", label: `All Riders (${riders.length})` },
              { key: "unverifiedRiders", label: `Unverified Riders (${unverifiedRiders.length})` },
              { key: "orders", label: `All Orders (${allOrders.length})` },
              { key: "analytics", label: "Revenue & Top Restaurants" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key as typeof tab)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  tab === item.key
                    ? "bg-rose-500 text-white"
                    : "bg-white/3 text-slate-300 hover:bg-white/8"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {tab === "overview" && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/4 p-5 xl:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Priority Queue</h2>
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-200">
                  <FiClock />
                  Pending verifications
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Unverified Restaurants</p>
                  <p className="mt-1 text-2xl font-black text-white">{unverifiedRestaurants.length}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Unverified Riders</p>
                  <p className="mt-1 text-2xl font-black text-white">{unverifiedRiders.length}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {unverifiedRestaurants.slice(0, 2).map((restaurant) => (
                  <AdminRestaurantCard key={restaurant._id} restaurant={restaurant} onVerify={fetchAdminData} />
                ))}
                {unverifiedRestaurants.length === 0 && (
                  <p className="text-sm text-slate-400">No unverified restaurants.</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-5">
                <p className="text-xs uppercase tracking-widest text-emerald-200">Platform Revenue</p>
                <p className="mt-2 text-3xl font-black text-white">{formatCurrency(revenue.totalRevenue)}</p>
                <p className="mt-1 text-sm text-emerald-100/90">From {revenue.totalOrders} paid orders</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Top Restaurants</h3>
                <div className="mt-3 space-y-2">
                  {topRestaurantRows.slice(0, 5).map((row) => (
                    <div key={row.rank} className="flex items-center justify-between rounded-lg bg-slate-900/50 px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold text-white">#{row.rank} {row.name}</p>
                        <p className="text-xs text-slate-400">{row.phone ?? "No contact"}</p>
                      </div>
                      <p className="text-sm font-bold text-emerald-300">{formatCurrency(row.earnings)}</p>
                    </div>
                  ))}
                  {topRestaurantRows.length === 0 && <p className="text-sm text-slate-400">No ranked restaurants yet.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "restaurants" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {restaurants.length === 0 ? (
              <p className="text-slate-400">No restaurants found.</p>
            ) : (
              restaurants.map((r) => (
                <VerifiedRestaurant key={r._id} restaurant={r} />
              ))
            )}
          </div>
        )}

        {tab === "unverifiedRestaurants" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {unverifiedRestaurants.length === 0 ? (
              <p className="text-slate-400">No pending restaurants.</p>
            ) : (
              unverifiedRestaurants.map((r) => (
                <AdminRestaurantCard key={r._id} restaurant={r} onVerify={fetchAdminData} />
              ))
            )}
          </div>
        )}

        {tab === "riders" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {riders.length === 0 ? (
              <p className="text-slate-400">No riders found.</p>
            ) : (
              riders.map((r) => <RiderAdmin key={r._id} rider={r} />)
            )}
          </div>
        )}

        {tab === "unverifiedRiders" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {unverifiedRiders.length === 0 ? (
              <p className="text-slate-400">No pending riders.</p>
            ) : (
              unverifiedRiders.map((r) => (
                <RiderAdmin key={r._id} rider={r} onVerify={fetchAdminData} />
              ))
            )}
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/4 p-4">
            {allOrders.length === 0 ? (
              <p className="text-slate-400">No orders available.</p>
            ) : (
              allOrders.map((order) => (
                <div
                  key={order._id}
                  className="rounded-xl border border-white/10 bg-slate-900/50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">Order #{String(order._id).slice(-6)}</p>
                      <p className="text-xs text-slate-400">Restaurant: {order.restaurantName ?? String(order.restaurantId).slice(-6)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-cyan-500/20 px-2 py-1 font-semibold text-cyan-200">
                        {String(order.status).replaceAll("_", " ")}
                      </span>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-1 font-semibold text-emerald-200">
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-300 md:grid-cols-4">
                    <p>Total: {formatCurrency(Number(order.totalAmount ?? 0))}</p>
                    <p>Subtotal: {formatCurrency(Number(order.subTotal ?? 0))}</p>
                    <p>Delivery: {formatCurrency(Number(order.deliveryCharge ?? 0))}</p>
                    <p>Platform: {formatCurrency(Number(order.platformCharge ?? 0))}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "analytics" && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
              <h2 className="text-lg font-bold text-white">Revenue Dashboard</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 p-4">
                  <p className="text-xs uppercase tracking-widest text-emerald-200">Total Platform Revenue</p>
                  <p className="mt-1 text-2xl font-black text-white">{formatCurrency(revenue.totalRevenue)}</p>
                </div>
                <div className="rounded-xl border border-blue-300/20 bg-blue-500/10 p-4">
                  <p className="text-xs uppercase tracking-widest text-blue-200">Paid Orders Count</p>
                  <p className="mt-1 text-2xl font-black text-white">{revenue.totalOrders}</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-300">
                <p>Active Orders: <span className="font-bold text-white">{activeOrders.length}</span></p>
                <p className="mt-1">All Orders: <span className="font-bold text-white">{allOrders.length}</span></p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
              <h2 className="text-lg font-bold text-white">Top Restaurants by Earnings</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-slate-400">
                      <th className="px-2 py-3">Rank</th>
                      <th className="px-2 py-3">Restaurant</th>
                      <th className="px-2 py-3 text-right">Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRestaurantRows.map((row) => (
                      <tr key={row.rank} className="border-b border-white/5 text-slate-200">
                        <td className="px-2 py-3 font-bold">#{row.rank}</td>
                        <td className="px-2 py-3">
                          <p className="font-semibold text-white">{row.name}</p>
                          <p className="text-xs text-slate-400">{row.phone ?? "No phone"}</p>
                        </td>
                        <td className="px-2 py-3 text-right font-bold text-emerald-300">{formatCurrency(row.earnings)}</td>
                      </tr>
                    ))}
                    {topRestaurantRows.length === 0 && (
                      <tr>
                        <td className="px-2 py-6 text-center text-slate-400" colSpan={3}>
                          No top restaurants data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;