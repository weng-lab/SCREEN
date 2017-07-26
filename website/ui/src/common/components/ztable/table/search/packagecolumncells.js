export default function packageColumnCells(handleCellClicks, positionText, cols,
  columnkey, columnlabel, item) {
  let cells = [];

  for (let i = 0; i < cols.length; i++) {

    let search_item;

    var colData = cols[i];
    var columnIndex = i;
    let columnName = colData[columnkey];
    var kclass = "";
    if (colData[columnlabel] == null || colData[columnlabel] == undefined) {
      continue;
    }

    if ("visible" in colData) {
      if (!colData["visible"])
        continue;
    }

    if ("className" in colData) {
      kclass = positionText + colData["className"];
    }


    if (colData["defaultContent"]) {
      search_item = colData.defaultContent;

    } else if (colData["render"]) {
      search_item = colData.render(item[columnName]);
    } else {

      search_item = item[columnName];
      // if data cannot be outputted, returns blank
      if (typeof(search_item) == 'object') {
        cells.push( < td className = {
            kclass
          }
          onClick = {
            handleCellClicks.bind(this, columnIndex, columnkey, kclass)
          } > {} < /td>);

          continue;
        }

        // return data per row and column
        if (!isNaN(search_item)) {
          search_item = search_item.toLocaleString();
        }
      }

      if (search_item) {
        cells.push( < td className = {
            kclass
          }
          onClick = {
            handleCellClicks.bind(this, columnIndex, columnkey, kclass)
          } > {
            (search_item)
          } < /td>);

        }
        else {

          cells.push( < td className = {
              kclass
            }
            onClick = {
              handleCellClicks.bind(this, columnIndex, columnkey, kclass)
            } > {} < /td>);

          }
        }

        return cells;
      }
