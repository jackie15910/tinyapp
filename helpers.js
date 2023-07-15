

getUserByEmail = (emailAddress, database) => {
  for (let id in database) {
    if (database[id].email ===  emailAddress) {
      return database[id];
    }
  }
}

generateRandomString = (length = 6) => {
  const alphanumeric = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * alphanumeric.length);
    randomString += alphanumeric.charAt(randomIndex);
  }
  return randomString;
}

urlsForUser = (id, database) => {
  const urls = {};
  for (let IDs in database) {
    if (database[IDs].userID === id) {
      urls[IDs] = database[IDs];
    }
  }
  return urls;
}

module.exports = {getUserByEmail, generateRandomString, urlsForUser};