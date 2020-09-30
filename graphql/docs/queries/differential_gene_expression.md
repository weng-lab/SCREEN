# Querying differential gene expression data

## Get differential expression data

Returns differental gene expression data for Ptma between
`C57BL/6_limb_embryo_11.5_days` and `C57BL/6_limb_embryo_15.5_days`.

```graphql
query {
  differentialExpression(
    assembly: mm10
    gene: "Ptma"
    ct1: "C57BL/6_limb_embryo_11.5_days"
    ct2: "C57BL/6_limb_embryo_15.5_days"
  ) {
    gene {
      approved_symbol
    }
    isde
    fc
    ct1
    ct2
  }
}
```

or 

```graphql
query {
  gene(assembly: mm10, gene: "Ptma") {
    approved_symbol
    differentialExpression(
      ct1: "C57BL/6_limb_embryo_11.5_days"
      ct2: "C57BL/6_limb_embryo_15.5_days"
    ) {
      isde
      fc
      ct1
      ct2
    }
  }
}
```

# Try it out

What query would you use to get differential gene expression data between `C57BL/6_limb_embryo_11.5_days` and `C57BL/6_limb_embryo_15.5_days` for all genes within 500 kb of the center of `EM10E0493677`?

<details>
<summary>See answer</summary>

```graphql
query {
  ccre(accession: "EM10E0493677") {
    range {
      expandFromCenter(distance: 500000) {
        genes {
          approved_symbol
          differentialExpression(
            ct1: "C57BL/6_limb_embryo_11.5_days"
            ct2: "C57BL/6_limb_embryo_15.5_days"
          ) {
            isde
            fc
            ct1
            ct2
          }
        }
      }
    }
  }
}
```
</details>

<br />
