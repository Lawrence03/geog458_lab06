mapboxgl.accessToken =
    'pk.eyJ1IjoiamFrb2J6aGFvIiwiYSI6ImNpcms2YWsyMzAwMmtmbG5icTFxZ3ZkdncifQ.P9MBej1xacybKcDN_jehvw';
const source =
    '<p style="text-align: left; font-size:10pt">Source: <a href="https://github.com/nytimes/covid-19-data/blob/43d32dde2f87bd4dafbb7d23f5d9e878124018b8/live/us-counties.csv">New York Times</a></p>';
const grades = [100, 1000, 10000, 100000];
const colors = ['rgb(254,240,217)',
    'rgb(253,204,138)',
    'rgb(252,141,89)',
    'rgb(215,48,31)'];
const radii = [2.5, 7.5, 10, 20];
const legend = document.getElementById('legend');
const reset = document.getElementById('reset');
let labels = ['<strong>Cases:</strong>'];
let vbreak = null;
let cases = {};
let numCases = 0;
let numCasesCount = 0;
let numCasesDeaths = 0;
let covidCasesChart = null;
for (let i = 0; i < grades.length; i++) {
    vbreak = grades[i];
    let dot_radius = 2 * radii[i];
    labels.push(
        '<p class="break"><i class="dot" style="background:' + colors[i] + '; width: ' + dot_radius +
        'px; height: ' +
        dot_radius + 'px; "></i> <span class="dot-label" style="top: ' + dot_radius / 2 + 'px;">' + vbreak +
        '</span></p>');
}
legend.innerHTML = labels.join('') + source;
let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    minZoom: 3.5,
    zoom: 3.5,
    center: [-110, 40]
});
async function geojsonFetch() {
    let response;
    response = await fetch('assets/us-covid-2020-counts.json');
    covidCasesJson = await response.json();
    map.on('load', () => {
        map.addSource('covid-cases', {
            type: 'geojson',
            data: 'assets/us-covid-2020-counts.json'
        });
        map.addLayer({
            'id': 'covid-cases-point',
            'type': 'circle',
            'source': 'covid-cases',
            'minzoom': 3.5,
            'paint': {
                'circle-radius': {
                    'property': 'cases',
                    'stops': [
                        [grades[0], radii[0]],
                        [grades[1], radii[1]],
                        [grades[2], radii[2]],
                        [grades[3], radii[3]],
                    ]
                },
                'circle-color': {
                    'property': 'cases',
                    'stops': [
                        [grades[0], colors[0]],
                        [grades[1], colors[1]],
                        [grades[2], colors[2]],
                        [grades[3], colors[3]]
                    ]
                },
                'circle-stroke-color': 'white',
                'circle-stroke-width': 0.8,
                'circle-opacity': 0.6
            }
        },
            'waterway-label'
        );
        map.on('click', 'covid-cases-point', (event) => {
            new mapboxgl.Popup()
                .setLngLat(event.features[0].geometry.coordinates)
                .setHTML(`<strong>${event.features[0].properties.county}, ${event.features[0].properties.state}</strong>
                <br><strong>Cases:</strong> ${event.features[0].properties.cases}
                <br><strong>Deaths:</strong> ${event.features[0].properties.deaths}`)
                .addTo(map);
        });
        cases = calCovidCases(covidCasesJson, map.getBounds());
        numCases = cases[100] + cases[1000] + cases[10000] + cases[100000];
        document.getElementById("covidCases-count").innerHTML = numCases;
        numCasesCount = calCovidCasesCount(covidCasesJson, map.getBounds());
        document.getElementById("covidCasesNum-count").innerHTML = numCasesCount;
        numCasesDeaths = calCovidCasesDeath(covidCasesJson, map.getBounds());
        document.getElementById("covidCasesDeath-count").innerHTML = numCasesDeaths;
        x = Object.keys(cases);
        x.unshift("count")
        y = Object.values(cases);
        y.unshift("#")
        covidCasesChart = c3.generate({
            size: {
                height: 250,
                width: 360
            },
            data: {
                x: 'count',
                columns: [x, y],
                type: 'bar',
                colors: {
                    '#': (d) => {
                        return colors[d["x"]];
                    }
                },
                onclick: function (d) {
                    let floor = parseInt(x[1 + d["x"]]),
                        ceiling = floor + 1;

                    map.setFilter('covid-cases-point',
                        ['all',
                            ['>=', 'count', floor],
                            ['<', 'count', ceiling]
                        ]);
                }
            },
            axis: {
                x: {
                    type: 'category',
                },
                y: { 
                    tick: {
                        values: [10, 100, 1000, 1500]
                    }
                }
            },
            legend: {
                show: false
            },
            bindto: "#covidCases-chart"
        });
    });
    map.on('idle', () => {
        cases = calCovidCases(covidCasesJson, map.getBounds());
        numCases = cases[100] + cases[1000] + cases[10000] + cases[100000];
        document.getElementById("covidCases-count").innerHTML = numCases;
        numCasesCount = calCovidCasesCount(covidCasesJson, map.getBounds());
        document.getElementById("covidCasesNum-count").innerHTML = numCasesCount;
        numCasesDeaths = calCovidCasesDeath(covidCasesJson, map.getBounds());
        document.getElementById("covidCasesDeath-count").innerHTML = numCasesDeaths;
        x = Object.keys(cases);
        x.unshift("count")
        y = Object.values(cases);
        y.unshift("#")
        covidCasesChart.load({
            columns: [x, y]
        });
    });
}
geojsonFetch();
function calCovidCases(currentCases, currentMapBounds) {
    let caseClasses = {
        100: 0,
        1000: 0,
        10000: 0,
        100000: 0
    };
    currentCases.features.forEach(function (d) {
        if (currentMapBounds.contains(d.geometry.coordinates)) {
            if (d.properties.cases < 100) {
                caseClasses[100]++;
            } else if (d.properties.cases < 1000) {
                caseClasses[1000]++;
            } else if (d.properties.cases < 10000) {
                caseClasses[10000]++;
            } else {
                caseClasses[100000]++;
            }
        }
    })
    return caseClasses;
}
function calCovidCasesCount(currentCases, currentMapBounds) {
    let caseCount = 0;
    currentCases.features.forEach(function (d) {
        if (currentMapBounds.contains(d.geometry.coordinates)) {
            caseCount += d.properties.cases;
        }
    })
    return caseCount;
}
function calCovidCasesDeath(currentCases, currentMapBounds) {
    let caseDeath = 0;
    currentCases.features.forEach(function (d) {
        if (currentMapBounds.contains(d.geometry.coordinates)) {
            caseDeath += d.properties.deaths;
        }
    })
    return caseDeath;
}
reset.addEventListener('click', event => {
    map.flyTo({
        zoom: 3.5,
        center: [-110, 40]
    });
    map.setFilter('covid-cases-point', null)
});