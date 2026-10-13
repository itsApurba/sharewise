import { Route, Routes } from "react-router-dom";
import UserForm from "./components/UserForm";
import PostForm from "./components/PostForm";
import PostsList from "./components/PostsList";
import UsersList from "./components/UsersList";
import CreatePage from "./components/CreatePage";
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
import { SAMPLE_REVIEWS } from "./sample/sampleData";

const AllRoutes = () => {
  return (
    <Routes>
      {/* Sample due count until the review queue API lands. */}
      <Route element={<AppShell badges={{ review: SAMPLE_REVIEWS.length }} />}>
        <Route path='/' element={<PostsList />} />
        <Route path='/explore' element={<ExplorePage />} />
        <Route path='/review' element={<ReviewPage />} />
        <Route path='/stats' element={<StatsPage />} />
        <Route path='/u/:handle' element={<ProfilePage />} />
        <Route path='/lesson/:id' element={<LessonPage />} />
        <Route path='/new' element={<NewLessonPage />} />

        {/* Classic screens, kept until the feature slices replace them. */}
        <Route path='/create' element={<CreatePage />} />
        <Route path='/user' element={<PageContainer><UserForm /></PageContainer>} />
        <Route path='/users' element={<UsersList />} />
        <Route path='/post' element={<PageContainer><PostForm /></PageContainer>} />

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
