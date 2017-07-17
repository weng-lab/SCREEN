export default function generateHeaders(handleClick,
  cols, columnkey, columnlabel, columnSort) {

  // generate our header (th) cell components
  return cols.map(function(colData, index) {

        if (columnSort.length > 0) {
          for (let i = 0; i < columnSort.length; i++) {

            // arrow icons for sorting
            let activeArrowColor,
             inactiveArrowColor = "#BEBEBE";

            // if inactive color gray
            if (columnSort[i].sortOn == 'inactive') {
              activeArrowColor = "#BEBEBE";
              // if active color blue
            } else if (columnSort[i].sortOn == 'active') {
              activeArrowColor = "#4682B4";
            }

            if (columnSort[i].column == colData[columnkey]
              && columnSort[i].sortOn != 'disabled') {
              // case when sorting is asc
              if (columnSort[i].direction == 'asc') {
                return <th key = { colData[columnkey] }
                        onClick={handleClick.bind(this,
                          colData[columnkey])}>
                          <tr>
                            <th>{ colData[columnlabel] }</th>
                            <th><font size="5" color = {activeArrowColor}>&#8595;</font>
                              <font color = {inactiveArrowColor} size="2">&#8593;</font>
                            </th>
                          </tr>
                        </th>;
              } else {
                // case when sorting is desc
                return <th key = { colData[columnkey] }
                          onClick={handleClick.bind(this, colData[columnkey])}>
                          <tr>
                            <th>{ colData[columnlabel] }</th>
                              <th><font color={inactiveArrowColor} size="2">&#8595;</font>
                              <font size="5" color={activeArrowColor}>&#8593;</font>
                            </th>
                          </tr>
                        </th>;
              }
            }
          }
        }
        return <th key = { colData[columnkey] }
                  onClick={handleClick.bind(this,
                    colData[columnkey])}>{ colData[columnlabel] }
                  </th>;
      });
    }
