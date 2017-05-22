const express = require('express');
const router = express.Router();
// import our controller
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { catchErrors } = require('../handlers/errorHandlers');  // object destructuring

// here we are using route-specific middleware
// router.get('/', storeController.myMiddleware, storeController.homePage);

router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/add', storeController.addStore);
router.post('/add',
  storeController.upload,
  catchErrors(storeController.resize), // composition (wrapping a function in another function)
  catchErrors(storeController.createStore)
);
router.post('/add/:id',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore)
);
router.get('/stores/:id/edit', catchErrors(storeController.editStore));

router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

// router.get('/', (req, res) => {
//   const wes = { name: 'Wes', age: 100, cool: true };
//   // res.send('Hey! It works!');
//   // res.json(wes);
//
//   // get the data from the query string
//   // res.send(req.query.name);
//   // res.send(req.query);
//
//   // render out a template
//   res.render('hello', {
//     name: 'wes',
//     dog: req.query.dog,
//     title: 'I love food'
//   });
// });

// make a new endpoint to take in a name and reverse it
router.get('/reverse/:name', (req, res) => {
  // res.send('it works!');
  // res.send(req.params.name);
  const reverse = [...req.params.name].reverse().join('');
  res.send(reverse);
});

router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

router.get('/login', userController.loginForm);

router.get('/register', userController.registerForm);
// 1. validate registration data
// 2. register the user
// 3. log the user in
router.post('/register',
  userController.validateRegister,
  userController.register,
  authController.login
);

module.exports = router;
