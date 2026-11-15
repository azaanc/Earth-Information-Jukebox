# Earth Information Jukebox

*NASA Space Apps 2026 Hackathon Challenge Submission*

## Overview

Planetary telemetry and global environmental observations are predominantly presented in visual formats. While powerful, this reliance on sight creates a barrier for accessibility—particularly for blind and low-vision users—and limits how the general public can interact with complex Earth science.

The **Earth Information Jukebox** is an audio-visual web application designed to bridge this gap through data sonification. By translating NASA Scientific Visualization Studio (SVS) and Earth Information Center (EIC) datasets into real-time soundscapes, the project blends rigorous scientific data with artistic expression to create an immersive, multi-sensory experience of our changing planet.

---

## Setup and Asset Management

Because large video files are compressed for standard GitHub repository hosting to optimize upload limits, local playback quality can be affected. For the optimal user experience as originally designed, official high-resolution NASA video datasets can be downloaded directly from the links below and placed into the project's "Videos" folder. (Delete the three existing videos and replace them with the videos downloaded from the NASA data sources below, if you want maximum quality) otherwise it is not necessary to do so.

---

## NASA Data Sources and Sonification Profiles

The application features three synchronized musical layers, each mapped to a distinct planetary dataset:

* **Track 1: Carbon Dioxide (CO2) Emissions**
* **Data Source:** [NASA SVS 5121](https://svs.gsfc.nasa.gov/5121/#media_group_312066)
* **Sonic Identity:** A gritty, industrial sawtooth wave that provides a driving, electronic baseline mirroring global emission densities.


* **Track 2: Global Temperature Anomalies (1880–2023)**
* **Data Source:** [NASA SVS 5207](https://svs.gsfc.nasa.gov/5207/#media_group_373191)
* **Sonic Identity:** A pure, sweeping sine wave that forms a continuous, breathing ambient pad shifting smoothly with historical warming and cooling periods.


* **Track 3: Active Wildfires (VIIRS Fire Radiative Power)**
* **Data Source:** [NASA SVS 5113](https://svs.gsfc.nasa.gov/5113/#media_group_373525)
* **Sonic Identity:** A dynamic square synth pluck featuring an envelope filter decay. Because fire events fluctuate naturally, this track provides quiet acoustic rests during calm periods and explosive, high-frequency spikes during major wildfire surges.



---

## Technical Architecture

### Backend Processing (Python & OpenCV)

* Processes high-resolution NASA dataset videos frame by frame.
* Resizes video frames into optimized grids, filters out background space noise using custom color-tone and peak-brightness detection algorithms, and outputs synchronized frequency arrays.
* Utilizes dedicated Python processing scripts for each track to accommodate individual frame-resizing rules and grid-scanning logic efficiently.
* Used AI for doing the math on frequency conversion, frame-resizing and grid-scanning, though the logic was written by me.

### Frontend Audio Engine (Tone.js & JavaScript)

* Manages real-time web audio synthesis, dynamically matching the backend frequency sequences.
* Synchronizes video playback seamlessly with the active audio scheduler.
* Used AI ( Claude Opus 5.5 and Gemini 4 Argon ) for the frontend.

### UI/UX & Accessibility (HTML5, CSS3 / Glassmorphism)

* Styled with a futuristic NASA dark-mode aesthetic featuring deep space blacks (`#0b0b14`), cyber-blue borders (`#00f0ff`), and warning amber highlights.
* Fully optimized for accessibility (A11y) to support diverse users through high-contrast design, keyboard navigation, descriptive ARIA labels, and live telemetry text readouts.
* * Used AI ( Claude Opus 5.5 and Gemini 4 Argon ) for the UI/UX design.

---

## Deployment Note

For evaluation and hackathon judging, comprehensive screen-recording demonstrations of the application running on live data have been provided.

While a live deployment is available via Vercel, free-tier server cold starts cause the video player to experience significant lag. Because this project was developed during a 48-hour hackathon, we utilized standard free-tier hosting, which unfortunately impacts media streaming performance.

For the best evaluation experience, we recommend either watching the recorded demonstration or running the application locally using a live server:

Project Demonstration: link

Local Testing: Highly recommended for zero-lag interaction.

Vercel Deployment: https://earthinfojukebox.vercel.app/ (**Not recommended**: May experience latency on video due to serverless cold starts.)
