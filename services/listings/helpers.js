// Returns the number of days from checkIn to checkOut (checkOut is not counted as a day)
const getDifferenceInDays = (checkIn, checkOut) => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  const diffInTime = checkOutDate.getTime() - checkInDate.getTime();

  const oneDayConversion = 1000 * 60 * 60 * 24;

  return Math.round(diffInTime / oneDayConversion);
};

const transformListingWithAmenities = (listingInstance) => {
  // Amenities and ListingAmenities need to be converted to just `amenities`
  const listing = listingInstance.toJSON();
  // console.log("__SSS", listing);
  // listing = {
  //  id: 'listing-4',
  //  ...
  //  Amenities: [
  //    {
  //      id: 'am-1',
  //      category: 'Accommodation Details',
  //      name: 'Interdimensional wifi',
  //      ListingAmenities: [Object]
  //    },
  //    ...
  //  ],
  // }
  // *** Извлекаем свойство Amenities
  const { Amenities, ...listingPropertiesToReturn } = listing;
  // *** Убираем из каждого элемента ненужное свойство ListingAmenities
  const amenities = Amenities.map((a) => {
    const { ListingAmenities, ...amenitiesToReturn } = a;
    return amenitiesToReturn;
  });

  return { ...listingPropertiesToReturn, amenities };
};

module.exports = { getDifferenceInDays, transformListingWithAmenities };

