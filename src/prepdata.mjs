import fs from 'fs';
import path from 'path';
import { parse as csvParse } from 'csv-parse/sync';

const Mss = new Map();
const People = new Map();
const Places = new Map();
const Edges = [];

const addPerson = (d,shelfmark,field) => {
    const persons = d[field].replace(/\[.+\]/,'').split(';');
    const fieldlower = field.toLowerCase();
    for(const person of persons) {
        const personid = cleanWord(person);
        if(!personid) continue;
        if(!People.has(personid))
            People.set(personid,{data: {id: cleanWord(person), label: person.replace(/\*$/,''),roles: new Set([field])}, classes: fieldlower} );
        else {
            const oldperson = People.get(personid);
            oldperson.data.roles.add(fieldlower);
            oldperson.classes = [...oldperson.data.roles].join(' ');
        }

        Edges.push({data: {id: `${personid}-${shelfmark}`,source: personid, target: shelfmark,popup: fieldlower}, classes: fieldlower });
    }
};

const parseData = (data) => {
    for(const d of data) {
        const place = ((p) => (p === 'Chandernagor' ? 'Calcutta': p))(cleanWord(d['Copy place']));
        if(place === '' || place === 'Besançon') continue;

        const shelfmark = cleanWord(d.Shelfmark);
        const width = cleanNum(d.Width);
        const height = cleanNum(d.Height);
        Mss.set(shelfmark,{data: {id: shelfmark, width: width/10, height: height/10, popup: d.Shelfmark, place: place}, classes: 'manuscript'});

        if(place) {
            if(!Places.has(place))
                Places.set(place,{data: {id: place, label: place}, classes: 'place'});
            Edges.push({data: {id: `${place}-${shelfmark}`,source: place, target: shelfmark, popup: 'copy place'}, classes: 'place' });
        }

        addPerson(d,shelfmark,'Scribe');
        addPerson(d,shelfmark,'Procurer');
        addPerson(d,shelfmark,'Editor');
    }
};

const cleanWord = (str) => str.trim().replace(/\*$/,'').replace(/\s+/g,'_');
const cleanNum = (str) => {
    const trimmed = str.trim().replace(/\*$/,'');
    const [min,max] = trimmed.split('-');
    if(max) return parseInt(min) + parseInt(max) / 2;
    else return parseInt(min);
};

const prepData = () => {
        const csv = csvParse(fs.readFileSync('data/medical_mss.csv','utf8'), {columns: true});
        parseData(csv);
        const ret = {mss: [...Mss.values()], people: [...People.values()], places: [...Places.values()], edges: Edges};
        fs.writeFileSync('data/medical_mss.json',JSON.stringify(ret));
};

prepData();
