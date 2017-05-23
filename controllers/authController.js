const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out! 👋');
  res.redirect('/');
}

exports.isLoggedIn = (req, res, next) => {
  // first, check if the user is authenticated
  if(req.isAuthenticated()) {
    next();  // carry on!
    return;
  }
  req.flash('error', 'Oops!  You must be logged in to do that!');
  res.redirect('/login');
}

exports.forgot = async (req, res) => {
  // 1. See if the user exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash('error', 'No account with that email exits.');  // alternatively, state that a reset email has been sent.
    return res.redirect('/login');
  }

  // 2. Set reset tokens and expiry on their account.
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpries = Date.now() + 3600000; // one hour from now
  await user.save();

  // 3. Send the user an email with the token.
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  req.flash('success', `You have been emailed a password reset link. ${resetURL}`);

  // 4. Redirect to the login page.
  res.redirect('/login');
}

exports.reset = async (req, res) => {
  // look for a user with a token with an expiration greater than right now.
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpries: { $gt: Date.now() }
  });
  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }
  // console.log(user);
  // show the reset password form
  res.render('reset', { title: 'Reset your password' });
}

// check if passwords match
exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    // keep it going to the next middleware
    next();
    return;
  }
  req.flash('error', 'Passwords do not match!');
  res.redirect('back');
};

// update the password if the reset token has not expired
exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpries: { $gt: Date.now() }
  });
  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }

  // update the password
  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  // clear the reset password token and expiry
  user.resetPasswordToken = undefined;
  user.resetPasswordExpries = undefined;
  const updatedUser = await user.save();

  // automatically log the user in
  await req.login(updatedUser);

  // tell the user it worked!
  req.flash('success', '💃 Nice!  Your password has been reset!  You are now logged in.');
  res.redirect('/');
};
