/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Loader, Menu, Checkbox, Modal, Button, Icon, Message, Header } from "semantic-ui-react"
import { associateBy, groupBy } from "queryz"
import { linearTransform } from "jubilant-carnival"
import { DataTable } from "ts-ztable"
import { ApolloClient, ApolloProvider, gql, InMemoryCache, useQuery } from "@apollo/client"

import loading from "../../../common/components/loading"
import HelpIcon from "../../../common/components/help_icon"
import { LoadingMessage, ErrorMessage } from "../../../common/utility"

import Ztable from "../../../common/components/ztable/ztable"
import * as ApiClient from "../../../common/api_client"

import GeneExp from "../../geneexp/components/gene_exp"
import Rampage from "../components/rampage"
import MiniPeaks from "../components/minipeaks"

import { capRange, expandCoordinates, QUERY } from "../components/results_table_container"
import CytobandView from "../components/Cytobands"
import { ENTEXTracks, etracks } from "../components/DefaultTracks"
import { DNALogo } from "logots-react"
import { B_COLOR_MAP } from "./colors"

import { CSVLink } from "react-csv"

import * as Render from "../../../common/zrenders"
import { GraphQLImportanceTrack } from "bpnet-ui"
import {
  WrappedRulerTrack,
  DenseBigBed,
  EmptyTrack,
  WrappedTrack,
  GraphQLTranscriptTrack,
  GraphQLTrackSet,
  StackedTracks,
  WrappedSquishTranscriptTrack,
  RulerTrack,
  SquishTranscriptTrack,
  WrappedFullBigWig,
  WrappedDenseBigBed,
  UCSCControls,
  GenomeBrowser,
  PackTranscriptTrack,
  SquishBigBed,
  FullBigWig,
} from "umms-gb"

import {
  TopTissuesTables,
  NearbyGenomicTable,
  LinkedGenesTable,
  ChromHMMTables,
  TfIntersectionTable,
  OrthologTable,
  FantomCatTable,
  // GroundLevelTables, never used
  FunctionalValidationTable,
} from "./details_tables"

// these are datasets that need to be moved out of the project
// import { DATASETS, FILES } from "./data/data"
import { ENTEX } from "./entex"
import { MOTIFS } from "../../../common/all-motifs"

export const DATASETS = {
  "Kevin White": [
    { biosample_summary: "HCT116 genetically modified using transient transfection", accession: "ENCSR064KUD", replicates: 2 },
    { biosample_summary: "K562 genetically modified using transient transfection", accession: "ENCSR858MPS", replicates: 2 },
    { biosample_summary: "DNA cloning sample", accession: "ENCSR316NSE", replicates: 1 },
    { biosample_summary: "MCF-7 genetically modified using transient transfection", accession: "ENCSR547SBZ", replicates: 2 },
    { biosample_summary: "A549 genetically modified using transient transfection", accession: "ENCSR895FDL", replicates: 2 },
    { biosample_summary: "DNA cloning sample", accession: "ENCSR002ZDU", replicates: 1 },
    { biosample_summary: "SH-SY5Y genetically modified using transient transfection", accession: "ENCSR983SZZ", replicates: 2 },
    { biosample_summary: "HepG2 genetically modified using transient transfection", accession: "ENCSR135NXN", replicates: 2 },
    { biosample_summary: "DNA cloning sample", accession: "ENCSR024WBS", replicates: 1 },
  ],
  "Tim Reddy": [
    {
      biosample_summary: "A549 genetically modified using transient transfection treated with 1 \u03bcM Hydrocortisone for 4 hours",
      accession: "ENCSR261RMM",
      replicates: 16,
    },
    {
      biosample_summary: "A549 genetically modified using transient transfection treated with 1 \u03bcM DMSO for 4 hours",
      accession: "ENCSR005XEA",
      replicates: 16,
    },
    {
      biosample_summary: "A549 genetically modified using transient transfection treated with 1 \u03bcM Mapracorat for 4 hours",
      accession: "ENCSR687CTB",
      replicates: 16,
    },
    {
      biosample_summary: "A549 genetically modified using transient transfection treated with 100 nM dexamethasone for 4 hours",
      accession: "ENCSR418VQU",
      replicates: 5,
    },
    {
      biosample_summary: "A549 genetically modified using transient transfection treated with 100 nM dexamethasone for 8 hours",
      accession: "ENCSR426EKB",
      replicates: 5,
    },
    { biosample_summary: "A549 genetically modified using transient transfection", accession: "ENCSR292EDU", replicates: 5 },
    {
      biosample_summary: "A549 genetically modified using transient transfection treated with 1 \u03bcM AZD9567 for 4 hours",
      accession: "ENCSR262PQN",
      replicates: 16,
    },
    {
      biosample_summary: "A549 genetically modified using transient transfection treated with 1 \u03bcM CORT108297 for 4 hours",
      accession: "ENCSR543JLA",
      replicates: 16,
    },
    {
      biosample_summary: "A549 genetically modified using transient transfection treated with 100 nM dexamethasone for 12 hours",
      accession: "ENCSR220FPS",
      replicates: 5,
    },
    {
      biosample_summary: "A549 genetically modified using transient transfection treated with 1 \u03bcM RU486 for 4 hours",
      accession: "ENCSR319VAS",
      replicates: 16,
    },
    {
      biosample_summary: "A549 genetically modified using transient transfection treated with 1 \u03bcM GW870086 for 4 hours",
      accession: "ENCSR534WIF",
      replicates: 16,
    },
    {
      biosample_summary: "A549 genetically modified using transient transfection treated with 100 nM dexamethasone for 1 hour",
      accession: "ENCSR646KIT",
      replicates: 5,
    },
    {
      biosample_summary: "A549 genetically modified using transient transfection treated with 1 \u03bcM AZD2906 for 4 hours",
      accession: "ENCSR282GET",
      replicates: 16,
    },
    {
      biosample_summary: "A549 genetically modified using transient transfection treated with 1 \u03bcM CpdA for 4 hours",
      accession: "ENCSR176UAM",
      replicates: 16,
    },
    {
      biosample_summary: "A549 genetically modified using transient transfection treated with 1 \u03bcM ZK216348 for 4 hours",
      accession: "ENCSR802ODH",
      replicates: 16,
    },
    {
      biosample_summary: "A549 genetically modified using transient transfection treated with 1 \u03bcM dexamethasone for 4 hours",
      accession: "ENCSR459NUS",
      replicates: 16,
    },
  ],
}

