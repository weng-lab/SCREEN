export default function packageColumnCells(handleCellClicks, rowClickedData, cols,
  columnkey, columnlabel, item) {
  let cells = [];

  for (let i = 0; i < cols.length; i++) {
    var colData = cols[i];
    var columnIndex = i;
    let columnName = colData[columnkey];


    if(!colData[columnlabel]) {
      continue;
    }

    if ("visible" in colData) {
      if (!colData["visible"])
        continue;
    }

    let search_item;

    if (colData["defaultContent"]) {
      search_item = colData.defaultContent;

    } else if (colData["render"]) {
      search_item = colData.render(item[columnName]);
    } else {

      search_item = item[columnName];
      // if data cannot be outputted, returns blank
      if (typeof(search_item) == 'object') {

        cells.push( < td className = {
            "text-center " + colData["className"]
          }
          onClick = {
            handleCellClicks.bind(this, columnIndex, columnkey)
          } > { } < /td>);

        continue;
      }

      // return data per row and column
      if (!isNaN(search_item)) {
        search_item = search_item.toLocaleString();
      }
    }



if(search_item) {
    cells.push( < td className = {
        "text-center " + colData["className"]
      }
      onClick = {
        handleCellClicks.bind(this, columnIndex, columnkey)
      } > {
        (search_item)
      } < /td>);

    } else {

      cells.push( < td className = {
          "text-center " + colData["className"]
        }
        onClick = {
          handleCellClicks.bind(this, columnIndex, columnkey)
        } > { } < /td>);

    }
    }

    return {cells, rowClickedData};
  }
