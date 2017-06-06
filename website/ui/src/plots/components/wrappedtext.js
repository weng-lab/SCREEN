var React = require('react');

const WrappedText = ({ text, width, height, style }) => (
    <foreignObject width={width} height={height}>
        <p xmlns="http://www.w3.org/1999/xhtml" style={style}>{text}</p>
    </foreignObject>
);
export default WrappedText;
