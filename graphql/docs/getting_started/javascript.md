Building on the previous two examples, this example in Javascript uses the
[`graphql-request`](https://github.com/prisma-labs/graphql-request) library to
completely abstract over the underlying POST request.


```javascript
import { request } from 'graphql-request'

const query = `query($gene: String!) {
  geneExpresssion(assembly: GRCh38, gene: $gene) {
    gene_info {
      approved_symbol
      ensemblid_ver
    }
    items {
      tissue
      cellType
      expID
      ageTitle
      reps {
        replicate
        logTPM
      }
    }
  }
}`
const variables = {
  gene: "PTMA"
}

request('https://screen-api.wenglab.org/graphql', query).then(data =>
  console.log(data)
)
```
which prints

```json
{
  "data": {
    "geneExpresssion": {
      "gene_info": {
        "gene": "TIGAR",
        "ensemblid_ver": "ENSG00000078237.6"
      },
      "items": [
        ...
        {
          "tissue": "blood",
          "cellType": "K562",
          "expID": "ENCSR000AEM",
          "ageTitle": "",
          "reps": [
            {
              "replicate": "1",
              "rawTPM": 1.326569
            },
            {
              "replicate": "2",
              "rawTPM": 1.553627
            },
            {
              "replicate": "mean",
              "rawTPM": 1.440098
            }
          ]
        },
        ...
      ]
    }
  }
}
```