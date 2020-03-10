
## Expand any returned `ChromRange` from center or edge

```graphql
query {
  range(
    assembly: GRCh38
    range: { chrom: "chr2", start: 115500000, end: 116000000 }
  ) {
    chrom
    start
    end
    expandFromCenter(distance: 50) {
      chrom
      start
      end
    }
    expandFromEdges(distance: 50) {
      chrom
      start
      end
    }
  }
}
```

## Get genomic elements in a given range

```graphql
query {
  range(
    assembly: GRCh38
    range: { chrom: "chr2", start: 115500000, end: 116000000 }
  ) {
    chrom
    start
    end
    ccres {
      accession
    }
    snps {
      id
    }
    genes {
      approved_symbol
    }
  }
}
```