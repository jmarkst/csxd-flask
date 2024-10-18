
const classes = [ 'broccoli', 'cabbage', 'cauliflower' ];
document.getElementById('submitBtn').addEventListener('click', function () {
    const imageInput = document.getElementById('imageUpload');
    if (imageInput.files.length === 0) {
        alert('Please upload an image');
        return;
    }

    const file = imageInput.files[ 0 ];
    console.log(imageInput.files);
    const formData = new FormData();
    formData.append('image', file);

    const xhr = new XMLHttpRequest();
    var startTime = performance.now();
    xhr.open('POST', '/upload', true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            var endTime = performance.now(); 
            var response = JSON.parse(xhr.responseText);
            const inferenceTime = response.inferenceTime;
            response = response.results;
            //console.log(response)
            document.getElementById('canvas').classList.remove('hide');
            document.getElementById('placeholder').classList.add('hide');
            var renderingTimeStart = performance.now(); 
            drawBoxes(response);
            showDetections(response);
            var apiCallStart = performance.now(); 
            drawLeftSidebar(response);
            var apiCallEnd = performance.now(); 
            var renderingTimeEnd = performance.now();

            // STATISTICS
            var roundTripTime = endTime - startTime;
            var renderTime = renderingTimeEnd - renderingTimeStart;
            var apiCallTime = apiCallEnd - apiCallStart;
            console.log("Inference Time: " + inferenceTime + "ms");
            console.log("Roundtrip Time: " + roundTripTime + "ms");
            console.log("Rendering Time: " + renderTime + "ms");
            console.log("API Response Time: " + apiCallTime + "ms");

        } else {
            console.error('Error uploading image');
        }
    };

    // Show the loading indicator when the request starts
    xhr.onloadstart = function () {
        console.log("loading")
        document.getElementById('loading').classList.toggle('hide');
    };

    // Hide the loading indicator when the request ends
    xhr.onloadend = function () {
        document.getElementById('loading').classList.toggle('hide');
    };
    xhr.send(formData);
});

function drawBoxes (boxes) {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const imageInput = document.getElementById('imageUpload');
    let scaleFactor = 1; // Initial zoom scale
    let offsetX = 0; // Initial pan offsets
    let offsetY = 0;
    let isPanning = false;
    let startX = 0;
    let startY = 0;

    img.src = URL.createObjectURL(imageInput.files[ 0 ]);

    img.onload = function () {
        const maxCanvasWidth = window.innerWidth;
        const maxCanvasHeight = window.innerHeight;

        // Calculate scaling factor to maintain aspect ratio
        const scaleX = maxCanvasWidth / img.width;
        const scaleY = maxCanvasHeight / img.height;
        const initialScale = Math.min(scaleX, scaleY); // Use the smallest scale to fit image

        // Set the initial canvas size (this will remain fixed after the first draw)
        const scaledWidth = img.width * initialScale;
        const scaledHeight = img.height * initialScale;
        canvas.width = maxCanvasWidth;
        canvas.height = maxCanvasHeight;

        // Function to draw the image and boxes, applying zoom and pan
        function draw () {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
            ctx.save(); // Save the context state

            // Apply scaling and translation for zooming and panning
            ctx.translate(offsetX, offsetY);
            ctx.scale(scaleFactor, scaleFactor);

            // Draw the scaled image within the fixed viewport
            ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

            // Define font size for the labels
            const fontSize = 28; // Fixed font size for readability
            ctx.font = `${ fontSize }px Arial`;

            // Draw bounding boxes and labels
            boxes.forEach(box => {
                if (box.confidence >= 0.7) {
                    const x1 = box.x1 * initialScale;
                    const y1 = box.y1 * initialScale;
                    const x2 = box.x2 * initialScale;
                    const y2 = box.y2 * initialScale;

                    // Draw the bounding box
                    ctx.beginPath();
                    ctx.rect(x1, y1, x2 - x1, y2 - y1);
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = 'red';
                    ctx.stroke();
                    ctx.closePath();

                    // Draw the label with class and confidence
                    const label = `${ classes[ box.class ] } (${ (box.confidence * 100).toFixed(1) }%)`;
                    const textWidth = ctx.measureText(label).width;
                    const textHeight = fontSize + 4;

                    // Draw label background
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fillRect(x1, y1 - textHeight, textWidth + 4, textHeight);

                    // Draw label text
                    ctx.fillStyle = 'white';
                    ctx.fillText(label, x1 + 2, y1 - 4);
                }
            });

            ctx.restore(); // Restore context state
        }

        // Zoom handling
        canvas.addEventListener('wheel', function (e) {
            e.preventDefault();
            const zoomFactor = 1.1;
            if (e.deltaY < 0) {
                scaleFactor *= zoomFactor; // Zoom in
            } else {
                scaleFactor /= zoomFactor; // Zoom out
            }
            draw(); // Redraw the canvas with the new scale
        });

        // Panning handling
        canvas.addEventListener('mousedown', function (e) {
            isPanning = true;
            startX = e.clientX - offsetX;
            startY = e.clientY - offsetY;
        });

        canvas.addEventListener('mousemove', function (e) {
            if (isPanning) {
                offsetX = e.clientX - startX;
                offsetY = e.clientY - startY;
                draw(); // Redraw the canvas with the new offset
            }
        });

        canvas.addEventListener('mouseup', function () {
            isPanning = false;
        });

        canvas.addEventListener('mouseleave', function () {
            isPanning = false;
        });

        // Initial draw of the image and boxes
        draw();
    };
}