const FILES = {
  ...{
    ENCSR024WBS: { signal: [], peaks: [] },
    ENCSR135NXN: {
      signal: [
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/b6d0eb93-c751-430c-bc3f-c16efc444337/ENCFF786XDA.bigWig", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/4a1607df-0fa3-4fdf-b1c3-0b1792e4cde7/ENCFF876PFZ.bigWig", r: [2] },
      ],
      peaks: [
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/00538f6b-c894-4fc6-8501-8083856f0914/ENCFF297XKE.bigBed", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/84d76261-9139-4245-ac40-1fa2b882958a/ENCFF508OJR.bigBed", r: [2] },
      ],
    },
    ENCSR316NSE: { signal: [], peaks: [] },
    ENCSR858MPS: {
      signal: [
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/0c463d33-22cb-4dd3-852c-9f9ad5813090/ENCFF967QSD.bigWig", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/01528a95-37f7-4938-98bb-a88beb14c956/ENCFF887EVW.bigWig", r: [2] },
      ],
      peaks: [
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/f707e01a-029e-4e35-a899-98e6d73903e0/ENCFF478MZU.bigBed", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/198c943d-765d-45de-b871-b29d46546a9e/ENCFF024SPT.bigBed", r: [2] },
      ],
    },
    ENCSR983SZZ: {
      signal: [
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/fcccb3c5-eb08-4af8-84fb-723d6cb887fc/ENCFF795WFE.bigWig", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/e19c1f9c-e28b-4543-b2ef-e8105199ef08/ENCFF970DUB.bigWig", r: [2] },
      ],
      peaks: [
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/0569d5af-ae69-452e-98cb-018ec6baea87/ENCFF257XZM.bigBed", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/f8a61540-ba40-4728-9fae-cc604d334d6f/ENCFF555BQI.bigBed", r: [2] },
      ],
    },
    ENCSR002ZDU: { signal: [], peaks: [] },
    ENCSR547SBZ: {
      signal: [
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/4a0dc0b2-7e3f-4ee0-96e7-1310d1ed57fb/ENCFF346FGQ.bigWig", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/3f5eb2d5-fc4f-476a-95b5-929147a287cb/ENCFF923TMH.bigWig", r: [2] },
      ],
      peaks: [
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/0b6ceb48-cfe1-46a0-a25e-c098bc482d2e/ENCFF999KNU.bigBed", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/83be4574-db60-487d-906a-e7b70ede2a5e/ENCFF868OLJ.bigBed", r: [2] },
      ],
    },
    ENCSR895FDL: {
      signal: [
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/da5f34e0-fc0d-49a8-8178-1a5161bfbfe5/ENCFF313JFB.bigWig", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/2a235d4f-ef70-4581-9bd5-16ccbc248d96/ENCFF145PAF.bigWig", r: [2] },
      ],
      peaks: [
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/2c1b98c5-ccb4-474c-958c-39582b5726a3/ENCFF285ONZ.bigBed", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/70de4601-4f43-4f48-9a0c-2fcad3633d3d/ENCFF464KWC.bigBed", r: [2] },
      ],
    },
    ENCSR064KUD: {
      signal: [
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/1605cb06-ac40-4b14-bc63-e507483091f0/ENCFF386JMD.bigWig", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/8e3fc1c4-8add-430c-abfd-b0b208f99087/ENCFF440SPZ.bigWig", r: [2] },
      ],
      peaks: [
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/0b5b6206-b2d0-4b74-80c6-009ca0d38fbc/ENCFF273BHD.bigBed", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2020/04/22/dc792ff9-1fd3-4e47-b253-a82c814a95e9/ENCFF600SPU.bigBed", r: [2] },
      ],
    },
  },
  ...{
    ENCSR802ODH: {
      peaks: [
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/7e6e3de4-507d-4393-8d2d-d953e7ab2355/ENCFF789KNT.bigBed", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/faffbd35-60bf-433f-9d6b-ed5955c14913/ENCFF107RSS.bigBed", r: [2] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/a0f7b4a2-f464-4fec-a9ce-9cbdfe16d6a3/ENCFF507VGR.bigBed", r: [3] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/822c1f4c-df1f-439f-83b4-f8ffa71a91fe/ENCFF599GTJ.bigBed", r: [4] },
      ],
    },
    ENCSR262PQN: {
      peaks: [
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/afc80c38-bf01-4714-a219-3ae6cf5bbbc9/ENCFF571FCV.bigBed", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/ac592f2b-0eab-41f6-92fb-1af071614932/ENCFF610ZMP.bigBed", r: [2] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/ba4a9796-4e59-4055-ac72-d0e486b89213/ENCFF988IXU.bigBed", r: [3] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/e670e749-c97b-4aa6-a2d7-e3e4cd35e874/ENCFF624UQI.bigBed", r: [4] },
      ],
    },
    ENCSR005XEA: {
      peaks: [
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/278d69af-7c4c-42a1-9720-bfa47b6f67ca/ENCFF617NPW.bigBed", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/fdff5f05-ffea-43e1-8a57-4babb60dc2c3/ENCFF662CFP.bigBed", r: [2] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/2801438f-1399-4e6a-8c51-bbc78477a6e7/ENCFF109ORQ.bigBed", r: [3] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/73ba6c95-ccbb-46b2-8dfc-dbd0263fb86d/ENCFF380ZIA.bigBed", r: [4] },
      ],
    },
    ENCSR418VQU: { peaks: [] },
    ENCSR543JLA: {
      peaks: [
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/35e2110f-eaaa-4fd7-9fc1-0e77acfc5ef9/ENCFF585PRZ.bigBed", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/3b639a84-5745-488a-b0da-4c7144de7cb6/ENCFF920TWR.bigBed", r: [2] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/ce5bee3b-992a-4d59-867a-25a5756372dd/ENCFF043JSF.bigBed", r: [3] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/52f03132-b4f1-414c-ada2-3c8eb7e85b14/ENCFF527DZX.bigBed", r: [4] },
      ],
    },
    ENCSR646KIT: { peaks: [] },
    ENCSR426EKB: { peaks: [] },
    ENCSR282GET: {
      peaks: [
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/ce206a16-0640-4f8f-bf68-f0d464b9cd1c/ENCFF766HYP.bigBed", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/5e07502b-580c-42b5-a34e-fc35ec82d5d4/ENCFF005ZDV.bigBed", r: [2] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/4ab5de0e-cc9f-40a4-93e4-9b7cc4c34e0e/ENCFF420FYE.bigBed", r: [3] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/09e4c864-5dbe-4dda-9b3f-7be38af55684/ENCFF688PRM.bigBed", r: [4] },
      ],
    },
    ENCSR220FPS: { peaks: [] },
    ENCSR292EDU: { peaks: [] },
    ENCSR176UAM: {
      peaks: [
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/fe55b0fd-676f-46df-9953-798914260f1c/ENCFF759ASB.bigBed", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/6cdfaad1-d70b-4ec0-9bb1-bee34a35fc94/ENCFF825QWO.bigBed", r: [2] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/83171711-dcce-4dc8-a44c-2d2540fbdbf2/ENCFF585EFB.bigBed", r: [3] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/d833f4af-997b-4805-a560-25d26fd13034/ENCFF583MFR.bigBed", r: [4] },
      ],
    },
    ENCSR534WIF: {
      peaks: [
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/8985284f-0ff4-4928-a315-189fd667f609/ENCFF721KDN.bigBed", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/1a115886-444f-4fb0-91d5-c635d0cf16df/ENCFF699SPP.bigBed", r: [2] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/fb35b3ea-5d18-4217-a748-b7adc0057c54/ENCFF177MOQ.bigBed", r: [3] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/fad245e5-a039-4e48-a500-d07c872075e2/ENCFF699HTI.bigBed", r: [4] },
      ],
    },
    ENCSR261RMM: {
      peaks: [
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/6a66a283-39bf-45f1-b1b2-0dad61a56de2/ENCFF010LRF.bigBed", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/9e9c7eaf-cbc6-492a-8060-3058a879cca2/ENCFF724KVW.bigBed", r: [2] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/3b5ccc64-6a84-430b-8f92-08740a148617/ENCFF575ZQW.bigBed", r: [3] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/80174ee4-61a9-47ee-9e00-272a619a5174/ENCFF711RUR.bigBed", r: [4] },
      ],
    },
    ENCSR459NUS: {
      peaks: [
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/3a63a3f2-81ff-4c8b-b4d8-81fdce0d0ae0/ENCFF458XNJ.bigBed", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/ce82839d-0611-4ce4-9b4c-aa486225f114/ENCFF436IUD.bigBed", r: [2] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/713ba584-801e-458e-a131-74f40cfe6ec2/ENCFF240RTJ.bigBed", r: [3] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/ee6b035f-7aaa-44be-90db-35f6e3911a76/ENCFF645PLP.bigBed", r: [4] },
      ],
    },
    ENCSR319VAS: {
      peaks: [
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/d8a92aea-ae46-4220-b14d-0af29f0f75f4/ENCFF479DSB.bigBed", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/4f2f9027-8454-48d0-9230-4682ece0c095/ENCFF223KRX.bigBed", r: [2] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/b88a9068-1f03-43cf-b8e6-65c4ab1540b3/ENCFF718JUP.bigBed", r: [3] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/bc93c09c-d136-4dfd-ab4c-76e22a08d00d/ENCFF604CSN.bigBed", r: [4] },
      ],
    },
    ENCSR687CTB: {
      peaks: [
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/7bc0a535-09ca-45c1-90b8-af1e96ba8603/ENCFF048KMS.bigBed", r: [1] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/014e2b85-3ce6-4b57-8a7e-357c89c3f095/ENCFF561PYJ.bigBed", r: [2] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/d11aa5c1-40b3-45b1-bf8a-b063465f1ab6/ENCFF887ORC.bigBed", r: [3] },
        { url: "https://encode-public.s3.amazonaws.com/2021/06/04/f10dab3f-e5e3-4dd5-8a0f-7797a7ba7d31/ENCFF751ZKQ.bigBed", r: [4] },
      ],
    },
  },
}

