/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";
import { ZHelpTooltip } from "../../../common/components/help_icon";
import * as ZRender from "../../../common/zrenders";

const vistalinks = (x) => {
  if (x === null) {
    return "--";
  }
  let xx = x.split(",");
  return (
    <div>
      VISTA:{" "}
      {xx.map((v, i) => (
        <span>
          {vistalink(v)}
          {i < xx.length - 1 ? ", " : ""}
        </span>
      ))}
    </div>
  );
};

const vistalink = (id) => (
  <a
    href={
      "https://enhancer.lbl.gov/cgi-bin/imagedb3.pl?form=presentation&show=1&experiment_id=" +
      id.substring(2) +
      "&organism_id=" +
      (id[0] === "m" ? "2" : "1")
    }
    target="_blank"
  >
    {id}
  </a>
);

export const TableColumns = ({ globals, assembly, rfacets, uuid }, cts) => {
  const accHelp = () => (
    <span>
      accession
      <br />
      {ZHelpTooltip(globals, "CellTypeTableAccessionCol")}
    </span>
  )

  const sctHelp = () => (
    <span>
      {cts}
      <br />
      {ZHelpTooltip(globals, "CellTypeSpecifiedClassification")}
    </span>
  );

  const geneHelp = () => (
    <span>
      nearest genes:
      <br />
      protein-coding / all&nbsp;&nbsp;
      {"mm10" === assembly && ZHelpTooltip(globals, "DifferentialGeneMouse")}
    </span>
  );

  const tz = (name, cts) =>
    cts ? (
      <span>
        {name} Z in
        <br />
        {cts}
      </span>
    ) : (
      <span>
        {name}
        <br />
        max-Z
      </span>
    );

  return [
    {
      header: "accession",
      headerRender: row => accHelp(),
      value: row => row.info,
      render: row => ZRender.creTableAccession(globals)(row.info),
    },
    {
      header: "dnase",
      headerRender: x => tz("DNase", cts),
      value: row => row.dnase_zscore,
      render: row => ZRender.real(row.dnase_zscore),
      visible: rfacets.includes("dnase"),
      width: "7%",
    },
    {
      header: "promoter",
      headerRender: x => tz("H3K4me3", cts),
      value: row => row.promoter_zscore,
      render: row => ZRender.real(row.promoter_zscore),
      visible: rfacets.includes("promoter"),
      width: "7%",
    },
    {
      header: "enhancer",
      headerRender: x => tz("H3K27ac", cts),
      value: row => row.enhancer_zscore,
      render: row => ZRender.real(row.enhancer_zscore),
      visible: rfacets.includes("enhancer"),
      width: "7%",
    },
    {
      header: "ctcf",
      headerRender: x => tz("CTCF", cts),
      value: row => row.ctcf_zscore,
      render: row => ZRender.real(row.ctcf_zscore),
      visible: rfacets.includes("ctcf"),
      width: "7%",
    },
    {
      header: "chr",
      value: x => x.chrom,
    },
    {
      header: "start",
      value: x => x.start,
      render: row => ZRender.numWithCommas(row.start),
    },
    {
      header: "length",
      value: row => row.len,
      render: row => ZRender.numWithCommas(row.len),
    },
    {
      header: "genes",
      headerRender: x => geneHelp(),
      value: x => x.genesallpc,
      className: "geneexp",
      render: row => ZRender.geneDeLinks(assembly, uuid)(row.genesallpc),
      orderable: false,
    },
    {
      header: "cart",
      value: x => x.in_cart,
      className: "cart",
      render: (d) => ZRender.cart_img(d, false),
      orderable: false,
    },
    {
      headerRender: x => (<span>genome<br />browsers</span>),
      value: x => null,
      className: "browser",
      targets: -1,
      orderable: false,
      render: row => ZRender.browser_buttons(["UCSC"]),
    },
  ];
};


export default TableColumns;

export const table_order = ["dnase_zscore", false];
