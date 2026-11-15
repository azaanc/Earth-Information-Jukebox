import cv2

VIDEO_PATH = "global temperature anomalies.mp4"

# Temperature color mapping logic with Tier 1 extreme-spike refinement (used ai, im not good with the math on this)
def map_temperature_anomaly(frame):
  # Shrink frame to a 10x10 grid to sample global surface temperatures
  small_frame = cv2.resize(frame, (10, 10))

  red_count = 0
  blue_count = 0

  # Scan every pixel in our grid
  for row in range(10):
    for col in range(10):
      b_val, g_val, r_val = small_frame[row, col]

      # If the pixel is strongly Red/Orange (Warming anomaly)
      if r_val > 150 and b_val < 100:
        red_count += 1
      # If the pixel is strongly Blue (Cooling anomaly / historical baseline)
      elif b_val > 150 and r_val < 100:
        blue_count += 1

  # Classify with Tier 1 extreme threshold so recent years have musical variety
  if red_count > 40:  # Absolute extreme global warming (e.g., 2023 peak)
    return {"frequency": 698.46, "intensity": "Extreme Warming Spike"}
  elif red_count > 25:  # Heavy warming years
    return {"frequency": 659.25, "intensity": "High Temperature Spike (Warming)"}
  elif red_count > 10:  # Moderate warming trend
    return {"frequency": 440.00, "intensity": "Moderate Warming Trend"}
  elif blue_count > 20:  # Cooler historical era
    return {"frequency": 220.00, "intensity": "Cooler / Historical Era"}
  else:
    return {"frequency": 329.63, "intensity": "Normal Baseline Period"}


def process_temperature_video():
  cap = cv2.VideoCapture(VIDEO_PATH)
  if not cap.isOpened():
    print(
        f"Error: Could not open '{VIDEO_PATH}'. Make sure it's in your project"
        " folder!"
    )
    return

  frame_count = 0
  print("--- SCANNING TRACK: GLOBAL TEMPERATURE ANOMALIES (TIER 1 TUNED) ---")
  print("Copy the lines below and send them to your teammate on Discord:\n")

  while cap.isOpened():
    success, frame = cap.read()
    if not success:
      break  # end of video

    frame_count += 1

    # Sample every 30th frame (roughly once per second of video)
    if frame_count % 30 == 0:
      result = map_temperature_anomaly(frame)

      # values for tone.js
      print(
          f"{result['frequency']},  # Frame {frame_count} Status:"
          f" {result['intensity']}"
      )

  cap.release()
  print("\n--- FINISHED SCANNING ---")

process_temperature_video()