const express = require("express");
const router = express.Router();
const passport = require("passport");
const bcrypt = require("bcryptjs");
const connection = require("../config/database.js");

function isAuthenticated(req, res, next, err) {
  if (req.isAuthenticated()) {
    return next();
  }
  return next(err)
}

router.get('/register', (req, res) => {
  res.sendFile("register.html", { root: "views"})
});

router.get('/login', (req, res) => {
  res.sendFile("login.html", { root: "views"})
});

router.get('/protected', isAuthenticated, (req, res) => {
  res.sendFile("editor.html", { root: "views"})
});

router.post('/register', (req, res) => {
  const {
    username, password
  } = req.body;
  connection.query(
    'SELECT * FROM users WHERE username = ?',
    [username],
    (err, results) => {
      if (err) {
        console.error('Error querying the database: ' + err.stack);
        return res.status(500).send('An error occurred.');
      }

      if (results.length) {
        return res.status(409).send('Username already taken.');
      }

      const saltRounds = 10;
      bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) {
          console.error('Error hashing the password: ' + err.stack);
          return res.status(500).send('An error occurred.');
        }

        connection.query(
          'INSERT INTO users (username, password) VALUES (?, ?)',
          [username, hashedPassword],
          (err) => {
            res.status(200).json({message: "registration successful please login"})
            if (err) {
              console.error('Error inserting the user: ' + err.stack);
              return res.status(500).send('An error occurred.');
            }
          }
        );
      });
    }
  );
});

// Login route
router.post('/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/',
  })
);

// Logout route
router.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
  });
  res.send("successfully logout")
});


module.exports = router