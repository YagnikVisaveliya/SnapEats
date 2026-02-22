import { useEffect, useState } from "react";
import type { IMenuItem, IRestaurant } from "../types";
import axios from "axios";
import AddRestaurant from "../components/AddRestaurant";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";
import AddManuItems from "../components/AddManuItems";

type SellerTab = "menu" | "add-item" | "sales";

function Restaurant() {

  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<SellerTab>("menu");

  const fetchMyRestaurant = async ()=>{
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/restaurant/my`,{
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      })
      setRestaurant(data.restaurant || null);

      if(data.token){
        localStorage.setItem("token", data.token);
        window.location.reload();
      }
    } catch (error) {
      console.log(error);
    }finally{
      setLoading(false);
    }
  }

  useEffect(()=>{
    fetchMyRestaurant();
  },[]);

  const [ menuItems, setMenuItems ] = useState<IMenuItem[]>([]);

  const fetchMenuItems = async (restaurantId: string) => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/item/all/${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      // console.log(data.manuItems);
      setMenuItems(data.manuItems);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(()=>{
    if(restaurant?._id){
      fetchMenuItems(restaurant._id);
    }
  }, [restaurant]);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading your restaurant...</p>
      </div>
    );
    if (!restaurant) {
      return <AddRestaurant fetchMyRestaurant={fetchMyRestaurant} />;
    }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 space-y-6">
      <RestaurantProfile restaurant={restaurant} isSeller={true} onUpdate={setRestaurant} />

      <div className="rounded-lg bg-white shadow-sm">
        <div className="flex border-b">
          {[
            {key: "menu", label: "Menu Items"},
            {key: "add-item", label: "Add Item"},
            {key: "sales", label: "Sales"}
          ].map((t)=>(
            <button
              key={t.key}
              onClick={() => setTab(t.key as SellerTab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${tab === t.key ? "border-b-2 border-red-500 text-red-500" : "text-gray-500 hover:text-gray-700"}`
              }
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-5">
          {tab === "menu" && (
            <MenuItems
              items={menuItems}
              onItemDeleted={() => fetchMenuItems(restaurant._id)}
              isSeller={true}
            />
          )}
          {tab === "add-item" && (
            <AddManuItems
            onItemAdded={() => fetchMenuItems(restaurant._id)} />
            // <p>Add Menu Item Page</p>
          )}
          {tab === "sales" && <p>Sales Page</p>}
        </div>
      </div>
    </div>

  )
}

export default Restaurant