import { adminThemeStyles, type AdminTheme } from "../utils/adminTheme";

const VerifiedRestaurant = ({
  restaurant,
  theme = "dark",
}: {
  restaurant: any;
  theme?: AdminTheme;
}) => {
  const themeStyles = adminThemeStyles[theme];

  return (
    <div className={`group rounded-2xl border p-4 transition hover:-translate-y-1 hover:border-emerald-300/30 ${themeStyles.card}`}>
      <img
        src={restaurant.image}
        className="h-40 w-full rounded-xl object-cover"
        alt={restaurant.name}
      />

      <div className="mt-3 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`text-base font-bold ${themeStyles.primaryText}`}>{restaurant.name}</h3>
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${theme === "dark" ? "bg-emerald-500/20 text-emerald-200" : "bg-emerald-100 text-emerald-800"}`}>
            Verified
          </span>
        </div>
        <p className={`text-sm ${themeStyles.secondaryText}`}>{restaurant.phone}</p>
        <p className={`line-clamp-2 text-sm ${themeStyles.mutedText}`}>
          {restaurant.autoLocation?.formattedAddress || "Location not available"}
        </p>
      </div>
    </div>
  );
};

export default VerifiedRestaurant;