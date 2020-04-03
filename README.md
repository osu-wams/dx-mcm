# Development Workflow

## ts-node as the REPL

Run ts-node to `require` and run code for testing/development, `tsconfig.repl.json` is configured to allow for more relaxed coding in this environment.

```
$ yarn repl
...
> const message = require('./src/models/message');
> message.default.createTable();
```

## Invoke local lambda with mock data

Run a lambda function with provided JSON that it expects to handle locally using `serverless invoke local`

```
$ yarn sls invoke local --function <functionName> --path events/<jsonfilename> -l
```
