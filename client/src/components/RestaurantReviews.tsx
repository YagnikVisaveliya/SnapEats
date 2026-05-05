import React, { useState, useEffect } from "react";
import axios from "axios";
import { Star } from "lucide-react";
import type { IReview } from "../types";

export default function RestaurantReviews({
  restaurantId,
}: {
  restaurantId: string;
}) {
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/review/${restaurantId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setReviews(data.reviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) {
      fetchReviews();
    }
  }, [restaurantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      await axios.post(
        `${import.meta.env.VITE_RESTAURANT_SERVICE_URL}/api/review/${restaurantId}`,
        { rating, comment },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setComment("");
      setRating(5);
      fetchReviews();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add review");
    } finally {
      setSubmitting(false);
    }
  };

  const displayedReviews = showAll ? reviews : reviews.slice(0, 7); // Show only first 7 reviews when not showing all

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Reviews</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-gray-50 p-4 rounded-lg space-y-4"
      >
        <h3 className="text-lg font-medium">Leave a Review</h3>
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div>
          <label className="block text-sm text-gray-600 mb-1">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button type="button" key={star} onClick={() => setRating(star)}>
                <Star
                  className={
                    star <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-orange-500 outline-none"
            rows={3}
            placeholder="Tell us about your experience..."
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>

      <div className="space-y-4">
        {loading ? (
          <p className="text-gray-500">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-gray-500">
            No reviews yet. Be the first to review!
          </p>
        ) : (
          <>
            {/* ✅ changed here */}
            {displayedReviews.map((rev) => (
              <div key={rev._id} className="border rounded-lg p-4 bg-white">
                <div className="flex items-center gap-3 mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {rev.userName}
                    </h4>
                    <div className="flex items-center gap-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={
                              i < rev.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                {rev.comment && (
                  <p className="text-gray-700 mt-2">{rev.comment}</p>
                )}
              </div>
            ))}

            {/* ✅ add this button */}
            {reviews.length > 7 && (
              <div className="text-center">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-orange-500 font-medium hover:underline"
                >
                  {showAll ? "Show Less" : "Show More"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
