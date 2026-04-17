import axios from "axios";
import toast from "react-hot-toast";
import { adminThemeStyles, type AdminTheme } from "../utils/adminTheme";

const AdminRestaurantCard = ({
  restaurant,
  onVerify,
  theme = "dark",
}: {
  restaurant: any;
  onVerify: () => void;
  theme?: AdminTheme;
}) => {
  const themeStyles = adminThemeStyles[theme];

  const verify = async () => {
    try {
      await axios.put(
        `${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/restaurant/${restaurant._id}/verify`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("Restaurant verified");
      onVerify();
    } catch (error) {
      toast.error("Failed to verify restaurant");
    }
  };
  return (
    <div className={`space-y-3 rounded-2xl border border-amber-300/20 p-4 ${themeStyles.card}`}>
      <img
        src={restaurant.image}
        className="h-40 w-full object-cover rounded-xl"
        alt={restaurant.name}
      />
      <div className="flex items-center justify-between gap-2">
        <h3 className={`text-base font-bold ${themeStyles.primaryText}`}>{restaurant.name}</h3>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${theme === "dark" ? "bg-amber-400/20 text-amber-200" : "bg-amber-100 text-amber-800"}`}>
          Pending
        </span>
      </div>
      <p className={`text-sm ${themeStyles.secondaryText}`}>{restaurant.phone}</p>
      <p className={`text-sm ${themeStyles.mutedText}`}>{restaurant.autoLocation?.formattedAddress}</p>

      <button
        className="w-full rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
        onClick={verify}
      >
        Verify Restaurant
      </button>
    </div>
  );
};

export default AdminRestaurantCard;
