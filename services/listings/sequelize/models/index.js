'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename); // <-- index.js
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname) // Массив имен файлов, находящихся в папке models
  .filter(file => {
    // Выкидываем из массива имена, начинающиеся с точки, имя index.js и имена,
    // не оканчивающиеся на .js
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    // Получаем на трех итерациях три инициализированные модели -
    // Listing, Amenity и ListingAmenities
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });
// В итоге трех итераций db-объект будет иметь вид
// db = {"Listing": Listing, "Amenity": Amenity, "ListingAmenities": ListingAmenities}

Object.keys(db).forEach(modelName => {
  // Если у модели есть член-функция associate()
  if (db[modelName].associate) {
    // То вызываем ее
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize; // Экземпляр класса Sequelize
db.Sequelize = Sequelize;

module.exports = db;
