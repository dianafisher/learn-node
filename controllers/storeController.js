const mongoose = require('mongoose');
// mongoose uses a singleton for our models
const Store = mongoose.model('Store');  // we created this in Store.js

// exports.myMiddleware = (req, res, next) => {
//     req.name = 'Wes';
//     // if (req.name === 'Wes') {
//     //   throw Error('That is a stupid name');
//     // }
//     next(); // pass off to the next piece of middle ware
// }

exports.homePage = (req, res) => {
  console.log(req.name);
  res.render('index');
}

exports.addStore = (req, res) => {
  // render our template
  res.render('editStore', { title: '🐩 Add Store' });
};

// // save to the database using async/await
// exports.createStore = async (req, res) => {
//   try {
//     const store = new Store(req.body);
//     // does not move on until the save actually happens
//     await store.save();
//     console.log('It worked!');
//   } catch(err) {
//     console.error(err);
//   }
// };

// don't need try/catch here since this function is wrapped in an errorHandlers function
exports.createStore = async (req, res) => {
  const store = new Store(req.body);
  await store.save();
  console.log('It worked!');
  // redirect to the home page
  res.redirect('/');
};
