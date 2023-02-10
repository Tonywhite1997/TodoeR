const express = require("express");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");

const router = express.Router();

router.post("/signup", authController.signUp);
router.post("/login", authController.login);
router.get("/profile", authController.checkIfLoggedIn);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:resetToken", authController.resetPassword);

//User must log in to access the routes below

router.use(authController.protect);

router.patch("/updatePassword", authController.updatePassword);
router.patch("/deleteMe", userController.deleteMe);
router.patch(
  "/updateMe",
  userController.uploadPhotos,
  userController.resizePhotos,
  userController.updateMe
);
router.get("/getMe", userController.getMe);
router.get("/logout", authController.logout);

router
  .route("/")
  .get(authController.restrictTo("admin"), userController.getAllUsers);

router
  .route("/:id")
  .get(userController.getUser)
  .delete(authController.restrictTo("admin"), userController.deleteUser);

module.exports = router;
