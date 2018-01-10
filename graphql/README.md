# Quick Start
To begin, clone to git repository. Set up the config as follows:

    cp config/config.dev.json graphql/src/config.json

Edit the "DB" property of the newly created config.json to point to the SCREEN db. Then, navigate to the *graphql* folder.

To setup and start the server:

    yarn
    yarn start

You can now navigate to *localhost:4000/graphql* in your browser and run graphql queries.

# Schema
The schema is written using graphql-js objects. In order to download the raw graphql language schema, do the following:

If you haven't downloaded graphql-cli yet:

    npm install -g graphql-cli
    echo "{schemaPath: schema.graphql, extensions: { endpoints: { dev: http://localhost:4000/graphql } } }" > .graphqlconfig


Once you have graphql-cli installed, start the graphql server (as in Quick Start) and run:

    graphql get-schema

The downloaded schema will now be in *schema.graphql*.

# Examples
You can copy these into the graphiql window to check out example queries for different web services. Click the *Execute Query* button at the top and choose an action. The results will be displayed on the right.

Document (on left):
```
query rangeSearchAndData(
  $assembly: Assembly!,
  $uuid: UUID!,
  $rangeSearch: SearchParameters!,
  $dataEmpty: DataParameters!,
  $dataCellType: DataParameters!
) {
  search(assembly: $assembly, uuid: $uuid, search: $rangeSearch) {
    __typename
    ... on RangeResponse {
      range {
        chrom
        start
        end
      }
    }
    # Since we searched a range, we won't get back an AccessionsResponse
    ... on AccessionsResponse {
      accessions
    }
  }
  # If we want cRE data, we can get data based on only the search
  dataSearch: data(assembly: $assembly, uuid: $uuid, search: $rangeSearch, data: $dataEmpty) {
    total,
    rfacets,
    cres{
      info{
        accession
      }
    }
  }
  # Or, we can refine our search. In this case, by cell type "K562"
  dataSearchRefined: data(assembly: $assembly, uuid: $uuid, search: $rangeSearch, data: $dataCellType) {
    total
    cres {
      info {
        k4me3max
      }
      data {
        range {
          chrom,
          start,
          end
        }
        ctspecific {
          ct
          dnase_zscore
          promoter_zscore
          enhancer_zscore
          ctcf_zscore
        }
      }
    }
  },
}

query geneSearchAndData(
  $assembly: Assembly!,
  $uuid: UUID!,
  $geneSearch: SearchParameters!,
  $dataEmpty: DataParameters!
) {
  search(assembly: $assembly, uuid: $uuid, search: $geneSearch) {
    __typename
    # We searched for a gene, so this should be empty
    ... on RangeResponse {
      range {
        chrom
        start
        end
      }
    }
    ... on SingleGeneResponse {
      gene {
        approved_symbol,
        sm
      }
      range {
        chrom
        start
        end
      }
    }
  }
  # By default, try to get cREs overlapping the gene. In this case, there are none.
  dataSearch: data(assembly: $assembly, uuid: $uuid, search: $geneSearch, data: $dataEmpty) {
    total,
    rfacets,
    cres{
      info{
        accession
      }
    }
  }
}

query dataWithPagination(
  $assembly: Assembly!,
  $uuid: UUID!,
  $chromRangeSearch: SearchParameters!,
  $dataEmpty: DataParameters!,
  $pagination: PaginationParameters
) {
  # We can also paginate. We can return up to 1000 cREs for the first 10000
	dataPagination: data(assembly: $assembly, uuid: $uuid, , search: $chromRangeSearch, data: $dataEmpty, pagination: $pagination) {
    total,
    cres {
      info {
        accession
      }
    }
  }
}

query desearch {
  de_search(assembly: mm10, gene: "Kremen1", ct1: "C57BL/6_limb_embryo_11.5_days", ct2: "C57BL/6_limb_embryo_15.5_days") {
    coord {
      chrom
      start
      end
    },
    diffCREs,
    nearbyDEs,
    xdomain
  }
}

query suggestions{
  suggestions(query: "gapdh") {
    suggestions
  }
}

query geneexp_search {
  geneexp_search(assembly: hg19, gene: "GAPDH", biosample_types: ["tissue"], compartments: ["cell"]) {
    coords {
      chrom
      start
      end
      strand
    },
    gene,
    ensemblid_ver,
    itemsByRID,
    mean,
    single
  }
}

query gwas {
  gwas(assembly: hg19){
		gwas,
    study(study: "Lesch_18839057_ADHD"),
    cres(study: "Lesch_18839057_ADHD", cellType: "angular_gyrus_female_adult_75_years")
  }
}

query getCart($uuid: UUID!) {
  get_cart(uuid: $uuid) {
    accessions
  }
}

query gb($gbrange: InputChromRange!) {
  gb(assembly: hg19) {
    trackhubs,
    genetable(range: $gbrange)
  }
}

query trackhuburl($uuid: UUID!, $info: UCSCTrackhubInfo!) {
  ucsc_trackhub_url (uuid: $uuid, info: $info) {
    trackhuburl,
    url
  }
}

mutation SetCart($uuid: UUID!) {
  set_cart(uuid: $uuid, accessions: ["EH37E1090133", "EH37E0204932"]) {
    accessions
  }
}

```

Query Variables (below Document):
```
{
  "assembly": "hg19",
  "uuid": "59060ce0-6462-4498-990a-4e0e48844163",
  "dataEmpty": {},
  "dataCellType": {
    "cellType": "K562"
  },
  "rangeSearch": {
    "q": "chr1:5-5000000"
  },
  "geneSearch": {
    "q": "GAPDH"
  },
  "chromRangeSearch": {
    "q": "chr1"
  },
  "pagination": {
    "offset": 500,
    "limit": 3
  },
  "gbrange": {
    "chrom": "chr11",
    "start": 1,
    "end": 5000000
  },
  "info": {
    "accession": "EH37E1090133",
    "assembly": "hg19",
    "cellTypes": [
      "A549"
    ],
    "range": {
      "chrom": "chr11",
      "end": 5248621,
      "start": 5247589
    },
    "halfWindow": 7500,
    "showCombo": true
  }
}
```