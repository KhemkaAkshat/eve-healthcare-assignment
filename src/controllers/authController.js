const bcrypt = require("bcrypt");

const { User } = require("../models");
const {
  signupSchema,
  loginSchema,
} = require("../validations/authValidation");
const { generateToken } = require("../utils/jwt");

const signup = async (req, res) => {
  try {
    const validationResult = signupSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.issues,
      });
    }

    const { name, email, password } = validationResult.data;

    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = generateToken(user.id);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const login = async (req, res) => {
  try {
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.issues,
      });
    }

    const { email, password } = validationResult.data;

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user.id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  signup,
  login,
};