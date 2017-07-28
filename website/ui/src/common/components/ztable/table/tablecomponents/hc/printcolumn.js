export default function printColumn(colData, columnName,
  columnLabel, index, kclass, handleColumnClicks) {

  var printCols = true;

  if (columnLabel == null || columnLabel == undefined) {
    return {
      printCols: false,
      columnSortTypes: {
        direction: 'asc',
        sortOn: 'disabled'
      },
      columnHeader: undefined
    };
  }
  if (columnLabel == "") {
    return {
      printCols: false,
      columnSortTypes: {
        direction: 'asc',
        sortOn: 'disabled'
      },

      columnHeader: ( < th key = {
          index
        }
        className = {
          kclass
        }
        onClick = {
          handleColumnClicks.bind(this,
            columnName, index)
        } > {} < /th>)
      }
    }
    if ("visible" in colData) {
      if (!colData["visible"]) {
        return {
          printCols: false,
          columnSortTypes: {
            direction: 'asc',
            sortOn: 'disabled'
          },
          columnHeader: undefined
        }
      }
    }
    if ("orderable" in colData) {
      if (!colData["orderable"]) {
        return {
          printCols: true,
          columnSortTypes: {
            direction: 'asc',
            sortOn: 'disabled'
          },
          columnHeader: undefined
        };
      } else {
        return {
          printCols: true,
          columnSortTypes: {
            direction: 'asc',
            sortOn: 'inactive'
          },
          columnHeader: undefined
        };
      }
    } else {
      if ("columnSort" in colData) {
        return {
          printCols: true,
          columnSortTypes: colData["columnSort"],
          columnHeader: undefined
        };
      } else {
        return {
          printCols: true,
          columnSortTypes: {
            direction: 'asc',
            sortOn: 'inactive'
          },
          columnHeader: undefined
        };
      }
    }
    return {
      printCols: true,
      columnSortTypes: undefined,
      columnHeader: undefined

    }
  }
