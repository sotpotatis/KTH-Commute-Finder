# Caching API

To be nice to KTH's servers, we are caching a couple of things in the application:

1. **Schedules**. A user's schedule is only re-synced a maximum of times per hour.
2. **Room information**. Once we have a response for a room from the KTH room API, we know what we want to know. We only wa t to
   occasionally pull this data if it is interesting.

### Data storage used for caching

Caching is done by using [Deta Base](https://deta.space/docs/en/build/fundamentals/data-storage), which is a storage system
provided by the cloud provider [Deta](https://deta.space).
