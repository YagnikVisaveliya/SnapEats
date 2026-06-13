import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import { authService } from "../main";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { useAppData } from "../context/AppContext";
import snapeatsImg from "../assets/Food.png";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { setUser, setIsAuth } = useAppData();

  const responseGoogle = async (authResult: any) => {
    setLoading(true);
    try {
      const result = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, {
        code: authResult["code"],
      });

      localStorage.setItem("token", result.data.token);
      toast.success(result.data.message);
      setLoading(false);
      setUser(result.data.user);
      setIsAuth(true);
      navigate("/", { replace: true });
    } catch (error) {
      console.log(error);
      toast.error("Problem while login");
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "auth-code",
  });
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-white overflow-hidden">
      <div className="relative hidden md:block md:w-1/2 lg:w-3/5 h-screen overflow-hidden">
        <img
          src={snapeatsImg}
          alt="SnapEats Food Delivery"
          className="h-full w-full object-cover transition-transform duration-10000 hover:scale-105"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4))" }}
        />
        
        <div className="absolute top-12 left-12">
          <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">
            Snap<span className="text-[#E23744]">Eats</span>
          </h1>
        </div>
        
        <div className="absolute bottom-16 left-12 right-12 text-white">
          <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl leading-tight drop-shadow">
            Savor the Moment
          </h2>
          <p className="mt-4 text-lg text-gray-200 font-medium max-w-lg drop-shadow">
            Your favorite meals from local restaurants, delivered hot and fresh straight to your doorstep.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 md:w-1/2 lg:w-2/5 sm:px-12 bg-white relative z-10 min-h-screen">
        <div className="block md:hidden mb-10 -mx-6 -mt-22 overflow-hidden  shadow-md h-64 relative">
          <img
            src={snapeatsImg}
            alt="SnapEats"
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent)" }}
          />
          <div className="absolute bottom-6 left-6 text-white">
            <h1 className="text-3xl font-black tracking-tight">
              Snap<span className="text-[#E23744]">Eats</span>
            </h1>
            <p className="text-sm text-gray-200 font-medium">Fresh food delivered fast</p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm space-y-8">
          <div className="text-center md:text-left">
            <h1 className="hidden md:block text-4xl font-black text-[#E23744] tracking-tight">
              Snap<span className="text-gray-800">Eats</span>
            </h1>
            <h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-500 font-medium">
              Log in or sign up to your account to continue ordering
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <button
              onClick={googleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3.5 rounded-xl border border-gray-200 bg-white px-5 py-4 text-base font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <FcGoogle size={24} />
              {loading ? "Signing in..." : "Continue with Google"}
            </button>

            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-gray-100" />
            </div>

            <p className="text-center text-xs text-gray-400 leading-relaxed px-4">
              By continuing, you agree to our{" "}
              <a href="#" className="underline font-medium text-gray-500 hover:text-[#E23744] transition-colors">Terms of Service</a> &{" "}
              <a href="#" className="underline font-medium text-gray-500 hover:text-[#E23744] transition-colors">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
