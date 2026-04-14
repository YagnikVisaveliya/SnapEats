import { useEffect, useState } from "react";
import type { IMenuItem, IRestaurant } from "../types";
import axios from "axios";
import AddRestaurant from "../components/AddRestaurant";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";
import AddManuItems from "../components/AddManuItems";
import RestaurantOrders from "../components/RestaurantOrders";
import { RestaurantSales } from "../components/RestaurantSales";

type SellerTab = "menu" | "add-item" | "sales";

function Restaurant() {

  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [tab, setTab] = useState<SellerTab>("menu");

  const fetchMyRestaurant = async ()=>{
    setLoading(true);
    setConnectionError(null);
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
      if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
        setConnectionError("Restaurant service is unreachable. Make sure it is running on port 3001 and try again.");
      }
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

  if (connectionError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm text-red-700">{connectionError}</p>
          <button
            onClick={fetchMyRestaurant}
            className="mt-3 rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

    if (!restaurant) {
      return <AddRestaurant fetchMyRestaurant={fetchMyRestaurant} />;
    }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 space-y-6">
      <RestaurantProfile restaurant={restaurant} isSeller={true} onUpdate={setRestaurant} />

      <RestaurantOrders restaurantId={restaurant._id}/> 

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
          {/* //hear add Sales page */}
          {tab === "sales" && <RestaurantSales restaurantId={restaurant._id} />} 
        </div>
      </div>
    </div>

  )
}

export default Restaurant