const COLUMNS = (t) => [
  {
    header: "",
    value: (x) => x.selected,
    render: (x) => <Checkbox onClick={() => t(x.accession)} checked={x.selected} />,
  },
  {
    header: "Accession",
    value: (x) => x.accession,
  },
  {
    header: "Cell Type",
    value: (x) => x.biosample_summary,
  },
  {
    header: "Lab",
    value: (x) => x.lab,
  },
]

function getSelectedDefault(acc, ct) {
  const vv = [
    ...DATASETS["Kevin White"].map((x) => ({
      ...x,
      lab: "Kevin White",
      selected: acc.has(x.accession) || (ct && x.biosample_summary.includes(ct)),
    })),
    ...DATASETS["Tim Reddy"].map((x) => ({
      ...x,
      lab: "Tim Reddy",
      selected: acc.has(x.accession) || (ct && x.biosample_summary.includes(ct)),
    })),
  ]
  return vv.filter((x) => FILES[x.accession].peaks.length > 0)
}

const TrackSet = (props) => {
  const unique_replicates = useMemo(() => new Set(props.peaks.map((x) => x.r[0])), [props])
  const peakmap = useMemo(
    () =>
      associateBy(
        props.peaks,
        (x) => x.r[0],
        (x) => x.url
      ),
    [props]
  )
  const signalmap = useMemo(
    () =>
      associateBy(
        props.signal || [],
        (x) => x.r[0],
        (x) => x.url
      ),
    [props]
  )
  const tracks = useMemo(() =>
    [...unique_replicates]
      .sort()
      .slice(0, 4)
      .map((x) => [
        {
          chr1: props.position.chromosome,
          start: props.position.start,
          end: props.position.end,
          url: peakmap.get(x),
          preRenderedWidth: props.preRenderedWidth,
        },
        ...(props.signal
          ? [
              {
                chr1: props.position.chromosome,
                start: props.position.start,
                end: props.position.end,
                url: signalmap.get(x),
                preRenderedWidth: props.preRenderedWidth,
              },
            ]
          : []),
      ])
  )
  return (
    <StackedTracks onHeightChanged={props.onHeightChanged}>
      {tracks.map((x, i) =>
        props.signal ? (
          <GraphQLTrackSet
            id="main"
            tracks={x}
            transform=""
            endpoint="https://ga.staging.wenglab.org/graphql"
            width={props.preRenderedWidth}
          >
            <WrappedDenseBigBed
              title={`${props.title} replicate ${i + 1}`}
              titleSize={10}
              width={props.preRenderedWidth + 150}
              height={30}
              domain={props.position}
              id="rDHS"
              color={B_COLOR_MAP[props.title.split(" ")[0]]}
            />
            <WrappedFullBigWig title="" titleSize={10} width={props.preRenderedWidth + 150} height={60} domain={props.position} id="rDHS" />
          </GraphQLTrackSet>
        ) : (
          <GraphQLTrackSet
            id="main"
            tracks={x}
            transform=""
            endpoint="https://ga.staging.wenglab.org/graphql"
            width={props.preRenderedWidth}
          >
            <WrappedDenseBigBed
              title={`${props.title} replicate ${i + 1}`}
              titleSize={10}
              width={props.preRenderedWidth + 150}
              height={30}
              domain={props.position}
              id="rDHS"
              color={B_COLOR_MAP[props.title.split(" ")[0]]}
            />
          </GraphQLTrackSet>
        )
      )}
    </StackedTracks>
  )
}

const FVTable = (props) =>
  tabEles(
    props.globals,
    { functional_validation: props.data, starr: props.ddata, mpra: props.mc[1], crispr: props.mc[0] },
    FunctionalValidationTable(
      props.globals,
      props.assembly,
      props.data["starr"]["reads"] < 10.0
        ? "No STARR-seq peaks were identified at this cCRE, but local read depth is insufficient to be confident in a true negative."
        : "No STARR-seq peaks were identified at this cCRE."
    ),
    2
  )

const FunctionalValidationView = (props) => {
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const toggle = useCallback(
    (xx) => {
      const r = [...selected]
      r.forEach((x, i) => {
        if (x.accession === xx) r[i] = { ...x, selected: !x.selected }
      })
      setSelected(r)
    },
    [selected]
  )
  const [data, setData] = useState(null)
  const c = useMemo(() => COLUMNS(toggle), [toggle, selected])
  const [selecting, setSelecting] = useState(false)
  const [transcriptHeight, setTranscriptHeight] = useState(0)
  const range = useMemo(
    () =>
      props.active_cre
        ? {
            start: props.active_cre.start - 100000,
            end: props.active_cre.start + props.active_cre.len + 100000,
            chromosome: props.active_cre.chrom,
          }
        : { start: 1, end: 2 },
    [props]
  )
  const l = linearTransform(range, { start: 0, end: 1000 })
  const [mc, setMC] = useState(null)

  const unique_replicates = useMemo(
    () =>
      Object.keys(FILES)
        .map((x) => [x, FILES[x].peaks])
        .filter((x) => x[1].length >= 1)
        .map((x) => [x[0], x[1][0].url]),
    []
  )
  const cts = useMemo(() => Object.keys(DATASETS).flatMap((x) => DATASETS[x]), [])
  const ctmap = useMemo(
    () =>
      associateBy(
        cts,
        (x) => x.accession,
        (x) => x.biosample_summary
      ),
    []
  )
  const tracks = useMemo(
    () =>
      [
        ...[...unique_replicates].sort(),
        ["CRISPR", "gs://gcp.wenglab.org/screen-fc/GRCh38.CRISPR-gRNA-Overlap.bigBed"],
        ["MPRA", "gs://gcp.wenglab.org/screen-fc/GRCh38.MPRA-Overlap.bigBed"],
      ].map((x) => ({
        chr1: props.active_cre.chrom,
        start: props.active_cre.start,
        end: props.active_cre.start + props.active_cre.len,
        chr2: props.active_cre.chrom,
        url: x[1],
        preRenderedWidth: props.preRenderedWidth,
      })),
    [unique_replicates]
  )
  const cellTypes = useMemo(() => [...unique_replicates].sort().map((x) => [x[0], ctmap.get(x[0])]), [unique_replicates, ctmap])
  const tdomain = useMemo(() => ({ ...range, chromosome: props.active_cre.chrom }), [props, range])
  useEffect(() => {
    fetch("https://ga.staging.wenglab.org/graphql", {
      body: JSON.stringify({
        query: `
    query q($tracks: [BigRequest!]!) {
        bigRequests(requests: $tracks) {
            data
        }
    }
    `,
        variables: { tracks },
      }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
    })
      .then((x) => x.json())
      .then((xx) => {
        const x = { data: { bigRequests: xx.data.bigRequests.slice(0, xx.data.bigRequests.length - 2) } }
        setMC([
          xx.data.bigRequests[xx.data.bigRequests.length - 2].data
            .map((x) => x.name.split("_"))
            .map((x) => ({ gRNA: x[0], quantification: x[1], exp: x[2], ct: x[3], perturbation: x[4], readout: x[5] })),
          xx.data.bigRequests[xx.data.bigRequests.length - 1].data
            .map((x) => [
              x.name.includes("_+_") ? "+" : "-",
              ...x.name
                .replace(/not_active/g, "not active")
                .split(/_[\+\-]_/g)[1]
                .split("_"),
              x.name.split("_")[0],
            ])
            .map((x) => ({ strand: x[0], logfc: x[1], input: x[2], output: x[3], fdr: x[4], active: x[5], exp: x[6], ct: x[7], id: x[8] })),
        ])
        setData(
          x.data.bigRequests.flatMap((xx, j) =>
            xx.data.map((xxx) => ({
              ...xxx,
              experiment: cellTypes[j][0],
              cellType: cellTypes[j][1].replace(/genetically modified using transient transfection/g, ""),
            }))
          )
        )
        setSelected(
          getSelectedDefault(
            new Set(
              x.data.bigRequests
                .map((x, j) => [x, cellTypes[j][0]])
                .filter((x) => x[0].data.length > 0)
                .map((x) => x[1])
            ),
            props.cellType
          )
        )
      })
  }, [cellTypes, tracks])

  return !selected || !data ? (
    <Loader active>Loading...</Loader>
  ) : (
    <>
      <Menu pointing secondary>
        <Menu.Item active={page === 1} onClick={() => setPage(1)} style={{ fontSize: "1.2em" }}>
          Browser View
        </Menu.Item>
        <Menu.Item active={page === 0} onClick={() => setPage(0)} style={{ fontSize: "1.2em" }}>
          Table View
        </Menu.Item>
      </Menu>
      <Modal
        open={selecting}
        onClose={() => setSelecting(false)}
        style={{ height: "auto", top: "auto", left: "auto", right: "auto", bottom: "auto" }}
      >
        <Modal.Header style={{ fontSize: "2em" }}>Select Experiments</Modal.Header>
        <Modal.Content style={{ fontSize: "1.2em" }}>
          <DataTable columns={c} rows={selected} sortColumn={1} />
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setSelecting(false)}>OK</Button>
        </Modal.Actions>
      </Modal>
      {page === 0 ? (
        <FVTable globals={props.globals} data={props.data} assembly={props.assembly} active_cre={props.active_cre} ddata={data} mc={mc} />
      ) : (
        <>
          <Message info>
            <strong>By default, this view shows tracks matching your search, including:</strong>
            <br />
            <ul>
              <li>Tracks with peaks intersecting the searched cCRE</li>
              <li>Tracks matching the biosample you have selected using the cell type facet at left</li>
            </ul>
            To select additional datasets, use the button below.
          </Message>
          <Button size="large" onClick={() => setSelecting(true)}>
            <Icon name="chart area" /> Select Experiments
          </Button>
          <br />
          <br />
          <svg width="100%" viewBox="0 0 1000 2000">
            <g transform="translate(0,0)">
              <StackedTracks onHeightChanged={(x) => setTranscriptHeight(x - 30)}>
                <WrappedRulerTrack
                  width={1000}
                  height={30}
                  domain={{ chromosome: props.active_cre.chrom, start: range.start, end: range.end }}
                />
                <WrappedTrack height={20}>
                  <EmptyTrack height={20} width={1000} transform="" id="" />
                </WrappedTrack>
                <GraphQLTranscriptTrack
                  assembly={props.assembly}
                  endpoint="https://ga.staging.wenglab.org/graphql"
                  id=""
                  transform=""
                  domain={tdomain}
                >
                  <WrappedSquishTranscriptTrack
                    title="GENCODE genes"
                    rowHeight={15}
                    titleSize={10}
                    width={1000}
                    domain={range}
                    id=""
                    transform=""
                  />
                </GraphQLTranscriptTrack>
                {selected
                  .filter((x) => x.selected)
                  .map((x) => (
                    <TrackSet
                      key={x.accession}
                      position={range}
                      preRenderedWidth={850}
                      peaks={FILES[x.accession].peaks}
                      signal={FILES[x.accession].signal}
                      title={`${x.biosample_summary.replace(/genetically modified using transient transfection /g, "")} (${x.accession})`}
                    />
                  ))}
              </StackedTracks>
              <text x={l(props.active_cre.start) - 38} y={42} style={{ fontSize: "11px" }}>
                {props.active_cre.accession}
              </text>
              <rect
                fill={COLOR_CCRE_MAP[props.active_cre.pct] || "#0000ff"}
                fillOpacity={0.5}
                y={48}
                x={l(props.active_cre.start)}
                width={l(props.active_cre.start + props.active_cre.len) - l(props.active_cre.start)}
                height={20 + transcriptHeight}
              />
            </g>
          </svg>
        </>
      )}
    </>
  )
}

