import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Props{
    orderId: string;
    onAccepted: () => void;
    acceptWindowSeconds?: number;
}

interface IncomingOrderPreview {
    _id: string;
    restaurantName: string;
    totalAmount: number;
    riderEarning: number;
    distance: number;
    deliveryAddress?: {
        fromattedAddress?: string;
    };
}

const RiderOrderRequest = ({ orderId, onAccepted, acceptWindowSeconds = 30 }: Props) => {
    const [accepting, setAccepting] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(acceptWindowSeconds);
    const [orderPreview, setOrderPreview] = useState<IncomingOrderPreview | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(true);

    useEffect(() => {
        setSecondsLeft(acceptWindowSeconds);
    }, [acceptWindowSeconds]);

    useEffect(() => {
        let mounted = true;

        const fetchOrderPreview = async () => {
            setLoadingPreview(true);
            try {
                const { data } = await axios.get(
                    `${import.meta.env.VITE_RIDER_SERVICE_URL}/api/rider/order/request/${orderId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    },
                );

                if (mounted) {
                    setOrderPreview(data?.order || null);
                }
            } catch (error: any) {
                const statusCode = error?.response?.status;
                if (statusCode === 404 || statusCode === 409) {
                    onAccepted();
                }

                if (mounted) {
                    setOrderPreview(null);
                }
            } finally {
                if (mounted) {
                    setLoadingPreview(false);
                }
            }
        };

        fetchOrderPreview();

        return () => {
            mounted = false;
        };
    }, [orderId, onAccepted]);

    useEffect(() => {
        const interval = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onAccepted();
                    return 0;
                }
                return prev - 1;
            });
        },1000);

        return () => clearInterval(interval);
    },[onAccepted]);

    const acceptOrder = async () => {
        setAccepting(true);
        try {
            await axios.post(`${import.meta.env.VITE_RIDER_SERVICE_URL}/api/rider/accept/${orderId}`,{},{
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            })
            toast.success("Order accepted");
            onAccepted();
        } catch (error:any) {
            toast.error(error.response?.data?.message || "Failed to accept order");
            onAccepted();
        }finally{
            setAccepting(false);
        }
    }

    const formatAmount = (value?: number) => {
        if (typeof value !== "number" || Number.isNaN(value)) {
            return "Rs 0";
        }
        return `Rs ${value.toFixed(2)}`;
    };

    const formatDistance = (distance?: number) => {
        if (typeof distance !== "number" || Number.isNaN(distance)) {
            return "0.00 km";
        }
        return `${distance.toFixed(2)} km`;
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">

        {/* Top Row */}
        <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Delivery Request
            </p>
            <span className="text-xs font-semibold text-red-500 animate-pulse">
            {secondsLeft}s
            </span>
        </div>

        {/* Content */}
        <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-900">
            New Delivery Request
            </p>
            <p className="text-xs text-slate-500">
            Order ID:{" "}
            <span className="font-medium text-slate-700">
                {orderId.slice(-6)}
            </span>
            </p>

            {loadingPreview ? (
                <p className="text-xs text-slate-500">Loading order details...</p>
            ) : (
                <div className="rounded-xl bg-slate-50 p-3 space-y-1.5 text-xs text-slate-700">
                    <p>
                        <span className="font-semibold text-slate-900">Pickup Restaurant:</span>{" "}
                        {orderPreview?.restaurantName || "Not available"}
                    </p>
                    <p>
                        <span className="font-semibold text-slate-900">Order Total:</span>{" "}
                        {formatAmount(orderPreview?.totalAmount)}
                    </p>
                    <p>
                        <span className="font-semibold text-slate-900">Your Earning:</span>{" "}
                        {formatAmount(orderPreview?.riderEarning)}
                    </p>
                    <p>
                        <span className="font-semibold text-slate-900">Distance (Restaurant to Delivery):</span>{" "}
                        {formatDistance(orderPreview?.distance)}
                    </p>
                    <p>
                        <span className="font-semibold text-slate-900">Drop Address:</span>{" "}
                        {orderPreview?.deliveryAddress?.fromattedAddress || "Not available"}
                    </p>
                </div>
            )}
        </div>

        {/* Button */}
        <button
            disabled={accepting}
            onClick={acceptOrder}
            className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white transition ${
            accepting
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-[#e23744] hover:bg-[#c92f3c]"
            }`}
        >
            {accepting ? "Accepting..." : "Accept Order"}
        </button>

        </div>
  )
}

export default RiderOrderRequest    