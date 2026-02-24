import React, { useState } from 'react'
import { useAppData } from '../context/AppContext'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import type { ICart, IMenuItem } from '../types';
import { BiMinus, BiPlus } from 'react-icons/bi';

const Cart = () => {
    const {cart, totalPrice, quantity, fetchCart, } = useAppData();
    const navigate = useNavigate();

    const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
    const [clearingCart, setClearingCart] = useState(false);

    if(!cart || cart.length === 0) {
        return (
            <div className='flex min-h-[60vh] items-center justify-center'>
                <p className='text-gray-500 text-lg'>Your cart is empty</p>
            </div>
        )
    }
    const restaurant = cart[0].restaurantId as any;

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
    const [resLng, resLat] = restaurant.autoLocation.coordinates;
    const [userLat, setUserLat] = useState<number | null>(null);
    const [userLng, setUserLng] = useState<number | null>(null);

    React.useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setUserLat(position.coords.latitude);
                setUserLng(position.coords.longitude);
            });
        }
    }, []);

    const distance = userLat && userLng ? getDistanceKm(
        userLat,
        userLng,
        resLat,
        resLng
    ) : 0;

    const deliveryCharge = totalPrice > 150 ? 0 : distance < 2 ? 32 : distance * 16; // Example: $16 per km

    const plateformCharge = totalPrice * 0.05; // Example: 5% of total price

    const totalFee = totalPrice + deliveryCharge + plateformCharge;

    const increseQuntity = async (itemId: string) => {
        try {
            setLoadingItemId(itemId);
            await axios.post(`${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/cart/inc`, {itemId}, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            });

            await fetchCart();   
        } catch (error) {
            toast.error("Error increasing quantity");
            console.error("Error increasing quantity:", error);
        }finally{
            setLoadingItemId(null);
        }
    }

    const decreaseQuantity = async (itemId: string) => {
        try {
            setLoadingItemId(itemId);
            await axios.post(`${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/cart/dec`, {itemId}, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            });

            await fetchCart();   
        } catch (error) {
            toast.error("Error decreasing quantity");
            console.error("Error decreasing quantity:", error);
        }finally{
            setLoadingItemId(null);
        }
    }

    const clearCart = async () => {
        const confirmClear = window.confirm("Are you sure you want to clear the cart?");
        if(!confirmClear) return;
        try {
            setClearingCart(true);
            await axios.delete(`${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/cart/clear`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            });

            await fetchCart();   
        } catch (error) {
            toast.error("Error clearing cart");
            console.error("Error clearing cart:", error);
        }finally{
            setClearingCart(false);
        }
    }

    const checkOut = () =>{
        navigate("/checkout");
    }

  return (
    <div className='mx-auto max-w-5xl px-4 py-6 space-y-6'>
        <div className='rounded-xl  bg-white p-4 shadow-sm'>
            <h2 className='text-xl font-semibold'>{restaurant.name}</h2>
            <p className='text-sm text-gray-500'>{restaurant.autoLocation?.formattedAddress}</p>
        </div>

        <div className='space-y-4'>
            {cart.map((cartItem: ICart) => {
                const item = cartItem.itemId as IMenuItem;
                const isLoading = loadingItemId === item._id;

                return (
                    <div key={item._id} className='flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm'>
                        <img src={item.image} alt={item.name} className='h-20 w-20 rounded object-cover' />
                        <div className='flex-1'>
                            <div className='font-semibold'>{item.name}</div>
                            <div className='text-sm text-gray-500'>₹{item.price}</div>
                            {/* <div className='text-sm text-gray-500'>Qty: {cartItem.quantity}</div> */}
                        </div>
                        <div className='flex items-center gap-3'>
                            <button onClick={() => decreaseQuantity(item._id)} className="bg-red-500 text-white px-2 py-1 rounded disabled:opacity-50" disabled={isLoading}>
                                <BiMinus />
                            </button>
                            <span>{cartItem.quantity}</span>
                            <button onClick={() => increseQuntity(item._id)} className="bg-green-500 text-white px-2 py-1 rounded disabled:opacity-50" disabled={isLoading}>
                                <BiPlus />
                            </button>   
                        </div>

                        <p className='w-20 text-right font-medium'>
                            ₹{item.price * cartItem.quantity}
                        </p>
                    </div>
                )
            })}
        </div>
        <div className='rounded-xl shadow-sm p-4 space-y-3 bg-white'>
            <div className='flex justify-between text-sm'>
                <span>Total Items</span>
                <span>{quantity}</span>
            </div>
            <div className='flex justify-between text-sm'>
                <span>Total Price</span>
                <span>₹{totalPrice}</span>  
            </div>
            <div className='flex justify-between text-sm'>
                <span>Delivery Fee</span>
                <span>{deliveryCharge === 0 ? "Free" : `₹${deliveryCharge}`}</span>  
            </div>
            <div className='flex justify-between text-sm'>
                <span>PlateForm Fee</span>
                <span>₹{plateformCharge}</span>  
            </div>
        </div>
    </div>
  )
}

export default Cart 