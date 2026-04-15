import { useEffect, useState } from "react";
import { useAppData } from "../context/AppContext";
import axios from "axios";
import type { IMenuItem, IRestaurant } from "../types";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { BiCreditCard, BiLoader } from "react-icons/bi";
import { loadStripe } from "@stripe/stripe-js";

interface Address {
  _id: string;
  formattedAddress: string;
  mobile: string;
}

const CheckOut = () => {
  const { cart, totalPrice, quantity } = useAppData();
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [selectedAddressId, setselectedAddressId] = useState<string | null>(
    null,
  );

  const [loadingAddress, setLoadingAddress] = useState(true);

  const [loadingRazorpay, setLoadingRazorpay] = useState(false);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [useWallet, setUseWallet] = useState(true);

  const getDistanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return +(R * c).toFixed(2);
  };

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!cart || cart.length === 0) {
        setLoadingAddress(false);
        return;
      }

      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/address/all`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        const parsedAddresses = Array.isArray(data)
          ? data
          : Array.isArray(data?.addresses)
            ? data.addresses
            : [];

        setAddresses(parsedAddresses);
      } catch (error) {
        console.log(error);
        setAddresses([]);
      } finally {
        setLoadingAddress(false);
      }
    };

    fetchAddresses();
  }, [cart]);

  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_WALLET_SERVICE_URL}/api/wallet/balance`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        setWalletBalance(Number(data?.balance ?? 0));
      } catch (error) {
        setWalletBalance(0);
      } finally {
        setLoadingWallet(false);
      }
    };

    fetchWalletBalance();
  }, []);

  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLat(position.coords.latitude);
        setUserLng(position.coords.longitude);
      });
    }
  }, []);

  const cartItems = cart ?? [];
  const isCartEmpty = cartItems.length === 0;
  const restaurant = (cartItems[0]?.restaurantId as IRestaurant) || null;
  const [resLng, resLat] = restaurant?.autoLocation?.coordinates ?? [0, 0];

  const distance =
    userLat !== null && userLng !== null
      ? getDistanceKm(userLat, userLng, resLat, resLng)
      : 0;

  const deliveryFee = totalPrice > 150 ? 0 : distance < 2 ? 24 : distance * 12;

  const platformFee = totalPrice * 0.08;

  const grandTotal = totalPrice + deliveryFee + platformFee;
  const hasWalletBalance = walletBalance > 0;
  const walletApplied = useWallet ? Math.min(walletBalance, grandTotal) : 0;
  const payableAmount = Math.max(0, grandTotal - walletApplied);
  const safeAddresses = Array.isArray(addresses) ? addresses : [];
  const selectedAddress =
    safeAddresses.find((add) => add._id === selectedAddressId) || null;

  useEffect(() => {
    if (!selectedAddressId && safeAddresses.length > 0) {
      setselectedAddressId(safeAddresses[0]._id);
    }
  }, [safeAddresses, selectedAddressId]);

  if (isCartEmpty) {
    return (
      <div className="flex min-h-[60vh] item-center justify-center">
        <p className="text-gray-500 text-lg">Your cart is empty</p>
      </div>
    );
  }

  const createOrder = async (paymentMethod: "razorpay" | "stripe") => {
    if (!selectedAddressId) return null;

    setCreatingOrder(true);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/order/new`,
        {
          paymentMethod,
          addressId: selectedAddressId,
          useWallet,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      return data;
    } catch (error) {
      toast.error("Error creating order");
    } finally {
      setCreatingOrder(false);
    }
  };

  const payWithRazorpay = async () => {
    try {
      setLoadingRazorpay(true);

      const order = await createOrder("razorpay");
      if (!order) return;

      if (Number(order.amount ?? 0) <= 0 || order.paymentStatus === "paid") {
        toast.success("Order placed using wallet balance 🎉");
        navigate(`/paymentsuccess/wallet-${order.orderId}`);
        return;
      }

      const { orderId, amount } = order;

      const { data } = await axios.post(
        `${import.meta.env.VITE_UTILS_SERVICE_URL}/api/payment/create`,
        {
          orderId,
        },
      );

      const { razorpayOrderId, key } = data;

      const options = {
        key,
        amount: Math.round(Number(amount) * 100),
        currency: "INR",
        name: "SnapEats",
        description: "Food Order Payment",
        order_id: razorpayOrderId,

        handler: async (response: any) => {
          try {
            await axios.post(
              `${import.meta.env.VITE_UTILS_SERVICE_URL}/api/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId,
              },
            );

            toast.success("Payment successfull 🎉");
            navigate("/paymentsuccess/" + response.razorpay_payment_id);
          } catch (error) {
            toast.error("Payment verification failed");
          }
        },
        theme: {
          color: "#E23744",
        },
      };
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.log(error);
      toast.error("Payment Failed please refresh page");
    } finally {
      setLoadingRazorpay(false);
    }
  };

  //payent with stripe 

  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

  const payWithStripe = async () => {
    try {
      setLoadingStripe(true);

      const order = await createOrder("stripe");
      if (!order) return;

      if (Number(order.amount ?? 0) <= 0 || order.paymentStatus === "paid") {
        toast.success("Order placed using wallet balance 🎉");
        navigate(`/paymentsuccess/wallet-${order.orderId}`);
        return;
      }

      const stripe = await stripePromise;
      if (!stripe) {
        toast.error("Stripe failed to load");
        return;
      }
      const data = await axios.post(`${import.meta.env.VITE_UTILS_SERVICE_URL}/api/payment/stripe/create`, {
        orderId: order.orderId,
      });
      const { url } = data.data;
      if (!url) {
        toast.error("Failed to initiate Stripe payment");
        return;
      }
      window.location.href = url;
    } catch (error) {
      console.log("Error in stripe payment:", error);
      toast.error("Stripe payment failed");
    } finally {
      setLoadingStripe(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review your order details and choose a payment method.
        </p>
      </div>
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold">{restaurant.name}</h2>
        <p className="text-sm text-gray-500">
          {restaurant.autoLocation?.formattedAddress}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold">Delivery Address</h3>
              <button
                onClick={() => navigate("/address")}
                className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
              >
                Manage Addresses
              </button>
            </div>

            <div className="mt-4">
              {loadingAddress ? (
                <p className="text-sm text-gray-500">Loading addresses...</p>
              ) : safeAddresses.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No address found. Please add one
                </p>
              ) : (
                safeAddresses.map((add) => (
                  <label
                    key={add._id}
                    className={`flex gap-3 rounded-lg border p-3 cursor-pointer transition ${
                      selectedAddressId === add._id
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      checked={selectedAddressId === add._id}
                      onChange={() => setselectedAddressId(add._id)}
                      className="mt-1 accent-red-600"
                    />
                    <div>
                      <p className="text-sm font-semibold">
                        {add.formattedAddress}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        📞 {add.mobile}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="text-xl font-semibold">Items ({quantity})</h3>
            <div className="mt-4 space-y-3">
              {cartItems.map((cartItem) => {
                const item = cartItem.itemId as IMenuItem;

                return (
                  <div
                    key={cartItem._id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-base font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        Qty: {cartItem.quantity}
                      </p>
                    </div>
                    <p className="text-lg font-semibold">
                      ₹{item.price * cartItem.quantity}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="text-xl font-semibold">Bill Details</h3>

            <div className="mt-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span>Sub Total</span>
                <span>₹{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span>
                  {deliveryFee === 0 ? "Free" : `₹${deliveryFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Platform Fee</span>
                <span>₹{platformFee.toFixed(2)}</span>
              </div>
              {hasWalletBalance && (
                <div className="flex justify-between text-sm">
                  <span>Wallet Used</span>
                  <span className="text-emerald-600">-₹{walletApplied.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t pt-3 flex justify-between text-lg font-semibold">
                <span>Payable Total</span>
                <span>₹{payableAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {hasWalletBalance && (
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <h3 className="text-xl font-semibold">Wallet</h3>
              <p className="mt-2 text-sm text-gray-600">
                Available Balance: {loadingWallet ? "Loading..." : `₹${walletBalance.toFixed(2)}`}
              </p>
              <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={useWallet}
                  onChange={(e) => setUseWallet(e.target.checked)}
                  className="accent-red-600"
                />
                Use wallet balance at checkout
              </label>
            </div>
          )}

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="text-xl font-semibold">Payment</h3>

            <div className="mt-4 space-y-3">
              <button
                disabled={
                  !selectedAddressId || loadingRazorpay || creatingOrder
                }
                onClick={payWithRazorpay}
                className="w-full rounded-lg bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingRazorpay ? (
                  <BiLoader size={18} className="animate-spin" />
                ) : (
                  <BiCreditCard size={18} />
                )}
                Pay With Razorpay
              </button>

              <button
                disabled={!selectedAddressId || loadingStripe || creatingOrder}
                onClick={payWithStripe}
                className="w-full rounded-lg bg-gray-600 py-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingStripe ? (
                  <BiLoader size={18} className="animate-spin" />
                ) : (
                  <BiCreditCard size={18} />
                )}
                Pay With Stripe
              </button>

              {!selectedAddressId && (
                <p className="text-xs text-red-500">
                  Select a delivery address to continue.
                </p>
              )}

              {selectedAddress && (
                <p className="text-xs text-gray-500">
                  Delivering to: {selectedAddress.formattedAddress}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckOut;
