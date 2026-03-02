import { useEffect, useState } from "react";
import { useAppData } from "../context/AppContext";
import axios from "axios";
import type { IRestaurant } from "../types";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface Address {
  _id: string;
  formattedAddress: string;
  mobile: string;
}

const CheckOut = () => {
  const { cart, totalPrice, quantity} = useAppData();
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [selectedAddressId, setselectedAddressId] = useState<string | null>(null);

  const [loadingAddress, setLoadingAddress] = useState(true);

  const [loadingRazorpay, setLoadingRazorpay] = useState(false);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

  const getDistanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
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
          }
        );

        setAddresses(data || []);
      } catch (error) {
        console.log(error);
      } finally {
        setLoadingAddress(false);
      }
    };

    fetchAddresses();
  }, [cart]);

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

  const restaurant = (cart?.[0]?.restaurantId as IRestaurant) || null;
  const [resLng, resLat] = restaurant?.autoLocation?.coordinates ?? [0, 0];

  if (!cart || cart.length === 0) {
    return (
      <div className="flex min-h-[60vh] item-center justify-center">
        <p className="text-gray-500 text-lg">Your cart is empty</p>
      </div>
    );
  }

  const distance =
    userLat !== null && userLng !== null
      ? getDistanceKm(userLat, userLng, resLat, resLng)
      : 0;

  const deliveryFee = totalPrice > 150 ? 0 : distance < 2 ? 34 : distance * 17;

  const platformFee = totalPrice * 0.05;

  const grandTotal = totalPrice + deliveryFee + platformFee;

  const createOrder = async (paymentMethod: "razorpay" | "stripe") => {
    if(!selectedAddressId) return null;

    setCreatingOrder(true);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/order/new`,
        {
          paymentMethod,
          addressId: selectedAddressId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
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
      if(!order) return;

      const { orderId, amount } = order

      const { data } = await axios.post(`${import.meta.env.VITE_UTILS_SERVICE_URL}/api/payment/create`,{
        orderId
      } )

      const { razorpayOrderId, key } = data;

      const options = {
        key,
        amount: amount * 100,
        currency: "INR",
        name: "SnapEats",
        description: "Food Order Payment",
        order_id: razorpayOrderId,

        handler: async (response: any) => {
          try {
            await axios.post(`${import.meta.env.VITE_UTILS_SERVICE_URL}/api/payment/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });

            toast.success("Payment successfull 🎉");
            navigate("/paymentsuccess/" + response.razorpay_payment_id);
          } catch (error) {
            toast.error("Payment verification failed");
          } 
        },
        theme: {
          color: "#E23744",
        },
      }
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.log(error);
      toast.error("Payment Failed please refresh page");
    }finally {
      setLoadingRazorpay(false);
    }
  }

  //payent with stripe coming soon
  const payWithStripe = async () => {
    try {
      setLoadingStripe(true);

      const order = await createOrder("stripe");
      if(!order) return;

      console.log("stripe checkout",order);
      
    } catch (error) {
      console.log("Error in stripe payment:", error);
      toast.error("Stripe payment failed");
    } finally {
      setLoadingStripe(false);
    }
  }

  return (
    <div>CheckOut</div>
  )
}

export default CheckOut 