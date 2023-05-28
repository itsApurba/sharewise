import React from "react";
import { Route, Routes } from "react-router-dom";
import UserForm from "./components/UserForm";
import PostForm from "./components/PostForm";
import PostsList from "./components/PostsList";
import UsersList from "./components/UsersList";
import UserAnalytics from "./components/UserAnalytics";
import PostAnalytics from "./components/PostAnalytics";
import CreatePage from "./components/CreatePage";

const AllRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<PostsList />} />
      <Route path='/create' element={<CreatePage />} />
      <Route path='/user' element={<UserForm />} />
      <Route path='/users' element={<UsersList />} />
      <Route path='/post' element={<PostForm />} />
      <Route path='/user-analytics' element={<UserAnalytics />} />
      <Route path='/post-analytics' element={<PostAnalytics />} />
    </Routes>
  );
};

export default AllRoutes;
