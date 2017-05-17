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
  // req.flash('error', 'Something Happened');
  // req.flash('info', 'Something Happened');
  // req.flash('warning', 'Something Happened');
  // req.flash('success', 'Something Happened');
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
  const store = await (new Store(req.body)).save();

  console.log('It worked!');
  // create a flash using connect-flash middleware
  req.flash('success', `Successfully created ${store.name}.  Care to leave a review?`);
  // redirect to the home page
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  // 1. Query the database for the list of all stores.
  const stores = await Store.find();  // .find() returns a Promise
  // console.log(stores);
  res.render('stores', { title: 'Stores', stores });
};

exports.editStore = async (req, res) => {
  // 1. Find the store given the id
  const store = await Store.findOne({ _id: req.params.id });  // returns a Promise
  // res.json(store);
  // 2. Confirm they are the owner of the store
  // TODO
  // 3. Render out the edit form
  res.render('editStore', { title: `Edit ${store.name}`, store });
}

exports.updateStore = async (req, res) => {
  // 1. Find and update the store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the new store instead of the original
    runValidators: true,
  }).exec();
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store</a>`);

  // 2. Redirect user to the store and tell them it worked.
  res.redirect(`/stores/${store._id}/edit`);
}
