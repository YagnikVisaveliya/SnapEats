import toast from "react-hot-toast";

import axios from "axios";

const RiderAdmin = ({
  rider,
  onVerify,
}: {
  rider: any;
  onVerify: () => void;
}) => {
  const verify = async () => {
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
    <div className="rounded-xl bg-white p-4 shadow space-y-2">
      <img
        src={rider.picture}
        className="h-40 w-full object-cover rounded"
        alt=""
      />
      <h3>{rider.phoneNumber}</h3>
      <p className="text-sm text-gray-500">aadhar{rider.phone}</p>
      <p>{rider.aadharNumber}</p>
      <p>Dl Number:{rider.drivingLicenseNumber}</p>

      <button
        className="w-full rounded bg-green-500 py-2 text-white hover:bg-green-600"
        onClick={verify}
      >
        Verify Rider
      </button>
    </div>
  );
};

export default RiderAdmin;
