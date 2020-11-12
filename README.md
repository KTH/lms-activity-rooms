# Examination rooms enrollments

Periodical synchronization of examination rounds (aktivitetstillfälle) to the Canvas LMS.

## :wrench: Development mode

1.  Copy [the `.env.in` file][env-in] and name it as `.env`

    ```sh
    cp .env.in .env
    ```

    Open the newly created `.env` and fill it with the required data. This file will be read on startup as environmental variables.

2.  Run `npm run dev` to start the app in development mode

## :rocket: Production

1.  Set the environmental variables as written in [the `.env.in` file][env-in]
2.  Run `npm start` or `node .` or `node app.js`

_Keep in mind that output logs are in JSON format and could be therefore a bit unreadable without the correct tools._

## :test_tube: Run examples

You can run any `.js` file in the `scripts` directory to execute parts of the application without starting the entire application.

## :rainbow: Contribution guide

The app is divided in the following components (each in one directory):

:bulb: Quick start: run `npx madge app.js --image graph.svg` in the root of this project to get an overview of the internal dependencies.


[env-in]: https://github.com/KTH/lms-activity-rooms/blob/master/.env.in
