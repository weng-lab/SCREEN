# Getting gene expression data

## Get gene expression for all biosamples for a given gene

```
query {
  geneExpresssion(assembly: GRCh38, gene: "TIGAR") {
    gene_info {
      approved_symbol
    }
    items {
      cellType
      expID
      reps {
        replicate
        rawTPM
      }
    }
  }
}
```

## Get gene expression for a set of biosample types for a given gene

```
query {
  geneExpresssion(
    assembly: GRCh38
    gene: "TIGAR"
    biosample_types: ["cell line"]
  ) {
    gene_info {
      approved_symbol
    }
    items {
      cellType
      expID
      reps {
        replicate
        rawTPM
      }
    }
  }
}
```

## Get gene expression given a gene

```graphql
```