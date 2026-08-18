const {
  registerUser,
  loginUser,
} = require("../services/auth.service");


const register = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
    } = req.body;

    const user = await registerUser({
      firstName,
      lastName,
      email,
      password,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};


const login = async (req, res, next) => {
  try {
    const {
      email,
      password,
    } = req.body;

    const { user, token } = await loginUser({
      email,
      password,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  register,
  login,
};