function chunkArr(arr, chunk) {
  // from https://jsperf.com/array-splice-vs-underscore
  var i,
    j,
    temparray = []
  for (i = 0, j = arr.length; i < j; i += chunk) {
    temparray.push(arr.slice(i, i + chunk))
  }
  return temparray
}

function makeTable(data, key, table) {
  return React.createElement(Ztable, { data, ...table })
}

function tabEle(globals, data, key, table, numCols) {
  let helpicon = table && table.helpkey ? <HelpIcon globals={globals} helpkey={table.helpkey} /> : ""
  if (table && "typ" in table) {
    return (
      <div className={"col-md-" + 12 / numCols} key={key}>
        <h4>
          {table.title} {helpicon}
        </h4>
        {React.createElement(table.typ, { data, table })}
        <br />
      </div>
    )
  }
  if (!data || !table) {
    return <div className={"col-md-" + 12 / numCols} key={key} />
  }
  return (
    <div className={"col-md-" + 12 / numCols} key={key}>
      <h4>
        {table.title} {helpicon}
      </h4>
      {table.csv ? (
        <CSVLink data={data} separator={"\t"}>
          TSV
        </CSVLink>
      ) : null}
      {makeTable(data, key, table)}
      <br />
    </div>
  )
}

function tabEles(globals, data, tables, numCols) {
  var cols = []
  for (var key of Object.keys(tables)) {
    var _data = key in data ? data[key] : []
    let table = tables[key]
    cols.push(tabEle(globals, _data, key, table, numCols))
  }
  if (0 === numCols) {
    return cols
  }
  var chunks = chunkArr(cols, numCols)
  var ret = []
  for (var i = 0; i < chunks.length; i++) {
    var chunk = chunks[i]
    ret.push(
      <div className="row" key={"chunk" + i}>
        {chunk}
      </div>
    )
  }
  return <div>{ret}</div>
}

class ReTabBase extends React.Component {
  constructor(props, key) {
    console.log(props);
    super(props)
    this.key = key
    this.loadData = true // inner component will dynamically load its own data
    this.url = "/dataws/re_detail/" + key
    this.state = { jq: null, isFetching: true, isError: false }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if ("details" === nextProps.maintabs_active) {
      if (this.key === nextProps.re_details_tab_active) {
        return true
      }
    }
    return false
  }

