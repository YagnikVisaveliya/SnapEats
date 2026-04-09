import axios from "axios";
import { useEffect, useState } from "react";
import AdminRestaurantCard from "../components/AdminRestaurantCard";
import RiderAdmin from "../components/RiderAdmin";

const Admin = () => {
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [riders, setRiders] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"restaurant" | "rider">("restaurant"); 

    const fetchdata = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/restaurant/pending`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const response = await axios.get(`${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/rider/pending`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            setRestaurants(data.restaurants);
            setRiders(response.data.riders);
        } catch ( error ) {
            console.log(error)
        } finally {
            setLoading(false);
        }
    }

    useEffect(()=>{
        fetchdata();
    },[]);

    if(loading) {
        return <div className="flex h-[60vh] items-center justify-center">
            <p className="text-gray-500">Loading Admin...</p>
            </div>
    }
  return (
    <div className="mx-auto max-w-6xl px-6 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="flex gap-4">
        <button
          onClick={() => setTab("restaurant")}
          className={`px-4 py-2 rounded ${
            tab === "restaurant" ? "bg-red-500 text-white" : "bg-gray-200"
          }`}
        >
          Restaurant
        </button>

        <button
          onClick={() => setTab("rider")}
          className={`px-4 py-2 rounded ${
            tab === "rider" ? "bg-red-500 text-white" : "bg-gray-200"
          }`}
        >
          Riders
        </button>
      </div>

      {tab === "restaurant" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {restaurants.length === 0 ? (
            <p>No pending restaurants</p>
          ) : (
            restaurants.map((r) => (
              <AdminRestaurantCard
                key={r._id}
                restaurant={r}
                onVerify={fetchdata}
              />
            ))
          )}
        </div>
      )}
      {tab === "rider" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {riders.length === 0 ? (
            <p>No pending riders</p>
          ) : (
            riders.map((r) => (
              <RiderAdmin key={r._id} rider={r} onVerify={fetchdata} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default Admin    