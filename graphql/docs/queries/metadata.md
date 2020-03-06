
## Input data

```grapqhl
query {
  globals {
    inputData
  }
}
```

## Cell compartments and biosample info

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

```
query {
  globals {
    byAssembly(assembly: GRCh38) {
      geBiosamples
      geBiosampleTypes
    }
  }
}
```
