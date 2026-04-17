import toast from "react-hot-toast";

import axios from "axios";
import { adminThemeStyles, type AdminTheme } from "../utils/adminTheme";

const RiderAdmin = ({
  rider,
  onVerify,
  theme = "dark",
}: {
  rider: any;
  onVerify?: () => void;
  theme?: AdminTheme;
}) => {
  const themeStyles = adminThemeStyles[theme];
  const isPending = !rider?.isVerified && !!onVerify;

  const verify = async () => {
    if (!onVerify) return;
    try {
      await axios.post(
        `${import.meta.env.VITE_UTILS_ADMIN_URL}/api/admin/rider/${rider._id}/verify`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("Rider verified");
      onVerify();
    } catch (error) {
      toast.error("Failed to verify rider");
    }
  };
  return (
    <div className={`space-y-3 rounded-2xl border p-4 ${themeStyles.card}`}>
      <img
        src={rider.picture}
        className="h-40 w-full object-cover rounded-xl"
        alt="Rider"
      />
      <div className="flex items-center justify-between gap-2">
        <h3 className={`text-base font-bold ${themeStyles.primaryText}`}>{rider.phoneNumber || "Rider"}</h3>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            rider?.isVerified
              ? theme === "dark"
                ? "bg-emerald-500/20 text-emerald-200"
                : "bg-emerald-100 text-emerald-800"
              : theme === "dark"
                ? "bg-amber-400/20 text-amber-200"
                : "bg-amber-100 text-amber-800"
          }`}
        >
          {rider?.isVerified ? "Verified" : "Pending"}
        </span>
      </div>
      <p className={`text-sm ${themeStyles.secondaryText}`}>Aadhaar: {rider.aadharNumber || "N/A"}</p>
      <p className={`text-sm ${themeStyles.mutedText}`}>DL: {rider.drivingLicenseNumber || "N/A"}</p>

      {isPending && (
        <button
          className="w-full rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
          onClick={verify}
        >
          Verify Rider
        </button>
      )}
    </div>
  );
};

export default RiderAdmin;
