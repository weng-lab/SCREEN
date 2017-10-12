import React from 'react';

export default class Exons extends React.Component {
  handleNextClick = (r) => {
      this.props.nextExon(r);
    }
  handlePrevClick = (r) => {
        this.props.prevExon(r);
      }
      componentDidMount(){
         this.changeheight(this.props);
      }
      componentWillReceiveProps(nextProps)  {
        if(this.props.range!=nextProps.range || this.props.height!=nextProps.height)
        this.changeheight(nextProps);
      }
    changeheight(nextProps)
    {
      if(nextProps.range > nextProps.height-30)
      {
        nextProps.increaseheight("exons");
      }
    }
  render() {


    let exon =this.props.data,t =this.props.transcript_id.split("."),transcript_id=t[0];
    let res = Math.max.apply(Math,exon.map(function(o){return o.exon_number;}))
    let y = this.props.range,introns = [],paths = [],exonarr=[],arrows =[];
    //backward prev exons
    let leftarr = +(this.props.leftMargin),leftarrup=+(this.props.leftMargin) + +(5),leftarrdn=+(this.props.leftMargin) + +(10);

    const ps1 = "M "+leftarr+" " + (y+5) +" L "+leftarrup+" "+(y)+" L "+leftarrup+" "+(y+10)+"Z"// M 100 y+5 L 105 y-10 L 105 y Z
    const ps2 = "M "+leftarrup+" " + (y+5) +" L "+leftarrdn+" "+(y)+" L "+leftarrdn+" "+(y+10)+"Z"// M 100 y+5 L 105 y-10 L 105 y Z
    //forward next exons
    const pe1 = "M 1200 " + (y+5) +" L 1195 "+(y)+" L 1195 "+(y+10)+"Z"// M 100 y+5 L 105 y-10 L 105 y Z
    const pe2 = "M 1195 " + (y+5) +" L 1190 "+(y)+" L 1190 "+(y+10)+"Z"// M 100 y+5 L 105 y-10 L 105 y Z

    const rects=exon.map((d,i) => {
      let exoncount= "Exon "+ d.exon_number+"/"+res,check=false;
      if((this.props.x(d.end) > this.props.leftMargin)  && (this.props.x(d.start) < this.props.width ))
      {
        let width =parseInt(this.props.x(d.end))-parseInt(this.props.x(d.start)),x=this.props.x(d.start),ex="";
        if(this.props.x(d.start) < this.props.leftMargin)
        {
          width= parseInt(this.props.x(d.end))-parseInt(this.props.leftMargin);
          x=this.props.leftMargin;
          check=true;

          if(d.strand==="-")
            ex="end of exon "+ d.exon_number+"/"+res
          else
            ex="start of exon "+ d.exon_number+"/"+res
          paths.push(<path d={ps1} key={Math.random()} stroke="#8B0000" fill="white" x={this.props.leftMargin} y={y-5} onClick={()=>this.handlePrevClick(d.start)} />)
          paths.push(<path d={ps2} key={Math.random()} stroke="#8B0000" fill="white" x={this.props.leftMargin} y={y-5} data-value={ex} onMouseOver={this.props.showToolTip} onMouseOut={this.props.hideToolTip}/>)

        }
        //chr11:5526573-5526739
        if(this.props.x(d.end) > this.props.width)
        {
          if(check===true)
              width= parseInt(this.props.width)-parseInt(x)
          else
              width= parseInt(this.props.width)-parseInt(this.props.x(d.start));
          if(d.strand==="-")
              ex="start of exon "+ d.exon_number+"/"+res
          else
              ex="end of exon "+ d.exon_number+"/"+res
          paths.push(<path d={pe1} key={Math.random()} stroke="#8B0000" fill="white" x="1150" y={y-5}  onClick={()=>this.handleNextClick(d.end)}   />)
          paths.push(<path d={pe2} key={Math.random()} stroke="#8B0000" fill="white" x="1150" y={y-5} data-value={ex} onMouseOver={this.props.showToolTip} onMouseOut={this.props.hideToolTip}/>)
        }

        if(d.type==="CDS")
        {
          return (<rect  x={x} fill="#8B0000" y={y} width={width} height="10"
           stroke="none" strokeWidth="1px" key={i} data-value={exoncount} onMouseOver={this.props.showToolTip} onMouseOut={this.props.hideToolTip} />);
        }
        else
        {
          return (<rect  x={x} fill="#8B0000" y={y+2} width={width} height="6"
           stroke="none" strokeWidth="1px" key={i}  data-value={exoncount} onMouseOver={this.props.showToolTip} onMouseOut={this.props.hideToolTip}/>);
        }
      }
    });

    exonarr = exon.filter( (d) =>
    {
        return (d.type === 'exon');
    });

    exonarr.sort(function(a, b) {
    return a.exon_number - b.exon_number;
    });

    for(let i=0; i< exonarr.length;i++)
    {
        let intron="Intron "+(i+1)+"/"+(exonarr.length-1),start,end,prevexon,nextexon,ne,pe;

        if(i=== exonarr.length-1)
          break;

        start=this.props.x(exonarr[i].start)
        end=this.props.x(exonarr[i+1].start)

        if(end<=this.props.leftMargin)
          end=this.props.leftMargin

        if(start >= this.props.width)
          start=this.props.width

        if(start <= this.props.leftMargin)
          start =this.props.leftMargin

        if( end >= this.props.width)
          end=this.props.width

        if(start!==end)
        {
          if(exonarr[i].strand==="-")
          {
            prevexon="Prev Exon "+(exonarr[i+1].exon_number)+"/"+(res)
            nextexon="Next Exon "+(exonarr[i].exon_number)+"/"+(res) ;
          }
          else
          {
            prevexon="Prev Exon "+(exonarr[i].exon_number)+"/"+(res)
            nextexon="Next Exon "+(exonarr[i+1].exon_number)+"/"+(res) ;
          }
          if(start ===this.props.leftMargin || end ===this.props.leftMargin)
          {
            if(exonarr[i].strand==="-")
              pe=exonarr[i+1].start
            else
              pe=exonarr[i].start

            paths.push(<path d={ps1} key={Math.random()} stroke="#8B0000" fill="white" x={this.props.leftMargin} y={y-5} data-value={prevexon}  onClick={()=>this.handlePrevClick(pe)} />)
            paths.push(<path d={ps2} key={Math.random()} stroke="#8B0000" fill="white" x={this.props.leftMargin} y={y-5} data-value={prevexon} onMouseOver={this.props.showToolTip} onMouseOut={this.props.hideToolTip}/>)
          }
          if(start ===this.props.width || end ===this.props.width)
          {
            if(exonarr[i].strand==="-")
              ne=exonarr[i].end
            else
              ne=exonarr[i+1].end

            paths.push(<path d={pe1} key={Math.random()} stroke="#8B0000" fill="white" x="1150" y={y-5} data-value={nextexon} onClick={()=>this.handleNextClick(ne)}  />)
            paths.push(<path d={pe2} key={Math.random()} stroke="#8B0000" fill="white" x="1150" y={y-5} data-value={nextexon} onMouseOver={this.props.showToolTip} onMouseOut={this.props.hideToolTip}/>)
          }
          introns.push(<line key={i} x1={start} y1={y+5} x2={end} y2={y+5}
          strokeWidth="1" stroke="#8B0000" opacity="0.5" x={(start+end)/2} y={y-5}  data-value={intron} onMouseOver={this.props.showToolTip} onMouseOut={this.props.hideToolTip} /> )
        }
       //left and right arrows
       if(start > end)
       {
         for(let j=(start-10);j >=(end);j-=15)
         {
           const p1 = "M " + (j+5)+" " + (y+2) +" L "+ (j)+" " +(y+5)+" L "+(j+5)+" "+(y+8)// M 100 y+5 L 105 y-10 L 105 y Z
              arrows.push(<path d={p1} key={Math.random()} stroke="#8B0000" fill="none" opacity="0.5" />)
         }
       }
       else if (start < end)
       {
         for(let j=(start+20);j <= (end);j+=15)
         {
           const p1 = "M " + (j-5)+" " + (y+2) +" L "+ (j)+" " +(y+5)+" L "+(j-5)+" "+(y+8)// M 100 y+5 L 105 y-10 L 105 y Z
              arrows.push(<path d={p1} key={Math.random()} stroke="#8B0000" fill="none" opacity="0.5"/>)

         }
       }
    }

   return (
     <g>
       <text x={0} y={y+5} style={{fontSize: 10 }} fill="#8B0000" >{transcript_id}</text>
       {introns}
       {rects}
       {paths}
       {arrows}
     </g>
   )
  }
}
