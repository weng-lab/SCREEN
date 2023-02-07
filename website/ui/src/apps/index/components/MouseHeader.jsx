import React from "react"

const MouseHeader = (props) => (
  <svg viewBox="0 0 1200 200">
    <g transform="translate(1000,0)">
      <image
        width={200}
        height={200}
        xlinkHref="data:image/png;base64,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"
      />
    </g>
    <line x1={0} x2={1000} y1={102} y2={102} strokeWidth={1} stroke="#000000" />
    <text x={970} y={80} color="" style={{ fontSize: "60px", textAnchor: "end" }}>
      Mouse
    </text>
    <text x={970} y={150} style={{ fontSize: "40px", textAnchor: "end" }} fill="#555555">
      {props.reCount} • {props.ctCount}
    </text>
  </svg>
)

export const InverseMouseHeader = (props) => (
  <svg viewBox={`0 0 ${props.width || 1200} 200`} style={{ width: "100%" }}>
    <image
      width={200}
      height={200}
      transform="scale(-0.7,0.7) translate(-175,0)"
      xlinkHref="data:image/png;base64,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"
    />
    <line x1={108} x2={props.width || 1200} y1={102} y2={102} strokeWidth={1} stroke="#000000" />
    <text x={130} y={80} style={{ fontSize: "60px" }}>
      Mouse
    </text>
    <text x={135} y={150} style={{ fontSize: "40px" }} fill="#555555">
      {props.reCount} • {props.ctCount}
    </text>
  </svg>
)

export default MouseHeader
