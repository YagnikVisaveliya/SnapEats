import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import AdminRestaurantCard from "../components/AdminRestaurantCard";
import RiderAdmin from "../components/RiderAdmin";
import { useAppData } from "../context/AppContext";
import toast from "react-hot-toast";
import VerifiedRestaurant from "../components/VerifiedRestaurant";
import { FiActivity, FiBarChart2, FiCheckCircle, FiClock, FiLogOut, FiMoon, FiRefreshCw, FiSun, FiTruck } from "react-icons/fi";
import { adminThemeStyles, type AdminTheme } from "../utils/adminTheme";

const ADMIN_THEME_STORAGE_KEY = "snapEats-admin-theme";

const Admin = () => {
  const { setUser, setIsAuth } = useAppData();
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [unverifiedRestaurants, setUnverifiedRestaurants] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [unverifiedRiders, setUnverifiedRiders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<{
    totalRevenue: number;
    totalOrders: number;
    grossRevenue: number;
    netRevenue: number;
    loyaltyPayout: number;
  }>({
    totalRevenue: 0,
    totalOrders: 0,
    grossRevenue: 0,
    netRevenue: 0,
    loyaltyPayout: 0,
  });
  const [topRestaurants, setTopRestaurants] = useState<Array<[string, number]>>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [theme, setTheme] = useState<AdminTheme>(() =>
    (localStorage.getItem(ADMIN_THEME_STORAGE_KEY) as AdminTheme | null) ??
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
  );
  const [tab, setTab] = useState<
    "overview" | "restaurants" | "unverifiedRestaurants" | "riders" | "unverifiedRiders" | "orders" | "analytics" | "transactions" | "coupons"
  >("overview");
  const themeStyles = adminThemeStyles[theme];

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
        walletTransactionsRes,
        couponsRes,
      ] = await Promise.all([
        axios.get(`${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/restaurants`, authHeader),
        axios.get(`${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/restaurants/unverified`, authHeader),
        axios.get(`${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/riders`, authHeader),
        axios.get(`${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/riders/unverified`, authHeader),
        axios.get(`${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/all-orders`, authHeader),
        axios.get(`${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/revenue`, authHeader),
        axios.get(`${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/top-restaurants`, authHeader),
        axios.get(`${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/wallet-transactions`, authHeader),
        axios.get(`${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/coupons`, authHeader),
      ]);

      setRestaurants(normalizeList(restaurantsRes.data, "restaurants"));
      setUnverifiedRestaurants(normalizeList(unverifiedRestaurantsRes.data, "restaurants"));
      setRiders(normalizeList(ridersRes.data, "riders"));
      setUnverifiedRiders(normalizeList(unverifiedRidersRes.data, "riders"));
      setAllOrders(normalizeList(ordersRes.data, "orders"));
      setRevenue({
        totalRevenue: Number(revenueRes.data?.totalRevenue ?? 0),
        totalOrders: Number(revenueRes.data?.totalOrders ?? 0),
        grossRevenue: Number(revenueRes.data?.grossRevenue ?? 0),
        netRevenue: Number(revenueRes.data?.netRevenue ?? revenueRes.data?.totalRevenue ?? 0),
        loyaltyPayout: Number(revenueRes.data?.loyaltyPayout ?? 0),
      });
      setTopRestaurants(Array.isArray(topRestaurantsRes.data) ? topRestaurantsRes.data : []);
      setWalletTransactions(normalizeList(walletTransactionsRes.data, "transactions"));
      setCoupons(normalizeList(couponsRes.data, "coupons"));
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

  useEffect(() => {
    localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

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
      <div className={`flex h-[70vh] items-center justify-center ${themeStyles.page}`}>
        <div className={`rounded-2xl border px-6 py-5 backdrop-blur ${themeStyles.surface}`}>
          <p className={`text-sm font-semibold tracking-wide ${themeStyles.secondaryText}`}>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeStyles.page}`}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={`absolute -left-20 top-20 h-64 w-64 rounded-full ${themeStyles.backdropPrimary}`} />
        <div className={`absolute right-10 top-40 h-80 w-80 rounded-full ${themeStyles.backdropSecondary}`} />
      </div>

      <div className={`sticky top-0 z-10 border-b ${themeStyles.header}`}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${themeStyles.primaryText}`}>SnapEats Control Hub</h1>
            <p className={`text-sm ${themeStyles.secondaryText}`}>Restaurants, riders, orders, revenue and ranking in one place</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${themeStyles.buttonSecondary}`}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              {theme === "dark" ? <FiSun /> : <FiMoon />}
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            <button
              onClick={fetchAdminData}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${themeStyles.buttonSecondary}`}
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
              className={`rounded-2xl border p-4 ${themeStyles.card}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className={`text-sm font-semibold ${themeStyles.secondaryText}`}>{item.label}</p>
                <div className={`rounded-lg bg-linear-to-br ${item.color} p-2 text-white`}>
                  <item.icon className="h-4 w-4" />
                </div>
              </div>
              <p className={`text-3xl font-black ${themeStyles.primaryText}`}>{item.value}</p>
              <p className={`mt-1 text-xs ${themeStyles.mutedText}`}>{item.helper}</p>
            </div>
          ))}
        </div>

        <div className={`rounded-2xl border p-2 ${themeStyles.shell}`}>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "overview", label: "Overview" },
              { key: "restaurants", label: `All Restaurants (${restaurants.length})` },
              { key: "unverifiedRestaurants", label: `Unverified Restaurants (${unverifiedRestaurants.length})` },
              { key: "riders", label: `All Riders (${riders.length})` },
              { key: "unverifiedRiders", label: `Unverified Riders (${unverifiedRiders.length})` },
              { key: "orders", label: `All Orders (${allOrders.length})` },
              { key: "analytics", label: "Revenue & Top Restaurants" },
              { key: "transactions", label: `Transactions (${walletTransactions.length})` },
              { key: "coupons", label: `Coupons (${coupons.length})` },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key as typeof tab)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  tab === item.key
                    ? "bg-rose-500 text-white"
                    : themeStyles.tabInactive
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
                <h2 className={`text-lg font-bold ${themeStyles.primaryText}`}>Priority Queue</h2>
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-200">
                  <FiClock />
                  Pending verifications
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className={`rounded-xl border p-4 ${themeStyles.cardSoft}`}>
                  <p className={`text-xs uppercase tracking-widest ${themeStyles.mutedText}`}>Unverified Restaurants</p>
                  <p className={`mt-1 text-2xl font-black ${themeStyles.primaryText}`}>{unverifiedRestaurants.length}</p>
                </div>
                <div className={`rounded-xl border p-4 ${themeStyles.cardSoft}`}>
                  <p className={`text-xs uppercase tracking-widest ${themeStyles.mutedText}`}>Unverified Riders</p>
                  <p className={`mt-1 text-2xl font-black ${themeStyles.primaryText}`}>{unverifiedRiders.length}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {unverifiedRestaurants.slice(0, 2).map((restaurant) => (
                  <AdminRestaurantCard key={restaurant._id} restaurant={restaurant} onVerify={fetchAdminData} theme={theme} />
                ))}
                {unverifiedRestaurants.length === 0 && (
                  <p className={`text-sm ${themeStyles.mutedText}`}>No unverified restaurants.</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className={`rounded-2xl border border-emerald-300/20 p-5 ${theme === "dark" ? "bg-emerald-500/10" : "bg-emerald-50"}`}>
                <p className={`text-xs uppercase tracking-widest ${theme === "dark" ? "text-emerald-200" : "text-emerald-700"}`}>Platform Revenue</p>
                <p className={`mt-2 text-3xl font-black ${themeStyles.primaryText}`}>{formatCurrency(revenue.netRevenue || revenue.totalRevenue)}</p>
                <p className={`mt-1 text-sm ${theme === "dark" ? "text-emerald-100/90" : "text-emerald-700"}`}>From {revenue.totalOrders} paid orders</p>
              </div>

              <div className={`rounded-2xl border p-5 ${themeStyles.surface}`}>
                <h3 className={`text-sm font-bold uppercase tracking-widest ${themeStyles.secondaryText}`}>Top Restaurants</h3>
                <div className="mt-3 space-y-2">
                  {topRestaurantRows.slice(0, 5).map((row) => (
                    <div key={row.rank} className={`flex items-center justify-between rounded-lg px-3 py-2 ${themeStyles.cardSoft}`}>
                      <div>
                        <p className={`text-sm font-semibold ${themeStyles.primaryText}`}>#{row.rank} {row.name}</p>
                        <p className={`text-xs ${themeStyles.mutedText}`}>{row.phone ?? "No contact"}</p>
                      </div>
                      <p className={`text-sm font-bold ${theme === "dark" ? "text-emerald-300" : "text-emerald-700"}`}>{formatCurrency(row.earnings)}</p>
                    </div>
                  ))}
                  {topRestaurantRows.length === 0 && <p className={`text-sm ${themeStyles.mutedText}`}>No ranked restaurants yet.</p>}
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
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-300 md:grid-cols-5">
                    <p>Total: {formatCurrency(Number(order.totalAmount ?? 0))}</p>
                    <p>Subtotal: {formatCurrency(Number(order.subTotal ?? 0))}</p>
                    <p>Delivery: {formatCurrency(Number(order.deliveryCharge ?? 0))}</p>
                    <p>RiderCharge: {formatCurrency(Number(order.riderEarning ?? 0))}</p>
                    <p>Platform: {formatCurrency(Number(order.platformCharge ?? 0))}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "analytics" && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className={`rounded-2xl border p-5 ${themeStyles.surface}`}>
              <h2 className={`text-lg font-bold ${themeStyles.primaryText}`}>Revenue Dashboard</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 p-4">
                  <p className={`text-xs uppercase tracking-widest ${theme === "dark" ? "text-cyan-200" : "text-cyan-800"}`}>Gross Revenue</p>
                  <p className={`mt-1 text-2xl font-black ${themeStyles.primaryText}`}>{formatCurrency(revenue.grossRevenue || revenue.totalRevenue)}</p>
                </div>
                <div className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 p-4">
                  <p className={`text-xs uppercase tracking-widest ${theme === "dark" ? "text-emerald-200" : "text-emerald-800"}`}>Net Revenue</p>
                  <p className={`mt-1 text-2xl font-black ${themeStyles.primaryText}`}>{formatCurrency(revenue.netRevenue || revenue.totalRevenue)}</p>
                </div>
                <div className="rounded-xl border border-rose-300/20 bg-rose-500/10 p-4">
                  <p className={`text-xs uppercase tracking-widest ${theme === "dark" ? "text-rose-200" : "text-rose-800"}`}>Loyalty Bonus Paid</p>
                  <p className={`mt-1 text-2xl font-black ${themeStyles.primaryText}`}>-{formatCurrency(revenue.loyaltyPayout)}</p>
                </div>
                <div className="rounded-xl border border-blue-300/20 bg-blue-500/10 p-4">
                  <p className={`text-xs uppercase tracking-widest ${theme === "dark" ? "text-blue-200" : "text-blue-800"}`}>Paid Orders Count</p>
                  <p className={`mt-1 text-2xl font-black ${themeStyles.primaryText}`}>{revenue.totalOrders}</p>
                </div>
              </div>
              <div className={`mt-4 rounded-xl border p-4 text-sm ${themeStyles.cardSoft} ${themeStyles.secondaryText}`}>
                <p>Active Orders: <span className={`font-bold ${themeStyles.primaryText}`}>{activeOrders.length}</span></p>
                <p className="mt-1">All Orders: <span className={`font-bold ${themeStyles.primaryText}`}>{allOrders.length}</span></p>
              </div>
            </div>

            <div className={`rounded-2xl border p-5 ${themeStyles.surface}`}>
              <h2 className={`text-lg font-bold ${themeStyles.primaryText}`}>Top Restaurants by Earnings</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className={`border-b text-xs uppercase tracking-widest ${themeStyles.tableHead}`}>
                      <th className="px-2 py-3">Rank</th>
                      <th className="px-2 py-3">Restaurant</th>
                      <th className="px-2 py-3 text-right">Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRestaurantRows.map((row) => (
                      <tr key={row.rank} className={`border-b ${themeStyles.tableRow}`}>
                        <td className="px-2 py-3 font-bold">#{row.rank}</td>
                        <td className="px-2 py-3">
                          <p className={`font-semibold ${themeStyles.primaryText}`}>{row.name}</p>
                          <p className={`text-xs ${themeStyles.mutedText}`}>{row.phone ?? "No phone"}</p>
                        </td>
                        <td className={`px-2 py-3 text-right font-bold ${theme === "dark" ? "text-emerald-300" : "text-emerald-700"}`}>{formatCurrency(row.earnings)}</td>
                      </tr>
                    ))}
                    {topRestaurantRows.length === 0 && (
                      <tr>
                        <td className={`px-2 py-6 text-center ${themeStyles.mutedText}`} colSpan={3}>
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

        {tab === "transactions" && (
          <div className={`rounded-2xl border p-5 ${themeStyles.surface}`}>
            <h2 className={`text-lg font-bold ${themeStyles.primaryText}`}>Wallet Transaction History</h2>
            <p className={`mt-1 text-sm ${themeStyles.mutedText}`}>
              Includes wallet refunds and loyalty bonus credits.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className={`border-b text-xs uppercase tracking-widest ${themeStyles.tableHead}`}>
                    <th className="px-2 py-3">Date</th>
                    <th className="px-2 py-3">User</th>
                    <th className="px-2 py-3">Type</th>
                    <th className="px-2 py-3">Provider</th>
                    <th className="px-2 py-3">Description</th>
                    <th className="px-2 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {walletTransactions.map((tx) => (
                    <tr key={tx._id} className={`border-b ${themeStyles.tableRow}`}>
                      <td className={`px-2 py-3 text-xs ${themeStyles.mutedText}`}>
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleString("en-IN") : "-"}
                      </td>
                      <td className={`px-2 py-3 font-mono text-xs ${themeStyles.secondaryText}`}>{String(tx.userId || "-").slice(0, 10)}</td>
                      <td className="px-2 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${tx.type === "CREDIT" ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-400/20 text-amber-200"}`}>
                          {tx.type || "-"}
                        </span>
                      </td>
                      <td className={`px-2 py-3 text-xs ${theme === "dark" ? "text-cyan-200" : "text-cyan-800"}`}>{tx.paymentProvider || "-"}</td>
                      <td className={`px-2 py-3 text-xs ${themeStyles.secondaryText}`}>{tx.description || "-"}</td>
                      <td className={`px-2 py-3 text-right font-semibold ${themeStyles.primaryText}`}>{formatCurrency(Number(tx.amount ?? 0))}</td>
                    </tr>
                  ))}
                  {walletTransactions.length === 0 && (
                    <tr>
                      <td className={`px-2 py-6 text-center ${themeStyles.mutedText}`} colSpan={6}>
                        No wallet transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "coupons" && (
          <div className="space-y-6">
            <div className={`rounded-2xl border p-5 ${themeStyles.surface}`}>
              <h2 className={`text-lg font-bold ${themeStyles.primaryText}`}>Create New Coupon</h2>
              <form
                className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const data = {
                    code: (form.elements.namedItem("code") as HTMLInputElement).value,
                    discountType: (form.elements.namedItem("discountType") as HTMLSelectElement).value,
                    discountValue: Number((form.elements.namedItem("discountValue") as HTMLInputElement).value),
                    minOrderValue: Number((form.elements.namedItem("minOrderValue") as HTMLInputElement).value),
                    maxDiscount: Number((form.elements.namedItem("maxDiscount") as HTMLInputElement).value) || null,
                    expiryDate: (form.elements.namedItem("expiryDate") as HTMLInputElement).value,
                    usageLimit: Number((form.elements.namedItem("usageLimit") as HTMLInputElement).value) || 0,
                  };
                  try {
                    await axios.post(`${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/coupon`, data, authHeader);
                    toast.success("Coupon created successfully");
                    form.reset();
                    fetchAdminData();
                  } catch (error: any) {
                    toast.error(error.response?.data?.message || "Failed to create coupon");
                  }
                }}
              >
                <div>
                  <label className={`block text-xs font-semibold ${themeStyles.secondaryText}`}>Code</label>
                  <input required name="code" className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeStyles.inputSurface}`} placeholder="e.g. FESTIVE50" />
                </div>
                <div>
                  <label className={`block text-xs font-semibold ${themeStyles.secondaryText}`}>Type</label>
                  <select required name="discountType" className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeStyles.inputSurface}`}>
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FLAT">Flat Amount</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-semibold ${themeStyles.secondaryText}`}>Value</label>
                  <input required type="number" name="discountValue" className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeStyles.inputSurface}`} placeholder="e.g. 50" />
                </div>
                <div>
                  <label className={`block text-xs font-semibold ${themeStyles.secondaryText}`}>Min Order</label>
                  <input required type="number" name="minOrderValue" defaultValue="0" className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeStyles.inputSurface}`} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold ${themeStyles.secondaryText}`}>Max Discount (for %)</label>
                  <input type="number" name="maxDiscount" className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeStyles.inputSurface}`} placeholder="Leave empty if none" />
                </div>
                <div>
                  <label className={`block text-xs font-semibold ${themeStyles.secondaryText}`}>Usage Limit</label>
                  <input type="number" name="usageLimit" defaultValue="0" className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeStyles.inputSurface}`} placeholder="0 for unlimited" />
                </div>
                <div>
                  <label className={`block text-xs font-semibold ${themeStyles.secondaryText}`}>Expiry Date</label>
                  <input required type="date" name="expiryDate" className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${themeStyles.inputSurface}`} />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition">
                    Create Coupon
                  </button>
                </div>
              </form>
            </div>

            <div className={`rounded-2xl border p-5 ${themeStyles.surface}`}>
              <h2 className={`text-lg font-bold ${themeStyles.primaryText}`}>Existing Coupons</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className={`border-b text-xs uppercase tracking-widest ${themeStyles.tableHead}`}>
                      <th className="px-2 py-3">Code</th>
                      <th className="px-2 py-3">Type</th>
                      <th className="px-2 py-3">Value</th>
                      <th className="px-2 py-3">Usage</th>
                      <th className="px-2 py-3">Expiry</th>
                      <th className="px-2 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((c) => (
                      <tr key={c._id} className={`border-b ${themeStyles.tableRow}`}>
                        <td className={`px-2 py-3 font-bold ${themeStyles.primaryText}`}>{c.code}</td>
                        <td className={`px-2 py-3 text-xs ${themeStyles.secondaryText}`}>{c.discountType}</td>
                        <td className={`px-2 py-3 font-semibold ${themeStyles.primaryText}`}>
                          {c.discountType === "FLAT" ? `₹${c.discountValue}` : `${c.discountValue}%`}
                          {c.maxDiscount ? ` (Max ₹${c.maxDiscount})` : ""}
                        </td>
                        <td className={`px-2 py-3 text-xs ${themeStyles.secondaryText}`}>
                          {c.usedCount} / {c.usageLimit === 0 ? "∞" : c.usageLimit}
                        </td>
                        <td className={`px-2 py-3 text-xs ${themeStyles.mutedText}`}>
                          {new Date(c.expiryDate).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-2 py-3 text-right">
                          <button
                            onClick={async () => {
                              try {
                                await axios.put(`${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/coupon/${c._id}`, { isActive: !c.isActive }, authHeader);
                                fetchAdminData();
                                toast.success(c.isActive ? "Coupon deactivated" : "Coupon activated");
                              } catch (e) {
                                toast.error("Failed to toggle status");
                              }
                            }}
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${c.isActive ? "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30" : "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30"}`}
                          >
                            {c.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {coupons.length === 0 && (
                      <tr>
                        <td className={`px-2 py-6 text-center ${themeStyles.mutedText}`} colSpan={6}>
                          No coupons found.
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