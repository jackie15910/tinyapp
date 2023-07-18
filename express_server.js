const express = require("express");
const bcrypt = require("bcryptjs");
const app = express();
app.set("view engine", "ejs");
const PORT = 8080; // default port 8080

// Middleware
app.use(express.urlencoded({ extended: true }));
const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers.js');
const cookieSession = require('cookie-session');
const { redirect } = require("express/lib/response.js");
const { users, urlDatabase } = require('./database.js');
app.use(cookieSession({
  name: 'session',
  keys: ['user_id']
}));

// Home page
app.get("/", (req, res) => {
  const templateVars = { user_id: req.session.user_id, users };
  const user = users[req.session.user_id];
  if (!req.session.user_id) { // Check if user has a cookie
    res.redirect("login");
  }
  if (!user) { // Catches bypass
    res.send("Please <a href='/login'> login</a> before looking at URLs, if you don't have an account, please <a href='/register'> register</a> before accessing this site");
  } else if (user) { // Checks if user is logged in
    res.redirect("/urls");
  }
});

// Registration page
app.get("/register", (req, res) => {
  const templateVars = { user_id: req.session.user_id, users };
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("register", templateVars);
  }
});

// Login page
app.get("/login", (req, res) => {
  const templateVars = { user_id: req.session.user_id, users };
  const user = users[req.session.user_id];
  if (!req.session.user_id) { // Check if user has a cookie
    res.render("login", templateVars);
    return;
  }
  if (!user) { // Catches bypass
    res.send("Please <a href='/login'> login</a> before looking at URLs, if you don't have an account, please <a href='/register'> register</a> before accessing this site");
    return;
  }
  res.redirect("/urls");
});

// New URL creation page
app.get("/urls/new", (req, res) => {
  const templateVars = { user_id: req.session.user_id, users };
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

// JSON representation of the URL database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// URLs index page
app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  if (!req.session.user_id) { // Check if user has a cookie
    res.redirect("/login");
  } else if (!user) { // Catches bypass
    res.send("Please <a href='/login'> login</a> before looking at URLs. If you don't have an account, please <a href='/register'> register</a> before accessing this site.");
  } else {
    const getUrlsForUser = urlsForUser(req.session.user_id, urlDatabase);
    const templateVars = { urls: getUrlsForUser, user_id: req.session.user_id, users };
    res.render("urls_index", templateVars);
  }
});

// Single URL page
app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) { // Check if user has a cookie
    res.send("Error: User is not logged in and/or ID does not exist\n");
  }
  if (!urlDatabase[req.params.id]) {
    res.send("ID does not exist");
  }
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user_id: req.session.user_id, users };
  const user = users[req.session.user_id];
  const urlCheck = urlsForUser(req.session.user_id, urlDatabase);
  if (!user) { // Catches bypass
    res.send("Please <a href='/login'> login</a> before looking at URLs, if you don't have an account, please <a href='/register'> register</a> before accessing this site");
  } else if (!urlCheck[req.params.id]) { // Checks if user owns the URL
    res.send("Error: You do not own this URL.");
  } else {
    res.render("urls_show", templateVars);
  }
});

// Redirect to the long URL
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.send("ID does not exist");
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

// Hello World route for testing purposes
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Create a new short URL for a long URL
app.post("/urls", (req, res) => {
  if (!req.session.user_id) { // Checks for possible functionality bypass
    res.send("Please <a href='/login'> login</a> before accessing this site");
    return;
  }
  const id = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[id] = { longURL: longURL, userID: req.session.user_id };
  res.redirect(`/urls/${id}`);
});

// Register a new user
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString();
  const user = getUserByEmail(req.body.email, users);
  if (!email || !password) {
    res.status(403).send("Please provide both email and password <a href='/login'> Try again</a>");
    return;
  } else if (user !== undefined) {
    res.send("Email exists. Please <a href='/register'> Try again</a>");
  } else {
    req.session.user_id = id;
    let hashedPassword = bcrypt.hashSync(req.body.password, 10);
    users[id] = { id: req.session.user_id, email: req.body.email, password: hashedPassword };
    res.redirect("/urls");
  }
});

// User login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users); // Will redirect to URLs if already registered
  if (!email || !password) {
    res.status(403).send("Please provide both email and password <a href='/login'> Try again</a>");
    return;
  } else if (!user || !bcrypt.compareSync(password, user.password)) {
    res.send("Invalid email or password, user not found. Please <a href='/login'> Try again</a>");
  } else {
    req.session.user_id = user.id; // Uses the already created ID
    res.redirect("/urls");
  }
});

// User logout
app.post("/logout", (req, res) => {
  req.session = null; // Clears cookies
  res.redirect("/login");
  return;
});

// Delete a URL
app.post("/urls/:id/delete", (req, res) => {
  let userID = req.session.user_id;
  const urlID = urlDatabase[req.params.id].userID;
  if (!req.session.user_id) { // Checks for bypass cases
    res.send("Error: User is not logged in and/or ID does not exist\n");
    return;
  }
  if (urlID !== userID) {
    res.send("Error: User does not own this URL\n");
    return;
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// Edit the long URL for a given short URL
app.post("/urls/:id", (req, res) => {
  let userID = req.session.user_id;
  const user = users[req.session.user_id];
  const urlID = urlDatabase[req.params.id].userID;
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user_id: req.session.user_id, users };
  if (!req.session.user_id) { // Check if user has a cookie
    res.send("Error: User is not logged in and/or ID does not exist\n");
  } else if (!user) { // Catches bypass
    res.send("Please <a href='/login'> login</a> before looking at URLs, if you don't have an account, please <a href='/register'> register</a> before accessing this site");
  } else if (urlID !== userID) {
    res.send("Error: User does not own this URL\n");
    return;
  } else {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});