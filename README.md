# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Features
User registration: Users can create an account by providing an email and password. The password is securely hashed using bcrypt before storing it in the user database.

User authentication: Registered users can log in using their email and password. The application verifies the provided credentials against the stored hashed password.

URL shortening: Logged-in users can create shortened URLs for any long URL they want to share. The application generates a unique short URL and associates it with the user's account.

URL management: Users can view, edit, and delete their shortened URLs. They can also access the original long URL by clicking on the short URL.

## Final Product
!["Registration page"](/Images/Register.jpg)
!["Empty main url page"](/Images/Main%20URL.jpg)
!["Shortening a new URL"](/Images/Shorten%20new%20URL.jpg)
!["Display and edit URL"](/Images/Display%20and%20edit%20URL.jpg)
!["Display edit delete your URLs"](/Images/Display%20edit%20delete%20all%20URLs.jpg)
!["Using the short url"](/Images/Short%20URL.jpg)

## Dependencies

- Node.js
- Express
- EJS
- bcryptjs
- cookie-session

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.
- Register a new account
- Start shortening URLs
- Run them with http://localhost:8080/u/ + short url id e.g http://localhost:8080/u/wVTmuc

## Usage

1. Register a new account by clicking on the "Register" link on the homepage.
2. Provide a valid email and password to create your account.
3. Log in using your registered email and password.
4. Once logged in, you can create a new short URL by clicking on the "Create New URL" link.
5. Enter the original long URL and submit the form.
6. You will be redirected to the URLs page, where you can see the list of your shortened URLs.
7. Click on the short URL to visit the original long URL.
8. Edit or delete your URLs using the corresponding buttons on the URLs page.
9. Log out by clicking on the "Logout" button.