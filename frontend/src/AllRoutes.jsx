import { Navigate, Route, Routes } from "react-router-dom";
import PostForm from "./components/PostForm";
import PostsList from "./components/PostsList";
import UserAnalytics from "./components/UserAnalytics";
import PostAnalytics from "./components/PostAnalytics";
import AppShell from "./components/ds/AppShell";
import { PageContainer } from "./components/ds/Page";
import ExplorePage from "./pages/ExplorePage";
import ReviewPage from "./pages/ReviewPage";
import StatsPage from "./pages/StatsPage";
import ProfilePage from "./pages/ProfilePage";
import LessonPage from "./pages/LessonPage";
import NewLessonPage from "./pages/NewLessonPage";
import NotFoundPage from "./pages/NotFoundPage";
import { AuthLayout, LoginPage, SignupPage } from "./pages/AuthPages";
import WelcomePage from "./pages/WelcomePage";
import EditProfilePage from "./pages/EditProfilePage";
import { RequireAuth } from "./components/auth/Guards";
import { useMe } from "./hooks/useAuth";
import { SAMPLE_REVIEWS } from "./sample/sampleData";

/** `/profile` (the Profile nav item before `me` loads) goes to the signed-in user's page. */
const MyProfileRedirect = () => {
  const { data: me } = useMe();
  return <Navigate to={`/u/${me.handle}`} replace />;
};

const AllRoutes = () => {
  return (
    <Routes>
      {/* Sample due count until the review queue API lands. */}
      <Route element={<AppShell badges={{ review: SAMPLE_REVIEWS.length }} />}>
        {/* Public: logged-out visitors can browse Explore. */}
        <Route path='/explore' element={<ExplorePage />} />

        {/* Everything else needs an account; the guard sends visitors to /login and back. */}
        <Route element={<RequireAuth />}>
          <Route path='/' element={<PostsList />} />
          <Route path='/review' element={<ReviewPage />} />
          <Route path='/stats' element={<StatsPage />} />
          <Route path='/profile' element={<MyProfileRedirect />} />
          <Route path='/u/:handle' element={<ProfilePage />} />
          <Route path='/settings/profile' element={<EditProfilePage />} />
          <Route path='/lesson/:id' element={<LessonPage />} />
          <Route path='/new' element={<NewLessonPage />} />

          {/* Classic screens, kept until the feature slices replace them. */}
          <Route path='/post' element={<PageContainer><PostForm /></PageContainer>} />
          <Route path='/user-analytics' element={<UserAnalytics />} />
          <Route path='/post-analytics' element={<PostAnalytics />} />

          <Route path='*' element={<NotFoundPage />} />
        </Route>
      </Route>
      <Route element={<AuthLayout />}>
        <Route path='/login' element={<LoginPage />} />
        <Route path='/signup' element={<SignupPage />} />
        <Route element={<RequireAuth />}>
          <Route path='/welcome' element={<WelcomePage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AllRoutes;
