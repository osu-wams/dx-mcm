[![codecov](https://codecov.io/gh/osu-wams/dx-mcm/branch/master/graph/badge.svg)](https://codecov.io/gh/osu-wams/dx-mcm)

# Setup

At this time, a multi-compile deployment requires a lot of RAM due to an issue with how serverless-webpack behaves. The problem is being
addressed in a PR: https://github.com/serverless-heaven/serverless-webpack/pull/570. In the meantime, you must set the `NODE_OPTIONS` environment
variable in your terminal before deploying or packaging the application.

```
$ export NODE_OPTIONS=--max_old_space_size=8192
```

# Deployment

Deployment is using Serverless framework and provided `.env.*` files. Grab the files from Keeper and make sure they have the leading dot (.).

Deploy development (default):

```
$ yarn install
$ yarn deploy
```

alternatively, stage and production can be deployed with `yarn deploy:production` or `yarn deploy:stage`

# Development Workflow

## ts-node as the REPL

Run ts-node to `import` and run code for testing/development, `tsconfig.repl.json` is configured to allow for more relaxed coding in this environment.

```
$ yarn repl
...
> import Message from '@src/models/message';
> Message.find("blah");
```

## Invoke local lambda with mock data

Run a lambda function with provided JSON that it expects to handle locally using `serverless invoke local`

```
$ yarn sls invoke local --function <functionName> --path events/<jsonfilename> -l
```

# Testing Workflow

Each function should be written such that they can have functionality tests run without employing any external services and unit tests to cover
the expectations of the operation. An example of this approach can be found in `src/database.ts` in that it provides basic helper/wrapper methods
that can be easily targetted and mocked in tests (see `__tests__/message.test.ts`).

```
# Collect coverage
$ yarn cov

# Just run tests
$ yarn test
```

# Testing Commands

Use `curl` for testing purposes, here are some helpful commands;

## Send a new UserMessage to a specific ONID

Be sure to replace `<API_KEY_HERE>` and `<ONID_HERE>` with valid values.

```
curl -k --header "x-api-key: <API_KEY_HERE>" --request POST --data '{"payload": { "populationParams": {"affiliations": ["undergrad"], "users": [{"id": "<ONID_HERE>"}]}, "channelIds": ["dashboard"], "content": "This is a full content of the message.", "contentShort": "This is the full...", "sendAt": "2020-02-19T16:20:00.000Z", "title": "The title here...", "imageUrl": "https://blah.png"}}' https://dev.mcm.oregonstate.edu/api/v1/messages/action/create
```
