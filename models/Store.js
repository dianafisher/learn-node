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
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates!'
    }],
    address: {
      type: String,
      required: 'You must supply an address!'
    },
  },
  photo: String
});

storeSchema.pre('save', async function(next) {
  // this refers to the store we are trying to save
  if (!this.isModified('name')) {
    next();
    return;
  }
  // set the slug
  this.slug = slug(this.name);
  // find other stores which have this slug or slug-1, slug-2, ....
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  // if there are any matches...
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  // continue on..
  next();
});

module.exports = mongoose.model('Store', storeSchema);
