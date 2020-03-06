
## Get gene expression for all biosamples for a given gene

```
query {
  geneExpresssion(assembly: GRCh38, gene: "TIGAR") {
    gene_info {
      gene
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
      gene
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

## Get the top expressed genes for a given biosample

```
query {
  genetop(assembly: GRCh38, biosample: "K562") {
    gene_name
    cellType
    expID
    replicate
    rawTPM
  }
}
```