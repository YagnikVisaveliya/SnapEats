import toast from "react-hot-toast";

import axios from "axios";

const RiderAdmin = ({
  rider,
  onVerify,
}: {
  rider: any;
  onVerify?: () => void;
}) => {
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
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.25)] space-y-3">
      <img
        src={rider.picture}
        className="h-40 w-full object-cover rounded-xl"
        alt="Rider"
      />
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-white">{rider.phoneNumber || "Rider"}</h3>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            rider?.isVerified
              ? "bg-emerald-500/20 text-emerald-200"
              : "bg-amber-400/20 text-amber-200"
          }`}
        >
          {rider?.isVerified ? "Verified" : "Pending"}
        </span>
      </div>
      <p className="text-sm text-slate-300">Aadhaar: {rider.aadharNumber || "N/A"}</p>
      <p className="text-sm text-slate-400">DL: {rider.drivingLicenseNumber || "N/A"}</p>

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
