import React from 'react';
import ReactDOM from 'react-dom';
import Voting from './vot';

const pair = ['asdfating', '28 Days Later'];

ReactDOM.render(
  <Voting pair={pair} />,
  document.getElementById('app')
);
