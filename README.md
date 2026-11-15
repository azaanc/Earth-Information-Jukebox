# Earth-Information-Jukebox



# IMPORTANT NOTE:
If you want to have a look at the website, I have not deployed it. For submitting the website for the hackathon, I straight up sent a recording of how it works to the judges. But if you want to view it for yourself:
You can clone this repository and check it out ( But **warning** the videos will lag and not look immersive because I had to compress the MP4 files to upload them on github )
If you want the actual perfect experience ( as designed and meant to be ) then you can see below the links to download the NASA open source data video files. Download them and just put them in place of the three existing videos in the "Videos" folder.

# NASA Open Source Data
## Track 1 ( CO2 Emission by humans ):
- Data source: https://svs.gsfc.nasa.gov/5121/#media_group_312066
- Sonic Identity: A gritty, industrial Sawtooth wave that provides a driving, electronic baseline mirroring global emission densities.
  
## Track 2 ( Global Temperature Anomalies from 1880 to 2023 ):
- Data source: https://svs.gsfc.nasa.gov/5207/#media_group_373191
- Sonic Identity: A pure, sweeping Sine wave that creates a continuous, breathing ambient pad shifting smoothly with historical warming and cooling shifts.
  
## Track 3 ( Active wildfires As Observed by VIIRS, 2024-Present ):
- Data source: https://svs.gsfc.nasa.gov/5113/#media_group_373525




# Tech Stack and Architecture

## Backend Processing ( Python & OpenCV )
- Processes high-resolution NASA dataset videos frame-by-frame.
- Resizes frames into optimized grids, filters out background space/noise using custom color-tone and peak-brightness detection algorithms, and outputs synchronized frequency arrays.
- These synchronized frequency values are put into an array used for generating sound.
- We kept different python files for each track because each track had different frame resizing rules and grid scanning logic. So keeping different files was the most efficient way to solve the problem.

## Frontend Audio Engine (Tone.js & JavaScript):

- Drives real-time web audio synthesis matching the backend frequency sequences.
- Synchronizes video playback seamlessly with the active audio scheduler.

## UI/UX & Accessibility (HTML5, CSS3 / Glassmorphism):

Built with a futuristic NASA dark-mode aesthetic (#0b0b14 space black, cyber-blue #00f0ff borders, and warning ambers).

Fully optimized for accessibility (A11y), supporting high-contrast modes, keyboard navigation, ARIA labels, and live telemetry text readouts.
