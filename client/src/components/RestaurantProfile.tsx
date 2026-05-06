import { useState } from "react";
import type { IRestaurant } from "../types";
import axios from "axios";
import toast from "react-hot-toast";
import { BiEdit, BiMapPin, BiSave } from "react-icons/bi";
import { useAppData } from "../context/AppContext";

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
    
    const { setIsAuth, setUser } = useAppData();
    const logoutHandler = async() =>{
        await axios.put(`${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/restaurant/status`,
            {
                status: false
            },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }
        )
        localStorage.removeItem("token");
        setIsAuth(false);
        setUser(null);
        toast.success("Logged out successfully");
    }

//   return (
//     <div className="mx-auto max-w-xl rounded-xl bg-white shadow-sm overflow-hidden">
//         {
//             restaurant.image && (
//                 <img src={restaurant.image} alt="Restaurant" className="w-full h-48 object-cover" />
//             )
//         }
//         <div className="p-5 space-y-4">
//             {
//                 isSeller && (<div className="flex items-center justify-between">
//                     <div>
//                         {
//                             editMode ? (
//                                 <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border px-2 py-1 text-lg font-semibold"/>
//                             ) : (
//                                 <h2 className="text-xl font-semibold">{restaurant.name}</h2>
//                             )
//                         }
//                         <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
//                             <BiMapPin className="h-4 w-4 text-red-500" />
//                             {
//                                 restaurant.autoLocation?.formattedAddress || "Location not available"
//                             }

//                         </div>
//                     </div>
//                     <button onClick={()=>setEditMode(!editMode)} className="text-gray-500 hover:text-black">
//                         <BiEdit size={18} />
//                     </button>
//                 </div>
                
//             )}
//             {
//                 !isSeller && (
//                     <div>
//                         <h2 className="text-xl font-semibold">{restaurant.name}</h2>
//                         <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
//                             <BiMapPin className="h-4 w-4 text-red-500" />
//                             {
//                                 restaurant.autoLocation?.formattedAddress || "Location not available"
//                             }
//                         </div>
//                     </div>
//                 )
//             }
//             {
//                 editMode ? (
//                     <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded border px-3 py-2 text-sm"/>
//                 ) : (
//                     <p className="text-gray-700 text-sm">{restaurant.description || "No description available"}</p>
//                 )
//             }
//             <div className="flex items-center justify-between pt-3 border-t">
//                 <span className={`text-sm font-medium ${isOpen ? "text-green-600" : "text-red-500"}`}>{isOpen ? "OPEN" : "CLOSED"}</span>
//                 <div className="flex gap-3">
//                     {
//                         editMode && (<button onClick={saveChanges} disabled={loading} className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">
//                             <BiSave size={16} />
//                             Save
//                         </button>
//                     )}
//                     {
//                         isSeller && (
//                             <button onClick={toggleOpenStatus} className={`rounded-lg px-4 py-1.5 text-sm font-medium text-white cursor-pointer ${isOpen ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}>{
//                                 isOpen ? "Close Restaurant" : "Open Restaurant"
//                             }</button>
//                         )
//                     }
//                     {
//                         isSeller && (
//                             <button onClick={logoutHandler} className={`rounded-lg px-4 py-1.5 text-sm font-medium cursor-pointer text-white bg-red-600 hover:bg-red-700 "}`}>LogOut</button>
//                         )
//                     }
//                 </div>
//             </div>
//             <p className="text-xs text-gray-400">Created on {new Date(restaurant.createdAt).toLocaleDateString()}</p>
//         </div>
//     </div>
//   )

return (
  <div className="mx-auto max-w-xl overflow-hidden rounded-2xl bg-white shadow-md transition hover:shadow-lg">
    
    {/* Image */}
    {restaurant.image && (
      <div className="relative">
        <img
          src={restaurant.image}
          alt="Restaurant"
          className="h-52 w-full object-cover"
        />

        {/* Status Badge */}
        <span
          className={`absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-semibold text-white ${
            isOpen ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {isOpen ? "OPEN" : "CLOSED"}
        </span>
      </div>
    )}

    {/* Content */}
    <div className="p-5 space-y-4">
      
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          
          {/* Name */}
          {editMode ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-lg font-semibold focus:ring-2 focus:ring-orange-500 outline-none"
            />
          ) : (
            <h2 className="text-xl font-bold text-gray-800">
              {restaurant.name}
            </h2>
          )}

          {/* Location */}
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            <BiMapPin className="h-4 w-4 text-red-500" />
            {restaurant.autoLocation?.formattedAddress || "Location not available"}
          </div>
        </div>

        {/* Edit Button */}
        {isSeller && (
          <button
            onClick={() => setEditMode(!editMode)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-black transition"
          >
            <BiEdit size={18} />
          </button>
        )}
      </div>

      {/* Description */}
      {editMode ? (
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
          rows={3}
        />
      ) : (
        <p className="text-sm text-gray-600 leading-relaxed">
          {restaurant.description || "No description available"}
        </p>
      )}

      {/* Divider */}
      <div className="border-t pt-4 flex items-center justify-between flex-wrap gap-3">

        {/* Status Text */}
        <span
          className={`text-sm font-semibold ${
            isOpen ? "text-green-600" : "text-red-500"
          }`}
        >
          {isOpen ? "Restaurant is Open" : "Restaurant is Closed"}
        </span>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          
          {/* Save */}
          {editMode && (
            <button
              onClick={saveChanges}
              disabled={loading}
              className="flex items-center gap-1 rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50 transition"
            >
              <BiSave size={16} />
              Save
            </button>
          )}

          {/* Open/Close */}
          {isSeller && (
            <button
              onClick={toggleOpenStatus}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
                isOpen
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {isOpen ? "Close" : "Open"}
            </button>
          )}

          {/* Logout */}
          {isSeller && (
            <button
              onClick={logoutHandler}
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-black transition"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-400">
        Created on {new Date(restaurant.createdAt).toLocaleDateString()}
      </p>
    </div>
  </div>
);
}

export default RestaurantProfile