import { useEffect, useRef, useState } from "react";
import { useAppData } from "../context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";
import {
  BiBadgeCheck,
  BiIdCard,
  BiPhoneCall,
  BiUpload,
} from "react-icons/bi";
import { useSocket } from "../context/SocketContext";
import type { IOrder } from "../types";
import audio from "../assets/zomato_notif_1.mp3";
import RiderOrderRequest from "../components/RiderOrderRequest";
import RiderCurrentOrder from "../components/RiderCurrentOrder";

interface IRider {
  _id: string;
  picture: string;
  phoneNumber: string;
  aadharNumber: string;
  drivingLicenseNumber: string;
  isVerified: boolean;
  isAvailable: boolean;
//   createdAt?: string;
//   lastActiveAt?: string;
//   location?: {
//     type: "Point";
//     coordinates: [number, number];
//   };
}

const RiderDashboard = () => {
  const { user } = useAppData();
  const socket = useSocket();
  

  const [profile, setProfile] = useState<IRider | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const [incommingOrder, setIncomingOrder] = useState<string[]>([]);
  const [currentOrder, setCurrentOrder] = useState<IOrder | null>(null);

  const [audioUnlock, setAudioUnlock] = useState(false);
  const audioref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioref.current = new Audio(audio);
    audioref.current.preload = "auto";
  }, []);

  const unlockAudio = async () => {
    try {
      if(!audioref.current) return;
      await audioref.current.play();
      audioref.current.pause();
      audioref.current.currentTime = 0;
      setAudioUnlock(true);
      toast.success("Audio unlocked");
    } catch (error) {
      toast.error("try again to unlock audio");
    }
  };

  useEffect(() => {
    if (!socket) return;
    const onNewOrder = ({orderId}: { orderId: string }) => {
      setIncomingOrder((prev) => prev.includes(orderId) ? prev : [...prev, orderId]);

      if(audioUnlock && audioref.current){
        audioref.current.currentTime = 0;
        audioref.current.play().catch((error)=>{
          console.log("Error playing audio:", error);
        });
      }

      setTimeout(() => {
        setIncomingOrder((prev) => prev.filter((id) => id !== orderId));
      }, 10000);
    };
    socket.on("order:available", onNewOrder);

    return () => {
      socket.off("order:available", onNewOrder);
    };
    
  }, [socket, audioUnlock]);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [image, setImage] = useState<File | null>(null);

  const maskValue = (value: string, showLast = 4) => {
    if (!value) return "-";
    const last = value.slice(-showLast);
    return `${"*".repeat(Math.max(value.length - showLast, 0))}${last}`;
  };

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_RIDER_SERVICE_URL}/api/rider/me`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setProfile(data.rider || null);
    } catch (error) {
      setProfile(null);
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "rider") fetchProfile();
    else setLoading(false);
  }, [user]);

  const fetchCurrentOrder = async () => {
    try {
      const { data }= await axios.get(`${import.meta.env.VITE_RIDER_SERVICE_URL}/api/rider/order/current`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setCurrentOrder(data.order);
    } catch (error) {
      setCurrentOrder(null);
      console.log(error);
    }
  }

  useEffect(() => {
    fetchCurrentOrder();
  }, []);

  const toggleAvailiblity = async () => {
    if (!navigator.geolocation) {
      toast.error("Location access required");
      return;
    }

    setToggling(true);

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        await axios.patch(
          `${import.meta.env.VITE_RIDER_SERVICE_URL}/api/rider/update-availability`,
          {
            isAvailable: !profile?.isAvailable,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        toast.success(profile?.isAvailable ? "You are offline" : "You are online");
        fetchProfile();
      } catch (error: any) {
        const message = error?.response?.data?.message || "Failed to update availability";
        toast.error(message);
      } finally {
        setToggling(false);
      }
    });
  };

  const handleSubmit = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setSubmitting(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const formData = new FormData();

      formData.append("phoneNumber", phoneNumber);
      formData.append("aadharNumber", aadharNumber);
      formData.append("drivingLicenseNumber", drivingLicenseNumber);
      formData.append("latitude", String(position.coords.latitude));
      formData.append("longitude", String(position.coords.longitude));

      if (image) {
        formData.append("file", image);
      }

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_RIDER_SERVICE_URL}/api/rider/add`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        toast.success(data.message);
        fetchProfile();
      } catch (error: any) {
        const message = error?.response?.data?.message || "Failed to insert data";
        toast.error(message);
      } finally {
        setSubmitting(false);
      }
    });
  };

  if (user?.role !== "rider") {
    return (
      <div className="text-center my-80 font-bold text-gray-500">
        Access denied. This page is only for riders.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center my-80 font-bold text-gray-500">
        Loading your profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-lg space-y-5 rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Add Your Profile</h1>
          <input
            type="text"
            placeholder="Contact Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none"
          />
          <input
            type="text"
            placeholder="Aadhar Number"
            value={aadharNumber}
            onChange={(e) => setAadharNumber(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none"
          />
          <input
            type="text"
            placeholder="Driving License Number"
            value={drivingLicenseNumber}
            onChange={(e) => setDrivingLicenseNumber(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none"
          />
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm text-gray-600 hover:bg-gray-50">
            <BiUpload className="h-5 w-5 text-red-500" />
            {image ? image.name : "Upload your image"}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
          </label>

          <button
            className="w-full cursor-pointer rounded-lg bg-[#e23744] py-3 text-sm font-semibold text-white"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Submitting..." : "Add Profile"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-24 bg-linear-to-r from-slate-500 via-gray-700 to-gray-900" />

          <div className="px-5 pb-5 sm:px-6">
            <div className="-mt-11 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <img
                  src={profile.picture}
                  className="h-24 w-24 rounded-2xl border-4 border-white bg-white object-cover shadow-sm"
                  alt="Rider profile"
                />
                <div className="pb-1">
                  <p className="text-xl font-bold text-slate-900">{user?.name || "Rider"}</p>
                  <p className="text-sm text-slate-500">{user?.email || "No email"}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pb-1">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    profile.isVerified
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {profile.isVerified ? "Verified Rider" : "Pending Verification"}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    profile.isAvailable ? "bg-sky-100 text-sky-700" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {profile.isAvailable ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Contact</p>
            <div className="mt-3 flex items-center gap-2 text-slate-800">
              <BiPhoneCall className="h-5 w-5 text-red-500" />
              <p className="text-sm font-medium">{profile.phoneNumber}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Aadhar ID</p>
            <div className="mt-3 flex items-center gap-2 text-slate-800">
              <BiIdCard className="h-5 w-5 text-red-500" />
              <p className="text-sm font-medium">{maskValue(profile.aadharNumber)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">License</p>
            <div className="mt-3 flex items-center gap-2 text-slate-800">
              <BiBadgeCheck className="h-5 w-5 text-red-500" />
              <p className="text-sm font-medium">{maskValue(profile.drivingLicenseNumber)}</p>
            </div>
          </div>

        </section>

        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700 shadow-sm">
          Please be within a 500m radius of a restaurant hotspot before going online to receive orders.
        </section>

        {profile.isVerified && !currentOrder && (
          <button
            onClick={toggleAvailiblity}
            disabled={toggling}
            className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition ${
              toggling
                ? "cursor-not-allowed bg-gray-400"
                : profile.isAvailable
                ? "bg-slate-700 hover:bg-slate-800"
                : "bg-[#e23744] hover:bg-[#c92f3c]"
            }`}
          >
            {toggling ? "Updating..." : profile.isAvailable ? "Go Offline" : "Go Online"}
          </button>
        )}
      </div>
      {!audioUnlock && (
      <div className="sticky top-4 z-30 mx-auto max-w-3xl px-4">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 p-4 shadow-sm">

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-white text-xl shadow">
              🔔
            </div>

            <div>
              <p className="font-semibold text-blue-900">
                Enable Sound Notifications
              </p>
              <p className="text-sm text-blue-700">
                So you never miss a new delivery request
              </p>
            </div>
          </div>

          <button
            onClick={unlockAudio}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 active:scale-95 transition"
          >
            Enable Sound
          </button>

        </div>
      </div>
    )}
    {profile.isAvailable && incommingOrder.length > 0 && (
      <div className="mx-auto mt-6 max-w-md px-4">

        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Incoming Orders
          </h3>

          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
            {incommingOrder.length} New
          </span>
        </div>

        <div className="space-y-4">
          {incommingOrder.map((orderId) => (
            <RiderOrderRequest
              key={orderId}
              orderId={orderId}
              onAccepted={() => {
                fetchProfile();
                fetchCurrentOrder();
              }}
            />
          ))}
        </div>

      </div>
    )}
    {
      currentOrder && <div className="mx-auto space-y-4 max-w-md px-4">
        <RiderCurrentOrder order={currentOrder} onStatusUpdate={fetchCurrentOrder}/>
      </div>
    }
    </div>
  );
};

export default RiderDashboard;
