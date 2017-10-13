import React from 'react';
export default class Rects extends React.Component {
  

       render()
       {
        var data=this.props.data;
        var y =this.props.y;
        var rects;
        var x=((parseInt(this.props.x(this.props.min))+parseInt(this.props.x(this.props.max))/parseInt(2)))-parseInt(100);

        if(data)
        {
            rects=data.map((d,i) => {
            if(parseInt(this.props.x(d.min)) >= this.props.leftMargin && (parseInt(this.props.x(d.max)) <= this.props.width) )
            return ( <rect  x={this.props.x(d.min)} y={y} width={parseInt(this.props.x(d.max))-parseInt(this.props.x(d.min))} height="8" fill={d.itemRgb}
             stroke="none" strokeWidth="1px" key={i}  data-value={d.label} onMouseOver={this.props.showToolTip} onMouseOut={this.props.hideToolTip}/>);

        });
        }

        return(
            <g>
                {rects}
                <text x={x} y={y-5} style={{fontSize: 10 }} >{this.props.text}</text>
                <text x={0}  y={y+5} style={{fontSize: 10 }} >{this.props.shortLabel}</text>
            </g>
        );
      }
    }
