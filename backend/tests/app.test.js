const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api } = require("./helpers");

let userId, postId;

before(startDb);
after(stopDb);

// The cases run in order and share the user and post they create.
describe("users", () => {
  it("POST /users creates a new user", async () => {
    const newUser = {
      name: "John Doe",
      email: "john.dooe@example.com",
    };

    const response = await api().post("/api/users").send(newUser);

    assert.equal(response.status, 201);
    assert.ok(response.body._id);
    assert.equal(response.body.name, newUser.name);
    assert.equal(response.body.email, newUser.email);

    userId = response.body._id;
  });

  it("GET /users lists users", async () => {
    const response = await api().get("/api/users");

    assert.equal(response.status, 200);
    assert.deepEqual(
      response.body.map((user) => user._id),
      [userId]
    );
  });

  it("GET /users/:id retrieves a user by id", async () => {
    const response = await api().get(`/api/users/${userId}`);

    assert.equal(response.status, 200);
    assert.equal(response.body._id, userId);
  });

  it("PUT /users/:id updates a user's name and bio", async () => {
    const updatedUser = {
      name: "Updated Name",
      bio: "Updated Bio",
    };

    const response = await api().put(`/api/users/${userId}`).send(updatedUser);

    assert.equal(response.status, 200);
    assert.equal(response.body._id, userId);
    assert.equal(response.body.name, updatedUser.name);
    assert.equal(response.body.bio, updatedUser.bio);
  });

  it("PUT /users/:id rejects a bio over 50 characters", async () => {
    const response = await api().put(`/api/users/${userId}`).send({ bio: "x".repeat(51) });

    assert.equal(response.status, 400);
  });

  it("PUT /users/:id without a bio answers 500 instead of crashing the server", async () => {
    // The controller still throws here; Express 5 now forwards the rejected promise to its error handler.
    const response = await api().put(`/api/users/${userId}`).send({ name: "No Bio" });

    assert.equal(response.status, 500);
    await api().get("/api/").expect(200);
  });
});

describe("posts", () => {
  it("POST /posts creates a new post", async () => {
    const newPost = {
      user_id: userId,
      content: "New Post Content",
    };

    const response = await api().post("/api/posts").send(newPost);

    assert.equal(response.status, 201);
    assert.ok(response.body._id);
    assert.equal(response.body.content, newPost.content);
    assert.equal(response.body.likes, 0);

    postId = response.body._id;
  });

  it("POST /posts rejects a post without a user", async () => {
    const response = await api().post("/api/posts").send({ content: "Orphan" });

    assert.equal(response.status, 400);
  });

  it("GET /posts lists posts", async () => {
    const response = await api().get("/api/posts");

    assert.equal(response.status, 200);
    assert.deepEqual(
      response.body.map((post) => post._id),
      [postId]
    );
  });

  it("GET /posts/:id retrieves a post by id", async () => {
    const response = await api().get(`/api/posts/${postId}`);

    assert.equal(response.status, 200);
    assert.equal(response.body._id, postId);
  });

  it("PUT /posts/:id updates a post's content", async () => {
    const response = await api().put(`/api/posts/${postId}`).send({ content: "Updated Post Content" });

    assert.equal(response.status, 200);
    assert.equal(response.body._id, postId);
    assert.equal(response.body.content, "Updated Post Content");
  });

  it("POST /posts/:id/like and /unlike change the like count", async () => {
    let response = await api().post(`/api/posts/${postId}/like`);
    assert.equal(response.status, 200);
    assert.equal(response.body.likes, 1);

    response = await api().post(`/api/posts/${postId}/like`);
    assert.equal(response.body.likes, 2);

    response = await api().post(`/api/posts/${postId}/unlike`);
    assert.equal(response.status, 200);
    assert.equal(response.body.likes, 1);
  });

  it("POST /posts/:id/unlike at zero likes answers 406", async () => {
    await api().post(`/api/posts/${postId}/unlike`).expect(200);

    const response = await api().post(`/api/posts/${postId}/unlike`);

    assert.equal(response.status, 406);
  });
});

describe("analytics", () => {
  it("GET /analytics/users returns the total number of users", async () => {
    const response = await api().get("/api/analytics/users");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { userCount: 1 });
  });

  it("GET /analytics/users/top-active ranks users by post count", async () => {
    const response = await api().get("/api/analytics/users/top-active");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, [{ user_id: userId, name: "Updated Name", post_count: 1 }]);
  });

  it("GET /analytics/posts returns the total number of posts", async () => {
    const response = await api().get("/api/analytics/posts");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { total_posts: 1 });
  });

  it("GET /analytics/posts/top-liked ranks posts by likes", async () => {
    await api().post(`/api/posts/${postId}/like`).expect(200);

    const response = await api().get("/api/analytics/posts/top-liked");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, [{ post_id: postId, name: "Updated Name", likes: 1 }]);
  });
});

describe("cleanup", () => {
  it("DELETE /posts/:id deletes a post", async () => {
    const response = await api().delete(`/api/posts/${postId}`);

    assert.equal(response.status, 200);
    await api().get(`/api/posts/${postId}`).expect(404);
  });

  it("DELETE /users/:id deletes a user", async () => {
    const response = await api().delete(`/api/users/${userId}`);

    assert.equal(response.status, 200);
    assert.equal(response.text, "Updated Name has been deleted");
  });
});
