const bcrypt = require("bcryptjs");

const { User } = require("../../models");
const { generateToken } = require("../utils/jwt");

const registerUser = async ({
  firstName,
  lastName,
  email,
  password,
}) => {
  const existingUser = await User.findOne({
    where: {
      email,
    },
  });

  if (existingUser) {
    const error = new Error("User with this email already exists");
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
  });

  return user;
};


const loginUser = async ({ email, password }) => {
  const user = await User.findOne({
    where: {
      email,
    },
  });

  if (!user) {
    const error = new Error("Invalid email ");
    error.status = 401;
    throw error;
  }

  const passwordMatch = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatch) {
    const error = new Error("Invalid  password");
    error.status = 401;
    throw error;
  }

  const token = generateToken(user);

  return {
    user,
    token,
  };
};


module.exports = {
  registerUser,
  loginUser,
};