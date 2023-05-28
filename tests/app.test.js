const request = require("supertest");
const app = require("../src/index")
const mongoose = require("mongoose");
const {mongo} = require('../src/config/vars')

let userId, postId

beforeAll(async () => {
  await mongoose.connect(mongo.uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.connection.close();
});
describe("POST /users", () => {
  it("should create a new user", async () => {
    const newUser = {
      name: "John Doe",
      email: "john.dooe@example.com",
    };

    const response = await request(app).post("/api/users").send(newUser);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("_id"); // Check if the response contains an _id property
    expect(response.body.name).toBe(newUser.name);
    expect(response.body.email).toBe(newUser.email);
    
    userId = response.body._id;
  });
});

describe("GET /users/:id", () => {
  it("should retrieve a user by id", async () => {
    const response = await request(app).get(`/api/users/${userId}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("_id");
    expect(response.body._id).toBe(userId);
    
  });
});
describe("PUT /users/:id", () => {
  it("should update a user's name or bio by id", async () => {
    const updatedUser = {
      name: "Updated Name",
      bio: "Updated Bio",
    };

    const response = await request(app).put(`/api/users/${userId}`).send(updatedUser);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("_id");
    expect(response.body._id).toBe(userId);
    expect(response.body.name).toBe(updatedUser.name);
    expect(response.body.bio).toBe(updatedUser.bio);
    
  });
});
describe("GET /analytics/users", () => {
  it("should retrieve the total number of users", async () => {

    const response = await request(app).get("/api/analytics/users");

    expect(response.status).toBe(200); 
    expect(response.body).toHaveProperty("total_users");
  });
});


describe("POST /posts", () => {
  it("should create a new post", async () => {
    const newPost = {
      user_id: userId, // Assuming you have userId from previous tests
      title: "New Post Title",
      content: "New Post Content",
    };

    const response = await request(app).post("/api/posts").send(newPost);

    expect(response.status).toBe(201); // Adjust the expected status code if needed
    expect(response.body).toHaveProperty("_id");
    postId = response.body._id;
    expect(response.body.title).toBe(newPost.title);
    expect(response.body.content).toBe(newPost.content);
    // You may want to add more checks depending on your API's response
  });
});

describe("GET /posts/:id", () => {
  it("should retrieve a post by id", async () => {
    const response = await request(app).get(`/api/posts/${postId}`);

    expect(response.status).toBe(200); // Adjust the expected status code if needed
    expect(response.body).toHaveProperty("_id");
    expect(response.body._id).toBe(postId);
    // You may want to add more checks depending on your API's response
  });
});

describe("PUT /posts/:id", () => {
  it("should update a post's content by id", async () => {
    const updatedPost = {
      title: "Updated Post Title",
      content: "Updated Post Content",
    };

    const response = await request(app).put(`/api/posts/${postId}`).send(updatedPost);

    expect(response.status).toBe(200); // Adjust the expected status code if needed
    expect(response.body).toHaveProperty("_id");
    expect(response.body._id).toBe(postId);
    expect(response.body.title).toBe(updatedPost.title);
    expect(response.body.content).toBe(updatedPost.content);
    // You may want to add more checks depending on your API's response
  });
});





describe("DELETE /users/:id", () => {
  it("should delete a user by id", async () => {
    const response = await request(app).delete(`/api/users/${userId}`);

    expect(response.status).toBe(200);
  });
});

