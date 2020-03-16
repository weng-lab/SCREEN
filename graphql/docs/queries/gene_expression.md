# Getting gene expression data

## Get gene expression for all biosamples for a given gene

Returns gene expression data for the TIGAR gene.

```graphql
query {
  geneExpresssion(assembly: GRCh38, gene: "TIGAR") {
    gene_info {
      approved_symbol
    }
    items {
      cellType
      expID
      reps {
        # Bio reps
        replicate
        rawTPM
      }
    }
  }
}
```

or

```graphql
query {
  gene(assembly: GRCh38, gene: "TIGAR") {
    approved_symbol
    expression {
      items {
        tissue
        cellType
        expID
        ageTitle
        reps {
          replicate
          rawTPM
        }
      }
    }
  }
}
```

## Get gene expression for a set of biosample types for a given gene

Returns a subset of gene expression data for TIGAR for cell lines only.

```graphql
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

# Try it out

What query would you use to get the gene expression for nearby protein-coding genes for `EH38E1516972`?

<details>
<summary>See answer</summary>

```graphql
query {
  ccre(accession: "EH38E1516972") {
    nearbygenes {
      pc {
        gene {
          approved_symbol
          expression {
            items {
              cellType
              reps {
                replicate
                rawTPM
              }
            }
          }
        }
      }
    }
  }
}
```
</details>

<br />
