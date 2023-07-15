const express = require("express");
const bcrypt = require("bcryptjs");
const app = express();
app.set("view engine", "ejs");
const PORT = 8080; // default port 8080
app.use(express.urlencoded({ extended: true }));
const {getUserByEmail, generateRandomString, urlsForUser} = require('./helpers.js');
const cookieSession = require('cookie-session');
const { redirect } = require("express/lib/response.js");
const {users, urlDatabase} = require('./database.js');
app.use(cookieSession({
  name: 'session',
  keys: ['user_id']
}));

app.get("/", (req, res) => {
  const templateVars = {user_id: req.session.user_id, users};
  const user = users[req.session.user_id];
  if (!req.session.user_id) { //check if user has a cookie
    res.redirect("login");
  }
  if (!user) { //Catches bypass
    res.send("Please <a href='/login'> login</a> before lookinga at URLs, if you don't have an account, please <a href='/register'> register</a> before accessing this site");
  }
  else if (user) { //Checks if user is logged in
    res.redirect("/urls");
  }
});

app.get("/register", (req, res) => {
  const templateVars = {user_id: req.session.user_id, users};
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("register", templateVars);
  }
});

app.get("/login", (req, res) => {
  const templateVars = {user_id: req.session.user_id, users};
  const user = users[req.session.user_id];
  if (!req.session.user_id) { //check if user has a cookie
    res.render("login", templateVars);
  }
  if (!user) { //Catches bypass
    res.send("Please <a href='/login'> login</a> before lookinga at URLs, if you don't have an account, please <a href='/register'> register</a> before accessing this site");
  }
  else if (user) { //Checks if user is logged in
    res.redirect("/urls");
  }
});

app.get("/urls/new", (req, res) => {
  const templateVars = {user_id: req.session.user_id, users};
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  if (!req.session.user_id) { // Check if user has a cookie
    res.redirect("/login");
  } else if (!user) { // Catch bypass
    res.send("Please <a href='/login'> login</a> before looking at URLs. If you don't have an account, please <a href='/register'>register</a> before accessing this site.");
  } else {
    const getUrlsForUser = urlsForUser(req.session.user_id, urlDatabase);
    const templateVars = { urls: getUrlsForUser, user_id: req.session.user_id, users };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) { //check if user has a cookie
    res.send("Error: User is not logged in and/or ID does not exist\n");
  }
  if (!urlDatabase[req.params.id]) {
    res.send("ID does not exist");
  }
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user_id: req.session.user_id, users };
  const user = users[req.session.user_id];
  const urlCheck = urlsForUser(req.session.user_id, urlDatabase);
  if (!user) { //Catches bypass
    res.send("Please <a href='/login'> login</a> before lookinga at URLs, if you don't have an account, please <a href='/register'> register</a> before accessing this site");
  }
  else if (!urlCheck[req.params.id]) { //Checks if user owns the URL
    res.send("Error: You do not own this URL.");
  } else {
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.send("ID does not exist");
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post("/urls", (req, res) => { //Creates a new shortURL for longURL
  if (!req.session.user_id) { //Checks for possible functionality bypass
    res.send("Please <a href='/login'> login</a> before accessing this site");

    return;
  }
  const id = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[id] = {longURL: longURL, userID: req.session.user_id};
  res.redirect(`/urls/${id}`);
});

app.post("/register", (req, res) => { //Creates an account with generated ID and hashed password
  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString();
  const user = getUserByEmail(req.body.email, users);
  if (password === "") {
    res.status(403).send("Please type a password <a href='/login'> Try again</a>");
  } 
  else if (email === "") {
    res.status(403).send("Please type an email <a href='/login'> Try again</a>");
  }
  else if (user !== undefined) {
      res.send("Email exists. Please <a href='/register'> Try again</a>");
  } else {
    req.session.user_id = id;
    let hashedPassword = bcrypt.hashSync(req.body.password,10);
    users[id] = {id: req.session.user_id, email: req.body.email, password: hashedPassword};
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users); //Will redirect to urls if already registered
  if (email === "") {
    res.status(403).send("Please type an email <a href='/login'> Try again</a>");
  }
  else if (password === "") {
    res.status(403).send("Please type a password <a href='/login'> Try again</a>");
  } 
  else if (bcrypt.compareSync(password, users.password) === false || user === undefined) {
    res.send("User not found. Please <a href='/login'> Try again</a>");
  } else {
    req.session.user_id = user.id; //Uses the already created ID
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session = null; //Clears cookies
  res.redirect("/login");
});

app.post("/urls/:id/delete", (req, res) => {
  let userID = req.session.user_id;
  const urlID = urlDatabase[req.params.id].userID;
  if (!req.session.user_id) { //Checks for bypass cases
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

app.post("/urls/:id", (req, res) => { //Edits the long URL
  let userID = req.session.user_id;
  const urlID = urlDatabase[req.params.id].userID;
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user_id: req.session.user_id, users };
  if (!req.session.user_id) { //check if user has a cookie
    res.send("Error: User is not logged in and/or ID does not exist\n");
  }
  else if (!user) { //Catches bypass
    res.send("Please <a href='/login'> login</a> before lookinga at URLs, if you don't have an account, please <a href='/register'> register</a> before accessing this site");
  }
  else if (!req.session.user_id) {
    res.send("Error: User is not logged in and/or ID does not exist\n");
    return;
  }
  else if (urlID !== userID) {
    res.send("Error: User does not own this URL\n");
    return;
  } else {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
}
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

