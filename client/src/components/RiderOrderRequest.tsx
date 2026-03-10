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
    <div className="rounded-xl bg-white p-4 shadow-sm border border-green-300 space-y-3 ">
        <p className="text-center text-xs font-semibold text-red-600">Accept within {secondsLeft} seconds</p>
        <p className="text-center text-xs font-semibold text-green-600">New Delivery Request</p>
        <p className="text-xs text-gray-500">Order ID: <b>{orderId.slice(-6)}</b></p>

        <button disabled={accepting} onClick={acceptOrder} className="width-full rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">{
            accepting ? "Accepting..." : "Accept Order"    
        }</button>
    </div>
  )
}

export default RiderOrderRequest    