import axios from "axios";
import toast from "react-hot-toast";

const AdminRestaurantCard = ({
  restaurant,
  onVerify,
}: {
  restaurant: any;
  onVerify: () => void;
}) => {
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
    <div className="rounded-2xl border border-amber-300/20 bg-slate-900/60 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.25)] space-y-3">
      <img
        src={restaurant.image}
        className="h-40 w-full object-cover rounded-xl"
        alt={restaurant.name}
      />
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-white">{restaurant.name}</h3>
        <span className="rounded-full bg-amber-400/20 px-2 py-1 text-xs font-semibold text-amber-200">
          Pending
        </span>
      </div>
      <p className="text-sm text-slate-300">{restaurant.phone}</p>
      <p className="text-sm text-slate-400">{restaurant.autoLocation?.formattedAddress}</p>

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
