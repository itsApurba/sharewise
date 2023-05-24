import React from "react";
import { Route, Routes } from "react-router-dom";
import UserForm from "./components/UserForm";
import PostForm from "./components/PostForm";
import PostsList from "./components/PostsList";
import UsersList from "./components/UsersList";

const AllRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<PostsList />} />
      <Route path='/user' element={<UserForm />} />
      <Route path='/users' element={<UsersList />} />
      <Route path='/post' element={<PostForm />} />
      <Route path='/analytics' element={<PostForm />} />
    </Routes>
  );
};

export default AllRoutes;
