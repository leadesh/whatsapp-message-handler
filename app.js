require("dotenv").config();
const express = require("express");
const mongoConnection = require("./db/dbConnect");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const User = require("./models/user");
const path = require("path");
const { signAccessToken, verifyAccessToken } = require("./helper/jwt_helper");
const {
  createSignUpValidation,
  createSignInValidation,
} = require("./validation/user.validity");
const MyError = require("./config/error");

const app = express();

mongoConnection();
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use("/api/qr", express.static("qr"));
app.use(express.json());
app.use(express.static(path.join(__dirname, "client", "dist")));

const port = process.env.PORT || 3000;

app.post("/api/signup", async (req, res, next) => {
  try {
    await createSignUpValidation.validateAsync(req.body);
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, email });
    await newUser.save();
    const token = await signAccessToken(newUser.id);
    const maxAgeInSeconds = 10 * 24 * 60 * 60;
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: maxAgeInSeconds,
    });
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
});

app.get("/api/getMe", verifyAccessToken, async (req, res, next) => {
  try {
    const data = req.data;
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

app.post("/api/signin", async (req, res, next) => {
  try {
    await createSignInValidation.validateAsync(req.body);
    const { email, password } = req.body;
    console.log(email, password);
    const validUser = await User.checkUser(email, password);

    if (!validUser) throw new MyError("Invalid email or password");
    const token = await signAccessToken(validUser.id);
    const maxAgeInSeconds = 10 * 24 * 60 * 60;
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: maxAgeInSeconds,
    });

    res.status(200).json(validUser);
  } catch (error) {
    next(error);
  }
});

app.get("/api/getQR", verifyAccessToken, (req, res, next) => {
  try {
    res.status(200).sendFile(path.join(__dirname, "out.png"));
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    status: err.status || 500,
    message: err.message || "Internal Server error",
  });
});

app.listen(port, () => {
  console.log("listening on port 3000");
});
