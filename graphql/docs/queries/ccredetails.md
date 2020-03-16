# Getting cCRE details

## Query a single cCRE

Returns a single cCRE by accession.

```graphql
query {
  ccre(accession: "EH38E2000616") {
    accession
  }
}
```

## Get biosample-specific epigenetic signals

Returns all biosample-specific signals for a given cCRE.

```graphql
query {
  ccre(accession: "EH38E2000616") {
    accession
    details {
      biosampleSpecificSignals {
        ct {
          name
        }
        dnase
        h3k4me3
        h3k27ac
        ctcf
      }
    }
  }
}
```


## Get nearby genomic features

Returns nearby genomic features for a single cCRE.

```graphql
query {
  ccre(accession: "EH38E2000616") {
    accession
    details {
      nearbyGenomic {
        nearby_genes {
          distance
          gene {
            approved_symbol
          }
        }
        tads {
          approved_symbol
        }
        re_tads {
          distance
          cCRE {
            accession
          }
        }
        nearby_res {
          distance
          cCRE {
            accession
          }
        }
        nearby_snps {
          distance
          snp {
            id
          }
        }
      }
    }
  }
}
```

## Get orthologous cCREs in another assembly

Returns orthogolous cCREs in both hg19 and mm10 for a given GRCh38 cCRE.

```graphql
query {
  ccre(accession: "EH38E1516972") {
    accession
    details {
      # Can rename fields by doing `<name>: field...`
      mm10: ortholog(assembly: "mm10") {
        accession
        range {
          chrom
          start
          end
        }
      }
      hg19: ortholog(assembly: "hg19") {
        accession
        range {
          chrom
          start
          end
        }
      }
    }
  }
}
```

## Get overlapping TFs

Get overlapping TF and histone peaks for a given cCRE.

```graphql
query {
  ccre(accession: "EH38E2000616") {
    accession
    details {
      tfIntersection {
        tf {
          # The name of the TF
          name
          # The number of peaks that overlap this cCRE
          n
          # The total number of peaks for the TF that *could* overlap this cCRE
          total
        }
        histone {
          name
          n
          total
        }
      }
    }
  }
}
```

## Get linked genes

Returns linked genes for a cCRE.

```graphql
query {
  ccre(accession: "EH38E1516972") {
    accession
    details {
      linkedGenes {
        gene
        celltype
        method
        dccaccession
      }
    }
  }
}
```

# Try it out

What query would you use to get the max H3K27ac Z-score for nearby cCREs for `EH38E1516972`?

<details>
<summary>See answer</summary>

```graphql
query {
  ccre(accession: "EH38E1516972") {
    accession
    details {
      nearbyGenomic {
        nearby_res {
          cCRE {
            k27acmax
          }
        }
      }
    }
  }
}
```
</details>

<br />
