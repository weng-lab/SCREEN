import React from 'react';

class GenerateRows extends React.Component
{


    render()
    {
        var cols = this.props.cols,  // [{key, label}]
            data = this.props.data,
	    columnkey = this.props.columnkey,
	    modifiedColumn = this.props.modifiedColumn;


        return data.map(function(item) {
            // handle the column data within each row
            var cells = cols.map(function(colData) {

var columnData = colData[columnkey];
switch (columnData) {
            case 'info':
                return <td><span><a href="https://www.w3schools.com/html/">{item[colData[columnkey]].accession}</a> </span> </td>;
            case 'ctspecifc':
                return <td>   


<svg width="50" height="50">
  <rect x="0" y="10" width="30" height="30" stroke="black" fill="transparent" stroke-width="5"/>
<rect x="30" y="10" width="30" height="30" stroke="black" fill="yellow" stroke-width="5"/>


</svg>



</td>;
            case 'genesallpc':
                return <td>pc:{   item[colData[columnkey]][1].map(function(colData) {return <span><a href="https://www.w3schools.com/html/">{colData}</a>, </span>;})                 } <br/> all:{   item[colData[columnkey]][0].map(function(colData) {return <span><a href="https://www.w3schools.com/html/">{colData}</a>, </span>;}) }</td>;
case 'in_cart':
        if (item[colData[columnkey]])
    return <td><button type="button">-</button></td>;

    return <td><button type="button" >+</button> </td>;

case 'genomebrowsers':
                return <td><button type="button" >UCSC</button> </td>;
default: 

        }

                return <td>{item[colData[columnkey]]}</td>;
            });
            return <tr key={item.id}> {cells} </tr>;
        });
   

     
    }



}



export default GenerateRows;
