# Query metadata

## Input data

Returns the data used in SCREEN.

```grapqhl
query {
  globals {
    inputData
  }
}
```

## Cell compartments and biosample info

Returns cell compartments, biosamples, and assays used for K562.

```grapqhl
query {
  globals {
    byAssembly(assembly: GRCh38) {
      cellCompartments
      biosamples {
        name
        assays {
          assay
          expid
        }
      }
      biosample(biosample: "K562") {
        assays {
          assay
          expid
        }
      }
    }
  }
}
```

## Gene expression-related metadata

Returns biosamples and biosample types with associated gene expression data available.

```graphql
query {
  globals {
    byAssembly(assembly: GRCh38) {
      geBiosamples
      geBiosampleTypes
    }
  }
}
```