  componentDidMount() {
    if ("details" === this.props.maintabs_active) {
      if (this.key === this.props.re_details_tab_active) {
        this.loadCRE(this.props)
      }
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if ("details" === nextProps.maintabs_active) {
      if (this.key === nextProps.re_details_tab_active) {
        this.loadCRE(nextProps)
      }
    }
  }

  loadCRE = ({ assembly, cre_accession_detail, active_cre }) => {
    if (!this.loadData) {
      return
    }
    if (!cre_accession_detail || cre_accession_detail in this.state) {
      return
    }
    var q = { assembly, accession: cre_accession_detail, chromosome: active_cre.chrom }
    var jq = JSON.stringify(q)
    if (this.state.jq === jq) {
      // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
      return
    }
    this.setState({ jq, isFetching: true })
    ApiClient.getByPost(
      jq,
      this.url,
      (r) => {
        this.setState({ ...r, isFetching: false, isError: false })
      },
      (msg) => {
        console.log("err loading cre details")
        console.log(msg)
        this.setState({ jq: null, isFetching: false, isError: true })
      }
    )
  }

  doRenderWrapper = () => {
    let accession = this.props.cre_accession_detail
    if (!this.loadData || accession in this.state) {
      return this.doRender(this.props.globals, this.props.assembly, this.state[accession])
    }
    return loading({ ...this.state, message: this.props.message })
  }

  render() {
    if ("details" === this.props.maintabs_active) {
      if (this.key !== this.props.re_details_tab_active) {
        return false
      }
    }
    return <div style={{ width: "100%" }}>{this.doRenderWrapper()}</div>
  }
}

class FunctionalValidationTab extends ReTabBase {
  constructor(props) {
    super(props, "functionalValidation")
    this.doRender = (globals, assembly, data) => {
      return (
        <div style={{ marginTop: "1em" }}>
          <FunctionalValidationView
            cellType={props.cellType}
            data={data}
            globals={globals}
            assembly={assembly}
            active_cre={props.active_cre}
          />
        </div>
      )
    }
  }
}

class TopTissuesTab extends ReTabBase {
  constructor(props) {
    super(props, "topTissues")
    this.doRender = (globals, assembly, data) => {
      return tabEles(globals, data, TopTissuesTables(globals, assembly), 1)
    }
  }
}

class NearbyGenomicTab extends ReTabBase {
  constructor(props) {
    super(props, "nearbyGenomic")
    this.doRender = (globals, assembly, data) => {
      return tabEles(globals, data, NearbyGenomicTable(globals, assembly), 3)
    }
  }
}

const TISSUE_ORDER = [
  "forebrain",
  "midbrain",
  "hindbrain",
  "neural tube",
  "heart",
  "liver",
  "lung",
  "kidney",
  "stomach",
  "intestine",
  "limb",
  "embryonic facial prominence",
]

const COLOR_ORDER = [
  "#95c79f",
  "#6ab368",
  "#3f834e",
  "#183c12",
  "#cf2786",
  "#e3272e",
  "#7b5026",
  "#dbc0f7",
  "#ab76ea",
  "#7658a2",
  "#3854cd",
  "#a8bef7",
]

const TISSUE_ORDER_MAP = (() => {
  const r = {}
  TISSUE_ORDER.forEach((x, i) => {
    r[x] = i
  })
  return r
})()

const COLOR_CCRE_MAP = {
  dELS: "#ffcd00",
  PLS: "#ff0000",
  pELS: "#ffa700",
}

const ENTEX_QUERY = gql`
  query q($accession: [String!], $chr: String!, $start: Int!, $end: Int!) {
    cCREQuery(assembly: "GRCh38", accession: $accession) {
      gtex_decorations {
        ctcf_bound
        state
        proximal
        allele_specific
        tissue
      }
    }
    bigRequests(
      requests: [{ url: "gs://gcp.wenglab.org/SCREEN/cCREs_default_AS.bigBed", chr1: $chr, chr2: $chr, start: $start, end: $end }]
    ) {
      data
    }
  }
`

const ENTEX_AS_COLUMNS = [
  {
    header: "donor",
    value: (x) => x.donor,
  },
  {
    header: "tissue",
    value: (x) => x.tissue,
  },
  {
    header: "assay",
    value: (x) => x.assay,
  },
  {
    header: "count, haplotype 1",
    value: (x) => x.hap1_count,
  },
  {
    header: "count, haplotype 2",
    value: (x) => x.hap2_count,
  },
  {
    header: "p-value",
    value: (x) => (x.p < 0.001 ? x.p.toExponential(3) : x.p.toFixed(3)),
  },
]

const ENTEX_COLUMNS = [
  {
    header: "tissue",
    value: (x) => x.tissue,
    render: (x) => x.tissue.replace(/_/g, " "),
  },
  {
    header: "state",
    value: (x) => x.state,
    render: (x) => x.state.toLocaleLowerCase(),
  },
  {
    header: "CTCF-bound",
    value: (x) => x.ctcf_bound,
    render: (x) => (x.ctcf_bound ? "yes" : "no"),
  },
  {
    header: "TSS proximal",
    value: (x) => x.proximal,
    render: (x) => (x.proximal ? "yes" : "no"),
  },
  {
    header: "allele specific",
    value: (x) => x.allele_specific,
    render: (x) => (x.allele_specific ? "yes" : "no"),
  },
]

const MotifTooltip = (props) => {
  const rc = (x) => [...x].map((xx) => [...xx].reverse()).reverse()
  return (
    <div style={{ border: "1px solid", borderColor: "#000000", backgroundColor: "#ffffff", padding: "5px" }}>
      <Header as="h2">{props.rectname.split("$")[2]}</Header>
      <DNALogo
        ppm={props.rectname.split("$")[1] === "-" ? rc(MOTIFS[props.rectname.split("$")[2]]) : MOTIFS[props.rectname.split("$")[2]]}
        width={MOTIFS[props.rectname.split("$")[2]].length * 10}
      />
    </div>
  )
}

const EBrowser = (props) => {
  const [highlight, setHighlight] = useState(null)
  const expandedCoordinates = useMemo(() => expandCoordinates(props.coordinates), [props.coordinates])
  const [eCoordinates, setECoordinates] = useState(expandedCoordinates)
  const client = useMemo(() => new ApolloClient({ uri: "https://ga.staging.wenglab.org/graphql", cache: new InMemoryCache() }), [])
  const { data, loading } = useQuery(QUERY, { variables: { ...eCoordinates, assembly: "grch38", name: props.gene || "undefined" }, client })
  const groupedTranscripts = useMemo(
    () =>
      data &&
      data.gene &&
      data.gene.map((x) => ({
        ...x,
        transcripts: x.transcripts.map((xx) => ({
          ...xx,
          color: (props.resolvedTranscript ? xx : x).name === props.gene ? "#880000" : "#aaaaaa",
        })),
      })),
    [data, props]
  )
  const svgRef = useRef(null)
  const [transcriptHeight, setTranscriptHeight] = useState(0)
  const l = useCallback((c) => ((c - eCoordinates.start) * 1400) / (eCoordinates.end - eCoordinates.start), [eCoordinates])
  return loading ? (
    <Loader active>Loading...</Loader>
  ) : (
    <ApolloProvider client={client}>
      <CytobandView
        innerWidth={1000}
        height={15}
        chromosome={props.coordinates.chromosome}
        assembly="GRCh38"
        position={props.coordinates}
      />
      <div style={{ marginTop: "1em", marginBottom: "0.75em", textAlign: "center" }}>
        <UCSCControls
          domain={eCoordinates}
          onDomainChanged={(x) => setECoordinates({ chromosome: props.coordinates.chromosome, ...capRange(x) })}
        />
      </div>
      <GenomeBrowser
        key={props.cellType}
        svgRef={svgRef}
        domain={eCoordinates}
        innerWidth={1400}
        width="100%"
        noMargin
        onDomainChanged={(x) => setECoordinates({ chromosome: props.coordinates.chromosome, ...x })}
        onHeightChanged={(x) => setTranscriptHeight(x - 30)}
      >
        <g>
          <text x={l(props.active_cre.start) - 38} y={42} style={{ fontSize: "11px" }}>
            {props.active_cre.accession}
          </text>
          <rect
            fill={COLOR_CCRE_MAP[props.active_cre.pct] || "#0000ff"}
            fillOpacity={0.5}
            y={48}
            x={l(props.active_cre.start)}
            width={l(props.active_cre.start + props.active_cre.len) - l(props.active_cre.start)}
            height={1000 + transcriptHeight}
          />
        </g>
        {highlight && (
          <rect fill="#8ec7d1" fillOpacity={0.5} height={1000} x={l(highlight.start)} width={l(highlight.end) - l(highlight.start)} />
        )}
        <RulerTrack domain={eCoordinates} width={1400} height={30} />
        <EmptyTrack height={30} width={1400} />
        {eCoordinates.end - eCoordinates.start >= 5000000 ? (
          <SquishTranscriptTrack rowHeight={20} width={1400} domain={eCoordinates} id="innergencode" data={groupedTranscripts} />
        ) : (
          <PackTranscriptTrack rowHeight={20} width={1400} domain={eCoordinates} id="innergencode" data={groupedTranscripts} />
        )}
        <EmptyTrack height={20} width={1400} />
        <ENTEXTracks
          tracks={etracks(
            "grch38",
            eCoordinates,
            props.gfirst.map((x) => ({ url: x.file }))
          )}
          trackdata={props.gfirst}
          domain={eCoordinates}
          cCREHighlight={props.coordinates}
          cCREHighlights={new Set([])} // props.facetState.gene_overlap.modes.find(x => x === "PROMOTER") ? associatedPromoters.map(x => x.accession) : [])}
          svgRef={svgRef}
          assembly="grch38"
          oncCREClicked={(x) => props.g.get(x) && props.actions.showReDetail(props.g.get(x))}
          oncCREMousedOver={(x) => x && setHighlight(x)}
          oncCREMousedOut={() => setHighlight(null)}
          actions={props.actions}
        />
      </GenomeBrowser>
    </ApolloProvider>
  )
}

function ggfirst(data) {
  const r = []
  const found = new Set([])
  data.forEach((x) => {
    if (!found.has(x.tissue)) r.push(x)
    found.add(x.tissue)
  })
  return r
}

const ENTEXView = (props) => {
  const client = useMemo(() => new ApolloClient({ uri: "https://ga.staging.wenglab.org/graphql", cache: new InMemoryCache() }), [])
  const [page, setPage] = useState(1)
  const { data, loading } = useQuery(ENTEX_QUERY, {
    variables: {
      accession: props.active_cre.accession,
      chr: props.active_cre.chrom,
      start: props.active_cre.start,
      end: props.active_cre.start + props.active_cre.len,
    },
    client,
  })
  const tissues = useMemo(() => data && [...new Set(data.cCREQuery[0].gtex_decorations.map((x) => x.tissue))], [data])
  const rtissues = useMemo(() => (tissues && tissues.length !== 0 ? tissues : ["spleen", "thyroid", "sigmoid colon"]))
  const gfirst = useMemo(
    () =>
      tissues &&
      ["H3K4me3", "H3K4me1", "H3K27ac", "H3K27me3"]
        .flatMap((m) =>
          rtissues.map((t) => {
            const k = Object.keys(ENTEX).filter(
              (x) => ENTEX[x] && ENTEX[x].biosample && ENTEX[x].target === m && ENTEX[x].biosample.startsWith(t.replace(/_/g, " "))
            )
            return k.length === 0 ? undefined : ENTEX[k]
          })
        )
        .filter((x) => !!x),
    [rtissues]
  )
  const eCoordinates = useMemo(
    () =>
      props.active_cre && {
        chromosome: props.active_cre.chrom,
        start: props.active_cre.start,
        end: props.active_cre.start + props.active_cre.len,
      },
    [props]
  )
  const formattedAS = useMemo(
    () =>
      data && data.bigRequests[0].data
        ? data.bigRequests[0].data.map((x) => ({
            hap1_count: +x.name.split("$")[1],
            hap2_count: +x.name.split("$")[2],
            hap1_allele_ratio: +x.name.split("$")[3],
            experiment: x.name.split("$")[4],
            donor: x.name.split("$")[5],
            tissue: x.name.split("$")[6].replace(/_/g, " "),
            assay: x.name.split("$")[7].replace(/_/g, " "),
            p: +x.name.split("$")[8].replace(/_/g, " "),
            significant: x.name.split("$")[9] === "1",
          }))
        : [],
    [data]
  )
  return loading ? (
    <Loader active>Loading...</Loader>
  ) : (
    <>
      <Menu pointing secondary>
        <Menu.Item active={page === 1} onClick={() => setPage(1)} style={{ fontSize: "1.2em" }}>
          States by Tissue
        </Menu.Item>
        <Menu.Item active={page === 2} onClick={() => setPage(2)} style={{ fontSize: "1.2em" }}>
          Allele-Specific Activity
        </Menu.Item>
        <Menu.Item active={page === 0} onClick={() => setPage(0)} style={{ fontSize: "1.2em" }}>
          Browser View
        </Menu.Item>
      </Menu>
      {page === 1 ? (
        <>
          <Header as="h2">EN-TEx State Decorations</Header>
          <DataTable
            key="t"
            columns={ENTEX_COLUMNS}
            rows={ggfirst(data.cCREQuery[0].gtex_decorations)}
            searchable
            itemsPerPage={8}
            sortDescending
          />
        </>
      ) : page === 2 ? (
        <>
          <Header as="h2">Significant Allele-Specific Events</Header>
          <DataTable
            key="as"
            columns={ENTEX_AS_COLUMNS}
            rows={formattedAS.filter((x) => x.significant)}
            searchable
            sortColumn={5}
            itemsPerPage={8}
            sortDescending
            emptyText="no significant allele-specific events detected at this cCRE"
          />
          <Header as="h2">Non-Significant Allele-Specific Events</Header>
          <DataTable
            key="as1"
            columns={ENTEX_AS_COLUMNS}
            rows={formattedAS.filter((x) => !x.significant)}
            searchable
            itemsPerPage={8}
            sortColumn={5}
            sortDescending
            emptyText="no non-significant allele-specific events detected at this cCRE"
          />
        </>
      ) : (
        <EBrowser coordinates={eCoordinates} actions={props.actions} gfirst={gfirst} active_cre={props.active_cre} />
      )}
    </>
  )
}

const ChromHMMView = (props) => {
  const [page, setPage] = useState(1)
  const grouped = useMemo(
    () =>
      groupBy(
        props.data.chromhmm[1] || [],
        (x) => x.tissue,
        (x) => x
      ),
    [props]
  )
  const tissues = useMemo(
    () =>
      [...new Set((props.data.chromhmm[1] || []).map((x) => x.tissue))].sort((a, b) => {
        const aa = a.split(" ")
        const bb = b.split(" ")
        return (
          TISSUE_ORDER_MAP[aa.slice(0, aa.length - 1).join(" ")] -
          TISSUE_ORDER_MAP[bb.slice(0, bb.length - 1).join(" ")] +
          aa[aa.length - 1].localeCompare(bb[bb.length - 1]) * 0.1
        )
      }),
    [props]
  )
  const timepoints = useMemo(
    () =>
      groupBy(
        props.data.chromhmm[1] || [],
        (x) =>
          x.tissue
            .split(" ")
            .slice(0, x.tissue.split(" ").length - 1)
            .join(" "),
        (x) => x.tissue.split(" ")[x.tissue.split(" ").length - 1]
      ),
    [props.data]
  )
  const tissueCounts = useMemo(() => {
    const c = {}
    tissues.forEach((x) => {
      const t = x
        .split(" ")
        .slice(0, x.split(" ").length - 1)
        .join(" ")
      c[t] = c[t] ? c[t] + 1 : 1
    })
    return c
  }, [tissues])
  const states = useMemo(() => [...new Set((props.data.chromhmm[1] || []).map((x) => x.name))].sort(), [props])
  const colormap = useMemo(
    () =>
      associateBy(
        props.data.chromhmm[1] || [],
        (x) => x.name,
        (x) => x.color
      ),
    [props]
  )
  const tissueOffsets = useMemo(
    () => TISSUE_ORDER.reduce((v, c) => [...v, v[v.length - 1] + 6 * tissueCounts[c]], [33]),
    [tissues, tissueCounts]
  )
  const range = useMemo(
    () =>
      props.data.chromhmm[1]
        ? { start: Math.min(...props.data.chromhmm[1].map((x) => x.cdStart)), end: Math.max(...props.data.chromhmm[1].map((x) => x.cdEnd)) }
        : { start: 1, end: 2 },
    [props.data]
  )
  const l = linearTransform(range, { start: 0, end: 1000 })
  const [transcriptHeight, setTranscriptHeight] = useState(0)

  return (
    <>
      <Menu pointing secondary>
        <Menu.Item active={page === 1} onClick={() => setPage(1)} style={{ fontSize: "1.2em" }}>
          Browser View
        </Menu.Item>
        <Menu.Item active={page === 0} onClick={() => setPage(0)} style={{ fontSize: "1.2em" }}>
          Table View
        </Menu.Item>
      </Menu>
      {page === 0 ? (
        props.data.chromhmm[0] &&
        tabEles(props.globals, { chromhmm: props.data.chromhmm[0] }, ChromHMMTables(props.globals, props.assembly), 1)
      ) : (
        <>
          <svg width="100%" viewBox="0 0 1250 60">
            {states.map((s, i) => (
              <g transform={`translate(${250 + 75 * (i % 9)},${i >= 9 ? 30 : 0})`}>
                <rect y={5} height={15} width={15} fill={colormap.get(s)} />
                <text x={20} y={17} fontSize="12px" color={colormap.get(s)}>
                  {s}
                </text>
              </g>
            ))}
          </svg>
          <svg width="100%" viewBox="0 0 1250 600">
            {TISSUE_ORDER.map((t, i) => (
              <g transform={`translate(0,${tissueOffsets[i] + transcriptHeight})`}>
                <text y={(tissueCounts[t] * 6) / 2} x={188} textAnchor="end" fontSize="14px">
                  {t}
                </text>
                <text y={(tissueCounts[t] * 6) / 2 + 10} x={188} textAnchor="end" fontSize="9px">
                  ({[...new Set(timepoints.get(t))].sort().join(", ")})
                </text>
                <line y1={0} y2={tissueCounts[t] * 6} x1={196} x2={196} stroke={COLOR_ORDER[i]} strokeWidth={6} />
              </g>
            ))}
            <g transform="translate(250,0)">
              <StackedTracks onHeightChanged={(x) => setTranscriptHeight(x - 30)}>
                <RulerTrack width={1000} height={30} domain={{ chromosome: props.active_cre.chrom, start: range.start, end: range.end }} />
                <EmptyTrack height={20} width={1000} transform="" id="" />
                <GraphQLTranscriptTrack
                  assembly="mm10"
                  endpoint="https://ga.staging.wenglab.org/graphql"
                  id=""
                  transform=""
                  domain={{ ...range, chromosome: props.active_cre.chrom }}
                >
                  <SquishTranscriptTrack rowHeight={15} width={1000} domain={range} id="" transform="" />
                </GraphQLTranscriptTrack>
                <EmptyTrack height={10} width={1000} transform="" id="" />
                <StackedTracks>
                  {tissues.map((t, i) => (
                    <g transform={`translate(0,${i * 6})`} key={i}>
                      <DenseBigBed domain={range} data={grouped.get(t)} width={1000} height={10} key={i} />
                    </g>
                  ))}
                </StackedTracks>
              </StackedTracks>
              <text x={l(props.active_cre.start) - 38} y={42} style={{ fontSize: "11px" }}>
                {props.active_cre.accession}
              </text>
              <rect
                fill={COLOR_CCRE_MAP[props.active_cre.pct] || "#0000ff"}
                fillOpacity={0.5}
                y={48}
                x={l(props.active_cre.start)}
                width={l(props.active_cre.start + props.active_cre.len) - l(props.active_cre.start)}
                height={400 + transcriptHeight}
              />
            </g>
          </svg>
          <p>
            <strong>Cite this data:</strong>
          </p>
          <p>
            van der Velde et. al. 2021. "Annotation of chromatin states in 66 complete mouse epigenomes during development."{" "}
            <em>Communications Biology</em> 4, 239 (2021).
          </p>
          <p>
            <a href="https://doi.org/10.1038/s42003-021-01756-4">https://doi.org/10.1038/s42003-021-01756-4</a>
          </p>
        </>
      )}
    </>
  )
}

class ChromHMMTab extends ReTabBase {
  constructor(props) {
    super(props, "chromhmm")
    this.doRender = (globals, assembly, data) => {
      return (
        <ChromHMMView globals={globals} assembly={assembly} data={data} active_cre={props.active_cre} key={props.active_cre.accession} />
      )
    }
  }
}

class FantomCatTab extends ReTabBase {
  constructor(props) {
    super(props, "fantom_cat")
    this.doRender = (globals, assembly, data) => {
      return (
        <div>
          <div style={{ fontSize: "12pt", margin: "10px", backgroundColor: "rgb(255,165,136)" }} className="interpretation panel">
            This tab displays the intersection between cCREs and external datasets produced by the&nbsp;
            <a href="http://fantom.gsc.riken.jp/" target="_blank" rel="noopener noreferrer">
              FANTOM Consortium
            </a>
            . For more information on FANTOM data intersected below, see&nbsp;
            <a href="https://www.ncbi.nlm.nih.gov/pubmed/28241135" target="_blank" rel="noopener noreferrer">
              PMID 28241135
            </a>{" "}
            for RNAs,&nbsp;&nbsp;
            <a href="https://www.ncbi.nlm.nih.gov/pubmed/24670763" target="_blank" rel="noopener noreferrer">
              PMID 24670763
            </a>{" "}
            for enhancers,&nbsp; and{" "}
            <a href="https://www.ncbi.nlm.nih.gov/pubmed/24670764" target="_blank" rel="noopener noreferrer">
              PMID 24670764
            </a>{" "}
            for CAGE peaks / promoters. The data used in this intersection and descriptions of the fields presented below are available at
            the&nbsp;
            <a href="http://fantom.gsc.riken.jp/5/data/" target="_blank" rel="noopener noreferrer">
              FANTOM5 website
            </a>
            .
          </div>
          {tabEles(globals, data, FantomCatTable(globals, assembly, this.props.actions), 1)}
        </div>
      )
    }
  }
}

class OrthologTab extends ReTabBase {
  constructor(props) {
    super(props, "ortholog")
    this.doRender = (globals, assembly, data) => {
      return tabEles(globals, data, OrthologTable(globals, assembly, this.props.uuid), 1)
    }
  }
}

class TfIntersectionTab extends ReTabBase {
  constructor(props) {
    super(props, "tfIntersection")
    this.doRender = (globals, assembly, data) => {
      return tabEles(globals, data, TfIntersectionTable(globals, assembly), 2)
    }
  }
}

class GeTab extends ReTabBase {
  constructor(props) {
    super(props, "ge")
    this.loadData = false

    this.doRender = (globals, assembly, data) => {
      const gene = this.props.active_cre.genesallpc.pc[0]
      return React.createElement(GeneExp, { ...this.props, gene })
    }
  }
}

export class RampageTab extends ReTabBase {
  constructor(props) {
    super(props, "rampage")

    this.doRender = (globals, assembly, keysAndData) => {
      let data = keysAndData.tsss

      if (0 === data.length) {
        return (
          <div>
            <br />
            {"No RAMPAGE data found for this cCRE"}
          </div>
        )
      }

      return (
        <div className={"container"} style={{ paddingTop: "10px" }}>
          {React.createElement(Rampage, { globals, assembly, keysAndData, width: 800, barheight: "15" })}
        </div>
      )
    }
  }
}

// class LinkedGenesTab extends ReTabBase {
//   constructor(props) {
//     super(props, "linkedGenes")
//     console.log(prop)
//     this.doRender = (globals, assembly, data) => {
//       console.log("view")
//       console.log(globals)
//       console.log(data)
//       return tabEles(globals, data, LinkedGenesTable(globals, assembly), 1)
//     }
//   }
// }

class LinkedGenesView extends React.Component {
  constructor(props) {
    super(props)
    this.linked = { linked_genes: props.linkedgenes}
  }

