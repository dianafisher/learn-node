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

storeSchema.statics.getTopStores = function() {
  // aggregate is much like a query function
  return this.aggregate([
    // 1. Look up stores and populate their reviews
    { $lookup:
      {
        from: 'reviews',
        localField: '_id',
        foreignField: 'store',
        as: 'reviews'
      }
    },
    // 2. Filter for only items that have 2 or more reviews
    { $match:
      {
        'reviews.1': { $exists: true }
      }
    },
    // 3. Add the average reviews field
    { $project:
      {
        photo: '$$ROOT.photo',
        name: '$$ROOT.name',
        slug: '$$ROOT.slug',
        reviews: '$$ROOT.reviews',
        averageRating: { $avg: '$reviews.rating' }
      }
    },
    // 4. Sort by our new field, highest reviews first
    { $sort: { averageRating: -1 } },
    // 5. Limit to 10 records
    { $limit: 10 }
  ]);
};

// create a virtual field
// find reviews where the store's id is equal to the review's store id property.
storeSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'store'
});

// auto-populate the reviews every time a Store is queried
function autopopulate(next) {
  this.populate('reviews');
  next();
};

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);
