const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;
const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const bcrypt = require("bcryptjs");
const User = require("../models/User.js");
const isAuth = require("../middlewares/auth.js");

router.post("/register", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.json({ isReg: false, message: "fill the inputs" });
        return;
    }
    try {
        const saltRounds = 10;
        const id = uuid.v1();
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = await User.findOne({ where: { email } });
        if(user) {
           res.status(500).json({ isReg: false, message: "Registration failed" });
           return
        }
        await User.create({
            user_id: id,
            email,
            password: hashedPassword,
        });
        await fs.mkdir(`./users/${id}`);
        res.json({ isReg: true, message: "User registered successfully" });
    } catch (e) {
        console.error("Error registering user:", e);
        res.status(500).json({ isReg: false, message: "Registration failed" });
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.json({ isLoggedIn: false, message: "fill the inputs" });
        return;
    }
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            res.status(401).json({
                isLoggedIn: false,
                message: "Authentication failed"
            });
        } else {
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
                const token = jwt.sign(
                    { id: user.user_id },
                    process.env.JWT_SECRET
                );
                res.cookie("token", token, { httpOnly: true, secure: true, expiresIn: "1d" });
                res.status(200).json({
                    isLoggedIn: true,
                    message: "Login successful",
                    username: user.email.split("@")[0],
                    userId: user.user_id
                });
            }else {
              res.status(401).json({
                isLoggedIn: false,
                message: "Authentication failed"
            });
            }
        }
    } catch (e) {
        res.status(401).json({
            isLoggedIn: false,
            message: "Authentication failed"
        });
    }
});

router.get("/login", (req, res) => {
    res.sendFile("login.html", { root: path.join(__dirname, "../public") });
});

router.get("/register", (req, res) => {
    res.sendFile("register.html", { root: path.join(__dirname, "../public") });
});

router.post("/logout", isAuth, (req, res) => {
    res.clearCookie("token");
    res.json({ success: true, message: "Logout successful" });
});

module.exports = router;
