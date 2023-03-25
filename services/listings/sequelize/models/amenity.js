'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Amenity extends Model {
    static associate(models) {
      Amenity.belongsToMany(models.Listing, { through: models.ListingAmenities });
    }
  }

  Amenity.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      category: DataTypes.STRING,
      name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Amenity',
      timestamps: false,
    }
  );

  return Amenity;
};
