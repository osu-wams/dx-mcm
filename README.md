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
any potential impacts on others work and testing.

```
$ yarn deploy --developer=<YOUR_NAME_HERE>
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
