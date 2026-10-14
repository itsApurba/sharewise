## Introduction

This project is a simple social media platform consisting of a backend API and a frontend UI, and analytics pages. The platform allows users to create, read, update, and delete user profiles and posts. Users can also "like" and "unlike" posts. The analytics pages display insights on user engagement and content popularity.

The project is built using the following technologies:

* Reactjs
* Express
* Mongodb
* Mongoose
* axios
* React Query
* chakraUI

The project is still under development, but it is already functional and can be used to create a simple social media platform.

## Features

This project has the following features:

* **Create, read, update, and delete user profiles.** Users can create a profile with their name, email, and bio. They can also update their profile at any time.
* **Create, read, update, and delete posts.** Users can create posts with text. They can also update their posts at any time.
* **"Like" and "unlike" posts.** Users can "like" and "unlike" posts. The number of likes for each post is displayed.
* **View analytics on user engagement and content popularity.** The analytics pages display insights on user engagement and content popularity. This includes information such as the total number of users, the top 5 most active users, the total number of posts, the top 5 most liked posts, and so on.

## Installation

To install this project, you will need the following:

* Node.js 22.12 or later (npm)
* MongoDB
* Git

> Before doing anything you need to setup the env variables. Copy these files using `cp .env.example .env` command then edit the `.env` file. You need these files inside backend as well as in the fronend directory with proper credentials. (Check .env.example file for more details)

Once you have installed Node.js and MongoDB, you can install this project by running the following command in your terminal:


1. Clone the repository using the following command: 

```
git clone https://github.com/itsApurba/sharewise.git
```

2. Change the directory to the cloned repository:

```
cd sharewise/frontend
```
Do the same thing for the backend. Open another terminal and change the working directory to the showwise/backend
```
cd sharewise/backend

```
3. Now you can run the following command:

```
npm install
```


Once the project is installed, you can start it by running the following command in both of the terminals:

```
npm run dev
```

The project frontend will be started on port 5173. You can access it by opening a web browser and navigating to `http://localhost:5173`.

And for the backend you have specify the PORT number in .env file


## Deploy to Vercel

Sharewise deploys as two Vercel projects from this repository. Create each with **Add New → Project**, import the repo, and set its **Root Directory**.

### Backend project (Root Directory `backend`)

`backend/api/index.js` is the serverless function and `backend/vercel.json` rewrites `/api/*` to it, so routes stay at `https://<backend>.vercel.app/api/...`. Each instance connects to MongoDB once and reuses the connection on warm requests. A missing required variable or an unreachable database answers `503` and the function log says which.

Set these under **Settings → Environment Variables**, then redeploy:

| Variable | Required | Value |
| --- | --- | --- |
| `MONGO_URI` or `MONGODB_URI` | yes | Atlas connection string including the database name, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/sharewise`. The Vercel MongoDB Atlas integration sets `MONGODB_URI` for you. If both are set, `MONGO_URI` wins. |
| `JWT_SECRET` | yes | A long random value, e.g. `openssl rand -base64 48`. Changing it logs everyone out. |
| `JWT_EXPIRATION_MINUTES` | no | Session lifetime in minutes (default one week). |
| `CORS_ORIGIN` | no | Comma-separated allowed origins, e.g. `https://sharewise.vercel.app`. Unset allows every origin. |
| `NODE_ENV` | no | Vercel already runs functions with `production`. |

**MongoDB Atlas:** Vercel functions have no fixed outbound IP. Under **Network Access**, allow `0.0.0.0/0` (access from anywhere) so the function can connect. The integration may do this for you.

**Demo data (one time):** seed Atlas from your machine. A variable set in the shell wins over `backend/.env`:

```bash
cd backend
npm i
MONGODB_URI='mongodb+srv://user:pass@cluster.mongodb.net/sharewise' npm run seed
```

### Frontend project (Root Directory `frontend`)

Vercel detects Vite and builds `dist`. `frontend/vercel.json` rewrites every non-file path to `index.html`, so deep links load the app instead of a 404.

| Variable | Required | Value |
| --- | --- | --- |
| `VITE_BACKEND_URL` | yes | The backend origin **without `/api`**, e.g. `https://<backend>.vercel.app`. The app appends `/api` itself. |

`VITE_BACKEND_URL` is compiled into the bundle, so redeploy the frontend after changing it, then set the backend's `CORS_ORIGIN` to the frontend's URL.

## Usage

To check this project, you don't need to create an account. You can start creating and updating user profiles and posts. You can also "like" and "unlike" posts. The analytics pages will display insights on user engagement and content popularity.

## Todos

- [x]  Add Dark mode.
- [x]  Add and optimize the routes.
- [ ]  Fix the network cache.
- [ ]  Fix the UserForm and PostForm UI and Implemnt the routing or models.
- [ ]  Write the testcases.
- [ ]  Reduce the layout shifts and renderings.
- [ ]  Add more toast notification.
- [ ]  UIUX

## Contributing

* [Contributing](https://github.com/itsApurba/sharewise/blob/master/README.md#contributing)
