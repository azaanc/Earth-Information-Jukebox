import cv2

VIDEO_PATH = "wildfires.mp4"


def map_fire_intensity(fire_pixel_count, peak_brightness):
  # Re-calibrated thresholds for a 10x10 grid
  if peak_brightness > 220 and fire_pixel_count > 61:
    return {"frequency": 1046.50, "intensity": "Extreme Wildfire Surge (C6)"}
  elif peak_brightness > 150:
    return {"frequency": 783.99, "intensity": "High Fire Activity (G5)"}
  elif peak_brightness > 80:
    return {"frequency": 523.25, "intensity": "Moderate Burn Zones (C5)"}
  elif peak_brightness > 30:
    return {"frequency": 329.63, "intensity": "Low Background Blazes (E4)"}
  else:
    return {"frequency": 164.81, "intensity": "Calm / No Active Fires (E3)"}


def process_fire_video():
  cap = cv2.VideoCapture(VIDEO_PATH)
  if not cap.isOpened():
    print(
        f"Error: Could not open '{VIDEO_PATH}'. Make sure it's in your project"
        " folder!"
    )
    return

  frame_count = 0
  print("--- SCANNING TRACK: VIIRS FIRE (RE-CALIBRATED) ---")
  print("Copy the lines below and send them to your teammate on Discord:\n")

  while cap.isOpened():
    success, frame = cap.read()
    if not success:
      break

    frame_count += 1

    if frame_count % 30 == 0:
      small_frame = cv2.resize(frame, (10, 10))
      fire_pixel_count = 0
      peak_brightness = 0

      for row in range(10):
        for col in range(10):
          b_val, g_val, r_val = small_frame[row, col]

          # Stricter threshold so background noise doesn't count as fire
          if r_val > 50 or g_val > 50:
            fire_pixel_count += 1
            pixel_brightness = max(r_val, g_val)
            if pixel_brightness > peak_brightness:
              peak_brightness = pixel_brightness

      result = map_fire_intensity(fire_pixel_count, peak_brightness)

      print(
          f"{result['frequency']},  # Frame {frame_count} (Pixels:"
          f" {fire_pixel_count}, Peak: {peak_brightness}) Intensity:"
          f" {result['intensity']}"
      )

  cap.release()
  print("\n--- FINISHED SCANNING ---")


process_fire_video()