# Development Workflow

## ts-node as the REPL

Run ts-node to `import` and run code for testing/development, `tsconfig.repl.json` is configured to allow for more relaxed coding in this environment.

```
$ yarn repl
...
> import Message from '@src/models/message';
> Message.createTable();
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
