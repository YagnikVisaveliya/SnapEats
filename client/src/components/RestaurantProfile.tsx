import { useState } from "react";
import type { IRestaurant } from "../types";
import axios from "axios";
import toast from "react-hot-toast";
import { BiEdit, BiMapPin, BiSave } from "react-icons/bi";

interface Props {
  restaurant: IRestaurant;
  isSeller: boolean;
  onUpdate: (restaurant: IRestaurant) => void;
}

function RestaurantProfile({ restaurant, isSeller, onUpdate }: Props) {
    const [editMode, setEditMode] = useState(false);
    const [name, setName] = useState(restaurant.name);
    const [description, setDescription] = useState(restaurant.description);
    // const [phone, setPhone] = useState(restaurant.phone.toString());
    const [isOpen, setIsOpen] = useState(restaurant.isOpen);
    const [loading, setLoading] = useState(false);

    const toggleOpenStatus = async ()=>{
        try {
            const { data } = await axios.put(`${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/restaurant/status`,
                {
                    status: !isOpen
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            )
            toast.success(data.message);
            setIsOpen(data.restaurant.isOpen);
        } catch (error : any) {
            console.log(error);
            toast.error(error.response?.data?.message);
            
        }
    };

    const saveChanges = async ()=>{
        try {
            setLoading(true);
            const { data } = await axios.put(`${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/restaurant/edit`,{
                name,
                description,
                // phone: Number(phone) 
            },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }
        
        );
        toast.success(data.message);
        onUpdate(data.restaurant);
        setEditMode(false);
        } catch (error) {
            console.log(error);
            toast.error("Failed to update restaurant");
            
        }finally{
            setLoading(false);
        }
    }
  return (
    <div className="mx-auto max-w-xl rounded-xl bg-white shadow-sm overflow-hidden">
        {
            restaurant.image && (
                <img src={restaurant.image} alt="Restaurant" className="w-full h-48 object-cover" />
            )
        }
        <div className="p-5 space-y-4">
            {
                isSeller && (<div className="flex items-center justify-between">
                    <div>
                        {
                            editMode ? (
                                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border px-2 py-1 text-lg font-semibold"/>
                            ) : (
                                <h2 className="text-xl font-semibold">{restaurant.name}</h2>
                            )
                        }
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                            <BiMapPin className="h-4 w-4 text-red-500" />
                            {
                                restaurant.autoLocation?.formattedAddress || "Location not available"
                            }

                        </div>
                    </div>
                    <button onClick={()=>setEditMode(!editMode)} className="text-gray-500 hover:text-black">
                        <BiEdit size={18} />
                    </button>
                </div>
                
            )}
            {
                !isSeller && (
                    <div>
                        <h2 className="text-xl font-semibold">{restaurant.name}</h2>
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                            <BiMapPin className="h-4 w-4 text-red-500" />
                            {
                                restaurant.autoLocation?.formattedAddress || "Location not available"
                            }
                        </div>
                    </div>
                )
            }
            {
                editMode ? (
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded border px-3 py-2 text-sm"/>
                ) : (
                    <p className="text-gray-700 text-sm">{restaurant.description || "No description available"}</p>
                )
            }
            <div className="flex items-center justify-between pt-3 border-t">
                <span className={`text-sm font-medium ${isOpen ? "text-green-600" : "text-red-500"}`}>{isOpen ? "OPEN" : "CLOSED"}</span>
                <div className="flex gap-3">
                    {
                        editMode && (<button onClick={saveChanges} disabled={loading} className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">
                            <BiSave size={16} />
                            Save
                        </button>
                    )}
                    {
                        isSeller && (
                            <button onClick={toggleOpenStatus} className={`rounded-lg px-4 py-1.5 text-sm font-medium text-white ${isOpen ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}>{
                                isOpen ? "Close Restaurant" : "Open Restaurant"
                            }</button>
                        )
                    }
                </div>
            </div>
            <p className="text-xs text-gray-400">Created on {new Date(restaurant.createdAt).toLocaleDateString()}</p>
        </div>
    </div>
  )
}

export default RestaurantProfile