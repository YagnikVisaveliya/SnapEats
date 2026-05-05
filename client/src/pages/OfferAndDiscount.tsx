import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BiCopy, BiTag } from "react-icons/bi";
import { FiClock } from "react-icons/fi";

interface ICoupon {
  code: string,
  discountType: "PERCENTAGE" | "FLAT",
  discountValue: number,
  minOrderValue: number,
  expiryDate: string,
  isActive: boolean,
}

const OfferAndDiscount = () => {
  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/coupons/user`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCoupons(data.coupons || data);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error("Failed to load coupons. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Coupon code copied!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const activeCoupons = coupons.filter((c) => c.isActive && !isExpired(c.expiryDate));
  const inactiveCoupons = coupons.filter((c) => !c.isActive || isExpired(c.expiryDate));

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent shadow-lg"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900">Offers & Discounts</h1>
          <p className="mt-2 text-gray-600">Grab amazing deals on your next order</p>
        </div>

        {/* Active Coupons */}
        {activeCoupons.length > 0 && (
          <div className="mb-12">
            <div className="mb-6 flex items-center gap-2">
              <BiTag className="text-2xl text-red-500" />
              <h2 className="text-2xl font-bold text-gray-800">Available Offers</h2>
              <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-600">
                {activeCoupons.length}
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {activeCoupons.map((coupon) => (
                <div
                  key={coupon.code}
                  className="group relative overflow-hidden rounded-2xl bg-white shadow-md transition duration-300 hover:shadow-xl"
                >
                  {/* Decorative gradient */}
                  <div className="absolute right-0 top-0 h-32 w-32 bg-gradient-to-br from-red-100/50 to-transparent blur-xl group-hover:from-red-100/70"></div>

                  <div className="relative p-6">
                    {/* Discount Badge */}
                    <div className="mb-4 flex items-start justify-between">
                      <div className="rounded-xl bg-gradient-to-br from-red-500 to-red-600 px-4 py-3 text-white shadow-lg">
                        <p className="text-xs font-semibold uppercase tracking-wider text-red-100">
                          {coupon.discountType === "PERCENTAGE" ? "Save Up To" : "Flat Discount"}
                        </p>
                        <p className="text-3xl font-bold">
                          {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue || 0}%` : `₹${coupon.discountValue || 0}`}
                        </p>
                      </div>
                    </div>

                    {/* Coupon Code */}
                    <div className="mb-4">
                      <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Coupon Code</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 font-mono text-lg font-bold text-gray-900">
                          {coupon.code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(coupon.code)}
                          className={`rounded-lg p-2 transition duration-200 ${
                            copiedCode === coupon.code
                              ? "bg-green-500 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600"
                          }`}
                          title="Copy code"
                        >
                          <BiCopy size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="mb-4 space-y-3 border-t pt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Min. Order Value</span>
                        <span className="font-semibold text-gray-900">₹{coupon.minOrderValue}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-600">
                          <FiClock size={16} />
                          Expires
                        </span>
                        <span className={`font-semibold ${isExpired(coupon.expiryDate) ? "text-red-600" : "text-green-600"}`}>
                          {new Date(coupon.expiryDate).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => copyToClipboard(coupon.code)}
                      className="w-full rounded-lg bg-gradient-to-r from-red-500 to-red-600 py-2 font-semibold text-white shadow-md transition hover:shadow-lg hover:from-red-600 hover:to-red-700"
                    >
                      Use Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inactive Coupons */}
        {inactiveCoupons.length > 0 && (
          <div>
            <h2 className="mb-6 text-2xl font-bold text-gray-700">Expired Offers</h2>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {inactiveCoupons.map((coupon) => (
                <div
                  key={coupon.code}
                  className="relative overflow-hidden rounded-2xl bg-gray-200 shadow-sm opacity-60"
                >
                  <div className="p-6">
                    <div className="mb-4">
                      <div className="rounded-xl bg-gray-400 px-4 py-3 text-white">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-200">
                          {coupon.discountType === "PERCENTAGE" ? "Save Up To" : "Flat Discount"}
                        </p>
                        <p className="text-3xl font-bold">
                          {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue || 0}%` : `₹${coupon.discountValue || 0}`}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="mb-2 text-xs font-semibold uppercase text-gray-600">Coupon Code</p>
                      <code className="block rounded-lg border-2 border-gray-300 bg-gray-300 px-3 py-2 font-mono text-lg font-bold text-gray-700">
                        {coupon.code}
                      </code>
                    </div>

                    <div className="space-y-2 border-t border-gray-300 pt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Min. Order Value</span>
                        <span className="font-semibold text-gray-700">₹{coupon.minOrderValue}</span>
                      </div>
                      <div className="inline-block rounded-full bg-red-200 px-3 py-1 text-xs font-semibold text-red-700">
                        {isExpired(coupon.expiryDate) ? "Expired" : "Inactive"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {coupons.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <BiTag className="mx-auto mb-4 text-6xl text-gray-300" />
            <h3 className="mb-2 text-2xl font-bold text-gray-700">No Offers Available</h3>
            <p className="text-gray-500">Check back soon for exclusive deals and discounts!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferAndDiscount;