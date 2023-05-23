import React from "react";
import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import UserForm from "./components/UserForm";
import PostForm from "./components/PostForm";

const AllRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<h1>Home</h1>} />
      <Route path='/user' element={<UserForm />} />
      <Route path='/post' element={<PostForm />} />
      <Route path='/analytics' element={<PostForm />} />
    </Routes>
  );
};

export default AllRoutes;
