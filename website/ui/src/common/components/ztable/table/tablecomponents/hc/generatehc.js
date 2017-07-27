import { Glyphicon } from 'react-bootstrap';

export function generateHC(columnHeader, columnName,
  columnLabel, kclass, handleColumnClicks, index){
  columnHeader.push( <th key = { columnName }
            className = { kclass }
            onClick = { handleColumnClicks.bind(this, columnName, index)
            }> { columnLabel } </th>);
}

export function inactiveArrow(columnHeader, columnName, columnLabel,
  kclass, handleColumnClicks, index, inactiveArrowColor){
  columnHeader.push( <th key = { columnName }
    className = { kclass }
    onClick = { handleColumnClicks.bind(this, columnName,
        index) }>
    <tr>
    <th>
    { columnLabel } </th>
    <th>  <font color = { inactiveArrowColor }
    size = "3" ><Glyphicon glyph="sort" /></font>
        </th>
      </tr>
    </th> );
}

export function activeAscArrow(columnHeader, columnLabel,
  columnName, kclass, handleColumnClicks, index, activeArrowColor){
  columnHeader.push( <th key = { columnName }
    className = { kclass }
    onClick = { handleColumnClicks.bind(this, columnName,
        index) }>
    <tr>
    <th>
    { columnLabel } </th>
    <th><font size = "3" color = { activeArrowColor } >
    <Glyphicon glyph="sort-by-attributes" /></font>
        </th>
      </tr>
    </th> );
}

export function activeDescArrow(columnHeader, columnLabel,
  columnName, kclass, handleColumnClicks, index, activeArrowColor){
  columnHeader.push( <th key = { columnName }
    className = { kclass }
    onClick = { handleColumnClicks.bind(this, columnName,
        index) }>
    <tr>
    <th>
    { columnLabel } </th>
    <th><font size = "3" color = { activeArrowColor } >
    <Glyphicon glyph="sort-by-attributes-alt" /></font>
        </th>
      </tr>
    </th> );
}
