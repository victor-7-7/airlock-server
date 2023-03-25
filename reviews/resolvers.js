const { AuthenticationError, ForbiddenError } = require('./utils/errors');

const resolvers = {

  Mutation: {
    submitGuestReview: async (_, { bookingId, guestReview }, { dataSources, userId }) => {
      if (!userId) throw AuthenticationError();

      const { rating, text } = guestReview;
      const guestId = await dataSources.bookingsDb.getGuestIdForBooking(bookingId);

      const createdReview = await dataSources.reviewsDb.createReviewForGuest({
        bookingId,
        guestId,
        authorId: userId,
        text,
        rating,
      });
      return {
        code: 200,
        success: true,
        message: 'Successfully submitted review for guest',
        guestReview: createdReview,
      };
    },

    submitHostAndLocationReviews: async (_, { bookingId, hostReview, locationReview }, { dataSources, userId }) => {
      if (!userId) throw AuthenticationError();

      const listingId = await dataSources.bookingsDb.getListingIdForBooking(bookingId);
      const createdLocationReview = await dataSources.reviewsDb.createReviewForListing({
        bookingId,
        listingId,
        authorId: userId,
        text: locationReview.text,
        rating: locationReview.rating,
      });

      const { hostId } = await dataSources.listingsAPI.getListing(listingId);
      const createdHostReview = await dataSources.reviewsDb.createReviewForHost({
        bookingId,
        hostId,
        authorId: userId,
        text: hostReview.text,
        rating: hostReview.rating,
      });

      return {
        code: 200,
        success: true,
        message: 'Successfully submitted review for host and location',
        hostReview: createdHostReview,
        locationReview: createdLocationReview,
      };
    },
  },

  Host: {
    __resolveReference: (user, { dataSources }) => {
      return dataSources.accountsAPI.getUser(user.id);
    },

    overallRating: ({ id }, _, { dataSources }) => {
      return dataSources.reviewsDb.getOverallRatingForHost(id);
    },
  },

  Listing: {
    __resolveReference: (listing, { dataSources }) => {
      return dataSources.listingsAPI.getListing(listing.id);
    },

    reviews: ({ id }, _, { dataSources }) => {
      return dataSources.reviewsDb.getReviewsForListing(id);
    },

    overallRating: ({ id }, _, { dataSources }) => {
      return dataSources.reviewsDb.getOverallRatingForListing(id);
    },
  },

  Booking: {
    __resolveReference: (booking, { dataSources }) => {
      return dataSources.bookingsDb.getBooking(booking.id);
    },

    guestReview: ({ id }, _, { dataSources }) => {
      return dataSources.reviewsDb.getReviewForBooking('GUEST', id);
    },

    hostReview: ({ id }, _, { dataSources }) => {
      return dataSources.reviewsDb.getReviewForBooking('HOST', id);
    },

    locationReview: ({ id }, _, { dataSources }) => {
      return dataSources.reviewsDb.getReviewForBooking('LISTING', id);
    },
  },

  Review: {
    // We've renamed the first argument of the resolver (parent)
    // to review to clarify the argument's type.
    author: (review) => {
      let role = '';
      if (review.targetType === 'GUEST') {
        role = 'Host';
      } else {
        role = 'Guest';
      }
      return { __typename: role, id: review.authorId };
    },
  },
};

module.exports = resolvers;
