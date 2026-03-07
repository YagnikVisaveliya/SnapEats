import { useEffect, useState } from "react";
import { useAppData } from "../context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";
import { BiUpload } from "react-icons/bi";

interface IRider {
    _id: string;
    picture: string;
    phoneNumber: string;
    aadharNumber: string;
    drivingLicenseNumber: string;
    isVerified: boolean; 
    isAvailable: boolean;
}


const RiderDashboard = () => {
    const { user } = useAppData();

    const [profile, setProfile] = useState<IRider | null>(null);
    const [loading, setLoading] = useState(true);

    const [phoneNumber,setPhoneNumber] = useState("");
    const [drivingLicenseNumber,setDrivingLicenseNumber] = useState("");
    const [aadharNumber,setAadharNumber] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [image, setImage] = useState<File | null>(null);



    const fetchProfile = async ()=>{
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_RIDER_SERVICE_URL}/api/rider/me`,{
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            console.log(data.rider);
            
            setProfile(data.rider || null);
        }catch (error) {
            setProfile(null);
            console.log(error);
        }finally{
            setLoading(false);
        }
    }

    useEffect(()=>{
        if(user?.role === "rider") fetchProfile();
        else setLoading(false);        
    }, [user]);

    if(user?.role !== "rider"){
        return (
            <div className="text-center my-80 font-bold text-gray-500">
                Access denied. This page is only for riders.
            </div>
        )
    }

    if(loading){
        return (
            <div className="text-center my-80 font-bold text-gray-500">
                Loading your profile...
            </div>
        )
    }  

    const handleSubmit = async () => {
        if(!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setSubmitting(true);
        navigator.geolocation.getCurrentPosition(async(position)=>{
            const formData = new FormData();

            formData.append("phoneNumber", phoneNumber);
            formData.append("aadharNumber", aadharNumber);
            formData.append("drivingLicenseNumber", drivingLicenseNumber);
            formData.append("latitude", String(position.coords.latitude));
            formData.append("longitude", String(position.coords.longitude));

            if(image){
                formData.append("file", image);
            }

            
            try {
                const { data } = await axios.post(`${import.meta.env.VITE_RIDER_SERVICE_URL}/api/rider/add`,
                    formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "multipart/form-data",
                    }
                });
                toast.success(data.message);
                fetchProfile();
            } catch (error: any) {
                const message = error?.response?.data?.message || "Failed to insert data";
                toast.error(message);
            } finally {
                setSubmitting(false);
            }
        })
    };

    if(!profile){
        return (
            <div className="min-h-screen bg-gray-50 px-4 py-6">
                  <div className="mx-auto max-w-lg rounded-xl bg-white p-6 shadow-sm space-y-5">
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
                      className="w-full rounded-lg py-3 text-sm font-semibold text-white bg-[#e23744] cursor-pointer"
                      disabled={submitting}
                      onClick={handleSubmit}
                    >
                      {submitting ? "Submitting..." : "Add Profile"}
                    </button>
                  </div>
                </div>
        )
    }
  return (
    <div>RiderDashboard</div>
  )
}

export default RiderDashboard   