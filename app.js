const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const fs = require("fs");
const https = require("https");
const path = require("path");
const dotenv = require("dotenv");
const crypto = require("crypto");
const userRoutes = require("./routes/userRoutes.js");
const editorRoutes = require("./routes/editorRoutes.js");
const isAuth = require("./middlewares/auth.js");
const db = require("./config/database.js");
dotenv.config();

//Middlewares
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(morgan("dev", {}));
app.use(
  helmet(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
      },
    })
  )
);
app.use("/preview/:pro_name", isAuth, (req, res, next) => {
  const { pro_name } = req.params;
  express.static(path.join("users", req.user.id, pro_name))(req, res, next);
});
app.use(userRoutes)
app.use(editorRoutes)
app.get("*", (req, res, next) => {
  res.status(404).sendFile("404.html", {root: "./views"});
});

const port = process.env.PORT || 3000;
const httpsOptions = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
    passphrase: "myssl"
};

const server = https.createServer(httpsOptions, app);
db.sync()
  .then(() => {
    console.log('Database synced');
    server.listen("https://codeditor-ck1x.vercel.app", port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });