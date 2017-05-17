const mongoose = require('mongoose');
// use the built in ES6 promise
mongoose.Promise = global.Promise;

const slug = require('slugs');  // helps us make url friendly names

// create a schema to describe what our data looks like
// this is a strict schema
const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name!'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String]
});

storeSchema.pre('save', function(next) {
  // this refers to the store we are trying to save
  if (!this.isModified('name')) {
    next();
    return;
  }
  // set the slug
  this.slug = slug(this.name);
  next();
});

module.exports = mongoose.model('Store', storeSchema);
