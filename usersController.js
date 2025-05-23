const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const { User, validateUpdateUser } = require("../models/User");

/**
 * @desc Get All Users
 * @route /api/users
 * @method GET
 * @access private (only admin)
 */
module.exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  return res.status(200).json(users);
});

/**
 * @desc Get user by id
 * @route /api/users/:id
 * @method GET
 * @access private (only admin & user himself)
 */
module.exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (user) {
    return res.status(200).json(user);
  } else {
    return res.status(404).json({ message: "User not found!" });
  }
});

/**
 * @desc Update User
 * @route /api/users/:id
 * @method PUT
 * @access private (only admin & user himself)
 */
module.exports.updateUser = asyncHandler(async (req, res) => {
  if (req.user.id !== req.params.id) {
    return res
      .status(403) // forbidden
      .json({
        message: "You are not allowed! you only can update your profile.",
      });
  }

  const { error } = validateUpdateUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        username: req.body.username,
        password: req.body.password,
      },
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(updatedUser);
});

/**
 * @desc Delete user
 * @route /api/users/:id
 * @method DELETE
 * @access private (only admin & user himself)
 */
module.exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (user) {
    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "User has been deleted!" });
  } else {
    return res.status(404).json({ message: "User not found!" });
  }
});