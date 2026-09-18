import sys
from PIL import Image, ImageDraw

def process_circle(input_path, output_path):
    print(f"Applying circular mask to {input_path}...")
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        
        # Create a circular mask
        mask = Image.new('L', img.size, 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, width, height), fill=255)
        
        # Apply mask
        img.putalpha(mask)
        img.save(output_path, "PNG")
        print(f"Successfully saved circular transparent image to {output_path}")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python crop_circle.py <input> <output>")
        sys.exit(1)
    process_circle(sys.argv[1], sys.argv[2])
