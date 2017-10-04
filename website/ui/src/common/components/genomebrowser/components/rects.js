import React from 'react';
function Rects (props) {

        var data=props.data;
        var y =props.y;
        var rects;
        var x=((parseInt(props.x(props.min))+parseInt(props.x(props.max))/parseInt(2)))-parseInt(100);

        if(data)
        {
            rects=data.map((d,i) => {
            if(parseInt(props.x(d.min)) >= props.leftMargin && (parseInt(props.x(d.max)) <= props.width) )
            return ( <rect  x={props.x(d.min)} y={y} width={parseInt(props.x(d.max))-parseInt(props.x(d.min))} height="6" fill={d.itemRgb} opacity="0.6"
             stroke="none" strokeWidth="1px" key={i}  data-value={d.label} onMouseOver={props.showToolTip} onMouseOut={props.hideToolTip}/>);

        });
       }
        return(
            <g>
                {rects}
                <text x={x} y={y-10} >{props.text}</text>
                <text x={0} y={y+5}>{props.shortLabel}</text>
            </g>
        );
    }

export default Rects
