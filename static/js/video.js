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
        cache.push(data)
    } catch (error) {
        console.error('Error fetching detections:', error);
    }
}

function drawLeftSidebarCached(boxes) {
    const body = document.getElementById('left-body');
    const count = countDetections(boxes);
    for (let x = 0; x < count.length; x++) {
        if (count[ x ] != 0) {
            console.log(count)
            console.log(cache[x])
            //drawInformation(body, boxes, x, count[ x ], cache[x]);
        }
    }
}

async function cacheUSDAInfo() {
    const veg = [ 747447, 2346407, 2685573 ];
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
            cache += data
            loaded = `<br><small>${ x + 1 } cached</small>`
            loading.innerHTML = description + loaded;
        } catch (error) {
            console.error('Error:', error);
        }
    }
    loading.classList.toggle('hide');
}

const logic = cacheUSDAInfo().then(() => {
    console.log("cached OK")
    setInterval(fetchDetections, 5000)
})