  render() {
    return tabEles(this.props.globals, this.linked, LinkedGenesTable(this.props.globals, this.props.assembly), 1)
  }
}

const LinkedGenesTab = (props) => {
  const client = useMemo(
    () =>
      new ApolloClient({
        uri: "https://ga.staging.wenglab.org/graphql",
        cache: new InMemoryCache(),
      }),
    []
  )

  const { loading, error, data } = useQuery(
    gql`
      query (
        $assembly: String
        $accession: [String!]
      ) {
        linkedGenesQuery(
          assembly:  $assembly
          accession: $accession
        ) {
          assembly
          accession
          experiment_accession
          celltype
          gene
          assay
        }
      }
    `,
    {
      variables: {
        assembly: props.assembly,
        accession: "EH38D0372911"
        // accession: props.active_ccre.accession
      }, 
      client 
    }
  )

  return loading ? (
    LoadingMessage()
  ) : error ? (
    ErrorMessage(error)
  ) : (
    <div>
      <LinkedGenesView linkedgenes={data.linkedGenesQuery} />
    </div>
  )
}

// never used
// class GroundLevelTab extends ReTabBase {
//   constructor(props) {
//     super(props, "groundLevel")
//     this.doRender = (globals, assembly, data) => {
//       return tabEles(globals, data, GroundLevelTables(globals, assembly), 1)
//     }
//   }
// }

const DATA_QUERY = `
query q($requests: [BigRequest!]!) {
    bigRequests(requests: $requests) {
        data
    }
}
`

const TFMotifTab = (props) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [mousedOver, setMousedOver] = useState(null)
  const [editable, setEditable] = useState(false)
  const [signal, setSignal] = useState(["gs://gcp.wenglab.org/hg38.phyloP100way.bigWig"])
  const [modalShown, setModalShown] = useState(false)
  const [signalToAdd, setSignalToAdd] = useState("")
  const [coordinates, setCoordinates] = useState({
    chromosome: props.active_cre.chrom,
    start: props.active_cre.start,
    end: props.active_cre.start + props.active_cre.len,
  })
  const svgRef = useRef(null)
  const client = useMemo(() => new ApolloClient({ uri: "https://ga.staging.wenglab.org/graphql", cache: new InMemoryCache() }), [])
  const tracks = useMemo(() =>
    signal.map(
      (url) => ({
        chr1: coordinates.chromosome,
        start: coordinates.start,
        end: coordinates.end,
        chr2: coordinates.chromosome,
        url,
        preRenderedWidth: 1400,
      }),
      [coordinates]
    )
  )
  useEffect(() => {
    fetch("https://ga.staging.wenglab.org/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: DATA_QUERY,
        variables: {
          requests: [
            {
              url: "gs://gcp.wenglab.org/SCREEN/all-sites.sorted.formatted.bigBed",
              chr1: props.active_cre.chrom,
              start: props.active_cre.start,
              chr2: props.active_cre.chrom,
              end: props.active_cre.start + props.active_cre.len,
            },
          ],
        },
      }),
    })
      .then((x) => x.json())
      .then((x) => {
        setData(x.data.bigRequests[0].data.filter((x) => x.name.split("$")[3] === "True"))
        setLoading(false)
      })
  }, [])
  return loading ? (
    <Loader active>Loading...</Loader>
  ) : (
    <>
      <ApolloProvider client={client}>
        <CytobandView innerWidth={1000} height={15} chromosome={coordinates.chromosome} assembly="GRCh38" position={coordinates} />
      </ApolloProvider>
      <div style={{ marginTop: "1em", marginBottom: "0.75em", textAlign: "center" }}>
        <UCSCControls
          domain={coordinates}
          onDomainChanged={(x) => setCoordinates({ chromosome: coordinates.chromosome, ...capRange(x) })}
        />
      </div>
      <GenomeBrowser innerWidth={1000} svgRef={svgRef} domain={coordinates} onDomainChanged={setCoordinates} noMargin>
        <RulerTrack width={1000} height={30} domain={coordinates} />
        <GraphQLTranscriptTrack
          assembly={props.assembly}
          endpoint="https://ga.staging.wenglab.org/graphql"
          id=""
          transform=""
          domain={coordinates}
        >
          <SquishTranscriptTrack title="GENCODE genes" rowHeight={15} titleSize={10} width={1000} domain={coordinates} id="" transform="" />
        </GraphQLTranscriptTrack>
        <EmptyTrack width={1000} height={20} text="TF Motif Occurrences" id="" />
        <SquishBigBed
          svgRef={svgRef}
          domain={coordinates}
          width={1000}
          rowHeight={12}
          data={data}
          tooltipContent={MotifTooltip}
          onMouseOver={setMousedOver}
          onMouseOut={() => setMousedOver(null)}
          onClick={(x) => window.open(`https://factorbook.org/tf/human/${x.rectname.split("$")[2]}/motif`, "_blank")}
        />
        {signal.map((url, i) => (
          <StackedImportance
            key={`${coordinates.chromosome}:${coordinates.start}-${coordinates.end}-${i}`}
            url={url}
            i={i}
            setEditable={setEditable}
            coordinates={coordinates}
            tracks={tracks}
          />
        ))}
        {mousedOver && (
          <rect y={0} x={mousedOver.start} height={500} width={mousedOver.end - mousedOver.start} fill="#297eb3" fillOpacity={0.5} />
        )}
        <Modal open={modalShown}>
          <Modal.Header>Add an importance track</Modal.Header>
          <Modal.Content>
            <strong>URL</strong>: <input type="text" onChange={(e) => setSignalToAdd(e.target.value)} />
          </Modal.Content>
          <Modal.Actions>
            <Button
              onClick={() => {
                setModalShown(false)
                setSignalToAdd("")
              }}
            >
              Cancel
            </Button>
            &nbsp;
            <Button
              onClick={() => {
                setModalShown(false)
                setSignalToAdd("")
                setSignal([...signal, signalToAdd])
              }}
            >
              OK
            </Button>
          </Modal.Actions>
        </Modal>
      </GenomeBrowser>
      {editable && <Button onClick={() => setModalShown(true)}>Add Importance Track</Button>}
    </>
  )
}

