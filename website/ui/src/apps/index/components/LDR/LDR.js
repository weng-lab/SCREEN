import { Chart, Scatter, Annotation, XLine } from 'jubilant-carnival';
import { groupBy } from 'queryz';
import React, { useMemo, useState } from 'react';
import { Loader, Menu, Checkbox, Grid, Container, Header } from 'semantic-ui-react';
import { DataTable } from 'ts-ztable';
import { colorMap, tenRange } from '../Matrices/Matrices';
import { ApolloClient, ApolloProvider, gql, InMemoryCache, useQuery } from '@apollo/client';

const STUDY_MAP = {"PASS_ADHD_Demontis2018": "ADHD", "PASS_AgeFirstBirth": "Age at First Birth", "PASS_Alzheimers_Jansen2019": "Alzheimers", "PASS_Anorexia": "Anorexia", "PASS_AtrialFibrillation_Nielsen2018": "Atrial Fibrillation", "PASS_Autism": "Autism", "PASS_BDSCZ_Ruderfer2018": "Bipolar and Schizophrenia", "PASS_BMI1": "BMI", "PASS_CD_deLange2017": "Crohn's Disease", "PASS_Celiac": "Celiac's Disease", "PASS_CigarettesPerDay_Liu2019": "Cigarettes per Day", "PASS_Coronary_Artery_Disease": "Coronary Artery Disease", "PASS_DrinksPerWeek_Liu2019": "Drinks per Week", "PASS_Ever_Smoked": "Ever Smoked", "PASS_GeneralRiskTolerance_KarlssonLinner2019": "General Risk Tolerance", "PASS_HDL": "HDL", "PASS_Height1": "Height", "PASS_IBD_deLange2017": "IBD", "PASS_Insomnia_Jansen2019": "Insomnia", "PASS_Intelligence_SavageJansen2018": "Intelligence", "PASS_IschemicStroke_Malik2018": "Ischemic Stroke", "PASS_LDL": "LDL", "PASS_Lupus": "Lupus", "PASS_MDD_Wray2018": "Major Depressive Disorder", "PASS_MedicationUse_Wu2019": "Medication Use", "PASS_NumberChildrenEverBorn": "Number Children Ever Born", "PASS_ProstateCancer": "Prostate Cancer", "PASS_ReactionTime_Davies2018": "Reaction Time", "PASS_Rheumatoid_Arthritis": "Rheumatoid Arthritis", "PASS_SCZvsBD_Ruderfer2018": "Schizophrenia vs Bipolar Disorder", "PASS_SleepDuration_Dashti2019": "Sleep Duration", "PASS_Type_2_Diabetes": "Type 2 Diabetes", "PASS_UC_deLange2017": "Ulcerative Colitis", "PASS_Years_of_Education1": "Years of Education", "UKB_460K.biochemistry_AlkalinePhosphatase": "Alkaline Phosphatase", "UKB_460K.biochemistry_AspartateAminotransferase": "Aspartate Aminotransferase", "UKB_460K.biochemistry_Cholesterol": "Cholesterol", "UKB_460K.biochemistry_Creatinine": "Creatinine", "UKB_460K.biochemistry_IGF1": "IGF", "UKB_460K.biochemistry_Phosphate": "Phosphate", "UKB_460K.biochemistry_Testosterone_Male": "Male Testosterone Levels", "UKB_460K.biochemistry_TotalBilirubin": "Total Bilirubin", "UKB_460K.biochemistry_TotalProtein": "Total Protein", "UKB_460K.biochemistry_VitaminD": "VitaminD", "UKB_460K.blood_EOSINOPHIL_COUNT": "Eosinophil Count", "UKB_460K.blood_PLATELET_COUNT": "Platelet Count", "UKB_460K.blood_RBC_DISTRIB_WIDTH": "RBC Distribution Width", "UKB_460K.blood_RED_COUNT": "Red Count", "UKB_460K.blood_WHITE_COUNT": "White Count", "UKB_460K.bmd_HEEL_TSCOREz": "Heel TScore", "UKB_460K.body_BALDING1": "Balding", "UKB_460K.body_BMIz": "BMI", "UKB_460K.body_HEIGHTz": "Height", "UKB_460K.body_WHRadjBMIz": "Adjusted BMI", "UKB_460K.bp_DIASTOLICadjMEDz": "Diastolic BP", "UKB_460K.cancer_BREAST": "Breast Cancer", "UKB_460K.cancer_PROSTATE": "Prostate Cancer", "UKB_460K.cov_EDU_YEARS": "Years of Education", "UKB_460K.disease_AID_SURE": "AID SURE", "UKB_460K.disease_ALLERGY_ECZEMA_DIAGNOSED": "Allergy", "UKB_460K.disease_HYPOTHYROIDISM_SELF_REP": "Hypothyroidism", "UKB_460K.lung_FEV1FVCzSMOKE": "FEV1/FVC in Smokers", "UKB_460K.lung_FVCzSMOKE": "FVC in Smokers", "UKB_460K.mental_NEUROTICISM": "Neuroticism", "UKB_460K.other_MORNINGPERSON": "Morning Person", "UKB_460K.pigment_SUNBURN": "Sunburn", "UKB_460K.repro_MENARCHE_AGE": "Menarche Age", "UKB_460K.repro_MENOPAUSE_AGE": "Menopause Age", "UKB_460K.repro_NumberChildrenEverBorn_Pooled": "Number Children Ever Born"};
const QUERY = gql`
query q($studies: [String!]) {
	ccREBiosampleQuery(assembly: "grch38") {
    biosamples {
      ldr_enrichment(studies: $studies) {
        enrichment
        enrichment_error
      }
      lifeStage
      ontology
      name
      experimentAccession(assay: "DNase")
    }
  }
}
`;

