import { useQueryClient } from "@tanstack/react-query";
import { useMe } from "../../hooks/useAuth";
import { useAnswerReview } from "../../hooks/useReviews";
import ReviewCard from "../ds/ReviewCard";

/** A due review inside the feed. The answered card stays to show its result until "Continue". */
const FeedReviewItem = ({ review }) => {
  const queryClient = useQueryClient();
  const answerReview = useAnswerReview();
  const { data: me } = useMe();
  return (
    <ReviewCard
      review={review}
      stepLabel='Review due'
      onAnswer={(body) => answerReview.mutateAsync({ id: review.id, keepFeed: true, ...body })}
      onContinue={() => queryClient.invalidateQueries({ queryKey: ["feed"] })}
      continueLabel='Continue'
      timeZone={me?.timezone}
    />
  );
};

export default FeedReviewItem;
