const uuid = require("uuid").v4;
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-erros");
const User = require("../models/user");

const DUMMY_USERS = [
  {
    id: "u1",
    name: "Max Schwarz",
    email: "test@test.com",
    password: "testers",
  },
];

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password"); // to exclude password field
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed, please try again later.",
      500
    );
    return next(error); // to stop execution here
  }
  // if (!users || users.length === 0) {
  //   return next(new HttpError("Could not find users.", 404));
  // }

  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const { name, email, password } = req.body;

  const hasUser = DUMMY_USERS.find((u) => u.email === email);
  if (hasUser) {
    throw new HttpError("Could not create user, email already exists.", 422);
  }
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error); // to stop execution here
  }

  if (existingUser) {
    const error = new HttpError(
      "Could not create user, email already exists.",
      422
    );
    return next(error); // to stop execution here
  }

  const createdUser = new User({
    name,
    email,
    image: "https://i.pravatar.cc/150?img=7",
    password,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error); // to stop execution here
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error); // to stop execution here
  }
  if (!existingUser || existingUser.password !== password) {
    // TODO: Add validation for hashed password
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error); // to stop execution here
  }

  res.json({
    message: "Logged in!",
    user: existingUser.toObject({ getters: true }),
  });
};
exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
