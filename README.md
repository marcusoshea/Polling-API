
## Completed Work
```bash
-Login
--Get Auth Token

-OrderMember
--Create, Delete (Admin & Assistant Order Roles), Get

```

## Planned Work

```bash

-Login
--Password reset


-Polling
--Create, Edit, Delete -> Name of Polling, Polling dates

-OrderMember
--Edit

-Polling-Note-Vote
--Creates notes and votes associated with a specific candidate and polling, which will be attributed to the contributor

-Polling-Summary
--Pulls data for each poll, and lists all candidates and thier data

-Candidate
--Create, Edit, Delete

-Candidate-External-Notes
--Create, Edit, Delete -> this would be for data added outside of a polling for a candidate

-Admin
--Update Admin and Admin assistant

```


## Pre Reqs

```bash
    1. Have access to a Postgres database
    2. Run PollingBackup.sql on database
    3. Update src/common/env/.development.env with login info for postgres database
    4. Update src/auth/constants.ts with a new secret prior to going to production.
```


## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod

If you use Postman ( https://www.postman.com/downloads/ ) you can use the Polling.postman_collection.json file which will have the most up to date endpoints listed.
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