function showDetections (boxes) {
    const rsb = document.getElementById('right-sidebar');
    rsb.innerHTML = ""

    boxes.forEach(box => {
        if (box.confidence >= 0.7) {
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
            conf.innerText = `${ (box.confidence * 100).toFixed(1) }%`;

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

function getVegetableData (vegetable) {

    // Create a new XMLHttpRequest object
    const xhr = new XMLHttpRequest();

    // Open the GET request and pass the vegetable as a query parameter
    xhr.open("GET", `/nutrition?vegetable=${ vegetable }`, true);
    var response;

    // Define what happens when the server responds
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            response = JSON.parse(xhr.responseText);
            return response;
        }
    };

    // Send the request (no body needed for GET)
    xhr.send();

}

function countDetections (boxes) {
    var count = [0,0,0];
    
    boxes.forEach(box => {
        if (box.confidence >= 0.7) {
            count[ box.class ]++;
        }
    });

    return count;
}

async function drawLeftSidebar (boxes) {
    const body = document.getElementById('left-body');
    body.innerHTML = "";
    const count = countDetections(boxes);
    const veg = [ 747447, 2346407, 2685573 ];

    const loading = document.getElementById('loading');
    loading.classList.toggle('hide');
    const description = "Getting information from USDA FoodCentral..."
    var loaded = "";

    loading.innerHTML = description;

    for (let x = 0; x < count.length; x++) {
        if (count[ x ] != 0) {
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
                drawInformation(body, boxes, x, count[ x ], data);
                loaded = `<br><small>${ x + 1 } loaded</small>`
                loading.innerHTML = description + loaded;
            } catch (error) {
                console.error('Error:', error);
            }
        }
    }

    loading.innerHTML = "Please wait"
    loading.classList.toggle('hide');
}


function drawInformation (body, boxes, veget, count, response) {
    //console.log(response);
    const nuts = [
        [ 1, 5, 10, 12, 24, 25, 26, 28, 29, 30, 35, 40, 42, 50 ],
        [1, 5, 9, 11, 12, 13, 15, 16, 17, 22, 23],
        [1, 5, 9, 12, 13, 14, 16, 17, 18]
    ];
    //console.log(nuts[veget][2]);
    const card = document.createElement('div');
    card.classList.add('card');
    const header = document.createElement('div');
    header.classList.add('card-header');
    const cardbody = document.createElement('div');
    cardbody.classList.add('card-body');

    const vegetable = document.createElement('p');
    vegetable.classList.add('pill');
    vegetable.innerHTML = `${classes[veget]} (${count})`; // 24 detections

    header.appendChild(vegetable);
    card.appendChild(header);

    const link = response.fdcId;
    const disclaimer = `<small><b>Data from USDA FoodCentral.</b><br>For a complete nutritional information,<b><a href='https://fdc.nal.usda.gov/fdc-app.html#/food-details/${link}/nutrients' target='_blank' rel='noopener noreferrer'>click here</a></b></small>`; // description
    const fooditem = `<h6>${response.description}</h6>`
    cardbody.innerHTML = disclaimer + "<br>" + fooditem;
    const h6 = document.createElement('h6');
    h6.innerHTML = "NUTRITIONAL DATA";
    cardbody.appendChild(h6);

    console.log(veget)
    console.log(nuts[veget])
    for (var x = 0; x < nuts[veget].length; x++) {
        // Check if the nutrient exists in the response
        const nutrientIndex = nuts[ veget ][ x ];
        if (!response.foodNutrients[ nutrientIndex ]) {
            console.error(`Nutrient data missing at index ${ nutrientIndex }`);
            continue;
        }

        const row = document.createElement('div');
        row.classList.add('row', 'full');

        const headtext = document.createElement('div');
        headtext.classList.add('col', 'full', 'headtext');
        headtext.innerHTML = `${ response.foodNutrients[ nutrientIndex ].nutrient.name }`;
        row.appendChild(headtext);

        const value = document.createElement('div');
        value.classList.add('col', 'full');
        value.innerHTML = `${ response.foodNutrients[ nutrientIndex ].amount } ${ response.foodNutrients[ nutrientIndex ].nutrient.unitName }`;
        row.appendChild(value);

        cardbody.appendChild(row);
    }

    card.appendChild(cardbody);

    body.append(card);

}