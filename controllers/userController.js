const mongoose = require('mongoose');
const promisify = require('es6-promisify');
const User = mongoose.model('User');

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

// middleware to handle user registration
exports.register = async (req, res, next) => {
  // create a new user
  const user = new User({ email: req.body.email, name: req.body.name});
  // the register method does not return a Promise, so we use promisify
  // User.register(user, req.body.password, function(err, user) {
  //
  // });
  // bind to the User object
  const registerWithPromise = promisify(User.register, User);
  await registerWithPromise(user, req.body.password);  // stores password as a hash in the db.
  next();  // pass to authcontroller
};

exports.account = (req, res) => {
  res.render('account', { title: 'Edit Your Accout' })
}

exports.updateAccount = async (req, res) => {
  const updates = {
      name: req.body.name,
      email: req.body.email
  };

  const user = await User.findOneAndUpdate(
    { _id: req.user._id },
    { $set: updates },
    { new: true, runValidators: true, context: 'query' }
  );

  req.flash('success', 'Updated profile successfully!');
  res.redirect('back');  // redirect to the url they came from
};
