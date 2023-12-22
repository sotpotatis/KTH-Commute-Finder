# KTH Commute Finder

Find a commute that fits with your KTH* schedule! ✨

(`*=`KTH Royal Institute of Technology, Sweden)

KTH Commute Finder will use your KTH schedule URL together with data from SL (Stockholm's traffic provider) to provide you
with relevant trips for whenever *you* want to arrive on campus!

It also includes customizable walking times for each building that the application suggests.

### Configuring

You need some environment variables, please see the [.env.example](.env.example) file.
### Developing

**Using Deta**

This project is hosted on [Deta](https://deta.space). If you wish to do that as well, you can run

`space dev`

to get a development environment.

**Without using Deta**

You have to adjust the *caching* code a little bit, since it is built around Deta's libraries :D But then, you can just run

`npm run dev`

You can optionally set `VITE_DATABASE_TYPE` to `memory` to use an in-memory cache.