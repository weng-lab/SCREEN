Similar to the command-like query, this example will also uses a plain POST
request. However, in addition, this example uses the `requests` library in
python to provide a thin abstraction. It also shows how to include GraphQL
variables.

```python
import requests
variables = {
    "accession": "EH38E1966636"
}
query = """
query($accession: String!) {
  ccre(accession: $accession) {
    accession
    range {
      chrom
      start
      end
    }
  }
}
"""
request = requests.post(
    'https://screen-api.wenglab.org/graphql',
    json={ 'query': query, 'variables': variables },
    headers={}
)
if request.status_code != 200:
    raise Exception("Query failed. Status code: {}.".format(request.status_code))
result = request.json()
print(result)
```

where the `result` is

```
{
    u'data': {
        u'ccre': {
            u'range': {
                u'start': 240535,
                u'end': 240809,
                u'chrom': u'chr2'
            },
            u'accession': u'EH38E1966636'
        }
    }
}
```