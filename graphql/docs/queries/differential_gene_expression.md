
## Get differential expression data

```
query {
  differentialExpression(assembly: mm10, gene: "Ptma", ct1: "C57BL/6_limb_embryo_11.5_days", ct2: "C57BL/6_limb_embryo_15.5_days") {
    gene {
      gene
    }
    diffcCREs {
      center
      value
      typ
      cCRE {
        accession
      }
    }
    nearbyGenes {
      isde
      fc
      gene {
        gene
        coords {
          chrom
          start
          end
        }
      }
    }
    min
    max
  }
}
```