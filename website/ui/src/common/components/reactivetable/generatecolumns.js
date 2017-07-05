import React from 'react';


class GenerateColumns extends React.Component
{

    render()
    {

        var cols = this.props.cols,  // [{key, label}]
	columnkey = this.props.columnkey,
        columnlabel=this.props.columnlabel;

        var headerComponents = cols.map(function(colData) {
            return <th key={colData[columnkey]}>{colData[columnlabel]}</th>;
        });
        return <tr>{headerComponents}</tr>;

    }




}


export default GenerateColumns;
