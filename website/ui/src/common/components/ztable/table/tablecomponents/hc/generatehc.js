export default function arrowDirectionality(columnHeader, columnName, columnLabel,
  kclass, handleColumnClicks, index, inactiveArrowColor, arrowDirection){
    if (arrowDirection) {
      columnHeader.push( <th key = { columnName }
        className = { kclass }
        onClick = { handleColumnClicks.bind(this, columnName,
            index) }>
        <tr>
        <th>
        { columnLabel } </th>
        <th>  { arrowDirection }
            </th>
          </tr>
        </th> );
    } else {
      columnHeader.push( <th key = { columnName }
                className = { kclass }
                onClick = { handleColumnClicks.bind(this, columnName, index)
                }> { columnLabel } </th>);
    }
}
