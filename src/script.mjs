import { parse as csvParse } from 'csv-parse/browser/esm';
import Cytoscape from 'cytoscape';
import Fcose from 'cytoscape-fcose';
Cytoscape.use(Fcose);

const init = () => {
   fetch('./medical_mss.csv')
    .then((res) => res.text())
    .then((data) => {
        csvParse(data, {columns: true}, (err,res) => {
            if(err) return console.log(err.message);
            const fig1 = new Fig1(res);
            fig1.draw();
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
const fig1style = [
    {selector: 'node',
     style: {
         'background-color': '#666',
         'label': 'data(label)',
         'font-family': 'brill, et-book, Palatino, Palatino Linotype, Palatino LT STD, Book Antiqua, Georgia, serif'
     }
    },
    {selector: 'node.place',
     style: {
         'background-opacity': '0',
         'label': 'data(id)',
         'text-valign': 'center',
         'font-size': '40px'
     }
    },
    {selector: 'node.manuscript',
     style: {
         'label': '',
         'shape': 'rectangle',
         'width': 'data(width)',
         'height': 'data(height)',
         'background-opacity': '0.5'
     }
    },
    {selector: 'node.manuscript.clicked',
     style: {
         'label': 'data(popup)'
     }
    },
    {selector: 'edge',
     style: {
         'width': 1,
         'label': '',
         'font-family': 'brill, et-book, Palatino, Palatino Linotype, Palatino LT STD, Book Antiqua, Georgia, serif',
         'text-rotation': 'autorotate',
         'line-color': '#ccc',
         'target-arrow-color': '#ccc',
         'target-arrow-shape': 'none',
         'line-opacity': '0.5',
         'text-opacity': '1',
         'curve-style': 'bezier'
     }
    },
    {selector: 'edge.scribe, edge.editor, edge.procurer',
     style: {
         'line-opacity': '0.8'
     }
    },
    {selector: 'edge.clicked',
     style: {
         'label': 'data(popup)',
         'line-opacity': '1'
     }
    },
    {selector: 'edge.scribe',
     style: {
         'width': 2,
         'line-color': '#1b9e77',
         'target-arrow-color': '#1b9e77',
     }
    },
    {selector: 'edge.editor',
     style: {
         'width': 2,
         'line-color': '#d95f02',
         'target-arrow-color': '#d95f02',
     }
    },
    {selector: 'edge.procurer',
     style: {
         'width': 2,
         'line-color': '#7570b3',
         'target-arrow-color': '#7570b3',
     }
    },
    {selector: 'node.scribe, node.procurer, node.editor',
     style: {
        'width': 10,
        'height': 10,
        'background-opacity': '0.8'
     }
    },
    {selector: 'node.scribe',
     style: {
         'background-color': '#1b9e77'
     }
    },
    {selector: 'node.editor',
     style: {
         'background-color': '#d95f02'
     }
    },
    {selector: 'node.procurer',
     style: {
         'background-color': '#7570b3'
     }
    },
    {selector: 'node.scribe.editor',
     style: {
        'background-fill': 'linear-gradient',
        'background-gradient-stop-colors': '#1b9e77 #d95f02'
     }
    }
];

class Fig1 {
    constructor(data) {
        const coords = [
            {nodeId: 'Jammu', position: {x: 74.91114, y: 32.64393} },
            {nodeId: 'Calcutta', position: {x: 88.35035, y: 22.55523} },
            {nodeId: 'Poona', position: {x: 73.83604, y: 18.51827} },
            {nodeId: 'Benares', position: {x: 82.99792, y: 25.32882} },
            {nodeId: 'Madras', position: {x: 80.28337, y: 13.06681} },
            {nodeId: 'Pondicherry', position: {x: 79.83411, y: 11.92781} },
            {nodeId: 'Tanjore', position: {x: 79.13659, y: 10.79187} },
            {nodeId: 'Alwar', position: {x: 76.59406, y: 27.56964} },
            {nodeId: 'Bikaner', position: {x: 73.32865, y: 28.01687} }
        ];
        this.coords_scaled = coords.map((el) => {
            return {
                nodeId: el.nodeId,
                position: {x: el.position.x * 100, y: -el.position.y * 100}
            };
        });

        this.mss = new Map();
        this.people = new Map();
        this.places = new Map();
        this.edges = [];

        this.parseData(data);
    }

    addPerson(d,shelfmark,field) {
        const persons = d[field].replace(/\[.+\]/,'').split(';');
        const fieldlower = field.toLowerCase();
        for(const person of persons) {
            const personid = cleanWord(person);
            if(!personid) continue;
            if(!this.people.has(personid))
                this.people.set(personid,{data: {id: cleanWord(person), label: person.replace(/\*$/,''),roles: new Set([field])}, classes: fieldlower} );
            else {
                const oldperson = this.people.get(personid);
                oldperson.data.roles.add(fieldlower);
                oldperson.classes = [...oldperson.data.roles].join(' ');
            }

            this.edges.push({data: {id: `${personid}-${shelfmark}`,source: personid, target: shelfmark,popup: fieldlower}, classes: fieldlower });
        }
    }

    parseData(data) {
        for(const d of data) {
            const place = ((p) => (p === 'Chandernagor' ? 'Calcutta': p))(cleanWord(d['Copy place']));
            if(place === '' || place === 'Besançon') continue;

            const shelfmark = cleanWord(d.Shelfmark);
            const width = cleanNum(d.Width);
            const height = cleanNum(d.Height);
            this.mss.set(shelfmark,{data: {id: shelfmark, width: width/10, height: height/10, popup: d.Shelfmark}, classes: 'manuscript'});

            if(place) {
                if(!this.places.has(place))
                    this.places.set(place,{data: {id: place, label: place}, classes: 'place'});
                this.edges.push({data: {id: `${place}-${shelfmark}`,source: place, target: shelfmark, popup: 'copy place'}, classes: 'place' });
            }

            this.addPerson(d,shelfmark,'Scribe');
            this.addPerson(d,shelfmark,'Procurer');
            this.addPerson(d,shelfmark,'Editor');
        }
    }
    
    draw() {
        const cy = Cytoscape({
           container: document.getElementById('fig-people'),
           elements: [...this.mss.values(), ...this.places.values(), ...this.people.values(), ...this.edges],
           layout: {
               name: 'fcose',
               nodeDimensionsIncludeLabels: true,
               idealEdgeLength: edge => (edge.hasClass('place') ? 50 : 150),
               edgeElasticity: edge => (edge.hasClass('place') ? 1.5 : 0.2),
               fixedNodeConstraint: this.coords_scaled,
               relativePlacementConstraint: [{top: 'Calcutta', bottom: 'Palmyr_Cordier', gap: 500}, {right: 'Calcutta', left: 'Palmyr_Cordier', gap: 400}],
               stop: () => cy.minZoom(cy.zoom())
           },
           style: fig1style
        });
        cy.$('node.place').ungrabify();
        cy.on('mouseup',this.mouseUp.bind(null,cy));
    }

    mouseUp(cy,e) {
        cy.$('.clicked').removeClass('clicked');
        toolTip.remove(e);
        if(e.target.data('popup')) {
            toolTip.make(e);
            e.target.addClass('clicked');
        }
    }
}

const toolTip = {
    make: function(e) {
        const targ = e.target;
        const toolText = targ.data();
        if(!toolText) return;

        var tBox = document.getElementById('tooltip');
        const tBoxDiv = document.createElement('div');

        if(tBox) {
            for(const kid of tBox.childNodes) {
                if(kid.myTarget === targ)
                    return;
            }
            tBoxDiv.appendChild(document.createElement('hr'));
        }
        else {
            tBox = document.createElement('div');
            tBox.id = 'tooltip';
            tBox.style.top = (e.renderedPosition.y + 10) + 'px';
            tBox.style.left = (e.renderedPosition.x + 10) + 'px';
            tBox.style.opacity = 0;
            tBox.style.transition = 'opacity 0.2s ease-in';
            document.body.appendChild(tBox);
        }

        tBoxDiv.myTarget = targ;
        tBox.appendChild(tBoxDiv);
        tBox.animate([
            {opacity: 0 },
            {opacity: 1, easing: 'ease-in'}
            ], 1000);
        //window.getComputedStyle(tBox).opacity;
        //tBox.style.opacity = 1;
    },
    remove: function(e) {
        const tBox = document.getElementById('tooltip');
        if(tBox)
            tBox.remove();
    },
};


const Cordier = {
    init: init
};

export { Cordier };
