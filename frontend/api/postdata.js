import axios from "axios";

export const getAllPosts = async () => {
  const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/posts`);
  return res.data.reverse();
};

export const getPostById = async (id) => {
  const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/posts/${id}`);
  return res.data;
};

export const createPost = async (postData) => {
  try {
    const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/posts`, postData);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const updatePostByID = async ({ id, content }) => {
  console.log(id, content);
  const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/posts/${id}`, { content });
  return res.data;
};

export const deletePostByID = async (id) => {
  const res = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/posts/${id}`);
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

export const getTotalPosts = async () => {
  const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/analytics/posts`);
  return res.data;
};

export const getTopPosts = async () => {
  const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/analytics/posts/top-liked`);
  return res.data;
};
