
import React from 'react';


class ZTableRow extends React.Component {


   render() {
        var headerComponents = this.generateHeaders(),
            rowComponents = this.generateRows();

        return (
            <table style={{"width": "100%"}}>
                <thead>{headerComponents}</thead>
                <tbody> {rowComponents} </tbody>
            </table>
        );
    }

    generateHeaders() {
        var cols = this.props.cols;  // [{key, label}]

        // generate our header (th) cell components
        return cols.map(function(colData) {
            return <th key={colData.key}>{colData.label}</th>;
        });
    }

    generateRows() {
        var cols = this.props.cols,  // [{key, label}]
            data = this.props.data;

        return data.map(function(item) {
            // handle the column data within each row
            var cells = cols.map(function(colData) {

                // colData.key might be "firstName"
                return <td> {item[colData.key]} </td>;
            });
            return <tr key={item.id}> {cells} </tr>;
        });
    }





    
}


export default ZTableRow;

