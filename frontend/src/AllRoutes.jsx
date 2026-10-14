import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/ds/AppShell";
import ReviewPage from "./pages/ReviewPage";
import StatsPage from "./pages/StatsPage";
import ProfilePage from "./pages/ProfilePage";
import LessonPage from "./pages/LessonPage";
import NotFoundPage from "./pages/NotFoundPage";
import ExplorePage from "./pages/ExplorePage";
import DeckPage from "./pages/DeckPage";
import FeedPage from "./pages/FeedPage";
import { EditLessonPage, NewLessonPage } from "./pages/NewLessonPage";
import { useMe } from "./hooks/useAuth";
import { useDueReviews } from "./hooks/useReviews";
import { AuthLayout, LoginPage, SignupPage } from "./pages/AuthPages";
import WelcomePage from "./pages/WelcomePage";
import EditProfilePage from "./pages/EditProfilePage";
import { RequireAuth } from "./components/auth/Guards";

/** The app frame with the live due count on the Review tab. */
const Shell = () => {
  const { data: me } = useMe();
  const { data: due } = useDueReviews({ enabled: Boolean(me) });
  return <AppShell badges={{ review: me ? (due?.total ?? 0) : 0 }} />;
};

/** `/profile` (the Profile nav item before `me` loads) goes to the signed-in user's page. */
const MyProfileRedirect = () => {
  const { data: me } = useMe();
  return <Navigate to={`/u/${me.handle}`} replace />;
};

const AllRoutes = () => {
  return (
    <Routes>
      <Route element={<Shell />}>
        {/* Public: logged-out visitors can browse Explore. */}
        <Route path='/explore' element={<ExplorePage />} />
        <Route path='/deck/:id' element={<DeckPage />} />

        {/* Everything else needs an account; the guard sends visitors to /login and back. */}
        <Route element={<RequireAuth />}>
          <Route path='/' element={<FeedPage />} />
          <Route path='/review' element={<ReviewPage />} />
          <Route path='/stats' element={<StatsPage />} />
          <Route path='/profile' element={<MyProfileRedirect />} />
          <Route path='/u/:handle' element={<ProfilePage />} />
          <Route path='/settings/profile' element={<EditProfilePage />} />
          <Route path='/lesson/:id' element={<LessonPage />} />
          <Route path='/lesson/:id/edit' element={<EditLessonPage />} />
          <Route path='/new' element={<NewLessonPage />} />


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
