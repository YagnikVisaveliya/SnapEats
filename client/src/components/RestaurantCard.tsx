import { useNavigate } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import { useState } from "react";
import axios from "axios";


interface RestaurantCardProps {
  id: string;
  name: string;
  image: string;
  distance: string;
  isOpen: boolean;
  isFavorite?: boolean;
  rating?: number;
  numReviews?: number;
}

function RestaurantCard({ id, name, image, distance, isOpen, isFavorite: initialIsFavorite, rating, numReviews }: RestaurantCardProps) {
    const navigate = useNavigate();
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite || false);

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const prev = isFavorite;
        setIsFavorite(!prev);
        try {
            await axios.post(
                `${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/favorite/toggle`,
                { restaurantId: id },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
        } catch (error) {
            console.error("Failed to toggle favorite:", error);
            setIsFavorite(prev);
        }
    };

  return (
    <div
      className={`cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md ${
        !isOpen ? "opacity-80" : ""
      }`}
      onClick={() => navigate(`/restaurant/${id}`)}
    >
      <div className="relative h-40 w-full overflow-hidden">
        <img
          src={image}
          alt=""
          className={`h-full w-full object-cover transition duration-300 hover:scale-105 ${
            !isOpen ? "grayscale" : ""
          }`}
        />

        {!isOpen && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-md bg-black/80 px-3 py-1 font-semibold text-sm text-white">
              Closed
            </span>
          </div>
        )}

        <button
            onClick={handleFavoriteClick}
            className="absolute right-2 top-2 rounded-full bg-white/70 p-1.5 backdrop-blur-sm transition-colors hover:bg-white"
        >
            <Heart
                size={20}
                className={`transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"}`}
            />
        </button>
      </div>

      <div className="p-3 space-y-1">
        <div className="flex items-start justify-between">
            <h3 className="truncate text-base font-semibold text-gray-800">
                {name}
            </h3>
            {rating && rating > 0 ? (
                <div className="flex items-center gap-1 shrink-0 bg-green-100 px-1.5 py-0.5 rounded text-green-800 text-xs font-medium">
                    <span>{rating.toFixed(1)}</span>
                    <Star size={10} className="fill-green-800" />
                </div>
            ) : null}
        </div>
        <p className="text-sm text-gray-500">{distance} KM away</p>
      </div>
    </div>
  )
}

export default RestaurantCard