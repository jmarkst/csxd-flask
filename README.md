This is the repository of the source code for the research project entitled "TBA" by CSXD, a group of four Fourth Year Computer Science students of Adamson University, Manila.

**CSXD Group Members**
* ALVARO, Maki Andrei
* LACSON, David Isaac
* PASTRO, Josh Vincent
* SANTOS, Hose Marco

**TECHNICAL ADVISER**
* Mr. Jerome Alvez


## Running the code

To run the source code, ensure that you have Python installed, along with the following libraries:
* Flask - backend framework
* Ultralytics - computer vision library for YOLOv8
* Pillow - image manipulation
* dotenv - environment variables

This web app uses the API of the USDA FoodCentral to retrieve nutritional information. An API key is needed for it to work. You can avail your API key at [their website](https://fdc.nal.usda.gov/api-key-signup.html).
After availing an API key, create an `.env` file at the root of the project (i.e., on the same location as the `main.py`), and put your key:
```
API_KEY=<your-api-key>
```

Run the code by navigating at the `main.py` and type `python main.py` (or similar) at the terminal. Depending on your machine, this could take a while.

## Navigating the web app

Once the web app is loaded, you can upload an image by clicking the `Select file` first before clicking the `Upload image` button. Processing depends on the machine, but it could take at worst two minutes in initial run. It is advisable to run a dummy run to initialize the components for better speed.

There are two sidebars on left and right. The left sidebar shows the information of the detected vegetables, while the right sidebar shows all the detections and its location and confidence (in percentage). You can zoom and pan the image by moving the mouse and using the mouse wheel to zoom.
