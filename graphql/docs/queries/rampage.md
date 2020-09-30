# Get RAMPAGE data

## Get RAMPAGE data for a given gene

Returns RAMPAGE data for the TIGAR gene.

```graphql
query {
  rampage(assembly: GRCh38, gene: "TIGAR") {
    transcripts {
      transcript
      range {
        chrom
        start
        end
      }
      geneinfo
      items {
        expid
        biosample_term_name
        tissue
        strand
        counts
      }
    }
  }
}
```

or

```graphql
query {
  gene(assembly: GRCh38, gene: "TIGAR") {
    rampage {
      transcripts {
        transcript
        range {
          chrom
          start
          end
        }
        geneinfo
        items {
          expid
          biosample_term_name
          tissue
          strand
          counts
        }
      }
    }
  }
}
```

# Try it out

What query would you use to get RAMPAGE data for the nearby protein-coding genes of `EH38E1516972`?

<details>
<summary>See answer</summary>

```graphql
query {
  ccre(accession: "EH38E1516972") {
    nearbygenes {
      pc {
        gene {
          rampage {
            transcripts {
              transcript
              range {
                chrom
                start
                end
              }
              geneinfo
              items {
                expid
                biosample_term_name
                tissue
                strand
                counts
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