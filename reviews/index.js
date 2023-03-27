const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { buildSubgraphSchema } = require("@apollo/subgraph");

const { readFileSync } = require('fs');
const axios = require('axios');
const gql = require('graphql-tag');

const { AuthenticationError } = require('./utils/errors');

const typeDefs = gql(readFileSync('./schema.graphql', { encoding: 'utf-8' }));
const resolvers = require('./resolvers');

const ReviewsDataSource = require('./datasources/reviews');
const BookingsDataSource = require('../bookings/datasources/bookings');
const ListingsAPI = require("../listings/datasources/listings");
const AccountsAPI = require("../accounts/datasources/accounts");

async function startApolloServer() {
  const server = new ApolloServer({
    schema: buildSubgraphSchema({
      typeDefs,
      resolvers,
    }),
  });

  const port = 4002; // <-- сабграф, а на 4000 будет сидеть Router

  try {
    const { url } = await startStandaloneServer(server, {
      // A subgraph can access the authorization (and other request) headers
      // from the router through its ApolloServer constructor context property.
      context: async ({ req }) => {
        const token = req.headers.authorization || '';
        const userId = token.split(' ')[1]; // get the user name after 'Bearer '

        let userInfo = {};
        if (userId) {
          const { data } = await axios
            .get(`http://localhost:4011/login/${userId}`)
            .catch((error) => {
            throw AuthenticationError();
          });

          userInfo = { userId: data.id, userRole: data.role };
        }

        return {
          ...userInfo,
          dataSources: {
            reviewsDb: new ReviewsDataSource(),
            bookingsDb: new BookingsDataSource(),
            listingsAPI: new ListingsAPI(),
            accountsAPI: new AccountsAPI(),
          },
        };
      },
      listen: {
        port,
      },
    });

    console.log(`🚀  Server ready at ${url}`);
  } catch (err) {
    console.error(err);
  }
}

startApolloServer();
