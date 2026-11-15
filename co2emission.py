import cv2

VIDEO_PATH = "co2 video.mp4"


# colour frequency logic, adjusted for our actual 10x10 grid counts
def map_co2_intensity(high_intensity_count):
  # Adjusted thresholds based on what the 10x10 grid actually sees:
  if high_intensity_count >= 5:  # 5 or more bright pixels = High Plume
    return {
        "frequency": 587.33,
        "intensity": "High Emission Plume",
    }
  elif high_intensity_count >= 2:  # 2 to 4 bright pixels = Moderate Level
    return {"frequency": 329.63, "intensity": "Moderate Level"}
  else:  # 0 or 1 bright pixel = Baseline / Ocean
    return {"frequency": 130.81, "intensity": "Baseline / Clean Air"}


# Video processing loop using OpenCV
def process_co2_video():
  cap = cv2.VideoCapture(VIDEO_PATH)
  if not cap.isOpened():
    print(f"Error could not find {VIDEO_PATH}")
    return

  frame_count = 0
  print("--- SCANNING TRACK: CARBON DIOXIDE EMISSIONS ---")
  print("Copy the lines below and send them to your teammate on Discord:\n")

  while cap.isOpened():
    success, frame = cap.read()
    if not success:
      break  # End of video

    frame_count += 1

    # Sample every 30th frame (roughly once per second of video)
    if frame_count % 30 == 0:
      small_frame = cv2.resize(frame, (10, 10))

      # Count how many bright pixels exist in this frame
      high_intensity_count = 0

      for row in range(10):
        for col in range(10):
          b_val, g_val, r_val = small_frame[row, col]
          # Check for bright red/orange city lights
          if r_val > 180 and g_val > 120:
            high_intensity_count += 1

      # Get frequency and intensity based on our updated count
      result = map_co2_intensity(high_intensity_count)

      # Print output for Discord
      print(
          f"{result['frequency']},  # Frame {frame_count} Intensity:"
          f" {result['intensity']}"
      )

  cap.release()
  print("\n--- FINISHED SCANNING ---")

process_co2_video()