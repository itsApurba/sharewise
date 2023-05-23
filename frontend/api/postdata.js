import axios from "axios";

export const getAllPosts = async () => {
  const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/posts`);
  return res.data;
};

export const getPostById = async (id) => {
  const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/posts/${id}`);
  return res.data;
};

export const createPost = async (postData) => {
  const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/posts`, postData);
  return res.data;
};

export const updatePostByID = async (postData) => {
  const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/posts/${postData.id}`, postData);
  return res.data;
};

export const likePost = async (id) => {
  const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/posts/${id}/like`);
  return res.data;
};

export const dislikePost = async (id) => {
  const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/posts/${id}/unlike`);
  return res.data;
};
