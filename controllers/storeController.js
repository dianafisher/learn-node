const mongoose = require('mongoose');
const multer = require('multer'); // for file uploads
// mongoose uses a singleton for our models
const Store = mongoose.model('Store');  // we created this in Store.js
const User = mongoose.model('User');
const jimp = require('jimp');  // for image resizing
const uuid = require('uuid');  // provides unique identifier for each file

// keep the uploaded files in memory rather than saving them to disk
const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter: function(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That file type is not allowed!' }, false);
    }
  }
};

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

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // check if there are any files to resize
  if (!req.file) {
    next(); // skip to the next middleware
    return;
  }
  console.log(req.file);
  const extension = req.file.mimetype.split('/')[1];
  // get a unique filename
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now we reize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  // write the file
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once we have written the photo to our filesystem, keep going!
  next();
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
  // get the user id
  req.body.author = req.user._id;

  const store = await (new Store(req.body)).save();

  // create a flash using connect-flash middleware
  req.flash('success', `Successfully created ${store.name}.  Care to leave a review?`);
  // redirect to the home page
  res.redirect(`/store/${store.slug}`);
};

// get stores with pagination
exports.getStores = async (req, res) => {
  // 1. Query the database for the list of all stores.
  // const stores = await Store.find();  // .find() returns a Promise
  const page = req.params.page || 1;
  const limit = 4; // return 4 stores per page
  const skip = (page * limit) - limit;
  // page 1 => 1*4 - 4 = 4-4 = 0
  // page 2 => 2*4 - 4 = 8-4 = 4
  const storesPromise = Store
    .find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });
  // console.log(stores);

  // count the number of store records in the database
  const countPromise = Store.count();

  // wait for both promises to return
  const [stores, count] = await Promise.all([storesPromise, countPromise]);

  // calculate the number of pages we have
  const pages = Math.ceil(count / limit);
  if (!stores.length && skip) {
    // redirect to the last page
    req.flash('info', `Hey!  You asked for page ${page}. But that doesn't exist, so I put you on page ${pages}`);
    res.redirect(`/stores/page/${pages}`);
    return;
  }
  res.render('stores', { title: 'Stores', stores, page, pages, count });
};

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You must own a store in order to edit it.');
  }
};

exports.editStore = async (req, res) => {
  // 1. Find the store given the id
  const store = await Store.findOne({ _id: req.params.id });  // returns a Promise
  // res.json(store);
  // 2. Confirm they are the owner of the store
  confirmOwner(store, req.user);
  // 3. Render out the edit form
  res.render('editStore', { title: `Edit ${store.name}`, store });
}

exports.updateStore = async (req, res) => {
  // set the location data to be a point
  req.body.location.type = 'Point';
  // 1. Find and update the store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the new store instead of the original
    runValidators: true,
  }).exec();
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store</a>`);

  // 2. Redirect user to the store and tell them it worked.
  res.redirect(`/stores/${store._id}/edit`);
};

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug }).populate('author reviews');
  if (!store) {
    return next();
  }
  res.render('store', { store: store, title: store.name });
};

exports.getStoresByTag = async (req, res) => {
  // const tags = await Store.getTagsList();
  // res.json(tags);
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true };
  const tagsPromise = Store.getTagsList();

  const storesPromise = Store.find({ tags: tagQuery });
  // wait for both promises to come back
  const result = await Promise.all([tagsPromise, storesPromise]);
  // destructure the result immediately
  const [tags, stores] = result;
  // res.json(stores);
  res.render('tag', { tags: tags, title: 'Tags', tag, stores });
};

exports.searchStores = async (req, res) => {
  // res.json(req.query);
  const stores = await Store
  // find stores that match
  .find({
    $text: {
      $search: req.query.q
    }
  }, {
    score: {
      $meta: 'textScore'
    }
  })
  // then sort them by how well they match the query
  .sort({
    score: { $meta: 'textScore' }
  })
  // limit to 5 results
  .limit(5);

  res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  // res.json(coordinates);
  const q = {
    location: {
      $near: {
          $geometry: {
            type: 'Point',
            coordinates: coordinates
          },
          $maxDistance: 10000  // 10km
      }
    }
  };

  // const stores = await Store.find(q).select('-author -tags');
  const stores = await Store.find(q).select('slug name description location photo').limit(10);
  res.json(stores);
};

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};

// toggles heart
exports.heartStore = async (req, res) => {

  const hearts = req.user.hearts.map(obj => {
    return obj.toString();
  });

  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';

  const user = await User
    .findByIdAndUpdate(req.user._id,
      { [operator]: { hearts: req.params.id }},
      { new: true }
    )
  res.json(user);
};

// get hearts
exports.getHearts = async (req, res) => {
  const stores = await Store.find({
    _id: { $in: req.user.hearts }
  });
  // res.json(stores);
  res.render('stores', { title: 'Hearted Stores', stores });
};

// get top 10 stores
exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores();
  res.render('topStores', { stores, title: '☆ Top Stores!' });
  // res.json(stores)
};
