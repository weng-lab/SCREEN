export default function generateHeaders(handleColumnClicks,
  cols, columnkey, columnlabel, columnSort) {
let columnHeader = [];
for (let index = 0; index < cols.length; index++) {

  var colData = cols[index];


if ("columnSort" in colData){
  var columnClicksKey = colData;
} else {
  var columnClicksKey = colData[columnkey];

}

          if (columnSort.length > 0) {
            for (let i = 0; i < columnSort.length; i++) {

              // arrow icons for sorting
              var activeArrowColor,
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
                  columnHeader.push(<th key = { colData[columnkey] }
                          onClick={handleColumnClicks.bind(this,
                            columnClicksKey)}>
                            <tr>
                              <th>{ colData[columnlabel] }</th>
                              <th><font size="5" color = {activeArrowColor}>&#8595;</font>
                                <font color = {inactiveArrowColor} size="2">&#8593;</font>
                              </th>
                            </tr>
                          </th> );
                } else {
                  // case when sorting is desc
                  columnHeader.push( <th key = { colData[columnkey] }
                            onClick={handleColumnClicks.bind(this, columnClicksKey)}>
                            <tr>
                              <th>{ colData[columnlabel] }</th>
                                <th><font color={inactiveArrowColor} size="2">&#8595;</font>
                                <font size="5" color={activeArrowColor}>&#8593;</font>
                              </th>
                            </tr>
                          </th>);
                }
              }
            }
          }
          columnHeader.push( <th key = { colData[columnkey] }
                    onClick={handleColumnClicks.bind(this,
                      columnClicksKey)}>{ colData[columnlabel] }
                    </th>);
        }




  // generate our header (th) cell components
  return columnHeader;
    }
