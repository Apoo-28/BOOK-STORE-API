const asyncHandler = require("express-async-handler");
const { User } = require("../models/User");
const { validateChangePassword } = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

/**
 * @desc Get Forgot Password View
 * @route /password/forgot-password
 * @method GET
 * @access public
 */
module.exports.getForgotPasswordView = asyncHandler((req, res) => {
  res.render("forgot-password");
});

/**
 * @desc Send Forgot Password Link
 * @route /password/forgot-password
 * @method POST
 * @access public
 */
module.exports.SendForgotPasswordLink = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({ message: "user not found!" });
  }

  const secretKey = process.env.JWT_SECRET_KEY + user.password; /*
    user can reset it's password with this link just one time */
  const token = jwt.sign({ email: user.email, id: user._id }, secretKey, {
    expiresIn: "10m",
  });

  const link = `http://localhost:5000/password/reset-password/${user._id}/${token}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.USER_EMAIL,
      pass: process.env.USER_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: process.env.USER_EMAIL,
    to: user.email,
    subject: "Reset Password",
    html: `<div>
      <h4>Click on the link bellow to reset your password</h4>
      <a href="${link}">${link}</a>
    </div>`,
  };

  transporter.sendMail(mailOptions, function (error, success) {
    if (error) {
      console.log(error);
      res.status(500).json({ message: "Something went wrong!" });
    } else {
      console.log(`Email sent: ${success.response}`);
      res.render("link-sent");
    }
  });
});

/**
 * @desc Get Reset Password View
 * @route /password/reset-password/:userId/:token
 * @method GET
 * @access public
 */
module.exports.GetResetPasswordView = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(404).json({ message: "user not found!" });
  }

  const secretKey = process.env.JWT_SECRET_KEY + user.password;
  console.log(user.email);
  try {
    jwt.verify(req.params.token, secretKey);
    res.render("reset-password", {
      email: user.email,
    }); /* send data to view from controller */
  } catch (error) {
    console.log(error);
    res.json({ message: "error" });
  }
});

/**
 * @desc Reset Password
 * @route /password/reset-password/:userId/:token
 * @method POST
 * @access public
 */
module.exports.resetPassword = asyncHandler(async (req, res) => {
  const { error } = validateChangePassword(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(404).json({ message: "user not found!" });
  }

  const secretKey = process.env.JWT_SECRET_KEY + user.password;
  try {
    jwt.verify(req.params.token, secretKey);

    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);

    user.password = req.body.password;
    await user.save();

    res.render("success-password");
  } catch (error) {
    console.log(error);
    res.json({ message: "error" });
  }

  res
    .status(200)
    .json({ message: "Click on the link", resetPasswordLink: link });
});