var cacheV = [];
var confidence = 0.7;
var toShow = [true, true, true]
const classes = [ 'broccoli', 'cabbage', 'cauliflower' ];

function showDetections (boxes) {
    const rsb = document.getElementById('right-sidebar');
    rsb.innerHTML = ""

    boxes.forEach(box => {
        if (box.confidence >= confidence && toShow[box.class]) {
            const container = document.createElement('div');
            container.classList.add('margined', 'text-gray');
            const card = document.createElement('div');
            card.classList.add('card');
            const cardhead = document.createElement('div');
            cardhead.classList.add('card-header');
            const cardbody = document.createElement('div');
            cardbody.classList.add('card-body');
            const classpill = document.createElement('p');
            classpill.classList.add('pill');
            classpill.innerText = classes[ box.class ];
            const h6 = document.createElement('h6');
            h6.innerText = "INFORMATION"
            const coordscont = document.createElement('div');
            coordscont.classList.add('row', 'full');
            const coordslabel = document.createElement('div');
            coordslabel.classList.add('col', 'full', 'headtext');
            coordslabel.innerText = "COORDINATES";
            const coords = document.createElement('div');
            coords.classList.add('col', 'full');
            coords.innerText = `(${ box.x1 }, ${ box.x2 }, ${ box.y1 }, ${ box.y2})`;
            const confcont = document.createElement('div');
            confcont.classList.add('row', 'full');
            const conflabel = document.createElement('div');
            conflabel.classList.add('col', 'full', 'headtext');
            conflabel.innerText = "CONFIDENCE";
            const conf = document.createElement('div');
            conf.classList.add('col', 'full');
            conf.innerText = `${ (box.confidence * 100).toFixed(2) }%`;

            // append children
            coordscont.appendChild(coordslabel);
            coordscont.appendChild(coords);
            confcont.appendChild(conflabel);
            confcont.appendChild(conf);
            cardbody.appendChild(coordscont);
            cardbody.appendChild(confcont);
            cardhead.appendChild(classpill);
            card.appendChild(cardhead);
            card.appendChild(cardbody);
            container.appendChild(card);
            rsb.appendChild(container);
        }
    });
}

async function fetchDetectionsV() {
    try {
        console.log('Fetching detections...');
        const response = await fetch('/detections');
        const data = await response.json();
        console.log('Detections:', data);  // Debug: Log the received detections

        // Display detection information
        showDetections(data)
        drawLeftSidebarCachedV(data)
        //cacheV.push(data)
    } catch (error) {
        console.error('Error fetching detections:', error);
    }
}

function drawLeftSidebarCachedV(boxes) {
    const body = document.getElementById('left-body');
    body.innerHTML = "";
    const count = countDetections(boxes);
    for (let x = 0; x < count.length; x++) {
        if (count[ x ] != 0) {
            console.log(count)
            console.log(cacheV[x])
            drawInformationUsingCachedV(body, boxes, x)
        }
    }
}

function countDetections (boxes) {
    var count = [0,0,0];
    
    boxes.forEach(box => {
        if (box.confidence >= confidence && toShow[box.class]) {
            count[ box.class ]++;
        }
    });

    counted = count;

    return count;
}

function drawInformationUsingCachedV(body, boxes, veget) {
    const classes = ["broccoli", "cabbage", "cauliflower"]
    const veg = [ 747447, 2346407, 2685573 ];
    const nuts = [
        [ 1, 5, 10, 12, 24, 25, 26, 28, 29, 30, 35, 40, 42, 50 ],
        [1, 5, 9, 11, 12, 13, 15, 16, 17, 22, 23],
        [1, 5, 9, 12, 13, 14, 16, 17, 18]
    ];
    console.log(cacheV[1].foodNutrients)
    const card = document.createElement('div');
    card.classList.add('card');
    const header = document.createElement('div');
    header.classList.add('card-header');
    const cardbody = document.createElement('div');
    cardbody.classList.add('card-body');

    const vegetable = document.createElement('p');
    vegetable.classList.add('pill');
    vegetable.innerHTML = `${classes[veget]}`; // 24 detections

    header.appendChild(vegetable);
    card.appendChild(header);

    const link = cacheV[veget].fdcId;
    const disclaimer = `<small><b>Data from USDA FoodCentral.</b><br>For a complete nutritional information,<b><a href='https://fdc.nal.usda.gov/fdc-app.html#/food-details/${link}/nutrients' target='_blank' rel='noopener noreferrer'>click here</a></b></small>`; // description
    const fooditem = `<b>${cacheV[veget].description}</b>`
    cardbody.innerHTML = disclaimer + "<br>" + fooditem;
    const h6 = document.createElement('h6');
    h6.innerHTML = "NUTRITIONAL DATA";
    cardbody.appendChild(h6);

    for (var x = 0; x < nuts[veget].length; x++) {
        // Check if the nutrient exists in the response
        const nutrientIndex = nuts[ veget ][ x ];
        if (!cacheV[veget].foodNutrients[ nutrientIndex ]) {
            console.error(`Nutrient data missing at index ${ nutrientIndex }`);
            continue;
        }

        const row = document.createElement('div');
        row.classList.add('row', 'full');

        const headtext = document.createElement('div');
        headtext.classList.add('col', 'full', 'headtext');
        headtext.innerHTML = `${ cacheV[veget].foodNutrients[ nutrientIndex ].nutrient.name }`;
        row.appendChild(headtext);

        const value = document.createElement('div');
        value.classList.add('col', 'full');
        value.innerHTML = `${ cacheV[veget].foodNutrients[ nutrientIndex ].amount } ${ cacheV[veget].foodNutrients[ nutrientIndex ].nutrient.unitName }`;
        row.appendChild(value);

        cardbody.appendChild(row);
    }

    card.appendChild(cardbody);

    body.append(card);
}

async function cacheUSDAInfoV() {
    const veg = [ 747447, 2346407, 2685573 ];
    var usdaStart = performance.now()
    const loading = document.getElementById('loading');
    loading.classList.toggle('hide');
    const description = "Caching information from USDA FoodCentral..."
    var loaded = "";
    for (let x = 0; x < 3; x++) {
        try {
            // Await the fetch request to make it "synchronous"
            const response = await fetch(`/nutrition?vegetable=${ veg[ x ] }`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();  // Await the JSON parsing as well
            console.log(data)
            cacheV[x] = data
            loaded = `<br><small>${ x + 1 } cached</small>`
            loading.innerHTML = description + loaded;
        } catch (error) {
            console.error('Error:', error);
        }
    }
    loading.classList.toggle('hide');
    console.log(cacheV)
    var usdaEndTime = performance.now()
    var usdaTime = usdaEndTime - usdaStart
    console.log("USDA API caching time: " + usdaTime + "ms")
}

const logic = cacheUSDAInfoV().then(() => {
    console.log("cached OK")
    setInterval(fetchDetectionsV, 1000)
})