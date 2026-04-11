import axios from "axios";
import type { IOrder } from "../types"
import toast from "react-hot-toast";

import { useState } from "react";

interface Props{
    order: IOrder
    onStatusUpdate: () => void;
}

const RiderCurrentOrder = ({ order, onStatusUpdate }: Props) => {
    const [otpInput, setOtpInput] = useState("");
    const [showOtpInput, setShowOtpInput] = useState(false);

    const updateStatus = async () => {
        try {
            await axios.put(`${import.meta.env.VITE_RIDER_SERVICE_URL}/api/rider/order/update/${order._id}`, { otp: otpInput }, {
                headers:{
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            })
            toast.success("Order Status Updated")
            setShowOtpInput(false);
            setOtpInput("");
            onStatusUpdate();
        } catch (error:any) {
            toast.error(error.response?.data?.message || "Failed to update order status")
        }
    }
  return (
    <div className="rounded-xl bg-white shadow-sm p-4 space-y-4">
        <h1 className="font-semibold text-gray-700">Current Order</h1>

        <div className="text-sm text-gray-600 space-y-1">
            <p>
                <b>Pickup:</b> 
                {order.restaurantName}
            </p>
            <p>
                <b>Drop-off:</b> 
                {order.deliveryAddress.fromattedAddress}
            </p>
            <p>
                <b>Total:</b> 
                ${order.totalAmount}
            </p>
            <p>
                <b>Your Earning:</b> 
                ${order.riderEarning}
            </p>
             <p>
                <b>Status:</b> 
                <span className="capitalize text-blue-600">
                    {order.status.replace("_"," ")}
                </span>
            </p>
        </div>

        {
            order.deliveryAddress.mobile && <div className="flex justify-between rounded-lg border p-3">
                <div className="text-sm">
                    <p className="text-gray-500">Customer Phone</p>
                    <p className="font-semibold text-gray-800">{order.deliveryAddress.mobile}</p>
                    
                </div>
                <a href={`tel:${order.deliveryAddress.mobile}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                        Call</a>
            </div>
        }
        <div className="space-y-2">
            {order.status === "rider_assigned" && <button onClick={()=>updateStatus()} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg py-2 font-semibold
            ">Reached Restaurant</button>}

            {order.status === "picked_up" && !showOtpInput && (
                <button onClick={() => setShowOtpInput(true)} className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg py-2 font-semibold shadow-sm transition-all">
                    Mark As Delivered
                </button>
            )}

            {order.status === "picked_up" && showOtpInput && (
                <div className="flex flex-col space-y-3 bg-red-50 p-4 rounded-xl border border-red-100">
                    <p className="text-sm font-bold text-red-800 text-center">Ask customer for Delivery PIN</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            maxLength={6}
                            placeholder="6-digit PIN"
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                            className="flex-1 placeholder:text-gray-400 font-bold border-2 border-red-200 rounded-lg text-center tracking-widest outline-none focus:border-red-500 transition-colors"
                        />
                        <button 
                            onClick={() => updateStatus()}
                            disabled={otpInput.length < 6}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-all"
                        >
                            Confirm
                        </button>
                    </div>
                    <button onClick={() => setShowOtpInput(false)} className="text-xs text-red-600 font-semibold hover:underline">Cancel</button>
                </div>
            )}
        </div>
    </div>
  )
}   

export default RiderCurrentOrder