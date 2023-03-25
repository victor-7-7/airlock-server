const { AuthenticationError, ForbiddenError } = require('./utils/errors');

const resolvers = {

  Query: {
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

    guestBookings: async (_, __, { dataSources, userId, userRole }) => {
      if (!userId) throw AuthenticationError();

      if (userRole === 'Guest') {
        const bookings = await dataSources.bookingsDb.getBookingsForUser(userId);
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

    upcomingGuestBookings: async (_, __, { dataSources, userId, userRole }) => {
      if (!userId) throw AuthenticationError();

      if (userRole === 'Guest') {
        const bookings = await dataSources.bookingsDb.getBookingsForUser(userId, 'UPCOMING');
        return bookings;
      } else {
        throw ForbiddenError('Only guests have access to trips');
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

  Guest: {
    __resolveReference: (user, { dataSources }) => {
      return dataSources.accountsAPI.getUser(user.id);
    },

    funds: async (_, __, { dataSources, userId }) => {
      const { amount } = await dataSources.paymentsAPI.getUserWalletAmount(userId);
      return amount;
    },
  },

  Listing: {
    __resolveReference: (listing, { dataSources }) => {
      return dataSources.listingsAPI.getListing(listing.id);
    },

    bookings: ({ id }, _, { dataSources }) => {
      return dataSources.bookingsDb.getBookingsForListing(id)
    },
  },

  Booking: {
    __resolveReference: (booking, { dataSources }) => {
      return dataSources.bookingsDb.getBooking(booking.id);
    },

    listing: ({ listingId }) => {
      return { id: listingId };
    },

    guest: ({ guestId }) => {
      return { id: guestId };
    },

    checkInDate: ({ checkInDate }, _, { dataSources }) => {
      return dataSources.bookingsDb.getHumanReadableDate(checkInDate);
    },

    checkOutDate: ({ checkOutDate }, _, { dataSources }) => {
      return dataSources.bookingsDb.getHumanReadableDate(checkOutDate);
    },

    totalPrice: async ({ listingId, checkInDate, checkOutDate }, _, { dataSources }) => {
      const { totalCost } = await dataSources.listingsAPI.getTotalCost({ id: listingId, checkInDate, checkOutDate });
      return totalCost;
    },
  },
};

module.exports = resolvers;
