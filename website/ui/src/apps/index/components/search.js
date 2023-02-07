import React from "react"

const SearchIcon = ({ title, number, onClick }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ width: "100%", height: "0.2em", backgroundColor: "#888888" }} />
    <span style={{ textAlign: "center", fontSize: "1.0em", fontWeight: "bold" }}>{title}</span>
    <br />
    <span style={{ textAlign: "center", fontSize: "0.9em" }}>({number} cell types)</span>
    <br />
    <a href="#" onClick={onClick} style={{ paddingTop: "0.3em" }}>
      <svg className="bi bi-search" width="2em" height="2em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          d="M10.442 10.442a1 1 0 011.415 0l3.85 3.85a1 1 0 01-1.414 1.415l-3.85-3.85a1 1 0 010-1.415z"
          clipRule="evenodd"
        />
        <path
          fillRule="evenodd"
          d="M6.5 12a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM13 6.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
          clipRule="evenodd"
        />
      </svg>
    </a>
  </div>
)
export default SearchIcon
