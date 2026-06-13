import { useEffect, useState } from "react";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { BiRupee, BiTrendingUp, BiPackage, BiMedal } from "react-icons/bi";

interface SalesAnalytics {
  filter: string;
  summary: {
    totalOrders: number;
    totalRevenue: number;
  };
  timeSeriesData: { date: string; revenue: number }[];
  itemWiseData: { name: string; quantity: number; revenue: number }[];
}

export const RestaurantSales = ({ restaurantId }: { restaurantId: string }) => {
  const [range, setRange] = useState<"day" | "week" | "month" | "all">("all");
  const [data, setData] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const rangeOptions = ["all", "day", "week", "month"] as const;

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/order/restaurant/${restaurantId}/sales?range=${range}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setData(res.data);
      } catch (error) {
        console.error("Failed to load sales analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [restaurantId, range]);

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#e23744]"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getRangeLabel = (value: typeof range) => {
    switch (value) {
      case "day":
        return "today";
      case "week":
        return "the past week";
      case "month":
        return "the past month";
      case "all":
        return "all time";
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sales Dashboard</h2>
          <p className="text-sm font-medium text-slate-500">Monitor your revenue and top items</p>
        </div>
        <div className="flex gap-1.5 rounded-xl bg-slate-100 p-1">
          {rangeOptions.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-lg px-5 py-2 text-sm font-bold capitalize transition-all ${
                range === r
                  ? "bg-white text-rose-600 shadow-sm ring-1 ring-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div
              className="group relative overflow-hidden rounded-3xl border border-emerald-100 p-6 shadow-sm transition-all hover:shadow-md"
              style={{ background: "linear-gradient(to bottom right, rgba(236, 253, 245, 1), rgba(240, 253, 244, 1))" }}
            >
              <div className="absolute -right-4 -top-4 rounded-full bg-emerald-200/30 p-8 transition-transform group-hover:scale-110">
                <BiRupee className="h-16 w-16 text-emerald-400/40" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-bold uppercase tracking-widest text-emerald-600/80">Total Revenue</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-emerald-900">
                  {formatCurrency(data.summary.totalRevenue)}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <span className="flex rounded-full bg-emerald-200/50 p-1"><BiTrendingUp /></span>
                  Sales for {getRangeLabel(range)}
                </div>
              </div>
            </div>

            <div
              className="group relative overflow-hidden rounded-3xl border border-blue-100 p-6 shadow-sm transition-all hover:shadow-md"
              style={{ background: "linear-gradient(to bottom right, rgba(239, 246, 255, 1), rgba(238, 242, 255, 1))" }}
            >
              <div className="absolute -right-4 -top-4 rounded-full bg-blue-200/30 p-8 transition-transform group-hover:scale-110">
                <BiPackage className="h-16 w-16 text-blue-400/40" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-bold uppercase tracking-widest text-blue-600/80">Total Orders</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-blue-900">
                  {data.summary.totalOrders}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-700">
                  <span className="flex rounded-full bg-blue-200/50 p-1"><BiTrendingUp /></span>
                  Completed orders
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-800">Revenue Over Time</h3>
              <p className="text-sm text-slate-500">Track your {getRangeLabel(range)} income</p>
            </div>
            <div className="w-full" style={{ height: 350 }}>
              {data.timeSeriesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e23744" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#e23744" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => {
                        const date = new Date(val);
                        return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
                      }}
                      tick={{ fill: "#64748B", fontSize: 13, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => formatCurrency(Number(val ?? 0))}
                      tick={{ fill: "#64748B", fontSize: 13, fontWeight: 500 }}
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', padding: '12px 16px' }}
                      itemStyle={{ fontWeight: 800, color: '#0F172A' }}
                      labelStyle={{ color: '#64748B', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}
                      formatter={(val) => [formatCurrency(Number(val ?? 0)), 'Revenue']}
                      labelFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#e23744"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#e23744' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-slate-400">
                  <BiTrendingUp className="h-16 w-16 mb-3 opacity-20" />
                  <p className="font-bold">No sales data for this period</p>
                </div>
              )}
            </div>
          </div>

          {/* Item-wise Totals */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-5">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BiMedal className="text-amber-500 h-6 w-6" />
                Top Performing Items
              </h3>
              <p className="text-sm text-slate-500 mt-1">Breakdown by item quantity and revenue</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <th className="px-6 py-4">Item Name</th>
                    <th className="px-6 py-4 text-center">Quantities Sold</th>
                    <th className="px-6 py-4 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.itemWiseData.map((item, index) => (
                    <tr key={index} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-600">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-rose-600">
                        {formatCurrency(item.revenue)}
                      </td>
                    </tr>
                  ))}
                  {data.itemWiseData.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-slate-400 font-bold">
                        No item sales recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </>
      )}
    </div>
  );
};
