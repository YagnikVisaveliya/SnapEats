import { useAppData } from "../context/AppContext";
import { Navigate, Outlet } from "react-router-dom";

const PublicRoute = () => {
  const { isAuth, loading } = useAppData();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500">Loading...</div>;
  }

  return isAuth ? <Navigate to="/" replace /> : <Outlet />;
};

export default PublicRoute;
