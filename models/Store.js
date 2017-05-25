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
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author.'
  },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Define our indexes
storeSchema.index({
  name: 'text',
  description: 'text'
});

storeSchema.index({
  location: '2dsphere'
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

// add a method to the storeSchema
// uses mongodb aggregate operators, $unwind, $group, and $sort
// https://docs.mongodb.com/manual/reference/operator/aggregation/
storeSchema.statics.getTagsList = function() {
  // 'this' is our model
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } }},
    { $sort: { count: -1 }}
  ]);
};

// create a virtual field
// find reviews where the store's id is equal to the review's store id property.
storeSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'store'
});

module.exports = mongoose.model('Store', storeSchema);
