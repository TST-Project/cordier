import Data from './data/medical_mss.json';
//import { parse as csvParse } from 'csv-parse/browser/esm';
import Cytoscape from 'cytoscape';
import Fcose from 'cytoscape-fcose';
import cyCanvas from 'cytoscape-canvas';
import OpenSeadragon from 'openseadragon';
Cytoscape.use(Fcose);
cyCanvas(Cytoscape);

const init = () => {
    startZoomers();
    const fig1 = new Fig1(Data);
    fig1.draw();
    const fig2 = new Fig2(Data);
    fig2.draw();
    document.addEventListener('click',docClick);
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
/*    {selector: 'node.scribe',
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
    */
];
const colors = [
    ['scribe','#1b9e77'],
    ['editor', '#d95f02'],
    ['procurer','#7570b3'],
];
for(const color of colors) {
    fig1style.push({
        selector: `node.${color[0]}`,
        style: {
            'background-color': color[1]
        }
    });
}
fig1style.push({selector: 'node.scribe.editor',
     style: {
        'background-fill': 'linear-gradient',
        'background-gradient-stop-colors': `${colors[0][1]} ${colors[1][1]}`
     }
});

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
        this.data = data;
    }
    draw() {
        const background = new Image();
        background.onload = () => {
            const cy = Cytoscape({
               container: document.getElementById('fig-people'),
               elements: [...this.data.mss, ...this.data.places, ...this.data.people, ...this.data.edges],
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

            const bottomLayer = cy.cyCanvas({ zIndex: -1 });
            const canvas = bottomLayer.getCanvas();
            const ctx = canvas.getContext('2d');
            cy.on('render cyCanvas.resize', e => {
                bottomLayer.resetTransform(ctx);
                bottomLayer.clear(ctx);
                bottomLayer.setTransform(ctx);
                ctx.globalAlpha = 0.5;
                ctx.rotate((5 * Math.PI) / 180);
                ctx.drawImage(background,5900,-3430,5200,3900);
            });
            cy.$('node.place').ungrabify();
            cy.on('mouseup',this.mouseUp.bind(null,cy));
            
            const legend = document.getElementById('fig-people-legend');
            if(legend) makeLegend(legend);
        };
        background.src = 'img/map-reduced.png';
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

class Fig2 {
    constructor(data) {
        this.places = new Map([
            ['Jammu', {mss: [], width: [], height: []}],
            ['Bikaner', {mss: [], width: [], height: []}],
            ['Madras', {mss: [], width: [], height: []}],
            ['Tanjore', {mss: [], width: [], height: []}]
        ]);
        for(const d of data.mss) {
            const place = d.data.place;
            if(this.places.has(place)) {
                const width = d.data.width*3;
                const height = d.data.height*3;
                const val = this.places.get(place);
                if(width > val.width) val.width = width;
                if(height > val.height) val.height = height;
                val.mss.push({width: width, height: height});
            }
        }
    }
    draw() {
        const par = document.getElementById('fig-size');
        for(const [key, val] of this.places) {
            const figure = document.createElement('figure');
            const container = document.createElement('div');
            container.style.width = `${val.width}px`;
            container.style.height = `${val.height}px`;
            val.mss.sort((a,b) => {return a.width * a.height > b.width * b.height ? -1 : 1;});
            for(const ms of val.mss) {
                const box = document.createElement('div');
                box.className = 'ms';
                box.style.width = `${ms.width}px`;
                box.style.height = `${ms.height}px`;
                container.append(box);
            }
            const caption = document.createElement('figcaption');
            caption.append(key);
            figure.append(container);
            figure.append(caption);
            par.append(figure);
        }
    }
}

const makeLegend = (div) => {
    for(const color of colors) {
        const container = document.createElement('div');
        const symbol = document.createElement('span');
        symbol.style.color = color[1];
        symbol.append('●');
        container.append(symbol);
        container.append(color[0]);
        div.append(container);
    }
};

const startZoomers = () => {
    const makeZoomer = (el,i) => {
        const ratio = i.width/i.height;
        el.style.aspectRatio = ratio;
        if(!el.id) el.id = `zoom-${Date.now()}`;
        i.style.display = 'none';
        const fig = new OpenSeadragon.Viewer({
            id:el.id,
            prefixUrl: 'icons/',
            tileSources: {
                type: 'image',
                url: i.src
            }
        });
    };
    for(const el of document.getElementsByClassName('inline-zoom')) {
        const img = el.querySelector('img');
        if(!img) continue;
        const url = img.src;
        img.onload = makeZoomer(el,img);
    }
};

const docClick = (e) => {
    if(e.target.classList.contains('popup-toggle'))
        startPopup(e);

    else if(e.target.id === 'blackout')
        cancelPopup(e);
};

const startPopup = (e) => {
    const el = e.target.nextElementSibling;
    if(!el || !el.classList.contains('popup-zoom')) return;
    
    const blackout = document.createElement('div');
    blackout.id = 'blackout';
    const popup = document.createElement('div');
    popup.id = 'popup';
    const popupViewer = document.createElement('div');
    popupViewer.id = 'popup-viewer';
   
    popup.appendChild(popupViewer);
    blackout.appendChild(popup);
    document.body.appendChild(blackout);

    const img = el.querySelector('img');
    const viewer = new OpenSeadragon.Viewer({
        id: 'popup-viewer',
        prefixUrl: 'node_modules/openseadragon/build/openseadragon/images/',
        tileSources: {
            type: 'image',
            url: img.src
        }
    });
    const clone = el.cloneNode(true);
    clone.firstChild.remove();
    popup.appendChild(clone);
};

const cancelPopup = (e) => {
    e.target.remove();
};
const Cordier = {
    init: init
};

export { Cordier };
