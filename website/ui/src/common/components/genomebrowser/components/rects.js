import React from 'react';
export default class Rects extends React.Component {

    componentDidMount(){
       this.changeheight(this.props);
    }
    componentWillReceiveProps(nextProps)  {
      if(this.props.y!==nextProps.y || this.props.height!==nextProps.height)
      this.changeheight(nextProps);
    }
  changeheight(nextProps)
  {
    if(nextProps.y > +(nextProps.height)-+(25))
    {
      nextProps.increaseheight("bigbeds");
    }
  }

       render()
       {
        var data=this.props.data;
        var y =this.props.y;
        var rects;
        var x=((+(this.props.x(+(this.props.min)))+ +(this.props.x(+(this.props.max)))/ +(2)))- +(200);

        if(data)
        {
            rects=data.map((d,i) => {
            if(+(this.props.x(d.min)) >= +(this.props.leftMargin) && (+(this.props.x(d.max)) <= this.props.width) )
            return ( <rect  x={this.props.x(d.min)} y={y} width={+(this.props.x(d.max))-+(this.props.x(d.min))} height="8" fill={d.itemRgb}
             stroke="none" strokeWidth="1px" key={i}  data-value={d.label} onMouseOver={this.props.showToolTip} onMouseOut={this.props.hideToolTip}/>);
            else
            return []
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
