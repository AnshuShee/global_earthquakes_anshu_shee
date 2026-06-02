const mongoose = require('mongoose');

const EarthquakeSchema = new mongoose.Schema(
  {
    id: { 
      type: String, 
      required: [true, 'Earthquake ID is required'], 
      unique: true, 
      trim: true,
      index: true 
    },
    time: { 
      type: Date, 
      required: [true, 'Earthquake occurrence time is required'], 
      index: true 
    },
    latitude: { 
      type: Number, 
      required: [true, 'Latitude coordinate is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: { 
      type: Number, 
      required: [true, 'Longitude coordinate is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },
    depth: { 
      type: Number, 
      required: [true, 'Depth is required'], 
      index: true 
    },
    mag: { 
      type: Number, 
      required: [true, 'Magnitude is required'], 
      index: true 
    },
    magType: { 
      type: String, 
      required: [true, 'Magnitude type is required'], 
      trim: true,
      index: true 
    },
    nst: { 
      type: Number, 
      default: null 
    },
    gap: { 
      type: Number, 
      default: null, 
      index: true 
    },
    dmin: { 
      type: Number, 
      default: null 
    },
    rms: { 
      type: Number, 
      default: null 
    },
    net: { 
      type: String, 
      required: [true, 'Seismic network is required'], 
      trim: true,
      index: true 
    },
    updated: { 
      type: Date, 
      required: [true, 'Updated timestamp is required'] 
    },
    place: { 
      type: String, 
      required: [true, 'Place description is required'],
      trim: true
    },
    country: { 
      type: String, 
      default: 'Unknown', 
      trim: true,
      index: true 
    },
    type: { 
      type: String, 
      required: [true, 'Event type is required'], 
      trim: true,
      index: true 
    },
    horizontalError: { 
      type: Number, 
      default: null 
    },
    depthError: { 
      type: Number, 
      default: null 
    },
    magError: { 
      type: Number, 
      default: null 
    },
    magNst: { 
      type: Number, 
      default: null 
    },
    status: { 
      type: String, 
      required: [true, 'Review status is required'], 
      trim: true,
      index: true 
    },
    locationSource: { 
      type: String, 
      required: [true, 'Location source is required'],
      trim: true
    },
    magSource: { 
      type: String, 
      required: [true, 'Magnitude source is required'],
      trim: true
    },
    isDeleted: { 
      type: Boolean, 
      default: false, 
      index: true 
    }
  },
  {
    timestamps: true // Track createdAt and updatedAt (Timestamp Tracking System)
  }
);

// Compound text index for robust text-search across place, country, status, network, etc.
EarthquakeSchema.index(
  {
    place: 'text',
    country: 'text',
    net: 'text',
    status: 'text',
    type: 'text',
    magType: 'text'
  },
  {
    weights: {
      place: 10,
      country: 8,
      type: 5,
      status: 3,
      net: 2,
      magType: 1
    },
    name: 'EarthquakeTextIndex'
  }
);

// Soft Delete Query Middleware
const excludeDeleted = function (next) {
  const filter = this.getFilter();
  if (filter.isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
};

EarthquakeSchema.pre(/^find/, excludeDeleted);
EarthquakeSchema.pre('countDocuments', excludeDeleted);
EarthquakeSchema.pre('estimatedDocumentCount', excludeDeleted);

// Soft Delete Aggregation Middleware
EarthquakeSchema.pre('aggregate', function (next) {
  const pipeline = this.pipeline();
  const hasIsDeletedMatch = pipeline.some(
    (stage) => stage.$match && (stage.$match.isDeleted === false || stage.$match.isDeleted === true || (stage.$match.isDeleted && stage.$match.isDeleted.$ne === true))
  );
  
  if (!hasIsDeletedMatch) {
    this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  }
  next();
});

module.exports = mongoose.model('Earthquake', EarthquakeSchema);
