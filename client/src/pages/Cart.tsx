import React, { useState } from 'react'
import { useAppData } from '../context/AppContext'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import type { ICart, IMenuItem } from '../types';
import { BiMinus, BiPlus, BiTrash } from 'react-icons/bi';

const isMenuItem = (value: unknown): value is IMenuItem => {
    return !!value && typeof value === 'object' && 'isAvailable' in value && '_id' in value;
};

const Cart = () => {
    const {cart, totalPrice, quantity, fetchCart, } = useAppData();
    const navigate = useNavigate();

    const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
    const [clearingCart, setClearingCart] = useState(false);
    const [checkingCheckout, setCheckingCheckout] = useState(false);
    const hasCartItems = !!cart && cart.length > 0;
    const restaurant = hasCartItems ? (cart[0].restaurantId as any) : null;
    const hasUnavailableItems = hasCartItems && cart.some((cartItem: ICart) => {
        if (!isMenuItem(cartItem.itemId)) return true;
        const item = cartItem.itemId;
        return !item.isAvailable;
    });

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
    const [resLng, resLat] = restaurant?.autoLocation?.coordinates ?? [0, 0];
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

    const distance = hasCartItems && userLat !== null && userLng !== null ? getDistanceKm(
        userLat,
        userLng,
        resLat,
        resLng
    ) : 0;

    const deliveryCharge = totalPrice > 150 ? 0 : distance < 2 ? 34 : distance * 17; // Example: $17 per km

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

    const checkOut = async () =>{
        if (checkingCheckout) return;

        try {
            setCheckingCheckout(true);
            const { data } = await axios.get(`${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/cart/myCart`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            const latestCart: ICart[] = Array.isArray(data?.cart) ? data.cart : [];
            const hasUnavailableInLatestCart = latestCart.some((cartItem: ICart) => {
                if (!isMenuItem(cartItem.itemId)) return true;
                return !cartItem.itemId.isAvailable;
            });

            await fetchCart();

            if (hasUnavailableInLatestCart) {
                toast.error("Some items are unavailable. Please remove them before checkout.");
                return;
            }

            navigate("/checkout");
        } catch (error) {
            toast.error("Unable to verify cart right now. Please try again.");
        } finally {
            setCheckingCheckout(false);
        }
    }

    if(!hasCartItems || !restaurant) {
        return (
            <div className='flex min-h-[60vh] items-center justify-center'>
                <p className='text-gray-500 text-lg'>Your cart is empty</p>
            </div>
        )
    }

  return (
    <div className='mx-auto max-w-5xl px-4 py-6 space-y-6'>
        <div className='rounded-xl  bg-white p-4 shadow-sm'>
            <h2 className='text-xl font-semibold'>{restaurant.name}</h2>
            <p className='text-sm text-gray-500'>{restaurant.autoLocation?.formattedAddress}</p>
        </div>

        <div className='space-y-4'>
            {cart.map((cartItem: ICart) => {
                const item = isMenuItem(cartItem.itemId) ? cartItem.itemId : null;
                const isUnavailable = !item || !item.isAvailable;
                const isLoading = !!item && loadingItemId === item._id;

                return (
                    <div key={cartItem._id} className={`flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ${isUnavailable ? 'opacity-80' : ''}`}>
                        <img src={item?.image || '/vite.svg'} alt={item?.name || 'Unavailable item'} className='h-20 w-20 rounded object-cover' />
                        <div className='flex-1'>
                            <div className='font-semibold'>{item?.name || 'Item unavailable'}</div>
                            <div className='text-sm text-gray-500'>{item ? `₹${item.price}` : 'Not available'}</div>
                            {isUnavailable && (
                                <p className='text-sm text-red-500'>This item is currently unavailable. Please remove it to continue.</p>
                            )}
                            {/* <div className='text-sm text-gray-500'>Qty: {cartItem.quantity}</div> */}
                        </div>
                        <div className='flex items-center gap-3'>
                            <button onClick={() => item && decreaseQuantity(item._id)} className="bg-red-500 text-white px-2 py-1 rounded disabled:opacity-50" disabled={isLoading}>
                                <BiMinus />
                            </button>
                            <span>{cartItem.quantity}</span>
                            <button onClick={() => item && increseQuntity(item._id)} className="bg-green-500 text-white px-2 py-1 rounded disabled:opacity-50" disabled={isLoading || isUnavailable}>
                                <BiPlus />
                            </button>   
                        </div>

                        <p className='w-20 text-right font-medium'>
                            {item ? `₹${item.price * cartItem.quantity}` : 'Unavailable'}
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
                <span>Sub Total</span>
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
            {
                totalPrice < 150 && (
                    <p className='text-xs text-gray-500'>
                        Orders above ₹150 are eligible for free delivery. Add ₹{150 - totalPrice} more to your cart to get free delivery!
                    </p>
                )
            }
            <div className='flex justify-between text-base font-semibold border-t pt-2'>
                <span>Grand Total</span>
                <span>₹{totalFee}</span>
            </div>
            {hasUnavailableItems && (
                <p className='text-xs text-red-500'>Remove unavailable items to proceed with checkout.</p>
            )}
            <button onClick={checkOut} className={`mt-3 w-full rounded-lg bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 ${restaurant.isOpen ? "" : "cursor-not-allowed opacity-50"}`} disabled={!restaurant.isOpen || checkingCheckout} >
                {!restaurant.isOpen ? "Restaurant Closed" : checkingCheckout ? "Checking availability..." : hasUnavailableItems ? "Unavailable items in cart" : "Proceed to Checkout"}
            </button>
            <button onClick={clearCart} disabled={clearingCart} className='mt-3 w-full rounded-lg bg-gray-500 py-3 text-sm font-semibold text-white hover:bg-gray-600 flex justify-center items-center gap-1' >
                Clear Cart<BiTrash size={16}/>

            </button>
        </div>
    </div>
  )
}

export default Cart 