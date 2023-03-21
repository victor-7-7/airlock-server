const { AuthenticationError, ForbiddenError } = require('./utils/errors');

const resolvers = {
  Query: {
    guestBookings: async (_, __, { dataSources, userId, userRole }) => {
      if (!userId) throw AuthenticationError();

      if (userRole === 'Guest') {
        const bookings = await dataSources.bookingsDb.getBookingsForUser(userId);
        return bookings;
      } else {
        throw ForbiddenError('Only guests have access to trips');
      }
    },

    upcomingGuestBookings: async (_, __, { dataSources, userId, userRole }) => {
      if (!userId) throw AuthenticationError();

      if (userRole === 'Guest') {
        const bookings = await dataSources.bookingsDb.getBookingsForUser(userId, 'UPCOMING');
        return bookings;
      } else {
        throw ForbiddenError('Only guests have access to trips');
      }
    },

    pastGuestBookings: async (_, __, { dataSources, userId, userRole }) => {
      if (!userId) throw AuthenticationError();

      if (userRole === 'Guest') {
        const bookings = await dataSources.bookingsDb.getBookingsForUser(userId, 'COMPLETED');
        return bookings;
      } else {
        throw ForbiddenError('Only guests have access to trips');
      }
    },

    bookingsForListing: async (_, { listingId, status }, { dataSources, userId, userRole }) => {
      if (!userId) throw AuthenticationError();

      if (userRole === 'Host') {
        // need to check if listing belongs to host
        const listings = await dataSources.listingsAPI.getListingsForUser(userId);
        if (listings.find((listing) => listing.id === listingId)) {
          const bookings = (await dataSources.bookingsDb.getBookingsForListing(listingId, status)) || [];
          return bookings;
        } else {
          throw new Error('Listing does not belong to host');
        }
      } else {
        throw ForbiddenError('Only hosts have access to listing bookings');
      }
    },
  },

  Mutation: {
    createBooking: async (_, { createBookingInput }, { dataSources, userId }) => {
      if (!userId) throw AuthenticationError();

      const { listingId, checkInDate, checkOutDate } = createBookingInput;
      const { totalCost } = await dataSources.listingsAPI.getTotalCost({ id: listingId, checkInDate, checkOutDate });

      try {
        await dataSources.paymentsAPI.subtractFunds({ userId, amount: totalCost });
      } catch (e) {
        return {
          code: 400,
          success: false,
          message: 'We couldn’t complete your request because your funds are insufficient.',
        };
      }

      try {
        const booking = await dataSources.bookingsDb.createBooking({
          listingId,
          checkInDate,
          checkOutDate,
          totalCost,
          guestId: userId,
        });

        return {
          code: 200,
          success: true,
          message: 'Successfully booked!',
          booking,
        };
      } catch (err) {
        return {
          code: 400,
          success: false,
          message: err.message,
        };
      }
    },

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

    addFundsToWallet: async (_, { amount }, { dataSources, userId }) => {
      if (!userId) throw AuthenticationError();
      try {
        const updatedWallet = await dataSources.paymentsAPI.addFunds({ userId, amount });
        return {
          code: 200,
          success: true,
          message: 'Successfully added funds to wallet',
          amount: updatedWallet.amount,
        };
      } catch (err) {
        return {
          code: 400,
          success: false,
          message: err.message,
        };
      }
    },
  },

  Host: {
    overallRating: ({ id }, _, { dataSources }) => {
      return dataSources.reviewsDb.getOverallRatingForHost(id);
    },
  },

  Guest: {
    funds: async (_, __, { dataSources, userId }) => {
      const { amount } = await dataSources.paymentsAPI.getUserWalletAmount(userId);
      return amount;
    },
  },

  Listing: {
    bookings: ({ id }, _, { dataSources }) => {
      return dataSources.bookingsDb.getBookingsForListing(id)
    },

    reviews: ({ id }, _, { dataSources }) => {
      return dataSources.reviewsDb.getReviewsForListing(id);
    },

    overallRating: ({ id }, _, { dataSources }) => {
      return dataSources.reviewsDb.getOverallRatingForListing(id);
    },
  },

  Booking: {
    listing: ({ listingId }) => {
      return { id: listingId };
    },

    checkInDate: ({ checkInDate }, _, { dataSources }) => {
      return dataSources.bookingsDb.getHumanReadableDate(checkInDate);
    },

    checkOutDate: ({ checkOutDate }, _, { dataSources }) => {
      return dataSources.bookingsDb.getHumanReadableDate(checkOutDate);
    },

    guest: ({ guestId }) => {
      return { id: guestId };
    },

    totalPrice: async ({ listingId, checkInDate, checkOutDate }, _, { dataSources }) => {
      const { totalCost } = await dataSources.listingsAPI.getTotalCost({ id: listingId, checkInDate, checkOutDate });
      return totalCost;
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
