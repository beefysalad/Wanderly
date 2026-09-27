import type { Metadata } from "next";
import ReviewsComponent from "../components/pages/Reviews";

export const metadata: Metadata = {
  title: "Reviews",
  description: "What travellers say about planning group trips with Wanderly, and a place to leave your own review.",
};

const ReviewsPage = () => {
  return <ReviewsComponent />;
};

export default ReviewsPage;
