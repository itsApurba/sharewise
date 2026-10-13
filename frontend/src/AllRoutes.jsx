import { Route, Routes } from "react-router-dom";
import UserForm from "./components/UserForm";
import UsersList from "./components/UsersList";
import UserAnalytics from "./components/UserAnalytics";
import PostAnalytics from "./components/PostAnalytics";
import AppShell from "./components/ds/AppShell";
import { PageContainer } from "./components/ds/Page";
import ReviewPage from "./pages/ReviewPage";
import StatsPage from "./pages/StatsPage";
import ProfilePage from "./pages/ProfilePage";
import LessonPage from "./pages/LessonPage";
import NotFoundPage from "./pages/NotFoundPage";
import ExplorePage from "./pages/ExplorePage";
import FeedPage from "./pages/FeedPage";
import { EditLessonPage, NewLessonPage } from "./pages/NewLessonPage";
import { useMe } from "./hooks/useAuth";
import { useDueReviews } from "./hooks/useReviews";
import { AuthLayout, LoginPage, SignupPage } from "./pages/AuthPages";

/** The app frame with the live due count on the Review tab. */
const Shell = () => {
  const { data: me } = useMe();
  const { data: due } = useDueReviews({ enabled: Boolean(me) });
  return <AppShell badges={{ review: me ? (due?.total ?? 0) : 0 }} />;
};

const AllRoutes = () => {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path='/' element={<FeedPage />} />
        <Route path='/explore' element={<ExplorePage />} />
        <Route path='/review' element={<ReviewPage />} />
        <Route path='/stats' element={<StatsPage />} />
        <Route path='/u/:handle' element={<ProfilePage />} />
        <Route path='/lesson/:id' element={<LessonPage />} />
        <Route path='/lesson/:id/edit' element={<EditLessonPage />} />
        <Route path='/new' element={<NewLessonPage />} />

        {/* Classic screens, kept until the feature slices replace them. */}
        <Route path='/user' element={<PageContainer><UserForm /></PageContainer>} />
        <Route path='/users' element={<UsersList />} />
        <Route path='/user-analytics' element={<UserAnalytics />} />
        <Route path='/post-analytics' element={<PostAnalytics />} />

        <Route path='*' element={<NotFoundPage />} />
      </Route>
      <Route element={<AuthLayout />}>
        <Route path='/login' element={<LoginPage />} />
        <Route path='/signup' element={<SignupPage />} />
      </Route>
    </Routes>
  );
};

export default AllRoutes;
