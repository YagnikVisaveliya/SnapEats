const VerifiedRestaurant = ({
  restaurant,
}: {
  restaurant: any;
}) => {
  return (
    <div className="group rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.25)] transition hover:-translate-y-1 hover:border-emerald-300/30">
      <img
        src={restaurant.image}
        className="h-40 w-full rounded-xl object-cover"
        alt={restaurant.name}
      />

      <div className="mt-3 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-white">{restaurant.name}</h3>
          <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-200">
            Verified
          </span>
        </div>
        <p className="text-sm text-slate-300">{restaurant.phone}</p>
        <p className="line-clamp-2 text-sm text-slate-400">
          {restaurant.autoLocation?.formattedAddress || "Location not available"}
        </p>
      </div>
    </div>
  );
};

export default VerifiedRestaurant;