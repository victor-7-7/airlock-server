# Odyssey Voyage III - Server (Airlock)

Welcome to the companion app of Odyssey's Voyage III: Federation in Production! This is the `server` backend of the Airlock app. You can [find the course lessons and instructions on Odyssey](http://apollographql.com/tutorials/voyage-part3), Apollo's learning platform.

You can [find the client counterpart here](https://github.com/victor-7-7/airlock-client).

## How to use this repo

The course [Voyage II: Federating the monolith](https://www.apollographql.com/tutorials/voyage-part2) will walk you through step by step how to turn a monolithic graph into a federated graph. This codebase is the final point of your journey!

To get started:

In a terminal window, navigate to the `accounts` directory.

1. Run `npm install`.
2. Run `npm start`.

Repeat these commands from other directories - bookings, listings, reviews.

To start the GraphQL API server on [http://localhost:4000](http://localhost:4000)
navigate to the `router` directory and run command `./start_router`.
Note! You must have a `.env` file in this directory. The file must contain
your values for APOLLO_KEY and APOLLO_GRAPH_REF keys (see course content for 
more details on how to set these up).

Next, let's run some local services.

In a new terminal window navigate to the `common` directory, run `npm install` 
and `npm run launch`. This will run 4 local services, which you can learn about 
in the [accompanying Odyssey course](https://www.apollographql.com/tutorials/voyage-part2/monolith-graph-setup).

### Resetting the database

After playing around with the data, you may want to reset to its initial state. 
To do this, run `npm run db:reset` from `common` directory.

## Getting Help

For any issues or problems concerning the course content, please [refer to the Odyssey topic in our community forums](https://community.apollographql.com/tags/c/help/6/odyssey).
