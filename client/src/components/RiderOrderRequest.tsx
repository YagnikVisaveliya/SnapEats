import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Props{
    orderId: string;
    onAccepted: () => void;
}
const RiderOrderRequest = ({ orderId, onAccepted }: Props) => {
    const [accepting, setAccepting] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(10);

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
        <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">
            New Delivery Request
            </p>
            <p className="text-xs text-slate-500">
            Order ID:{" "}
            <span className="font-medium text-slate-700">
                {orderId.slice(-6)}
            </span>
            </p>
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