import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";
import type { IMenuItem, IRestaurant } from "../types";

const RestaurantPage = () => {

    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
    const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);

    const fetchRestaurant = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/restaurant/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            // console.log(data.restaurant);
            setRestaurant(data.restaurant);
            // setMenuItems(data.menuItems);

        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    }
    const fetchMenuItems = async () => {
        try {
        const { data } = await axios.get(
            `${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/item/all/${id}`,
            {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            }
        );
        // console.log(data.manuItems);
        
        setMenuItems(data.manuItems);
        } catch (error) {
        console.log(error);
        }
    };

    useEffect(()=>{
        if(id){
            fetchRestaurant();
            fetchMenuItems();
        }
    },[id]);

    if (loading) {
        return (
        <div className="flex h-[60vh] items-center justify-center">
            <p className="text-gray-500">Loading restaurant...</p>
        </div>
        );
    }

    if (!restaurant) {
        return (
        <div className="flex h-[60vh] items-center justify-center">
            <p className="text-gray-500">No Restaurant</p>
        </div>
        );
    }



  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 space-y-6">
      <RestaurantProfile
        restaurant={restaurant}
        onUpdate={setRestaurant}
        isSeller={false}
      />

      <div className="rounded-xl bg-white shadow-sm p-4">
        <MenuItems
          isSeller={false}
          items={menuItems}
          onItemDeleted={() => {}}
        />
      </div>
    </div>
  )
}

export default RestaurantPage