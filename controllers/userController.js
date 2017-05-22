const mongoose = require('mongoose');

exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login' });
};

exports.registerForm = (req, res) => {
  res.render('register', { title: 'Register' });
};

// create a middleware to handle validation
exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('name');  // sanitizeBody is from express-validator
  req.checkBody('name', 'You must supply a name!').notEmpty();
  req.checkBody('email', 'Invalid email!').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  });
  // check that the password is not blank
  req.checkBody('password', 'Password cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'Confirmed Password cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'Oops!  Your password to not match').equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    // handle the error
    req.flash('error', errors.map(err => err.msg));
    // re-render the form
    res.render('register', {
      title: 'Register',
      body: req.body,
      flashes: req.flash()
    })
    return;
  }
  next();  // no errors.
};
