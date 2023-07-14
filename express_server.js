const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['user_id','registeredID']
}));

function generateRandomString(length = 6) {
  const alphanumeric = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * alphanumeric.length);
    randomString += alphanumeric.charAt(randomIndex);
  }
  return randomString;
}

const users = {
};

function userLookup(emailAddress) {
  for (let userID in users) {
    if (users[userID].email ===  emailAddress) {
      return users[userID];
    }
  }
  return null;
}

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};



function urlsForUser(id) {
  const urls = {};
  for (let IDs in urlDatabase) {
    if (urlDatabase[IDs].userID === id) {
      urls[IDs] = urlDatabase[IDs];
    }
  }
  return urls;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("register");
  }
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("login");
  }
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    const templateVars = {user_id: req.session.user_id, users};
    res.render("urls_new", templateVars);
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  if (!req.session.user_id) { //Checks if user is logged in
    res.send("Please log in at <a>http://localhost:8080/login</a> before lookinga at URLs, if you don't have an account, register at <a>http://localhost:8080/register</a>");
  }
  const getUrlsForUser = urlsForUser(req.session.user_id);
  const templateVars = { urls: getUrlsForUser, user_id: req.session.user_id, users};
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user_id: req.session.user_id, users };
  if (!urlDatabase[req.params.id]) {
    res.send("ID does not exist");
    return;
  } else {
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post("/urls", (req, res) => { //Creates a new shortURL for longURL
  if (!req.session.user_id) { //Checks for possible functionality bypass
    res.send("Please log in before creating short URLs");
    return;
  }
  const id = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[id] = {longURL: longURL, userID: req.session.user_id};
  res.redirect(`/urls/${id}`);
});

app.post("/register", (req, res) => { //Creates an account with generated ID and hashed password
  const id = generateRandomString();
  const registered = userLookup(req.body.email);
  if (req.body.email === "" || req.body.password === "" || registered !== null) {
    res.status(400).send('Bad Request');
  } else {
    req.session.user_id = id;
    let hashedPassword = bcrypt.hashSync(req.body.password,10);
    users[id] = {id: req.session.user_id, email: req.body.email, password: hashedPassword};
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  const registered = userLookup(req.body.email); //Will redirect to urls if already registered

  if (req.body.email === "" || req.body.password === "" || registered === null || bcrypt.compareSync(req.body.password, registered.password) === false) {
    res.status(403).send('Bad Request');
  } else {
    req.session.user_id = registered.id; //Uses the already created ID
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

app.post("/urls/:id", (req, res) => { //Edits the URL
  let userID = req.session.user_id;
  const urlID = urlDatabase[req.params.id].userID;
  if (!req.session.user_id) {
    res.send("Error: User is not logged in and/or ID does not exist\n");
    return;
  }
  if (urlID !== userID) {
    res.send("Error: User does not own this URL\n");
    return;
  }
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});