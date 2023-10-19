# ivanpartida.xyz - monorepo

This is a monorepo (powered by [Turborepo](https://turbo.build/repo)) consisting of the following:

- Apps:
    - `frontend`: a (mostly) static website built with [Astro](https://astro.build/), [TailwindCSS](https://tailwindcss.com/) and [Svelte](https://svelte.dev/); it uses websockets to show what I'm coding in real time
    - `server`: a simple WebSockets server that serves as the bridge between my text editor and the `frontend`. Built with [uWebSockets](https://github.com/uNetworking/uWebSockets.js)
    - `plugin`: a [neovim](https://neovim.io/) plugin that sends some info about what I'm coding to the server via WebSockets. Built with [Node.js](https://nodejs.org), [neovim/node-client](https://github.com/neovim/node-client) and [esbuild](https://esbuild.github.io/)
- Packages:
    - `eslint-config-custom`: a custom eslint config shared by all the other packages
    - `tsconfig`: the base TypeScript config which all the apps inherit from
    - `ci`: this is where the CI/CD pipelines for all the other things live, built with [Dagger](https://dagger.io/) (maybe it should be an app instead of a package?)

The whole thing uses [MessagePack](https://msgpack.org/) as the data exchange format.
