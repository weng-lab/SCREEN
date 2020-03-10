# Searching cCREs

## Query cCREs by location

```
query {
  ccres(assembly: GRCh38, range: { chrom: "chr2", start: 115500000, end: 116000000 }) {
    total
    ccres {
      accession
      range {
        chrom
        start
        end
      }
      ctspecific(ct: "K562") {
        dnase_zscore
        h3k4me3_zscore
        h3k27ac_zscore
        ctcf_zscore
      }
    }
  }
}
```

## Query cCREs by max epigenetic signal

```
query {
  ccres(
    assembly: GRCh38
    range: { chrom: "chr2" }
    expmaxs: { rank_promoter_start: 2, rank_promoter_end: 3 }
  ) {
    total
    ccres {
      accession
      k4me3max
    }
  }
}
```

## Query cCREs by biosample-specific epigenetic signal

```
query {
  ccres(
    assembly: GRCh38
    range: { chrom: "chr2" }
    ctexps: { cellType: "K562", rank_dnase_start: 1.64 }
  ) {
    total
    ccres {
      accession
      k4me3max
    }
  }
}
```

## Query cCREs by accession

```
query {
  ccres(assembly: GRCh38, accessions: ["EH38E2000616", "EH38E1972623"]) {
    ccres {
      accession
    }
  }
}
```
