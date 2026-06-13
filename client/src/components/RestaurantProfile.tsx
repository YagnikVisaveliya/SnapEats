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

return (
  <div className="mx-auto max-w-3xl overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] ring-1 ring-black/5">
    <div className="relative isolate">
      {restaurant.image ? (
        <>
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="h-64 w-full object-cover sm:h-72"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.2), transparent)" }}
          />
        </>
      ) : (
        <div
          className="h-64 w-full sm:h-72"
          style={{ background: "linear-gradient(to bottom right, #0f172a, #1e293b, #334155)" }}
        />
      )}

      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 text-white">
          <div className="space-y-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${
                isOpen ? "bg-emerald-500/90 text-white" : "bg-rose-500/90 text-white"
              }`}
            >
              {isOpen ? "Open now" : "Closed"}
            </span>
            {editMode ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full max-w-xl rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-2xl font-black tracking-tight text-white placeholder:text-white/60 outline-none backdrop-blur focus:ring-2 focus:ring-white/40"
              />
            ) : (
              <h2 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
                {restaurant.name}
              </h2>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/85">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur">
                <BiMapPin className="h-4 w-4" />
                {restaurant.autoLocation?.formattedAddress || "Location not available"}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur">
                Created {new Date(restaurant.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {isSeller && (
            <button
              onClick={() => setEditMode(!editMode)}
              className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              <BiEdit size={16} />
              {editMode ? "Done" : "Edit profile"}
            </button>
          )}
        </div>
      </div>
    </div>

    <div className="space-y-6 p-5 sm:p-6">
      <div className="grid gap-4 md:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">About</p>
          {editMode ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              rows={4}
            />
          ) : (
            <p className="text-sm leading-7 text-slate-600">
              {restaurant.description || "No description available"}
            </p>
          )}
        </div>

        <div
          className="rounded-2xl border border-slate-200 p-4 text-white shadow-sm"
          style={{ background: "linear-gradient(to bottom right, #0f172a, #1e293b)" }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Restaurant state</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-2xl font-black">{isOpen ? "Live" : "Paused"}</p>
              <p className="mt-1 text-sm text-white/70">
                {isOpen ? "Customers can place orders now." : "Orders are currently paused."}
              </p>
            </div>
            <div className={`h-3 w-3 rounded-full ${isOpen ? "bg-emerald-400" : "bg-rose-400"}`} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
        <div className="text-sm text-slate-500">
          Keep your profile, menu, and open status up to date.
        </div>

        <div className="flex flex-wrap gap-2">
          {editMode && (
            <button
              onClick={saveChanges}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <BiSave size={16} />
              {loading ? "Saving..." : "Save changes"}
            </button>
          )}

          {isSeller && (
            <button
              onClick={toggleOpenStatus}
              className={`inline-flex items-center rounded-full px-4 py-2.5 text-sm font-semibold text-white transition ${
                isOpen
                  ? "bg-rose-500 hover:bg-rose-600"
                  : "bg-emerald-500 hover:bg-emerald-600"
              }`}
            >
              {isOpen ? "Close restaurant" : "Open restaurant"}
            </button>
          )}

          {isSeller && (
            <button
              onClick={logoutHandler}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);
}

export default RestaurantProfile