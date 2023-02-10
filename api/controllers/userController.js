const { Promise } = require("mongoose");
const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/user");
const ApiFeatures = require("../utils/apiFeatures");
const appError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const multerStorage = multer.memoryStorage();

const multerFilters = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new appError("Only images are allowed", 400));
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilters });

exports.uploadPhotos = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

exports.resizePhotos = catchAsync(async (req, res, next) => {
  if (!req.files.photo || !req.files.images) return next();
  // console.log(req.files);
  req.body.photo = `user-${req.user.id}-${Date.now()}.jpg`;
  await sharp(req.files.photo[0].buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/${req.body.photo}`);

  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (image, index) => {
      req.body.images.push(
        `user-${req.user.id}-${Date.now()}-${index + 1}.jpg`
      );
      await sharp(image.buffer)
        .resize(500, 500)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.body.images[index]}`);
    })
  );
  // console.log(req.body.images);
  next();
});
// exports.uploadUserPhoto = upload.single("photo");

// exports.resizeUserPhoto = (req, res, next) => {
//   if (!req.file) next();
//   req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
//   sharp(req.file.buffer)
//     .resize(500, 500)
//     .toFormat("jpg")
//     .jpeg({ quality: 90 })
//     .toFile(`public/img/users/${req.file.filename}`);
//   next();
// };
exports.getAllUsers = catchAsync(async (req, res, next) => {
  let features = new ApiFeatures(User.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();
  //   const users = await User.find().skip(2).limit(2);
  const users = await features.query;
  res.status(200).json({
    status: "success",
    data: {
      users,
    },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id).populate("tasks");
  if (!user) {
    return next(new appError("User does not exist", 404));
  }
  console.log(user);
  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

const filteredObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  const { id } = req.user;
  // const { name } = req.body;
  const filteredBody = filteredObj(req.body, "name", "age");
  if (req.files) {
    filteredBody.photo = req.body.photo;
    filteredBody.images = req.body.images;
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  if (!updatedUser) {
    return next(new appError("User does not exist", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    return next(new appError("This User does not exist", 404));
  }
  res.status(204).json({
    status: "success",
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  const { id } = req.user;
  const { password } = req.body;
  if (!password) {
    return next(
      new appError(
        "Please enter your password to confirm account deletion",
        403
      )
    );
  }

  const user = await User.findById(id).select("+password");

  if (!user) {
    return next(new appError("This user does not exist", 404));
  }

  if (!(await user.correctPassword(password, user.password))) {
    return next(new appError("Incorrect password", 403));
  }

  user.isActive = false;
  await user.save({ validateBeforeSave: false });
  res.status(204).json({
    status: "success",
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  const { _id } = req.user;
  const me = await User.findById(_id);
  if (!me) {
    return next(new appError("User does not exist", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      user: me,
    },
  });
});
