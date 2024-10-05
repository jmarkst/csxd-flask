
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
    xhr.open('POST', '/upload', true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            document.getElementById('canvas').classList.remove('hide');
            document.getElementById('placeholder').classList.add('hide');
            drawBoxes(response.boxes);
            showDetections(response.boxes);
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

    img.src = URL.createObjectURL(imageInput.files[ 0 ]);

    img.onload = function () {
        // Define maximum canvas size
        const maxCanvasWidth = 500;
        const maxCanvasHeight = 500;

        // Calculate scaling factor to maintain aspect ratio
        const scaleX = maxCanvasWidth / img.width;
        const scaleY = maxCanvasHeight / img.height;
        const scale = Math.min(scaleX, scaleY);  // Use the smallest scale to fit image

        // Adjust canvas size based on scaled image dimensions
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        // Draw the scaled image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Define font size for the labels
        const fontSize = 16;  // Set a fixed font size for readability
        ctx.font = `${ fontSize }px Arial`;

        // Draw each bounding box and add labels for class and confidence
        boxes.forEach(box => {
            if (box.confidence >= 0.7) {
                // Scale bounding box coordinates
                const x1 = box.x1 * scale;
                const y1 = box.y1 * scale;
                const x2 = box.x2 * scale;
                const y2 = box.y2 * scale;

                // Draw the bounding box
                ctx.beginPath();
                ctx.rect(x1, y1, x2 - x1, y2 - y1);
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'red';
                ctx.stroke();
                ctx.closePath();

                // Draw the label with class and confidence
                const label = `${ classes[box.class] } (${ (box.confidence * 100).toFixed(1) }%)`;
                const textWidth = ctx.measureText(label).width;
                const textHeight = fontSize + 4;  // Adjust the text height based on font size

                // Draw label background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(x1, y1 - textHeight, textWidth + 4, textHeight);

                // Draw label text
                ctx.fillStyle = 'white';
                ctx.fillText(label, x1 + 2, y1 - 4);
            }
        });
    };
}

function showDetections (boxes) {
    const rsb = document.getElementById('right-sidebar');
    rsb.innerHTML = ""; // tanggalin lahat

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