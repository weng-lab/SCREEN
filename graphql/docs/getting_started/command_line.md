The SCREEN API takes a query as JSON as POST data and returns a JSON response.
As mentioned before, the interactive playground allows copying the `cURL`
command for a given query. However, here, we'll given a simple `cURL` command
for reference.

The following command
```bash
curl 'https://screen-api.wenglab.org/graphql'\
 -H 'Content-Type: application/json'\
 -H 'Accept: application/json'\
 --data-binary '{"query":"{ globals { byAssembly(assembly: GRCh38) { tfs } } }"}'
```

returns

```json
{"data":{"globals":{"byAssembly":{"tfs":["AFF1","AGO1",...,"ZZZ3"]}}}}
```

This response can be saved to as a `JSON` file. Additionally, it could be piped
into a JSON processing library (like [`jq`](https://stedolan.github.io/jq/)) to
be processed.
