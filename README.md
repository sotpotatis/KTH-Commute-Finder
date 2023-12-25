# KTH Commute Finder

Find a commute that fits with your KTH* schedule! ✨

(`*=`KTH Royal Institute of Technology, Sweden)

KTH Commute Finder will use your KTH schedule URL together with data from SL (Stockholm's traffic provider) to provide you
with relevant trips for whenever *you* want to arrive on campus!

It also includes customizable walking times for each building that the application suggests.

### Configuring

You need some environment variables, please see the [.env.example](.env.example) file for guidance

### Caching requests

To avoid unneccesary requests to the KTH API, the application implements caching. There are two main available caching methods:


> **Note:** Caching backend to use is set by the `VITE_DATABASE_TYPE` environment variable. The variable for each option
> is shown within the parentheses of the name of each listed backend below.

️
**FaunaDB (`fauna`)**

FaunaDB offers a generous free trial and a great integration with Netlify.

The application uses the following setup:

* Collections with names `kthPlace` and `kthSchedule` for caching location data and schedule URLs respectively
* Indexes `kthPlace-keys` and `kthSchedule-keys` for finding schedule events based by their key (`data.key` attribute).

**Memory (`memory`)**

Great for developing or when running a single-environment, (self hosted (? :)) server. Uses `node-cache` to implement
a simple memory cache.
(not recommended in production, at least not when running on other peoples hardware or serverless solutions since the memory
might change at any time)

### Developing

After `npm install` and following what is said under **Configuring** above, you should be able to run: `npm run dev`

As stated above, you could set `VITE_DATABASE_TYPE` to `memory` to use an in-memory cache for development purposes.

**Generate favicons**

After install the NPM package `cli-real-favicon`, run the following command:

`real-favicon generate ./faviconDescription.json ./faviconData ./static`


**Using Deta**

This project was first attempted to be hosted on [Deta](https://deta.space). If you wish to do that as well, you can run

`space dev`

to get a development environment. But due to them having an old Node.JS version, I never got it to work.

### Deploying to production

**Building**

You can build the applicaiton with:

`npm run build`

**Using Netlify**

1. `netlify init`

for caching using Fauna (see above):
2. `netlify addons:create fauna`
3. `netlify addons:auth fauna`

**Using Deta**

As said above, Deta support is unfinished, but you can `space push` if you're feeling adventurous 👀