const LDRView = props => {

    const { data, loading } = useQuery(QUERY, { variables: { studies: [ props.study ] } });
    const [ page, setPage ] = useState(0);
    const [ tooltip, setTooltip ] = useState(-1);

    // group samples by tissue, then sort by enrichment
    const groupedSamples = useMemo( () => data ? [
        groupBy(data.ccREBiosampleQuery.biosamples.filter(x => x.ldr_enrichment !== null && x.lifeStage === "adult"), x => x.ontology, x => x),
        groupBy(data.ccREBiosampleQuery.biosamples.filter(x => x.ldr_enrichment !== null && x.lifeStage === "embryonic"), x => x.ontology, x => x)
    ] : [], [ data ]);
    const sortedGroups = useMemo( () => groupedSamples.map(
        x => new Map([ ...x.keys() ].map(k => [ k, x.get(k).sort((a, b) => a.ldr_enrichment.enrichment - b.ldr_enrichment.enrichment) ]))
    ), [ groupedSamples ]);
    
    // get x offsets for each tissue
    const sortedKeys = useMemo( () => sortedGroups[page] ? [ ...sortedGroups[page].keys() ].sort() : [], [ sortedGroups, page ]);
    const offsets = useMemo( () => sortedKeys.reduce( (a, c) => [ ...a, a[a.length - 1] + sortedGroups[page].get(c).length + 1 ], [ 0 ]), [ sortedKeys ]);

    // make colors for each tissue and render data
    console.log(offsets)
    const [ oMap, _ ] = useMemo( () => colorMap(data && data.ccREBiosampleQuery && data.ccREBiosampleQuery.biosamples.map(x => x.ontology) || []), [ data ]);
    const scatterData = useMemo( () => sortedGroups[page] ? (sortedKeys.flatMap((k, i) => sortedGroups[page].get(k).map((x, j) => ({
        x: offsets[i] + j,
        y: x.ldr_enrichment[0].enrichment,
        name: x.name,
        ontology: x.ontology,
        experimentAccession: x.experimentAccession,
        svgProps: {
            fill: oMap[x.ontology]
        }
    })))): [], [ sortedGroups, page, offsets, oMap ]);
    const yMin = useMemo( () => Math.floor(Math.min(...scatterData.map(x => x.y)) / 10) * 10, [ scatterData ]);
    const yMax = useMemo( () => Math.ceil(Math.max(...scatterData.map(x => x.y)) / 10) * 10, [ scatterData ]);

    return loading ? <Loader active>Loading...</Loader> : (
        <>
            <Menu secondary pointing style={{ fontSize: "1.2em" }}>
                <Menu.Item onClick={() => setPage(0)} active={page === 0}>Adult</Menu.Item>
                <Menu.Item onClick={() => setPage(1)} active={page === 1}>Embryonic</Menu.Item>
            </Menu>
            <Header as="h2">Heritability Enrichment for {STUDY_MAP[props.study]}</Header>
            <Chart
                domain={{ x: { start: 0, end: scatterData.length + sortedGroups.length + 30 }, y: { start: yMin, end: yMax } }}
                innerSize={{ width: 1600, height: 800 }}
                xAxisProps={{ ticks: [], title: "Cell Type", fontSize: "40" }}
                yAxisProps={{ ticks: tenRange(yMin, yMax), title: "Heritability Enrichment", fontSize: "40" }}
                scatterData={[ scatterData ]}
            >
                <Scatter
                    data={scatterData}
                    pointStyle={{ r: 6 }}
                    onPointMouseOver={setTooltip}
                    onPointMouseOut={() => setTooltip(-1)}
                />
                <XLine
                    data={scatterData.map(_ => 0)}
                    stroke="#ff0000"
                    strokeWidth={4}
                />
                { tooltip !== -1 && (
                    <Annotation notScaled notTranslated>
                        <rect
                            x={35}
                            y={100}
                            width={740}
                            height={120}
                            strokeWidth={2}
                            stroke="#000000"
                            fill="#ffffffdd"
                        />
                        <rect
                            x={55}
                            y={120}
                            width={740 * 0.04}
                            height={740 * 0.04}
                            strokeWidth={1}
                            stroke="#000000"
                            fill={oMap[scatterData[tooltip].ontology]}
                        />
                        <text
                            x={100}
                            y={140}
                            fontSize="26px"
                            fontWeight="bold"
                        >
                            {scatterData[tooltip].name.replace(/_/g, " ").slice(0, 45)}
                            {scatterData[tooltip].name.length > 45 ? "..." : ""}
                        </text>
                        <text
                            x={55}
                            y={185}
                            fontSize="24px"
                        >
                            Enrichment: {scatterData[tooltip].y.toFixed(2)}
                        </text>
                    </Annotation>
                )}
            </Chart>
        </>
    );
}

const LDR = () => {
    const [ study, setStudy ] = useState(null);
    const client = useMemo( () => new ApolloClient({ uri: "https://ga.staging.wenglab.org/graphql", cache: new InMemoryCache() }), [] );
    return (
        <Container style={{ width: "90%" }}>
            <Grid>
                <Grid.Column width={5}>
                    <DataTable
                        columns={[ { header: "", render: x => <Checkbox checked={study === x} /> }, { header: "Trait", value: x => STUDY_MAP[x] }]}
                        rows={Object.keys(STUDY_MAP).sort()}
                        onRowClick={setStudy}
                        sortColumn={1}
                        sortDescending
                    />
                </Grid.Column>
                <Grid.Column width={11}>
                    <ApolloProvider client={client}>
                        { study && <LDRView study={study} /> }
                    </ApolloProvider>
                </Grid.Column>
            </Grid>
        </Container>
    );
};
export default LDR;
