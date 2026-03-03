import axios from 'axios';
import React, { use, useEffect } from 'react'
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

const OrderSuccess = () => {

    const [params] = useSearchParams();

    const sessionId = params.get("session_id");

    useEffect(() => {
        const verifyPayment = async () => {
            if(!sessionId) return;
            
            try {
                await axios.post(`${import.meta.env.VITE_UTILS_SERVICE_URL}/api/payment/stripe/verify`, {
                    sessionId
                })

                toast.success("Payment successful! Your order is being processed.");
            } catch (error) {
                toast.error("Payment verification failed. ");
            }   
        }
        verifyPayment();
    },[sessionId])

  return (
    <div className="flex h-[60vh] items-center justify-center">
        <h2 className="text-2xl font-semibold text-green-600">Payment Successful!</h2>
    </div>
  )
}

export default OrderSuccess