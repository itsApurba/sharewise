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

Sure, here is the completed Installation section for your GitHub README file:

## Installation

To install this project, you will need the following:

* Node.js (npm)
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

Sure, here is the completed Usage section for your GitHub README file:

## Usage

To check this project, you don't need to create an account. You can start creating and updating user profiles and posts. You can also "like" and "unlike" posts. The analytics pages will display insights on user engagement and content popularity.

## Todos

- [x]  Add Dark mode.
- [ ]  Use Zustand to manage the state.
- [ ]  Use some hooks.
- [ ]  Add and optimize the routes.
- [ ]  Fix the network cache.
- [ ]  Fix the UserForm and PostForm UI and Implemnt the routing or models.
- [ ]  Write the testcases.
- [ ]  Reduce the layout shifts and renderings.
- [ ]  Add more toast notification.
- [ ]  UIUX

## Contributing

* [Contributing](https://github.com/itsApurba/sharewise/blob/master/README.md#contributing)
