# Pokémon Showdown
========================================================================

Navigation: [Website][1] | **Server repository** | [Client repository][2] | [Dex repository][3]

  [1]: http://pokemonshowdown.com/
  [2]: https://github.com/smogon/pokemon-showdown-client
  [3]: https://github.com/Zarel/Pokemon-Showdown-Dex

[![Build Status](https://github.com/smogon/pokemon-showdown/workflows/Node.js%20CI/badge.svg)](https://github.com/smogon/pokemon-showdown/actions?query=workflow%3A%22Node.js+CI%22)
[![Dependency Status](https://img.shields.io/librariesio/github/smogon/pokemon-showdown)](https://libraries.io/github/smogon/pokemon-showdown)


# Introduction
------------------------------------------------------------------------

Pokémon Showdown is many things:

- A **web site** you can use for Pokémon battling

  - http://pokemonshowdown.com/

- A **JavaScript library** for simulating Pokémon battles and getting Pokédex data

  - [sim/README.md](./sim/README.md)

- Some **command-line tools** for simulating Pokémon battles (which can be used in non-JavaScript programs)

  - [COMMANDLINE.md](./COMMANDLINE.md)

- A **web API** for the web site for Pokémon battling

  - [pokemon-showdown-client: WEB-API.md](https://github.com/smogon/pokemon-showdown-client/blob/master/WEB-API.md)

- A **game server** for hosting your own Pokémon Showdown community and game modes

  - [server/README.md](./server/README.md)

Pokémon Showdown simulates singles, doubles and triples battles in all the games out so far (Generations 1 through 8).

## Developing

The Editor/IDE of choice for working with the elite redux showdown codebase is VSCode.
We utilize launch configurations tailored to VSCode's environment to facilitate developing and testing the server and client architecture.
Other editors will work, but you will need to configure running the client and server on your own.
If working within VSCode on both the client and server, we recommend using the workspace configuration following these steps:

1. Clone both the client and server architecture. The repos should exist next to each other in a folder:
    - parent_folder
        - pokemon-showdown-client-ER
        - pokemon-showdown-ER
2. "Open Workspace from File" in VSCode, and point to the file in your server repo `pokemon-showdown-ER/.vscode/pokemon-elite-redux-showdown.code-workspace`
3. Point to this file anytime you want to edit the repositories in the future.

# Testing

Because elite redux uses it's own custom showdown server, it is not sufficient to run just the client alone and you will need the server as well.

Doing this in VSCode is very easy with workspace configurations.
There are two launch options to choose from that will handle both the server and client:

-   `[TWOPLAYER] Elite Redux Showdown Battle Testing` This configuration will start the frontend and backend servers, and open two chrome tabs with separate usernames which is ideal for battle testing.
-   `[SINGLEPLAYER] Elite Redux Showdown` This configuration will start the frontend and backend servers, and open one chrome tab with a predefined username. Ideal for testing non-battle related features.

These configurations should also handle hot reloading when code changes, though you may need to refresh the browser.

Outside of VSCode, you will need to handle starting and stopping the server/client yourself.
This is still not too difficult, and can be easily automated with a script or different IDE configurations.

For the backend, run `npm run start`. This will start the backend webserver that listens on `localhost:8000`.
For the frontend, run `npm run serve`. This will start the frontend webserver that listens on `http://localhost:8080`.

Now that both web servers are running, open your browser to `http://localhost:8080/testclient.html?~~localhost:8000`.
This will load pokemon showdown and configure it to connect to your local backend server instance.
If you would like to have it preload a username for you so you don't have to choose one everytime, you can add a query parameter to your url.
For instance: `http://localhost:8080/testclient.html?~~localhost:8000&username=player11112222`.



# Documentation quick links
------------------------------------------------------------------------

* [PROTOCOL.md][4] - How the client and server communicate with each other.
* [sim/SIM-PROTOCOL.md][5] - The part of the protocol used for battles and battle messages.
* [CONTRIBUTING.md][6] - Useful code standards to understand if you want to send pull requests to PS (not necessary if you're just using the code and not planning to contribute back).
* [ARCHITECTURE.md][7] - A high-level overview of how the code works.
* [Bot FAQ][8] - An FAQ compiled by Kaiepi regarding making Pokemon Showdown bots - mainly chatbots and battle bots.

  [4]: ./PROTOCOL.md
  [5]: ./sim/SIM-PROTOCOL.md
  [6]: ./CONTRIBUTING.md
  [7]: ./ARCHITECTURE.md
  [8]: https://gist.github.com/Kaiepi/becc5d0ecd576f5e7733b57b4e3fa97e


# Community
------------------------------------------------------------------------

PS has a built-in chat service. Join our main server to talk to us!

You can also visit the [Pokémon Showdown forums][9] for discussion and help.

  [9]: https://www.smogon.com/forums/forums/pok%C3%A9mon-showdown.209/

If you'd like to contribute to programming and don't know where to start, feel free to check out [Ideas for New Developers][10].

  [10]: https://github.com/smogon/pokemon-showdown/issues/2444


# License
------------------------------------------------------------------------

Pokémon Showdown's server is distributed under the terms of the [MIT License][11].

  [11]: ./LICENSE


# Credits
------------------------------------------------------------------------

Owner

- Guangcong Luo [Zarel] - Development, Design, Sysadmin

Staff

- Andrew Werner [HoeenHero] - Development
- Annika L. [Annika] - Development
- Chris Monsanto [chaos] - Development, Sysadmin
- Leonard Craft III - Research (game mechanics)
- Mathieu Dias-Martins [Marty-D] - Research (game mechanics), Development

Contributors

- See http://pokemonshowdown.com/credits
