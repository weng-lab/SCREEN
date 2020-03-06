
## Query a single cCRE

```
query {
  ccre(accession: "EH38E2000616") {
    accession
  }
}
```

## Get biosample-specific epigenetic signals

```
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

```
query {
  ccre(accession: "EH38E2000616") {
    accession
    details {
      nearbyGenomic {
        nearby_genes {
          distance
          gene {
            gene
          }
        }
        tads {
          gene
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

```
query {
  ccre(accession: "EH38E2000616") {
    accession
    details {
      ortholog(assembly: "mm10") {
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

```
query {
  ccre(accession: "EH38E2000616") {
    accession
    details {
      tfIntersection {
        tf {
          name
          n
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

```
query {
  ccre(accession: "EH38E2000616") {
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