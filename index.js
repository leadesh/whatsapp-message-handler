require("dotenv").config();
const express = require("express");
const mongoConnection = require("./db/dbConnect");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const venom = require("venom-bot");
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

async function start(client, id) {
  const userInfo = await client.getHostDevice();
  const user = await User.findById(id);
  user.phoneNumber = userInfo.id.user;
  await user.save();
  console.log(userInfo);

  app.get("/api", verifyAccessToken, async (req, res, next) => {
    try {
      const chats = await client.getAllChats();
      const groups = chats.filter((chat) => chat.isGroup === true);
      const messages = await Promise.all(
        groups.map(async (chat) => {
          const groupMsgs = await client.getAllMessagesInChat(
            chat.id._serialized
          );
          return {
            [chat.contact.name]: groupMsgs,
          };
        })
      );
      res.status(200).json(messages);
    } catch (error) {
      next(error);
    }
  });
}

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

app.get("/api/createSession", verifyAccessToken, async (req, res, next) => {
  const id = req.userId;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  venom
    .create(
      `${id}`,
      (base64Qr, asciiQR, attempts, urlCode) => {
        console.log(asciiQR);
        var matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
          response = {};
        if (matches.length !== 3) {
          return new Error("Invalid input string");
        }
        response.type = matches[1];
        response.data = new Buffer.from(matches[2], "base64");

        var imageBuffer = response;
        require("fs").writeFile(
          path.join(__dirname, "qr", "out.png"),
          imageBuffer["data"],
          "binary",
          function (err) {
            if (err != null) {
              console.log(err);
            }
          }
        );
        res.write("data: Scan QR\n\n");
      },
      (statusSession, session) => {
        console.log("Status Session: ", statusSession);
        if (statusSession === "successChat") {
          res.write("data: Login success\n\n");
          res.end();
        }
        console.log("Session name: ", session);
      },
      { logQR: false }
    )
    .then((client) => {
      start(client, id);
    })
    .catch((erro) => {
      console.log(erro);
    });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
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