const StackedImportance = ({ url, i, onHeightChanged, setEditable, coordinates, tracks }) => {
  useEffect(() => {
    onHeightChanged && onHeightChanged(160)
  }, [])
  return coordinates ? (
    <StackedTracks key={`${url}_${i}`} height={160}>
      <rect fill="#ffffff" height={30} width={1000} onClick={() => setEditable(true)} />
      <EmptyTrack width={1000} height={30} text={`Sequence Importance (${url})`} id="" onClick={() => setEditable(true)} />
      {coordinates.end - coordinates.start < 5000 ? (
        <GraphQLImportanceTrack
          width={1000}
          height={100}
          endpoint="https://ga.staging.wenglab.org"
          signalURL={url}
          sequenceURL="gs://gcp.wenglab.org/hg38.2bit"
          coordinates={coordinates}
          key={`${coordinates.chromosome}:${coordinates.start}-${coordinates.end}-${url}`}
        />
      ) : (
        <GraphQLTrackSet tracks={[tracks[i]]} width={1000} height={100} endpoint="https://ga.staging.wenglab.org/graphql" noMargin>
          <FullBigWig title="" width={1000} height={100} domain={coordinates} id={i} noMargin />
        </GraphQLTrackSet>
      )}
    </StackedTracks>
  ) : null
}

