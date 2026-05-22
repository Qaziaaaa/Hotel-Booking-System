import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { reviewsAPI } from '../services/api';

const ReviewModal = ({ booking, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [ratingError, setRatingError] = useState('');

  const submitReview = useMutation({
    mutationFn: (data) => reviewsAPI.create(data),
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setRatingError('Please select a rating between 1 and 5');
      return;
    }
    setRatingError('');

    submitReview.mutate({
      hotelId: booking.hotel?.id || booking.hotelId,
      bookingId: booking.id,
      rating,
      comment: comment || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-serif text-xl text-on-surface">Write a Review</h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Hotel info */}
        <div className="mb-5 pb-4 border-b border-outline-variant/30">
          <p className="font-sans font-semibold text-on-surface break-words">{booking.hotel?.name}</p>
          <p className="font-sans text-sm text-on-surface-variant">{booking.room?.roomType}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div className="mb-5">
            <label className="block font-sans text-sm font-medium text-on-surface mb-3">
              Your Rating
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <span
                    className={`material-symbols-outlined text-[36px] transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-secondary-fixed-dim'
                        : 'text-outline-variant'
                    }`}
                    style={{
                      fontVariationSettings: star <= (hoverRating || rating)
                        ? "'FILL' 1"
                        : "'FILL' 0",
                    }}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>
            {ratingError && (
              <p className="font-sans text-sm text-error mt-1">{ratingError}</p>
            )}
          </div>

          {/* Comment */}
          <div className="mb-5">
            <label className="block font-sans text-sm font-medium text-on-surface mb-2">
              Review <span className="text-on-surface-variant font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              className="w-full p-3 border border-outline-variant rounded-lg font-sans text-sm text-on-surface bg-surface focus:ring-1 focus:ring-secondary focus:outline-none resize-none"
              rows={4}
            />
          </div>

          {/* API Error */}
          {submitReview.isError && (
            <div className="mb-4 bg-error-container rounded-lg p-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-on-error-container text-[18px]">error</span>
              <p className="font-sans text-sm text-on-error-container">
                {submitReview.error?.response?.data?.message || 'Failed to submit review. Please try again.'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-outline-variant rounded-lg font-sans text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rating === 0 || submitReview.isPending}
              className="flex-1 py-2.5 bg-primary-container text-on-primary rounded-lg font-sans text-sm font-medium hover:-translate-y-0.5 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
