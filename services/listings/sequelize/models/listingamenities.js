'use strict';
const { Model } = require('sequelize');
const { Listing, Amenity } = require('../models');
module.exports = (sequelize, DataTypes) => {
  class ListingAmenities extends Model {}
  ListingAmenities.init(
    {
      ListingId: {
        type: DataTypes.STRING,
        references: {
          model: 'Listing',
          key: 'id',
        },
      },
      AmenityId: {
        type: DataTypes.STRING,
        references: {
          model: 'Amenity',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      modelName: 'ListingAmenities',
      timestamps: false,
    }
  );
  return ListingAmenities;
};