const DetailsTabInfo = (assembly) => {
  return {
    topTissues: { 
      title: Render.tabTitle(["In Specific", "Biosamples"]),
      enabled: true, 
      f: TopTissuesTab 
    },
    nearbyGenomic: { 
      title: Render.tabTitle(["Nearby", "Genomic Features"]),
      enabled: true, 
      f: NearbyGenomicTab 
    },
    tfIntersection: { 
      title: Render.tabTitle(["TF and His-mod", "Intersection"]),
      enabled: true, 
      f: TfIntersectionTab 
    },
    tfIntersectionA: {
      title: Render.tabTitle(["TF Motifs and", "Sequence Features"]),
      enabled: true,
      f: (props) => <TFMotifTab key={props.active_cre.accession + "_motif"} {...props} />,
    },
    /* cistromeIntersection: {title: Render.tabTitle(["Cistrome", "Intersection"]),
                               enabled: assembly === "mm10" || assembly === "GRCh38", f: CistromeIntersectionTab}, */
    fantom_cat: { 
      title: Render.tabTitle(["FANTOM", "Intersection"]), 
      enabled: assembly === "hg19", 
      f: FantomCatTab },
    ge: { 
      title: Render.tabTitle(["Associated", "Gene Expression"]), 
      enabled: true, 
      f: GeTab 
    },
    rampage: { 
      title: Render.tabTitle(["Associated", "RAMPAGE Signal"]), 
      enabled: "mm10" !== assembly, 
      f: RampageTab 
    },
    ortholog: { 
      title: Render.tabTitle(["Linked cCREs in", "other Assemblies"]), 
      enabled: true, 
      f: OrthologTab 
    },
    functionalValidation: {
      title: Render.tabTitle(["Functional", "Data"]),
      enabled: true,
      f: (props) => <FunctionalValidationTab key={props.active_cre.accession + "_fv"} {...props} />,
    },
    chromhmm: { 
      title: Render.tabTitle(["ChromHMM", "States"]), 
      enabled: assembly === "mm10", 
      f: ChromHMMTab 
    },
    entex: {
      title: Render.tabTitle(["EN-TEx", "States"]),
      enabled: assembly !== "mm10",
      f: (props) => <ENTEXView key={props.active_cre.accession + "_entex"} {...props} />,
    },
    /* groundLevel: {title: Render.tabTitle(["Ground", "Level"]),
		      enabled: assembly !== "mm10", f: GroundLevelTab, enabled: assembly !== "mm10"}, */
    miniPeaks: { 
      title: Render.tabTitle(["Signal", "Profile"]), 
      enabled: true, 
      f: MiniPeaks 
    },
    linkedGenes: { 
      title: Render.tabTitle(["Linked", "Genes"]), 
      enabled: assembly !== "mm10", 
      f:  (props) => <LinkedGenesTab key={props.active_cre.accession + "_linkedgenes"} {...props} />
    },
  }
}

export default DetailsTabInfo
