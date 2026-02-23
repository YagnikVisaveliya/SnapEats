import axios from "axios";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AppContextType, ICart, LocationData, User } from "../types";
import { Toaster } from "react-hot-toast";

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const [location, setLocation] = useState<LocationData | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [city, setCity] = useState("Fecthing Location...");

  async function fetchUser() {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setUser(null);
        setIsAuth(false);
        setLoading(false);
        return;
      }

      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setUser(data.user);
      setIsAuth(true);
    } catch (error) {
      setUser(null);
      setIsAuth(false);
      console.log(error);
    } finally {
      setLoading(false);
    }
  }
  
  const [cart, setCart] = useState<ICart[] | null>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);

  async function fetchCart() {
    if(!user || user.role !== "customer") return;
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/cart/myCart`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      // console.log("Cart data:", data);
      setCart(data.cart || []);
      setTotalPrice (data.totalPrice || 0);
      setQuantity(data.cartlen || 0);
    } catch (error) {
      console.error("Error fetching cart data:", error);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if(user && user.role === "customer") {
      fetchCart();
    }
  }, [user]);

  useEffect(() => {
    if (!navigator.geolocation)
      return alert("Please allow location access to use the app");
    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await res.json();

        setLocation({
          latitude,
          longitude,
          formattedAddress: data.address.road || data.address.city || data.display_name || "Current Location",
        })

        setCity(
          data.address.city ||
          data.address.town ||
          data.address.village ||
          "Your Location"
        )
        setLoadingLocation(false);

      } catch (error) {
        setLocation({
          latitude,
          longitude,
          formattedAddress: "Current Location",
        });
        setCity("Failed to load");
        setLoadingLocation(false);        
      }
    });
  }, []); 

  return (
    <AppContext.Provider
      value={{
        isAuth,
        loading,
        setIsAuth,
        setLoading,
        setUser,
        user,
        location,
        loadingLocation,
        city,
        cart,
        fetchCart,
        totalPrice,
        quantity,
      }}
    >
      {children}
      <Toaster
          position="bottom-right"
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1f2937", 
              color: "#fff",
              fontSize: "14px",
              borderRadius: "8px",
            },
          }}
          containerStyle={{
            top: 80, 
            right: 20,
          }}
        />

      {/* <Toaster /> */}
    </AppContext.Provider>
  );
};

export const useAppData = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppData must be used within AppProvider");
  }
  return context;
};
