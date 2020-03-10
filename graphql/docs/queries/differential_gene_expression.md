# Querying differential gene expression data

## Get differential expression data

```
query {
  differentialExpression(assembly: mm10, gene: "Ptma", ct1: "C57BL/6_limb_embryo_11.5_days", ct2: "C57BL/6_limb_embryo_15.5_days") {
    gene {
      gene
    }
    isde
    fc
    ct1
    ct2
  }
}
```