var cache = [];

async function fetchDetections() {
    try {
        console.log('Fetching detections...');
        const response = await fetch('/detections');
        const data = await response.json();
        console.log('Detections:', data);  // Debug: Log the received detections

        // Display detection information
        showDetections(data)
        drawLeftSidebarCached(data)
        //cache.push(data)
    } catch (error) {
        console.error('Error fetching detections:', error);
    }
}

function drawLeftSidebarCached(boxes) {
    const body = document.getElementById('left-body');
    body.innerHTML = "";
    const count = countDetections(boxes);
    for (let x = 0; x < count.length; x++) {
        if (count[ x ] != 0) {
            console.log(count)
            console.log(cache[x])
            drawInformationUsingCached(body, boxes, x)
        }
    }
}

function drawInformationUsingCached(body, boxes, veget) {
    const classes = ["broccoli", "cabbage", "cauliflower"]
    const veg = [ 747447, 2346407, 2685573 ];
    const nuts = [
        [ 1, 5, 10, 12, 24, 25, 26, 28, 29, 30, 35, 40, 42, 50 ],
        [1, 5, 9, 11, 12, 13, 15, 16, 17, 22, 23],
        [1, 5, 9, 12, 13, 14, 16, 17, 18]
    ];
    console.log(cache[1].foodNutrients)
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

    const link = cache[veget].fdcId;
    const disclaimer = `<small><b>Data from USDA FoodCentral.</b><br>For a complete nutritional information,<b><a href='https://fdc.nal.usda.gov/fdc-app.html#/food-details/${link}/nutrients' target='_blank' rel='noopener noreferrer'>click here</a></b></small>`; // description
    const fooditem = `<b>${cache[veget].description}</b>`
    cardbody.innerHTML = disclaimer + "<br>" + fooditem;
    const h6 = document.createElement('h6');
    h6.innerHTML = "NUTRITIONAL DATA";
    cardbody.appendChild(h6);

    for (var x = 0; x < nuts[veget].length; x++) {
        // Check if the nutrient exists in the response
        const nutrientIndex = nuts[ veget ][ x ];
        if (!cache[veget].foodNutrients[ nutrientIndex ]) {
            console.error(`Nutrient data missing at index ${ nutrientIndex }`);
            continue;
        }

        const row = document.createElement('div');
        row.classList.add('row', 'full');

        const headtext = document.createElement('div');
        headtext.classList.add('col', 'full', 'headtext');
        headtext.innerHTML = `${ cache[veget].foodNutrients[ nutrientIndex ].nutrient.name }`;
        row.appendChild(headtext);

        const value = document.createElement('div');
        value.classList.add('col', 'full');
        value.innerHTML = `${ cache[veget].foodNutrients[ nutrientIndex ].amount } ${ cache[veget].foodNutrients[ nutrientIndex ].nutrient.unitName }`;
        row.appendChild(value);

        cardbody.appendChild(row);
    }

    card.appendChild(cardbody);

    body.append(card);
}

async function cacheUSDAInfo() {
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
            cache[x] = data
            loaded = `<br><small>${ x + 1 } cached</small>`
            loading.innerHTML = description + loaded;
        } catch (error) {
            console.error('Error:', error);
        }
    }
    loading.classList.toggle('hide');
    console.log(cache)
    var usdaEndTime = performance.now()
    var usdaTime = usdaEndTime - usdaStart
    console.log("USDA API caching time: " + usdaTime + "ms")
}

const logic = cacheUSDAInfo().then(() => {
    console.log("cached OK")
    setInterval(fetchDetections, 1000)
})