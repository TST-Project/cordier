"use strict";
import { parse as csvParse } from './csv-parse.mjs';
import Cytoscape from './cytoscape.esm.min.js';

const init = () => {
   fetch('./medical_mss.csv')
    .then((res) => res.text())
    .then((data) => {
        csvParse(data, {columns: true}, (err,res) => {
            if(err) return console.log(err.message);
            fig1(res);
        });
    });
};

const cleanWord = (str) => str.trim().replace(/\*$/,'').replace(/\s+/g,'_');
const cleanNum = (str) => {
    const trimmed = str.trim().replace(/\*$/,'');
    const [min,max] = trimmed.split('-');
    if(max) return parseInt(min) + parseInt(max) / 2;
    else return parseInt(min);
};

const fig1 = (data) => {
    const mss = new Map();
    const people = new Map();
    const places = new Map();
    const edges = [];
    //edge: {data: {id, source, target}}
    //node:  {data: {id}}
    for(const d of data) {
        const shelfmark = cleanWord(d['Shelfmark']);
        const place = cleanWord(d['Copy place']);
        const width = cleanNum(d['Width']);
        const height = cleanNum(d['Height']);
        mss.set(shelfmark,{data: {id: shelfmark, width: width, height: height, type: 'manuscript'} });
        if(place) {
            places.set(place,{data: {id: place, type: 'place' } });
            edges.push({data: {id: `${place}-${shelfmark}`,source: place, target: shelfmark} });
        }
    }
    const cy = Cytoscape({
       container: document.getElementById('fig-people'),
       elements: [...mss.values(), ...places.values(), ...edges],
       /*elements: [
        { data: {id: 'Sanscrit_1332', width: 100, height: 200, type: 'manuscript'} },
        { data: {id: 'Bikaner', type: 'place'} },
        { data: {id: 'Bikaner-Sanscrit_!332',source: 'Bikaner', target: 'Sanscrit_1332'} }
        ],
        */
       /*
       layout: {
           name: 'concentric',
           fit: true,
           padding: 30,
           concentric: (node) => node.degree(),
           levelWidth: (nodes) => nodes.maxDegree()/4
       },
       */
       layout: {
           name: 'cose'
       },
       style: [
        {selector: 'node',
         style: {
             'background-color': '#666',
             'label': 'data(id)'
         }
        },
        {selector: 'edge',
         style: {
             'width': 2,
             'line-color': '#ccc',
             'target-arrow-color': '#ccc',
             'target-arrow-shape': 'triangle',
             'curve-style': 'bezier'
         }
        }
       ]
    });
};

const Cordier = {
    init: init
};

export { Cordier };
