[![codecov](https://codecov.io/gh/osu-wams/dx-mcm/branch/master/graph/badge.svg)](https://codecov.io/gh/osu-wams/dx-mcm)

# Setup

At this time, a multi-compile deployment requires a lot of RAM due to an issue with how serverless-webpack behaves. The problem is being
addressed in a PR: https://github.com/serverless-heaven/serverless-webpack/pull/570. In the meantime, you must set the `NODE_OPTIONS` environment
variable in your terminal before deploying or packaging the application.

```
$ export NODE_OPTIONS=--max_old_space_size=8192
```

# Deploy a developer-specific development stack

Perform a complete build and deployment to a bespoke stack including the developers name. This feature provides each developer a way to work in isolation without having
any potential impacts on others work and testing. The developer option helps to ensure the stack and some resources are globally unique (api key, domain alias, resource names, etc). **RECOMMENDED** Keep the value of ONID as short and unique to you.

```
$ yarn deploy -v --developer=<ONID>
```

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

## Send a new UserMessage to a specific OSU ID

Be sure to replace `<API_KEY_HERE>` and `<OSU_ID_HERE>` with valid values.

```
curl -k --header "x-api-key: <API_KEY_HERE>" --request POST --data '{"payload": { "populationParams": {"affiliations": ["undergrad"], "users": [{"id": "<OSU_ID_HERE>"}]}, "channelIds": ["dashboard"], "content": "This is a full content of the message.", "contentShort": "This is the full...", "sendAt": "2020-02-19", "title": "The title here..."}}' https://dev.mcm.oregonstate.edu/api/v1/messages/action/create
```
